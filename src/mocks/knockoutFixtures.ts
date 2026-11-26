import { HttpResponse } from 'msw'
import type { Effect } from '../api/effects'
import type { Party, PartyActionResponse, PlayerState } from '../api/parties'
import {
  actionInvalidUnknownActionFixture,
  actionNotAllowedFixture,
  partyInSessionFixture,
  partySessionNotActiveFixture,
} from './partyFixtures'
import {
  partyEncounterFixture,
  partyEventSetbackFixture,
} from './randomEventFixtures'
import { knockoutCombatFixture } from './combatFixtures'

const harbor = 'fixture.gray-harbor'
const town = 'fixture.respawn-town'
const woods = 'fixture.whispering-grove'
const member = partyInSessionFixture.members[0]!
const urbanActions: PlayerState['availableActions'] = [
  'move',
  'recover',
  'adjustDeck',
  'useVault',
  'saveRespawnPoint',
  'endTurn',
]
const prefix = 'fixture.knockout-'
const base: Party = {
  ...partyInSessionFixture,
  dimension: {
    ...partyInSessionFixture.dimension,
    map: {
      zones: [
        { zoneId: harbor, x: 0, y: 0, arrows: ['east'] },
        { zoneId: town, x: 1, y: 0, arrows: ['east', 'west'] },
        { zoneId: woods, x: 2, y: 0, arrows: ['west'] },
      ],
      crossings: [{ zoneIds: [harbor, town] }, { zoneIds: [town, woods] }],
    },
  },
  combat: null,
}

function withPlayer(party: Party, fields: Partial<PlayerState>): Party {
  return {
    ...party,
    members: [
      { ...member, player: { ...party.members[0]!.player, ...fields } },
    ],
  }
}

const spawn = withPlayer(base, {
  moveTargets: [town],
  availableActions: urbanActions,
})
const atRisk = withPlayer(
  { ...base, turn: { ...base.turn, round: 6, actionPoints: 2 } },
  {
    zoneId: woods,
    market: null,
    blacksmith: null,
    respawnZoneId: town,
    moveTargets: [town],
    health: 2,
    peak: 10,
    vigor: 9,
    gold: 37,
    vault: { slots: [], decks: [], gold: 80 },
    availableActions: ['move', 'endTurn'],
    down: false,
  },
)
const combat = {
  ...knockoutCombatFixture,
  id: 'combat-1',
  turn: { ...knockoutCombatFixture.turn, id: 'turn-1' },
}

function instant(activation: Effect['activation'][number]) {
  return {
    type: 'effect' as const,
    effect: {
      text: '',
      activation: [activation],
      duration: { kind: 'immediate' as const },
      mark: null,
    },
  }
}

function encounter(
  id: 'e1' | 'e2',
): NonNullable<Party['randomEventEncounter']> {
  const source = partyEncounterFixture.randomEventEncounter!
  const life = {
    id: 'life',
    kind: 'donateLife',
    amount: 2,
    text: 'Doe 2 PV.',
  } as const
  const gold = {
    id: 'gold',
    kind: 'payGold',
    amount: 5,
    text: 'Pague 5 de ouro.',
  } as const
  const attrs = {
    id: 'attrs',
    text: 'Entregue uma Força.',
    kind: 'attributes',
    specific: { strength: 1 },
    any: 0,
  } as const
  const requirements = id === 'e1' ? [attrs, life, gold] : [gold]
  const heal = instant({ kind: 'heal', amount: 5 })
  return {
    ...source,
    id,
    payments:
      id === 'e1'
        ? [
            {
              requirementId: 'attrs',
              handCards: [{ copyId: 'h1', cardId: 'fixture.strength-basic' }],
            },
          ]
        : [],
    requirements: requirements.map(({ id }) => ({
      requirementId: id,
      status: id === 'attrs' ? 'paid' : 'unpaid',
      payable: id !== 'attrs',
      handCardSelection: null,
      eligibleHandCopyIds: [],
      eligibleEquipmentSlots: [],
      eligibleResourceCardIds: [],
      amountDue: id === 'life' ? 2 : id === 'gold' ? 5 : null,
    })),
    card: {
      ...source.card!,
      requirements,
      badOutcome: {
        text: 'Revés.',
        steps:
          id === 'e1'
            ? [instant({ kind: 'loseGold', amount: 5 })]
            : [
                instant({ kind: 'loseLife', amount: 2 }),
                heal,
                { type: 'grantReward', cardId: 'fixture.pickaxe', copies: 1 },
                heal,
              ],
      },
    },
  }
}

