import { knockoutAction, knockoutParty } from './knockoutFixtures'
import { knockoutConfigLimits } from '../api/labConfig'
import type { GameConfigValues } from '../api/labConfig'
import { http, HttpResponse, type RequestHandler } from 'msw'
import {
  acceptCombatResponse,
  combatScenario,
  executableCombatCardFixture,
} from './combatFixtures'
import {
  eventMinimumNotMetFixture,
  eventScenarios,
  partyAnticipationFixture,
  partyEncounterFixture,
  partyEventEscapeFailedFixture,
  partyEventConsumableFixture,
  partyEventConsumableUsedFixture,
  partyEventRandomDiscardFixture,
  partyEventRandomDiscardPartialFixture,
  partyEventSetbackFixture,
  partyEventSuccessFixture,
  partyPartialEventFixture,
  partyRandomEventReadyFixture,
  partyScavengeLeftFixture,
  partyScavengeKeptFixture,
  partyScavengePendingFixture,
  partyScavengeWithoutSpaceFixture,
} from './randomEventFixtures'
import {
  partyEffectsReadyFixture,
  partyPotionActivatedFixture,
  partyTonicActivatedFixture,
} from './effectFixtures'
import { cardTypeSchema } from '../api/catalog'
import {
  catalogCardNotFoundFixture,
  catalogQueryInvalidFixture,
  collectionNotFoundFixture,
  collectionsFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
  respawnTownFixture,
} from './catalogFixtures'
import { classesFixture } from './classFixtures'
import type {
  EditorCard,
  EditorClass,
  EditorClassSummary,
  EditorCollection,
} from '../api/editor'
import {
  bosqueClassSummariesFixture,
  bosqueDimensionFixture,
  classIdTakenFixture,
  classNotFoundFixture,
  contentReferencedFixture,
  fixtureClassSummariesFixture,
  fixtureEditorClassesFixture,
  mageDraftFixture,
  magePublishInvalidFixture,
  bosqueCardsDraftFixture,
  bosqueCardsSearchFixture,
  bosqueCollectionFixture,
  bosqueExportFixture,
  bosqueRenamedFixture,
  cardNotFoundFixture,
  collectionIdTakenFixture,
  collectionInvalidFixture,
  contentLockedFixture,
  editorCollectionsFixture,
  fixtureCardSummariesFixture,
  fixtureCollectionFixture,
  fixtureDimensionFixture,
  fixtureEditorCardsFixture,
  legacyEventDeckDraftFixture,
  legacyEventDeckInvalidFixture,
  fixtureExportFixture,
  forcaBrutaCopyFixture,
  forcaBrutaDraftFixture,
  forcaBrutaPublishedFixture,
  forcaBrutaRenamedFixture,
  forcaDraftFixture,
  forcaSorteInvalidFixture,
  importIdTakenFixture,
  importInvalidFixture,
  importResultFixture,
  unknownCardTypeFixture,
} from './editorFixtures'
import {
  healthFixture,
  labConfigDefaultsFixture,
  labConfigEventSettingsFixture,
  labConfigReserveWeightFixture,
  labConfigUpdatedFixture,
} from './fixtures'
import {
  actionBuildBelowMinimumFixture,
  actionInvalidUnknownActionFixture,
  actionInvalidUnknownOperationFixture,
  actionInvalidUnknownOptionFixture,
  actionInvalidZoneNotInMapFixture,
  actionInvalidOperationsLengthFixture,
  actionNotInVaultFixture,
  actionNotOwnedFixture,
  actionNotScavengeableFixture,
  partyFishingRodGrantedFixture,
  partyScavengedFixture,
  partyFishingRodInSessionFixture,
  partyVaultUsedFixture,
  actionPrepareNotAllowedFixture,
  labGrantNotGrantableFixture,
  memberNotFoundFixture,
  partyBladeEquippedFixture,
  partyBladeUnequippedFixture,
  partyGearInSessionFixture,
  partyGrantedCardFixture,
  partyGrantedGoldFixture,
  partyDeckAdjustedFixture,
  partyRecoveredDrawFixture,
  partyRecoveredShuffleDiscardFixture,
  partyRecoveredShuffleHandFixture,
  actionNoActionPointsFixture,
  actionNotAllowedFixture,
  partiesFixture,
  partyBelowMinPlayersFixture,
  partyClassRequiredFixture,
  partyCreatedFixture,
  partyIdleFixture,
  partyInSessionFixture,
  partyInvalidFieldsFixture,
  partyMovedToGroveFixture,
  partyMovedToStoneBendFixture,
  partyNextRoundFixture,
  partyNoPointsFixture,
  partyNotFoundFixture,
  partyUnknownClassFixture,
} from './partyFixtures'

/**
 * GET /catalog/collections/:collectionId/cards: tabela de cenários do
 * contrato — escolhe a resposta pronta pelo pedido, sem filtrar nem calcular
 * (decisão do autor na T-11).
 */
function catalogCardsScenario(
  collectionId: string,
  type: string | null,
): Response {
  if (collectionId !== 'fixture') {
    return HttpResponse.json(collectionNotFoundFixture, { status: 404 })
  }
  if (type === null) return HttpResponse.json(fixtureCardsFixture)
  const cardType = cardTypeSchema.safeParse(type)
  if (cardType.success) {
    return HttpResponse.json(fixtureCardsByTypeFixture[cardType.data])
  }
  return HttpResponse.json(catalogQueryInvalidFixture, { status: 400 })
}

