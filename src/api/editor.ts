import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import {
  cardSchema,
  cardTypeSchema,
  classDefinitionSchema,
  playerClassSchema,
  type Card,
  type CardType,
  type ClassDefinition,
  type PlayerClass,
  type Rarity,
} from './catalog'
import { ApiError, requestJson } from './http'

/**
 * Editor de conteúdo (CONTRATO §3 FEAT-31, só dev). O backend grava, valida e
 * decide tudo; aqui só se envia o que o autor digitou e se valida o formato da
 * resposta. Os textos dos erros por campo vêm prontos (D-38). Sem retry (D-16).
 */

export const contentStatusSchema = z.enum(['draft', 'published'])
export type ContentStatus = z.infer<typeof contentStatusSchema>

export interface CollectionInput {
  id: string
  name: string
  description: string
}

export interface CollectionPatch {
  name?: string
  description?: string
}

const count = z.number().int().min(0)

export const editorCollectionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  publishedCount: count,
  draftCount: count,
})
export type EditorCollectionSummary = z.infer<
  typeof editorCollectionSummarySchema
>

export const editorCollectionSchema = editorCollectionSummarySchema.extend({
  cardCounts: z.object({
    zone: count,
    attribute: count,
    equipment: count,
    item: count,
    randomEvent: count,
    combatEvent: count,
    dimension: count,
  }) satisfies z.ZodType<Record<CardType, number>>,
  rarityCounts: z.object({
    common: count,
    uncommon: count,
    rare: count,
    epic: count,
    legendary: count,
  }) satisfies z.ZodType<Record<Rarity, number>>,
  tags: z.array(z.string()),
})
export type EditorCollection = z.infer<typeof editorCollectionSchema>

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

/** O `Card` sem `id` e `collectionId` (o backend monta), mais o `slug`. */
export type CardInput = DistributiveOmit<Card, 'id' | 'collectionId'> & {
  slug: string
}

export const editorCardSchema = z.object({
  status: contentStatusSchema,
  card: cardSchema,
})
export type EditorCard = z.infer<typeof editorCardSchema>

export const editorCardSummarySchema = z.object({
  id: z.string(),
  type: cardTypeSchema,
  name: z.string(),
  status: contentStatusSchema,
})
export type EditorCardSummary = z.infer<typeof editorCardSummarySchema>

export const dimensionValidationSchema = z.object({
  valid: z.boolean(),
  problems: z.array(z.string()),
})
export type DimensionValidation = z.infer<typeof dimensionValidationSchema>

/** Classe no editor (CONTRATO §3 FEAT-06). */
export type ClassInput = Omit<ClassDefinition, 'collectionId'>

export const editorClassSchema = z.object({
  status: contentStatusSchema,
  classDefinition: classDefinitionSchema,
})
export type EditorClass = z.infer<typeof editorClassSchema>

export const editorClassSummarySchema = z.object({
  playerClass: playerClassSchema,
  name: z.string(),
  status: contentStatusSchema,
})
export type EditorClassSummary = z.infer<typeof editorClassSummarySchema>

export const collectionExportSchema = z.object({
  formatVersion: z.literal(1),
  collection: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
  }),
  cards: z.array(editorCardSchema),
  /** Um arquivo sem `classes` é lido como `[]` (D-40). */
  classes: z.array(editorClassSchema).default([]),
})
export type CollectionExport = z.infer<typeof collectionExportSchema>

export const importResultSchema = z.object({
  collectionId: z.string(),
  cardCount: count,
  /** FEAT-06; o export de antes dela não traz (D-40). */
  classCount: count.default(0),
})
export type ImportResult = z.infer<typeof importResultSchema>

export const contentInvalidDetailsSchema = z.object({
  fields: z.array(z.object({ path: z.string(), message: z.string() })),
})
export type ContentInvalidDetails = z.infer<typeof contentInvalidDetailsSchema>

/** `CONTENT_INVALID` (400) ou `CONTENT_ID_TAKEN` (409) com `details` validado. */
export class ContentInvalidError extends ApiError {
  readonly fields: ContentInvalidDetails['fields']

  constructor(
    code: 'CONTENT_INVALID' | 'CONTENT_ID_TAKEN',
    message: string,
    details: ContentInvalidDetails,
  ) {
    super(code, message, details)
    this.name = 'ContentInvalidError'
    this.fields = details.fields
  }
}

