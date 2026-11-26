import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { ReactElement } from 'react'
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
import type { DimensionCard as DimensionCardData } from '../../api/catalog'
import { testDimensionFixture } from '../../mocks/catalogFixtures'
import { bossDimensionFixture } from '../../mocks/dimensionCompletionFixtures'
import { internalErrorFixture } from '../../mocks/fixtures'
import { handlers } from '../../mocks/handlers'
import { DimensionCard } from './DimensionCard'
import { FullCard } from './FullCard'

if (testDimensionFixture.type !== 'dimension') throw new Error('fixture')
const dimension: DimensionCardData = testDimensionFixture
const noDecks: DimensionCardData = { ...dimension, rewardDecks: [] }

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

function renderWithClient(ui: ReactElement): void {
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const deckItems = () =>
  within(screen.getByRole('list', { name: 'Decks de recompensas' }))

describe('DimensionCard', () => {
  it('REQ-91: apresenta os requisitos, o prêmio e o bloco de inimigo do chefe final', async () => {
    renderWithClient(<DimensionCard card={bossDimensionFixture} />)
    const boss = within(screen.getByRole('region', { name: 'Chefe final' }))
    expect(boss.getByText('Guardião da Mina')).toBeVisible()
    expect(boss.getByText('Sem fuga')).toBeVisible()
    expect(
      boss.getByRole('heading', {
        name: bossDimensionFixture.completion!.finalBoss!.enemies[0].name,
      }),
    ).toBeVisible()
    expect(await screen.findByText('3× Fragmento')).toBeVisible()
    expect(await screen.findByText('1× Lâmina do Crepúsculo')).toBeVisible()
  })

  it('REQ-91: omite a conclusão legada e o chefe ausente', () => {
    const view = render(
      <QueryClientProvider client={queryClient}>
        <DimensionCard card={dimension} />
      </QueryClientProvider>,
    )
    expect(
      screen.queryByRole('region', { name: 'Chefe final' }),
    ).not.toBeInTheDocument()
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <DimensionCard card={{ ...dimension, completion: null }} />
      </QueryClientProvider>,
    )
    expect(
      screen.queryByRole('region', { name: 'Conclusão' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-28: mostra nome, ordem de lançamento e zona de chegada (fixture)', () => {
    renderWithClient(<DimensionCard card={dimension} />)
    const card = screen.getByRole('article', { name: 'Dimensão de Teste' })
    expect(within(card).getByText('Ordem de lançamento 1')).toBeVisible()
    expect(
      within(card).getByText('Zona de chegada: Porto Cinzento'),
    ).toBeVisible()
    // a fixture não tem efeitos nem flavor
    expect(within(card).queryByRole('list', { name: 'Efeitos' })).toBeNull()
  })

  it('REQ-28: zona de chegada null mostra o texto do sorteio', () => {
    renderWithClient(
      <DimensionCard card={{ ...dimension, arrivalZoneTitle: null }} />,
    )
    expect(
      screen.getByText(
        'Zona de chegada: sorteada entre as Urbanas sem efeito negativo',
      ),
    ).toBeVisible()
  })

  it('REQ-53: mostra o texto e a polaridade dos efeitos', () => {
    renderWithClient(
      <DimensionCard
        card={{
          ...noDecks,
          flavorText: 'Um mundo à deriva.',
          effects: [
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Efeito A.',
              polarity: 'positive',
            },
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Efeito B.',
              polarity: 'negative',
            },
          ],
        }}
      />,
    )
    expect(screen.getByText('Um mundo à deriva.')).toBeVisible()
    const items = within(
      screen.getByRole('list', { name: 'Efeitos' }),
    ).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'Positivo: Efeito A.',
      'Negativo: Efeito B.',
    ])
  })

  it('REQ-28: FullCard mostra a Carta de Dimensão', () => {
    renderWithClient(<FullCard card={dimension} />)
    expect(
      screen.getByRole('article', { name: 'Dimensão de Teste' }),
    ).toBeVisible()
  })

  it('REQ-48: "Decks de recompensas" depois dos efeitos, por tipo de zona, com "{copies}× {nome}" na ordem recebida', async () => {
    renderWithClient(
      <DimensionCard
        card={{
          ...dimension,
          effects: [
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Efeito A.',
              polarity: 'positive',
            },
          ],
        }}
      />,
    )
    const decks = screen.getByRole('list', { name: 'Decks de recompensas' })
    const effects = screen.getByRole('list', { name: 'Efeitos' })
    expect(
      effects.compareDocumentPosition(decks) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(deckItems().getByText('Urbana')).toBeVisible()
    const cards = within(
      deckItems().getByRole('list', { name: 'Urbana' }),
    ).getAllByRole('listitem')
    // até os nomes chegarem, "…"
    expect(cards.map((li) => li.textContent)).toEqual(['1× …', '1× …', '2× …'])
    expect(await deckItems().findByText('1× Peixe Prateado')).toBeVisible()
    expect(await deckItems().findByText('1× Minério de Ferro')).toBeVisible()
    expect(
      within(deckItems().getByRole('list', { name: 'Urbana' }))
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['1× Peixe Prateado', '1× Minério de Ferro', '2× Poção de Cura'])
  })

  it('REQ-48: erro ao buscar a carta mostra o id no lugar do nome', async () => {
    server.use(
      http.get('*/catalog/cards/fixture.iron-ore', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderWithClient(<DimensionCard card={dimension} />)
    expect(await deckItems().findByText('1× fixture.iron-ore')).toBeVisible()
    expect(await deckItems().findByText('1× Peixe Prateado')).toBeVisible()
  })

  it('REQ-48: rewardDecks vazio não mostra a lista', () => {
    renderWithClient(<DimensionCard card={noDecks} />)
    expect(
      screen.queryByRole('list', { name: 'Decks de recompensas' }),
    ).toBeNull()
  })
})
