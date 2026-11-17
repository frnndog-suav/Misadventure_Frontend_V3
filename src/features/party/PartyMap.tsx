import { useState } from 'react'
import type { Card } from '../../api/catalog'
import type { Direction, Party } from '../../api/parties'
import { FullCard } from '../../ui/cards/FullCard'

const arrowSymbol: Record<Direction, string> = {
  north: '↑',
  east: '→',
  south: '↓',
  west: '←',
}

const arrowName: Record<Direction, string> = {
  north: 'norte',
  east: 'leste',
  south: 'sul',
  west: 'oeste',
}

/** Mapa da partida (REQ-34): grade pelas posições recebidas, sem regra de travessia. */
export function PartyMap({
  party,
  cards,
  titleOf,
  onMove,
  moving,
}: {
  party: Party
  cards: ReadonlyMap<string, Card>
  titleOf: (cardId: string) => string
  onMove: (zoneId: string) => void
  moving: boolean
}) {
  const host = party.members.find((m) => m.isHost)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const { zones, crossings } = party.dimension.map
  const minX = Math.min(...zones.map((z) => z.x))
  const minY = Math.min(...zones.map((z) => z.y))
  const col = (x: number): number => 2 * (x - minX) + 1
  const row = (y: number): number => 2 * (y - minY) + 1

  const byId = new Map(zones.map((z) => [z.zoneId, z]))
  const links = crossings.flatMap(({ zoneIds: [a, b] }) => {
    const za = byId.get(a)
    const zb = byId.get(b)
    if (za === undefined || zb === undefined) return []
    if (za.y === zb.y && Math.abs(za.x - zb.x) === 1) {
      return [
        {
          key: `${a}|${b}`,
          c: col(Math.min(za.x, zb.x)) + 1,
          r: row(za.y),
          t: '—',
        },
      ]
    }
    if (za.x === zb.x && Math.abs(za.y - zb.y) === 1) {
      return [
        {
          key: `${a}|${b}`,
          c: col(za.x),
          r: row(Math.min(za.y, zb.y)) + 1,
          t: '|',
        },
      ]
    }
    return []
  })

  const chosen = chosenId === null ? undefined : cards.get(chosenId)
  const crossingTitles =
    chosenId === null
      ? []
      : crossings.flatMap(({ zoneIds: [a, b] }) =>
          a === chosenId ? [titleOf(b)] : b === chosenId ? [titleOf(a)] : [],
        )

  return (
    <section aria-labelledby="map-title">
      <h2 id="map-title">Mapa</h2>
      <div style={{ display: 'grid' }}>
        {zones.map((zone) => {
          const here = party.members.filter(
            ({ player }) => player.zoneId === zone.zoneId,
          )
          return (
            <button
              key={zone.zoneId}
              type="button"
              aria-pressed={chosenId === zone.zoneId}
              onClick={() => setChosenId(zone.zoneId)}
              data-col={col(zone.x)}
              data-row={row(zone.y)}
              style={{ gridColumn: col(zone.x), gridRow: row(zone.y) }}
            >
              <span>{titleOf(zone.zoneId)}</span>{' '}
              <span
                role="img"
                aria-label={`Setas: ${zone.arrows.map((d) => arrowName[d]).join(', ')}`}
              >
                {zone.arrows.map((d) => arrowSymbol[d]).join('')}
              </span>
              {here.map((m) => (
                <span key={m.id}> {m.characterName} está aqui</span>
              ))}
            </button>
          )
        })}
        {links.map((link) => (
          <span
            key={link.key}
            data-link=""
            aria-hidden="true"
            data-col={link.c}
            data-row={link.r}
            style={{ gridColumn: link.c, gridRow: link.r }}
          >
            {link.t}
          </span>
        ))}
      </div>
      {chosenId !== null && (
        <section aria-labelledby="chosen-zone-title">
          <h3 id="chosen-zone-title">Zona escolhida</h3>
          {chosen !== undefined && <FullCard card={chosen} />}
          {host?.player.moveTargets.includes(chosenId) && (
            <button
              type="button"
              onClick={() => onMove(chosenId)}
              disabled={moving}
            >
              Movimentar para {titleOf(chosenId)}
            </button>
          )}
          <p>
            Travessias com:{' '}
            {crossingTitles.length === 0
              ? 'nenhuma'
              : crossingTitles.join(', ')}
          </p>
        </section>
      )}
    </section>
  )
}
