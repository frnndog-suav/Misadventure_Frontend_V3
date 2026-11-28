import { useState, type ReactNode } from 'react'
import type { Card, EquipmentSlot } from '../../api/catalog'
import {
  ActionNotAllowedError,
  type Party,
  type PartyMember,
} from '../../api/parties'
import type { RandomEventAction } from '../../api/randomEvents'
import { RandomEventCard } from '../../ui/cards/RandomEventCard'
import { categoryCatalog } from '../../ui/categories'
import { Term } from '../../ui/Term'
import { nameOf } from './cardNames'

type Encounter = NonNullable<Party['randomEventEncounter']>
type Player = PartyMember['player']
type Cards = ReadonlyMap<string, Card>
type PayAction = Extract<RandomEventAction, { type: 'payEventRequirement' }>
type Receipt = Encounter['payments'][number]

const requirementStatus = {
  unpaid: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
  check: 'Verificação',
}

const resultText = {
  requirementsMet: 'Êxito',
  gaveUp: 'Revés por desistência',
  escapeSucceeded: 'Fuga bem-sucedida',
  escapeFailed: 'Revés por falha na fuga',
  timedOut: 'Revés por tempo esgotado',
}

function Receipts({ payments, cards }: { payments: Receipt[]; cards: Cards }) {
  if (!payments.length) return null
  return (
    <ul aria-label="Recibos de pagamento">
      {payments.map((receipt, index) => (
        <li key={index}>
          {receipt.requirementId}
          {receipt.gold !== undefined && <span> · Ouro {receipt.gold}</span>}
          {receipt.health !== undefined && (
            <span> · Vida {receipt.health}</span>
          )}
          {receipt.vigor !== undefined && <span> · Vigor {receipt.vigor}</span>}
          {receipt.handCards?.map(({ copyId, cardId }) => (
            <span key={copyId}>
              {' '}
              · {nameOf(cards, cardId, cardId)} ({copyId})
            </span>
          ))}
          {receipt.movedAttributeCards?.map(({ copyId, cardId }) => (
            <span key={copyId}>
              {' '}
              · Movida {nameOf(cards, cardId, cardId)} ({copyId})
            </span>
          ))}
          {receipt.equipment?.map(({ slot, cardId }) => (
            <span key={slot}>
              {' '}
              · {nameOf(cards, cardId, cardId)} ({categoryCatalog[slot].label})
            </span>
          ))}
          {receipt.resources?.map(({ cardId, copies }) => (
            <span key={cardId}>
              {' '}
              · {copies} × {nameOf(cards, cardId, cardId)}
            </span>
          ))}
        </li>
      ))}
    </ul>
  )
}

