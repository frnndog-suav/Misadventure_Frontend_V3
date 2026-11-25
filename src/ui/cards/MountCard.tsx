import type { MountCard as MountCardData } from '../../api/catalog'
import { cardTypeLabels, enemyTypeLabels, rarityLabels } from '../labels'
import { Abilities, CardFrame, Effects } from './parts'

/**
 * Carta de montaria (REQ-83, README 26). Montaria não tem categoria: no lugar
 * dela, "Montaria", seguido da raridade; o ícone é da FEAT-30 (D-64 item 5).
 */
export function MountCard({ card }: { card: MountCardData }) {
  return (
    <CardFrame name={card.name} flavorText={card.flavorText}>
      <p className="game-card-kind">{cardTypeLabels.mount}</p>
      <p className="game-card-rarity">{rarityLabels[card.rarity]}</p>
      <p>Tipos: {card.mountTypes.map((t) => enemyTypeLabels[t]).join(', ')}</p>
      <p>Criatura: {card.creature}</p>
      <Effects effects={card.effects} />
      <Abilities abilities={card.abilities} />
    </CardFrame>
  )
}
