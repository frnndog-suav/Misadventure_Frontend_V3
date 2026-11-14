import type { EquipmentCard as EquipmentCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { playerClassLabels } from '../labels'
import { Term } from '../Term'
import { formatNumber, formatSigned } from './format'
import { CardFrame, Effects, LabeledList, Tags } from './parts'

/**
 * Carta de equipamento (REQ-10, README 5.1). Valores como vieram do backend;
 * o primeiro modificador é o principal (CONTRATO §3 FEAT-04).
 */
export function EquipmentCard({ card }: { card: EquipmentCardData }) {
  return (
    <CardFrame
      name={card.name}
      rarity={card.rarity}
      flavorText={card.flavorText}
    >
      <CardCategory entry={categoryCatalog[card.slot]} />
      <Tags tags={card.tags} />
      <LabeledList
        label="Modificadores"
        items={card.modifiers}
        render={(m, i) => (
          <>
            {formatSigned(m.value)} <Term id={m.modifier} />
            {i === 0 && ' (principal)'}
          </>
        )}
      />
      <p>Preço ×{formatNumber(card.priceMultiplier)}</p>
      {card.peakRequirement !== null && (
        <p>Pico {formatNumber(card.peakRequirement)}</p>
      )}
      <LabeledList
        label="Classes"
        items={card.classRestriction}
        render={(c) => playerClassLabels[c]}
      />
      {card.blocksShield && <p>Bloqueia escudo</p>}
      <LabeledList
        label="Habilidades"
        items={card.abilities}
        render={(a) => (
          <>
            <strong>{a.name}</strong> <span>{a.text}</span>
          </>
        )}
      />
      <Effects effects={card.effects} />
      {card.refinement !== null && (
        <div className="game-card-block">
          <p>Refinável até +{card.refinement.maxLevel}</p>
          <p>{card.refinement.materials.text}</p>
        </div>
      )}
      {card.enchantment !== null && (
        <div className="game-card-block">
          <p className="game-card-block-title">Encantamento</p>
          <p>{card.enchantment.text}</p>
        </div>
      )}
    </CardFrame>
  )
}
