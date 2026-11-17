import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
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
import {
  cardSchema,
  classDefinitionSchema,
  collectionSummarySchema,
  useCatalogCard,
  useClasses,
} from './catalog'
import { ApiError } from './http'
import { labConfigSchema } from './labConfig'
import {
  DimensionInvalidError,
  PartyInvalidError,
  partySchema,
  useCreateParty,
  useStartSession,
} from './parties'
import {
  collectionsFixture,
  fixtureCardsFixture,
  grayHarborFixture,
  stoneBendFixture,
  testDimensionFixture,
  whisperingGroveFixture,
} from '../mocks/catalogFixtures'
import { labConfigDefaultsFixture } from '../mocks/fixtures'
import { classesFixture, warriorClassFixture } from '../mocks/classFixtures'
import {
  dimensionInvalidFixture,
  partyClassRequiredFixture,
  partyCreatedFixture,
  partyInSessionFixture,
  partyUnknownClassFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'

/** Camada de cliente da FEAT-06 (CONTRATO §3 FEAT-06, spec T-28, D-48). */

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

const request = {
  name: 'Os Teimosos',
  characterName: 'Lia',
  playerClass: 'warrior',
} as const

describe('REQ-27: GameConfigValues com as chaves da FEAT-06', () => {
  const newKeys = [
    'minDeckSize',
    'lockOneEssential',
    'lockTwoEssentials',
    'mapMaxAttempts',
    'defaultAttack',
    'defaultDefense',
    'defaultAccuracy',
    'defaultEvasion',
    'defaultCelerity',
    'defaultPiercing',
    'defaultReflection',
  ] as const

  it('REQ-27: o LabConfig dos padrões traz as 11 chaves novas, com os padrões do contrato', () => {
    const config = labConfigSchema.parse(labConfigDefaultsFixture)
    expect(newKeys.map((key) => config.defaults[key])).toEqual([
      60, 18, 10, 1000, 5, 3, 50, 20, 10, 0, 0,
    ])
    expect(config.limits.minDeckSize).toEqual({ min: 1, max: 200 })
    expect(config.limits.mapMaxAttempts).toEqual({ min: 1, max: 100000 })
  })

  it('REQ-27: LabConfig sem uma chave nova é resposta fora do contrato', () => {
    for (const key of newKeys) {
      const values: Record<string, unknown> = {
        ...labConfigDefaultsFixture.values,
      }
      delete values[key]
      expect(
        labConfigSchema.safeParse({ ...labConfigDefaultsFixture, values })
          .success,
      ).toBe(false)
    }
  })
})

describe('REQ-28: Carta de Dimensão e forma das setas', () => {
  it('REQ-28: aceita a Carta de Dimensão do cenário e a zona com arrowLayout', () => {
    expect(cardSchema.parse(testDimensionFixture)).toEqual({
      type: 'dimension',
      id: 'fixture.test-dimension',
      collectionId: 'fixture',
      name: 'Dimensão de Teste',
      flavorText: null,
      releaseOrder: 1,
      arrivalZoneTitle: 'Porto Cinzento',
      effects: [],
    })
    expect(cardSchema.safeParse(stoneBendFixture).success).toBe(true)
    expect(cardSchema.safeParse(grayHarborFixture).success).toBe(true)
  })

  it('REQ-28: arrivalZoneTitle aceita null; releaseOrder abaixo de 1 é fora do contrato', () => {
    expect(
      cardSchema.safeParse({ ...testDimensionFixture, arrivalZoneTitle: null })
        .success,
    ).toBe(true)
    expect(
      cardSchema.safeParse({ ...testDimensionFixture, releaseOrder: 0 })
        .success,
    ).toBe(false)
  })

  it('REQ-28: zona sem arrowLayout ou com forma desconhecida é fora do contrato', () => {
    const zone: Record<string, unknown> = { ...whisperingGroveFixture }
    delete zone.arrowLayout
    expect(cardSchema.safeParse(zone).success).toBe(false)
    expect(
      cardSchema.safeParse({ ...whisperingGroveFixture, arrowLayout: 'curve' })
        .success,
    ).toBe(false)
  })

  it('REQ-28: cardCounts exige dimension; as contagens da fixture são as do contrato', () => {
    expect(collectionsFixture[0].cardCounts).toEqual({
      zone: 4,
      attribute: 3,
      equipment: 1,
      item: 1,
      randomEvent: 1,
      combatEvent: 1,
      dimension: 1,
    })
    const counts: Record<string, unknown> = {
      ...collectionsFixture[0].cardCounts,
    }
    delete counts.dimension
    expect(
      collectionSummarySchema.safeParse({
        ...collectionsFixture[0],
        cardCounts: counts,
      }).success,
    ).toBe(false)
  })

  it('REQ-28: o handler padrão da coleção fixture lista as 12 cartas na ordem de id', async () => {
    const response = await fetch(
      'http://localhost:3000/catalog/collections/fixture/cards',
    )
    const ids = ((await response.json()) as { id: string }[]).map(
      (card) => card.id,
    )
    expect(ids).toEqual([
      'fixture.blade-of-dusk',
      'fixture.dexterity-basic',
      'fixture.endurance-basic',
      'fixture.gray-harbor',
      'fixture.healing-potion',
      'fixture.howling-wolves',
      'fixture.old-mine',
      'fixture.stone-bend',
      'fixture.strength-basic',
      'fixture.test-dimension',
      'fixture.whispering-grove',
      'fixture.wounded-traveler',
    ])
    expect(fixtureCardsFixture).toHaveLength(12)
  })
})

describe('REQ-30: useCatalogCard (GET /catalog/cards/:cardId)', () => {
  it('REQ-30: entrega a carta validada do id pedido', async () => {
    const { result } = renderHook(
      () => useCatalogCard('fixture.test-dimension'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(testDimensionFixture)
  })

  it('REQ-30: guarda cada id no cache: o mesmo id não é pedido duas vezes', async () => {
    let calls = 0
    server.use(
      http.get('*/catalog/cards/:cardId', () => {
        calls += 1
        return HttpResponse.json(grayHarborFixture)
      }),
    )
    const first = renderHook(() => useCatalogCard('fixture.gray-harbor'), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    const second = renderHook(() => useCatalogCard('fixture.gray-harbor'), {
      wrapper,
    })
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))
    expect(calls).toBe(1)
  })

  it('REQ-30: id desconhecido → 404 CARD_NOT_FOUND como ApiError', async () => {
    const { result } = renderHook(() => useCatalogCard('fixture.nope'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('CARD_NOT_FOUND')
    expect(result.current.error?.message).toBe('Carta não encontrada.')
  })

  it('REQ-30: carta fora do contrato não é ApiError', async () => {
    server.use(
      http.get('*/catalog/cards/:cardId', () =>
        HttpResponse.json({ ...testDimensionFixture, type: 'monster' }),
      ),
    )
    const { result } = renderHook(
      () => useCatalogCard('fixture.test-dimension'),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-29: useClasses (GET /catalog/classes)', () => {
  it('REQ-29: entrega as 2 classes na ordem recebida; warrior é o do cenário', async () => {
    const { result } = renderHook(() => useClasses(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.map((c) => c.playerClass)).toEqual([
      'rogue',
      'warrior',
    ])
    expect(result.current.data?.[1]).toEqual({
      playerClass: 'warrior',
      collectionId: 'fixture',
      name: 'Guerreiro',
      essentialAttributes: ['strength', 'endurance'],
      baseModifiers: {
        attack: 6,
        defense: 5,
        accuracy: 45,
        evasion: 15,
        celerity: 8,
        piercing: 0,
        reflection: 0,
      },
      starterDeck: [
        { cardId: 'fixture.endurance-basic', copies: 30 },
        { cardId: 'fixture.strength-basic', copies: 30 },
      ],
    })
    expect(classesFixture[1]).toEqual(warriorClassFixture)
  })

  it('REQ-29: classe fora do glossário, atributo desconhecido ou cópias < 1 é fora do contrato', () => {
    const invalid: unknown[] = [
      { ...warriorClassFixture, playerClass: 'paladin' },
      { ...warriorClassFixture, essentialAttributes: ['might'] },
      {
        ...warriorClassFixture,
        starterDeck: [{ cardId: 'fixture.strength-basic', copies: 0 }],
      },
    ]
    for (const value of invalid) {
      expect(classDefinitionSchema.safeParse(value).success).toBe(false)
    }
  })

  it('REQ-29: lista fora do contrato e falha de rede não são ApiError', async () => {
    server.use(
      http.get('*/catalog/classes', () =>
        HttpResponse.json([{ ...warriorClassFixture, baseModifiers: {} }]),
      ),
    )
    const outOfContract = renderHook(() => useClasses(), { wrapper })
    await waitFor(() => expect(outOfContract.result.current.isError).toBe(true))
    expect(outOfContract.result.current.error).not.toBeInstanceOf(ApiError)

    queryClient.clear()
    server.use(http.get('*/catalog/classes', () => HttpResponse.error()))
    const network = renderHook(() => useClasses(), { wrapper })
    await waitFor(() => expect(network.result.current.isError).toBe(true))
    expect(network.result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-29: useCreateParty com playerClass', () => {
  it('REQ-29: envia playerClass e entrega o Party preparado', async () => {
    let sent: unknown
    server.use(
      http.post('*/parties', async ({ request: req }) => {
        sent = await req.json()
        return HttpResponse.json(partyCreatedFixture, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => result.current.mutate(request))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sent).toEqual(request)
    expect(result.current.data).toEqual(partyCreatedFixture)
  })

  it('REQ-29: sem classe escolhida o corpo vai sem playerClass', async () => {
    let sent: unknown
    server.use(
      http.post('*/parties', async ({ request: req }) => {
        sent = await req.json()
        return HttpResponse.json(partyClassRequiredFixture, { status: 400 })
      }),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() =>
      result.current.mutate({ name: 'Os Teimosos', characterName: 'Lia' }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(sent).toEqual({ name: 'Os Teimosos', characterName: 'Lia' })
    expect((result.current.error as PartyInvalidError).fields).toEqual([
      { field: 'playerClass', reason: 'required' },
    ])
  })

  it('REQ-29: o handler padrão responde unknownClass no corpo do cenário', async () => {
    const unknown = renderHook(() => useCreateParty(), { wrapper })
    act(() =>
      unknown.result.current.mutate({ ...request, playerClass: 'mage' }),
    )
    await waitFor(() => expect(unknown.result.current.isError).toBe(true))
    expect((unknown.result.current.error as PartyInvalidError).fields).toEqual(
      partyUnknownClassFixture.error.details.fields,
    )
  })

  it('REQ-29: 409 DIMENSION_INVALID vira DimensionInvalidError com problems', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(dimensionInvalidFixture, { status: 409 }),
      ),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => result.current.mutate(request))
    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error
    expect(error).toBeInstanceOf(DimensionInvalidError)
    expect(error).toBeInstanceOf(ApiError)
    expect(error?.message).toBe(
      'Não foi possível preparar a dimensão. Avise o designer da coleção.',
    )
    expect((error as DimensionInvalidError).problems).toEqual(
      dimensionInvalidFixture.error.details.problems,
    )
    expect((error as DimensionInvalidError).dimensionCardId).toBeNull()
  })

  it('REQ-29: DIMENSION_INVALID com details fora do contrato vira erro genérico', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(
          {
            error: {
              code: 'DIMENSION_INVALID',
              message: 'x',
              details: { problems: 'nenhum' },
            },
          },
          { status: 409 },
        ),
      ),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => result.current.mutate(request))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-30: Party preparado (dimension, turnOrder, player)', () => {
  it('REQ-30: as fixtures seguem as invariantes do cenário de criação', () => {
    const party = partySchema.parse(partyCreatedFixture)
    expect(party.dimension.dimensionCardId).toBe('fixture.test-dimension')
    expect(party.dimension.startingCityZoneId).toBe('fixture.gray-harbor')
    expect(party.dimension.map.zones.map((z) => z.zoneId).sort()).toEqual([
      'fixture.gray-harbor',
      'fixture.old-mine',
      'fixture.stone-bend',
      'fixture.whispering-grove',
    ])
    expect(party.turnOrder).toEqual([party.members[0].id])
    const { hand, ...player } = party.members[0].player
    expect(player).toEqual({
      playerClasses: [{ playerClass: 'warrior', deckLockMet: true }],
      gold: 10,
      baseHealth: 20,
      maxHealth: 22,
      health: 22,
      peak: 10,
      vigor: 10,
      modifiers: {
        attack: 6,
        defense: 5,
        accuracy: 45,
        evasion: 15,
        celerity: 8,
        piercing: 0,
        reflection: 0,
      },
      attributeDeckCount: 53,
      attributeDiscardPileCount: 0,
      zoneId: 'fixture.gray-harbor',
      respawnZoneId: 'fixture.gray-harbor',
      moveTargets: ['fixture.stone-bend', 'fixture.whispering-grove'],
    })
    expect(hand).toHaveLength(7)
    for (const id of hand) {
      expect(['fixture.strength-basic', 'fixture.endurance-basic']).toContain(
        id,
      )
    }
  })

  it('REQ-30: membro sem player, direção desconhecida ou travessia sem par é fora do contrato', () => {
    const withoutPlayer: Record<string, unknown> = {
      ...partyCreatedFixture.members[0],
    }
    delete withoutPlayer.player
    const [zone] = partyCreatedFixture.dimension.map.zones
    const invalid: unknown[] = [
      { ...partyCreatedFixture, members: [withoutPlayer] },
      {
        ...partyCreatedFixture,
        dimension: {
          ...partyCreatedFixture.dimension,
          map: {
            ...partyCreatedFixture.dimension.map,
            zones: [{ ...zone, arrows: ['up'] }],
          },
        },
      },
      {
        ...partyCreatedFixture,
        dimension: {
          ...partyCreatedFixture.dimension,
          map: {
            ...partyCreatedFixture.dimension.map,
            crossings: [{ zoneIds: ['fixture.gray-harbor'] }],
          },
        },
      },
      { ...partyCreatedFixture, turnOrder: undefined },
    ]
    for (const value of invalid) {
      expect(partySchema.safeParse(value).success).toBe(false)
    }
  })

  it('REQ-30: Continuar entrega o Party preparado em sessão', async () => {
    const { result } = renderHook(
      () => useStartSession(partyCreatedFixture.id),
      { wrapper },
    )
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyInSessionFixture)
    expect(result.current.data?.members[0].player.hand).toHaveLength(7)
  })
})
