import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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
import type {
  AttributeCard as AttributeCardData,
  ItemCard as ItemCardData,
  ZoneCard as ZoneCardData,
} from '../../api/catalog'
import {
  arrowsFixture,
  boosterFixture,
  fishingRodFixture,
  grayHarborFixture,
  healingPotionFixture,
  strengthBasicFixture,
  whisperingGroveFixture,
} from '../../mocks/catalogFixtures'
import { handlers } from '../../mocks/handlers'
import { AttributeCard } from './AttributeCard'
import { ItemCard } from './ItemCard'
import { ZoneCard } from './ZoneCard'

if (strengthBasicFixture.type !== 'attribute') throw new Error('fixture')
if (healingPotionFixture.type !== 'item') throw new Error('fixture')
if (arrowsFixture.type !== 'item') throw new Error('fixture')
if (fishingRodFixture.type !== 'item') throw new Error('fixture')
if (boosterFixture.type !== 'item') throw new Error('fixture')
if (grayHarborFixture.type !== 'zone') throw new Error('fixture')
if (whisperingGroveFixture.type !== 'zone') throw new Error('fixture')
const attribute: AttributeCardData = strengthBasicFixture
const potion: ItemCardData = healingPotionFixture
const arrows: ItemCardData = arrowsFixture
const booster: ItemCardData = boosterFixture
const harbor: ZoneCardData = grayHarborFixture
const grove: ZoneCardData = whisperingGroveFixture

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

describe('REQ-72: campos do mercado nas cartas', () => {
  it('REQ-72: atributo mostra "Preço ×{priceMultiplier}" com vírgula decimal', () => {
    render(<AttributeCard card={{ ...attribute, priceMultiplier: 1.2 }} />)
    expect(screen.getByText('Preço ×1,2')).toBeVisible()
  })

  it('REQ-72: item mostra o ajuste de preço; sem estoque, nada de "Preço de estoque" nem "Lote"', () => {
    render(
      <ItemCard card={{ ...potion, priceMultiplier: 0.8, stockPrice: null }} />,
    )
    expect(screen.getByText('Preço ×0,8')).toBeVisible()
    expect(screen.queryByText(/Preço de estoque/)).toBeNull()
    expect(screen.queryByText(/Lote de/)).toBeNull()
    expect(screen.queryByText(/Coleção:/)).toBeNull()
  })

  it('REQ-72: item com stockPrice e stockQuantity > 1 mostra "Preço de estoque" e "Lote de"', () => {
    render(<ItemCard card={{ ...arrows, stockPrice: 3, stockQuantity: 10 }} />)
    expect(screen.getByText('Preço de estoque 3')).toBeVisible()
    expect(screen.getByText('Lote de 10')).toBeVisible()
  })

  it('REQ-72: stockQuantity 1 não mostra "Lote de"', () => {
    render(<ItemCard card={{ ...arrows, stockPrice: 6, stockQuantity: 1 }} />)
    expect(screen.getByText('Preço de estoque 6')).toBeVisible()
    expect(screen.queryByText(/Lote de/)).toBeNull()
  })

  it('REQ-72: booster mostra "Coleção: {nome da coleção}"', async () => {
    renderWithClient(<ItemCard card={booster} />)
    expect(await screen.findByText('Coleção: Coleção de Teste')).toBeVisible()
  })

  it('REQ-72: booster com coleção fora da lista mostra o id', async () => {
    renderWithClient(
      <ItemCard card={{ ...booster, boosterCollectionId: 'outra' }} />,
    )
    expect(await screen.findByText('Coleção: outra')).toBeVisible()
  })

  it('REQ-72: erro ao listar coleções mostra o id da coleção', async () => {
    server.use(
      http.get('*/catalog/collections', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderWithClient(<ItemCard card={booster} />)
    await waitFor(() =>
      expect(screen.getByText('Coleção: fixture')).toBeVisible(),
    )
  })

  it('REQ-72: zona com market mostra "Estoque" com os nomes, na ordem recebida, e "Vende singles"', async () => {
    renderWithClient(<ZoneCard card={harbor} />)
    const stock = await screen.findByRole('list', { name: 'Estoque' })
    await waitFor(() =>
      expect(
        within(stock)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Poção de Cura', 'Flechas', 'Vara de Pesca']),
    )
    expect(screen.getByText('Mercado')).toBeVisible()
    expect(screen.getByText('Vende singles')).toBeVisible()
  })

  it('REQ-72: zona com market sem estoque e sem singles mostra "Sem estoque." e "Sem singles"', () => {
    renderWithClient(
      <ZoneCard card={{ ...harbor, market: { stock: [], singles: false } }} />,
    )
    expect(screen.getByText('Sem estoque.')).toBeVisible()
    expect(screen.getByText('Sem singles')).toBeVisible()
    expect(screen.queryByRole('list', { name: 'Estoque' })).toBeNull()
  })

  it('REQ-72: zona sem market não mostra o bloco "Mercado"', () => {
    render(<ZoneCard card={grove} />)
    expect(screen.queryByText('Mercado')).toBeNull()
  })
})
