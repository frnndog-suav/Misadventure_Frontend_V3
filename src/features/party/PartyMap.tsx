import { useState, type ReactNode } from 'react'
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
  movement,
  children,
}: {
  party: Party
  cards: ReadonlyMap<string, Card>
  titleOf: (cardId: string) => string
  onMove?: (zoneId: string, viaZoneId?: string) => void
  moving: boolean
  movement?: { memberId: string; path: string[] }
  children?: ReactNode
}) {
  const host = party.members.find((m) => m.isHost)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const { zones, crossings } = party.dimension.map
  const minX = Math.min(...zones.map((z) => z.x))
  const minY = Math.min(...zones.map((z) => z.y))
  const columnGaps = Math.max(...zones.map((z) => z.x)) - minX
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
  // REQ-86: rotas prontas do backend; sem entrada, só o botão simples.
  const route = host?.player.moveRoutes.find((r) => r.zoneId === chosenId)
  const crossingTitles =
    chosenId === null
      ? []
      : crossings.flatMap(({ zoneIds: [a, b] }) =>
          a === chosenId ? [titleOf(b)] : b === chosenId ? [titleOf(a)] : [],
        )

  return (
    <div className={onMove ? 'campaign-map-layout' : undefined}>
      <section className="campaign-panel" aria-label="Mapa">
        <h2>Mapa</h2>
        <div
          className="campaign-map-grid"
          style={{
            gridTemplateColumns:
              columnGaps > 0
                ? `repeat(${columnGaps}, minmax(0, 1fr) minmax(0, 0.12fr)) minmax(0, 1fr)`
                : 'minmax(0, 1fr)',
          }}
        >
          {zones.map((zone) => {
            const here = party.members.filter(
              ({ id, player }) =>
                (movement?.memberId === id
                  ? movement.path.at(-1)
                  : player.zoneId) === zone.zoneId,
            )
            const isCurrent = here.some((member) => member.isHost)
            const isDestination =
              onMove !== undefined &&
              host?.player.availableActions.includes('move') &&
              host.player.moveTargets.includes(zone.zoneId)
            return (
              <button
                key={zone.zoneId}
                type="button"
                aria-pressed={chosenId === zone.zoneId}
                aria-current={isCurrent ? 'location' : undefined}
                data-destination={isDestination || undefined}
                onClick={() => setChosenId(zone.zoneId)}
                disabled={!onMove}
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
                {movement?.path.includes(zone.zoneId) && (
                  <span> · Percurso</span>
                )}
                {here.map((m) => (
                  <span key={m.id}> {m.characterName} está aqui</span>
                ))}
                {isDestination && <span>Destino disponível</span>}
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
      </section>
      {onMove && (
        <div className="campaign-panel campaign-zone">
          {chosenId === null && (
            <>
              <h2>Zona</h2>
              <p>Selecione uma zona no mapa para consultar suas travessias.</p>
            </>
          )}
          {chosenId !== null && (
            <section aria-labelledby="chosen-zone-title">
              <h2 id="chosen-zone-title">Zona escolhida</h2>
              {chosen !== undefined ? (
                <FullCard card={chosen} />
              ) : (
                <p>{titleOf(chosenId)}</p>
              )}
              {host?.player.moveTargets.includes(chosenId) &&
                (host.player.availableActions.includes('move') ? (
                  <>
                    {(route === undefined || route.direct) && (
                      <button
                        type="button"
                        onClick={() => onMove(chosenId)}
                        disabled={moving}
                      >
                        Movimentar para {titleOf(chosenId)}
                      </button>
                    )}
                    {route?.via.map((viaZoneId) => (
                      <button
                        key={viaZoneId}
                        type="button"
                        onClick={() => onMove(chosenId, viaZoneId)}
                        disabled={moving}
                      >
                        Movimentar para {titleOf(chosenId)} passando por{' '}
                        {titleOf(viaZoneId)}
                      </button>
                    ))}
                  </>
                ) : (
                  party.turn.actionPoints === 0 && (
                    <p>Sem pontos de ação para Movimentar.</p>
                  )
                ))}
              <p>
                Travessias com:{' '}
                {crossingTitles.length === 0
                  ? 'nenhuma'
                  : crossingTitles.join(', ')}
              </p>
            </section>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
