import type { DimensionCard as DimensionCardData } from '../../api/catalog'
import { CardFrame, LabeledList } from './parts'

/** Carta de Dimensão (REQ-28, README 3.2). A zona `null` é sorteada pelo backend. */
export function DimensionCard({ card }: { card: DimensionCardData }) {
  return (
    <CardFrame name={card.name} flavorText={card.flavorText}>
      <p>Ordem de lançamento {card.releaseOrder}</p>
      <p>
        Zona de chegada:{' '}
        {card.arrivalZoneTitle ??
          'sorteada entre as Urbanas sem efeito negativo'}
      </p>
      <LabeledList
        label="Efeitos"
        items={card.effects}
        render={(e) => e.text}
      />
    </CardFrame>
  )
}
