import type { ZoneCard as ZoneCardData } from '../../api/catalog'
import { zoneActionLabels, zoneTypeLabels } from '../labels'
import { CardFrame, Effects, LabeledList } from './parts'

/** Forma das setas (REQ-28); com `null`, nada aparece. */
const arrowLayoutLabels = {
  straight: 'Setas opostas',
  corner: 'Setas vizinhas',
} as const

/** Carta de zona (REQ-12, README 3.4). Polaridade com texto, não só cor. */
export function ZoneCard({ card }: { card: ZoneCardData }) {
  return (
    <CardFrame name={card.title}>
      <p className="game-card-kind">{zoneTypeLabels[card.zoneType]}</p>
      <p>{card.location}</p>
      <p>Setas de conexão: {card.connectionArrows}</p>
      {card.arrowLayout !== null && (
        <p>{arrowLayoutLabels[card.arrowLayout]}</p>
      )}
      <LabeledList
        label="Ações de zona"
        items={card.zoneActions}
        render={(a) => zoneActionLabels[a]}
      />
      <Effects effects={card.effects} />
    </CardFrame>
  )
}
