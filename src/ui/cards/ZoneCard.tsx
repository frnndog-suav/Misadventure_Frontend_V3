import type { ZoneCard as ZoneCardData } from '../../api/catalog'
import { zoneActionLabels, zoneTypeLabels } from '../labels'
import { CardFrame, LabeledList } from './parts'

const polarityLabels = { positive: 'Positivo', negative: 'Negativo' } as const

/** Carta de zona (REQ-12, README 3.4). Polaridade com texto, não só cor. */
export function ZoneCard({ card }: { card: ZoneCardData }) {
  return (
    <CardFrame name={card.title}>
      <p className="game-card-kind">{zoneTypeLabels[card.zoneType]}</p>
      <p>{card.location}</p>
      <p>Setas de conexão: {card.connectionArrows}</p>
      <LabeledList
        label="Ações de zona"
        items={card.zoneActions}
        render={(a) => zoneActionLabels[a]}
      />
      <LabeledList
        label="Efeitos"
        items={card.effects}
        render={(e) => `${polarityLabels[e.polarity]}: ${e.text}`}
      />
    </CardFrame>
  )
}
