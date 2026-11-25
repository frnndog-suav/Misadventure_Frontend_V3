import type { Card } from '../../api/catalog'
import type { BoosterOpeningResult } from '../../api/market'
import { nameOf } from './cardNames'

type Cards = ReadonlyMap<string, Card>

const destinationLabel: Record<
  BoosterOpeningResult['cards'][number]['destination'],
  string
> = {
  tcgFolder: 'pasta de TCG',
  inventory: 'inventário',
  mountInventory: 'inventário extra',
  mountTcgFolder: 'pasta extra',
  vault: 'cofre',
  pending: 'entrega pendente',
}

/** Lista "Cartas do booster {nome}" de `lastBoosterOpening`, na ordem recebida (REQ-75). */
export function BoosterResult({
  opening,
  cards,
}: {
  opening: BoosterOpeningResult
  cards: Cards
}) {
  const title = `Cartas do booster ${nameOf(cards, opening.boosterCardId)}`
  return (
    <>
      <h2 id="booster-result-title">{title}</h2>
      <ul aria-labelledby="booster-result-title">
        {opening.cards.map(({ cardId, destination }, i) => (
          <li key={i}>
            {nameOf(cards, cardId)} → {destinationLabel[destination]}
          </li>
        ))}
      </ul>
    </>
  )
}
