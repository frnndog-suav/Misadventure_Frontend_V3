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
import { partySchema, playerStateSchema, usePartyAction } from './parties'
import type { PartyAction } from './parties'
import {
  actionInvalidUnknownActionFixture,
  actionInvalidZoneNotInMapFixture,
  actionNoActionPointsFixture,
  actionNotAllowedFixture,
  partyCreatedFixture,
  partyInSessionFixture,
  partyNextRoundFixture,
  partyNoPointsFixture,
  partyMovedToGroveFixture,
  partyMovedToStoneBendFixture,
  partyNotFoundFixture,
  partySessionNotActiveFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'
import {
  partyEventMinimumFixture,
  partyEventRandomDiscardFixture,
  partyRandomEventReadyFixture,
  partyScavengeWithoutSpaceFixture,
} from '../mocks/randomEventFixtures'
import {
  partyPotionActivatedFixture,
  partyTonicActivatedFixture,
} from '../mocks/effectFixtures'

/**
 * CONTRATO §3 FEAT-07 (v0.28): rota única de ações e `moveTargets`; FEAT-08
 * (v0.33): `turn`, `availableActions` e `endTurn`.
 */

const server = setupServer(...handlers)

it('REQ-57/58 preserves encounter state and the selected hand copy', () => {
  const party = partyInSessionFixture
  const member = party.members[0]!
  const response = {
    ...party,
    randomEventEncounter: null,
    pendingRewards: [],
    members: [
      {
        ...member,
        player: {
          ...member.player,
          handCopies: [{ copyId: 'h2', cardId: 'fixture.strength-basic' }],
          nextTurnActionPointDebt: 1,
          lastRandomEvent: null,
          lastRewardSearch: null,
          lastRewardDelivery: null,
        },
      },
    ],
  }
  expect(partySchema.parse(response)).toMatchObject({
    pendingRewards: [],
    randomEventEncounter: null,
    members: [
      {
        player: {
          handCopies: response.members[0]!.player.handCopies,
          nextTurnActionPointDebt: 1,
        },
      },
    ],
  })
})

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

const partyId = partyInSessionFixture.id
const move = (zoneId: string): PartyAction => ({ type: 'move', zoneId })

it('REQ-58: MSW round-trips a payment by copy ID', async () => {
  const { result } = renderHook(
    () => usePartyAction(partyRandomEventReadyFixture.id),
    { wrapper },
  )
  act(() =>
    result.current.mutate({
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'attrs',
      payment: { handCards: ['h2'] },
    }),
  )
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(
    result.current.data?.members[0]?.player.handCopies.map(
      ({ copyId }) => copyId,
    ),
  ).toEqual(['h1'])
  expect(
    result.current.data?.randomEventEncounter?.payments[0]?.handCards?.[0]
      ?.copyId,
  ).toBe('h2')
})

it('REQ-58: last payment refusal preserves the minimum checks', async () => {
  const { result } = renderHook(
    () => usePartyAction(partyEventMinimumFixture.id),
    { wrapper },
  )
  act(() =>
    result.current.mutate({
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'vigor',
    }),
  )
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.error).toMatchObject({
    reason: 'eventMinimumNotMet',
    checks: [
      { requirementId: 'min-vigor', stat: 'vigor', minimum: 5, actual: 4 },
    ],
  })
})

it('REQ-59: MSW returns the pending and left dispositions for Vasculhar', async () => {
  const { result } = renderHook(
    () => usePartyAction(partyScavengeWithoutSpaceFixture.id),
    { wrapper },
  )
  act(() =>
    result.current.mutate({ type: 'scavenge', cardId: 'fixture.silver-fish' }),
  )
  await waitFor(() =>
    expect(result.current.data?.pendingRewards[0]?.id).toBe('r1'),
  )
  expect(result.current.data?.turn.actionPoints).toBe(0)
  expect(result.current.data?.members[0]?.player.lastScavenge?.delivery).toBe(
    'pending',
  )
  act(() =>
    result.current.mutate({
      type: 'resolveReward',
      rewardId: 'r1',
      choice: 'leave',
    }),
  )
  await waitFor(() =>
    expect(result.current.data?.members[0]?.player.lastScavenge?.delivery).toBe(
      'left',
    ),
  )
  expect(result.current.data?.pendingRewards).toEqual([])
  expect(
    result.current.data?.members[0]?.player.lastRewardDelivery?.disposition,
  ).toBe('returnedToDeck')
})

