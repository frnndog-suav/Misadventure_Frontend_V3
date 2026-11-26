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
  useParties,
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
} from '../mocks/partyFixtures'
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
        members: [{ ...partyIdleFixture.members[0], kind: 'aiHelper' }],
      }).success,
    ).toBe(false)
    const summary: Record<string, unknown> = { ...partiesFixture[0] }
    delete summary.savedAt
    expect(partySummarySchema.safeParse(summary).success).toBe(false)
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
