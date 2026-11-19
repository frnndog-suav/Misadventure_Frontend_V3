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
  ContentInvalidError,
  collectionExportSchema,
  editorCardSchema,
  editorCardSummarySchema,
  editorCollectionSchema,
  editorCollectionSummarySchema,
  editorKey,
  useCreateCard,
  useCreateCollection,
  useDeleteCard,
  useDeleteCollection,
  useDuplicateCard,
  useEditorCard,
  useEditorCards,
  useEditorCollection,
  useEditorCollections,
  useExportCollection,
  useImportCollection,
  usePublishCard,
  useSaveCard,
  useUpdateCollection,
  useValidateDimension,
  type CardInput,
} from './editor'
import { handlers } from '../mocks/handlers'
import {
  bosqueCollectionFixture,
  bosqueExportFixture,
  bosqueRenamedFixture,
  bosqueCardsDraftFixture,
  bosqueCardsSearchFixture,
  cardIdTakenFixture,
  cardNotFoundFixture,
  collectionIdTakenFixture,
  collectionInvalidFixture,
  contentLockedFixture,
  editorCollectionsFixture,
  fixtureCardSummariesFixture,
  fixtureCollectionFixture,
  fixtureDimensionFixture,
  forcaBrutaCopyFixture,
  forcaBrutaDraftFixture,
  forcaBrutaPublishedFixture,
  forcaBrutaRenamedFixture,
  forcaDraftFixture,
  forcaSorteInvalidFixture,
  importIdTakenFixture,
  importInvalidFixture,
  importResultFixture,
  unknownCardTypeFixture,
} from '../mocks/editorFixtures'
import {
  editorClassSchema,
  editorClassSummarySchema,
  useCreateClass,
  useDeleteClass,
  useEditorClass,
  useEditorClasses,
  usePublishClass,
  useSaveClass,
  type ClassInput,
} from './editor'
import {
  bosqueClassSummariesFixture,
  bosqueDimensionFixture,
  classIdTakenFixture,
  classNotFoundFixture,
  contentReferencedFixture,
  fixtureClassSummariesFixture,
  fixtureEditorClassesFixture,
  fixtureExportFixture,
  mageDraftFixture,
  mageInput,
  magePublishInvalidFixture,
} from '../mocks/editorFixtures'
import { warriorClassFixture } from '../mocks/classFixtures'

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

/** Marca uma consulta do editor no cache para conferir a invalidação. */
function seedEditorCache() {
  queryClient.setQueryData([...editorKey, 'collections'], [])
}

function editorCacheInvalidated(): boolean | undefined {
  return queryClient.getQueryState([...editorKey, 'collections'])?.isInvalidated
}

const forcaInput: CardInput = {
  slug: 'forca',
  type: 'attribute',
  name: 'Força',
  flavorText: null,
  rarity: 'common',
  attributeKind: 'basic',
  attributes: ['strength'],
  effects: [],
}

describe('REQ-19: schemas do editor (CONTRATO §3 FEAT-31)', () => {
  it('REQ-19: aceitam as fixtures do contrato', () => {
    for (const summary of editorCollectionsFixture) {
      expect(editorCollectionSummarySchema.safeParse(summary).success).toBe(
        true,
      )
    }
    expect(
      editorCollectionSchema.safeParse(fixtureCollectionFixture).success,
    ).toBe(true)
    expect(
      editorCollectionSchema.safeParse(bosqueCollectionFixture).success,
    ).toBe(true)
    expect(editorCardSchema.safeParse(forcaDraftFixture).success).toBe(true)
    for (const summary of fixtureCardSummariesFixture) {
      expect(editorCardSummarySchema.safeParse(summary).success).toBe(true)
    }
    expect(collectionExportSchema.safeParse(bosqueExportFixture).success).toBe(
      true,
    )
  })

  it('REQ-19: rejeitam status, contagem e tipo fora do contrato', () => {
    expect(
      editorCardSchema.safeParse({ ...forcaDraftFixture, status: 'archived' })
        .success,
    ).toBe(false)
    expect(
      editorCollectionSummarySchema.safeParse({
        ...editorCollectionsFixture[0],
        draftCount: -1,
      }).success,
    ).toBe(false)
    expect(
      editorCardSummarySchema.safeParse({
        ...fixtureCardSummariesFixture[0],
        type: 'monster',
      }).success,
    ).toBe(false)
  })

  it('REQ-26: export sem `classes` é lido como []; formatVersion diferente de 1 é recusado', () => {
    const withoutClasses: Record<string, unknown> = { ...bosqueExportFixture }
    delete withoutClasses.classes
    const parsed = collectionExportSchema.safeParse(withoutClasses)
    expect(parsed.success && parsed.data.classes).toEqual([])
    expect(
      collectionExportSchema.safeParse({
        ...bosqueExportFixture,
        formatVersion: 2,
      }).success,
    ).toBe(false)
  })
})