it('REQ-58: random discard accepts a part without payment and returns the drawn copy', async () => {
  const { result } = renderHook(
    () => usePartyAction(partyEventRandomDiscardFixture.id),
    { wrapper },
  )
  act(() =>
    result.current.mutate({
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'discard',
    }),
  )
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  const encounter = result.current.data?.randomEventEncounter
  expect(encounter?.requirements[0]).toMatchObject({
    status: 'partial',
    remaining: { copies: 1 },
    handCardSelection: 'random',
    eligibleHandCopyIds: [],
  })
  expect(encounter?.payments[0]?.handCards?.[0]?.copyId).toBe('h2')
})

describe('REQ-34: PlayerState.moveTargets', () => {
  it('REQ-34: as fixtures do Party trazem moveTargets válidos', () => {
    const player = partyInSessionFixture.members[0].player
    expect(playerStateSchema.safeParse(player).success).toBe(true)
    expect(player.moveTargets).toEqual([
      'fixture.stone-bend',
      'fixture.whispering-grove',
    ])
  })

  it('REQ-34: jogador sem moveTargets ou com item não texto é fora do contrato', () => {
    const withoutTargets: Record<string, unknown> = {
      ...partyCreatedFixture.members[0].player,
    }
    delete withoutTargets.moveTargets
    expect(playerStateSchema.safeParse(withoutTargets).success).toBe(false)
    expect(
      playerStateSchema.safeParse({
        ...partyCreatedFixture.members[0].player,
        moveTargets: [3],
      }).success,
    ).toBe(false)
  })
})

