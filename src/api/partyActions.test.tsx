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
  actionNotAllowedFixture,
  partyCreatedFixture,
  partyInSessionFixture,
  partyMovedToGroveFixture,
  partyMovedToStoneBendFixture,
  partyNotFoundFixture,
  partySessionNotActiveFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'

/** CONTRATO §3 FEAT-07 (v0.28): rota única de ações e `moveTargets`. */

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