describe('REQ-19: coleções', () => {
  it('REQ-19: useEditorCollections entrega a lista validada', async () => {
    const { result } = renderHook(() => useEditorCollections(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(editorCollectionsFixture)
  })

  it('REQ-19: useEditorCollection entrega a coleção com contagens e tags', async () => {
    const { result } = renderHook(() => useEditorCollection('fixture'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixtureCollectionFixture)
  })

  it('REQ-19: useEditorCollection(null) não consulta (nenhuma coleção escolhida)', () => {
    const { result } = renderHook(() => useEditorCollection(null), {
      wrapper,
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isPending).toBe(true)
  })

  it('REQ-19: coleção desconhecida → 404 COLLECTION_NOT_FOUND', async () => {
    const { result } = renderHook(() => useEditorCollection('nope'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ApiError).code).toBe('COLLECTION_NOT_FOUND')
    expect(result.current.error?.message).toBe('Coleção não encontrada.')
  })

  it('REQ-19: resposta fora do contrato e falha de rede não são ApiError', async () => {
    server.use(
      http.get('*/lab/content/collections', () =>
        HttpResponse.json([{ id: 'x' }]),
      ),
    )
    const outOfContract = renderHook(() => useEditorCollections(), { wrapper })
    await waitFor(() => expect(outOfContract.result.current.isError).toBe(true))
    expect(outOfContract.result.current.error).not.toBeInstanceOf(ApiError)

    queryClient.clear()
    server.use(
      http.get('*/lab/content/collections', () => HttpResponse.error()),
    )
    const network = renderHook(() => useEditorCollections(), { wrapper })
    await waitFor(() => expect(network.result.current.isError).toBe(true))
    expect(network.result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-19: criar envia o corpo como digitado, entrega a coleção e invalida o editor', async () => {
    let sent: unknown
    server.use(
      http.post('*/lab/content/collections', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(bosqueCollectionFixture, { status: 201 })
      }),
    )
    seedEditorCache()
    const { result } = renderHook(() => useCreateCollection(), { wrapper })
    const input = {
      id: 'bosque',
      name: 'Bosque Sombrio',
      description: 'Coleção de teste do editor.',
    }
    act(() => result.current.mutate(input))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sent).toEqual(input)
    expect(result.current.data).toEqual(bosqueCollectionFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-19 / D-38: CONTENT_INVALID vira ContentInvalidError com fields', async () => {
    const { result } = renderHook(() => useCreateCollection(), { wrapper })
    act(() =>
      result.current.mutate({ id: 'Bosque X', name: ' ', description: '' }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error
    expect(error).toBeInstanceOf(ContentInvalidError)
    expect((error as ContentInvalidError).code).toBe('CONTENT_INVALID')
    expect(error?.message).toBe('Conteúdo inválido.')
    expect((error as ContentInvalidError).fields).toEqual(
      collectionInvalidFixture.error.details.fields,
    )
  })

  it('REQ-19 / D-38: CONTENT_ID_TAKEN vira ContentInvalidError com o code próprio', async () => {
    const { result } = renderHook(() => useCreateCollection(), { wrapper })
    act(() =>
      result.current.mutate({ id: 'fixture', name: 'Outra', description: '' }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as ContentInvalidError
    expect(error).toBeInstanceOf(ContentInvalidError)
    expect(error.code).toBe('CONTENT_ID_TAKEN')
    expect(error.message).toBe('Este identificador já está em uso.')
    expect(error.fields).toEqual(collectionIdTakenFixture.error.details.fields)
  })

  it('REQ-19: CONTENT_INVALID com details fora do contrato vira erro genérico', async () => {
    server.use(
      http.post('*/lab/content/collections', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields: [{ field: 'id', reason: 'blank' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const { result } = renderHook(() => useCreateCollection(), { wrapper })
    act(() => result.current.mutate({ id: 'x', name: 'x', description: '' }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ApiError)
  })

  it('REQ-19: editar envia PATCH só com o que muda e invalida o editor', async () => {
    let sent: unknown
    let method = ''
    server.use(
      http.patch(
        '*/lab/content/collections/:collectionId',
        async ({ request }) => {
          method = request.method
          sent = await request.json()
          return HttpResponse.json(bosqueRenamedFixture)
        },
      ),
    )
    seedEditorCache()
    const { result } = renderHook(() => useUpdateCollection(), { wrapper })
    act(() =>
      result.current.mutate({
        collectionId: 'bosque',
        patch: { name: 'Bosque Antigo' },
      }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(method).toBe('PATCH')
    expect(sent).toEqual({ name: 'Bosque Antigo' })
    expect(result.current.data).toEqual(bosqueRenamedFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-19: excluir aceita 204 e invalida o editor; 409 CONTENT_IN_USE vira ApiError', async () => {
    seedEditorCache()
    const { result } = renderHook(() => useDeleteCollection(), { wrapper })
    act(() => result.current.mutate('bosque'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(editorCacheInvalidated()).toBe(true)

    server.use(
      http.delete('*/lab/content/collections/:collectionId', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_IN_USE',
              message:
                'Este conteúdo é usado por algum save e não pode ser apagado.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    const inUse = renderHook(() => useDeleteCollection(), { wrapper })
    act(() => inUse.result.current.mutate('bosque'))
    await waitFor(() => expect(inUse.result.current.isError).toBe(true))
    expect((inUse.result.current.error as ApiError).code).toBe('CONTENT_IN_USE')
  })
})

describe('REQ-20: cartas da coleção', () => {
  it('REQ-20: sem filtros, a lista vem sem query string', async () => {
    let url = ''
    server.use(
      http.get(
        '*/lab/content/collections/:collectionId/cards',
        ({ request }) => {
          url = request.url
          return HttpResponse.json(fixtureCardSummariesFixture)
        },
      ),
    )
    const { result } = renderHook(() => useEditorCards('fixture', {}), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(url).search).toBe('')
    expect(result.current.data).toEqual(fixtureCardSummariesFixture)
  })

  it('REQ-20: os filtros vão como type, status e q; busca vazia não vai', async () => {
    let params: URLSearchParams | undefined
    server.use(
      http.get(
        '*/lab/content/collections/:collectionId/cards',
        ({ request }) => {
          params = new URL(request.url).searchParams
          return HttpResponse.json([])
        },
      ),
    )
    const { result } = renderHook(
      () =>
        useEditorCards('bosque', {
          type: 'attribute',
          status: 'draft',
          q: 'força bruta',
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(params?.get('type')).toBe('attribute')
    expect(params?.get('status')).toBe('draft')
    expect(params?.get('q')).toBe('força bruta')

    const empty = renderHook(() => useEditorCards('bosque', { q: '' }), {
      wrapper,
    })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(params?.has('q')).toBe(false)
  })

  it('REQ-20: o handler padrão responde os cenários de filtro do contrato', async () => {
    const draft = renderHook(
      () => useEditorCards('bosque', { status: 'draft' }),
      { wrapper },
    )
    await waitFor(() => expect(draft.result.current.isSuccess).toBe(true))
    expect(draft.result.current.data).toEqual(bosqueCardsDraftFixture)

    const search = renderHook(() => useEditorCards('bosque', { q: 'bruta' }), {
      wrapper,
    })
    await waitFor(() => expect(search.result.current.isSuccess).toBe(true))
    expect(search.result.current.data).toEqual(bosqueCardsSearchFixture)
  })

  it('REQ-20: filtro inválido → ContentInvalidError com o caminho do parâmetro', async () => {
    server.use(
      http.get('*/lab/content/collections/:collectionId/cards', () =>
        HttpResponse.json(unknownCardTypeFixture, { status: 400 }),
      ),
    )
    const { result } = renderHook(() => useEditorCards('bosque', {}), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ContentInvalidError)
    expect((result.current.error as ContentInvalidError).fields).toEqual([
      { path: 'type', message: 'Tipo de carta desconhecido.' },
    ])
  })

  it('REQ-20: useEditorCard lê a carta; desconhecida → 404 CARD_NOT_FOUND', async () => {
    const { result } = renderHook(() => useEditorCard('bosque.forca'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(forcaDraftFixture)

    const missing = renderHook(() => useEditorCard('bosque.nope'), { wrapper })
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).code).toBe(
      'CARD_NOT_FOUND',
    )
    expect(missing.result.current.error?.message).toBe(
      cardNotFoundFixture.error.message,
    )
  })
})

describe('REQ-21: criar e salvar carta', () => {
  it('REQ-53/55: salvar preserva efeitos estruturados, ordem, parâmetros e nulos', async () => {
    const input: CardInput = {
      ...forcaInput,
      attributeKind: 'enhanced',
      effects: [
        {
          text: 'Ganhe 1 moeda.',
          trigger: null,
          cost: [],
          activation: [{ kind: 'gainGold', amount: 1 }],
          duration: { kind: 'immediate' },
          mark: null,
        },
        {
          text: 'Ao receber dano elemental, some 3 ao resultado do dado.',
          trigger: { kind: 'onElementDamageTaken', element: null },
          cost: [
            {
              kind: 'payGold',
              amount: { base: 'halfGold', multiplier: 1, minimum: 2 },
            },
          ],
          activation: [{ kind: 'diceResultModifier', amount: 3 }],
          duration: { kind: 'untilAbilityUsed', element: null },
          mark: 'buff',
        },
      ],
    }
    const expected = {
      status: 'draft',
      card: {
        ...forcaDraftFixture.card,
        attributeKind: 'enhanced',
        effects: input.effects,
      },
    }
    let sent: unknown
    server.use(
      http.put('*/lab/content/cards/:cardId', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(expected)
      }),
    )
    const { result } = renderHook(() => useSaveCard(), { wrapper })
    act(() => result.current.mutate({ cardId: 'bosque.forca', input }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sent).toEqual(input)
    expect(result.current.data).toEqual(expected)
  })

  it('REQ-55: preserva CONTENT_INVALID com caminho de parâmetro aninhado do efeito', async () => {
    const fields = [
      {
        path: 'effects.0.activation.1.amount',
        message: 'Quantidade inválida.',
      },
    ]
    server.use(
      http.put('*/lab/content/cards/:cardId', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const input: CardInput = {
      ...forcaInput,
      attributeKind: 'enhanced',
      effects: [
        {
          text: 'Ganhe moedas.',
          trigger: null,
          cost: [],
          activation: [
            { kind: 'gainGold', amount: 1 },
            { kind: 'gainGold', amount: -1 },
          ],
          duration: { kind: 'immediate' },
          mark: null,
        },
      ],
    }
    const { result } = renderHook(() => useSaveCard(), { wrapper })
    act(() => result.current.mutate({ cardId: 'bosque.forca', input }))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ContentInvalidError)
    expect(result.current.error).toMatchObject({
      code: 'CONTENT_INVALID',
      message: 'Conteúdo inválido.',
      fields,
    })
    expect(result.current.data).toBeUndefined()
  })

  it('REQ-21: criar envia o CardInput, entrega a carta em rascunho e invalida o editor', async () => {
    let sent: unknown
    server.use(
      http.post(
        '*/lab/content/collections/:collectionId/cards',
        async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json(forcaDraftFixture, { status: 201 })
        },
      ),
    )
    seedEditorCache()
    const { result } = renderHook(() => useCreateCard(), { wrapper })
    act(() =>
      result.current.mutate({ collectionId: 'bosque', input: forcaInput }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sent).toEqual(forcaInput)
    expect(result.current.data).toEqual(forcaDraftFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-21 / D-38: CONTENT_INVALID ao criar vira ContentInvalidError com fields', async () => {
    const { result } = renderHook(() => useCreateCard(), { wrapper })
    act(() =>
      result.current.mutate({
        collectionId: 'bosque',
        input: {
          ...forcaInput,
          slug: 'forca-sorte',
          attributes: ['strength', 'luck'],
        },
      }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as ContentInvalidError).fields).toEqual(
      forcaSorteInvalidFixture.error.details.fields,
    )
  })

  it('REQ-21: salvar envia PUT com a carta inteira e entrega a carta renomeada', async () => {
    let method = ''
    let sent: unknown
    server.use(
      http.put('*/lab/content/cards/:cardId', async ({ request }) => {
        method = request.method
        sent = await request.json()
        return HttpResponse.json(forcaBrutaDraftFixture)
      }),
    )
    seedEditorCache()
    const { result } = renderHook(() => useSaveCard(), { wrapper })
    const input = { ...forcaInput, slug: 'forca-bruta' }
    act(() => result.current.mutate({ cardId: 'bosque.forca', input }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(method).toBe('PUT')
    expect(sent).toEqual(input)
    expect(result.current.data?.card.id).toBe('bosque.forca-bruta')
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-21: o handler padrão responde CONTENT_LOCKED e a edição da publicada', async () => {
    const { result } = renderHook(() => useSaveCard(), { wrapper })
    act(() =>
      result.current.mutate({
        cardId: 'bosque.forca-bruta',
        input: { ...forcaInput, slug: 'outra' },
      }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).not.toBeInstanceOf(ContentInvalidError)
    expect((result.current.error as ApiError).code).toBe('CONTENT_LOCKED')
    expect(result.current.error?.message).toBe(
      contentLockedFixture.error.message,
    )

    const renamed = renderHook(() => useSaveCard(), { wrapper })
    act(() =>
      renamed.result.current.mutate({
        cardId: 'bosque.forca-bruta',
        input: { ...forcaInput, slug: 'forca-bruta', name: 'Força Bruta' },
      }),
    )
    await waitFor(() => expect(renamed.result.current.isSuccess).toBe(true))
    expect(renamed.result.current.data).toEqual(forcaBrutaRenamedFixture)
  })

  it('REQ-21 / D-38: CONTENT_ID_TAKEN ao salvar vira ContentInvalidError', async () => {
    server.use(
      http.put('*/lab/content/cards/:cardId', () =>
        HttpResponse.json(cardIdTakenFixture, { status: 409 }),
      ),
    )
    const { result } = renderHook(() => useSaveCard(), { wrapper })
    act(() =>
      result.current.mutate({ cardId: 'bosque.forca', input: forcaInput }),
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    const error = result.current.error as ContentInvalidError
    expect(error).toBeInstanceOf(ContentInvalidError)
    expect(error.code).toBe('CONTENT_ID_TAKEN')
    expect(error.fields).toEqual(cardIdTakenFixture.error.details.fields)
  })
})

describe('REQ-23: publicar, duplicar e excluir carta', () => {
  it('REQ-23: publicar entrega a carta publicada e invalida o editor', async () => {
    seedEditorCache()
    const { result } = renderHook(() => usePublishCard(), { wrapper })
    act(() => result.current.mutate('bosque.forca-bruta'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(forcaBrutaPublishedFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-23: CONTENT_INVALID ao publicar vira ContentInvalidError', async () => {
    server.use(
      http.post('*/lab/content/cards/:cardId/publish', () =>
        HttpResponse.json(forcaSorteInvalidFixture, { status: 400 }),
      ),
    )
    const { result } = renderHook(() => usePublishCard(), { wrapper })
    act(() => result.current.mutate('bosque.forca'))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ContentInvalidError)
  })

  it('REQ-23: duplicar entrega o rascunho com id novo e invalida o editor', async () => {
    seedEditorCache()
    const { result } = renderHook(() => useDuplicateCard(), { wrapper })
    act(() => result.current.mutate('bosque.forca-bruta'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(forcaBrutaCopyFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-23: excluir aceita 204 e invalida o editor; desconhecida → 404', async () => {
    seedEditorCache()
    const { result } = renderHook(() => useDeleteCard(), { wrapper })
    act(() => result.current.mutate('bosque.forca-bruta-copia'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(editorCacheInvalidated()).toBe(true)

    const missing = renderHook(() => useDeleteCard(), { wrapper })
    act(() => missing.result.current.mutate('bosque.nope'))
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).code).toBe(
      'CARD_NOT_FOUND',
    )
  })
})

describe('REQ-25: validar coleção como dimensão', () => {
  it('REQ-25 / REQ-31: a `fixture` é válida; o `bosque` traz os problemas na ordem recebida', async () => {
    const { result } = renderHook(() => useValidateDimension(), { wrapper })
    act(() => result.current.mutate('fixture'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixtureDimensionFixture)
    expect(result.current.data).toEqual({ valid: true, problems: [] })

    const bosque = renderHook(() => useValidateDimension(), { wrapper })
    act(() => bosque.result.current.mutate('bosque'))
    await waitFor(() => expect(bosque.result.current.isSuccess).toBe(true))
    expect(bosque.result.current.data).toEqual(bosqueDimensionFixture)
    expect(bosque.result.current.data?.valid).toBe(false)
    expect(bosque.result.current.data?.problems).toHaveLength(2)
  })
})

describe('REQ-26: exportar e importar', () => {
  it('REQ-26: exportar entrega o CollectionExport validado', async () => {
    const { result } = renderHook(() => useExportCollection(), { wrapper })
    act(() => result.current.mutate('bosque'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(bosqueExportFixture)
  })

  it('REQ-26: importar envia o conteúdo como recebido e replace só quando pedido', async () => {
    let url = ''
    let sent: unknown
    server.use(
      http.post('*/lab/content/import', async ({ request }) => {
        url = request.url
        sent = await request.json()
        return HttpResponse.json(importResultFixture, { status: 201 })
      }),
    )
    seedEditorCache()
    const content: unknown = { anything: ['as', 'is'] }
    const { result } = renderHook(() => useImportCollection(), { wrapper })
    act(() => result.current.mutate({ content, replace: false }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(url).search).toBe('')
    expect(sent).toEqual(content)
    expect(result.current.data).toEqual(importResultFixture)
    expect(editorCacheInvalidated()).toBe(true)

    const replace = renderHook(() => useImportCollection(), { wrapper })
    act(() => replace.result.current.mutate({ content, replace: true }))
    await waitFor(() => expect(replace.result.current.isSuccess).toBe(true))
    expect(new URL(url).searchParams.get('replace')).toBe('true')
  })

  it('REQ-26: o handler padrão responde os cenários de importação do contrato', async () => {
    const taken = renderHook(() => useImportCollection(), { wrapper })
    act(() =>
      taken.result.current.mutate({
        content: bosqueExportFixture,
        replace: false,
      }),
    )
    await waitFor(() => expect(taken.result.current.isError).toBe(true))
    expect((taken.result.current.error as ContentInvalidError).fields).toEqual(
      importIdTakenFixture.error.details.fields,
    )

    const replaced = renderHook(() => useImportCollection(), { wrapper })
    act(() =>
      replaced.result.current.mutate({
        content: bosqueExportFixture,
        replace: true,
      }),
    )
    await waitFor(() => expect(replaced.result.current.isSuccess).toBe(true))
    expect(replaced.result.current.data).toEqual(importResultFixture)

    const invalid = renderHook(() => useImportCollection(), { wrapper })
    act(() => invalid.result.current.mutate({ content: {}, replace: false }))
    await waitFor(() => expect(invalid.result.current.isError).toBe(true))
    expect(
      (invalid.result.current.error as ContentInvalidError).fields,
    ).toEqual(importInvalidFixture.error.details.fields)
  })
})

describe('D-40: tabela de cenários do MSW', () => {
  it('D-40: ids herdados de Object.prototype não são coleção nem carta conhecida', async () => {
    const collection = renderHook(() => useEditorCollection('constructor'), {
      wrapper,
    })
    await waitFor(() => expect(collection.result.current.isError).toBe(true))
    expect((collection.result.current.error as ApiError).code).toBe(
      'COLLECTION_NOT_FOUND',
    )

    const card = renderHook(() => useEditorCard('toString'), { wrapper })
    await waitFor(() => expect(card.result.current.isError).toBe(true))
    expect((card.result.current.error as ApiError).code).toBe('CARD_NOT_FOUND')
  })

  it('D-40: import sem formatVersion só falha no corpo `{}` do cenário (o MSW não valida)', async () => {
    const { result } = renderHook(() => useImportCollection(), { wrapper })
    act(() =>
      result.current.mutate({ content: { other: true }, replace: false }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(importResultFixture)
  })

  it('REQ-25 / REQ-26: validar e exportar coleção desconhecida → 404 COLLECTION_NOT_FOUND', async () => {
    const validate = renderHook(() => useValidateDimension(), { wrapper })
    act(() => validate.result.current.mutate('nope'))
    await waitFor(() => expect(validate.result.current.isError).toBe(true))
    expect((validate.result.current.error as ApiError).code).toBe(
      'COLLECTION_NOT_FOUND',
    )

    const exported = renderHook(() => useExportCollection(), { wrapper })
    act(() => exported.result.current.mutate('nope'))
    await waitFor(() => expect(exported.result.current.isError).toBe(true))
    expect((exported.result.current.error as ApiError).code).toBe(
      'COLLECTION_NOT_FOUND',
    )
  })

  it('REQ-26: ImportResult sem classCount é lido com 0', async () => {
    server.use(
      http.post('*/lab/content/import', () =>
        HttpResponse.json(
          { collectionId: 'bosque', cardCount: 1 },
          { status: 201 },
        ),
      ),
    )
    const { result } = renderHook(() => useImportCollection(), { wrapper })
    act(() => result.current.mutate({ content: {}, replace: false }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      collectionId: 'bosque',
      cardCount: 1,
      classCount: 0,
    })
  })
})

describe('REQ-31: Carta de Dimensão e forma das setas no CardInput', () => {
  it('REQ-31: criar envia a Carta de Dimensão e a zona com arrowLayout como digitadas', async () => {
    const sent: unknown[] = []
    server.use(
      http.post(
        '*/lab/content/collections/:collectionId/cards',
        async ({ request }) => {
          sent.push(await request.json())
          return HttpResponse.json(forcaDraftFixture, { status: 201 })
        },
      ),
    )
    const dimension: CardInput = {
      slug: 'nova-dimensao',
      type: 'dimension',
      name: 'Nova Dimensão',
      flavorText: null,
      releaseOrder: 2,
      arrivalZoneTitle: null,
      rewardDecks: [],
      effects: [],
    }
    const zone: CardInput = {
      slug: 'curva',
      type: 'zone',
      title: 'Curva',
      zoneType: 'mountainous',
      location: 'Serra',
      connectionArrows: 2,
      arrowLayout: 'corner',
      zoneActions: ['startEvent'],
      effects: [],
    }

    const { result } = renderHook(() => useCreateCard(), { wrapper })
    await act(() =>
      result.current.mutateAsync({ collectionId: 'bosque', input: dimension }),
    )
    await act(() =>
      result.current.mutateAsync({ collectionId: 'bosque', input: zone }),
    )
    expect(sent).toEqual([dimension, zone])
  })
})

describe('REQ-32: classes no editor (CONTRATO §3 FEAT-06)', () => {
  it('REQ-32: schemas aceitam as fixtures e recusam status e classe fora do contrato', () => {
    for (const entry of [...fixtureEditorClassesFixture, mageDraftFixture]) {
      expect(editorClassSchema.parse(entry)).toEqual(entry)
    }
    for (const entry of fixtureClassSummariesFixture) {
      expect(editorClassSummarySchema.parse(entry)).toEqual(entry)
    }
    expect(
      editorClassSchema.safeParse({ ...mageDraftFixture, status: 'archived' })
        .success,
    ).toBe(false)
    expect(
      editorClassSummarySchema.safeParse({
        playerClass: 'pirate',
        name: 'Pirata',
        status: 'draft',
      }).success,
    ).toBe(false)
  })

  it('REQ-32: useEditorClasses entrega a lista da coleção; desconhecida → 404', async () => {
    const fixture = renderHook(() => useEditorClasses('fixture'), { wrapper })
    await waitFor(() => expect(fixture.result.current.isSuccess).toBe(true))
    expect(fixture.result.current.data).toEqual(fixtureClassSummariesFixture)

    const bosque = renderHook(() => useEditorClasses('bosque'), { wrapper })
    await waitFor(() => expect(bosque.result.current.isSuccess).toBe(true))
    expect(bosque.result.current.data).toEqual(bosqueClassSummariesFixture)

    const missing = renderHook(() => useEditorClasses('nope'), { wrapper })
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).code).toBe(
      'COLLECTION_NOT_FOUND',
    )
  })

  it('REQ-32: useEditorClass lê a classe; desconhecida → ApiError CLASS_NOT_FOUND', async () => {
    const warrior = renderHook(() => useEditorClass('warrior'), { wrapper })
    await waitFor(() => expect(warrior.result.current.isSuccess).toBe(true))
    expect(warrior.result.current.data).toEqual({
      status: 'published',
      classDefinition: warriorClassFixture,
    })

    const missing = renderHook(() => useEditorClass('cleric'), { wrapper })
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect(missing.result.current.error).toBeInstanceOf(ApiError)
    expect(missing.result.current.error).not.toBeInstanceOf(ContentInvalidError)
    expect((missing.result.current.error as ApiError).code).toBe(
      'CLASS_NOT_FOUND',
    )
    expect((missing.result.current.error as ApiError).message).toBe(
      classNotFoundFixture.error.message,
    )
  })

  it('REQ-32: criar envia o ClassInput como digitado, entrega o rascunho e invalida o editor', async () => {
    let url = ''
    let sent: unknown
    server.use(
      http.post(
        '*/lab/content/collections/:collectionId/classes',
        async ({ request }) => {
          url = request.url
          sent = await request.json()
          return HttpResponse.json(mageDraftFixture, { status: 201 })
        },
      ),
    )
    seedEditorCache()
    const { result } = renderHook(() => useCreateClass(), { wrapper })
    act(() =>
      result.current.mutate({ collectionId: 'bosque', input: mageInput }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(url).pathname).toBe(
      '/lab/content/collections/bosque/classes',
    )
    expect(sent).toEqual(mageInput)
    expect(result.current.data).toEqual(mageDraftFixture)
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-32 / D-38: o handler padrão responde CONTENT_ID_TAKEN para `warrior` e 201 para `mage`', async () => {
    const taken = renderHook(() => useCreateClass(), { wrapper })
    const warriorInput: ClassInput = { ...mageInput, playerClass: 'warrior' }
    act(() =>
      taken.result.current.mutate({
        collectionId: 'bosque',
        input: warriorInput,
      }),
    )
    await waitFor(() => expect(taken.result.current.isError).toBe(true))
    const error = taken.result.current.error as ContentInvalidError
    expect(error).toBeInstanceOf(ContentInvalidError)
    expect(error.code).toBe('CONTENT_ID_TAKEN')
    expect(error.fields).toEqual(classIdTakenFixture.error.details.fields)

    const created = renderHook(() => useCreateClass(), { wrapper })
    act(() =>
      created.result.current.mutate({
        collectionId: 'bosque',
        input: mageInput,
      }),
    )
    await waitFor(() => expect(created.result.current.isSuccess).toBe(true))
    expect(created.result.current.data).toEqual(mageDraftFixture)

    const missing = renderHook(() => useCreateClass(), { wrapper })
    act(() =>
      missing.result.current.mutate({ collectionId: 'nope', input: mageInput }),
    )
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).code).toBe(
      'COLLECTION_NOT_FOUND',
    )
  })

  it('REQ-32: salvar envia PUT com a classe inteira e invalida o editor; publicada com outro id → CONTENT_LOCKED', async () => {
    let method = ''
    let sent: unknown
    server.use(
      http.put('*/lab/content/classes/:playerClass', async ({ request }) => {
        method = request.method
        sent = await request.json()
        return HttpResponse.json(mageDraftFixture)
      }),
    )
    seedEditorCache()
    const { result } = renderHook(() => useSaveClass(), { wrapper })
    act(() => result.current.mutate({ playerClass: 'mage', input: mageInput }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(method).toBe('PUT')
    expect(sent).toEqual(mageInput)
    expect(result.current.data).toEqual(mageDraftFixture)
    expect(editorCacheInvalidated()).toBe(true)

    server.resetHandlers()
    const locked = renderHook(() => useSaveClass(), { wrapper })
    act(() =>
      locked.result.current.mutate({
        playerClass: 'warrior',
        input: { ...mageInput, playerClass: 'cleric' },
      }),
    )
    await waitFor(() => expect(locked.result.current.isError).toBe(true))
    expect((locked.result.current.error as ApiError).code).toBe(
      'CONTENT_LOCKED',
    )
  })

  it('REQ-32: publicar `mage` → ContentInvalidError (trava); `warrior` → publicada', async () => {
    seedEditorCache()
    const mage = renderHook(() => usePublishClass(), { wrapper })
    act(() => mage.result.current.mutate('mage'))
    await waitFor(() => expect(mage.result.current.isError).toBe(true))
    expect((mage.result.current.error as ContentInvalidError).fields).toEqual(
      magePublishInvalidFixture.error.details.fields,
    )

    const warrior = renderHook(() => usePublishClass(), { wrapper })
    act(() => warrior.result.current.mutate('warrior'))
    await waitFor(() => expect(warrior.result.current.isSuccess).toBe(true))
    expect(warrior.result.current.data?.status).toBe('published')
    expect(editorCacheInvalidated()).toBe(true)
  })

  it('REQ-32: excluir aceita 204 e invalida o editor; desconhecida → CLASS_NOT_FOUND', async () => {
    seedEditorCache()
    const { result } = renderHook(() => useDeleteClass(), { wrapper })
    act(() => result.current.mutate('mage'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(editorCacheInvalidated()).toBe(true)

    const missing = renderHook(() => useDeleteClass(), { wrapper })
    act(() => missing.result.current.mutate('cleric'))
    await waitFor(() => expect(missing.result.current.isError).toBe(true))
    expect((missing.result.current.error as ApiError).code).toBe(
      'CLASS_NOT_FOUND',
    )
  })

  it('REQ-32: excluir carta do deck pré-pronto → ApiError CONTENT_REFERENCED com a message', async () => {
    const { result } = renderHook(() => useDeleteCard(), { wrapper })
    act(() => result.current.mutate('fixture.dexterity-basic'))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error).not.toBeInstanceOf(ContentInvalidError)
    expect((result.current.error as ApiError).code).toBe('CONTENT_REFERENCED')
    expect((result.current.error as ApiError).message).toBe(
      contentReferencedFixture.error.message,
    )
  })
})

describe('REQ-33: exportar e importar com classes', () => {
  it('REQ-33: o export traz as classes validadas (o schema não as descarta)', async () => {
    const { result } = renderHook(() => useExportCollection(), { wrapper })
    act(() => result.current.mutate('fixture'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.classes).toEqual(fixtureExportFixture.classes)
    expect(result.current.data?.classes).toHaveLength(2)
  })

  it('REQ-33: classes fora do contrato no export são recusadas', () => {
    expect(
      collectionExportSchema.safeParse({
        ...fixtureExportFixture,
        classes: [{ status: 'draft', classDefinition: { playerClass: 'x' } }],
      }).success,
    ).toBe(false)
  })
})
