import type { EquipmentCard as EquipmentCardData } from '../../api/catalog'
import { CardCategory } from '../CardCategory'
import { categoryCatalog } from '../categories'
import { enchantmentKindLabels, playerClassLabels } from '../labels'
import { Term } from '../Term'
import { formatNumber, formatSigned } from './format'
import {
  Abilities,
  CardFrame,
  Effects,
  LabeledList,
  Materials,
  ScavengeTool,
  Tags,
} from './parts'

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
      <Abilities abilities={card.abilities} />
      <Effects effects={card.effects} />
      <ScavengeTool tool={card.scavengeTool} />
      {card.refinement !== null && <Refinement refinement={card.refinement} />}
      {card.enchantment !== null && (
        <Enchantment enchantment={card.enchantment} />
      )}
    </CardFrame>
  )
}

/** Bloco "Refino" (REQ-78): nível máximo e materiais de cada tentativa. */
function Refinement({
  refinement,
}: {
  refinement: NonNullable<EquipmentCardData['refinement']>
}) {
  return (
    <section aria-label="Refino">
      <h4>Refino</h4>
      <p>Até +{refinement.maxLevel}</p>
      {refinement.materials.length === 0 ? (
        <p>Sem materiais definidos.</p>
      ) : (
        <Materials
          label="Materiais por tentativa"
          materials={refinement.materials}
        />
      )}
    </section>
  )
}

/** Bloco "Encantamento" (REQ-78): um slot por linha, com o refino mínimo quando > 0. */
function Enchantment({
  enchantment,
}: {
  enchantment: NonNullable<EquipmentCardData['enchantment']>
}) {
  return (
    <section aria-label="Encantamento">
      <h4>Encantamento</h4>
      <LabeledList
        label="Slots"
        items={enchantment.slots}
        render={(slot, i) =>
          `Slot ${i + 1}: ${enchantmentKindLabels[slot.kind].toLowerCase()}${
            slot.minRefinement > 0
              ? `, a partir do refino +${slot.minRefinement}`
              : ''
          }`
        }
      />
    </section>
  )
}
