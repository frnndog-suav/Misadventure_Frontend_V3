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
  LabConfigInvalidError,
  labConfigSchema,
  useLabConfig,
  useResetLabConfig,
  useUpdateLabConfig,
} from './labConfig'
import {
  labConfigDefaultsFixture,
  labConfigInvalidFixture,
  labConfigMinAboveMaxFixture,
  labConfigNotIntegerFixture,
  labConfigUpdatedFixture,
  notFoundFixture,
} from '../mocks/fixtures'
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

describe('REQ-06: schema de LabConfig (CONTRATO §3 FEAT-03)', () => {
  it('REQ-06: aceita a fixture dos padrões', () => {
    expect(labConfigSchema.safeParse(labConfigDefaultsFixture).success).toBe(
      true,
    )
  })

  it('REQ-06: rejeita chave ausente em values', () => {
    const values: Partial<typeof labConfigDefaultsFixture.values> = {
      ...labConfigDefaultsFixture.values,
    }
    delete values.actionPointsPerTurn
    expect(
      labConfigSchema.safeParse({ ...labConfigDefaultsFixture, values })
        .success,
    ).toBe(false)
  })

  it('REQ-06: rejeita valor não inteiro', () => {
    expect(
      labConfigSchema.safeParse({
        ...labConfigDefaultsFixture,
        values: { ...labConfigDefaultsFixture.values, initialGold: 2.5 },
      }).success,
    ).toBe(false)
  })

  it('REQ-06: rejeita limite sem min/max', () => {
    expect(
      labConfigSchema.safeParse({
        ...labConfigDefaultsFixture,
        limits: { ...labConfigDefaultsFixture.limits, minPlayers: { min: 1 } },
      }).success,
    ).toBe(false)
  })
})

