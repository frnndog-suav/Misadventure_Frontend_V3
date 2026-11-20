import type { Card } from '../../api/catalog'

export function nameOf(
  cards: ReadonlyMap<string, Card>,
  cardId: string,
  fallback = '…',
): string {
  const card = cards.get(cardId)
  if (card === undefined) return fallback
  return 'name' in card ? card.name : card.title
}
