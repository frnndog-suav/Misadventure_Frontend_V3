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
import { MemoryRouter } from 'react-router-dom'
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
import {
  partyCreatedFixture,
  partyInSessionFixture,
  partySessionNotActiveFixture,
} from '../../mocks/partyFixtures'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
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

const partyId = partyCreatedFixture.id

function renderParty(id: string = partyId): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/grupo/${id}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const status = () => screen.getAllByRole('status')[0]
const endButton = () => screen.getByRole('button', { name: 'Encerrar sessão' })

describe('REQ-16: grupo em sessão', () => {
  it('REQ-16: ao abrir envia POST …/session e mostra "Abrindo o grupo…"', async () => {
    let calls = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/session', async ({ params }) => {
        expect(params.partyId).toBe(partyId)
        calls += 1
        await gate
        return HttpResponse.json(partyInSessionFixture)
      }),
    )
    renderParty()
    await waitFor(() => expect(calls).toBeGreaterThan(0))
    expect(status()).toHaveTextContent('Abrindo o grupo…')
    release()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
  })

  it('REQ-16: com 200 mostra nome, membros com host, situação, data, botão e placeholder', async () => {
    renderParty()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' }),
    ).toBeInTheDocument()
    const members = screen.getByRole('list', { name: 'Membros' })
    expect(within(members).getAllByRole('listitem')).toHaveLength(1)
    expect(within(members).getByRole('listitem')).toHaveTextContent(
      'Lia (host)',
    )
    expect(screen.getByText('Em sessão')).toBeInTheDocument()
    expect(screen.getByText('Salvo em 14/11/2026 18:30')).toBeInTheDocument()
    expect(endButton()).toBeEnabled()
    expect(
      screen.getByText('A partida começa na próxima etapa do jogo.'),
    ).toBeInTheDocument()
    expect(status()).toHaveTextContent('')
  })

  it('REQ-16: situação "Pausado" vem do status recebido', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(partyCreatedFixture),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('REQ-16: "Encerrar sessão" envia o pedido com o botão desabilitado e, com 200, volta a / com "Sessão encerrada."', async () => {
    let ended = false
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/session/end', async () => {
        ended = true
        await gate
        return HttpResponse.json({ ...partyInSessionFixture, status: 'idle' })
      }),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() => expect(ended).toBe(true))
    expect(endButton()).toBeDisabled()
    release()

    const games = await screen.findByRole('region', { name: 'Seus jogos' })
    expect(within(games).getByRole('status')).toHaveTextContent(
      'Sessão encerrada.',
    )
  })

  it('REQ-16: 404 ao abrir mostra a message e "Voltar ao início"', async () => {
    renderParty('nope')
    await waitFor(() =>
      expect(status()).toHaveTextContent('Grupo não encontrado.'),
    )
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.queryByRole('button', { name: 'Encerrar sessão' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-16: 404 ao encerrar mostra a message e "Voltar ao início"', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json(
          {
            error: {
              code: 'PARTY_NOT_FOUND',
              message: 'Grupo não encontrado.',
            },
          },
          { status: 404 },
        ),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent('Grupo não encontrado.'),
    )
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toBeInTheDocument()
  })

  it('REQ-16: 409 ao encerrar mostra a message, sem "Voltar ao início"', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    expect(
      screen.queryByRole('link', { name: 'Voltar ao início' }),
    ).not.toBeInTheDocument()
    expect(endButton()).toBeEnabled()
  })

  it('REQ-16: outro erro §1.4 ao abrir mostra a message', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-16: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () => HttpResponse.error()),
    )
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-16: resposta fora do contrato mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json({ id: 1 }),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})