/**
 * POST /parties: tabela de cenários do contrato (D-32) — os corpos dos dois
 * cenários de erro devolvem a fixture de erro; qualquer outro, o grupo
 * criado de exemplo. Não valida nem guarda estado.
 */
async function createPartyScenario(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => undefined)
  if (
    typeof body === 'object' &&
    body !== null &&
    'name' in body &&
    'characterName' in body
  ) {
    if (
      body.name === '   ' &&
      body.characterName === 'Um nome com mais de vinte e quatro letras'
    ) {
      return HttpResponse.json(partyInvalidFieldsFixture, { status: 400 })
    }
    if (body.name === 'Solo' && body.characterName === 'Lia') {
      return HttpResponse.json(partyBelowMinPlayersFixture, { status: 400 })
    }
    // Cenários da FEAT-06: corpo sem classe e classe não publicada.
    if (body.name === 'Os Teimosos' && body.characterName === 'Lia') {
      if (!('playerClass' in body)) {
        return HttpResponse.json(partyClassRequiredFixture, { status: 400 })
      }
      if (body.playerClass === 'mage') {
        return HttpResponse.json(partyUnknownClassFixture, { status: 400 })
      }
    }
  }
  return HttpResponse.json(partyCreatedFixture, { status: 201 })
}

/**
 * POST /parties/:partyId/actions: tabela de cenários do contrato (D-55, D-56)
 * — escolhe a resposta pronta pelo grupo e pelo corpo, sem estado nem regra de
 * travessia ou de pontos. O grupo `partyNoPointsFixture` é o cenário "0 pontos".
 */
