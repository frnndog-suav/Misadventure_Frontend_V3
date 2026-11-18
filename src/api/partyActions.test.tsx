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

/**
 * CONTRATO §3 FEAT-07 (v0.28): rota única de ações e `moveTargets`; FEAT-08
 * (v0.33): `turn`, `availableActions` e `endTurn`.
 */

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

const partyId = partyInSessionFixture.id
const move = (zoneId: string): PartyAction => ({ type: 'move', zoneId })

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