const readyAbility: NonNullable<PlayerState['usableAbilities']>[number] = {
  equipmentSlot: 'weapon',
  abilityId: 'focus',
  targetIds: [],
  vigorCost: 0,
  paymentCosts: [],
}
const fullInventory: Partial<PlayerState> = {
  inventoryCapacity: 1,
  inventory: [{ cardId: 'fixture.healing-potion', quantity: 1 }],
}

const initial = {
  spawn,
  donation: withPlayer(atRisk, {
    availableActions: ['prepare', 'endTurn'],
    usableAbilities: [
      {
        ...readyAbility,
        abilityId: 'donate-life',
        paymentCosts: [{ type: 'automatic', costIndex: 0, text: 'Doe 2 PV' }],
      },
    ],
    statuses: [
      {
        statusId: 'status-1',
        sourceCardId: 'fixture.healing-potion',
        effectIndex: 0,
        text: 'Duas rodadas',
        mark: 'buff',
        activation: [],
        duration: { kind: 'forRounds', rounds: 2 },
        remaining: 2,
      },
    ],
  }),
  'fatal-payment': withPlayer(
    { ...atRisk, randomEventEncounter: encounter('e1') },
    {
      hand: [],
      handCopies: [],
      attributeDiscardPileCount: 1,
      attributeDeckCount: 1,
      availableActions: ['payEventRequirement', 'giveUpEvent', 'escapeEvent'],
    },
  ),
  heal: withPlayer(
    { ...atRisk, randomEventEncounter: encounter('e2') },
    {
      ...fullInventory,
      availableActions: ['giveUpEvent'],
    },
  ),
  defeat: withPlayer(
    { ...atRisk, combat },
    { availableActions: ['endCombatTurn'] },
  ),
  reflection: withPlayer(
    { ...atRisk, combat },
    { ...fullInventory, availableActions: ['combatAttack'] },
  ),
  'reflection-auto': withPlayer(
    { ...atRisk, combat },
    { availableActions: ['combatAttack'] },
  ),
} satisfies Record<string, Party>

const parties = new Map<string, Party>()
export function resetKnockoutScenarios() {
  parties.clear()
}

export function knockoutParty(id: unknown, status?: Party['status']) {
  if (typeof id !== 'string' || !id.startsWith(prefix)) return
  const key = id.slice(prefix.length)
  const scenario = Object.hasOwn(initial, key)
    ? initial[key as keyof typeof initial]
    : legacyParty(key)
  if (!scenario) return
  const party = parties.get(id) ?? { ...scenario, id }
  const updated = status ? { ...party, status } : party
  if (!parties.has(id) || status) parties.set(id, updated)
  return updated.status === 'idle'
    ? withPlayer(updated, {
        availableActions: [],
        moveTargets: [],
        usableAbilities: [],
      })
    : updated
}

const setback = partyEventSetbackFixture.members[0]!.player.lastRandomEvent!
const rewardCard = 'fixture.pickaxe'
const victory = {
  finalBoss: false,
  combatId: combat.id,
  cardId: combat.card.id,
  memberId: member.id,
  resolution: 'victory',
  cause: 'enemiesDefeated',
  playerDown: true,
  peakDelta: 1,
} as const
const defeat = {
  ...victory,
  resolution: 'defeat',
  cause: 'playerDown',
  peakDelta: 0,
} as const

