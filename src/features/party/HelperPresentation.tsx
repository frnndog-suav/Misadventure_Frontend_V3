import { useEffect, useState } from 'react'
import type { Card } from '../../api/catalog'
import type { DomainEvent, Party } from '../../api/parties'
import { combatUpdateText } from './combatUpdateText'
import { PartyMap } from './PartyMap'
import { nameOf } from './cardNames'

function eventText(event: DomainEvent, name: (id: string) => string) {
  switch (event.type) {
    case 'turnStarted':
      return `Início da vez em ${name(event.payload.zoneId)}`
    case 'turnEnded':
      return 'Fim da vez'
    case 'moved':
      return `Movimento · ${[event.payload.fromZoneId, ...event.payload.traversedZoneIds].map(name).join(' → ')}`
    case 'randomEventStarted':
      return `Evento aleatório · Antecipação em ${name(event.payload.zoneId)}`
    case 'randomEventRevealed':
      return `Evento aleatório · ${event.payload.cardTitle}`
    case 'randomEventPhaseChanged':
      return event.payload.phase === 'success' ? 'Êxito' : 'Revés'
    case 'randomEventEnded':
      return 'Evento aleatório encerrado'
    case 'combatUpdated':
      return combatUpdateText(event.payload.update, name)
  }
}

export function HelperPresentation({
  party,
  events,
  cards,
  onFinish,
}: {
  party: Party
  events: readonly DomainEvent[]
  cards: ReadonlyMap<string, Card>
  onFinish: () => void
}) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (index + 1 === events.length) onFinish()
      else setIndex(index + 1)
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [events, index, onFinish])

  const event = events[index]
  const names = new Map(
    party.members.map(({ id, characterName }) => [id, characterName]),
  )
  for (const entry of events.slice(0, index + 1)) {
    if (
      entry.type === 'combatUpdated' &&
      entry.payload.update.type === 'combatStarted'
    ) {
      for (const { id, name } of entry.payload.update.participants)
        names.set(id, name)
    }
  }
  const titleOf = (id: string) => names.get(id) ?? nameOf(cards, id, id)
  const path =
    event.type === 'moved'
      ? [event.payload.fromZoneId, ...event.payload.traversedZoneIds]
      : undefined

  return (
    <section aria-labelledby="helper-presentation-title">
      <h2 id="helper-presentation-title">Vezes dos ajudantes</h2>
      <button type="button" onClick={onFinish}>
        Pular apresentação
      </button>
      <div aria-live="polite">
        <h3>
          {titleOf(event.memberId)} · Rodada {event.round}
        </h3>
        <p>{eventText(event, titleOf)}</p>
      </div>
      {path && event.dimensionId === party.dimension.dimensionCardId && (
        <PartyMap
          party={party}
          cards={cards}
          titleOf={titleOf}
          moving
          movement={{ memberId: event.memberId, path }}
        />
      )}
    </section>
  )
}
