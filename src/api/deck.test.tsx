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
import { ApiError } from './http'
import { labConfigSchema } from './labConfig'
import {
  ActionNotAllowedError,
  partySchema,
  playerStateSchema,
  usePartyAction,
} from './parties'
import type { PartyAction } from './parties'
import { labConfigDefaultsFixture } from '../mocks/fixtures'
import {
  actionBuildBelowMinimumFixture,
  actionNotOwnedFixture,
  partyCreatedFixture,
  partyDeckAdjustedFixture,
  partyInSessionFixture,
  partyMovedToStoneBendFixture,
  partyNextRoundFixture,
  partyNoPointsFixture,
  partyRecoveredDrawFixture,
  partyRecoveredShuffleDiscardFixture,
  partyRecoveredShuffleHandFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'

/** CONTRATO §3 FEAT-09 (v0.37): build, pasta, Recuperar e Ajustar deck. */

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

const S = 'fixture.strength-basic'
const E = 'fixture.endurance-basic'
const partyId = partyInSessionFixture.id
const currentBuild = [
  { cardId: E, copies: 30 },
  { cardId: S, copies: 30 },
]

describe('REQ-39: GameConfigValues com as chaves da FEAT-09', () => {
  const keys = [
    'maxCopiesPerCard',
    'tcgFolderCapacity',
    'recoverHealthPercent',
    'recoverVigorPercent',
    'recoverHandSize',
  ] as const

  it('REQ-39: o LabConfig dos padrões traz as 5 chaves novas, com os padrões e limites do contrato', () => {
    const config = labConfigSchema.parse(labConfigDefaultsFixture)
    expect(keys.map((key) => config.values[key])).toEqual([4, 30, 15, 5, 7])
    expect(keys.map((key) => config.limits[key])).toEqual([
      { min: 1, max: 200 },
      { min: 0, max: 1000 },
      { min: 0, max: 100 },
      { min: 0, max: 100 },
      { min: 0, max: 200 },
    ])
  })

  it('REQ-39: LabConfig sem uma chave nova é resposta fora do contrato', () => {
    for (const key of keys) {
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

describe('REQ-40: PlayerState com build e pasta de TCG', () => {
  it('REQ-40: as fixtures trazem a build do warrior, 60 cartas, pasta vazia de capacidade 30', () => {
    const player = partyCreatedFixture.members[0].player
    expect(playerStateSchema.safeParse(player).success).toBe(true)
    expect(player.build).toEqual(currentBuild)
    expect(player.buildSize).toBe(60)
    expect(player.tcgFolder).toEqual([])
    expect(player.tcgFolderCapacity).toBe(30)
  })

  it('REQ-40: build ou pasta ausente, ou cópias fora do contrato, é inválido', () => {
    const player = partyCreatedFixture.members[0].player
    for (const key of [
      'build',
      'buildSize',
      'tcgFolder',
      'tcgFolderCapacity',
    ]) {
      const without: Record<string, unknown> = { ...player }
      delete without[key]
      expect(playerStateSchema.safeParse(without).success).toBe(false)
    }
    for (const copies of [0, 1.5, '3']) {
      expect(
        playerStateSchema.safeParse({
          ...player,
          tcgFolder: [{ cardId: S, copies }],
        }).success,
      ).toBe(false)
    }
    expect(
      playerStateSchema.safeParse({
        ...player,
        tcgFolder: [{ cardId: S, copies: 2 }],
      }).success,
    ).toBe(true)
  })
})

describe('REQ-41/REQ-42: availableActions da FEAT-09', () => {
  it('REQ-41: as fixtures trazem as ações na ordem do contrato', () => {
    const actions = (party: typeof partyInSessionFixture) =>
      party.members[0].player.availableActions
    expect(actions(partyInSessionFixture)).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'useVault',
      'visitMarket',
      'endTurn',
    ])
    expect(actions(partyMovedToStoneBendFixture)).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'endTurn',
    ])
    expect(actions(partyNoPointsFixture)).toEqual(['endTurn'])
  })

  it('REQ-41: recover e adjustDeck são tipos de ação aceitos', () => {
    expect(
      playerStateSchema.safeParse({
        ...partyCreatedFixture.members[0].player,
        availableActions: ['recover', 'adjustDeck'],
      }).success,
    ).toBe(true)
  })
})

describe('REQ-41: usePartyAction com recover', () => {
  it('REQ-41: envia { type: "recover", option } e entrega o Party validado', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:id/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyRecoveredDrawFixture)
      }),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    const action: PartyAction = { type: 'recover', option: 'drawToHand' }
    act(() => result.current.mutate(action))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(body).toEqual({ type: 'recover', option: 'drawToHand' })
    expect(partySchema.safeParse(result.current.data).success).toBe(true)
  })

  it('REQ-41: o handler do MSW responde cada opção com o seu Party pronto', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    const cases = [
      ['drawToHand', partyRecoveredDrawFixture],
      ['shuffleHand', partyRecoveredShuffleHandFixture],
      ['shuffleDiscard', partyRecoveredShuffleDiscardFixture],
    ] as const
    for (const [option, expected] of cases) {
      act(() => result.current.mutate({ type: 'recover', option }))
      await waitFor(() => expect(result.current.data).toEqual(expected))
    }
    expect(partyRecoveredDrawFixture.turn.actionPoints).toBe(2)
    expect(partyRecoveredShuffleHandFixture.members[0].player.hand).toEqual([])
    expect(
      partyRecoveredShuffleHandFixture.members[0].player.attributeDeckCount,
    ).toBe(60)
  })

  it('REQ-41: com 0 pontos, recover e adjustDeck respondem 409 noActionPoints', async () => {
    const { result } = renderHook(
      () => usePartyAction(partyNoPointsFixture.id),
      { wrapper },
    )
    const actions: PartyAction[] = [
      { type: 'recover', option: 'drawToHand' },
      { type: 'adjustDeck', build: currentBuild },
    ]
    for (const action of actions) {
      act(() => result.current.mutate(action))
      await waitFor(() => expect(result.current.isError).toBe(true))
      const error = result.current.error
      expect(error).toBeInstanceOf(ActionNotAllowedError)
      expect((error as ActionNotAllowedError).reason).toBe('noActionPoints')
      act(() => result.current.reset())
    }
  })
})