describe('REQ-06: useLabConfig (GET /lab/config)', () => {
  it('REQ-06: entrega o LabConfig validado', async () => {
    const { result } = renderHook(() => useLabConfig(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(labConfigDefaultsFixture)
  })

  it('REQ-06: erro §1.4 (404 NOT_FOUND) vira ApiError com code e message', async () => {
    server.use(
      http.get('*/lab/config', () =>
        HttpResponse.json(notFoundFixture, { status: 404 }),
      ),
    )
    const { result } = renderHook(() => useLabConfig(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).code).toBe('NOT_FOUND')
    expect(result.current.error?.message).toBe('Recurso não encontrado.')
  })

  it('REQ-06: falha de rede vira erro que não é ApiError', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.error()))
    const { result } = renderHook(() => useLabConfig(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-06: resposta fora do contrato vira erro que não é ApiError', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.json({})))
    const { result } = renderHook(() => useLabConfig(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })
})

describe('REQ-06: useUpdateLabConfig (PATCH /lab/config)', () => {
  it('REQ-06: envia só as chaves pedidas e atualiza o cache de useLabConfig', async () => {
    let sentBody: unknown
    let sentMethod = ''
    server.use(
      http.patch('*/lab/config', async ({ request }) => {
        sentMethod = request.method
        sentBody = await request.json()
        return HttpResponse.json(labConfigUpdatedFixture)
      }),
    )
    const { result } = renderHook(
      () => ({ query: useLabConfig(), update: useUpdateLabConfig() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(() =>
      result.current.update.mutateAsync({ actionPointsPerTurn: 4 }),
    )

    expect(sentMethod).toBe('PATCH')
    expect(sentBody).toEqual({ actionPointsPerTurn: 4 })
    await waitFor(() =>
      expect(result.current.query.data).toEqual(labConfigUpdatedFixture),
    )
  })

  it('REQ-06: 400 LAB_CONFIG_INVALID vira LabConfigInvalidError com message e fields', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigInvalidFixture, { status: 400 }),
      ),
    )
    const { result } = renderHook(() => useUpdateLabConfig(), { wrapper })
    act(() => result.current.mutate({ actionPointsPerTurn: 0 }))
    await waitFor(() => expect(result.current.isError).toBe(true))

    const error = result.current.error
    expect(error).toBeInstanceOf(LabConfigInvalidError)
    expect(error).toBeInstanceOf(ApiError)
    expect(error?.message).toBe('Configuração do laboratório inválida.')
    expect((error as LabConfigInvalidError).fields).toEqual([
      { field: 'actionPointsPerTurn', reason: 'outOfRange' },
      { field: 'foo', reason: 'unknownKey' },
    ])
  })

  it('REQ-06: fields de minAboveMax e notInteger chegam como vieram', async () => {
    for (const fixture of [
      labConfigMinAboveMaxFixture,
      labConfigNotIntegerFixture,
    ]) {
      server.use(
        http.patch('*/lab/config', () =>
          HttpResponse.json(fixture, { status: 400 }),
        ),
      )
      const { result } = renderHook(() => useUpdateLabConfig(), { wrapper })
      act(() => result.current.mutate({}))
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect((result.current.error as LabConfigInvalidError).fields).toEqual(
        fixture.error.details.fields,
      )
    }
  })

  it('REQ-06: LAB_CONFIG_INVALID com details fora do contrato vira erro que não é ApiError', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(
          {
            error: {
              code: 'LAB_CONFIG_INVALID',
              message: 'Configuração do laboratório inválida.',
              details: { fields: [{ field: 'x', reason: 'nope' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderHook(() => useUpdateLabConfig(), { wrapper })
    act(() => result.current.mutate({}))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-06: o cache não muda quando o PATCH falha', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigInvalidFixture, { status: 400 }),
      ),
    )
    const { result } = renderHook(
      () => ({ query: useLabConfig(), update: useUpdateLabConfig() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    act(() => result.current.update.mutate({ actionPointsPerTurn: 0 }))
    await waitFor(() => expect(result.current.update.isError).toBe(true))
    expect(result.current.query.data).toEqual(labConfigDefaultsFixture)
  })
})

describe('REQ-06: formato dos pedidos e invalidBody', () => {
  it('REQ-06: PATCH leva Content-Type JSON; POST de reset vai sem corpo', async () => {
    let patchType: string | null = null
    let resetType: string | null = 'x'
    let resetBody = 'x'
    server.use(
      http.patch('*/lab/config', ({ request }) => {
        patchType = request.headers.get('Content-Type')
        return HttpResponse.json(labConfigUpdatedFixture)
      }),
      http.post('*/lab/config/reset', async ({ request }) => {
        resetType = request.headers.get('Content-Type')
        resetBody = await request.text()
        return HttpResponse.json(labConfigDefaultsFixture)
      }),
    )
    const { result } = renderHook(
      () => ({ update: useUpdateLabConfig(), reset: useResetLabConfig() }),
      { wrapper },
    )
    await act(() => result.current.update.mutateAsync({ initialGold: 5 }))
    await act(() => result.current.reset.mutateAsync())
    expect(patchType).toBe('application/json')
    expect(resetType).toBeNull()
    expect(resetBody).toBe('')
  })

  it('REQ-06: invalidBody com field null é aceito', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(
          {
            error: {
              code: 'LAB_CONFIG_INVALID',
              message: 'Configuração do laboratório inválida.',
              details: { fields: [{ field: null, reason: 'invalidBody' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderHook(() => useUpdateLabConfig(), { wrapper })
    act(() => result.current.mutate({}))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as LabConfigInvalidError).fields).toEqual([
      { field: null, reason: 'invalidBody' },
    ])
  })
})

describe('REQ-06: useResetLabConfig (POST /lab/config/reset)', () => {
  it('REQ-06: envia POST e atualiza o cache com o LabConfig devolvido', async () => {
    let sentMethod = ''
    server.use(
      http.get('*/lab/config', () =>
        HttpResponse.json(labConfigUpdatedFixture),
      ),
      http.post('*/lab/config/reset', ({ request }) => {
        sentMethod = request.method
        return HttpResponse.json(labConfigDefaultsFixture)
      }),
    )
    const { result } = renderHook(
      () => ({ query: useLabConfig(), reset: useResetLabConfig() }),
      { wrapper },
    )
    await waitFor(() =>
      expect(result.current.query.data).toEqual(labConfigUpdatedFixture),
    )

    await act(() => result.current.reset.mutateAsync())

    expect(sentMethod).toBe('POST')
    await waitFor(() =>
      expect(result.current.query.data).toEqual(labConfigDefaultsFixture),
    )
  })

  it('REQ-06: erro §1.4 vira ApiError', async () => {
    server.use(
      http.post('*/lab/config/reset', () =>
        HttpResponse.json(notFoundFixture, { status: 404 }),
      ),
    )
    const { result } = renderHook(() => useResetLabConfig(), { wrapper })
    act(() => result.current.mutate())
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('NOT_FOUND')
  })
})