function RequirementPayment({
  progress,
  requirement,
  player,
  cards,
  pending,
  onPay,
}: {
  progress: Encounter['requirements'][number]
  requirement:
    NonNullable<Encounter['card']>['requirements'][number] | undefined
  player: Player
  cards: Cards
  pending: boolean
  onPay: (payment: PayAction['payment']) => void
}) {
  const [copyIds, setCopyIds] = useState<string[]>([])
  const [slots, setSlots] = useState<EquipmentSlot[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const {
    handCardSelection,
    eligibleHandCopyIds,
    eligibleEquipmentSlots,
    eligibleResourceCardIds,
    remaining,
    amountDue,
  } = progress
  const random = handCardSelection === 'random'
  const hand =
    handCardSelection === 'choose'
      ? player.handCopies.filter(({ copyId }) =>
          eligibleHandCopyIds.includes(copyId),
        )
      : []
  const equipment = random ? [] : eligibleEquipmentSlots
  const resources = random
    ? []
    : [...new Set(eligibleResourceCardIds)]
        .map((cardId) => ({
          cardId,
          quantity: player.inventory.reduce(
            (total, slot) =>
              total + (slot.cardId === cardId ? slot.quantity : 0),
            0,
          ),
        }))
        .filter(({ quantity }) => quantity > 0)
  const handCount =
    handCardSelection !== 'choose'
      ? 0
      : requirement?.kind === 'manipulateAttributeCards'
        ? remaining && 'copies' in remaining
          ? remaining.copies
          : (amountDue ?? requirement.count)
        : 1
  const slotCount = equipment.length
    ? (amountDue ??
      (requirement?.kind === 'abandonEquipment' ? requirement.count : 1))
    : 0
  const resourceCount = resources.length
    ? (amountDue ??
      (requirement?.kind === 'offerResources'
        ? requirement.requirements.reduce(
            (total, entry) => total + entry.count,
            0,
          )
        : null))
    : null
  const handCards = copyIds.filter((id) =>
    hand.some(({ copyId }) => copyId === id),
  )
  const equipmentSlots = slots.filter((slot) => equipment.includes(slot))
  const resourcePayment = resources
    .map(({ cardId, quantity }) => ({
      cardId,
      copies: Math.min(quantity, quantities[cardId] ?? 0),
    }))
    .filter(({ copies }) => copies > 0)
  const resourceTotal = resourcePayment.reduce(
    (total, { copies }) => total + copies,
    0,
  )
  const valid =
    handCards.length === handCount &&
    equipmentSlots.length === slotCount &&
    (resourceCount === null
      ? !resources.length || resourceTotal > 0
      : resourceTotal === resourceCount)
  const payment = {
    ...(handCards.length > 0 && { handCards }),
    ...(equipmentSlots.length > 0 && { equipmentSlots }),
    ...(resourcePayment.length > 0 && { resources: resourcePayment }),
  }

  return (
    <fieldset disabled={pending}>
      <legend>Pagamento</legend>
      {random && <p>O jogo sorteia uma carta da mão.</p>}
      {handCount > 0 && <p>Escolha {handCount} da mão.</p>}
      {hand.map(({ copyId, cardId }) => (
        <label key={copyId}>
          <input
            type="checkbox"
            checked={handCards.includes(copyId)}
            disabled={
              !handCards.includes(copyId) && handCards.length >= handCount
            }
            onChange={(e) =>
              setCopyIds(
                e.target.checked
                  ? [...handCards, copyId]
                  : handCards.filter((id) => id !== copyId),
              )
            }
          />
          {nameOf(cards, cardId, cardId)} ({copyId})
        </label>
      ))}
      {slotCount > 0 && <p>Escolha {slotCount} entre os equipamentos.</p>}
      {equipment.map((slot) => (
        <label key={slot}>
          <input
            type="checkbox"
            checked={equipmentSlots.includes(slot)}
            disabled={
              !equipmentSlots.includes(slot) &&
              equipmentSlots.length >= slotCount
            }
            onChange={(e) =>
              setSlots(
                e.target.checked
                  ? [...equipmentSlots, slot]
                  : equipmentSlots.filter((id) => id !== slot),
              )
            }
          />
          {categoryCatalog[slot].label}{' '}
          {nameOf(cards, player.equipment[slot] ?? '', '')}
        </label>
      ))}
      {resourceCount !== null && (
        <p>Escolha {resourceCount} entre os recursos.</p>
      )}
      {resources.map(({ cardId, quantity }) => (
        <label key={cardId}>
          {nameOf(cards, cardId, cardId)} (até {quantity})
          <input
            type="number"
            min={0}
            max={quantity}
            step={1}
            value={Math.min(quantity, quantities[cardId] ?? 0)}
            onChange={(e) =>
              setQuantities({
                ...quantities,
                [cardId]: Math.min(
                  quantity,
                  Math.max(0, Math.trunc(e.target.valueAsNumber || 0)),
                ),
              })
            }
          />
        </label>
      ))}
      <button
        type="button"
        disabled={!valid}
        onClick={() => onPay(Object.keys(payment).length ? payment : undefined)}
      >
        Pagar requisito
      </button>
    </fieldset>
  )
}

function EncounterControls({
  encounter,
  player,
  canAct,
  cards,
  pending,
  onAction,
  error,
  status,
}: {
  encounter: Encounter
  player: Player
  canAct: boolean
  cards: Cards
  pending: boolean
  onAction: (action: RandomEventAction) => void
  error: Error | null
  status?: ReactNode
}) {
  const [confirmation, setConfirmation] = useState<
    'giveUpEvent' | 'escapeEvent' | null
  >(null)
  const { card, id, escape } = encounter
  const allowed = (type: RandomEventAction['type']) =>
    canAct && player.availableActions.includes(type)
  const canEscape = allowed('escapeEvent') && escape !== null
  const send = (
    type: 'revealEvent' | 'resolveEvent' | 'giveUpEvent' | 'escapeEvent',
  ) => onAction({ type, encounterId: id })

  return (
    <section
      className="campaign-panel campaign-encounter"
      aria-label="Evento aleatório"
    >
      <h2>
        {encounter.phase === 'anticipation'
          ? 'Antecipação'
          : 'Evento aleatório'}
      </h2>
      {encounter.phase === 'anticipation' && <p>A carta está oculta.</p>}
      {allowed('revealEvent') && (
        <button
          type="button"
          disabled={pending}
          onClick={() => send('revealEvent')}
        >
          Revelar carta
        </button>
      )}
      {encounter.phase !== 'anticipation' && card && (
        <>
          <div className="campaign-reveal">
            <RandomEventCard card={card} />
          </div>
          <ul aria-label="Progresso dos requisitos">
            {encounter.requirements.map((progress) => {
              const { requirementId, remaining, status, amountDue } = progress
              const requirement = card.requirements.find(
                ({ id }) => id === requirementId,
              )
              return (
                <li key={requirementId}>
                  <p>
                    {requirement?.text ?? requirementId} ·{' '}
                    {requirementStatus[status]}
                  </p>
                  {remaining &&
                    ('copies' in remaining ? (
                      <p>Cópias restantes: {remaining.copies}</p>
                    ) : (
                      <p>
                        Restam{' '}
                        {Object.entries(remaining.specific).map(
                          ([attribute, count]) => (
                            <span key={attribute}>
                              {count}{' '}
                              <Term
                                id={
                                  attribute as keyof typeof remaining.specific
                                }
                              />{' '}
                              ·{' '}
                            </span>
                          ),
                        )}
                        {remaining.any} de qualquer atributo.
                      </p>
                    ))}
                  {amountDue !== null && <p>Quantidade devida: {amountDue}</p>}
                  {allowed('payEventRequirement') && progress.payable && (
                    <RequirementPayment
                      progress={progress}
                      requirement={requirement}
                      player={player}
                      cards={cards}
                      pending={pending}
                      onPay={(payment) =>
                        onAction({
                          type: 'payEventRequirement',
                          encounterId: id,
                          requirementId,
                          ...(payment && { payment }),
                        })
                      }
                    />
                  )}
                </li>
              )
            })}
          </ul>
          <Receipts payments={encounter.payments} cards={cards} />
          {allowed('resolveEvent') && (
            <button
              type="button"
              disabled={pending}
              onClick={() => send('resolveEvent')}
            >
              Resolver evento
            </button>
          )}
          {allowed('giveUpEvent') && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmation('giveUpEvent')}
            >
              Desistir
            </button>
          )}
          {canEscape && (
            <>
              <p>
                Fuga: {escape.vigorCost} de Vigor ·{' '}
                {escape.automatic ? 'automática' : `limiar ${escape.threshold}`}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmation('escapeEvent')}
              >
                Fugir
              </button>
            </>
          )}
          {confirmation && allowed(confirmation) && (
            <div
              role="group"
              aria-label={
                confirmation === 'escapeEvent'
                  ? 'Confirmar fuga'
                  : 'Confirmar desistência'
              }
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  send(confirmation)
                  setConfirmation(null)
                }}
              >
                {confirmation === 'escapeEvent'
                  ? 'Confirmar fuga'
                  : 'Confirmar desistência'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmation(null)}
              >
                Cancelar
              </button>
            </div>
          )}
          {error instanceof ActionNotAllowedError &&
            error.reason === 'eventMinimumNotMet' && (
              <ul aria-label="Mínimos não atingidos" role="alert">
                {error.checks?.map(
                  ({ requirementId, stat, minimum, actual }) => (
                    <li key={requirementId}>
                      {stat === 'peak' ? (
                        'Pico'
                      ) : stat === 'vigor' ? (
                        'Vigor'
                      ) : (
                        <Term id={stat} />
                      )}
                      {' — mínimo '}
                      {minimum}, atual {actual}
                    </li>
                  ),
                )}
              </ul>
            )}
        </>
      )}
      {status}
    </section>
  )
}