describe('REQ-35: usePartyAction (POST /parties/:partyId/actions)', () => {
  it.each([
    ['fixture.healing-potion', partyPotionActivatedFixture],
    ['fixture.strength-tonic', partyTonicActivatedFixture],
  ] as const)(
    'REQ-54: MSW entrega estado pronto para %s com zero pontos',
    async (cardId, expected) => {
      const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
      act(() =>
        result.current.mutate({
          type: 'prepare',
          operation: 'activate',
          cardId,
          effectIndex: 0,
        }),
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(expected)
    },
  )

  it('REQ-54: recusa de efeito não executado preserva motivo e mensagem', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() =>
      result.current.mutate({
        type: 'prepare',
        operation: 'activate',
        cardId: 'fixture.lucky-coin',
        effectIndex: 0,
      }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      code: 'ACTION_NOT_ALLOWED',
      reason: 'notActivatableYet',
      message: 'Este efeito ainda não pode ser ativado.',
    })
    expect(result.current.data).toBeUndefined()
  })
  it.each([
    undefined,
    { handCards: ['fixture.strength-basic', 'fixture.strength-basic'] },
  ])(
    'REQ-54: envia activate preservando pagamento por cópia: %j',
    async (payment) => {
      let body: unknown
      server.use(
        http.post('*/parties/:id/actions', async ({ request }) => {
          body = await request.json()
          return HttpResponse.json(partyNoPointsFixture)
        }),
      )
      const action: PartyAction = {
        type: 'prepare',
        operation: 'activate',
        cardId: 'fixture.focus-amulet',
        effectIndex: 2,
        ...(payment ? { payment } : {}),
      }
      const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
      act(() => result.current.mutate(action))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(body).toEqual(action)
      expect(result.current.data).toEqual(partyNoPointsFixture)
    },
  )

  it('REQ-54: preserva ACTION_INVALID com notObject e caminho de payment', async () => {
    server.use(
      http.post('*/parties/:id/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_INVALID',
              message: 'Pagamento inválido.',
              details: { fields: [{ field: 'payment', reason: 'notObject' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() =>
      result.current.mutate({
        type: 'prepare',
        operation: 'activate',
        cardId: 'fixture.focus-amulet',
        effectIndex: 2,
      }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({
      code: 'ACTION_INVALID',
      details: { fields: [{ field: 'payment', reason: 'notObject' }] },
    })
  })

  it('REQ-35: envia { type: "move", zoneId } e entrega o Party validado', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:id/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyMovedToStoneBendFixture)
      }),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate(move('fixture.stone-bend')))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(body).toEqual({ type: 'move', zoneId: 'fixture.stone-bend' })
    expect(partySchema.safeParse(result.current.data).success).toBe(true)
    expect(result.current.data?.members[0].player.zoneId).toBe(
      'fixture.stone-bend',
    )
  })

  it('REQ-35: o handler do MSW responde por tabela de cenários, um Party por destino', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate(move('fixture.whispering-grove')))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyMovedToGroveFixture)

    act(() => result.current.mutate(move('fixture.stone-bend')))
    await waitFor(() =>
      expect(result.current.data).toEqual(partyMovedToStoneBendFixture),
    )

    act(() => result.current.mutate(move('fixture.gray-harbor')))
    await waitFor(() =>
      expect(result.current.data).toEqual(partyInSessionFixture),
    )
  })

  it('REQ-35: 409 ACTION_NOT_ALLOWED vira ApiError com a message', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate(move('fixture.old-mine')))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('ACTION_NOT_ALLOWED')
    expect(result.current.error?.message).toBe(
      actionNotAllowedFixture.error.message,
    )
  })

  it('REQ-35: 400 ACTION_INVALID (zona fora do mapa e ação desconhecida) vira ApiError', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate(move('fixture.nowhere')))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('ACTION_INVALID')
    expect(result.current.error?.message).toBe(
      actionInvalidZoneNotInMapFixture.error.message,
    )
    expect(actionInvalidUnknownActionFixture.error.code).toBe('ACTION_INVALID')
  })

  it('REQ-35: 404 PARTY_NOT_FOUND e 409 PARTY_SESSION_NOT_ACTIVE vêm como ApiError', async () => {
    const missing = renderHook(() => usePartyAction('outro-grupo'), {
      wrapper,
    })
    act(() => missing.result.current.mutate(move('fixture.stone-bend')))
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).message).toBe(
      partyNotFoundFixture.error.message,
    )

    server.use(
      http.post('*/parties/:id/actions', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    const idle = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => idle.result.current.mutate(move('fixture.stone-bend')))
    await waitFor(() => expect(idle.result.current.isError).toBe(true))
    expect((idle.result.current.error as ApiError).code).toBe(
      'PARTY_SESSION_NOT_ACTIVE',
    )
  })

  it('REQ-35: resposta fora do contrato vira erro que não é ApiError', async () => {
    server.use(
      http.post('*/parties/:id/actions', () =>
        HttpResponse.json({ id: partyId }),
      ),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate(move('fixture.stone-bend')))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-36: Party.turn', () => {
  it('REQ-36: as fixtures do Party trazem turn válido (rodada 1, 3 pontos, vez do 1º de turnOrder)', () => {
    expect(partySchema.safeParse(partyInSessionFixture).success).toBe(true)
    expect(partyInSessionFixture.turn).toEqual({
      round: 1,
      memberId: partyInSessionFixture.turnOrder[0],
      actionPoints: 3,
    })
    expect(partyMovedToStoneBendFixture.turn.actionPoints).toBe(2)
    expect(partyMovedToGroveFixture.turn.actionPoints).toBe(2)
  })

  it('REQ-36: Party sem turn, ou com rodada/pontos fora do contrato, é inválido', () => {
    const withoutTurn: Record<string, unknown> = { ...partyCreatedFixture }
    delete withoutTurn.turn
    expect(partySchema.safeParse(withoutTurn).success).toBe(false)
    const turn = partyCreatedFixture.turn
    for (const bad of [
      { ...turn, round: 1.5 },
      { ...turn, actionPoints: -1 },
      { ...turn, memberId: 7 },
    ]) {
      expect(
        partySchema.safeParse({ ...partyCreatedFixture, turn: bad }).success,
      ).toBe(false)
    }
  })
})

describe('REQ-37: PlayerState.availableActions', () => {
  it('REQ-37: as fixtures trazem availableActions na ordem do contrato', () => {
    const actions = (party: typeof partyInSessionFixture) =>
      party.members[0].player.availableActions
    // FEAT-09 (CONTRATO v0.37): recover e adjustDeck entre move e endTurn
    const full = ['move', 'recover', 'adjustDeck', 'endTurn']
    // FEAT-32 (CONTRATO v0.46): useVault na cidade, antes de endTurn
    expect(actions(partyInSessionFixture)).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'useVault',
      'endTurn',
    ])
    expect(actions(partyMovedToStoneBendFixture)).toEqual(full)
    expect(actions(partyNoPointsFixture)).toEqual(['endTurn'])
    expect(partyNoPointsFixture.turn.actionPoints).toBe(0)
  })

  it('REQ-37: jogador sem availableActions ou com ação desconhecida é fora do contrato', () => {
    const player = partyCreatedFixture.members[0].player
    const withoutActions: Record<string, unknown> = { ...player }
    delete withoutActions.availableActions
    expect(playerStateSchema.safeParse(withoutActions).success).toBe(false)
    expect(
      playerStateSchema.safeParse({ ...player, availableActions: ['fly'] })
        .success,
    ).toBe(false)
    expect(
      playerStateSchema.safeParse({ ...player, availableActions: [] }).success,
    ).toBe(true)
  })
})