function legacyParty(key: string): Party | undefined {
  if (key === 'legacy-defeat') {
    return respawn(
      {
        ...atRisk,
        status: 'idle',
        combat: null,
        lastCombatResult: defeat,
      },
      9,
      29,
      combat.id,
    )
  }
  if (key === 'legacy-reflection') {
    return withPlayer(
      {
        ...atRisk,
        status: 'idle',
        combat: null,
        lastCombatResult: victory,
        pendingRewards: [pendingReward(false)],
      },
      {
        ...fullInventory,
        health: 0,
        down: true,
        availableActions: ['resolveReward'],
      },
    )
  }
}

function pendingReward(
  event: boolean,
): NonNullable<Party['pendingRewards']>[number] {
  return {
    id: event ? 'reward-2' : 'reward-1',
    memberId: member.id,
    cardId: rewardCard,
    origin: { type: 'fixed' },
    source: event
      ? { type: 'randomEvent', encounterId: 'e2' }
      : { type: 'combatEvent', combatId: combat.id },
    destination: 'inventory',
    discardOptions: [
      { cardId: 'fixture.healing-potion', space: 'inventory', maxCopies: 1 },
    ],
    decisionDeadlineAt: null,
  }
}

function respawn(
  party: Party,
  peak: number,
  gold: number,
  combatId: string | null,
) {
  return withPlayer(
    {
      ...party,
      turn: { ...party.turn, round: 8, actionPoints: 3 },
      pendingRewards: [],
    },
    {
      zoneId: town,
      market: null,
      blacksmith: null,
      moveTargets: [harbor, woods],
      availableActions: urbanActions,
      health: 2,
      maxHealth: 21,
      down: false,
      peak,
      vigor: 4,
      gold,
      statuses: [],
      usableAbilities: [],
      skipNextTurn: false,
      lastKnockout: {
        id: 'knockout-1',
        combatId,
        respawnZoneId: town,
        healthRestored: 2,
        peakLost: 1,
        vigorLost: 5,
        purseGoldLost: 3,
        roundAtKnockout: 6,
        roundAfterRespawn: 8,
      },
    },
  )
}

