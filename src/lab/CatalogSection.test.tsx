import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
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
import {
  collectionNotFoundFixture,
  fixtureCardsFixture,
} from '../mocks/catalogFixtures'
import { internalErrorFixture } from '../mocks/fixtures'
import { handlers } from '../mocks/handlers'
import { CatalogSection } from './CatalogSection'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
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

function renderCatalog(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <CatalogSection />
    </QueryClientProvider>,
  )
}

const status = () => screen.getByRole('status')
const cardsUrl = '*/catalog/collections/:collectionId/cards'
const unavailable = 'Servidor indisponível. Tente novamente.'

/** As 24 cartas da `fixture` (CONTRATO §3, atualizado pela FEAT-11). */
const expectedOrder = [
  'Varinha Arcana · Equipamento',
  'Lâmina do Crepúsculo · Equipamento',
  'Destreza · Atributo',
  'Resistência · Atributo',
  'Vara de Pesca · Item',
  'Amuleto do Foco · Equipamento',
  'Porto Cinzento · Zona',
  'Armadura do Guardião · Equipamento',
  'Poção de Cura · Item',
  'Lobos Uivantes · Evento de combate',
  'Elmo de Ferro · Equipamento',
  'Minério de Ferro · Item',
  'Moeda da Sorte · Item',
  'Escudo de Carvalho · Equipamento',
  'Mina Velha · Zona',
  'Picareta · Item',
  'Espada Curta · Equipamento',
  'Peixe Prateado · Item',
  'Curva de Pedra · Zona',
  'Força · Atributo',
  'Tônico de Força · Item',
  'Dimensão de Teste · Dimensão',
  'Bosque Sussurrante · Zona',
  'Viajante Ferido · Evento aleatório',
]

async function cardButtons(): Promise<HTMLElement[]> {
  const list = await screen.findByRole('list', { name: 'Cartas' })
  return within(list).getAllByRole('button')
}

describe('CatalogSection', () => {
  it('REQ-08: mostra "Carregando catálogo…" enquanto as consultas estão em andamento', async () => {
    renderCatalog()
    expect(status()).toHaveTextContent('Carregando catálogo…')
    await cardButtons()
    expect(status()).toHaveTextContent('')
  })

  it('REQ-08: lista as coleções (a primeira escolhida) e o filtro de tipo com as quantidades', async () => {
    renderCatalog()
    expect(
      await screen.findByRole('radio', { name: 'Coleção de Teste' }),
    ).toBeChecked()
    const filter = screen.getByRole('radiogroup', { name: 'Tipo de carta' })
    const options = within(filter)
      .getAllByRole('radio')
      .map((r) => r.closest('label')?.textContent)
    expect(options).toEqual([
      'Todos (24)',
      'Zona (4)',
      'Atributo (3)',
      'Equipamento (7)',
      'Item (7)',
      'Evento aleatório (1)',
      'Evento de combate (1)',
      'Dimensão (1)',
    ])
    expect(
      within(filter).getByRole('radio', { name: 'Todos (24)' }),
    ).toBeChecked()
  })

  it('REQ-08: mostra as cartas na ordem recebida, com nome (ou título) e rótulo do tipo', async () => {
    renderCatalog()
    const buttons = await cardButtons()
    expect(buttons.map((b) => b.textContent)).toEqual(expectedOrder)
  })

  it('REQ-08: escolher um tipo pede ?type= ao backend e mostra o que veio', async () => {
    const requested: (string | null)[] = []
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname.endsWith('/cards'))
        requested.push(url.searchParams.get('type'))
    })
    renderCatalog()
    await cardButtons()
    fireEvent.click(screen.getByRole('radio', { name: 'Zona (4)' }))
    expect(
      await screen.findByRole('button', { name: 'Porto Cinzento · Zona' }),
    ).toBeInTheDocument()
    expect(await cardButtons()).toHaveLength(4)
    expect(requested).toEqual([null, 'zone'])
    server.events.removeAllListeners()
  })

  it('REQ-08: lista vazia mostra "Nenhuma carta neste filtro."', async () => {
    server.use(http.get(cardsUrl, () => HttpResponse.json([])))
    renderCatalog()
    expect(
      await screen.findByText('Nenhuma carta neste filtro.'),
    ).toBeInTheDocument()
  })

  // A Carta de Dimensão ganha componente na T-29 (REQ-28).
  it.each(
    fixtureCardsFixture
      .map((card, i) => [expectedOrder[i], card] as const)
      .filter(([, card]) => card.type !== 'dimension'),
  )(
    'REQ-08: escolher "%s" mostra a carta completa no formato do seu tipo',
    async (label) => {
      renderCatalog()
      await cardButtons()
      const button = screen.getByRole('button', { name: label })
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-pressed', 'true')
      const name = label.split(' · ')[0]
      expect(screen.getByRole('article', { name })).toBeInTheDocument()
    },
  )

  it('REQ-08: a carta escolhida mostra os dados do componente do tipo (equipamento)', async () => {
    renderCatalog()
    await cardButtons()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Lâmina do Crepúsculo · Equipamento',
      }),
    )
    const card = screen.getByRole('article', { name: 'Lâmina do Crepúsculo' })
    expect(within(card).getByText('Rara')).toBeInTheDocument()
  })

  it('REQ-08: erro §1.4 nas coleções mostra a message recebida', async () => {
    server.use(
      http.get('*/catalog/collections', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderCatalog()
    expect(
      await screen.findByText(internalErrorFixture.error.message),
    ).toBeInTheDocument()
    expect(status()).toHaveTextContent(internalErrorFixture.error.message)
  })

  it('REQ-08: 404 COLLECTION_NOT_FOUND nas cartas mostra "Coleção não encontrada."', async () => {
    server.use(
      http.get(cardsUrl, () =>
        HttpResponse.json(collectionNotFoundFixture, { status: 404 }),
      ),
    )
    renderCatalog()
    expect(await screen.findByText('Coleção não encontrada.')).toBe(status())
  })

  it('REQ-08: falha de rede mostra o texto genérico', async () => {
    server.use(http.get(cardsUrl, () => HttpResponse.error()))
    renderCatalog()
    expect(await screen.findByText(unavailable)).toBe(status())
  })

  it('REQ-08: carta com type desconhecido (fora do contrato) mostra o texto genérico', async () => {
    server.use(
      http.get(cardsUrl, () =>
        HttpResponse.json([
          { type: 'monster', id: 'x', collectionId: 'fixture' },
        ]),
      ),
    )
    renderCatalog()
    expect(await screen.findByText(unavailable)).toBe(status())
  })
})