export function RandomEventPanel({
  party,
  host,
  cards,
  pending,
  onAction,
  error,
  status,
}: {
  party: Party
  host: PartyMember | undefined
  cards: Cards
  pending: boolean
  onAction: (action: RandomEventAction) => void
  error: Error | null
  status?: ReactNode
}) {
  const encounter = party.randomEventEncounter
  const owner = party.members.find(({ id }) => id === encounter?.memberId)
  const result = host?.player.lastRandomEvent
  const resultCard = result && cards.get(result.cardId)
  return (
    <>
      {!encounter &&
        host?.id === party.turn.memberId &&
        host.player.availableActions.includes('startEvent') && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onAction({ type: 'startEvent' })}
          >
            Iniciar evento
          </button>
        )}
      {encounter && owner && (
        <EncounterControls
          key={encounter.id}
          encounter={encounter}
          player={owner.player}
          canAct={owner.id === host?.id && owner.id === party.turn.memberId}
          cards={cards}
          pending={pending}
          onAction={onAction}
          error={error}
          status={status}
        />
      )}
      {result && (
        <section
          className="campaign-panel campaign-outcome"
          aria-label="Resultado do último evento"
        >
          <h2>{resultText[result.cause]}</h2>
          <p>{nameOf(cards, result.cardId, result.cardId)}</p>
          {resultCard?.type === 'randomEvent' &&
            result.resolution !== 'escaped' && (
              <p>
                {
                  (result.resolution === 'success'
                    ? resultCard.goodOutcome
                    : resultCard.badOutcome
                  ).text
                }
              </p>
            )}
          <p>
            Reposição: {result.replacement.drawn} de{' '}
            {result.replacement.requested} cartas.
          </p>
          <p>Variação de Pico: {result.peakDelta}</p>
          {result.escape && (
            <>
              <p>Vigor gasto: {result.escape.vigorSpent}</p>
              {result.escape.naturalRoll === null ? (
                <p>Fuga automática</p>
              ) : (
                <p>
                  Rolagem {result.escape.naturalRoll} · total{' '}
                  {result.escape.total} · limiar {result.escape.threshold}
                </p>
              )}
              <p>PA perdidos: {result.escape.actionPointsLost}</p>
              <p>
                Dívida de PA na próxima vez:{' '}
                {result.escape.nextTurnActionPointDebtAdded}
              </p>
            </>
          )}
          <Receipts payments={result.payments} cards={cards} />
        </section>
      )}
    </>
  )
}