/** Filtros da lista de cartas; o backend filtra (D-39). */
export interface EditorCardFilters {
  type?: CardType
  status?: ContentStatus
  q?: string
}

/** Todas as consultas do editor ficam sob esta chave (mutações invalidam). */
export const editorKey = ['editor'] as const

/** Pedido do editor: erros de campo viram `ContentInvalidError`. */
async function contentRequest<T>(
  schema: z.ZodType<T>,
  method: Parameters<typeof requestJson>[0],
  path: string,
  body?: unknown,
): Promise<T> {
  try {
    return schema.parse(await requestJson(method, path, body))
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === 'CONTENT_INVALID' || error.code === 'CONTENT_ID_TAKEN')
    ) {
      const details = contentInvalidDetailsSchema.safeParse(error.details)
      if (!details.success) {
        throw new Error(`${error.code} com details fora do contrato`, {
          cause: error,
        })
      }
      throw new ContentInvalidError(error.code, error.message, details.data)
    }
    throw error
  }
}

const noContent = z.undefined()

function collectionPath(collectionId: string): string {
  return `/lab/content/collections/${encodeURIComponent(collectionId)}`
}

function cardPath(cardId: string): string {
  return `/lab/content/cards/${encodeURIComponent(cardId)}`
}

function classPath(playerClass: PlayerClass): string {
  return `/lab/content/classes/${encodeURIComponent(playerClass)}`
}

function useInvalidateEditor(): () => Promise<void> {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: editorKey })
}

// Coleções

export function useEditorCollections(): UseQueryResult<
  EditorCollectionSummary[],
  Error
> {
  return useQuery({
    queryKey: [...editorKey, 'collections'],
    queryFn: () =>
      contentRequest(
        z.array(editorCollectionSummarySchema),
        'GET',
        '/lab/content/collections',
      ),
    retry: false,
  })
}

/** `null`: nenhuma coleção escolhida, a consulta fica parada. */
export function useEditorCollection(
  collectionId: string | null,
): UseQueryResult<EditorCollection, Error> {
  return useQuery({
    queryKey: [...editorKey, 'collection', collectionId],
    queryFn: () =>
      contentRequest(
        editorCollectionSchema,
        'GET',
        collectionPath(collectionId ?? ''),
      ),
    enabled: collectionId !== null,
    retry: false,
  })
}

export function useCreateCollection(): UseMutationResult<
  EditorCollection,
  Error,
  CollectionInput
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (input: CollectionInput) =>
      contentRequest(
        editorCollectionSchema,
        'POST',
        '/lab/content/collections',
        input,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useUpdateCollection(): UseMutationResult<
  EditorCollection,
  Error,
  { collectionId: string; patch: CollectionPatch }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ collectionId, patch }) =>
      contentRequest(
        editorCollectionSchema,
        'PATCH',
        collectionPath(collectionId),
        patch,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useDeleteCollection(): UseMutationResult<void, Error, string> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (collectionId: string) =>
      contentRequest(noContent, 'DELETE', collectionPath(collectionId)),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useValidateDimension(): UseMutationResult<
  DimensionValidation,
  Error,
  string
> {
  return useMutation({
    mutationFn: (collectionId: string) =>
      contentRequest(
        dimensionValidationSchema,
        'POST',
        `${collectionPath(collectionId)}/validate-dimension`,
      ),
    retry: false,
  })
}

/** Exportar é disparado por clique, por isso é mutação (sem cache). */
export function useExportCollection(): UseMutationResult<
  CollectionExport,
  Error,
  string
> {
  return useMutation({
    mutationFn: (collectionId: string) =>
      contentRequest(
        collectionExportSchema,
        'GET',
        `${collectionPath(collectionId)}/export`,
      ),
    retry: false,
  })
}

/** O conteúdo do arquivo vai como está; o backend valida (REQ-26). */
export function useImportCollection(): UseMutationResult<
  ImportResult,
  Error,
  { content: unknown; replace: boolean }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ content, replace }) =>
      contentRequest(
        importResultSchema,
        'POST',
        replace ? '/lab/content/import?replace=true' : '/lab/content/import',
        content,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

// Cartas

export function useEditorCards(
  collectionId: string,
  filters: EditorCardFilters,
): UseQueryResult<EditorCardSummary[], Error> {
  const params = new URLSearchParams()
  if (filters.type !== undefined) params.set('type', filters.type)
  if (filters.status !== undefined) params.set('status', filters.status)
  if (filters.q !== undefined && filters.q !== '') params.set('q', filters.q)
  const query = params.size === 0 ? '' : `?${params.toString()}`
  return useQuery({
    queryKey: [...editorKey, 'cards', collectionId, query],
    queryFn: () =>
      contentRequest(
        z.array(editorCardSummarySchema),
        'GET',
        `${collectionPath(collectionId)}/cards${query}`,
      ),
    retry: false,
  })
}

export function useEditorCard(
  cardId: string,
): UseQueryResult<EditorCard, Error> {
  return useQuery({
    queryKey: [...editorKey, 'card', cardId],
    queryFn: () => contentRequest(editorCardSchema, 'GET', cardPath(cardId)),
    retry: false,
  })
}

export function useCreateCard(): UseMutationResult<
  EditorCard,
  Error,
  { collectionId: string; input: CardInput }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ collectionId, input }) =>
      contentRequest(
        editorCardSchema,
        'POST',
        `${collectionPath(collectionId)}/cards`,
        input,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

/** Substitui a carta inteira; outro `slug` num rascunho a renomeia. */
export function useSaveCard(): UseMutationResult<
  EditorCard,
  Error,
  { cardId: string; input: CardInput }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ cardId, input }) =>
      contentRequest(editorCardSchema, 'PUT', cardPath(cardId), input),
    retry: false,
    onSuccess: invalidate,
  })
}

