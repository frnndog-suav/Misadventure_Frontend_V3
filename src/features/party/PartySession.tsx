import { useEffect, useState } from 'react'
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
  ActionNotAllowedError,
  useEndSession,
  usePartyAction,
  useStartSession,
  type CardCopies,
  type Party,
  type PartyMember,
  type PartyStatus,
  type RecoverAction,
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

const recoverOptions: { option: RecoverAction['option']; label: string }[] = [
  { option: 'drawToHand', label: 'Comprar cartas' },
  { option: 'shuffleHand', label: 'Mão no deck' },
  { option: 'shuffleDiscard', label: 'Descarte no deck' },
]

/** Texto de cada motivo de recusa do "Ajustar deck" (REQ-42); outro motivo → só a `message`. */
function reasonText(error: ActionNotAllowedError, cards: Cards): string {
  const name = nameOf(cards, error.cardId ?? '')
  switch (error.reason) {
    case 'buildBelowMinimum':
      return 'A build ficou abaixo do mínimo de cartas.'
    case 'notOwned':
      return `Você não tem cópias suficientes de ${name}.`
    case 'copyLimitExceeded':
      return `${name} passou do limite de cópias no deck.`
    case 'tcgFolderFull':
      return 'Não há espaço na pasta de TCG para as cartas que saíram da build.'
    case 'notConnected':
    case 'noActionPoints':
      return ''
    default: {
      const _exhaustive: never = error.reason
      return _exhaustive
    }
  }
}

/** Erro mostrado na seção "Ajustar deck" (REQ-42). */
function adjustErrorText(error: Error, cards: Cards): string {
  if (error instanceof ActionNotAllowedError) {
    const reason = reasonText(error, cards)
    return reason === '' ? error.message : `${error.message} ${reason}`
  }
  return errorText(error)
}

const invalidCopies = 'Use um número inteiro a partir de 0.'

/** Seção "Ajustar deck" (REQ-42): cópias na build por carta da build ∪ pasta (D-57 item 2). */
function AdjustDeck({
  player,
  cards,
  onSave,
  onCancel,
  pending,
  error,
}: {
  player: PartyMember['player']
  cards: Cards
  onSave: (build: CardCopies[]) => void
  onCancel: () => void
  pending: boolean
  error: string
}) {
  const copiesIn = (list: CardCopies[], cardId: string): number =>
    list.find((entry) => entry.cardId === cardId)?.copies ?? 0
  const cardIds = [
    ...new Set([
      ...player.build.map(({ cardId }) => cardId),
      ...player.tcgFolder.map(({ cardId }) => cardId),
    ]),
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      cardIds.map((id) => [id, String(copiesIn(player.build, id))]),
    ),
  )
  const [invalid, setInvalid] = useState<string[]>([])

  function save(): void {
    const wrong = cardIds.filter((id) => !/^\d+$/.test(draft[id] ?? ''))
    setInvalid(wrong)
    if (wrong.length > 0) return
    onSave(
      cardIds
        .map((cardId) => ({ cardId, copies: Number(draft[cardId]) }))
        .filter(({ copies }) => copies >= 1),
    )
  }

  return (
    <section aria-labelledby="adjust-deck-title">
      <h2 id="adjust-deck-title">Ajustar deck</h2>
      <ul>
        {cardIds.map((cardId) => {
          const name = nameOf(cards, cardId)
          const fieldId = `adjust-${cardId}`
          const errorId = `${fieldId}-error`
          const isInvalid = invalid.includes(cardId)
          return (
            <li key={cardId}>
              <p>{name}</p>
              <p>Na build: {copiesIn(player.build, cardId)}</p>
              <p>Na pasta: {copiesIn(player.tcgFolder, cardId)}</p>
              <label htmlFor={fieldId}>Cópias na build de {name}</label>
              <input
                id={fieldId}
                type="number"
                min={0}
                value={draft[cardId] ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, [cardId]: e.target.value })
                }
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? errorId : undefined}
              />
              {isInvalid && <p id={errorId}>{invalidCopies}</p>}
            </li>
          )
        })}
      </ul>
      {error !== '' && <p>{error}</p>}
      <button type="button" onClick={save} disabled={pending}>
        Salvar build
      </button>
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancelar
      </button>
    </section>
  )
}

