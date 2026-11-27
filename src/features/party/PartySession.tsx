import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
import { combatActionTypes } from '../../api/combat'
import type { MarketOperation } from '../../api/market'
import type { BlacksmithOperation } from '../../api/blacksmith'
import { ApiError } from '../../api/http'
import {
  ActionNotAllowedError,
  getParty,
  useEndSession,
  useParty,
  usePartyAction,
  useStartSession,
  type CardCopies,
  type Party,
  type PartyAction,
  type PartyActionRequest,
  type PartyActionResponse,
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
import { HelperPresentation } from './HelperPresentation'
import { EffectsPanel, type ActivateEffect } from './EffectsPanel'
import { nameOf } from './cardNames'
import { equipmentStateSuffix } from './equipmentState'
import { RandomEventPanel } from './RandomEventPanel'
import { receiveSpaceText } from './receiveSpace'
import { RewardChoice } from './RewardChoice'
import { QuestPanel } from './QuestPanel'
import { BoosterResult } from './BoosterResult'
import { MarketPanel, MarketResult } from './MarketPanel'
import {
  BlacksmithPanel,
  BlacksmithResult,
  type BlacksmithSource,
} from './BlacksmithPanel'
import { byCardId, invalidQuantity, isIntFrom } from './fieldRules'
import { NumberField } from './fields'
import {
  CombatPanel,
  CombatReport,
  PrepareAbilities,
  TriggeredEffectPanel,
} from './CombatPanel'

type Cards = ReadonlyMap<string, Card>

/** Booster pela categoria do item no catálogo: dado de exibição (D-62 item 4). */
function isBooster(card: Card | undefined): boolean {
  return card?.type === 'item' && card.itemCategory === 'booster'
}

function combatantNames(combat: Party['combat'], members: Party['members']) {
  const names = new Map(
    members.map(({ id, characterName }) => [id, characterName]),
  )
  for (const enemy of combat?.enemies ?? []) {
    const block = combat?.card.enemies[enemy.blockIndex]
    if (block)
      names.set(
        enemy.id,
        block.count > 1 ? `${block.name} ${enemy.copyIndex + 1}` : block.name,
      )
  }
  return names
}

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

/** Cartas do mercado e do último resultado (REQ-73, REQ-74). */
function marketCardIds(player: PartyMember['player']): string[] {
  const { market, lastMarketVisit } = player
  return [
    ...(market === null
      ? []
      : [
          ...market.stock.map(({ cardId }) => cardId),
          ...market.boosters.map(({ cardId }) => cardId),
          ...(market.showcase ?? []).flatMap(({ offer }) =>
            offer === null ? [] : [offer.cardId],
          ),
          ...market.sellOffers.map(({ cardId }) => cardId),
          ...(market.stable?.offers.map(({ cardId }) => cardId) ?? []),
          ...(market.stable?.currentMount
            ? [market.stable.currentMount.cardId]
            : []),
        ]),
    ...(lastMarketVisit === null
      ? []
      : lastMarketVisit.results.flatMap((result) =>
          'cardId' in result ? [result.cardId] : [],
        )),
  ]
}

/** Cartas que a seção e o resultado mostram (REQ-80, REQ-81). */
function blacksmithCardIds(player: PartyMember['player']): string[] {
  const { blacksmith: view, lastBlacksmithVisit: visit } = player
  const services = view === null ? [] : [view.blacksmith, view.workshop]
  return [
    ...services.flatMap((service) =>
      (service?.equipment ?? []).flatMap((entry) => [
        entry.cardId,
        ...entry.refineSteps.flatMap((s) => s.materials.map((m) => m.cardId)),
      ]),
    ),
    ...(view?.enchantments ?? []).flatMap((e) =>
      e.enchantment.materials.map((m) => m.cardId),
    ),
    ...(view?.recipes ?? []).flatMap((r) => [
      r.cardId,
      r.equipmentId,
      ...r.materials.map((m) => m.cardId),
    ]),
    ...(visit?.results ?? []).flatMap((r) =>
      r.operation === 'craft' ? [r.recipeCardId, r.equipmentId] : [r.cardId],
    ),
  ]
}

/** Ids das cartas cujos nomes a partida mostra (REQ-30). */
function cardIdsOf(party: Party): string[] {
  return [
    party.dimension.dimensionCardId,
    party.dimension.startingCityZoneId,
    ...party.dimension.map.zones.map(({ zoneId }) => zoneId),
    ...eventReceiptCardIds(party.randomEventEncounter?.payments ?? []),
    ...(party.lastDimensionCompletion?.members.flatMap(({ cards }) =>
      cards.map(({ cardId }) => cardId),
    ) ?? []),
    ...party.pendingRewards.flatMap(({ cardId, discardOptions }) => [
      cardId,
      ...discardOptions.map((option) => option.cardId),
    ]),
    ...party.members.flatMap(({ player }) => [
      player.zoneId,
      player.respawnZoneId,
      ...(player.lastKnockout ? [player.lastKnockout.respawnZoneId] : []),
      ...player.hand,
      ...player.build.map(({ cardId }) => cardId),
      ...player.tcgFolder.map(({ cardId }) => cardId),
      ...player.inventory.map(({ cardId }) => cardId),
      ...player.completionItems.map(({ cardId }) => cardId),
      ...(player.mount === null
        ? []
        : [
            player.mount.cardId,
            ...player.mount.inventory.map(({ cardId }) => cardId),
            ...player.mount.tcgFolder.map(({ cardId }) => cardId),
          ]),
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
      ...(player.lastBoosterOpening
        ? [
            player.lastBoosterOpening.boosterCardId,
            ...player.lastBoosterOpening.cards.map(({ cardId }) => cardId),
          ]
        : []),
      ...marketCardIds(player),
      ...blacksmithCardIds(player),
    ]),
  ]
}

/** Pedido de "Levar"/"Trazer" (REQ-85), sem o `type` e o `operation` fixos. */
type MountTransfer = {
  direction: 'toMount' | 'fromMount'
  space: 'inventory' | 'tcgFolder'
  cardId: string
  quantity: number
  inventorySlotIndex?: number
}

/** "Equipar"/"Guardar" do host com `prepare` (REQ-45); `null` nos outros casos. */
type PrepareControls = {
  onTransfer: (request: MountTransfer) => void
  onEquip?: (cardId: string) => void
  onUnequip?: (slot: EquipmentSlot, cardId: string) => void
  onOpenBooster?: (cardId: string) => void
  onActivate: ActivateEffect
  pending: boolean
}

/**
 * "Levar {nome} para a montaria" / "Trazer {nome} da montaria" (REQ-85), com o
 * campo "Quantidade de {nome}" quando há mais de uma cópia. Slot de equipamento
 * (`equipment`): envia 1 e o índice do slot, sem campo.
 */
function TransferControl({
  name,
  total,
  equipment,
  request,
  onTransfer,
  pending,
}: {
  name: string
  total: number
  equipment: boolean
  request: Omit<MountTransfer, 'quantity'>
  onTransfer: (request: MountTransfer) => void
  pending: boolean
}) {
  const [value, setValue] = useState(String(total))
  const [invalid, setInvalid] = useState(false)
  const withField = !equipment && total > 1
  function send(): void {
    if (equipment) return onTransfer({ ...request, quantity: 1 })
    const quantity = withField ? value : '1'
    const ok = isIntFrom(quantity, 1)
    setInvalid(!ok)
    if (ok) onTransfer({ ...request, quantity: Number(quantity) })
  }
  return (
    <>
      {withField && (
        <NumberField
          label={`Quantidade de ${name}`}
          value={value}
          onChange={setValue}
          min={1}
          error={invalid ? invalidQuantity : ''}
        />
      )}
      <button type="button" onClick={send} disabled={pending}>
        {request.direction === 'toMount'
          ? `Levar ${name} para a montaria`
          : `Trazer ${name} da montaria`}
      </button>
    </>
  )
}

/** Seção de um membro com o estado do jogador (REQ-30). */
function MemberState({
  member,
  classes,
  cards,
  prepare,
  rewardPending,
  quests,
}: {
  member: PartyMember
  classes: ClassDefinition[]
  cards: Cards
  prepare: PrepareControls | null
  rewardPending: boolean
  quests: ReactNode
}) {
  const { player } = member
  const knockout = player.lastKnockout
  const titleId = `member-${member.id}`
  const handId = `hand-${member.id}`
  const buildId = `build-${member.id}`
  const folderId = `folder-${member.id}`
  const equipmentId = `equipment-${member.id}`
  const inventoryId = `inventory-${member.id}`
  const vaultId = `vault-${member.id}`
  const mountId = `mount-${member.id}`
  const mountInventoryId = `mount-inventory-${member.id}`
  const mountFolderId = `mount-folder-${member.id}`
  const decksId = `vault-decks-${member.id}`
  const completionItemsId = `completion-items-${member.id}`
  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>{member.characterName}</h2>
      {quests}
      <h3 id={completionItemsId}>Itens de conclusão</h3>
      {player.completionItems.length === 0 ? (
        <p>Nenhum item de conclusão.</p>
      ) : (
        <ul aria-labelledby={completionItemsId}>
          {player.completionItems.map(({ cardId, quantity }) => (
            <li key={cardId}>
              {quantity}× {nameOf(cards, cardId)}
            </li>
          ))}
        </ul>
      )}
      {player.playerClasses.map(({ playerClass, deckLockMet }) => (
        <p key={playerClass}>
          Classe:{' '}
          {classes.find((c) => c.playerClass === playerClass)?.name ?? '…'}{' '}
          {deckLockMet ? '(trava cumprida)' : '(trava não cumprida)'}
        </p>
      ))}
      {player.specializations.map(
        ({ classId, specializationId, deckLockMet }) => {
          const definition = classes.find(
            (entry) => entry.playerClass === classId,
          )
          const name = definition?.specializations.find(
            (entry) => entry.id === specializationId,
          )?.name
          return (
            <p key={classId}>
              Especialização: {name ?? specializationId} ·{' '}
              {definition?.name ?? classId}{' '}
              {deckLockMet ? '(trava cumprida)' : '(trava não cumprida)'}
            </p>
          )
        },
      )}
      <p>
        Vida {player.health}/{player.maxHealth}
      </p>
      {player.down && (
        <p role="status">
          {rewardPending
            ? 'Caído · aguardando a escolha de recompensa'
            : 'Caído'}
        </p>
      )}
      {player.skipNextTurn && <p>Perde a próxima vez.</p>}
      {knockout && (
        <section aria-label="Último nocaute" key={knockout.id}>
          <p role="status">
            Retornou a {nameOf(cards, knockout.respawnZoneId)} com{' '}
            {knockout.healthRestored} PV na rodada {knockout.roundAfterRespawn}.
          </p>
          <p>
            Perdas do nocaute na rodada {knockout.roundAtKnockout}: Pico{' '}
            {knockout.peakLost} · Vigor {knockout.vigorLost} · Ouro da bolsa{' '}
            {knockout.purseGoldLost}.
          </p>
        </section>
      )}
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
              {cardId === null
                ? 'vazio'
                : nameOf(cards, cardId) +
                  equipmentStateSuffix(player.equipmentStates[slot])}
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
          {player.inventory.map(({ cardId, quantity, equipmentState }, i) => (
            <li key={i}>
              {quantity}× {nameOf(cards, cardId)}
              {equipmentStateSuffix(equipmentState)}
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
              {/* Categoria do item do catálogo: dado de exibição, não regra (D-58, D-62 item 4). */}
              {prepare?.onOpenBooster && isBooster(cards.get(cardId)) && (
                <button
                  type="button"
                  onClick={() => prepare.onOpenBooster?.(cardId)}
                  disabled={prepare.pending}
                >
                  Abrir {nameOf(cards, cardId)}
                </button>
              )}
              {prepare && player.mount !== null && (
                <TransferControl
                  key={`${cardId}-${quantity}`}
                  name={nameOf(cards, cardId)}
                  total={quantity}
                  equipment={equipmentState !== undefined}
                  request={{
                    direction: 'toMount',
                    space: 'inventory',
                    cardId,
                    ...(equipmentState !== undefined && {
                      inventorySlotIndex: i,
                    }),
                  }}
                  onTransfer={prepare.onTransfer}
                  pending={prepare.pending}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {player.mount === null ? (
        <p>Sem montaria.</p>
      ) : (
        <>
          <h3 id={mountId}>Montaria: {nameOf(cards, player.mount.cardId)}</h3>
          <h4 id={mountInventoryId}>
            Inventário extra ({player.mount.inventory.length} de{' '}
            {player.mount.inventoryCapacity} slots)
          </h4>
          {player.mount.inventory.length === 0 ? (
            <p>Inventário extra vazio.</p>
          ) : (
            <ul aria-labelledby={mountInventoryId}>
              {player.mount.inventory.map(
                ({ cardId, quantity, equipmentState }, i) => (
                  <li key={i}>
                    <span>
                      {quantity}× {nameOf(cards, cardId)}
                      {equipmentStateSuffix(equipmentState)}
                    </span>
                    {prepare && (
                      <TransferControl
                        key={`${cardId}-${quantity}`}
                        name={nameOf(cards, cardId)}
                        total={quantity}
                        equipment={equipmentState !== undefined}
                        request={{
                          direction: 'fromMount',
                          space: 'inventory',
                          cardId,
                          ...(equipmentState !== undefined && {
                            inventorySlotIndex: i,
                          }),
                        }}
                        onTransfer={prepare.onTransfer}
                        pending={prepare.pending}
                      />
                    )}
                  </li>
                ),
              )}
            </ul>
          )}
          <h4 id={mountFolderId}>
            Pasta extra (capacidade {player.mount.tcgFolderCapacity})
          </h4>
          {player.mount.tcgFolder.length === 0 ? (
            <p>Pasta extra vazia.</p>
          ) : (
            <ul aria-labelledby={mountFolderId}>
              {player.mount.tcgFolder.map(({ cardId, copies }) => (
                <li key={cardId}>
                  <span>
                    {copies}× {nameOf(cards, cardId)}
                  </span>
                  {prepare && (
                    <TransferControl
                      key={`${cardId}-${copies}`}
                      name={nameOf(cards, cardId)}
                      total={copies}
                      equipment={false}
                      request={{
                        direction: 'fromMount',
                        space: 'tcgFolder',
                        cardId,
                      }}
                      onTransfer={prepare.onTransfer}
                      pending={prepare.pending}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <h3 id={vaultId}>
        Cofre ({player.vault.slots.length} de {player.vaultCapacity} slots)
      </h3>
      {player.vault.slots.length === 0 ? (
        <p>Cofre vazio.</p>
      ) : (
        <ul aria-labelledby={vaultId}>
          {player.vault.slots.map(({ cardId, quantity, equipmentState }, i) => (
            <li key={i}>
              {quantity}× {nameOf(cards, cardId)}
              {equipmentStateSuffix(equipmentState)}
            </li>
          ))}
        </ul>
      )}
      <p>{`Ouro no cofre ${player.vault.gold} (capacidade ${player.vaultGoldCapacity})`}</p>
      {Object.values(player.expansions).some((count) => count > 0) && (
        <p>{`Expansões: cofre ${player.expansions.vaultSlots}, slots de deck ${player.expansions.deckSlots}, pasta de TCG ${player.expansions.tcgFolder}, bolsa ${player.expansions.purse}, ouro do cofre ${player.expansions.vaultGold}`}</p>
      )}
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
              {prepare && player.mount !== null && (
                <TransferControl
                  key={`${cardId}-${copies}`}
                  name={nameOf(cards, cardId)}
                  total={copies}
                  equipment={false}
                  request={{
                    direction: 'toMount',
                    space: 'tcgFolder',
                    cardId,
                  }}
                  onTransfer={prepare.onTransfer}
                  pending={prepare.pending}
                />
              )}
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
    case 'combatInProgress':
    case 'staleCombat':
    case 'staleCombatTurn':
    case 'wrongCombatPhase':
    case 'combatTargetUnavailable':
    case 'combatAbilityUnavailable':
    case 'playerDown':
    case 'staleTriggeredEffectChoice':
    case 'triggeredEffectUnavailable':
      return ''
    case 'questOfferUnavailable':
    case 'questNotOpen':
    case 'questWrongStage':
    case 'questWrongZone':
    case 'questObjectivesIncomplete':
    case 'questLimitReached':
    case 'genericQuestAlreadyOpen':
    case 'questClassIneligible':
    case 'questSpecializationIneligible':
    case 'questPeakTooLow':
    case 'notInMarketStock': // FEAT-16: textos do mercado em marketReasonText (REQ-74)
    case 'notMarketBooster':
    case 'singlesUnavailable':
    case 'showcaseSlotNotFound':
    case 'showcaseSlotEmpty':
    case 'notLotMultiple':
    case 'artificerInactive': // FEAT-17: textos do ferreiro em blacksmithReasonText (REQ-81)
    case 'equipmentNotFound':
    case 'notBroken':
    case 'equipmentBroken':
    case 'notRefinable':
    case 'refinementMaterialsMissing':
    case 'refineLevelMax':
    case 'refineLevelTooHigh':
    case 'enchantNotAvailable':
    case 'enchantmentNotOffered':
    case 'notEnchantable':
    case 'enchantSlotUnavailable':
    case 'replaceIndexRequired':
    case 'replaceIndexInvalid':
    case 'recipeMissing':
    case 'materialsMissing':
    case 'noMount': // FEAT-18: texto próprio no ramo de cada ação.
    case 'mountAlreadyOwned':
    case 'mountNotOffered':
    case 'noCompletion':
    case 'notCompletionZone':
    case 'completionRequirementNotMet':
    case 'mountNotEmpty':
      return error.message
    case 'notBooster':
      return `${name} não é um booster.`
    case 'boosterEmpty':
      return 'A coleção deste booster não tem cartas disponíveis.'
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

/** Recusa do Transferir (REQ-85): `message` + texto do motivo; outro motivo → só a `message`. */
function transferRefusalText(
  error: Error,
  direction: MountTransfer['direction'],
  name: string,
): string {
  if (!(error instanceof ActionNotAllowedError)) return errorText(error)
  const toMount = direction === 'toMount'
  const reason =
    error.reason === 'noMount'
      ? 'Você não tem montaria.'
      : error.reason === 'notOwned'
        ? `Não há essas cópias de ${name} ali.`
        : error.reason === 'inventoryFull'
          ? toMount
            ? 'Não há espaço no inventário extra.'
            : 'Não há espaço no inventário.'
          : error.reason === 'tcgFolderFull'
            ? toMount
              ? 'Não há espaço na pasta extra.'
              : 'Não há espaço na pasta de TCG.'
            : ''
  return reason === '' ? error.message : `${error.message} ${reason}`
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
      ...(player.mount?.tcgFolder.map(({ cardId }) => cardId) ?? []),
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
              {player.mount !== null && (
                <p>
                  Na pasta extra: {copiesIn(player.mount.tcgFolder, cardId)}
                </p>
              )}
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
    case 'combatInProgress':
    case 'staleCombat':
    case 'staleCombatTurn':
    case 'wrongCombatPhase':
    case 'combatTargetUnavailable':
    case 'combatAbilityUnavailable':
    case 'playerDown':
    case 'staleTriggeredEffectChoice':
    case 'triggeredEffectUnavailable':
      return ''
    case 'questOfferUnavailable':
    case 'questNotOpen':
    case 'questWrongStage':
    case 'questWrongZone':
    case 'questObjectivesIncomplete':
    case 'questLimitReached':
    case 'genericQuestAlreadyOpen':
    case 'questClassIneligible':
    case 'questSpecializationIneligible':
    case 'questPeakTooLow':
    case 'notInMarketStock': // FEAT-16: textos do mercado em marketReasonText (REQ-74)
    case 'notMarketBooster':
    case 'singlesUnavailable':
    case 'showcaseSlotNotFound':
    case 'showcaseSlotEmpty':
    case 'notLotMultiple':
    case 'artificerInactive': // FEAT-17: textos do ferreiro em blacksmithReasonText (REQ-81)
    case 'equipmentNotFound':
    case 'notBroken':
    case 'equipmentBroken':
    case 'notRefinable':
    case 'refinementMaterialsMissing':
    case 'refineLevelMax':
    case 'refineLevelTooHigh':
    case 'enchantNotAvailable':
    case 'enchantmentNotOffered':
    case 'notEnchantable':
    case 'enchantSlotUnavailable':
    case 'replaceIndexRequired':
    case 'replaceIndexInvalid':
    case 'recipeMissing':
    case 'materialsMissing':
    case 'noMount': // FEAT-18: texto próprio no ramo de cada ação.
    case 'mountAlreadyOwned':
    case 'mountNotOffered':
    case 'noCompletion':
    case 'notCompletionZone':
    case 'completionRequirementNotMet':
    case 'mountNotEmpty':
      return error.message
    case 'notBooster':
      return `${name} não é um booster.`
    case 'boosterEmpty':
      return 'A coleção deste booster não tem cartas disponíveis.'
    default: {
      const _exhaustive: never = error.reason
      return _exhaustive
    }
  }
}

/**
 * Texto de cada motivo de recusa do Ir ao Mercado (REQ-74). Os motivos do
 * cofre que o mercado também devolve (`notInInventory`, `notInTcgFolder`)
 * seguem o REQ-52; outro motivo → '' ou só a `message`.
 */
function marketReasonText(error: ActionNotAllowedError, name: string): string {
  switch (error.reason) {
    case 'notInMarketStock':
      return `${name} não está no estoque deste mercado.`
    case 'notMarketBooster':
      return `${name} não está à venda neste mercado.`
    case 'singlesUnavailable':
      return 'Este mercado não vende singles.'
    case 'showcaseSlotNotFound':
      return 'Esse slot não existe na vitrine.'
    case 'showcaseSlotEmpty':
      return 'Esse slot da vitrine está vazio.'
    case 'notLotMultiple':
      return `${name} só é vendido em lotes inteiros.`
    case 'tcgFolderFull':
      return 'Não há espaço na pasta de TCG.'
    case 'mountNotOffered': // REQ-87
      return `Este Estábulo não vende ${name}.`
    case 'mountAlreadyOwned':
      return 'Você já tem uma montaria: venda a atual antes.'
    case 'noMount':
      return 'Você não tem montaria.'
    case 'mountNotEmpty':
      return 'Esvazie o inventário extra e a pasta extra antes de vender a montaria.'
    default:
      return vaultReasonText(error, name)
  }
}

/** Recusa ou erro do último "Confirmar" do mercado (REQ-74). */
function marketFailureText(
  error: Error,
  refused: MarketOperation | undefined,
  cards: Cards,
): string {
  if (!(error instanceof ActionNotAllowedError)) return errorText(error)
  const cardId =
    error.cardId ??
    (refused !== undefined && 'cardId' in refused ? refused.cardId : '')
  const reason = marketReasonText(error, nameOf(cards, cardId))
  return reason === '' ? error.message : `${error.message} ${reason}`
}

/**
 * Texto de cada motivo de recusa do Ir ao Ferreiro e da Oficina (REQ-81);
 * `notEnoughGold` e `notInInventory` seguem o REQ-52; outro motivo → ''.
 */
function blacksmithReasonText(
  error: ActionNotAllowedError,
  name: string,
): string {
  switch (error.reason) {
    case 'equipmentNotFound':
      return 'Esse equipamento não está mais lá.'
    case 'notBroken':
      return `${name} não está quebrado.`
    case 'equipmentBroken':
      return `${name} está quebrado: conserte antes.`
    case 'notRefinable':
      return `${name} não pode ser refinado.`
    case 'refinementMaterialsMissing':
      return `${name} não tem materiais de refino definidos.`
    case 'refineLevelMax':
      return `${name} já está no refino máximo.`
    case 'refineLevelTooHigh':
      return 'A Oficina não refina acima desse nível.'
    case 'enchantNotAvailable':
      return 'A Oficina não encanta.'
    case 'enchantmentNotOffered':
      return 'Este ferreiro não oferece esse encantamento.'
    case 'notEnchantable':
      return `${name} não pode ser encantado.`
    case 'enchantSlotUnavailable':
      return `${name} não tem slot para esse encantamento.`
    case 'replaceIndexRequired':
      return 'Escolha o encantamento a substituir.'
    case 'replaceIndexInvalid':
      return 'O encantamento a substituir não existe.'
    case 'recipeMissing':
      return `${name} não é uma receita.`
    case 'materialsMissing':
      return 'Faltam materiais.'
    case 'inventoryFull':
      return 'Não há espaço no inventário.'
    case 'notEnoughGold':
    case 'notInInventory':
      return vaultReasonText(error, name)
    default:
      return ''
  }
}

/** Recusa sem `operationIndex` do ferreiro: vai para a área de status (REQ-81). */
function isBlacksmithStatusRefusal(error: Error): boolean {
  return (
    error instanceof ActionNotAllowedError && error.operationIndex === undefined
  )
}

/** Recusa ou erro do último "Confirmar" do ferreiro, na seção (REQ-81). */
function blacksmithFailureText(
  error: Error,
  refusedCardId: string,
  cards: Cards,
): string {
  if (isBlacksmithStatusRefusal(error)) return ''
  if (!(error instanceof ActionNotAllowedError)) return errorText(error)
  const reason = blacksmithReasonText(
    error,
    nameOf(cards, error.cardId ?? refusedCardId),
  )
  return reason === '' ? error.message : `${error.message} ${reason}`
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
    case 'openBooster':
      return `Abrir ${nameOf(cards, op.cardId)}`
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
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

/** "Abrir booster": boosters de `vault.slots`, um por vez (REQ-75). */
function BoosterForm({
  cardIds,
  cards,
  onAdd,
  pending,
}: {
  cardIds: string[]
  cards: Cards
  onAdd: (cardId: string) => void
  pending: boolean
}) {
  const selectId = useId()
  const [cardId, setCardId] = useState('')
  return (
    <fieldset disabled={pending}>
      <legend>Abrir booster</legend>
      <label htmlFor={selectId}>Booster</label>
      <select
        id={selectId}
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
      >
        <option value="">Escolha um booster</option>
        {cardIds.map((id) => (
          <option key={id} value={id}>
            {nameOf(cards, id)}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAdd(cardId)}
        disabled={pending || cardId === ''}
      >
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
  const vaultBoosters = vaultCardIds
    .filter((id) => isBooster(cards.get(id)))
    .sort(byCardId)
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
      <BoosterForm
        cardIds={vaultBoosters}
        cards={cards}
        onAdd={(cardId) => append({ operation: 'openBooster', cardId })}
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
  onCompleteDimension,
  onSaveRespawnPoint,
  onRecover,
  onAdjust,
  onScavenge,
  onVault,
  onMarket,
  onBlacksmith,
  adjusting,
  vaulting,
  marketing,
  smithing,
  pending,
}: {
  party: Party
  cards: Cards
  onEndTurn: () => void
  onCompleteDimension: () => void
  onSaveRespawnPoint: () => void
  onRecover: (option: RecoverAction['option']) => void
  onAdjust: () => void
  onScavenge: (cardId: string) => void
  onVault: () => void
  onMarket: () => void
  onBlacksmith: (source: BlacksmithSource) => void
  adjusting: boolean
  vaulting: boolean
  marketing: boolean
  smithing: BlacksmithSource | null
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
      {/* REQ-80: logo antes de "Ir ao Mercado", na ordem de availableActions. */}
      {host?.player.availableActions.flatMap((type) =>
        type === 'visitBlacksmith' || type === 'artificerWorkshop'
          ? [
              <button
                key={type}
                type="button"
                onClick={() =>
                  onBlacksmith(
                    type === 'visitBlacksmith' ? 'blacksmith' : 'workshop',
                  )
                }
                disabled={pending || smithing !== null}
              >
                {type === 'visitBlacksmith'
                  ? 'Ir ao Ferreiro'
                  : 'Oficina do Artífice'}
              </button>,
            ]
          : [],
      )}
      {host?.player.availableActions.includes('visitMarket') && (
        <button
          type="button"
          onClick={onMarket}
          disabled={pending || marketing}
        >
          Ir ao Mercado
        </button>
      )}
      {host?.id === memberId &&
        host.player.availableActions.includes('saveRespawnPoint') && (
          <button type="button" onClick={onSaveRespawnPoint} disabled={pending}>
            Salvar ponto de respawn
          </button>
        )}
      {host?.player.availableActions.includes('completeDimension') && (
        <button type="button" onClick={onCompleteDimension} disabled={pending}>
          Concluir dimensão (1 PA)
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

function DimensionCompletion({ card }: { card: Card | undefined }) {
  const completion = card?.type === 'dimension' ? card.completion : null
  const { cards } = useCatalogCards(
    completion?.requirement.map(({ cardId }) => cardId) ?? [],
  )
  if (!completion) return null

  return (
    <section aria-labelledby="dimension-completion-title">
      <h2 id="dimension-completion-title">Conclusão da dimensão</h2>
      <p>Zona de conclusão: {completion.zoneTitle}</p>
      <h3 id="dimension-requirement-title">Requisito</h3>
      <ul aria-labelledby="dimension-requirement-title">
        {completion.requirement.map(({ cardId, count }) => (
          <li key={cardId}>
            {count}× {nameOf(cards, cardId)}
          </li>
        ))}
      </ul>
      {completion.finalBoss && (
        <p>
          Chefe final: {completion.finalBoss.title}
          {completion.finalBoss.noEscape && ' · Sem fuga'}
        </p>
      )}
    </section>
  )
}

/** Estado da partida preparada (REQ-30) com a vez (REQ-36) e o mapa (REQ-34). */
function DimensionCompletionDialog({
  summary,
  members,
  cards,
  onContinue,
}: {
  summary: NonNullable<Party['lastDimensionCompletion']>
  members: Party['members']
  cards: Cards
  onContinue: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const prizeTitle = useId()
  const names = new Map(
    members.map(({ id, characterName }) => [id, characterName]),
  )

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={title}
      onCancel={(event) => event.preventDefault()}
    >
      <h2 id={title}>Dimensão concluída: {summary.completedDimensionName}</h2>
      <h3 id={prizeTitle}>Prêmio máximo</h3>
      <ul aria-labelledby={prizeTitle}>
        {summary.members.map(({ memberId, cards: prizes, gold }) => (
          <li key={memberId}>
            {names.get(memberId)}
            <ul>
              {prizes.map(({ cardId, copies, destination }) => (
                <li key={JSON.stringify([cardId, destination])}>
                  {copies}× {nameOf(cards, cardId)} para{' '}
                  {receiveSpaceText[destination]}
                </li>
              ))}
              <li>+{gold} de ouro</li>
            </ul>
          </li>
        ))}
      </ul>
      <ul>
        {summary.members.map(({ memberId, peakDelta }) => (
          <li key={memberId}>
            {names.get(memberId)}: Pico +{peakDelta}
          </li>
        ))}
      </ul>
      <p>Itens de conclusão saíram do jogo.</p>
      <p>
        {summary.next.type === 'nextDimension'
          ? `Próxima dimensão: ${summary.next.name}`
          : 'O save ficou congelado até o lançamento da próxima dimensão.'}
      </p>
      <button type="button" onClick={onContinue}>
        Continuar
      </button>
    </dialog>
  )
}

function PreparedMatch({
  party,
  classes,
  cards,
  onMove,
  onEndTurn,
  onCompleteDimension,
  onSaveRespawnPoint,
  onRecover,
  onScavenge,
  onSaveBuild,
  onUseVault,
  onVisitMarket,
  onBlacksmith,
  onEquip,
  onUnequip,
  onOpenBooster,
  onTransfer,
  onActivate,
  onEvent,
  eventError,
  adjustError,
  adjusting,
  setAdjusting,
  vaulting,
  setVaulting,
  marketing,
  setMarketing,
  smithing,
  setSmithing,
  moving,
  quests,
}: {
  party: Party
  classes: ClassDefinition[]
  cards: Cards
  quests: ReactNode
  onMove: (zoneId: string, viaZoneId?: string) => void
  onEndTurn: () => void
  onCompleteDimension: () => void
  onSaveRespawnPoint: () => void
  onRecover: (option: RecoverAction['option']) => void
  onScavenge: (cardId: string) => void
  onSaveBuild: (build: CardCopies[]) => void
  onUseVault: (
    operations: VaultOperation[],
    onError: (error: Error) => void,
  ) => void
  onVisitMarket: (
    operations: MarketOperation[],
    onError: (error: Error) => void,
  ) => void
  onBlacksmith: (
    source: BlacksmithSource,
    operations: BlacksmithOperation[],
    onError: (error: Error) => void,
  ) => void
  onEquip: NonNullable<PrepareControls['onEquip']>
  onUnequip: NonNullable<PrepareControls['onUnequip']>
  onOpenBooster: NonNullable<PrepareControls['onOpenBooster']>
  onTransfer: PrepareControls['onTransfer']
  onActivate: ActivateEffect
  onEvent: (action: RandomEventAction) => void
  eventError: Error | null
  adjustError: string
  adjusting: boolean
  setAdjusting: (open: boolean) => void
  vaulting: boolean
  setVaulting: (open: boolean) => void
  marketing: boolean
  setMarketing: (open: boolean) => void
  smithing: BlacksmithSource | null
  setSmithing: (source: BlacksmithSource | null) => void
  moving: boolean
}) {
  const names = new Map(party.members.map((m) => [m.id, m.characterName]))
  const host = party.members.find((m) => m.isHost)
  const hasHelpers = party.members.some((member) => member.kind === 'aiHelper')
  return (
    <>
      <p>Dimensão: {nameOf(cards, party.dimension.dimensionCardId)}</p>
      <p>Cidade inicial: {nameOf(cards, party.dimension.startingCityZoneId)}</p>
      <DimensionCompletion card={cards.get(party.dimension.dimensionCardId)} />
      {!party.combat && (
        <TurnState
          party={party}
          cards={cards}
          onEndTurn={onEndTurn}
          onCompleteDimension={onCompleteDimension}
          onSaveRespawnPoint={onSaveRespawnPoint}
          onRecover={onRecover}
          onAdjust={() => setAdjusting(true)}
          onScavenge={onScavenge}
          onVault={() => setVaulting(true)}
          onMarket={() => setMarketing(true)}
          onBlacksmith={setSmithing}
          adjusting={adjusting}
          vaulting={vaulting}
          marketing={marketing}
          smithing={smithing}
          pending={moving}
        />
      )}
      {!party.combat && (
        <RandomEventPanel
          party={party}
          host={host}
          cards={cards}
          pending={moving}
          onAction={onEvent}
          error={eventError}
        />
      )}
      {!party.combat &&
        !party.triggeredEffectChoice &&
        adjusting &&
        host !== undefined && (
          <AdjustDeck
            player={host.player}
            cards={cards}
            onSave={onSaveBuild}
            onCancel={() => setAdjusting(false)}
            pending={moving}
            error={adjustError}
          />
        )}
      {!party.combat &&
        !party.triggeredEffectChoice &&
        vaulting &&
        host !== undefined && (
          <UseVault
            player={host.player}
            cards={cards}
            onConfirm={onUseVault}
            onCancel={() => setVaulting(false)}
            pending={moving}
          />
        )}
      {!party.combat &&
        !party.triggeredEffectChoice &&
        marketing &&
        host !== undefined && (
          <MarketPanel
            player={host.player}
            cards={cards}
            onConfirm={onVisitMarket}
            onCancel={() => setMarketing(false)}
            pending={moving}
            failureText={(error, refused) =>
              marketFailureText(error, refused, cards)
            }
          />
        )}
      {!party.combat &&
        !party.triggeredEffectChoice &&
        smithing !== null &&
        host !== undefined && (
          <BlacksmithPanel
            key={smithing}
            source={smithing}
            player={host.player}
            actionPoints={party.turn.actionPoints}
            cards={cards}
            onConfirm={(operations, onError) =>
              onBlacksmith(smithing, operations, onError)
            }
            onCancel={() => setSmithing(null)}
            pending={moving}
            failureText={(error, refusedCardId) =>
              blacksmithFailureText(error, refusedCardId, cards)
            }
          />
        )}
      {!party.combat && (
        <PartyMap
          party={party}
          cards={cards}
          titleOf={(cardId) => nameOf(cards, cardId)}
          onMove={onMove}
          moving={moving}
        />
      )}
      <h2 id="turn-order-title">Ordem dos jogadores</h2>
      <ul aria-labelledby="turn-order-title">
        {party.turnOrder.map((id) => (
          <li key={id} aria-current={id === party.turn.memberId || undefined}>
            {hasHelpers && id === party.turn.memberId ? (
              <strong>{names.get(id)}</strong>
            ) : (
              names.get(id)
            )}
          </li>
        ))}
      </ul>
      {party.members.map((member) => (
        <MemberState
          key={member.id}
          member={member}
          classes={classes}
          cards={cards}
          quests={member.isHost ? quests : null}
          rewardPending={party.pendingRewards.some(
            ({ memberId }) => memberId === member.id,
          )}
          prepare={
            !party.combat &&
            member.isHost &&
            member.player.availableActions.includes('prepare')
              ? {
                  ...(party.randomEventEncounter === null && {
                    onEquip,
                    onUnequip,
                    onOpenBooster,
                  }),
                  onTransfer,
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
  frozen: 'Congelado',
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

type ActionCallbacks = {
  onSuccess?: (response: PartyActionResponse) => void
  onError?: (error: Error) => void
}

function readPendingAction(storageKey: string): PartyActionRequest | null {
  try {
    const value = sessionStorage.getItem(storageKey)
    if (value !== null) return JSON.parse(value) as PartyActionRequest
  } catch {
    // A ação continua recuperável na tela se o navegador bloquear o storage.
  }
  return null
}

function storePendingAction(
  storageKey: string,
  request: PartyActionRequest | null,
): void {
  try {
    if (request === null) sessionStorage.removeItem(storageKey)
    else sessionStorage.setItem(storageKey, JSON.stringify(request))
  } catch {
    // O armazenamento local não deve impedir o envio.
  }
}

function actionWasRefused(error: Error): boolean {
  if (error instanceof ActionNotAllowedError) return true
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500 &&
    ![408, 425, 429].includes(error.status)
  )
}

/** Tela do grupo em sessão (REQ-16): Continuar ao abrir, "Encerrar sessão". */
export function PartySession() {
  const { partyId = '' } = useParams()
  return <PartySessionView key={partyId} partyId={partyId} />
}

function PartySessionView({ partyId }: { partyId: string }) {
  const navigate = useNavigate()
  const storageScope = `${import.meta.env.VITE_API_URL ?? ''}:${partyId}`
  const storageKey = `party-action:${storageScope}`
  const openingKey = `party-session:${storageScope}`
  const opening = useRef<string | null>(null)
  const checkOpening = useRef(false)
  const checkAction = useRef(false)
  const latestParty = useRef<Party | undefined>(undefined)
  const discardedAction = useRef<PartyActionResponse | undefined>(undefined)

  async function newerParty(receipt: Party, verify: boolean) {
    if (receipt.revision === undefined) return undefined
    let current = latestParty.current
    if (verify || receipt.revision === 0) {
      let fetched: Party
      try {
        fetched = await getParty(partyId)
      } catch (cause) {
        throw new Error('Não foi possível confirmar o estado atual do grupo.', {
          cause,
        })
      }
      current = latestParty.current
      if ((fetched.revision ?? -1) >= (current?.revision ?? -1))
        current = fetched
    }
    if (current && (current.revision ?? -1) > receipt.revision) {
      latestParty.current = current
      return current
    }
    latestParty.current = receipt
  }

  const start = useStartSession(partyId, async (receipt) => {
    const current = await newerParty(receipt, checkOpening.current)
    return current ? { ...current, domainEvents: [] } : receipt
  })
  const end = useEndSession(partyId)
  const action = usePartyAction(partyId, async (receipt) => {
    const current = await newerParty(receipt, checkAction.current)
    if (!current) return receipt
    const snapshot = { ...current, domainEvents: [], combatUpdates: [] }
    discardedAction.current = snapshot
    return snapshot
  })
  const { mutate: startSession } = start
  const reloadChoice =
    !start.data?.members.some((member) => member.kind === 'aiHelper') &&
    (start.data?.combat != null ||
      start.data?.triggeredEffectChoice != null ||
      start.data?.lastCombatResult != null ||
      start.data?.randomEventEncounter != null ||
      (start.data?.pendingRewards.length ?? 0) > 0)
  const restoredParty = useParty(start.isSuccess ? partyId : null, reloadChoice)

  const openSession = useCallback(
    (recoveringAction: boolean, onSuccess?: (party: Party) => void) => {
      let saved = opening.current
      try {
        saved ??= sessionStorage.getItem(openingKey)
      } catch {
        // A chave em memória permite retomar enquanto a tela estiver aberta.
      }
      checkOpening.current = saved !== null || recoveringAction
      const key = saved ?? crypto.randomUUID()
      opening.current = key
      try {
        sessionStorage.setItem(openingKey, key)
      } catch {
        // O armazenamento local não deve impedir a abertura.
      }
      function clearOpening() {
        opening.current = null
        try {
          if (sessionStorage.getItem(openingKey) === key)
            sessionStorage.removeItem(openingKey)
        } catch {
          // A abertura já foi resolvida.
        }
      }
      startSession(key, {
        onSuccess: (party) => {
          clearOpening()
          onSuccess?.(party)
        },
        onError: (error) => {
          if (actionWasRefused(error)) clearOpening()
        },
      })
    },
    [openingKey, startSession],
  )
  const openedOnMount = useRef(false)
  useEffect(() => {
    if (openedOnMount.current) return
    openedOnMount.current = true
    openSession(readPendingAction(storageKey) !== null)
  }, [openSession, storageKey])

  function endSession(): void {
    end.mutate(undefined, {
      onSuccess: () =>
        navigate('/', { state: { message: 'Sessão encerrada.' } }),
    })
  }

  // O `200` da ação já traz o `Party` gravado (D-55 item 4); erro não muda a tela:
  // um novo pedido zera `action.data`, então o último `Party` devolvido fica
  // guardado (sem ele, uma recusa depois de um sucesso voltaria ao da abertura).
  const [confirmed, setConfirmed] = useState<{
    party: Party
    response?: PartyActionResponse
    combatNames?: ReadonlyMap<string, string>
  }>()
  const initialParty = reloadChoice
    ? restoredParty.isFetchedAfterMount
      ? restoredParty.data
      : undefined
    : start.data
  const party = confirmed?.party ?? initialParty
  const hasHelpers = party?.members.some((member) => member.kind === 'aiHelper')
  const host = party?.members.find((m) => m.isHost)
  const waitingForHuman =
    hasHelpers &&
    party?.status === 'inSession' &&
    party.turn.memberId !== host?.id
  const [pendingRequest, setPendingRequest] = useState(() =>
    readPendingAction(storageKey),
  )
  const inFlight = useRef(false)
  const callbacks = useRef<ActionCallbacks | undefined>(undefined)
  const unresolvedAction = hasHelpers && pendingRequest !== null
  const advancePending =
    action.error instanceof ApiError &&
    action.error.code === 'ACTION_ADVANCE_PENDING'
  const busy = start.isPending || end.isPending || action.isPending
  const presentationSource = action.data ?? confirmed?.response ?? start.data
  const [consumedEvents, setConsumedEvents] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const batch = presentationSource?.domainEvents
  const events = useMemo(
    () => batch?.filter(({ id }) => !consumedEvents.has(id)),
    [batch, consumedEvents],
  )
  const presenting = !!events?.length
  const finishPresentation = useCallback(
    () =>
      setConsumedEvents(
        (previous) =>
          new Set([...previous, ...(events?.map(({ id }) => id) ?? [])]),
      ),
    [events],
  )
  const automatedCombatIndexes = new Set(
    confirmed?.response?.domainEvents?.flatMap((event) =>
      event.type === 'combatUpdated' ? [event.payload.combatUpdateIndex] : [],
    ),
  )
  const actionsBlocked =
    presenting ||
    busy ||
    unresolvedAction ||
    advancePending ||
    waitingForHuman ||
    (party !== undefined && party.status !== 'inSession')

  function sendPending(request: PartyActionRequest, retry = true): void {
    if (inFlight.current) return
    inFlight.current = true
    checkAction.current = retry
    action.mutate(request, {
      onSuccess: (response) => {
        inFlight.current = false
        setPendingRequest(null)
        storePendingAction(storageKey, null)
        if (response === discardedAction.current) {
          discardedAction.current = undefined
          action.reset()
          setConfirmed({ party: response })
        } else {
          callbacks.current?.onSuccess?.(response)
        }
        callbacks.current = undefined
      },
      onError: (error) => {
        inFlight.current = false
        if (actionWasRefused(error)) {
          setPendingRequest(null)
          storePendingAction(storageKey, null)
          callbacks.current?.onError?.(error)
          callbacks.current = undefined
        }
      },
    })
  }

  function sendAction(intent: PartyAction, handlers?: ActionCallbacks): void {
    if (actionsBlocked || inFlight.current) return
    if (!hasHelpers) {
      action.mutate(intent, handlers)
      return
    }
    const request = structuredClone({
      ...intent,
      idempotencyKey: crypto.randomUUID(),
    })
    callbacks.current = handlers
    setPendingRequest(request)
    storePendingAction(storageKey, request)
    sendPending(request, false)
  }

  function resumeAdvance(): void {
    openSession(
      unresolvedAction || advancePending || waitingForHuman === true,
      (party) => {
        action.reset()
        setConfirmed({ party })
      },
    )
  }

  const completion = party?.lastDimensionCompletion
  const [dismissedCompletion, setDismissedCompletion] = useState<string>()
  const [viewedBossCompletion, setViewedBossCompletion] = useState<string>()
  const combatResult = party?.lastCombatResult
  const completionPending =
    completion && completion.completedAt !== dismissedCompletion
      ? completion
      : undefined
  const bossReportPending =
    completionPending?.finalBossDefeated &&
    combatResult?.finalBoss &&
    combatResult.resolution === 'victory' &&
    combatResult.cardId === completionPending.completedDimensionCardId &&
    completionPending.completedAt !== viewedBossCompletion
      ? completionPending
      : undefined
  const combatNames = combatantNames(party?.combat, party?.members ?? [])
  if (action.data !== undefined && action.data !== confirmed?.response) {
    setConfirmed({ party: action.data, response: action.data, combatNames })
  }
  const classes = useClasses()
  const cards = useCatalogCards(party === undefined ? [] : cardIdsOf(party))
  const reward = party?.pendingRewards[0]
  const deadline =
    hasHelpers &&
    party?.members.filter(({ kind }) => kind === 'human').length === 1
      ? null
      : reward?.decisionDeadlineAt
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
          if (!error && data)
            setConfirmed((current) => ({ ...current, party: data }))
        })
      },
      Math.max(0, Date.parse(deadline) - window.Date.now()),
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
  const [marketing, setMarketing] = useState(false)
  // Erros do Ir ao Mercado também ficam na seção (REQ-74).
  const marketFailed = action.isError && action.variables.type === 'visitMarket'
  const [smithing, setSmithing] = useState<BlacksmithSource | null>(null)
  const smithAction =
    action.variables?.type === 'visitBlacksmith' ||
    action.variables?.type === 'artificerWorkshop'
  // Erros do ferreiro ficam na seção, menos a recusa sem `operationIndex` (REQ-81).
  const smithFailed =
    action.isError && smithAction && !isBlacksmithStatusRefusal(action.error)
  const eventAction =
    action.variables &&
    randomEventActionTypes.some((type) => type === action.variables.type)

  const combatAction = combatActionTypes.some(
    (type) => type === action.variables?.type,
  )

  let status = ''
  if (hasHelpers && start.isPending)
    status = 'Retomando o avanço dos ajudantes…'
  else if (hasHelpers && action.isPending)
    status = 'Processando a ação e o avanço dos ajudantes…'
  else if (hasHelpers && start.isError) status = errorText(start.error)
  else if (unresolvedAction && action.isError) status = errorText(action.error)
  else if (unresolvedAction) status = 'Aguardando a confirmação da ação.'
  else if (end.isError) status = errorText(end.error)
  else if (
    action.isError &&
    !adjustFailed &&
    !vaultFailed &&
    !marketFailed &&
    !smithFailed
  ) {
    if (action.variables.type === 'prepare') {
      status =
        action.error instanceof ActionNotAllowedError &&
        action.error.reason === 'noMount'
          ? `${action.error.message} Você não tem montaria.` // REQ-89
          : ['activate', 'useAbility'].includes(action.variables.operation)
            ? errorText(action.error)
            : action.variables.operation === 'transferMount'
              ? transferRefusalText(
                  action.error,
                  action.variables.direction,
                  preparedName,
                )
              : action.variables.operation === 'openBooster' &&
                  action.error instanceof ActionNotAllowedError &&
                  action.error.reason === 'tcgFolderFull'
                ? `${action.error.message} A pasta de TCG precisa de espaço para todas as cartas do booster.`
                : refusalText(action.error, preparedName)
    } else if (
      action.variables.type === 'scavenge' &&
      action.error instanceof ActionNotAllowedError &&
      action.error.reason === 'inventoryFull'
    ) {
      // Texto próprio do Vasculhar (REQ-51); o do `reasonText` é o do Preparar.
      status = `${action.error.message} Não há espaço no inventário.`
    } else if (
      action.variables.type === 'move' &&
      action.error instanceof ActionNotAllowedError &&
      action.error.reason === 'noMount'
    ) {
      // REQ-86: os demais motivos do Movimentar mostram só a `message`.
      status = `${action.error.message} Você não tem montaria.`
    } else status = errorText(action.error)
  } else if (
    action.isPending &&
    action.variables.type === 'completeDimension'
  ) {
    status = 'Concluindo a dimensão…'
  } else if (action.isSuccess && party !== undefined && host !== undefined) {
    if (
      action.variables.type === 'visitBlacksmith' ||
      action.variables.type === 'artificerWorkshop'
    ) {
      const n = action.variables.operations.length
      const label =
        action.variables.type === 'visitBlacksmith'
          ? 'Ferreiro'
          : 'Oficina do Artífice'
      const spent = host.player.lastBlacksmithVisit?.actionPointsSpent
      status = `${label}: ${n} ${n === 1 ? 'operação' : 'operações'}${
        spent === undefined
          ? ''
          : `, ${spent} ${spent === 1 ? 'ponto de ação gasto' : 'pontos de ação gastos'}`
      }.`
    } else if (action.variables.type === 'visitMarket') {
      const n = action.variables.operations.length
      status = `Mercado: ${n} ${n === 1 ? 'operação feita' : 'operações feitas'}.`
    } else if (action.variables.type === 'useVault') {
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
          mountInventory: `Você achou ${name}; foi para o inventário extra.`,
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
            : action.variables.operation === 'openBooster'
              ? `Abriu ${preparedName}.`
              : action.variables.operation === 'transferMount'
                ? action.variables.direction === 'toMount'
                  ? `Levou ${action.variables.quantity}× ${preparedName} para a montaria.`
                  : `Trouxe ${action.variables.quantity}× ${preparedName} da montaria.`
                : action.variables.operation === 'useAbility'
                  ? 'Habilidade usada.'
                  : 'Efeito ativado.'
    } else if (action.variables.type === 'adjustDeck') {
      status = `Build salva: ${host.player.buildSize} cartas.`
    } else if (action.variables.type === 'endTurn') {
      const current = party.members.find((m) => m.id === party.turn.memberId)
      status = `Rodada ${party.turn.round}: vez de ${current?.characterName ?? '…'}.`
    } else if (action.variables.type === 'recover') {
      const { health, maxHealth, vigor } = host.player
      status = `Recuperou: vida ${health}/${maxHealth}, Vigor ${vigor}.`
    } else if (action.variables.type === 'saveRespawnPoint') {
      status = `Ponto de respawn salvo em ${nameOf(cards.cards, host.player.respawnZoneId)}.`
    } else if (
      !eventAction &&
      !combatAction &&
      action.variables.type !== 'completeDimension'
    ) {
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

  const canReturnHome =
    (start.error instanceof ApiError && start.error.code === 'PARTY_FROZEN') ||
    isNotFound(start.error) ||
    isNotFound(end.error) ||
    isNotFound(restoredParty.error)

  if (presenting && party && events) {
    return (
      <main>
        <HelperPresentation
          party={party}
          events={events}
          cards={cards.cards}
          onFinish={finishPresentation}
        />
      </main>
    )
  }

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
                {member.isHost
                  ? ' (host)'
                  : member.kind === 'aiHelper' && ' (IA)'}
              </li>
            ))}
          </ul>
          <p>{statusLabel[party.status]}</p>
          <p>Salvo em {formatSavedAt(party.savedAt)}</p>
          <button
            type="button"
            onClick={endSession}
            disabled={actionsBlocked || !!party.combat}
          >
            Encerrar sessão
          </button>
          {party.combat && (
            <CombatPanel
              combat={party.combat}
              host={host}
              cards={cards.cards}
              names={combatNames}
              catalogPending={cards.isPending}
              pending={actionsBlocked}
              onAction={(intent) => sendAction(intent)}
            />
          )}
          <CombatReport
            result={
              party.combat && combatResult?.finalBoss ? null : combatResult
            }
            onViewCompletion={
              bossReportPending
                ? () => setViewedBossCompletion(bossReportPending.completedAt)
                : undefined
            }
            updates={confirmed?.response?.combatUpdates?.filter(
              (_, index) => !automatedCombatIndexes.has(index),
            )}
            names={
              party.combat
                ? combatNames
                : (confirmed?.combatNames ?? combatNames)
            }
          />
          {party.triggeredEffectChoice && host && (
            <TriggeredEffectPanel
              choice={party.triggeredEffectChoice}
              host={host}
              cards={cards.cards}
              pending={actionsBlocked}
              onAction={(intent) => sendAction(intent)}
            />
          )}
          {!party.combat && host && (
            <PrepareAbilities
              host={host}
              cards={cards.cards}
              pending={actionsBlocked}
              onAction={(intent) => sendAction(intent)}
            />
          )}
          <PreparedMatch
            party={party}
            classes={classes.data ?? []}
            cards={cards.cards}
            quests={
              host && (
                <QuestPanel
                  player={host.player}
                  classes={classes.data ?? []}
                  pending={actionsBlocked}
                  onAction={(intent) => sendAction(intent)}
                />
              )
            }
            onMove={(zoneId, viaZoneId) =>
              sendAction(
                viaZoneId === undefined
                  ? { type: 'move', zoneId }
                  : { type: 'move', zoneId, viaZoneId },
              )
            }
            onEndTurn={() => sendAction({ type: 'endTurn' })}
            onCompleteDimension={() =>
              sendAction({ type: 'completeDimension' })
            }
            onSaveRespawnPoint={() => sendAction({ type: 'saveRespawnPoint' })}
            onRecover={(option) => sendAction({ type: 'recover', option })}
            onScavenge={(cardId) => sendAction({ type: 'scavenge', cardId })}
            onSaveBuild={(build) =>
              sendAction(
                { type: 'adjustDeck', build },
                { onSuccess: () => setAdjusting(false) },
              )
            }
            onUseVault={(operations, onError) =>
              sendAction(
                { type: 'useVault', operations },
                { onSuccess: () => setVaulting(false), onError },
              )
            }
            onVisitMarket={(operations, onError) =>
              sendAction(
                { type: 'visitMarket', operations },
                { onSuccess: () => setMarketing(false), onError },
              )
            }
            onBlacksmith={(source, operations, onError) =>
              sendAction(
                {
                  type:
                    source === 'blacksmith'
                      ? 'visitBlacksmith'
                      : 'artificerWorkshop',
                  operations,
                },
                { onSuccess: () => setSmithing(null), onError },
              )
            }
            onEquip={(cardId) => {
              setPreparedCardId(cardId)
              sendAction({ type: 'prepare', operation: 'equip', cardId })
            }}
            onUnequip={(slot, cardId) => {
              setPreparedCardId(cardId)
              sendAction({ type: 'prepare', operation: 'unequip', slot })
            }}
            onOpenBooster={(cardId) => {
              setPreparedCardId(cardId)
              sendAction({
                type: 'prepare',
                operation: 'openBooster',
                cardId,
              })
            }}
            onTransfer={(request) => {
              setPreparedCardId(request.cardId)
              sendAction({
                type: 'prepare',
                operation: 'transferMount',
                ...request,
              })
            }}
            onActivate={(activation, onSuccess) =>
              sendAction(activation, { onSuccess })
            }
            onEvent={(event) => sendAction(event)}
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
            marketing={marketing}
            setMarketing={setMarketing}
            smithing={smithing}
            setSmithing={setSmithing}
            moving={actionsBlocked}
          />
          {delivery && (
            <p aria-live="polite">
              {nameOf(cards.cards, delivery.cardId)}{' '}
              {delivery.disposition === 'kept' && delivery.space !== null
                ? `foi para ${receiveSpaceText[delivery.space]}.`
                : {
                    kept: 'foi mantido.',
                    returnedToDeck: 'voltou ao deck de recompensas.',
                    removed: 'saiu da reserva.',
                    sentToLimbo: 'foi enviado ao limbo.',
                  }[delivery.disposition]}
            </p>
          )}
          {reward && (
            <RewardChoice
              key={reward.id}
              reward={{ ...reward, decisionDeadlineAt: deadline ?? null }}
              cards={cards.cards}
              disabled={
                reward.memberId !== host?.id ||
                !host.player.availableActions.includes('resolveReward') ||
                actionsBlocked ||
                awaitingReward
              }
              onResolve={(choice) => {
                setResolvingScavenge(reward.source.type === 'scavenge')
                sendAction(choice)
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
      {unresolvedAction && (
        <button
          type="button"
          disabled={busy || advancePending}
          onClick={() => sendPending(pendingRequest)}
        >
          Reenviar ação
        </button>
      )}
      {(waitingForHuman ||
        advancePending ||
        unresolvedAction ||
        (start.isError && !canReturnHome)) && (
        <button type="button" disabled={busy} onClick={resumeAdvance}>
          Retomar sessão
        </button>
      )}
      {action.isSuccess &&
        action.variables.type === 'visitMarket' &&
        host?.player.lastMarketVisit != null && (
          <MarketResult
            visit={host.player.lastMarketVisit}
            cards={cards.cards}
          />
        )}
      {action.isSuccess &&
        (action.variables.type === 'visitBlacksmith' ||
          action.variables.type === 'artificerWorkshop') &&
        host?.player.lastBlacksmithVisit != null && (
          <BlacksmithResult
            visit={host.player.lastBlacksmithVisit}
            view={host.player.blacksmith}
            cards={cards.cards}
          />
        )}
      {action.isSuccess &&
        (action.variables.type === 'prepare'
          ? action.variables.operation === 'openBooster'
          : action.variables.type === 'useVault' &&
            action.variables.operations.some(
              ({ operation }) => operation === 'openBooster',
            )) &&
        host?.player.lastBoosterOpening != null && (
          <BoosterResult
            opening={host.player.lastBoosterOpening}
            cards={cards.cards}
          />
        )}
      {canReturnHome && <Link to="/">Voltar ao início</Link>}
      {party && completionPending && !bossReportPending && (
        <DimensionCompletionDialog
          summary={completionPending}
          members={party.members}
          cards={cards.cards}
          onContinue={() => {
            if (completionPending.next.type === 'frozen') {
              navigate('/', { state: { message: 'Save congelado.' } })
            } else {
              setDismissedCompletion(completionPending.completedAt)
            }
          }}
        />
      )}
    </main>
  )
}
