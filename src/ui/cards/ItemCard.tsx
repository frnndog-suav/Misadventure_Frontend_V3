import type { ItemCard as ItemCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { zoneTypeLabels } from '../labels'
import { formatNumber } from './format'
import {
  CardFrame,
  CardName,
  CollectionName,
  Effects,
  Materials,
  PriceAdjust,
  ScavengeTool,
  Tags,
} from './parts'

/** Carta de item (REQ-11, README 5.2); ferramenta e coleta (REQ-48, D-59); mercado (REQ-72); receita (REQ-78). */
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
      {card.recipe !== null && <Recipe recipe={card.recipe} />}
    </CardFrame>
  )
}

/** Bloco "Receita" (REQ-78): o equipamento criado, os materiais, o ouro e se some ao criar. */
function Recipe({ recipe }: { recipe: NonNullable<ItemCardData['recipe']> }) {
  return (
    <section aria-label="Receita">
      <h4>Receita</h4>
      <p>
        Cria <CardName cardId={recipe.equipmentId} />
      </p>
      {recipe.materials.length === 0 ? (
        <p>Sem materiais.</p>
      ) : (
        <Materials label="Materiais" materials={recipe.materials} />
      )}
      <p>{formatNumber(recipe.gold)} de ouro</p>
      {recipe.consumed && <p>A receita é consumida.</p>}
    </section>
  )
}