async function partyActionScenario(
  partyId: unknown,
  request: Request,
): Promise<Response> {
  const body: unknown = await request.json().catch(() => undefined)
  const type = field(body, 'type')
  const knockout = knockoutParty(partyId)
  if (knockout) return knockoutAction(knockout, body)
  const combat = combatScenario(partyId)
  if (combat) {
    const deny = (reason: string) =>
      HttpResponse.json(
        {
          error: { ...actionNotAllowedFixture.error, details: { reason } },
        },
        { status: 409 },
      )
    const malformed = () =>
      HttpResponse.json(actionInvalidUnknownActionFixture, { status: 400 })
    const choice = combat.party.triggeredEffectChoice
    if (type === 'resolveTriggeredEffect') {
      const choiceId = field(body, 'choiceId')
      const effectId = field(body, 'effectId')
      const decision = field(body, 'decision')
      const payment = field(body, 'payment')
      if (
        typeof choiceId !== 'string' ||
        typeof effectId !== 'string' ||
        (decision !== 'resolve' &&
          decision !== 'decline' &&
          decision !== 'pay') ||
        (decision !== 'pay' && payment !== undefined)
      )
        return malformed()
      if (!choice || choice.choiceId !== choiceId)
        return deny('staleTriggeredEffectChoice')
      const option = choice.effects.find((entry) => entry.effectId === effectId)
      if (
        !option ||
        (option.mode === 'automatic') !== (decision === 'resolve')
      ) {
        return deny('triggeredEffectUnavailable')
      }
      if (decision === 'pay') {
        if (option.mode !== 'optional' || !option.canPay)
          return deny('paymentInvalid')
        const hand = field(payment, 'handCards')
        const expected = option.paymentCosts[0]
        if (
          expected?.type === 'handCards' &&
          (!Array.isArray(hand) || hand.length !== 1 || hand[0] !== 'h1')
        ) {
          return deny('paymentInvalid')
        }
      }
      const key = effectId + ':' + decision
      const response =
        combat.actions[key + ':' + choiceId] ?? combat.actions[key]
      return response
        ? HttpResponse.json(acceptCombatResponse(partyId, response))
        : deny('triggeredEffectUnavailable')
    }
    if (choice) return deny('choicePending')
    const activeCombat = combat.party.combat
    let key = type + ':' + field(body, 'encounterId')

    if (type === 'prepare' && field(body, 'operation') === 'useAbility') {
      const option = combat.party.members[0]?.player.usableAbilities?.[0]
      if (
        !option ||
        field(body, 'abilityId') !== option.abilityId ||
        field(body, 'equipmentSlot') !== option.equipmentSlot
      )
        return deny('combatAbilityUnavailable')
      const payment = field(body, 'payment')
      const expected = {
        handCards: ['h1'],
        equipmentSlots: ['weapon'],
        resources: [{ cardId: 'fixture.iron-ore', copies: 2 }],
      }
      if (
        field(body, 'targetId') !== undefined ||
        Object.entries(expected).some(
          ([key, value]) =>
            JSON.stringify(field(payment, key)) !== JSON.stringify(value),
        )
      )
        return deny('paymentInvalid')
      key = 'prepare:useAbility'
    }
    if (
      type === 'useAbility' ||
      type === 'activateCombatEffect' ||
      type === 'escapeCombat' ||
      type === 'endCombatTurn'
    ) {
      if (!activeCombat || activeCombat.id !== field(body, 'combatId'))
        return deny('staleCombat')
      if (activeCombat.turn.id !== field(body, 'turnId'))
        return deny('staleCombatTurn')
      if (!combat.party.members[0]?.player.availableActions.includes(type))
        return deny('wrongCombatPhase')
      const target = field(body, 'targetId')
      if (type === 'useAbility') {
        const option = activeCombat.abilities.find(
          ({ abilityId, equipmentSlot }) =>
            abilityId === field(body, 'abilityId') &&
            equipmentSlot === field(body, 'equipmentSlot'),
        )
        if (!option) return deny('combatAbilityUnavailable')
        if (typeof target !== 'string' || !option.targetIds.includes(target))
          return deny('combatTargetUnavailable')
      }
      if (type === 'activateCombatEffect') {
        if (
          !activeCombat.effects.some(
            ({ effectId }) => effectId === field(body, 'effectId'),
          )
        )
          return deny('wrongCombatPhase')
        if (target !== undefined) return deny('combatTargetUnavailable')
      }
      if (field(body, 'payment') !== undefined) return deny('paymentInvalid')
      key = type
    }
    if (type === 'combatAttack') {
      const combatId = field(body, 'combatId')
      const turnId = field(body, 'turnId')
      const targetId = field(body, 'targetId')
      if (
        typeof combatId !== 'string' ||
        typeof turnId !== 'string' ||
        typeof targetId !== 'string'
      )
        return malformed()
      if (!activeCombat || activeCombat.id !== combatId)
        return deny('staleCombat')
      if (activeCombat.turn.id !== turnId) return deny('staleCombatTurn')
      if (!activeCombat.attackTargetIds.includes(targetId))
        return deny('combatTargetUnavailable')
      key = type + ':' + targetId
    }
    if (type === 'resolveReward') {
      const rewardId = field(body, 'rewardId')
      if (!combat.party.pendingRewards.some(({ id }) => id === rewardId))
        return deny('staleReward')
      key = type + ':' + rewardId + ':' + field(body, 'choice')
    }
    const response = combat.actions[key]
    return response
      ? HttpResponse.json(acceptCombatResponse(partyId, response))
      : malformed()
  }
  const scenario = eventScenario(partyId)
  if (scenario && typeof type === 'string') {
    const qualifiers = {
      payEventRequirement: field(body, 'requirementId'),
      prepare: field(body, 'operation'),
      resolveReward: field(body, 'choice'),
    }
    const qualifier = qualifiers[type as keyof typeof qualifiers]
    const discard = field(body, 'discard')
    let key = typeof qualifier === 'string' ? type + ':' + qualifier : type
    if (
      key === 'resolveReward:keep' &&
      Array.isArray(discard) &&
      discard.length === 0
    ) {
      key += ':empty'
    }
    const rewardKey = `${key}:${field(body, 'rewardId')}`
    const scenarioKey =
      type === 'resolveReward' && Object.hasOwn(scenario.actions, rewardKey)
        ? rewardKey
        : key
    const response = Object.hasOwn(scenario.actions, scenarioKey)
      ? scenario.actions[scenarioKey]
      : undefined
    if (response && 'reason' in response) {
      return HttpResponse.json(
        {
          error: {
            ...eventMinimumNotMetFixture.error,
            ...(response.reason === 'rewardDoesNotFit' && {
              message: 'O lote não libera espaço para a recompensa.',
            }),
            details: response,
          },
        },
        { status: 409 },
      )
    }
    if (response) return HttpResponse.json({ ...response, id: partyId })
  }
  if (
    partyId === partyEventConsumableFixture.id &&
    type === 'prepare' &&
    field(body, 'operation') === 'activate'
  ) {
    return HttpResponse.json(partyEventConsumableUsedFixture)
  }
  if (
    type === 'payEventRequirement' &&
    field(body, 'requirementId') === 'discard'
  ) {
    if (
      (partyId === partyEventRandomDiscardFixture.id ||
        partyId === partyEventRandomDiscardPartialFixture.id) &&
      field(body, 'payment') !== undefined
    ) {
      return HttpResponse.json(
        {
          error: {
            ...eventMinimumNotMetFixture.error,
            details: { reason: 'paymentInvalid' },
          },
        },
        { status: 409 },
      )
    }
    if (partyId === partyEventRandomDiscardFixture.id) {
      return HttpResponse.json({
        ...partyEventRandomDiscardPartialFixture,
        id: partyId,
      })
    }
    if (partyId === partyEventRandomDiscardPartialFixture.id) {
      return HttpResponse.json(eventMinimumNotMetFixture, { status: 409 })
    }
  }
  if (partyId === partyScavengeWithoutSpaceFixture.id) {
    if (type === 'scavenge')
      return HttpResponse.json(partyScavengePendingFixture)
    if (type === 'resolveReward' && field(body, 'choice') === 'leave') {
      return HttpResponse.json(partyScavengeLeftFixture)
    }
    if (type === 'resolveReward' && field(body, 'choice') === 'keep') {
      const discard = field(body, 'discard')
      if (Array.isArray(discard) && discard.length > 0)
        return HttpResponse.json(partyScavengeKeptFixture)
      return HttpResponse.json(
        {
          error: {
            ...eventMinimumNotMetFixture.error,
            message: 'O lote não libera espaço para a recompensa.',
            details: { reason: 'rewardDoesNotFit' },
          },
        },
        { status: 409 },
      )
    }
  }
  if (
    partyId === partyRandomEventReadyFixture.id ||
    partyId === partyPartialEventFixture.id
  ) {
    if (type === 'startEvent')
      return HttpResponse.json(partyAnticipationFixture)
    if (type === 'revealEvent') return HttpResponse.json(partyEncounterFixture)
    if (type === 'escapeEvent')
      return HttpResponse.json({
        ...partyEventEscapeFailedFixture,
        id: partyId,
      })
    if (type === 'payEventRequirement') {
      const cards = field(field(body, 'payment'), 'handCards')
      if (Array.isArray(cards) && cards.length === 1 && cards[0] === 'h2') {
        return HttpResponse.json({ ...partyPartialEventFixture, id: partyId })
      }
      if (Array.isArray(cards) && cards.length === 1 && cards[0] === 'h1') {
        return HttpResponse.json({ ...partyEventSuccessFixture, id: partyId })
      }
    }
    if (type === 'giveUpEvent')
      return HttpResponse.json({ ...partyEventSetbackFixture, id: partyId })
  }
  if (type === 'endTurn') return HttpResponse.json(partyNextRoundFixture)
  if (
    type !== 'move' &&
    type !== 'recover' &&
    type !== 'adjustDeck' &&
    type !== 'prepare' &&
    type !== 'scavenge' &&
    type !== 'useVault'
  ) {
    return HttpResponse.json(actionInvalidUnknownActionFixture, { status: 400 })
  }
  const option = field(body, 'option')
  if (type === 'recover' && !recoverOptions.includes(option)) {
    return HttpResponse.json(actionInvalidUnknownOptionFixture, { status: 400 })
  }
  const operations = field(body, 'operations')
  if (
    type === 'useVault' &&
    Array.isArray(operations) &&
    operations.length === 0
  ) {
    return HttpResponse.json(actionInvalidOperationsLengthFixture, {
      status: 400,
    })
  }
  if (type === 'prepare') return prepareScenario(body)
  if (partyId === partyNoPointsFixture.id) {
    return HttpResponse.json(actionNoActionPointsFixture, { status: 409 })
  }
  if (type === 'recover') return recoverScenario(option)
  if (type === 'adjustDeck') return adjustDeckScenario(field(body, 'build'))
  if (type === 'scavenge') {
    return field(body, 'cardId') === 'fixture.silver-fish'
      ? HttpResponse.json(partyScavengedFixture)
      : HttpResponse.json(actionNotScavengeableFixture, { status: 409 })
  }
  if (type === 'useVault') return vaultBatchScenario(operations)
  switch (field(body, 'zoneId')) {
    case 'fixture.stone-bend':
      return HttpResponse.json(partyMovedToStoneBendFixture)
    case 'fixture.whispering-grove':
      return HttpResponse.json(partyMovedToGroveFixture)
    case 'fixture.gray-harbor':
      return HttpResponse.json(partyInSessionFixture)
    case 'fixture.old-mine':
      return HttpResponse.json(actionNotAllowedFixture, { status: 409 })
    default:
      return HttpResponse.json(actionInvalidZoneNotInMapFixture, {
        status: 400,
      })
  }
}

