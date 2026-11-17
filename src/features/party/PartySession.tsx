import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  modifierSchema,
  useCatalogCards,
  useClasses,
  type Card,
  type ClassDefinition,
} from '../../api/catalog'
import { ApiError } from '../../api/http'
import {
  useEndSession,
  usePartyAction,
  useStartSession,
  type Party,
  type PartyMember,
  type PartyStatus,
} from '../../api/parties'
import { FullCard } from '../../ui/cards/FullCard'
import { formatSavedAt } from '../../ui/formatSavedAt'
import { Term } from '../../ui/Term'
import { PartyMap } from './PartyMap'

type Cards = ReadonlyMap<string, Card>

/** Ids das cartas cujos nomes a partida mostra (REQ-30). */
function cardIdsOf(party: Party): string[] {
  return [
    party.dimension.dimensionCardId,
    party.dimension.startingCityZoneId,
    ...party.dimension.map.zones.map(({ zoneId }) => zoneId),
    ...party.members.flatMap(({ player }) => [
      player.zoneId,
      player.respawnZoneId,
      ...player.hand,
      ...player.build.map(({ cardId }) => cardId),
      ...player.tcgFolder.map(({ cardId }) => cardId),
    ]),
  ]
}

/** Nome exibido de uma carta (zonas e eventos usam `title`); "…" até chegar. */
function nameOf(cards: Cards, cardId: string): string {
  const card = cards.get(cardId)
  if (card === undefined) return '…'
  return 'name' in card ? card.name : card.title
}