describe('REQ-38: usePartyAction com endTurn', () => {
  it('REQ-38: envia { type: "endTurn" } e entrega o Party da rodada 2 com pontos cheios', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:id/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyNextRoundFixture)
      }),
    )
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    const action: PartyAction = { type: 'endTurn' }
    act(() => result.current.mutate(action))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(body).toEqual({ type: 'endTurn' })
    expect(result.current.data?.turn).toEqual({
      round: 2,
      memberId: partyInSessionFixture.turnOrder[0],
      actionPoints: 3,
    })
  })

  it('REQ-38: o handler do MSW responde endTurn com o Party da rodada 2', async () => {
    const { result } = renderHook(() => usePartyAction(partyId), { wrapper })
    act(() => result.current.mutate({ type: 'endTurn' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyNextRoundFixture)
  })

  it('REQ-37: com 0 pontos, o handler responde move 409 noActionPoints e endTurn 200', async () => {
    const noPoints = renderHook(() => usePartyAction(partyNoPointsFixture.id), {
      wrapper,
    })
    act(() => noPoints.result.current.mutate(move('fixture.gray-harbor')))
    await waitFor(() => expect(noPoints.result.current.isError).toBe(true))
    const error = noPoints.result.current.error as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('ACTION_NOT_ALLOWED')
    expect(error.message).toBe(actionNoActionPointsFixture.error.message)
    expect(error.details).toEqual({ reason: 'noActionPoints' })

    act(() => noPoints.result.current.mutate({ type: 'endTurn' }))
    await waitFor(() => expect(noPoints.result.current.isSuccess).toBe(true))
    expect(noPoints.result.current.data?.turn.round).toBe(2)
  })
})
it('REQ-57: MSW preserves the revealed encounter on reload and blocks another start', async () => {
  const id = 'party-evento-revelado'
  const { result } = renderHook(() => usePartyAction(id), { wrapper })
  await act(async () => {
    await expect(
      result.current.mutateAsync({ type: 'startEvent' }),
    ).rejects.toMatchObject({
      code: 'ACTION_NOT_ALLOWED',
      details: { reason: 'choicePending' },
    })
  })
  const response = await fetch('http://localhost:3000/parties/' + id)
  expect(
    partySchema.parse(await response.json()).randomEventEncounter,
  ).toMatchObject({
    id: 'e1',
    phase: 'encounter',
    decisionDeadlineAt: null,
  })
})

it.each([
  [
    'party-evento-minimo-ok',
    { type: 'resolveEvent', encounterId: 'e1' },
    { resolution: 'success', replacement: { requested: 0, drawn: 0 } },
  ],
  [
    'party-evento-fuga-ok',
    { type: 'escapeEvent', encounterId: 'e1' },
    { resolution: 'escaped', escape: { naturalRoll: 11, succeeded: true } },
  ],
  [
    'party-evento-vigor-ok',
    { type: 'payEventRequirement', encounterId: 'e1', requirementId: 'vigor' },
    {
      resolution: 'success',
      payments: expect.arrayContaining([{ requirementId: 'vigor', vigor: 3 }]),
    },
  ],
  [
    'party-evento-descarte-ok',
    {
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'discard',
    },
    { resolution: 'success', replacement: { requested: 2, drawn: 2 } },
  ],
] satisfies [string, PartyAction, object][])(
  'REQ-58: resolves %s',
  async (id, action, expected) => {
    const { result } = renderHook(() => usePartyAction(id), { wrapper })
    await act(async () => {
      const party = await result.current.mutateAsync(action)
      expect(party.randomEventEncounter).toBeNull()
      expect(party.members[0]?.player.lastRandomEvent).toMatchObject(expected)
    })
  },
)

