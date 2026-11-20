import type { RandomEventCard as RandomEventCardData } from '../../api/catalog'
import { CardFrame, EventOutcomes, LabeledList } from './parts'

/** Carta de evento aleatório (REQ-13, README 14.1). */
export function RandomEventCard({ card }: { card: RandomEventCardData }) {
  return (
    <CardFrame name={card.title} flavorText={card.flavorText}>
      <LabeledList
        label="Requisitos"
        items={card.requirements}
        render={(r) => r.text}
      />
      <EventOutcomes
        goodOutcome={card.goodOutcome}
        badOutcome={card.badOutcome}
        noEscape={card.noEscape}
      />
      {!card.noEscape && card.escapeThreshold != null && (
        <p>Limiar de fuga: {card.escapeThreshold}</p>
      )}
    </CardFrame>
  )
}
