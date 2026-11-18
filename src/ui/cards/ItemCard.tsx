import type { ItemCard as ItemCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { zoneTypeLabels } from '../labels'
import { CardFrame, Effects, ScavengeTool, Tags } from './parts'

/** Carta de item (REQ-11, README 5.2); ferramenta e coleta (REQ-48, D-59). */
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
      {card.toolKind !== null && (
        <>
          <p>Ferramenta: {card.toolKind}</p>
          <p>
            Vasculha em:{' '}
            {card.scavengeZoneTypes.map((z) => zoneTypeLabels[z]).join(', ')}
          </p>
        </>
      )}
      <ScavengeTool tool={card.scavengeTool} />
    </CardFrame>
  )
}
