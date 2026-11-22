import { HttpResponse } from 'msw'
import { zoneQuestCardSchema } from '../api/catalog'
import type { EditorCard } from '../api/editor'

const cards = new Map<string, EditorCard>()
export const questEditorCard = (id: string) => cards.get(id)
export const questEditorCards = () => [...cards.values()]
export const resetQuestEditorCards = () => cards.clear()

export function saveQuestEditorCard(
  collectionId: string,
  body: unknown,
  id?: string,
) {
  const raw =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const cardId = id ?? collectionId + '.' + String(raw.slug)
  const parsed = zoneQuestCardSchema.safeParse({
    ...raw,
    id: cardId,
    collectionId,
  })
  const fields: { path: string; message: string }[] = []
  const status = cards.get(cardId)?.status ?? 'draft'
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      fields.push({ path: issue.path.join('.'), message: 'Valor inválido.' })
  } else {
    parsed.data.stages.forEach((stage, index) => {
      if (
        stage.location.type === 'zoneTitle' &&
        !['Porto', 'Porto Cinzento'].includes(stage.location.title)
      ) {
        fields.push({
          path: 'stages.' + index + '.location.title',
          message: 'Não há uma zona com esse título na coleção.',
        })
      }
      if (
        stage.type === 'randomEvent' &&
        stage.eventCardId !== collectionId + '.wounded-traveler'
      ) {
        fields.push({
          path: 'stages.' + index + '.eventCardId',
          message:
            'A carta referenciada deve ser um evento aleatório executável da mesma coleção.',
        })
      }
    })
    if (!fields.length) {
      const entry = { card: parsed.data, status }
      cards.set(cardId, entry)
      return HttpResponse.json(entry, { status: id ? 200 : 201 })
    }
  }
  return HttpResponse.json(
    {
      error: {
        code: 'CONTENT_INVALID',
        message: 'Conteúdo inválido.',
        details: { fields },
      },
    },
    { status: 400 },
  )
}

export function publishQuestEditorCard(id: string) {
  const entry = cards.get(id)
  if (!entry) return
  const published = { ...entry, status: 'published' as const }
  cards.set(id, published)
  return HttpResponse.json(published)
}
