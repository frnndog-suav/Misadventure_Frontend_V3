import type { ItemCard as ItemCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { CardFrame, Effects, Tags } from './parts'

/** Carta de item (REQ-11, README 5.2). */
export function ItemCard({ card }: { card: ItemCardData }) {
  return (
    <CardFrame
      name={card.name}
      rarity={card.rarity}
      flavorText={card.flavorText}
    >
      <CardCategory entry={categoryCatalog[card.itemCategory]} />
      <Tags tags={card.tags} />
      <Effects effects={card.effects} />
    </CardFrame>
  )
}
