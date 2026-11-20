import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  equipmentSlotSchema,
  modifierSchema,
  useCatalogCards,
  useClasses,
  type Card,
  type ClassDefinition,
  type EquipmentSlot,
} from '../../api/catalog'
import { ApiError } from '../../api/http'
import {
  ActionNotAllowedError,
  useEndSession,
  useParty,
  usePartyAction,
  useStartSession,
  type CardCopies,
  type Party,
  type PartyMember,
  type PartyStatus,
  type RecoverAction,
  type VaultOperation,
} from '../../api/parties'
import {
  randomEventActionTypes,
  type RandomEventAction,
} from '../../api/randomEvents'
import { FullCard } from '../../ui/cards/FullCard'
import { categoryCatalog } from '../../ui/categories'
import { formatSavedAt } from '../../ui/formatSavedAt'
import { Term } from '../../ui/Term'
import { PartyMap } from './PartyMap'
import { EffectsPanel, type ActivateEffect } from './EffectsPanel'
import { nameOf } from './cardNames'
import { RandomEventPanel } from './RandomEventPanel'
import { RewardChoice } from './RewardChoice'

type Cards = ReadonlyMap<string, Card>

function eventReceiptCardIds(
  payments: NonNullable<Party['randomEventEncounter']>['payments'],
): string[] {
  return payments.flatMap(
    ({ handCards, movedAttributeCards, equipment, resources }) =>
      [
        ...(handCards ?? []),
        ...(movedAttributeCards ?? []),
        ...(equipment ?? []),
        ...(resources ?? []),
      ].map(({ cardId }) => cardId),
  )
}

/** Ids das cartas cujos nomes a partida mostra (REQ-30). */
function cardIdsOf(party: Party): string[] {
  return [
    party.dimension.dimensionCardId,
    party.dimension.startingCityZoneId,
    ...party.dimension.map.zones.map(({ zoneId }) => zoneId),
    ...eventReceiptCardIds(party.randomEventEncounter?.payments ?? []),
    ...party.pendingRewards.flatMap(({ cardId, discardOptions }) => [
      cardId,
      ...discardOptions.map((option) => option.cardId),
    ]),
    ...party.members.flatMap(({ player }) => [
      player.zoneId,
      player.respawnZoneId,
      ...player.hand,
      ...player.build.map(({ cardId }) => cardId),
      ...player.tcgFolder.map(({ cardId }) => cardId),
      ...player.inventory.map(({ cardId }) => cardId),
      ...player.statuses.map(({ sourceCardId }) => sourceCardId),
      ...player.activatableEffects.map(({ cardId }) => cardId),
      ...Object.values(player.equipment).filter((id) => id !== null),
      ...player.vault.slots.map(({ cardId }) => cardId),
      ...player.vault.decks.flat().map(({ cardId }) => cardId),
      ...player.scavengeTargets,
      ...(player.lastRewardDelivery ? [player.lastRewardDelivery.cardId] : []),
      ...(player.lastRandomEvent === null
        ? []
        : [
            player.lastRandomEvent.cardId,
            ...eventReceiptCardIds(player.lastRandomEvent.payments),
          ]),
      ...(player.lastScavenge === null ? [] : [player.lastScavenge.cardId]),
    ]),
  ]
}

/** "Equipar"/"Guardar" do host com `prepare` (REQ-45); `null` nos outros casos. */
type PrepareControls = {
  onEquip?: (cardId: string) => void
  onUnequip?: (slot: EquipmentSlot, cardId: string) => void
  onActivate: ActivateEffect
  pending: boolean
}

