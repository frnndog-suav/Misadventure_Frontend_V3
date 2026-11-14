import type { AttributeCard as AttributeCardData } from '../../api/catalog'
import { attributeKindLabels } from '../labels'
import { Term } from '../Term'
import { CardFrame, Effects, LabeledList } from './parts'

/** Carta de atributo (REQ-09, README 4.3). Cada atributo vale 1. */
export function AttributeCard({ card }: { card: AttributeCardData }) {
  return (
    <CardFrame
      name={card.name}
      rarity={card.rarity}
      flavorText={card.flavorText}
    >
      <p className="game-card-kind">
        {attributeKindLabels[card.attributeKind]}
      </p>
      <LabeledList
        label="Atributos"
        items={card.attributes}
        render={(id) => (
          <>
            1 <Term id={id} />
          </>
        )}
      />
      <Effects effects={card.effects} />
    </CardFrame>
  )
}