/**
 * `prepare`: tabela dos cenários do contrato pelo `cardId` ou `slot` do pedido
 * (D-58 item 4). Gratuita: não olha os pontos; sem estado nem conferência de
 * Pico, classe, escudo ou espaço (Princípio 3).
 */
function prepareScenario(body: unknown): Response {
  const refuse = (
    reason: Parameters<typeof actionPrepareNotAllowedFixture>[0],
  ) =>
    HttpResponse.json(actionPrepareNotAllowedFixture(reason), { status: 409 })
  switch (field(body, 'operation')) {
    case 'activate':
      switch (field(body, 'cardId')) {
        case 'fixture.healing-potion':
          return HttpResponse.json(partyPotionActivatedFixture)
        case 'fixture.strength-tonic':
          return HttpResponse.json(partyTonicActivatedFixture)
        default:
          return HttpResponse.json(
            {
              error: {
                code: 'ACTION_NOT_ALLOWED',
                message: 'Este efeito ainda não pode ser ativado.',
                details: { reason: 'notActivatableYet' },
              },
            },
            { status: 409 },
          )
      }
    case 'equip':
      switch (field(body, 'cardId')) {
        case 'fixture.blade-of-dusk':
          return HttpResponse.json(partyBladeEquippedFixture)
        case 'fixture.oak-shield':
          return refuse('shieldBlocked')
        case 'fixture.iron-helm':
          return refuse('peakRequirementNotMet')
        case 'fixture.arcane-wand':
          return refuse('classRestricted')
        case 'fixture.healing-potion':
          return refuse('notEquipment')
        default:
          return refuse('notInInventory')
      }
    case 'unequip':
      return field(body, 'slot') === 'weapon'
        ? HttpResponse.json(partyBladeUnequippedFixture)
        : refuse('slotEmpty')
    default:
      return HttpResponse.json(actionInvalidUnknownOperationFixture, {
        status: 400,
      })
  }
}

/**
 * `useVault`: tabela dos cenários do contrato (D-59 item 6). Lote com um
 * `take` de 5 → a recusa fixa do cenário (`notInVault`, `operationIndex` 1);
 * qualquer outro → o `Party` do lote de exemplo. Sem simular o lote.
 */
function vaultBatchScenario(operations: unknown): Response {
  const takesFive =
    Array.isArray(operations) &&
    operations.some(
      (item) =>
        field(item, 'operation') === 'take' && field(item, 'quantity') === 5,
    )
  return takesFive
    ? HttpResponse.json(actionNotInVaultFixture, { status: 409 })
    : HttpResponse.json(partyVaultUsedFixture)
}

/**
 * POST /lab/parties/:partyId/members/:memberId/grants: tabela dos cenários do
 * contrato (D-58 item 4), na ordem do contrato: membro, corpo, carta.
 */