describe('REQ-42: usePartyAction com adjustDeck', () => {
  it('REQ-42: envia { type: "adjustDeck", build } e entrega o Party', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:id/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyDeckAdjustedFixture)
      }),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() =>
      result.current.mutate({ type: 'adjustDeck', build: currentBuild }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(body).toEqual({ type: 'adjustDeck', build: currentBuild })
  })

  it('REQ-42: o handler do MSW responde a build atual com o Party ajustado', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() =>
      result.current.mutate({ type: 'adjustDeck', build: currentBuild }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyDeckAdjustedFixture)
    expect(partyDeckAdjustedFixture.turn.actionPoints).toBe(2)
    expect(partyDeckAdjustedFixture.members[0].player.build).toEqual(
      currentBuild,
    )
  })

  it('REQ-42: buildBelowMinimum e notOwned viram ActionNotAllowedError com reason e cardId', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    const cases = [
      [
        [
          { cardId: E, copies: 30 },
          { cardId: S, copies: 29 },
        ],
        'buildBelowMinimum',
        undefined,
      ],
      [
        [
          { cardId: E, copies: 30 },
          { cardId: S, copies: 31 },
        ],
        'notOwned',
        S,
      ],
      [
        [...currentBuild, { cardId: 'fixture.dexterity-basic', copies: 1 }],
        'notOwned',
        'fixture.dexterity-basic',
      ],
    ] as const
    for (const [build, reason, cardId] of cases) {
      act(() =>
        result.current.mutate({ type: 'adjustDeck', build: [...build] }),
      )
      await waitFor(() => expect(result.current.isError).toBe(true))
      const error = result.current.error as ActionNotAllowedError
      expect(error).toBeInstanceOf(ActionNotAllowedError)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.code).toBe('ACTION_NOT_ALLOWED')
      expect(error.message).toBe('Esta ação não é permitida agora.')
      expect(error.reason).toBe(reason)
      expect(error.cardId).toBe(cardId)
      act(() => result.current.reset())
    }
    expect(actionBuildBelowMinimumFixture.error.details).toEqual({
      reason: 'buildBelowMinimum',
    })
    expect(actionNotOwnedFixture(S).error.details).toEqual({
      reason: 'notOwned',
      cardId: S,
    })
  })

  it('REQ-42: copyLimitExceeded e tcgFolderFull chegam como vieram', async () => {
    for (const details of [
      { reason: 'copyLimitExceeded', cardId: S },
      { reason: 'tcgFolderFull' },
    ]) {
      server.use(
        http.post('*/parties/:id/actions', () =>
          HttpResponse.json(
            {
              error: {
                code: 'ACTION_NOT_ALLOWED',
                message: 'Esta ação não é permitida agora.',
                details,
              },
            },
            { status: 409 },
          ),
        ),
      )
      const { result } = renderHook(() => usePartyAction(partyId), {
        wrapper,
      })
      act(() =>
        result.current.mutate({ type: 'adjustDeck', build: currentBuild }),
      )
      await waitFor(() => expect(result.current.isError).toBe(true))
      const error = result.current.error as ActionNotAllowedError
      expect(error.reason).toBe(details.reason)
      expect(error.cardId).toBe(details.cardId)
    }
  })

  it('REQ-42: ACTION_NOT_ALLOWED com details fora do contrato vira erro que não é ApiError', async () => {
    server.use(
      http.post('*/parties/:id/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_NOT_ALLOWED',
              message: 'Esta ação não é permitida agora.',
              details: { reason: 'tooTired' },
            },
          },
          { status: 409 },
        ),
      ),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate({ type: 'endTurn' }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-38: endTurn continua respondendo a rodada 2', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate({ type: 'endTurn' }))
    await waitFor(() =>
      expect(result.current.data).toEqual(partyNextRoundFixture),
    )
  })
})