it.each([
  ['party-evento-antecipacao', { type: 'endTurn' }, 'choicePending'],
  ['party-evento-sem-deck', { type: 'startEvent' }, 'eventDeckEmpty'],
  [
    'party-evento-sem-fuga',
    { type: 'escapeEvent', encounterId: 'e1' },
    'escapeForbidden',
  ],
  [
    'party-evento-sem-vigor',
    { type: 'escapeEvent', encounterId: 'e1' },
    'notEnoughVigor',
  ],
  [
    'party-evento-parcial',
    { type: 'escapeEvent', encounterId: 'e1' },
    'eventPaymentStarted',
  ],
  [
    'party-evento-consumivel-apos-parte',
    {
      type: 'prepare',
      operation: 'activate',
      cardId: 'fixture.healing-potion',
      effectIndex: 0,
    },
    'eventPaymentStarted',
  ],
  [
    'party-evento-esquiva-baixa',
    { type: 'resolveEvent', encounterId: 'e1' },
    'eventMinimumNotMet',
  ],
  [
    'party-evento-copia-recusada',
    {
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'attrs',
      payment: { handCards: ['h2'] },
    },
    'eventMinimumNotMet',
  ],
] satisfies [string, PartyAction, string][])(
  'REQ-57/58: preserves %s on refusal %j',
  async (id, action, reason) => {
    const url = 'http://localhost:3000/parties/' + id
    const before = partySchema.parse(await (await fetch(url)).json())
    const { result } = renderHook(() => usePartyAction(id), { wrapper })
    await act(async () => {
      await expect(result.current.mutateAsync(action)).rejects.toMatchObject({
        code: 'ACTION_NOT_ALLOWED',
        details: { reason },
      })
    })
    expect(partySchema.parse(await (await fetch(url)).json())).toEqual(before)
  },
)

it.each([
  [
    'party-vasculhar-pilha',
    { type: 'scavenge', cardId: 'fixture.iron-ore' },
    { lastScavenge: { found: true, delivery: 'inventory' } },
  ],
  [
    'party-vasculhar-vazio',
    { type: 'scavenge', cardId: 'fixture.iron-ore' },
    { lastScavenge: { found: false, delivery: 'none' } },
  ],
  [
    'party-evento-busca-vazia',
    { type: 'resolveEvent', encounterId: 'e1' },
    { lastRewardSearch: { found: false } },
  ],
  [
    'party-evento-premio-fixo',
    { type: 'resolveReward', rewardId: 'r1', choice: 'leave' },
    { lastRewardDelivery: { disposition: 'sentToLimbo' } },
  ],
  [
    'party-evento-premio-reserva',
    { type: 'resolveReward', rewardId: 'r2', choice: 'leave' },
    { lastRewardDelivery: { disposition: 'removed' } },
  ],
  [
    'party-evento-premio-urbano',
    { type: 'resolveReward', rewardId: 'r1', choice: 'leave' },
    { lastRewardDelivery: { disposition: 'returnedToDeck' } },
  ],
] satisfies [string, PartyAction, object][])(
  'REQ-59: returns reward disposition for %s',
  async (id, action, expected) => {
    const { result } = renderHook(() => usePartyAction(id), { wrapper })
    await act(async () => {
      const party = await result.current.mutateAsync(action)
      expect(party.pendingRewards).toEqual([])
      expect(party.members[0]?.player).toMatchObject(expected)
    })
  },
)