async function labGrantScenario(
  memberId: unknown,
  request: Request,
): Promise<Response> {
  if (memberId !== partyCreatedFixture.members[0].id) {
    return HttpResponse.json(memberNotFoundFixture, { status: 404 })
  }
  const body = await jsonBody(request)
  if (field(body, 'type') === 'gold') {
    return HttpResponse.json(partyGrantedGoldFixture)
  }
  switch (field(body, 'cardId')) {
    case 'fixture.gray-harbor':
      return HttpResponse.json(labGrantNotGrantableFixture, { status: 400 })
    case 'fixture.nope':
      return HttpResponse.json(catalogCardNotFoundFixture, { status: 404 })
    case 'fixture.fishing-rod':
      return HttpResponse.json(partyFishingRodGrantedFixture)
    default:
      return HttpResponse.json(partyGrantedCardFixture)
  }
}

/** Opções do `recover` no contrato (o 400 vem antes do `noActionPoints`). */
const recoverOptions: unknown[] = [
  'drawToHand',
  'shuffleHand',
  'shuffleDiscard',
]

/** `recover`: um `Party` pronto por opção (CONTRATO §3 FEAT-09, D-57). */
function recoverScenario(option: unknown): Response {
  switch (option) {
    case 'drawToHand':
      return HttpResponse.json(partyRecoveredDrawFixture)
    case 'shuffleHand':
      return HttpResponse.json(partyRecoveredShuffleHandFixture)
    case 'shuffleDiscard':
      return HttpResponse.json(partyRecoveredShuffleDiscardFixture)
    default:
      return HttpResponse.json(actionInvalidUnknownOptionFixture, {
        status: 400,
      })
  }
}

/** Build enviada como texto comparável (`cardId:copies`, na ordem enviada). */
function buildKey(build: unknown): string {
  return Array.isArray(build)
    ? build
        .map(
          (item) =>
            `${String(field(item, 'cardId'))}:${String(field(item, 'copies'))}`,
        )
        .join(',')
    : ''
}

const strengthBasic = 'fixture.strength-basic'
const enduranceBasic = 'fixture.endurance-basic'
const dexterityBasic = 'fixture.dexterity-basic'

/**
 * `adjustDeck`: tabela das builds dos cenários do contrato, pela build enviada
 * exatamente; qualquer outra recebe o `Party` ajustado sem mudança (D-57 item
 * 6). Nenhuma conferência de mínimo, posse ou pasta (Princípio 3).
 */
function adjustDeckScenario(build: unknown): Response {
  switch (buildKey(build)) {
    case `${enduranceBasic}:30,${strengthBasic}:29`:
      return HttpResponse.json(actionBuildBelowMinimumFixture, { status: 409 })
    case `${enduranceBasic}:30,${strengthBasic}:31`:
      return HttpResponse.json(actionNotOwnedFixture(strengthBasic), {
        status: 409,
      })
    case `${enduranceBasic}:30,${strengthBasic}:30,${dexterityBasic}:1`:
      return HttpResponse.json(actionNotOwnedFixture(dexterityBasic), {
        status: 409,
      })
    default:
      return HttpResponse.json(partyDeckAdjustedFixture)
  }
}

/** GET /catalog/cards/:cardId: as cartas da `fixture`; qualquer outra é 404. */
function catalogCardScenario(cardId: string): Response {
  const card =
    cardId === executableCombatCardFixture.id
      ? executableCombatCardFixture
      : cardId === respawnTownFixture.id
        ? respawnTownFixture
        : fixtureCardsFixture.find((entry) => entry.id === cardId)
  return card === undefined
    ? HttpResponse.json(catalogCardNotFoundFixture, { status: 404 })
    : HttpResponse.json(card)
}

/** Rotas de um grupo: o grupo de exemplo responde, qualquer outro é 404. */
function knownParty(
  partyId: unknown,
  ok: () => Response | Promise<Response>,
): Response | Promise<Response> {
  return knockoutParty(partyId) !== undefined ||
    combatScenario(partyId) !== undefined ||
    eventScenario(partyId) !== undefined ||
    partyId === partyCreatedFixture.id ||
    partyId === partyNoPointsFixture.id ||
    partyId === partyGearInSessionFixture.id ||
    partyId === partyFishingRodInSessionFixture.id ||
    partyId === partyEffectsReadyFixture.id ||
    partyId === partyRandomEventReadyFixture.id ||
    partyId === partyScavengeWithoutSpaceFixture.id ||
    partyId === partyEventConsumableFixture.id ||
    partyId === partyEventRandomDiscardFixture.id ||
    partyId === partyEventRandomDiscardPartialFixture.id
    ? ok()
    : HttpResponse.json(partyNotFoundFixture, { status: 404 })
}

function eventScenario(partyId: unknown) {
  if (typeof partyId === 'string' && Object.hasOwn(eventScenarios, partyId)) {
    return eventScenarios[partyId]
  }
}

function eventScenarioParty(partyId: unknown) {
  const scenario = eventScenario(partyId)
  if (scenario) return { ...scenario.party, id: partyId }
}

/** Lê o corpo JSON do pedido como `unknown` (inválido → `undefined`). */
async function jsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined)
}

function field(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null && key in body
    ? (body as Record<string, unknown>)[key]
    : undefined
}

let knockoutLabValues: Partial<GameConfigValues> = {}

function knockoutLabConfig() {
  return {
    ...labConfigDefaultsFixture,
    values: { ...labConfigDefaultsFixture.values, ...knockoutLabValues },
  }
}

