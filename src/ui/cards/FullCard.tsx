import type { Card } from '../../api/catalog'
import { AttributeCard } from './AttributeCard'
import { CombatEventCard } from './CombatEventCard'
import { DimensionCard } from './DimensionCard'
import { EquipmentCard } from './EquipmentCard'
import { ItemCard } from './ItemCard'
import { RandomEventCard } from './RandomEventCard'
import { ZoneCard } from './ZoneCard'

/** Carta completa no componente do seu `type` (REQ-09 a REQ-13, REQ-22). */
export function FullCard({ card }: { card: Card }) {
  switch (card.type) {
    case 'zone':
      return <ZoneCard card={card} />
    case 'attribute':
      return <AttributeCard card={card} />
    case 'equipment':
      return <EquipmentCard card={card} />
    case 'item':
      return <ItemCard card={card} />
    case 'randomEvent':
      return <RandomEventCard card={card} />
    case 'combatEvent':
      return <CombatEventCard card={card} />
    case 'dimension':
      return <DimensionCard card={card} />
    default: {
      const _exhaustive: never = card
      return _exhaustive
    }
  }
}
