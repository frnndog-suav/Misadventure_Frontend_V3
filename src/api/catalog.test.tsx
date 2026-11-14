import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
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
import { cardSchema, useCards, useCollections, type CardType } from './catalog'
import { ApiError } from './http'
import {
  catalogQueryInvalidFixture,
  collectionsFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
  bladeOfDuskFixture,
  howlingWolvesFixture,
  strengthBasicFixture,
  whisperingGroveFixture,
  woundedTravelerFixture,
} from '../mocks/catalogFixtures'
import { handlers } from '../mocks/handlers'

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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('REQ-08: schema de Card (CONTRATO §3 FEAT-04)', () => {
  it('REQ-08: aceita as 6 cartas da coleção fixture', () => {
    for (const card of fixtureCardsFixture) {
      expect(cardSchema.safeParse(card).success).toBe(true)
    }
  })

  it('REQ-08: rejeita type desconhecido', () => {
    expect(
      cardSchema.safeParse({ ...strengthBasicFixture, type: 'monster' })
        .success,
    ).toBe(false)
  })

  it('REQ-08: rejeita campo obrigatório ausente', () => {
    const card: Record<string, unknown> = { ...strengthBasicFixture }
    delete card.rarity
    expect(cardSchema.safeParse(card).success).toBe(false)
  })

  it('REQ-08: rejeita identificador fora do glossário (§2.7)', () => {
    expect(
      cardSchema.safeParse({ ...whisperingGroveFixture, zoneType: 'ocean' })
        .success,
    ).toBe(false)
  })

  it('REQ-08: rejeita inimigo com count menor que 1 e combate sem inimigos', () => {
    const [wolf] =
      howlingWolvesFixture.type === 'combatEvent'
        ? howlingWolvesFixture.enemies
        : []
    expect(
      cardSchema.safeParse({
        ...howlingWolvesFixture,
        enemies: [{ ...wolf, count: 0 }],
      }).success,
    ).toBe(false)
    expect(
      cardSchema.safeParse({ ...howlingWolvesFixture, enemies: [] }).success,
    ).toBe(false)
  })

  it('REQ-08: rejeita faixas fora do contrato (preço, refino, listas mínimas, vida, modificador)', () => {
    const wolf =
      howlingWolvesFixture.type === 'combatEvent'
        ? howlingWolvesFixture.enemies[0]
        : undefined
    const invalid: unknown[] = [
      { ...bladeOfDuskFixture, priceMultiplier: 2 },
      {
        ...bladeOfDuskFixture,
        refinement: { maxLevel: 11, materials: { text: 'x' } },
      },
      { ...woundedTravelerFixture, requirements: [] },
      { ...strengthBasicFixture, attributes: [] },
      { ...howlingWolvesFixture, enemies: [{ ...wolf, health: 0 }] },
      {
        ...howlingWolvesFixture,
        enemies: [{ ...wolf, modifiers: { ...wolf?.modifiers, attack: -1 } }],
      },
    ]
    for (const card of invalid) {
      expect(cardSchema.safeParse(card).success).toBe(false)
    }
  })

  it('REQ-08: rejeita connectionArrows fora de 1 a 4', () => {
    expect(
      cardSchema.safeParse({ ...whisperingGroveFixture, connectionArrows: 5 })
        .success,
    ).toBe(false)
  })
})

describe('REQ-08: useCollections (GET /catalog/collections)', () => {
  it('REQ-08: entrega CollectionSummary[] validado', async () => {
    const { result } = renderHook(() => useCollections(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(collectionsFixture)
  })

  it('REQ-08: cardCounts sem um tipo é resposta fora do contrato', async () => {
    server.use(
      http.get('*/catalog/collections', () =>
        HttpResponse.json([
          { id: 'fixture', name: 'Coleção de Teste', cardCounts: { zone: 1 } },
        ]),
      ),
    )
    const { result } = renderHook(() => useCollections(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-08: falha de rede vira erro que não é ApiError', async () => {
    server.use(http.get('*/catalog/collections', () => HttpResponse.error()))
    const { result } = renderHook(() => useCollections(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-08: useCards (GET /catalog/collections/:collectionId/cards)', () => {
  it('REQ-08: sem type, pede sem query e entrega as 6 cartas na ordem recebida', async () => {
    let search = 'x'
    server.use(
      http.get('*/catalog/collections/:collectionId/cards', ({ request }) => {
        search = new URL(request.url).search
        return HttpResponse.json(fixtureCardsFixture)
      }),
    )
    const { result } = renderHook(() => useCards('fixture'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(search).toBe('')
    expect(result.current.data?.map((card) => card.id)).toEqual([
      'fixture.blade-of-dusk',
      'fixture.healing-potion',
      'fixture.howling-wolves',
      'fixture.strength-basic',
      'fixture.whispering-grove',
      'fixture.wounded-traveler',
    ])
  })

  it('REQ-08: com type=attribute, pede ?type=attribute e entrega a carta do cenário', async () => {
    let search = ''
    server.use(
      http.get('*/catalog/collections/:collectionId/cards', ({ request }) => {
        search = new URL(request.url).search
        return HttpResponse.json([strengthBasicFixture])
      }),
    )
    const { result } = renderHook(() => useCards('fixture', 'attribute'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(search).toBe('?type=attribute')
    expect(result.current.data).toEqual([strengthBasicFixture])
  })

  it('REQ-08: o handler padrão responde as 6 cartas sem type', async () => {
    const { result } = renderHook(() => useCards('fixture'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixtureCardsFixture)
  })

  it('REQ-08: o handler padrão responde a lista pronta de cada tipo', async () => {
    const types = Object.keys(fixtureCardsByTypeFixture) as CardType[]
    for (const type of types) {
      const { result } = renderHook(() => useCards('fixture', type), {
        wrapper,
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(fixtureCardsByTypeFixture[type])
    }
  })

  it('REQ-08: 404 COLLECTION_NOT_FOUND vira ApiError com a message', async () => {
    const { result } = renderHook(() => useCards('nope'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('COLLECTION_NOT_FOUND')
    expect(result.current.error?.message).toBe('Coleção não encontrada.')
  })

  it('REQ-08: 400 CATALOG_QUERY_INVALID vira ApiError com a message', async () => {
    server.use(
      http.get('*/catalog/collections/:collectionId/cards', () =>
        HttpResponse.json(catalogQueryInvalidFixture, { status: 400 }),
      ),
    )
    const { result } = renderHook(() => useCards('fixture', 'attribute'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe(
      'CATALOG_QUERY_INVALID',
    )
    expect(result.current.error?.message).toBe('Filtro do catálogo inválido.')
  })

  it('REQ-08: carta com type desconhecido na lista é resposta fora do contrato', async () => {
    server.use(
      http.get('*/catalog/collections/:collectionId/cards', () =>
        HttpResponse.json([{ ...strengthBasicFixture, type: 'monster' }]),
      ),
    )
    const { result } = renderHook(() => useCards('fixture'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-08: o handler padrão responde 400 do contrato para type desconhecido', async () => {
    const response = await fetch(
      'http://localhost:3000/catalog/collections/fixture/cards?type=monster',
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual(catalogQueryInvalidFixture)
  })
})
