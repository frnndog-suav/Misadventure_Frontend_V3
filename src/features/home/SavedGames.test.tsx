import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import App from '../../App'
import { internalErrorFixture } from '../../mocks/fixtures'
import { handlers } from '../../mocks/handlers'
import { partiesFixture, partyNotFoundFixture } from '../../mocks/partyFixtures'
import type { PartySummary } from '../../api/parties'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  // fuso fixo: 21:30Z → 18:30 em São Paulo (exemplo do REQ-14)
  vi.stubEnv('TZ', 'America/Sao_Paulo')
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => server.resetHandlers())
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
})

function renderHome(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <App />
        <Routes>
          <Route path="*" element={null} />
          <Route path="/novo" element={<p>tela novo</p>} />
          <Route path="/grupo/:partyId" element={<GroupProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Sonda do destino (as telas de grupo são da T-19). */
function GroupProbe() {
  return <p>tela grupo</p>
}

const section = () => screen.getByRole('region', { name: 'Seus jogos' })
const gamesStatus = () => within(section()).getByRole('status')

const twoParties: PartySummary[] = [
  {
    id: 'party-b',
    name: 'Bando B',
    status: 'inSession',
    characterNames: ['Rui', 'Ana'],
    createdAt: '2026-11-10T10:00:00.000Z',
    savedAt: '2026-11-13T12:05:00.000Z',
  },
  partiesFixture[0]!,
]

describe('REQ-14: menu inicial com os jogos salvos', () => {
  it('REQ-14: mostra o link "Novo jogo" para /novo e a seção "Seus jogos" com status próprio', async () => {
    renderHome()
    expect(screen.getByRole('link', { name: 'Novo jogo' })).toHaveAttribute(
      'href',
      '/novo',
    )
    expect(gamesStatus()).toBeInTheDocument()
    await screen.findByText('Os Teimosos')
  })

  it('REQ-14: com a consulta em andamento, mostra "Carregando jogos…"', async () => {
    renderHome()
    expect(gamesStatus()).toHaveTextContent('Carregando jogos…')
    await screen.findByText('Os Teimosos')
  })

  it('REQ-14: cada save mostra nome, personagens, situação, data e os botões, na ordem recebida', async () => {
    server.use(http.get('*/parties', () => HttpResponse.json(twoParties)))
    renderHome()
    const items = await within(section()).findAllByRole('listitem')
    expect(items).toHaveLength(2)

    const [b, a] = items as [HTMLElement, HTMLElement]
    expect(b).toHaveTextContent('Bando B')
    expect(b).toHaveTextContent('Rui, Ana')
    expect(b).toHaveTextContent('Em sessão')
    expect(b).toHaveTextContent('Salvo em 13/11/2026 09:05')

    expect(a).toHaveTextContent('Os Teimosos')
    expect(a).toHaveTextContent('Lia')
    expect(a).toHaveTextContent('Pausado')
    expect(a).toHaveTextContent('Salvo em 14/11/2026 18:30')
    expect(
      within(a).getByRole('button', { name: 'Continuar' }),
    ).toBeInTheDocument()
    expect(
      within(a).getByRole('button', { name: 'Abandonar' }),
    ).toBeInTheDocument()
    expect(gamesStatus()).toHaveTextContent('')
  })

  it('REQ-14: com a lista vazia, mostra "Nenhum jogo salvo."', async () => {
    server.use(http.get('*/parties', () => HttpResponse.json([])))
    renderHome()
    expect(
      await within(section()).findByText('Nenhum jogo salvo.'),
    ).toBeVisible()
  })

  it('REQ-14: "Continuar" vai para /grupo/:partyId', async () => {
    renderHome()
    const item = (await within(section()).findAllByRole('listitem'))[0]!
    fireEvent.click(within(item).getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('tela grupo')).toBeInTheDocument()
  })

  it('REQ-14: com erro §1.4, a área de status mostra a message', async () => {
    server.use(
      http.get('*/parties', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderHome()
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent(
        internalErrorFixture.error.message,
      ),
    )
  })

  it('REQ-14: com falha de rede, mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/parties', () => HttpResponse.error()))
    renderHome()
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-14: com resposta fora do contrato, mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/parties', () => HttpResponse.json([{ id: 1 }])))
    renderHome()
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

async function openDialog(): Promise<HTMLElement> {
  const item = (await within(section()).findAllByRole('listitem'))[0]!
  fireEvent.click(within(item).getByRole('button', { name: 'Abandonar' }))
  return screen.getByRole('dialog')
}

describe('REQ-17: abandonar a partida', () => {
  it('REQ-17: "Abandonar" abre o diálogo modal com título, texto e foco em "Cancelar"', async () => {
    renderHome()
    const dialog = await openDialog()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Abandonar “Os Teimosos”?')
    expect(dialog).toHaveTextContent(
      'O save será apagado para sempre. Não dá para desfazer.',
    )
    expect(
      within(dialog).getByRole('button', { name: 'Abandonar' }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()
  })

  it('REQ-17: "Cancelar" fecha sem enviar nada e devolve o foco ao "Abandonar" do save', async () => {
    const deleted = vi.fn()
    server.use(
      http.delete('*/parties/:partyId', () => {
        deleted()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderHome()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleted).not.toHaveBeenCalled()
    const item = within(section()).getAllByRole('listitem')[0]!
    expect(
      within(item).getByRole('button', { name: 'Abandonar' }),
    ).toHaveFocus()
  })

  it('REQ-17: Esc fecha sem enviar nada e devolve o foco', async () => {
    const deleted = vi.fn()
    server.use(
      http.delete('*/parties/:partyId', () => {
        deleted()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderHome()
    await openDialog()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleted).not.toHaveBeenCalled()
    const item = within(section()).getAllByRole('listitem')[0]!
    expect(
      within(item).getByRole('button', { name: 'Abandonar' }),
    ).toHaveFocus()
  })

  it('REQ-17: confirmar envia DELETE; com 204 fecha, consulta a lista de novo e mostra "Grupo abandonado."', async () => {
    const deletedIds: unknown[] = []
    let listCalls = 0
    server.use(
      http.get('*/parties', () => {
        listCalls += 1
        return HttpResponse.json(partiesFixture)
      }),
      http.delete('*/parties/:partyId', ({ params }) => {
        deletedIds.push(params.partyId)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderHome()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abandonar' }))
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent('Grupo abandonado.'),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deletedIds).toEqual(['party-os-teimosos'])
    await waitFor(() => expect(listCalls).toBe(2))
  })

  it('REQ-17: com 404 PARTY_NOT_FOUND, fecha, consulta de novo e mostra a message', async () => {
    let listCalls = 0
    server.use(
      http.get('*/parties', () => {
        listCalls += 1
        return HttpResponse.json(partiesFixture)
      }),
      http.delete('*/parties/:partyId', () =>
        HttpResponse.json(partyNotFoundFixture, { status: 404 }),
      ),
    )
    renderHome()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abandonar' }))
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent('Grupo não encontrado.'),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(listCalls).toBe(2))
  })

  it('REQ-17: com falha de rede, mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.delete('*/parties/:partyId', () => HttpResponse.error()))
    renderHome()
    const dialog = await openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abandonar' }))
    await waitFor(() =>
      expect(gamesStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