export function knockoutAction(party: Party, body: unknown) {
  const action =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const player = party.members[0]!.player
  const deny = (reason: string) =>
    HttpResponse.json(
      {
        error: { ...actionNotAllowedFixture.error, details: { reason } },
      },
      { status: 409 },
    )
  const save = (
    next: Party,
    combatUpdates: PartyActionResponse['combatUpdates'] = [],
  ) => {
    const savedAt = new Date(Date.parse(party.savedAt) + 1000).toISOString()
    const snapshot = { ...next, savedAt }
    parties.set(party.id, snapshot)
    return HttpResponse.json({ ...snapshot, combatUpdates })
  }
  if (action.type === 'saveRespawnPoint') {
    const fields = Object.keys(action)
      .filter((key) => key !== 'type')
      .map((field) => ({ field, reason: 'unknownKey' }))
    if (fields.length)
      return HttpResponse.json(
        {
          error: {
            ...actionInvalidUnknownActionFixture.error,
            details: { fields },
          },
        },
        { status: 400 },
      )
  }
  if (party.status === 'idle')
    return HttpResponse.json(partySessionNotActiveFixture, { status: 409 })
  if (action.type === 'saveRespawnPoint') {
    if (party.combat) return deny('combatInProgress')
    if (party.randomEventEncounter || party.pendingRewards?.length)
      return deny('choicePending')
    if (player.down) return deny('playerDown')
    if (!party.turn.actionPoints) return deny('noActionPoints')
    if (player.zoneId === woods) return deny('zoneActionUnavailable')
    const actionPoints = party.turn.actionPoints - 1
    return save(
      withPlayer(
        { ...party, turn: { ...party.turn, actionPoints } },
        {
          respawnZoneId: player.zoneId,
          availableActions: actionPoints ? urbanActions : ['endTurn'],
        },
      ),
    )
  }
  if (
    action.type === 'move' &&
    action.zoneId === town &&
    player.zoneId === harbor
  ) {
    return save(
      withPlayer(
        { ...party, turn: { ...party.turn, actionPoints: 2 } },
        {
          zoneId: town,
          market: null,
          blacksmith: null,
        },
      ),
    )
  }
  if (
    action.type === 'payEventRequirement' &&
    party.randomEventEncounter?.id === 'e1' &&
    action.encounterId === 'e1' &&
    action.requirementId === 'life'
  ) {
    const resolved = withPlayer(
      { ...party, randomEventEncounter: null },
      {
        hand: ['fixture.strength-basic'],
        handCopies: [{ copyId: 'h2', cardId: 'fixture.strength-basic' }],
        attributeDiscardPileCount: 1,
        attributeDeckCount: 0,
        lastRandomEvent: {
          ...setback,
          payments: [
            ...party.randomEventEncounter.payments,
            { requirementId: 'life', health: 2 },
          ],
        },
      },
    )
    return save(respawn(resolved, 8, 29, null))
  }
  if (
    action.type === 'prepare' &&
    action.operation === 'useAbility' &&
    action.equipmentSlot === 'weapon' &&
    action.abilityId === 'donate-life' &&
    party.id === prefix + 'donation' &&
    !player.lastKnockout
  ) {
    return save(
      withPlayer(respawn(party, 9, 34, null), {
        usableAbilities: [readyAbility],
        availableActions: [
          'move',
          'recover',
          'adjustDeck',
          'useVault',
          'prepare',
          'saveRespawnPoint',
          'endTurn',
        ],
      }),
    )
  }

  const eventSetback =
    action.type === 'giveUpEvent' &&
    action.encounterId === 'e2' &&
    party.randomEventEncounter?.phase === 'encounter'
  const reflection =
    action.type === 'combatAttack' &&
    party.combat &&
    action.combatId === combat.id &&
    action.turnId === combat.turn.id &&
    action.targetId === 'wolf-1'
  const lostCombat =
    action.type === 'endCombatTurn' &&
    party.combat &&
    action.combatId === combat.id &&
    action.turnId === combat.turn.id
  if (eventSetback || reflection || lostCombat) {
    const result = lostCombat ? defeat : victory
    const resolved = {
      ...party,
      combat: null,
      lastCombatResult: eventSetback ? null : result,
    }
    const combatUpdates: PartyActionResponse['combatUpdates'] = eventSetback
      ? []
      : [
          {
            type: 'combatDamageResolved',
            combatId: combat.id,
            source: 'attack',
            actorId: lostCombat ? 'wolf-1' : member.id,
            targetId: lostCombat ? member.id : 'wolf-1',
            hit: true,
            damage: 2,
            reflectedDamage: lostCombat ? 0 : 2,
            targetHealth: 0,
            actorHealth: lostCombat ? 10 : 0,
          },
          { type: 'combatEnded', combatId: combat.id, result },
        ]
    if (lostCombat)
      return save(respawn(resolved, 9, 29, combat.id), combatUpdates)
    if (party.id === prefix + 'reflection-auto') {
      return save(
        respawn(
          withPlayer(resolved, {
            inventory: [{ cardId: rewardCard, quantity: 1 }],
          }),
          9,
          34,
          combat.id,
        ),
        combatUpdates,
      )
    }
    return save(
      withPlayer(
        {
          ...resolved,
          randomEventEncounter: eventSetback
            ? { ...encounter('e2'), phase: 'setback', requirements: [] }
            : null,
          pendingRewards: [pendingReward(eventSetback)],
        },
        { health: 0, down: true, availableActions: ['resolveReward'] },
      ),
      combatUpdates,
    )
  }
  const reward = party.pendingRewards?.[0]
  if (
    action.type === 'resolveReward' &&
    reward &&
    action.rewardId === reward.id &&
    action.choice === 'leave'
  ) {
    const event = party.randomEventEncounter
    const resolved = event
      ? withPlayer(
          { ...party, randomEventEncounter: null },
          {
            lastRandomEvent: {
              ...setback,
              encounterId: event.id,
              payments: [],
              replacement: { requested: 0, drawn: 0 },
            },
          },
        )
      : party
    return save(
      respawn(
        resolved,
        event ? 8 : 9,
        34,
        party.lastCombatResult?.combatId ?? null,
      ),
    )
  }
  return deny('zoneActionUnavailable')
}