function patchKnockoutLabConfig(body: unknown) {
  const patch: Partial<GameConfigValues> = {}
  const fields = []
  for (const key of Object.keys(
    knockoutConfigLimits,
  ) as (keyof typeof knockoutConfigLimits)[]) {
    const value = field(body, key)
    if (value === undefined) continue
    const { min, max } = knockoutConfigLimits[key]
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      fields.push({ field: key, reason: 'notInteger' })
    } else if (value < min || value > max) {
      fields.push({ field: key, reason: 'outOfRange' })
    } else {
      patch[key] = value
    }
  }
  if (fields.length)
    return HttpResponse.json(
      {
        error: {
          code: 'LAB_CONFIG_INVALID',
          message: 'Configuração do laboratório inválida.',
          details: { fields },
        },
      },
      { status: 400 },
    )
  if (Object.keys(patch).length) {
    knockoutLabValues = { ...knockoutLabValues, ...patch }
    return HttpResponse.json(knockoutLabConfig())
  }
}

const notFound = {
  collection: () =>
    HttpResponse.json(collectionNotFoundFixture, { status: 404 }),
  card: () => HttpResponse.json(cardNotFoundFixture, { status: 404 }),
  class: () => HttpResponse.json(classNotFoundFixture, { status: 404 }),
}

/** Coleções que o editor conhece nos cenários (D-40). */
const editorCollections: Record<string, EditorCollection> = {
  fixture: fixtureCollectionFixture,
  bosque: bosqueRenamedFixture,
}

/** Cartas que o editor conhece nos cenários (D-40). */
const editorCards: Record<string, EditorCard> = Object.fromEntries(
  [
    ...fixtureEditorCardsFixture,
    legacyEventDeckDraftFixture,
    forcaDraftFixture,
    forcaBrutaRenamedFixture,
    forcaBrutaCopyFixture,
  ].map((entry) => [entry.card.id, entry]),
)

/** Classes que o editor conhece nos cenários (FEAT-06, D-40). */
const editorClasses: Record<string, EditorClass> = Object.fromEntries(
  [...fixtureEditorClassesFixture, mageDraftFixture].map((entry) => [
    entry.classDefinition.playerClass,
    entry,
  ]),
)

/** GET …/:collectionId/classes: listas prontas por coleção. */
const editorClassLists: Record<string, EditorClassSummary[]> = {
  fixture: fixtureClassSummariesFixture,
  bosque: bosqueClassSummariesFixture,
}

/** POST …/:collectionId/classes: `playerClass` já existente → 409. */
async function createClassScenario(
  collectionId: string,
  request: Request,
): Promise<Response> {
  if (!Object.hasOwn(editorCollections, collectionId))
    return notFound.collection()
  const playerClass = field(await jsonBody(request), 'playerClass')
  if (playerClass === 'warrior' || playerClass === 'rogue') {
    return HttpResponse.json(classIdTakenFixture, { status: 409 })
  }
  return HttpResponse.json(mageDraftFixture, { status: 201 })
}

/** PUT /lab/content/classes/:playerClass: publicada com outro id → 409. */
async function saveClassScenario(
  playerClass: string,
  request: Request,
): Promise<Response> {
  if (!Object.hasOwn(editorClasses, playerClass)) return notFound.class()
  const current = editorClasses[playerClass]
  const renamed = field(await jsonBody(request), 'playerClass') !== playerClass
  if (current.status === 'published' && renamed) {
    return HttpResponse.json(contentLockedFixture, { status: 409 })
  }
  return HttpResponse.json(current)
}

function knownClass(
  playerClass: unknown,
  ok: (playerClass: string) => Response,
): Response {
  return typeof playerClass === 'string' &&
    Object.hasOwn(editorClasses, playerClass)
    ? ok(playerClass)
    : notFound.class()
}

/** POST /lab/content/collections: erro só nos corpos dos cenários. */
async function createCollectionScenario(request: Request): Promise<Response> {
  const id = field(await jsonBody(request), 'id')
  if (id === 'Bosque X') {
    return HttpResponse.json(collectionInvalidFixture, { status: 400 })
  }
  if (id === 'fixture') {
    return HttpResponse.json(collectionIdTakenFixture, { status: 409 })
  }
  return HttpResponse.json(bosqueCollectionFixture, { status: 201 })
}

/** GET …/:collectionId/cards: listas prontas pelo pedido, sem filtrar. */
function editorCardsScenario(collectionId: string, url: URL): Response {
  const type = url.searchParams.get('type')
  if (type !== null && !cardTypeSchema.safeParse(type).success) {
    return HttpResponse.json(unknownCardTypeFixture, { status: 400 })
  }
  if (collectionId === 'fixture') {
    return HttpResponse.json(fixtureCardSummariesFixture)
  }
  if (collectionId === 'bosque') {
    return HttpResponse.json(
      url.searchParams.get('status') === 'draft'
        ? bosqueCardsDraftFixture
        : bosqueCardsSearchFixture,
    )
  }
  return notFound.collection()
}

/** POST …/:collectionId/cards: "forca-sorte" é o cenário de erro. */
async function createCardScenario(
  collectionId: string,
  request: Request,
): Promise<Response> {
  if (!Object.hasOwn(editorCollections, collectionId))
    return notFound.collection()
  if (field(await jsonBody(request), 'slug') === 'forca-sorte') {
    return HttpResponse.json(forcaSorteInvalidFixture, { status: 400 })
  }
  return HttpResponse.json(forcaDraftFixture, { status: 201 })
}

