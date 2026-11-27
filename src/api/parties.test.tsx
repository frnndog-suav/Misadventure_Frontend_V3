import { completionPartySummaries } from '../mocks/dimensionCompletionFixtures'
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
import {
  PartyInvalidError,
  partiesKey,
  partySchema,
  partySummarySchema,
  useAbandonParty,
  useCreateParty,
  useEndSession,
  usePartyAction,
  usePartyCreationOptions,
  useParties,
  useParty,
  useStartSession,
} from './parties'
import {
  partiesFixture,
  partyBelowMinPlayersFixture,
  partyCreatedFixture,
  partyIdleFixture,
  partyInSessionFixture,
  partyInvalidFieldsFixture,
  partyNotFoundFixture,
  partySessionNotActiveFixture,
  partyWithHelpersFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'
import { useResetLabConfig, useUpdateLabConfig } from './labConfig'

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

const partyId = partyIdleFixture.id

describe('REQ-14: schemas de Party e PartySummary (CONTRATO §3 FEAT-05)', () => {
  it('REQ-14: aceitam as fixtures do contrato', () => {
    expect(partySchema.safeParse(partyCreatedFixture).success).toBe(true)
    expect(partySchema.safeParse(partyInSessionFixture).success).toBe(true)
    for (const summary of partiesFixture) {
      expect(partySummarySchema.safeParse(summary).success).toBe(true)
    }
  })

  it('REQ-14: rejeitam status e kind fora do contrato e campo ausente', () => {
    expect(
      partySchema.safeParse({ ...partyIdleFixture, status: 'paused' }).success,
    ).toBe(false)
    expect(
      partySchema.safeParse({
        ...partyIdleFixture,
        members: [{ ...partyIdleFixture.members[0], kind: 'unknown' }],
      }).success,
    ).toBe(false)
    const summary: Record<string, unknown> = { ...partiesFixture[0] }
    delete summary.savedAt
    expect(partySummarySchema.safeParse(summary).success).toBe(false)
  })
})

it('REQ-103 / REQ-105: reads legacy solo and five helpers', () => {
  const [human] = partySchema.parse(partyIdleFixture).members
  expect(human.kind).toBe('human')
  const helpers = Array.from({ length: 5 }, (_, index) => ({
    ...human,
    id: `helper-${index}`,
    kind: 'aiHelper',
    isHost: false,
  }))
  const party = partySchema.parse({
    ...partyIdleFixture,
    members: [human, ...helpers],
  })
  expect(party.members.filter(({ kind }) => kind === 'aiHelper')).toHaveLength(
    5,
  )
})

it('REQ-102 / REQ-104: applies creation limits and parses automatic turns', async () => {
  const { result } = renderHook(
    () => ({
      options: usePartyCreationOptions(),
      create: useCreateParty(),
      start: useStartSession('fixture.party-with-5-helpers'),
      updateConfig: useUpdateLabConfig(),
      resetConfig: useResetLabConfig(),
      action: usePartyAction('fixture.party-with-5-helpers'),
    }),
    { wrapper },
  )
  await waitFor(() =>
    expect(result.current.options.data).toEqual({
      minPlayers: 1,
      maxPlayers: 6,
    }),
  )
  const request = { name: 'Grupo', characterName: 'Lia' }
  await act(async () => {
    for (const input of [request, { ...request, aiHelperCount: 0 }]) {
      expect(
        (await result.current.create.mutateAsync(input)).members,
      ).toHaveLength(1)
    }
    for (const [count, reason] of [
      [6, 'aboveMaxPlayers'],
      [1.5, 'notInteger'],
      [-1, 'outOfRange'],
    ] as const) {
      await expect(
        result.current.create.mutateAsync({ ...request, aiHelperCount: count }),
      ).rejects.toMatchObject({
        details: { fields: [{ field: 'aiHelperCount', reason }] },
      })
    }
    const party = await result.current.create.mutateAsync({
      ...request,
      aiHelperCount: 5,
    })
    expect(party.members).toHaveLength(6)
    expect(
      party.members.find(({ id }) => id === party.turn.memberId)?.kind,
    ).toBe('aiHelper')
    expect(party.turnOrder).toHaveLength(6)
    const human = party.members.find(({ isHost }) => isHost)
    const session = await result.current.start.mutateAsync()
    expect(session.turn.memberId).toBe(human?.id)
    expect(session.turnOrder).toEqual(party.turnOrder)
    const response = await result.current.action.mutateAsync({
      type: 'endTurn',
      idempotencyKey: 'fd48d1aa-76fb-4ada-953b-97b68e6c0dac',
    })
    expect(response.turn).toMatchObject({ memberId: human?.id, round: 2 })
    expect(response.combatUpdates).toEqual([])
    try {
      await result.current.updateConfig.mutateAsync({ minPlayers: 2 })
      await expect(
        result.current.create.mutateAsync(request),
      ).rejects.toMatchObject({
        details: {
          fields: [{ field: 'aiHelperCount', reason: 'belowMinPlayers' }],
        },
      })
      expect((await result.current.options.refetch()).data?.minPlayers).toBe(2)
    } finally {
      await result.current.resetConfig.mutateAsync()
    }
  })
})

describe('REQ-14: useParties (GET /parties)', () => {
  it('REQ-14: entrega PartySummary[] validado na ordem recebida', async () => {
    const { result } = renderHook(() => useParties(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      ...partiesFixture,
      ...completionPartySummaries,
    ])
  })

  it('REQ-14: lista vazia é válida', async () => {
    server.use(http.get('*/parties', () => HttpResponse.json([])))
    const { result } = renderHook(() => useParties(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('REQ-14: erro §1.4 vira ApiError com a message', async () => {
    server.use(
      http.get('*/parties', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Erro.' } },
          { status: 500 },
        ),
      ),
    )
    const { result } = renderHook(() => useParties(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error?.message).toBe('Erro.')
  })

  it('REQ-14: resposta fora do contrato e falha de rede não são ApiError', async () => {
    server.use(
      http.get('*/parties', () =>
        HttpResponse.json([{ ...partiesFixture[0], status: 'paused' }]),
      ),
    )
    const outOfContract = renderHook(() => useParties(), { wrapper })
    await waitFor(() => expect(outOfContract.result.current.isError).toBe(true))
    expect(outOfContract.result.current.error).not.toBeInstanceOf(ApiError)

    queryClient.clear()
    server.use(http.get('*/parties', () => HttpResponse.error()))
    const network = renderHook(() => useParties(), { wrapper })
    await waitFor(() => expect(network.result.current.isError).toBe(true))
    expect(network.result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-15: useCreateParty (POST /parties)', () => {
  it('REQ-15: envia os textos como digitados e entrega o Party criado', async () => {
    let sent: unknown
    server.use(
      http.post('*/parties', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(partyCreatedFixture, { status: 201 })
      }),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => {
      result.current.mutate({ name: ' Os Teimosos ', characterName: 'Lia' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sent).toEqual({ name: ' Os Teimosos ', characterName: 'Lia' })
    expect(result.current.data).toEqual(partyCreatedFixture)
  })

  it('REQ-15: PARTY_INVALID com details válido vira PartyInvalidError com fields', async () => {
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => {
      result.current.mutate({
        name: '   ',
        characterName: 'Um nome com mais de vinte e quatro letras',
      })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error
    expect(error).toBeInstanceOf(PartyInvalidError)
    expect(error?.message).toBe('Dados do grupo inválidos.')
    expect((error as PartyInvalidError).fields).toEqual(
      partyInvalidFieldsFixture.error.details.fields,
    )
  })

  it('REQ-15: o handler padrão responde belowMinPlayers no cenário "Solo"', async () => {
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => {
      result.current.mutate({ name: 'Solo', characterName: 'Lia' })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as PartyInvalidError).fields).toEqual(
      partyBelowMinPlayersFixture.error.details.fields,
    )
  })

  it('REQ-15: PARTY_INVALID com details fora do contrato vira erro genérico', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(
          {
            error: {
              code: 'PARTY_INVALID',
              message: 'Dados do grupo inválidos.',
              details: { fields: [{ field: 'name', reason: 'ugly' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderHook(() => useCreateParty(), { wrapper })
    act(() => {
      result.current.mutate({ name: 'x', characterName: 'y' })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-16: useStartSession e useEndSession', () => {
  it('REQ-16: Continuar envia POST …/session e entrega o Party em sessão', async () => {
    const { result } = renderHook(() => useStartSession(partyId), { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyInSessionFixture)
  })

  it('REQ-16: grupo desconhecido → 404 PARTY_NOT_FOUND', async () => {
    const { result } = renderHook(() => useStartSession('nope'), { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('PARTY_NOT_FOUND')
    expect(result.current.error?.message).toBe(
      partyNotFoundFixture.error.message,
    )
  })

  it('REQ-16: Encerrar entrega o Party pausado e invalida useParties', async () => {
    queryClient.setQueryData(partiesKey, partiesFixture)
    const { result } = renderHook(() => useEndSession(partyId), { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyIdleFixture)
    expect(queryClient.getQueryState(partiesKey)?.isInvalidated).toBe(true)
  })

  it('REQ-16: 409 PARTY_SESSION_NOT_ACTIVE vira ApiError com a message', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    const { result } = renderHook(() => useEndSession(partyId), { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe(
      'PARTY_SESSION_NOT_ACTIVE',
    )
    expect(result.current.error?.message).toBe(
      'Não há sessão em andamento neste grupo.',
    )
  })
})

describe('REQ-17: useAbandonParty (DELETE /parties/:partyId)', () => {
  it('REQ-17: 204 sem corpo é sucesso e invalida useParties', async () => {
    queryClient.setQueryData(partiesKey, partiesFixture)
    const { result } = renderHook(() => useAbandonParty(), { wrapper })
    act(() => result.current.mutate(partyId))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryState(partiesKey)?.isInvalidated).toBe(true)
  })

  it('REQ-17: 404 PARTY_NOT_FOUND vira ApiError e também invalida useParties', async () => {
    queryClient.setQueryData(partiesKey, partiesFixture)
    const { result } = renderHook(() => useAbandonParty(), { wrapper })
    act(() => result.current.mutate('nope'))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('PARTY_NOT_FOUND')
    expect(queryClient.getQueryState(partiesKey)?.isInvalidated).toBe(true)
  })

  it('REQ-17: falha de rede não é ApiError', async () => {
    server.use(http.delete('*/parties/:partyId', () => HttpResponse.error()))
    const { result } = renderHook(() => useAbandonParty(), { wrapper })
    act(() => result.current.mutate(partyId))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('T-105 / REQ-107 a REQ-109', () => {
  const key = 'df977910-905f-4e5e-855c-181948f563dc'
  const nextKey = 'df977910-905f-4e5e-855c-181948f563dd'
  const route = '*/parties/:partyId'
  const update = {
    type: 'combatTurnStarted',
    combatId: 'combat',
    actorId: 'enemy',
    turnId: 'turn',
    cycle: 1,
  }
  const group = partyWithHelpersFixture(2)
  const event = {
    memberId: group.members[1].id,
    dimensionId: partyInSessionFixture.dimension.dimensionCardId,
    round: 1,
  }
  const events = [
    {
      ...event,
      id: 'e1',
      type: 'turnStarted',
      payload: { zoneId: 'city', actionPoints: 3 },
    },
    {
      ...event,
      id: 'e2',
      type: 'moved',
      payload: { fromZoneId: 'city', traversedZoneIds: ['road', 'forest'] },
    },
    {
      ...event,
      id: 'e3',
      type: 'randomEventStarted',
      payload: { encounterId: 'encounter', zoneId: 'forest' },
    },
    {
      ...event,
      id: 'e4',
      type: 'randomEventRevealed',
      payload: {
        encounterId: 'encounter',
        cardId: 'traveler',
        cardTitle: 'Viajante ferido',
      },
    },
    {
      ...event,
      id: 'e5',
      type: 'randomEventPhaseChanged',
      payload: { encounterId: 'encounter', phase: 'setback' },
    },
    {
      ...event,
      id: 'e6',
      type: 'randomEventEnded',
      payload: {
        encounterId: 'encounter',
        cardId: 'traveler',
        resolution: 'setback',
        cause: 'gaveUp',
      },
    },
    {
      ...event,
      id: 'e7',
      type: 'combatUpdated',
      payload: { update, combatUpdateIndex: 1 },
    },
    { ...event, id: 'e8', type: 'turnEnded', payload: { reason: 'passed' } },
  ]
  const party = {
    ...partyInSessionFixture,
    members: group.members,
    turnOrder: group.turnOrder,
    revision: 4,
  }
  const session = { ...party, domainEvents: events }
  const action = {
    ...session,
    combatUpdates: [{ ...update, actorId: 'human' }, update],
  }

  function clients() {
    return renderHook(
      () => ({
        start: useStartSession(partyId),
        action: usePartyAction(partyId),
        party: useParty(partyId, false),
      }),
      { wrapper },
    ).result
  }

  it('1. abre com lote vazio e consulta a revisão sem lotes', async () => {
    const initial = { ...partyIdleFixture, revision: 1 }
    const opened = { ...party, revision: 2, domainEvents: [] }
    server.use(
      http.get(route, () => HttpResponse.json(initial)),
      http.post(route + '/session', () => HttpResponse.json(opened)),
    )
    const result = clients()
    await act(async () => {
      expect((await result.current.party.refetch()).data).toMatchObject({
        revision: 1,
      })
      expect(await result.current.start.mutateAsync(key)).toMatchObject(opened)
      expect(await result.current.start.mutateAsync(nextKey)).toMatchObject(
        opened,
      )
      server.use(http.get(route, () => HttpResponse.json(opened)))
      const current = (await result.current.party.refetch()).data
      expect(current?.revision).toBe(2)
      expect(current).not.toHaveProperty('domainEvents')
      expect(current).not.toHaveProperty('combatUpdates')
      const humanFirst = {
        ...opened,
        members: group.members,
        turnOrder: group.members.map(({ id }) => id),
      }
      server.use(
        http.post(route + '/session', () => HttpResponse.json(humanFirst)),
      )
      expect(await result.current.start.mutateAsync(nextKey)).toMatchObject({
        turn: { memberId: group.members[0].id },
        revision: 2,
        domainEvents: [],
      })
    })
  })

  it('2. preserva ordem, payloads públicos e índice de combate após a ação humana', async () => {
    server.use(
      http.post(route + '/session', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe(key)
        expect(await request.text()).toBe('')
        expect(request.headers.has('Content-Type')).toBe(false)
        return HttpResponse.json(session)
      }),
      http.post(route + '/actions', () => HttpResponse.json(action)),
    )
    const result = clients()
    await act(async () => {
      const opened = await result.current.start.mutateAsync(key)
      const acted = await result.current.action.mutateAsync({
        type: 'endTurn',
        idempotencyKey: key,
      })
      expect(opened.domainEvents).toMatchObject(events)
      expect(opened.randomEventEncounter).toBeNull()
      expect(opened).not.toHaveProperty('combatUpdates')
      expect(acted.domainEvents).toEqual(opened.domainEvents)
      const combat = acted.domainEvents?.find(
        (event) => event.type === 'combatUpdated',
      )
      expect(combat?.payload.combatUpdateIndex).toBe(1)
      expect(combat?.payload.update).toEqual(acted.combatUpdates?.[1])
      server.use(
        http.post(route + '/actions', () =>
          HttpResponse.json({ ...action, combatUpdates: [update] }),
        ),
      )
      await expect(
        result.current.action.mutateAsync({
          type: 'endTurn',
          idempotencyKey: key,
        }),
      ).rejects.toMatchObject({ name: 'ZodError' })
    })
  })

  it('3. lê ajudantes consecutivos atravessando a virada de rodada', async () => {
    const batch = [
      events[0],
      events[7],
      { ...events[0], id: 'e9', memberId: group.members[2].id, round: 2 },
      { ...events[7], id: 'e10', memberId: group.members[2].id, round: 2 },
    ]
    server.use(
      http.get(route, () => HttpResponse.json({ ...party, revision: 1 })),
      http.post(route + '/actions', () =>
        HttpResponse.json({
          ...action,
          combatUpdates: [],
          domainEvents: batch,
          turn: { ...party.turn, round: 2 },
        }),
      ),
    )
    const result = clients()
    await act(async () => {
      expect((await result.current.party.refetch()).data?.revision).toBe(1)
      const response = await result.current.action.mutateAsync({
        type: 'endTurn',
      })
      expect(response.domainEvents).toEqual(batch)
      expect(response.revision).toBe(4)
      expect(response.turn).toMatchObject({
        round: 2,
        memberId: party.members[0].id,
      })
    })
  })

  it('4. reenvia a chave de abertura sem corpo e preserva o lote recuperado', async () => {
    server.use(
      http.post(route + '/session', () => HttpResponse.error()),
      http.post(route + '/actions', () => HttpResponse.error()),
    )
    const result = clients()
    const intent = { type: 'endTurn', idempotencyKey: key } as const
    await act(async () => {
      await expect(result.current.start.mutateAsync(key)).rejects.toThrow()
      await expect(result.current.action.mutateAsync(intent)).rejects.toThrow()
      server.use(
        http.post(route + '/session', ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe(key)
          return HttpResponse.json(session)
        }),
        http.post(route + '/actions', async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe(key)
          expect(await request.json()).toEqual({ type: 'endTurn' })
          return HttpResponse.json(action)
        }),
      )
      const [first, second, receipt] = await Promise.all([
        result.current.start.mutateAsync(key),
        result.current.start.mutateAsync(key),
        result.current.action.mutateAsync(intent),
      ])
      expect(first).toEqual(second)
      expect(first.revision).toBe(receipt.revision)
      expect(first.domainEvents).toEqual(receipt.domainEvents)
    })
  })

  it('5. expõe o recibo antigo, a revisão superior no GET e o recibo legado zero', async () => {
    server.use(
      http.post(route + '/session', ({ request }) =>
        HttpResponse.json(
          request.headers.get('Idempotency-Key') === key
            ? session
            : { ...party, revision: 5, domainEvents: [] },
        ),
      ),
      http.post(route + '/actions', () =>
        HttpResponse.json({ ...action, revision: 0, domainEvents: [] }),
      ),
      http.get(route, () => HttpResponse.json({ ...party, revision: 5 })),
    )
    const result = clients()
    await act(async () => {
      const old = await result.current.start.mutateAsync(key)
      expect(old.revision).toBe(4)
      expect((await result.current.party.refetch()).data?.revision).toBe(5)
      expect(
        (await result.current.start.mutateAsync(nextKey)).domainEvents,
      ).toEqual([])
      expect(
        await result.current.action.mutateAsync({
          type: 'endTurn',
          idempotencyKey: key,
        }),
      ).toMatchObject({ revision: 0, domainEvents: [] })
    })
  })

  it('6. preserva o contexto da sucessora e permite ler o recibo congelado', async () => {
    const successor = [
      { ...events[7], payload: { reason: 'dimensionChanged' } },
      { ...events[0], dimensionId: 'successor' },
    ]
    const frozen = {
      ...party,
      status: 'frozen',
      members: party.members.map((member) => ({
        ...member,
        player: { ...member.player, availableActions: [] },
      })),
      domainEvents: [{ ...events[7], payload: { reason: 'frozen' } }],
    }
    server.use(
      http.post(route + '/actions', () =>
        HttpResponse.json({
          ...action,
          combatUpdates: [],
          domainEvents: successor,
        }),
      ),
      http.post(route + '/session', ({ request }) =>
        request.headers.get('Idempotency-Key') === key
          ? HttpResponse.json(frozen)
          : HttpResponse.json(
              { error: { code: 'PARTY_FROZEN', message: 'Grupo congelado.' } },
              { status: 409 },
            ),
      ),
    )
    const result = clients()
    await act(async () => {
      expect(
        (await result.current.action.mutateAsync({ type: 'endTurn' }))
          .domainEvents,
      ).toEqual(successor)
      expect(await result.current.start.mutateAsync(key)).toMatchObject(frozen)
      await expect(
        result.current.start.mutateAsync(nextKey),
      ).rejects.toMatchObject({ code: 'PARTY_FROZEN', status: 409 })
    })
  })
})