/** Região "A vez" (REQ-36) com "Recuperar" (REQ-41), "Ajustar deck" (REQ-42) e "Encerrar a vez" (REQ-37, REQ-38). */
function TurnState({
  party,
  onEndTurn,
  onRecover,
  onAdjust,
  adjusting,
  pending,
}: {
  party: Party
  onEndTurn: () => void
  onRecover: (option: RecoverAction['option']) => void
  onAdjust: () => void
  adjusting: boolean
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
      {host?.player.availableActions.includes('recover') && (
        <div role="group" aria-label="Recuperar">
          {recoverOptions.map(({ option, label }) => (
            <button
              key={option}
              type="button"
              onClick={() => onRecover(option)}
              disabled={pending}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {host?.player.availableActions.includes('adjustDeck') && (
        <button
          type="button"
          onClick={onAdjust}
          disabled={pending || adjusting}
        >
          Ajustar deck
        </button>
      )}
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
  onRecover,
  onSaveBuild,
  adjustError,
  adjusting,
  setAdjusting,
  moving,
}: {
  party: Party
  classes: ClassDefinition[]
  cards: Cards
  onMove: (zoneId: string) => void
  onEndTurn: () => void
  onRecover: (option: RecoverAction['option']) => void
  onSaveBuild: (build: CardCopies[]) => void
  adjustError: string
  adjusting: boolean
  setAdjusting: (open: boolean) => void
  moving: boolean
}) {
  const names = new Map(party.members.map((m) => [m.id, m.characterName]))
  const host = party.members.find((m) => m.isHost)
  return (
    <>
      <p>Dimensão: {nameOf(cards, party.dimension.dimensionCardId)}</p>
      <p>Cidade inicial: {nameOf(cards, party.dimension.startingCityZoneId)}</p>
      <TurnState
        party={party}
        onEndTurn={onEndTurn}
        onRecover={onRecover}
        onAdjust={() => setAdjusting(true)}
        adjusting={adjusting}
        pending={moving}
      />
      {adjusting && host !== undefined && (
        <AdjustDeck
          player={host.player}
          cards={cards}
          onSave={onSaveBuild}
          onCancel={() => setAdjusting(false)}
          pending={moving}
          error={adjustError}
        />
      )}
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
  const [adjusting, setAdjusting] = useState(false)
  // Erros do "Ajustar deck" aparecem na seção, não na área de status (REQ-42).
  const adjustFailed = action.isError && action.variables.type === 'adjustDeck'

  let status = ''
  if (end.isError) status = errorText(end.error)
  else if (action.isError && !adjustFailed) status = errorText(action.error)
  else if (action.isSuccess && party !== undefined && host !== undefined) {
    if (action.variables.type === 'adjustDeck') {
      status = `Build salva: ${host.player.buildSize} cartas.`
    } else if (action.variables.type === 'endTurn') {
      const current = party.members.find((m) => m.id === party.turn.memberId)
      status = `Rodada ${party.turn.round}: vez de ${current?.characterName ?? '…'}.`
    } else if (action.variables.type === 'recover') {
      const { health, maxHealth, vigor } = host.player
      status = `Recuperou: vida ${health}/${maxHealth}, Vigor ${vigor}.`
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
            onRecover={(option) => action.mutate({ type: 'recover', option })}
            onSaveBuild={(build) =>
              action.mutate(
                { type: 'adjustDeck', build },
                { onSuccess: () => setAdjusting(false) },
              )
            }
            adjustError={
              adjustFailed ? adjustErrorText(action.error, cards.cards) : ''
            }
            adjusting={adjusting}
            setAdjusting={setAdjusting}
            moving={action.isPending}
          />
        </>
      )}
      <p role="status">{status}</p>
      {notFound && <Link to="/">Voltar ao início</Link>}
    </main>
  )
}