/** PUT /lab/content/cards/:cardId: cenários de renomear e de publicada. */
async function saveCardScenario(
  cardId: string,
  request: Request,
): Promise<Response> {
  const current = editorCards[cardId]
  if (current === undefined) return notFound.card()
  const body = await jsonBody(request)
  if (cardId === 'bosque.forca')
    return HttpResponse.json(forcaBrutaDraftFixture)
  if (cardId === 'bosque.forca-bruta') {
    if (field(body, 'slug') === 'outra') {
      return HttpResponse.json(contentLockedFixture, { status: 409 })
    }
    return HttpResponse.json(
      field(body, 'name') === 'Força Bruta'
        ? forcaBrutaRenamedFixture
        : forcaBrutaPublishedFixture,
    )
  }
  return HttpResponse.json(current)
}

/** POST /lab/content/import: cenários do contrato pelo corpo e pelo `replace`. */
async function importScenario(request: Request): Promise<Response> {
  const body = await jsonBody(request)
  // Cenário do contrato: corpo `{}` (sem validar outros corpos).
  if (
    typeof body === 'object' &&
    body !== null &&
    Object.keys(body).length === 0
  ) {
    return HttpResponse.json(importInvalidFixture, { status: 400 })
  }
  const replace = new URL(request.url).searchParams.get('replace') === 'true'
  const collectionId = field(field(body, 'collection'), 'id')
  if (
    !replace &&
    typeof collectionId === 'string' &&
    Object.hasOwn(editorCollections, collectionId)
  ) {
    return HttpResponse.json(importIdTakenFixture, { status: 409 })
  }
  return HttpResponse.json(importResultFixture, { status: 201 })
}

function knownCollection(
  collectionId: unknown,
  ok: (id: string) => Response,
): Response {
  return typeof collectionId === 'string' &&
    Object.hasOwn(editorCollections, collectionId)
    ? ok(collectionId)
    : notFound.collection()
}

function knownCard(cardId: unknown, ok: (id: string) => Response): Response {
  return typeof cardId === 'string' && Object.hasOwn(editorCards, cardId)
    ? ok(cardId)
    : notFound.card()
}

/** Editor de conteúdo (FEAT-31): tabela de cenários, sem estado (D-29, D-40). */
const editorHandlers: RequestHandler[] = [
  http.get('*/lab/content/collections', () =>
    HttpResponse.json(editorCollectionsFixture),
  ),
  http.post('*/lab/content/collections', ({ request }) =>
    createCollectionScenario(request),
  ),
  http.get('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(editorCollections[id]),
    ),
  ),
  http.patch('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(editorCollections[id]),
    ),
  ),
  http.delete('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(
      params.collectionId,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ),
  http.post(
    '*/lab/content/collections/:collectionId/validate-dimension',
    ({ params }) =>
      knownCollection(params.collectionId, (id) =>
        HttpResponse.json(
          id === 'fixture' ? fixtureDimensionFixture : bosqueDimensionFixture,
        ),
      ),
  ),
  http.get('*/lab/content/collections/:collectionId/export', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(
        id === 'fixture' ? fixtureExportFixture : bosqueExportFixture,
      ),
    ),
  ),
  http.post('*/lab/content/import', ({ request }) => importScenario(request)),
  http.get(
    '*/lab/content/collections/:collectionId/cards',
    ({ params, request }) =>
      editorCardsScenario(String(params.collectionId), new URL(request.url)),
  ),
  http.post(
    '*/lab/content/collections/:collectionId/cards',
    ({ params, request }) =>
      createCardScenario(String(params.collectionId), request),
  ),
  http.get('*/lab/content/cards/:cardId', ({ params }) =>
    knownCard(params.cardId, (id) => HttpResponse.json(editorCards[id])),
  ),
  http.put('*/lab/content/cards/:cardId', ({ params, request }) =>
    saveCardScenario(String(params.cardId), request),
  ),
  http.post('*/lab/content/cards/:cardId/publish', ({ params }) =>
    knownCard(params.cardId, (id) => {
      if (id === legacyEventDeckDraftFixture.card.id) {
        return HttpResponse.json(legacyEventDeckInvalidFixture, { status: 400 })
      }
      return HttpResponse.json(
        id.startsWith('bosque.') ? forcaBrutaPublishedFixture : editorCards[id],
      )
    }),
  ),
  http.post('*/lab/content/cards/:cardId/duplicate', ({ params }) =>
    knownCard(params.cardId, () =>
      HttpResponse.json(forcaBrutaCopyFixture, { status: 201 }),
    ),
  ),
  http.delete('*/lab/content/cards/:cardId', ({ params }) =>
    knownCard(params.cardId, (id) =>
      // Cenário do contrato: carta de atributo no deck pré-pronto de uma classe.
      id === 'fixture.dexterity-basic'
        ? HttpResponse.json(contentReferencedFixture, { status: 409 })
        : new HttpResponse(null, { status: 204 }),
    ),
  ),
  http.get('*/lab/content/collections/:collectionId/classes', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(editorClassLists[id] ?? []),
    ),
  ),
  http.post(
    '*/lab/content/collections/:collectionId/classes',
    ({ params, request }) =>
      createClassScenario(String(params.collectionId), request),
  ),
  http.get('*/lab/content/classes/:playerClass', ({ params }) =>
    knownClass(params.playerClass, (id) =>
      HttpResponse.json(editorClasses[id]),
    ),
  ),
  http.put('*/lab/content/classes/:playerClass', ({ params, request }) =>
    saveClassScenario(String(params.playerClass), request),
  ),
  http.post('*/lab/content/classes/:playerClass/publish', ({ params }) =>
    knownClass(params.playerClass, (id) =>
      id === 'mage'
        ? HttpResponse.json(magePublishInvalidFixture, { status: 400 })
        : HttpResponse.json(editorClasses[id]),
    ),
  ),
  http.delete('*/lab/content/classes/:playerClass', ({ params }) =>
    knownClass(
      params.playerClass,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ),
]