it('REQ-59: a full slot must be freed before presenting the reserve reward', async () => {
  const { result } = renderHook(
    () => usePartyAction('party-evento-premio-urbano'),
    { wrapper },
  )
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        type: 'resolveReward',
        rewardId: 'r1',
        choice: 'keep',
        discard: [],
      }),
    ).rejects.toMatchObject({
      details: { reason: 'rewardDoesNotFit' },
    })
    const party = await result.current.mutateAsync({
      type: 'resolveReward',
      rewardId: 'r1',
      choice: 'keep',
      discard: [{ cardId: 'fixture.silver-fish', copies: 1 }],
    })
    expect(party.pendingRewards).toMatchObject([
      { id: 'r2', origin: { type: 'reserveDeck' } },
    ])
  })
})
it.each([
  [
    'party-evento-aleatorio',
    { type: 'startEvent' },
    {
      turn: { actionPoints: 0 },
      randomEventEncounter: { phase: 'anticipation', card: null },
    },
  ],
  [
    'party-evento-antecipacao',
    { type: 'revealEvent', encounterId: 'e1' },
    {
      randomEventEncounter: {
        phase: 'encounter',
        card: { type: 'randomEvent' },
      },
    },
  ],
  [
    'party-evento-consumivel',
    {
      type: 'prepare',
      operation: 'activate',
      cardId: 'fixture.healing-potion',
      effectIndex: 0,
    },
    {
      turn: { actionPoints: 0 },
      randomEventEncounter: { payments: [] },
      members: [
        {
          player: {
            health: 15,
            inventory: [{ cardId: 'fixture.healing-potion', quantity: 1 }],
          },
        },
      ],
    },
  ],
  [
    'party-evento-pagamento',
    {
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'attrs',
      payment: { handCards: ['h1'] },
    },
    {
      randomEventEncounter: {
        payments: [
          {
            requirementId: 'attrs',
            handCards: [{ copyId: 'h1', cardId: 'fixture.strength-dexterity' }],
          },
        ],
      },
    },
  ],
  [
    'party-evento-atributos-pagos',
    { type: 'payEventRequirement', encounterId: 'e1', requirementId: 'gold' },
    {
      members: [{ player: { gold: 10, vigor: 7, handCopies: [] } }],
      randomEventEncounter: {
        payments: [
          { requirementId: 'attrs' },
          { requirementId: 'gold', gold: 10 },
        ],
      },
    },
  ],
  [
    'party-evento-minimo',
    { type: 'giveUpEvent', encounterId: 'e1' },
    {
      randomEventEncounter: null,
      members: [
        {
          player: {
            gold: 10,
            lastRandomEvent: {
              cause: 'gaveUp',
              peakDelta: -1,
              replacement: { requested: 1, drawn: 1 },
            },
          },
        },
      ],
    },
  ],
  [
    'party-evento-fuga-sem-pa',
    { type: 'escapeEvent', encounterId: 'e1' },
    {
      turn: { actionPoints: 0 },
      members: [
        {
          player: {
            vigor: 4,
            nextTurnActionPointDebt: 1,
            lastRandomEvent: {
              escape: { naturalRoll: 10, threshold: 10, succeeded: false },
            },
          },
        },
      ],
    },
  ],
  [
    'party-evento-fuga-com-pa',
    { type: 'escapeEvent', encounterId: 'e1' },
    {
      turn: { actionPoints: 0 },
      members: [
        {
          player: {
            vigor: 4,
            nextTurnActionPointDebt: 0,
            lastRandomEvent: { escape: { actionPointsLost: 1 } },
          },
        },
      ],
    },
  ],
  [
    'party-evento-divida',
    { type: 'endTurn' },
    {
      turn: { round: 2, actionPoints: 2 },
      members: [{ player: { nextTurnActionPointDebt: 0 } }],
    },
  ],
  [
    'party-evento-compra',
    { type: 'resolveEvent', encounterId: 'e1' },
    {
      randomEventEncounter: { phase: 'success' },
      pendingRewards: [
        { id: 'r1', origin: { type: 'rewardDeck', zoneType: 'urban' } },
      ],
    },
  ],
] satisfies [string, PartyAction, object][])(
  'REQ-57/58/59: returns the contracted snapshot for %s',
  async (id, action, expected) => {
    const { result } = renderHook(() => usePartyAction(id), { wrapper })
    await act(async () => {
      expect(await result.current.mutateAsync(action)).toMatchObject(expected)
    })
  },
)
it('REQ-58: a refused random discard leaves the accepted receipt and savedAt intact', async () => {
  const id = 'party-evento-descarte-parcial'
  const readSave = async () =>
    partySchema.parse(
      await (await fetch('http://localhost:3000/parties/' + id)).json(),
    )
  const before = await readSave()
  const { result } = renderHook(() => usePartyAction(id), { wrapper })
  await act(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(
        result.current.mutateAsync({
          type: 'payEventRequirement',
          encounterId: 'e1',
          requirementId: 'discard',
        }),
      ).rejects.toMatchObject({
        details: {
          reason: 'eventMinimumNotMet',
          checks: [
            {
              requirementId: 'min-vigor',
              stat: 'vigor',
              minimum: 5,
              actual: 4,
            },
          ],
        },
      })
    }
  })
  const after = await readSave()
  expect(after).toEqual(before)
  expect(
    after.members[0]?.player.handCopies.map(({ copyId }) => copyId),
  ).toEqual(['h1', 'h3'])
  expect(after.randomEventEncounter?.payments).toMatchObject([
    { handCards: [{ copyId: 'h2' }] },
  ])
})