export function usePublishCard(): UseMutationResult<EditorCard, Error, string> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (cardId: string) =>
      contentRequest(editorCardSchema, 'POST', `${cardPath(cardId)}/publish`),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useDuplicateCard(): UseMutationResult<
  EditorCard,
  Error,
  string
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (cardId: string) =>
      contentRequest(editorCardSchema, 'POST', `${cardPath(cardId)}/duplicate`),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useDeleteCard(): UseMutationResult<void, Error, string> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (cardId: string) =>
      contentRequest(noContent, 'DELETE', cardPath(cardId)),
    retry: false,
    onSuccess: invalidate,
  })
}

// Classes (CONTRATO §3 FEAT-06). `CLASS_NOT_FOUND` e `CONTENT_REFERENCED`
// chegam como `ApiError` com a `message` pronta.

export function useEditorClasses(
  collectionId: string,
): UseQueryResult<EditorClassSummary[], Error> {
  return useQuery({
    queryKey: [...editorKey, 'classes', collectionId],
    queryFn: () =>
      contentRequest(
        z.array(editorClassSummarySchema),
        'GET',
        `${collectionPath(collectionId)}/classes`,
      ),
    retry: false,
  })
}

export function useEditorClass(
  playerClass: PlayerClass,
): UseQueryResult<EditorClass, Error> {
  return useQuery({
    queryKey: [...editorKey, 'class', playerClass],
    queryFn: () =>
      contentRequest(editorClassSchema, 'GET', classPath(playerClass)),
    retry: false,
  })
}

export function useCreateClass(): UseMutationResult<
  EditorClass,
  Error,
  { collectionId: string; input: ClassInput }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ collectionId, input }) =>
      contentRequest(
        editorClassSchema,
        'POST',
        `${collectionPath(collectionId)}/classes`,
        input,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

/** Substitui a classe inteira; outro `playerClass` num rascunho a renomeia. */
export function useSaveClass(): UseMutationResult<
  EditorClass,
  Error,
  { playerClass: PlayerClass; input: ClassInput }
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: ({ playerClass, input }) =>
      contentRequest(editorClassSchema, 'PUT', classPath(playerClass), input),
    retry: false,
    onSuccess: invalidate,
  })
}

export function usePublishClass(): UseMutationResult<
  EditorClass,
  Error,
  PlayerClass
> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (playerClass: PlayerClass) =>
      contentRequest(
        editorClassSchema,
        'POST',
        `${classPath(playerClass)}/publish`,
      ),
    retry: false,
    onSuccess: invalidate,
  })
}

export function useDeleteClass(): UseMutationResult<void, Error, PlayerClass> {
  const invalidate = useInvalidateEditor()
  return useMutation({
    mutationFn: (playerClass: PlayerClass) =>
      contentRequest(noContent, 'DELETE', classPath(playerClass)),
    retry: false,
    onSuccess: invalidate,
  })
}