/**
 * Handlers do MSW: respondem só fixtures do contrato (Princípio 3) — a
 * resposta é fixa (o catálogo de cartas escolhe a fixture do cenário pelo
 * pedido, sem calcular); os testes trocam o handler por cenário. O path
 * `*\/...` casa tanto a chamada relativa no dev (VITE_API_URL vazio, mesma
 * origem) quanto a absoluta nos testes em Node.
 */
export const handlers: RequestHandler[] = [
  http.get('*/health', () => HttpResponse.json(healthFixture)),
  http.get('*/lab/config', () => HttpResponse.json(knockoutLabConfig())),
  http.patch('*/lab/config', async ({ request }) => {
    const body = await jsonBody(request)
    const knockout = patchKnockoutLabConfig(body)
    if (knockout) return knockout
    const reserve = field(body, 'reserveDeck')
    if (field(body, 'combatEscapeThreshold') === 0) {
      return HttpResponse.json({
        ...labConfigDefaultsFixture,
        values: {
          ...labConfigDefaultsFixture.values,
          combatEscapeThreshold: 0,
        },
      })
    }
    if (field(body, 'maxCombatCycles') === 25) {
      return HttpResponse.json({
        ...labConfigDefaultsFixture,
        values: { ...labConfigDefaultsFixture.values, maxCombatCycles: 25 },
      })
    }
    if (Array.isArray(reserve) && field(reserve[0], 'weight') === 0) {
      return HttpResponse.json(labConfigReserveWeightFixture, { status: 400 })
    }
    if (
      field(body, 'escapeVigorPercent') === 25 &&
      JSON.stringify(reserve) ===
        JSON.stringify(labConfigEventSettingsFixture.values.reserveDeck)
    ) {
      return HttpResponse.json(labConfigEventSettingsFixture)
    }
    return HttpResponse.json(labConfigUpdatedFixture)
  }),
  http.post('*/lab/config/reset', () => {
    knockoutLabValues = {}
    return HttpResponse.json(labConfigDefaultsFixture)
  }),
  http.get('*/catalog/collections', () =>
    HttpResponse.json(collectionsFixture),
  ),
  http.get('*/catalog/collections/:collectionId/cards', ({ params, request }) =>
    catalogCardsScenario(
      String(params.collectionId),
      new URL(request.url).searchParams.get('type'),
    ),
  ),
  http.get('*/catalog/cards/:cardId', ({ params }) =>
    catalogCardScenario(String(params.cardId)),
  ),
  http.get('*/catalog/classes', () => HttpResponse.json(classesFixture)),
  http.get('*/parties', () => HttpResponse.json(partiesFixture)),
  http.post('*/parties', ({ request }) => createPartyScenario(request)),
  http.get('*/parties/:partyId', ({ params }) =>
    knownParty(params.partyId, () =>
      HttpResponse.json(
        knockoutParty(params.partyId) ??
          combatScenario(params.partyId)?.party ??
          eventScenarioParty(params.partyId) ??
          [
            partyNoPointsFixture,
            partyGearInSessionFixture,
            partyFishingRodInSessionFixture,
            partyEffectsReadyFixture,
            partyRandomEventReadyFixture,
            partyScavengeWithoutSpaceFixture,
            partyEventConsumableFixture,
            partyEventRandomDiscardFixture,
            partyEventRandomDiscardPartialFixture,
          ].find((party) => party.id === params.partyId) ??
          partyCreatedFixture,
      ),
    ),
  ),
  http.post('*/parties/:partyId/session', ({ params }) =>
    knownParty(params.partyId, () =>
      HttpResponse.json(
        knockoutParty(params.partyId, 'inSession') ??
          combatScenario(params.partyId)?.party ??
          eventScenarioParty(params.partyId) ??
          [
            partyNoPointsFixture,
            partyGearInSessionFixture,
            partyFishingRodInSessionFixture,
            partyEffectsReadyFixture,
            partyRandomEventReadyFixture,
            partyScavengeWithoutSpaceFixture,
            partyEventConsumableFixture,
            partyEventRandomDiscardFixture,
            partyEventRandomDiscardPartialFixture,
          ].find((party) => party.id === params.partyId) ??
          partyInSessionFixture,
      ),
    ),
  ),
  http.post('*/parties/:partyId/session/end', ({ params }) =>
    knownParty(params.partyId, () =>
      HttpResponse.json(
        knockoutParty(params.partyId, 'idle') ?? partyIdleFixture,
      ),
    ),
  ),
  http.post('*/parties/:partyId/actions', ({ params, request }) =>
    knownParty(params.partyId, () =>
      partyActionScenario(params.partyId, request),
    ),
  ),
  http.post(
    '*/lab/parties/:partyId/members/:memberId/grants',
    ({ params, request }) =>
      knownParty(params.partyId, () =>
        labGrantScenario(params.memberId, request),
      ),
  ),
  http.delete('*/parties/:partyId', ({ params }) =>
    knownParty(params.partyId, () => new HttpResponse(null, { status: 204 })),
  ),
  ...editorHandlers,
]