/** Seção de um membro com o estado do jogador (REQ-30). */
function MemberState({
  member,
  classes,
  cards,
}: {
  member: PartyMember
  classes: ClassDefinition[]
  cards: Cards
}) {
  const { player } = member
  const titleId = `member-${member.id}`
  const handId = `hand-${member.id}`
  const buildId = `build-${member.id}`
  const folderId = `folder-${member.id}`
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>{member.characterName}</h2>
      {player.playerClasses.map(({ playerClass, deckLockMet }) => (
        <p key={playerClass}>
          Classe:{' '}
          {classes.find((c) => c.playerClass === playerClass)?.name ?? '…'}{' '}
          {deckLockMet ? '(trava cumprida)' : '(trava não cumprida)'}
        </p>
      ))}
      <p>
        Vida {player.health}/{player.maxHealth}
      </p>
      <p>Vida base {player.baseHealth}</p>
      <p>Pico {player.peak}</p>
      <p>Vigor {player.vigor}</p>
      <p>Ouro {player.gold}</p>
      <ul aria-label="Modificadores">
        {modifierSchema.options.map((m) => (
          <li key={m}>
            {player.modifiers[m]} <Term id={m} />
          </li>
        ))}
      </ul>
      <p>Zona atual: {nameOf(cards, player.zoneId)}</p>
      <p>Ponto de respawn: {nameOf(cards, player.respawnZoneId)}</p>
      <p>Deck de atributos: {player.attributeDeckCount} cartas</p>
      <p>Descarte de atributos: {player.attributeDiscardPileCount} cartas</p>
      <h3 id={buildId}>Build ({player.buildSize} cartas)</h3>
      <ul aria-labelledby={buildId}>
        {player.build.map(({ cardId, copies }) => (
          <li key={cardId}>
            {copies}× {nameOf(cards, cardId)}
          </li>
        ))}
      </ul>
      <h3 id={folderId}>
        Pasta de TCG (capacidade {player.tcgFolderCapacity})
      </h3>
      {player.tcgFolder.length === 0 ? (
        <p>Pasta vazia.</p>
      ) : (
        <ul aria-labelledby={folderId}>
          {player.tcgFolder.map(({ cardId, copies }) => (
            <li key={cardId}>
              {copies}× {nameOf(cards, cardId)}
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby={handId}>
        <h3 id={handId}>Mão ({player.hand.length})</h3>
        {player.hand.map((cardId, i) => {
          const card = cards.get(cardId)
          return card === undefined ? null : <FullCard key={i} card={card} />
        })}
      </section>
    </section>
  )
}

/** Região "A vez" (REQ-36) com "Encerrar a vez" (REQ-37, REQ-38). */
function TurnState({
  party,
  onEndTurn,
  pending,
}: {
  party: Party
  onEndTurn: () => void
  pending: boolean
}) {
  const { round, memberId, actionPoints } = party.turn
  const current = party.members.find((m) => m.id === memberId)
  const host = party.members.find((m) => m.isHost)
  return (
    <section aria-labelledby="turn-title">
      <h2 id="turn-title">A vez</h2>
      <p>Rodada {round}</p>
      <p>Vez de {current?.characterName ?? '…'}</p>
      <p>
        {actionPoints}{' '}
        <Term
          id="actionPoints"
          label={actionPoints === 1 ? 'ponto de ação' : 'pontos de ação'}
        />
      </p>
      {host?.player.availableActions.includes('endTurn') && (
        <button type="button" onClick={onEndTurn} disabled={pending}>
          Encerrar a vez
        </button>
      )}
    </section>
  )
}

/** Estado da partida preparada (REQ-30) com a vez (REQ-36) e o mapa (REQ-34). */
function PreparedMatch({
  party,
  classes,
  cards,
  onMove,
  onEndTurn,
  moving,
}: {
  party: Party
  classes: ClassDefinition[]
  cards: Cards
  onMove: (zoneId: string) => void
  onEndTurn: () => void
  moving: boolean
}) {
  const names = new Map(party.members.map((m) => [m.id, m.characterName]))
  return (
    <>
      <p>Dimensão: {nameOf(cards, party.dimension.dimensionCardId)}</p>
      <p>Cidade inicial: {nameOf(cards, party.dimension.startingCityZoneId)}</p>
      <TurnState party={party} onEndTurn={onEndTurn} pending={moving} />
      <PartyMap
        party={party}
        cards={cards}
        titleOf={(cardId) => nameOf(cards, cardId)}
        onMove={onMove}
        moving={moving}
      />
      <h2 id="turn-order-title">Ordem dos jogadores</h2>
      <ul aria-labelledby="turn-order-title">
        {party.turnOrder.map((id) => (
          <li key={id}>{names.get(id)}</li>
        ))}
      </ul>
      {party.members.map((member) => (
        <MemberState
          key={member.id}
          member={member}
          classes={classes}
          cards={cards}
        />
      ))}
    </>
  )
}

const statusLabel: Record<PartyStatus, string> = {
  idle: 'Pausado',
  inSession: 'Em sessão',
}

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError
    ? error.message
    : 'Servidor indisponível. Tente novamente.'
}

function isNotFound(error: Error | null): boolean {
  return error instanceof ApiError && error.code === 'PARTY_NOT_FOUND'
}

/** Tela do grupo em sessão (REQ-16): Continuar ao abrir, "Encerrar sessão". */
export function PartySession() {
  const { partyId = '' } = useParams()
  const navigate = useNavigate()
  const start = useStartSession(partyId)
  const end = useEndSession(partyId)
  const action = usePartyAction(partyId)
  const { mutate: startSession } = start

  // Continuar ao abrir; repetir não muda nada (CONTRATO §3 FEAT-05, D-37).
  useEffect(() => startSession(), [startSession])

  function endSession(): void {
    end.mutate(undefined, {
      onSuccess: () =>
        navigate('/', { state: { message: 'Sessão encerrada.' } }),
    })
  }

  // O `200` da ação já traz o `Party` gravado (D-55 item 4); erro não muda a tela.
  const party = action.data ?? start.data
  const classes = useClasses()
  const cards = useCatalogCards(party === undefined ? [] : cardIdsOf(party))
  const host = party?.members.find((m) => m.isHost)

  let status = ''
  if (end.isError) status = errorText(end.error)
  else if (action.isError) status = errorText(action.error)
  else if (action.isSuccess && party !== undefined && host !== undefined) {
    if (action.variables.type === 'endTurn') {
      const current = party.members.find((m) => m.id === party.turn.memberId)
      status = `Rodada ${party.turn.round}: vez de ${current?.characterName ?? '…'}.`
    } else {
      status = `Você está em ${nameOf(cards.cards, host.player.zoneId)}.`
    }
  } else if (start.isError) status = errorText(start.error)
  else if (!start.isSuccess) status = 'Abrindo o grupo…'
  else if (classes.isError) status = errorText(classes.error)
  else if (cards.error !== null) status = errorText(cards.error)
  else if (classes.isPending || cards.isPending) {
    status = 'Carregando a partida…'
  }

  const notFound = isNotFound(start.error) || isNotFound(end.error)

  return (
    <main>
      {party && (
        <>
          <h1>{party.name}</h1>
          <h2 id="members-title">Membros</h2>
          <ul aria-labelledby="members-title">
            {party.members.map((member) => (
              <li key={member.id}>
                {member.characterName}
                {member.isHost && ' (host)'}
              </li>
            ))}
          </ul>
          <p>{statusLabel[party.status]}</p>
          <p>Salvo em {formatSavedAt(party.savedAt)}</p>
          <button type="button" onClick={endSession} disabled={end.isPending}>
            Encerrar sessão
          </button>
          <PreparedMatch
            party={party}
            classes={classes.data ?? []}
            cards={cards.cards}
            onMove={(zoneId) => action.mutate({ type: 'move', zoneId })}
            onEndTurn={() => action.mutate({ type: 'endTurn' })}
            moving={action.isPending}
          />
        </>
      )}
      <p role="status">{status}</p>
      {notFound && <Link to="/">Voltar ao início</Link>}
    </main>
  )
}