/** Seção de um membro com o estado do jogador (REQ-30). */
function MemberState({
  member,
  classes,
  cards,
  prepare,
}: {
  member: PartyMember
  classes: ClassDefinition[]
  cards: Cards
  prepare: PrepareControls | null
}) {
  const { player } = member
  const titleId = `member-${member.id}`
  const handId = `hand-${member.id}`
  const buildId = `build-${member.id}`
  const folderId = `folder-${member.id}`
  const equipmentId = `equipment-${member.id}`
  const inventoryId = `inventory-${member.id}`
  const vaultId = `vault-${member.id}`
  const decksId = `vault-decks-${member.id}`
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
      <p>
        Ouro {player.gold} (bolsa para {player.purseCapacity})
      </p>
      <ul aria-label="Modificadores">
        {modifierSchema.options.map((m) => (
          <li key={m}>
            {player.effectiveModifiers[m]} <Term id={m} />
          </li>
        ))}
      </ul>
      <ul aria-label="Modificadores da classe">
        {modifierSchema.options.map((m) => (
          <li key={m}>
            {player.modifiers[m]} <Term id={m} />
          </li>
        ))}
      </ul>
      <EffectsPanel
        player={player}
        cards={cards}
        pending={prepare?.pending ?? false}
        onActivate={prepare?.onActivate}
      />
      <p>Zona atual: {nameOf(cards, player.zoneId)}</p>
      <p>Ponto de respawn: {nameOf(cards, player.respawnZoneId)}</p>
      <p>Deck de atributos: {player.attributeDeckCount} cartas</p>
      <p>Descarte de atributos: {player.attributeDiscardPileCount} cartas</p>
      <h3 id={equipmentId}>Equipamentos</h3>
      <ul aria-labelledby={equipmentId}>
        {equipmentSlotSchema.options.map((slot) => {
          const cardId = player.equipment[slot]
          return (
            <li key={slot}>
              {categoryCatalog[slot].label}:{' '}
              {cardId === null ? 'vazio' : nameOf(cards, cardId)}
              {cardId !== null && prepare?.onUnequip && (
                <button
                  type="button"
                  onClick={() => prepare.onUnequip?.(slot, cardId)}
                  disabled={prepare.pending}
                >
                  Guardar {nameOf(cards, cardId)}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <h3 id={inventoryId}>
        Inventário ({player.inventory.length} de {player.inventoryCapacity}{' '}
        slots)
      </h3>
      {player.inventory.length === 0 ? (
        <p>Inventário vazio.</p>
      ) : (
        <ul aria-labelledby={inventoryId}>
          {player.inventory.map(({ cardId, quantity }, i) => (
            <li key={i}>
              {quantity}× {nameOf(cards, cardId)}
              {/* Tipo da carta do catálogo: dado de exibição, não regra (D-58). */}
              {prepare?.onEquip && cards.get(cardId)?.type === 'equipment' && (
                <button
                  type="button"
                  onClick={() => prepare.onEquip?.(cardId)}
                  disabled={prepare.pending}
                >
                  Equipar {nameOf(cards, cardId)}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <h3 id={vaultId}>
        Cofre ({player.vault.slots.length} de {player.vaultCapacity} slots)
      </h3>
      {player.vault.slots.length === 0 ? (
        <p>Cofre vazio.</p>
      ) : (
        <ul aria-labelledby={vaultId}>
          {player.vault.slots.map(({ cardId, quantity }, i) => (
            <li key={i}>
              {quantity}× {nameOf(cards, cardId)}
            </li>
          ))}
        </ul>
      )}
      <p>{`Ouro no cofre ${player.vault.gold} (capacidade ${player.vaultGoldCapacity})`}</p>
      <h3 id={decksId}>
        Decks guardados (até {player.vaultDeckSlots} slots de deck, contando a
        build em uso)
      </h3>
      {player.vault.decks.length === 0 ? (
        <p>Nenhum deck guardado.</p>
      ) : (
        <ul aria-labelledby={decksId}>
          {player.vault.decks.map((deck, i) => (
            <li key={i}>
              Deck {i + 1}
              <ul aria-label={`Deck ${i + 1}`}>
                {deck.map(({ cardId, copies }) => (
                  <li key={cardId}>
                    {copies}× {nameOf(cards, cardId)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
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

/**
 * Texto de cada motivo de recusa do "Ajustar deck" (REQ-42) e do Preparar
 * (REQ-45); outro motivo → só a `message`. `name`: a carta de `details.cardId`
 * (REQ-42) ou a do pedido (REQ-45).
 */
function reasonText(error: ActionNotAllowedError, name: string): string {
  switch (error.reason) {
    case 'buildBelowMinimum':
      return 'A build ficou abaixo do mínimo de cartas.'
    case 'notOwned':
      return `Você não tem cópias suficientes de ${name}.`
    case 'copyLimitExceeded':
      return `${name} passou do limite de cópias no deck.`
    case 'tcgFolderFull':
      return 'Não há espaço na pasta de TCG para as cartas que saíram da build.'
    case 'peakRequirementNotMet':
      return `Seu Pico não alcança o requisito de ${name}.`
    case 'classRestricted':
      return `Nenhuma das suas classes pode usar ${name}.`
    case 'shieldBlocked':
      return 'A arma em uso não deixa usar escudo.'
    case 'inventoryFull':
      return 'Não há espaço no inventário para o que sairia do equipamento.'
    // FEAT-32: os textos do Usar cofre ficam em `vaultReasonText` (REQ-52);
    // o Vasculhar só tem texto para inventoryFull, tratado à parte (REQ-51).
    case 'notConnected':
    case 'noActionPoints':
    case 'notInInventory':
    case 'notEquipment':
    case 'slotEmpty':
    case 'zoneActionUnavailable':
    case 'notInTcgFolder':
    case 'notStorable':
    case 'notInVault':
    case 'vaultFull':
    case 'notEnoughGold':
    case 'vaultGoldFull':
    case 'notEnoughVaultGold':
    case 'purseFull':
    case 'notAttribute':
    case 'deckSlotsFull':
    case 'deckNotFound':
    case 'notScavengeable':
    case 'equipmentNotInUse':
    case 'effectNotFound':
    case 'notActivatable':
    case 'notActivatableYet':
    case 'notEnoughVigor':
    case 'notEnoughLife':
    case 'notEnoughPeak':
    case 'paymentInvalid':
    case 'minimumNotMet':
    case 'choicePending':
    case 'eventDeckEmpty':
    case 'staleEncounter':
    case 'wrongEventPhase':
    case 'eventPaymentStarted':
    case 'escapeForbidden':
    case 'requirementPaid':
    case 'requirementNotPayable':
    case 'requirementsNotPaid':
    case 'eventMinimumNotMet':
    case 'staleReward':
    case 'rewardDoesNotFit':
      return ''
    default: {
      const _exhaustive: never = error.reason
      return _exhaustive
    }
  }
}

/** Erro de uma ação com motivo (REQ-42, REQ-45): `message` + texto do motivo. */
function refusalText(error: Error, name: string): string {
  if (error instanceof ActionNotAllowedError) {
    const reason = reasonText(error, name)
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
                disabled={pending}
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

/**
 * Texto de cada motivo de recusa do Usar cofre (REQ-52); outro motivo → ''
 * (só a `message`). `name`: a carta de `details.cardId` ou a da operação recusada.
 */
function vaultReasonText(error: ActionNotAllowedError, name: string): string {
  switch (error.reason) {
    case 'notInInventory':
      return `${name} não está no inventário nessa quantidade.`
    case 'notInTcgFolder':
      return `Não há essas cópias de ${name} na pasta de TCG.`
    case 'notStorable':
      return `${name} não pode ir para o cofre.`
    case 'notInVault':
      return `Não há essa quantidade de ${name} no cofre.`
    case 'vaultFull':
      return 'O cofre está cheio.'
    case 'notEnoughGold':
      return 'Não há ouro suficiente na bolsa.'
    case 'vaultGoldFull':
      return 'O ouro passaria da capacidade do cofre.'
    case 'notEnoughVaultGold':
      return 'Não há ouro suficiente no cofre.'
    case 'purseFull':
      return 'O ouro passaria da capacidade da bolsa.'
    case 'notAttribute':
      return `${name} não é carta de atributo.`
    case 'deckSlotsFull':
      return 'Não há slot de deck livre.'
    case 'deckNotFound':
      return 'Esse deck guardado não existe.'
    case 'inventoryFull':
      return 'Não há espaço no inventário.'
    case 'tcgFolderFull':
    case 'buildBelowMinimum':
    case 'notOwned':
    case 'copyLimitExceeded':
      return reasonText(error, name)
    case 'peakRequirementNotMet':
    case 'classRestricted':
    case 'shieldBlocked':
    case 'notConnected':
    case 'noActionPoints':
    case 'notEquipment':
    case 'slotEmpty':
    case 'zoneActionUnavailable':
    case 'notScavengeable':
    case 'equipmentNotInUse':
    case 'effectNotFound':
    case 'notActivatable':
    case 'notActivatableYet':
    case 'notEnoughVigor':
    case 'notEnoughLife':
    case 'notEnoughPeak':
    case 'paymentInvalid':
    case 'minimumNotMet':
    case 'choicePending':
    case 'eventDeckEmpty':
    case 'staleEncounter':
    case 'wrongEventPhase':
    case 'eventPaymentStarted':
    case 'escapeForbidden':
    case 'requirementPaid':
    case 'requirementNotPayable':
    case 'requirementsNotPaid':
    case 'eventMinimumNotMet':
    case 'staleReward':
    case 'rewardDoesNotFit':
      return ''
    default: {
      const _exhaustive: never = error.reason
      return _exhaustive
    }
  }
}

const invalidQuantity = 'Use um número inteiro a partir de 1.'

/** Inteiro ≥ `min` digitado num campo (formato, não regra do jogo). */
function isIntFrom(value: string, min: number): boolean {
  return /^\d+$/.test(value) && Number(value) >= min
}

function byCardId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Descrição de uma operação na lista "Operações" (REQ-52). */
function describeOperation(op: VaultOperation, cards: Cards): string {
  const total = (list: CardCopies[]) =>
    list.reduce((sum, { copies }) => sum + copies, 0)
  switch (op.operation) {
    case 'store':
      return `Guardar ${op.quantity}× ${nameOf(cards, op.cardId)}`
    case 'take':
      return `Retirar ${op.quantity}× ${nameOf(cards, op.cardId)}`
    case 'discard':
      return `Descartar ${op.quantity}× ${nameOf(cards, op.cardId)}`
    case 'storeGold':
      return `Guardar ${op.amount} de ouro`
    case 'takeGold':
      return `Retirar ${op.amount} de ouro`
    case 'saveDeck':
      return `Guardar deck de ${total(op.cards)} cartas`
    case 'unpackDeck':
      return `Desmontar deck ${op.deckIndex + 1}`
    case 'swapBuild':
      return `Usar deck ${op.deckIndex + 1} como build`
    case 'editBuild':
      return `Editar a build (${total(op.build)} cartas)`
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

/** Campo numérico com o erro ligado por `aria-describedby` (REQ-52). */
function NumberField({
  label,
  value,
  onChange,
  min,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  error: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error !== ''}
        aria-describedby={error !== '' ? errorId : undefined}
      />
      {error !== '' && <p id={errorId}>{error}</p>}
    </>
  )
}

/** "Guardar no cofre", "Retirar do cofre", "Descartar do cofre": carta + quantidade. */
function CardOperationForm({
  legend,
  cardIds,
  cards,
  warning,
  onAdd,
  pending,
}: {
  legend: string
  cardIds: string[]
  cards: Cards
  warning?: string
  onAdd: (cardId: string, quantity: number) => void
  pending: boolean
}) {
  const selectId = useId()
  const [cardId, setCardId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  function add(): void {
    if (!isIntFrom(quantity, 1)) {
      setError(invalidQuantity)
      return
    }
    setError('')
    onAdd(cardId, Number(quantity))
  }
  return (
    <fieldset disabled={pending}>
      <legend>{legend}</legend>
      <label htmlFor={selectId}>Carta</label>
      <select
        id={selectId}
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
      >
        <option value="">Escolha uma carta</option>
        {cardIds.map((id) => (
          <option key={id} value={id}>
            {nameOf(cards, id)}
          </option>
        ))}
      </select>
      <NumberField
        label="Quantidade"
        value={quantity}
        onChange={setQuantity}
        min={1}
        error={error}
      />
      {warning !== undefined && <p>{warning}</p>}
      <button type="button" onClick={add} disabled={pending || cardId === ''}>
        Acrescentar
      </button>
    </fieldset>
  )
}

/** "Ouro": "Guardar ouro" e "Retirar ouro" com o mesmo campo (REQ-52). */
function GoldForm({
  onAdd,
  pending,
}: {
  onAdd: (op: VaultOperation) => void
  pending: boolean
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  function add(operation: 'storeGold' | 'takeGold'): void {
    if (!isIntFrom(amount, 1)) {
      setError(invalidQuantity)
      return
    }
    setError('')
    onAdd({ operation, amount: Number(amount) })
  }
  return (
    <fieldset disabled={pending}>
      <legend>Ouro</legend>
      <NumberField
        label="Quantidade de ouro"
        value={amount}
        onChange={setAmount}
        min={1}
        error={error}
      />
      <button type="button" onClick={() => add('storeGold')} disabled={pending}>
        Guardar ouro
      </button>
      <button type="button" onClick={() => add('takeGold')} disabled={pending}>
        Retirar ouro
      </button>
    </fieldset>
  )
}

/**
 * Formulário de cópias por carta ("Guardar deck", "Editar build"): campos
 * inteiros ≥ 0; "Acrescentar" leva as linhas ≥ 1, em ordem de `cardId`.
 */
function CopiesForm({
  legend,
  rows,
  fieldLabel,
  details,
  initial,
  onAdd,
  pending,
}: {
  legend: string
  rows: string[]
  fieldLabel: (cardId: string) => string
  details?: (cardId: string) => string[]
  initial: (cardId: string) => number
  onAdd: (list: CardCopies[]) => void
  pending: boolean
}) {
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [invalid, setInvalid] = useState<string[]>([])
  const valueOf = (cardId: string) => draft[cardId] ?? String(initial(cardId))
  function add(): void {
    const wrong = rows.filter((id) => !isIntFrom(valueOf(id), 0))
    setInvalid(wrong)
    if (wrong.length > 0) return
    onAdd(
      rows
        .map((cardId) => ({ cardId, copies: Number(valueOf(cardId)) }))
        .filter(({ copies }) => copies >= 1),
    )
  }
  return (
    <fieldset disabled={pending}>
      <legend>{legend}</legend>
      {rows.map((cardId) => (
        <div key={cardId}>
          {details?.(cardId).map((text) => (
            <p key={text}>{text}</p>
          ))}
          <NumberField
            label={fieldLabel(cardId)}
            value={valueOf(cardId)}
            onChange={(value) => setDraft({ ...draft, [cardId]: value })}
            min={0}
            error={invalid.includes(cardId) ? invalidCopies : ''}
          />
        </div>
      ))}
      <button type="button" onClick={add} disabled={pending}>
        Acrescentar
      </button>
    </fieldset>
  )
}

/** Recusa ou erro do último "Confirmar", mostrado na seção (REQ-52). */
type VaultFailure = { error: Error; operations: VaultOperation[] }

/** Seção "Usar cofre" (REQ-52): monta a lista de operações e envia o lote. */
function UseVault({
  player,
  cards,
  onConfirm,
  onCancel,
  pending,
}: {
  player: PartyMember['player']
  cards: Cards
  onConfirm: (
    operations: VaultOperation[],
    onError: (error: Error) => void,
  ) => void
  onCancel: () => void
  pending: boolean
}) {
  const [operations, setOperations] = useState<VaultOperation[]>([])
  const [failure, setFailure] = useState<VaultFailure | null>(null)

  // Editar a lista tira a marca e o texto da recusa: o índice deixaria de valer.
  function edit(next: VaultOperation[]): void {
    setOperations(next)
    setFailure(null)
  }
  const append = (op: VaultOperation) => edit([...operations, op])
  function swap(i: number, j: number): void {
    const next = [...operations]
    ;[next[i], next[j]] = [next[j], next[i]]
    edit(next)
  }

  // Escolhas pelo estado recebido, sem descontar a lista (D-59 item 1).
  const storable = [
    ...new Set([
      ...player.inventory.map(({ cardId }) => cardId),
      ...player.tcgFolder.map(({ cardId }) => cardId),
    ]),
  ].sort(byCardId)
  const vaultCardIds = [
    ...new Set(player.vault.slots.map(({ cardId }) => cardId)),
  ]
  // Tipo da carta do catálogo: dado de exibição, não regra (D-58).
  const vaultAttributes = [
    ...new Set(
      vaultCardIds.filter((id) => cards.get(id)?.type === 'attribute'),
    ),
  ].sort(byCardId)
  const buildRows = [
    ...new Set([
      ...player.build.map(({ cardId }) => cardId),
      ...vaultAttributes,
    ]),
  ].sort(byCardId)
  const inBuild = (cardId: string) =>
    player.build.find((entry) => entry.cardId === cardId)?.copies ?? 0
  const inVault = (cardId: string) =>
    player.vault.slots
      .filter((slot) => slot.cardId === cardId)
      .reduce((sum, { quantity }) => sum + quantity, 0)

  const refusedIndex =
    failure?.error instanceof ActionNotAllowedError
      ? failure.error.operationIndex
      : undefined
  let failureText = ''
  if (failure !== null) {
    const { error } = failure
    if (error instanceof ActionNotAllowedError) {
      const refused =
        refusedIndex === undefined
          ? undefined
          : failure.operations[refusedIndex]
      const cardId =
        error.cardId ??
        (refused !== undefined && 'cardId' in refused ? refused.cardId : '')
      const reason = vaultReasonText(error, nameOf(cards, cardId))
      failureText = reason === '' ? error.message : `${error.message} ${reason}`
    } else failureText = errorText(error)
  }

  return (
    <section aria-labelledby="use-vault-title">
      <h2 id="use-vault-title">Usar cofre</h2>
      <h3 id="vault-operations-title">Operações</h3>
      {operations.length === 0 && <p>Nenhuma operação.</p>}
      <ol aria-labelledby="vault-operations-title">
        {operations.map((op, i) => (
          <li key={i}>
            <span>
              {i + 1}. {describeOperation(op, cards)}
            </span>
            {failure !== null && refusedIndex === i && (
              <strong>Recusada</strong>
            )}
            <button
              type="button"
              onClick={() => edit(operations.filter((_, j) => j !== i))}
              disabled={pending}
            >
              Remover
            </button>
            <button
              type="button"
              onClick={() => swap(i, i - 1)}
              disabled={pending || i === 0}
            >
              Subir
            </button>
            <button
              type="button"
              onClick={() => swap(i, i + 1)}
              disabled={pending || i === operations.length - 1}
            >
              Descer
            </button>
          </li>
        ))}
      </ol>
      {failureText !== '' && <p>{failureText}</p>}
      <button
        type="button"
        onClick={() =>
          onConfirm(operations, (error) => setFailure({ error, operations }))
        }
        disabled={pending || operations.length === 0}
      >
        Confirmar (1 ponto de ação)
      </button>
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancelar
      </button>
      <CardOperationForm
        legend="Guardar no cofre"
        cardIds={storable}
        cards={cards}
        onAdd={(cardId, quantity) =>
          append({ operation: 'store', cardId, quantity })
        }
        pending={pending}
      />
      <CardOperationForm
        legend="Retirar do cofre"
        cardIds={vaultCardIds}
        cards={cards}
        onAdd={(cardId, quantity) =>
          append({ operation: 'take', cardId, quantity })
        }
        pending={pending}
      />
      <CardOperationForm
        legend="Descartar do cofre"
        cardIds={vaultCardIds}
        cards={cards}
        warning="A carta descartada vai para o limbo e não volta."
        onAdd={(cardId, quantity) =>
          append({ operation: 'discard', cardId, quantity })
        }
        pending={pending}
      />
      <GoldForm onAdd={append} pending={pending} />
      <CopiesForm
        legend="Guardar deck"
        rows={vaultAttributes}
        fieldLabel={(cardId) => `Cópias de ${nameOf(cards, cardId)}`}
        initial={() => 0}
        onAdd={(list) => append({ operation: 'saveDeck', cards: list })}
        pending={pending}
      />
      {player.vault.decks.map((_, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => append({ operation: 'unpackDeck', deckIndex: i })}
            disabled={pending}
          >
            Desmontar deck {i + 1}
          </button>
          <button
            type="button"
            onClick={() => append({ operation: 'swapBuild', deckIndex: i })}
            disabled={pending}
          >
            Usar deck {i + 1} como build
          </button>
        </div>
      ))}
      <CopiesForm
        legend="Editar build"
        rows={buildRows}
        fieldLabel={(cardId) => `Cópias na build de ${nameOf(cards, cardId)}`}
        details={(cardId) => [
          `Na build: ${inBuild(cardId)}`,
          `No cofre: ${inVault(cardId)}`,
        ]}
        initial={inBuild}
        onAdd={(build) => append({ operation: 'editBuild', build })}
        pending={pending}
      />
    </section>
  )
}

/** Região "A vez" (REQ-36) com "Recuperar" (REQ-41), "Ajustar deck" (REQ-42), "Vasculhar" (REQ-51), "Usar cofre" (REQ-52) e "Encerrar a vez" (REQ-37, REQ-38). */
function TurnState({
  party,
  cards,
  onEndTurn,
  onRecover,
  onAdjust,
  onScavenge,
  onVault,
  adjusting,
  vaulting,
  pending,
}: {
  party: Party
  cards: Cards
  onEndTurn: () => void
  onRecover: (option: RecoverAction['option']) => void
  onAdjust: () => void
  onScavenge: (cardId: string) => void
  onVault: () => void
  adjusting: boolean
  vaulting: boolean
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
      {host?.player.availableActions.includes('scavenge') && (
        <div role="group" aria-label="Vasculhar">
          {host.player.scavengeTargets.map((cardId) => (
            <button
              key={cardId}
              type="button"
              onClick={() => onScavenge(cardId)}
              disabled={pending}
            >
              Vasculhar {nameOf(cards, cardId)}
            </button>
          ))}
        </div>
      )}
      {host?.player.availableActions.includes('useVault') && (
        <button type="button" onClick={onVault} disabled={pending || vaulting}>
          Usar cofre
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
  onScavenge,
  onSaveBuild,
  onUseVault,
  onEquip,
  onUnequip,
  onActivate,
  onEvent,
  eventError,
  adjustError,
  adjusting,
  setAdjusting,
  vaulting,
  setVaulting,
  moving,
}: {
  party: Party
  classes: ClassDefinition[]
  cards: Cards
  onMove: (zoneId: string) => void
  onEndTurn: () => void
  onRecover: (option: RecoverAction['option']) => void
  onScavenge: (cardId: string) => void
  onSaveBuild: (build: CardCopies[]) => void
  onUseVault: (
    operations: VaultOperation[],
    onError: (error: Error) => void,
  ) => void
  onEquip: NonNullable<PrepareControls['onEquip']>
  onUnequip: NonNullable<PrepareControls['onUnequip']>
  onActivate: ActivateEffect
  onEvent: (action: RandomEventAction) => void
  eventError: Error | null
  adjustError: string
  adjusting: boolean
  setAdjusting: (open: boolean) => void
  vaulting: boolean
  setVaulting: (open: boolean) => void
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
        cards={cards}
        onEndTurn={onEndTurn}
        onRecover={onRecover}
        onAdjust={() => setAdjusting(true)}
        onScavenge={onScavenge}
        onVault={() => setVaulting(true)}
        adjusting={adjusting}
        vaulting={vaulting}
        pending={moving}
      />
      <RandomEventPanel
        party={party}
        host={host}
        cards={cards}
        pending={moving}
        onAction={onEvent}
        error={eventError}
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
      {vaulting && host !== undefined && (
        <UseVault
          player={host.player}
          cards={cards}
          onConfirm={onUseVault}
          onCancel={() => setVaulting(false)}
          pending={moving}
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
          prepare={
            member.isHost && member.player.availableActions.includes('prepare')
              ? {
                  ...(party.randomEventEncounter === null && {
                    onEquip,
                    onUnequip,
                  }),
                  onActivate,
                  pending: moving,
                }
              : null
          }
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
  const reloadChoice =
    start.data?.randomEventEncounter != null ||
    (start.data?.pendingRewards.length ?? 0) > 0
  const restoredParty = useParty(start.isSuccess ? partyId : null, reloadChoice)

  // Continuar ao abrir; repetir não muda nada (CONTRATO §3 FEAT-05, D-37).
  useEffect(() => startSession(), [startSession])

  function endSession(): void {
    end.mutate(undefined, {
      onSuccess: () =>
        navigate('/', { state: { message: 'Sessão encerrada.' } }),
    })
  }

  // O `200` da ação já traz o `Party` gravado (D-55 item 4); erro não muda a tela:
  // um novo pedido zera `action.data`, então o último `Party` devolvido fica
  // guardado (sem ele, uma recusa depois de um sucesso voltaria ao da abertura).
  const [lastActionParty, setLastActionParty] = useState<Party>()
  if (action.data !== undefined && action.data !== lastActionParty) {
    setLastActionParty(action.data)
  }
  const initialParty = reloadChoice
    ? restoredParty.isFetchedAfterMount
      ? restoredParty.data
      : undefined
    : start.data
  const party = lastActionParty ?? initialParty
  const classes = useClasses()
  const cards = useCatalogCards(party === undefined ? [] : cardIdsOf(party))
  const host = party?.members.find((m) => m.isHost)
  const reward = party?.pendingRewards[0]
  const deadline = reward?.decisionDeadlineAt
  const { refetch } = restoredParty
  const [expiredDeadline, setExpiredDeadline] = useState<string>()
  const deadlineKey = deadline
    ? JSON.stringify([reward?.id, deadline])
    : undefined
  const awaitingReward =
    deadlineKey !== undefined && expiredDeadline === deadlineKey
  const [rewardRefreshError, setRewardRefreshError] = useState<Error | null>(
    null,
  )
  const [resolvingScavenge, setResolvingScavenge] = useState(false)

  useEffect(() => {
    if (!deadline || action.isPending || end.isPending || awaitingReward) return
    const timer = window.setTimeout(
      () => {
        setExpiredDeadline(deadlineKey)
        void refetch().then(({ data, error }) => {
          setRewardRefreshError(error)
          if (!error && data) setLastActionParty(data)
        })
      },
      Math.max(0, Date.parse(deadline) - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [
    deadline,
    deadlineKey,
    action.isPending,
    end.isPending,
    awaitingReward,
    refetch,
  ])

  const delivery = host?.player.lastRewardDelivery
  const [adjusting, setAdjusting] = useState(false)
  // Carta do último Preparar: {nome} das mensagens do REQ-45 (no "Guardar", a
  // carta sai do slot, então o nome vem do clique, não do `Party` devolvido).
  const [preparedCardId, setPreparedCardId] = useState('')
  const preparedName = nameOf(cards.cards, preparedCardId)
  // Erros do "Ajustar deck" aparecem na seção, não na área de status (REQ-42).
  const adjustFailed = action.isError && action.variables.type === 'adjustDeck'
  const [vaulting, setVaulting] = useState(false)
  // Erros do "Usar cofre" também ficam na seção (REQ-52).
  const vaultFailed = action.isError && action.variables.type === 'useVault'
  const eventAction =
    action.variables &&
    randomEventActionTypes.some((type) => type === action.variables.type)

  let status = ''
  if (end.isError) status = errorText(end.error)
  else if (action.isError && !adjustFailed && !vaultFailed) {
    if (action.variables.type === 'prepare') {
      status =
        action.variables.operation === 'activate'
          ? errorText(action.error)
          : refusalText(action.error, preparedName)
    } else if (
      action.variables.type === 'scavenge' &&
      action.error instanceof ActionNotAllowedError &&
      action.error.reason === 'inventoryFull'
    ) {
      // Texto próprio do Vasculhar (REQ-51); o do `reasonText` é o do Preparar.
      status = `${action.error.message} Não há espaço no inventário.`
    } else status = errorText(action.error)
  } else if (action.isSuccess && party !== undefined && host !== undefined) {
    if (action.variables.type === 'useVault') {
      const n = action.variables.operations.length
      status = `Cofre: ${n} ${n === 1 ? 'operação feita' : 'operações feitas'}.`
    } else if (
      action.variables.type === 'scavenge' ||
      (action.variables.type === 'resolveReward' && resolvingScavenge)
    ) {
      // O resultado vem de `lastScavenge`, nunca do inventário (D-59 item 2).
      const last = host.player.lastScavenge
      if (last !== null) {
        const name = nameOf(cards.cards, last.cardId)
        status = {
          inventory: `Você achou ${name}.`,
          pending: `${name} aguarda uma escolha.`,
          left: `Você deixou ${name}.`,
          none: `${name} não estava no deck de recompensas.`,
        }[last.delivery]
      }
    } else if (action.variables.type === 'prepare') {
      status =
        action.variables.operation === 'equip'
          ? `Equipou ${preparedName}.`
          : action.variables.operation === 'unequip'
            ? `Guardou ${preparedName}.`
            : 'Efeito ativado.'
    } else if (action.variables.type === 'adjustDeck') {
      status = `Build salva: ${host.player.buildSize} cartas.`
    } else if (action.variables.type === 'endTurn') {
      const current = party.members.find((m) => m.id === party.turn.memberId)
      status = `Rodada ${party.turn.round}: vez de ${current?.characterName ?? '…'}.`
    } else if (action.variables.type === 'recover') {
      const { health, maxHealth, vigor } = host.player
      status = `Recuperou: vida ${health}/${maxHealth}, Vigor ${vigor}.`
    } else if (!eventAction) {
      status = `Você está em ${nameOf(cards.cards, host.player.zoneId)}.`
    }
  } else if (start.isError) status = errorText(start.error)
  else if (reloadChoice && restoredParty.isError && party === undefined)
    status = errorText(restoredParty.error)
  else if (reloadChoice && party === undefined) status = 'Carregando a escolha…'
  else if (!start.isSuccess) status = 'Abrindo o grupo…'
  else if (classes.isError) status = errorText(classes.error)
  else if (cards.error !== null) status = errorText(cards.error)
  else if (classes.isPending || cards.isPending) {
    status = 'Carregando a partida…'
  }

  const notFound =
    isNotFound(start.error) ||
    isNotFound(end.error) ||
    isNotFound(restoredParty.error)

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
          <button
            type="button"
            onClick={endSession}
            disabled={end.isPending || action.isPending}
          >
            Encerrar sessão
          </button>
          <PreparedMatch
            party={party}
            classes={classes.data ?? []}
            cards={cards.cards}
            onMove={(zoneId) => action.mutate({ type: 'move', zoneId })}
            onEndTurn={() => action.mutate({ type: 'endTurn' })}
            onRecover={(option) => action.mutate({ type: 'recover', option })}
            onScavenge={(cardId) => action.mutate({ type: 'scavenge', cardId })}
            onSaveBuild={(build) =>
              action.mutate(
                { type: 'adjustDeck', build },
                { onSuccess: () => setAdjusting(false) },
              )
            }
            onUseVault={(operations, onError) =>
              action.mutate(
                { type: 'useVault', operations },
                { onSuccess: () => setVaulting(false), onError },
              )
            }
            onEquip={(cardId) => {
              setPreparedCardId(cardId)
              action.mutate({ type: 'prepare', operation: 'equip', cardId })
            }}
            onUnequip={(slot, cardId) => {
              setPreparedCardId(cardId)
              action.mutate({ type: 'prepare', operation: 'unequip', slot })
            }}
            onActivate={(activation, onSuccess) =>
              action.mutate(activation, { onSuccess })
            }
            onEvent={(event) => action.mutate(event)}
            eventError={eventAction ? action.error : null}
            adjustError={
              adjustFailed
                ? refusalText(
                    action.error,
                    nameOf(
                      cards.cards,
                      action.error instanceof ActionNotAllowedError
                        ? (action.error.cardId ?? '')
                        : '',
                    ),
                  )
                : ''
            }
            adjusting={adjusting}
            setAdjusting={setAdjusting}
            vaulting={vaulting}
            setVaulting={setVaulting}
            moving={action.isPending || end.isPending}
          />
          {delivery && (
            <p aria-live="polite">
              {nameOf(cards.cards, delivery.cardId)}{' '}
              {
                {
                  kept: 'foi mantido.',
                  returnedToDeck: 'voltou ao deck de recompensas.',
                  removed: 'saiu da reserva.',
                  sentToLimbo: 'foi enviado ao limbo.',
                }[delivery.disposition]
              }
            </p>
          )}
          {reward && (
            <RewardChoice
              key={reward.id}
              reward={reward}
              cards={cards.cards}
              disabled={
                reward.memberId !== host?.id ||
                !host.player.availableActions.includes('resolveReward') ||
                action.isPending ||
                end.isPending ||
                awaitingReward
              }
              onResolve={(choice) => {
                setResolvingScavenge(reward.source.type === 'scavenge')
                action.mutate(choice)
              }}
            />
          )}
          {awaitingReward && !restoredParty.isFetching && (
            <p>
              {rewardRefreshError
                ? errorText(rewardRefreshError)
                : 'Aguardando o resultado da escolha.'}{' '}
              <button
                type="button"
                onClick={() => {
                  setRewardRefreshError(null)
                  setExpiredDeadline(undefined)
                }}
              >
                Consultar recompensa novamente
              </button>
            </p>
          )}
        </>
      )}
      <p role="status">{status}</p>
      {notFound && <Link to="/">Voltar ao início</Link>}
    </main>
  )
}
