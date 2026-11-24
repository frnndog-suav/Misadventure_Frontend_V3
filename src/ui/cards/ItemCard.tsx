import type { ItemCard as ItemCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { zoneTypeLabels } from '../labels'
import { formatNumber } from './format'
import {
  CardFrame,
  CollectionName,
  Effects,
  PriceAdjust,
  ScavengeTool,
  Tags,
} from './parts'

/** Carta de item (REQ-11, README 5.2); ferramenta e coleta (REQ-48, D-59); mercado (REQ-72). */
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
      <PriceAdjust multiplier={card.priceMultiplier} />
      {card.stockPrice !== null && (
        <p>Preço de estoque {formatNumber(card.stockPrice)}</p>
      )}
      {card.stockQuantity > 1 && (
        <p>Lote de {formatNumber(card.stockQuantity)}</p>
      )}
      {card.itemCategory === 'booster' && card.boosterCollectionId !== null && (
        <CollectionName collectionId={card.boosterCollectionId} />
      )}
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
