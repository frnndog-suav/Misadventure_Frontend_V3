import type { Party, PartyActionResponse } from '../api/parties'
import type { CombatEventCard } from '../api/catalog'
import { howlingWolvesFixture } from './catalogFixtures'
import { partyAnticipationFixture } from './randomEventFixtures'
import { standardEquipmentState } from './partyFixtures'

const member = partyAnticipationFixture.members[0]!
const player = member.player
const combatId = 'combat-wolves'
const enemyId = 'wolf-1'

export const executableCombatCardFixture: CombatEventCard = {
  ...howlingWolvesFixture,
  id: 'fixture.executable-wolves',
  title: 'Lobo Cinzento',
  escapeThreshold: 0,
  enemies: howlingWolvesFixture.enemies.map((enemy) => ({
    ...enemy,
    count: 1,
    health: 8,
    modifiers: { ...enemy.modifiers, reflection: 100 },
    abilities: [
      {
        id: 'bite',
        name: 'Mordida',
        text: 'Morde o oponente.',
        form: 'targeted',
        element: null,
        cost: [],
        power: 2,
        effects: [],
        cooldown: 1,
        timing: 'combat',
        classRestriction: [],
        usesPerTurn: 1,
        target: 'opponent',
        duration: null,
        channel: null,
      },
    ],
  })),
  goodOutcome: { text: howlingWolvesFixture.goodOutcome.text, steps: [] },
  badOutcome: { text: howlingWolvesFixture.badOutcome.text, steps: [] },
}

const combat: NonNullable<Party['combat']> = {
  id: combatId,
  card: executableCombatCardFixture,
  memberId: member.id,
  cycle: 1,
  maxCycles: 20,
  turn: {
    id: 'wolf-turn',
    actorId: enemyId,
    phase: 'attack',
    attacksRemaining: 0,
  },
  order: [enemyId, member.id],
  enemies: [
    {
      id: enemyId,
      blockIndex: 0,
      copyIndex: 0,
      health: 8,
      maxHealth: 8,
      vigor: null,
      element: null,
      effectiveModifiers: executableCombatCardFixture.enemies[0]!.modifiers,
      statuses: [],
    },
  ],
  attackTargetIds: [],
  abilities: [],
  effects: [],
  abilityStates: [],
  escape: {
    vigorCost: 2,
    threshold: 0,
    automatic: false,
    unavailableReason: null,
  },
}

type Choice = NonNullable<Party['triggeredEffectChoice']>
const optional: Choice['effects'][number] = {
  effectId: 'passive-gold',
  origin: {
    type: 'equipmentAbility',
    equipmentSlot: 'weapon',
    cardId: 'fixture.short-sword',
    abilityId: 'passive',
    effectIndex: 0,
  },
  text: 'Pague 1 ouro para recuperar 1 de Vida.',
  mode: 'optional',
  canPay: true,
  paymentCosts: [{ type: 'automatic', costIndex: 0, text: 'Pagar 1 ouro' }],
}
const automatic: Choice['effects'][number] = {
  effectId: 'automatic-gold',
  origin: { type: 'inventory', cardId: 'fixture.lucky-coin', effectIndex: 0 },
  text: 'Perca 1 ouro.',
  mode: 'automatic',
  paymentCosts: [],
}
const manual: Choice['effects'][number] = {
  ...optional,
  effectId: 'passive-discard',
  text: 'Descarte uma carta da mão.',
  paymentCosts: [
    {
      type: 'handCards',
      costIndex: 0,
      text: 'Escolha uma carta',
      count: 1,
      eligibleCopyIds: ['h1'],
    },
  ],
}

function snapshot(
  id: string,
  activeCombat: Party['combat'],
  effects: Choice['effects'],
  choiceId = 'choice-1',
): Party {
  return {
    ...partyAnticipationFixture,
    id,
    randomEventEncounter: activeCombat
      ? null
      : partyAnticipationFixture.randomEventEncounter,
    combat: activeCombat,
    lastCombatResult: null,
    triggeredEffectChoice: effects.length
      ? {
          choiceId,
          memberId: member.id,
          decisionDeadlineAt: null,
          effects,
        }
      : null,
    members: [
      {
        ...member,
        player: {
          ...player,
          gold: 1,
          health: player.maxHealth - 2,
          down: false,
          usableAbilities: [],
          availableActions: effects.length
            ? ['resolveTriggeredEffect']
            : ['revealEvent'],
        },
      },
    ],
  }
}

const anticipation = snapshot('party-trigger-anticipation', null, [optional])
const reveal = snapshot('party-combat-reveal', null, [])
const paused = snapshot('party-trigger-enemy', combat, [optional])
const simultaneous = snapshot('party-trigger-simultaneous', combat, [
  automatic,
  optional,
])
const remaining = { ...optional, canPay: false }
const invalidPayment = snapshot(
  'party-trigger-invalid',
  null,
  [manual],
  'choice-2',
)

function resume(party: Party, paid: boolean): PartyActionResponse {
  const current = party.members[0]!
  const activeCombat = party.combat
  const turnId = 'player-turn'
  return {
    ...party,
    triggeredEffectChoice: null,
    combat: activeCombat
      ? {
          ...activeCombat,
          turn: {
            id: turnId,
            actorId: member.id,
            phase: 'prepare',
            attacksRemaining: 1,
          },
          attackTargetIds: [enemyId],
        }
      : null,
    members: [
      {
        ...current,
        player: {
          ...current.player,
          gold: paid ? 0 : current.player.gold,
          health: current.player.health + Number(paid),
          availableActions: activeCombat
            ? ['combatAttack', 'endCombatTurn']
            : ['revealEvent'],
        },
      },
    ],
    combatUpdates: activeCombat
      ? [
          {
            type: 'combatDamageResolved',
            combatId,
            actorId: enemyId,
            targetId: member.id,
            source: 'attack',
            hit: true,
            damage: 0,
            reflectedDamage: 0,
            targetHealth: current.player.health + Number(paid),
            actorHealth: 8,
          },
          {
            type: 'combatTurnStarted',
            combatId,
            actorId: member.id,
            turnId,
            cycle: 1,
          },
        ]
      : [],
  }
}

const pausedAfterReveal: PartyActionResponse = {
  ...paused,
  id: reveal.id,
  combatUpdates: [
    {
      type: 'combatStarted',
      combatId,
      cardId: executableCombatCardFixture.id,
      cardTitle: executableCombatCardFixture.title,
      participants: [
        { type: 'player', id: member.id, name: member.characterName },
        {
          type: 'enemy',
          id: enemyId,
          name: 'Lobo Cinzento',
          blockIndex: 0,
          copyIndex: 0,
        },
      ],
    },
    {
      type: 'combatTurnStarted',
      combatId,
      actorId: enemyId,
      turnId: combat.turn.id,
      cycle: 1,
    },
  ],
}

type Scenario = {
  party: Party
  actions: Readonly<Record<string, PartyActionResponse>>
}

const automaticFirst: PartyActionResponse = {
  ...snapshot(simultaneous.id, combat, [remaining], 'choice-2'),
  members: [
    {
      ...simultaneous.members[0]!,
      player: {
        ...simultaneous.members[0]!.player,
        gold: 0,
      },
    },
  ],
  combatUpdates: [
    {
      type: 'combatEffectActivated',
      combatId,
      actorId: member.id,
      effectId: automatic.effectId,
    },
  ],
}
const optionalDeclinedFirst = resume(
  { ...simultaneous, members: automaticFirst.members },
  false,
)
const optionalPaidFirst = resume(simultaneous, true)
const passiveActivated = {
  type: 'combatEffectActivated',
  combatId,
  actorId: member.id,
  effectId: optional.effectId,
} as const
const unavailablePayment = snapshot(
  'party-trigger-unpayable',
  combat,
  [remaining],
  'choice-2',
)

const resumedCombat = resume(pausedAfterReveal, false)
const victory: NonNullable<Party['lastCombatResult']> = {
  combatId,
  cardId: executableCombatCardFixture.id,
  memberId: member.id,
  resolution: 'victory',
  cause: 'enemiesDefeated',
  playerDown: true,
  peakDelta: 1,
}
const fatalReflection: PartyActionResponse = {
  ...resumedCombat,
  combat: null,
  lastCombatResult: victory,
  pendingRewards: [
    {
      id: 'combat-reward',
      memberId: member.id,
      cardId: 'fixture.short-sword',
      origin: { type: 'fixed' },
      source: { type: 'combatEvent', combatId },
      destination: 'inventory',
      discardOptions: [],
      decisionDeadlineAt: null,
    },
  ],
  members: [
    {
      ...member,
      player: {
        ...player,
        health: 0,
        down: true,
        usableAbilities: [],
        availableActions: ['resolveReward'],
      },
    },
  ],
  combatUpdates: [
    {
      type: 'combatDamageResolved',
      combatId,
      actorId: member.id,
      targetId: enemyId,
      source: 'attack',
      hit: true,
      damage: 8,
      reflectedDamage: player.maxHealth - 2,
      targetHealth: 0,
      actorHealth: 0,
    },
    { type: 'combatEnded', combatId, result: victory },
  ],
}
const rewardLeft: PartyActionResponse = {
  ...fatalReflection,
  pendingRewards: [],
  members: [
    {
      ...fatalReflection.members[0]!,
      player: {
        ...fatalReflection.members[0]!.player,
        availableActions: [],
      },
    },
  ],
  combatUpdates: [],
}
const afterDecline = resume(invalidPayment, false)
const manualPaid: PartyActionResponse = {
  ...afterDecline,
  members: [
    {
      ...afterDecline.members[0]!,
      player: {
        ...afterDecline.members[0]!.player,
        hand: afterDecline.members[0]!.player.hand.slice(1),
        handCopies: afterDecline.members[0]!.player.handCopies.filter(
          ({ copyId }) => copyId !== 'h1',
        ),
      },
    },
  ],
}

const ore = 'fixture.iron-ore'
const weapon = 'fixture.short-sword'
const combatAbility = {
  equipmentSlot: 'weapon',
  abilityId: 'strike',
  targetIds: [enemyId],
  vigorCost: 1,
  paymentCosts: [{ type: 'automatic', costIndex: 0, text: 'Pague 1 Vigor' }],
} satisfies NonNullable<Party['combat']>['abilities'][number]
const combatEffect = {
  effectId: 'focus',
  origin: {
    type: 'equipment',
    equipmentSlot: 'weapon',
    cardId: weapon,
    effectIndex: 0,
  },
  text: 'Concentrar',
  targetIds: [],
  vigorCost: 0,
  paymentCosts: [],
} satisfies NonNullable<Party['combat']>['effects'][number]
const soloCombat = {
  ...resumedCombat.combat!,
  abilities: [combatAbility],
  effects: [combatEffect],
}
export const knockoutCombatFixture = soloCombat

const soloActions = [
  'activateCombatEffect',
  'useAbility',
  'escapeCombat',
  'combatAttack',
  'endCombatTurn',
] as const
const soloSnapshot: Party = {
  ...reveal,
  randomEventEncounter: null,
  combat: soloCombat,
  members: [
    {
      ...member,
      player: {
        ...resumedCombat.members[0]!.player,
        equipment: { ...player.equipment, weapon },
        equipmentStates: {
          ...player.equipmentStates,
          weapon: standardEquipmentState,
        },
        availableActions: [...soloActions],
      },
    },
  ],
}
const soloActive: PartyActionResponse = {
  ...soloSnapshot,
  combatUpdates: [
    pausedAfterReveal.combatUpdates![0]!,
    {
      type: 'combatTurnStarted',
      combatId,
      actorId: member.id,
      turnId: soloCombat.turn.id,
      cycle: 1,
    },
  ],
}
function soloAfterOption(
  type: 'useAbility' | 'activateCombatEffect',
): PartyActionResponse {
  const player = soloActive.members[0]!.player
  return {
    ...soloActive,
    combat: {
      ...soloCombat,
      abilities: [],
      effects: [],
    },
    members: [
      {
        ...member,
        player: {
          ...player,
          vigor:
            player.vigor -
            (type === 'useAbility' ? combatAbility.vigorCost : 0),
          availableActions: ['escapeCombat', 'combatAttack', 'endCombatTurn'],
        },
      },
    ],
    combatUpdates: [
      type === 'useAbility'
        ? {
            type: 'combatAbilityUsed',
            combatId,
            actorId: member.id,
            abilityId: combatAbility.abilityId,
            equipmentSlot: 'weapon',
            mountAbility: false,
          }
        : {
            type: 'combatEffectActivated',
            combatId,
            actorId: member.id,
            effectId: combatEffect.effectId,
          },
    ],
  }
}

function soloEnd(resolution: 'escaped' | 'defeat'): PartyActionResponse {
  const escaped = resolution === 'escaped'
  const result = {
    ...victory,
    resolution,
    cause: escaped ? 'escapeSucceeded' : 'playerDown',
    playerDown: !escaped,
    peakDelta: escaped ? -2 : 0,
  } satisfies NonNullable<Party['lastCombatResult']>
  return {
    ...soloActive,
    combat: null,
    lastCombatResult: result,
    members: [
      {
        ...member,
        player: {
          ...soloActive.members[0]!.player,
          down: !escaped,
          health: escaped ? soloActive.members[0]!.player.health : 0,
          vigor:
            soloActive.members[0]!.player.vigor -
            (escaped ? soloCombat.escape.vigorCost : 0),
          availableActions: escaped ? ['endTurn'] : [],
        },
      },
    ],
    combatUpdates: [
      escaped
        ? {
            type: 'combatEscapeAttempted',
            combatId,
            actorId: member.id,
            naturalRoll: 1,
            total: 1,
            threshold: 0,
            vigorSpent: soloCombat.escape.vigorCost,
            succeeded: true,
          }
        : {
            type: 'combatDamageResolved',
            combatId,
            actorId: enemyId,
            targetId: member.id,
            source: 'attack',
            hit: true,
            damage: soloActive.members[0]!.player.health,
            reflectedDamage: 0,
            targetHealth: 0,
            actorHealth: 8,
          },
      { type: 'combatEnded', combatId, result },
    ],
  }
}

const preparePlayer: Party['members'][number]['player'] = {
  ...player,
  equipment: { ...player.equipment, weapon },
  equipmentStates: {
    ...player.equipmentStates,
    weapon: standardEquipmentState,
  },
  inventory: [{ cardId: ore, quantity: 2 }],
  availableActions: ['prepare', 'endTurn'],
  usableAbilities: [
    {
      equipmentSlot: 'weapon',
      abilityId: 'focus',
      targetIds: [],
      vigorCost: 0,
      paymentCosts: [
        { type: 'automatic', costIndex: 0, text: 'Custo autom?tico' },
        {
          type: 'handCards',
          costIndex: 1,
          text: 'Descarte uma carta',
          count: 1,
          eligibleCopyIds: ['h1'],
        },
        {
          type: 'equipmentSlots',
          costIndex: 2,
          text: 'Entregue o equipamento',
          count: 1,
          eligibleSlots: ['weapon'],
        },
        {
          type: 'resources',
          costIndex: 3,
          text: 'Primeiro min?rio',
          count: 1,
          eligibleResources: [{ cardId: ore, maxCopies: 2 }],
        },
        {
          type: 'resources',
          costIndex: 4,
          text: 'Segundo min?rio',
          count: 1,
          eligibleResources: [{ cardId: ore, maxCopies: 2 }],
        },
      ],
    },
  ],
}
const prepareParty: Party = {
  ...snapshot('party-combat-prepare', null, []),
  randomEventEncounter: null,
  members: [{ ...member, player: preparePlayer }],
}
const prepared: PartyActionResponse = {
  ...prepareParty,
  members: [
    {
      ...member,
      player: {
        ...preparePlayer,
        equipment: { ...preparePlayer.equipment, weapon: null },
        equipmentStates: { ...preparePlayer.equipmentStates, weapon: null },
        inventory: [],
        hand: preparePlayer.hand.slice(1),
        handCopies: preparePlayer.handCopies.filter(
          ({ copyId }) => copyId !== 'h1',
        ),
        availableActions: ['endTurn'],
        usableAbilities: [],
      },
    },
  ],
  combatUpdates: [],
}

const soloResponses = {
  'combatAttack:wolf-1': fatalReflection,
  'resolveReward:combat-reward:leave': rewardLeft,
  escapeCombat: soloEnd('escaped'),
  endCombatTurn: soloEnd('defeat'),
  useAbility: soloAfterOption('useAbility'),
  activateCombatEffect: soloAfterOption('activateCombatEffect'),
}

const scenarios: ReadonlyMap<unknown, Scenario> = new Map<unknown, Scenario>([
  [
    'party-combat-solo',
    {
      party: { ...reveal, id: 'party-combat-solo' },
      actions: { ...soloResponses, 'revealEvent:e1': soloActive },
    },
  ],
  [
    'party-combat-immediate',
    {
      party: { ...reveal, id: 'party-combat-immediate' },
      actions: {
        'revealEvent:e1': {
          ...fatalReflection,
          combatUpdates: [
            ...soloActive.combatUpdates!,
            ...fatalReflection.combatUpdates!,
          ],
        },
      },
    },
  ],
  [
    'party-combat-active',
    {
      party: { ...soloSnapshot, id: 'party-combat-active' },
      actions: soloResponses,
    },
  ],
  [
    prepareParty.id,
    { party: prepareParty, actions: { 'prepare:useAbility': prepared } },
  ],
  [
    reveal.id,
    {
      party: reveal,
      actions: {
        'revealEvent:e1': pausedAfterReveal,
        'passive-gold:decline': resumedCombat,
        'combatAttack:wolf-1': fatalReflection,
        'resolveReward:combat-reward:leave': rewardLeft,
        'passive-gold:pay': resume(pausedAfterReveal, true),
      },
    },
  ],
  [
    'party-trigger-anticipation-decline',
    {
      party: { ...anticipation, id: 'party-trigger-anticipation-decline' },
      actions: {
        'passive-gold:decline': resume(anticipation, false),
      },
    },
  ],
  [
    anticipation.id,
    {
      party: anticipation,
      actions: {
        'passive-gold:decline': resume(anticipation, false),
        'passive-gold:pay': resume(anticipation, true),
      },
    },
  ],
  [
    paused.id,
    {
      party: paused,
      actions: {
        'passive-gold:decline': resume(paused, false),
        'passive-gold:pay': resume(paused, true),
      },
    },
  ],
  [
    simultaneous.id,
    {
      party: simultaneous,
      actions: {
        'automatic-gold:resolve': automaticFirst,
        'passive-gold:pay': {
          ...optionalPaidFirst,
          combatUpdates: [
            passiveActivated,
            ...automaticFirst.combatUpdates!,
            ...optionalPaidFirst.combatUpdates!,
          ],
        },
        'passive-gold:decline': {
          ...optionalDeclinedFirst,
          combatUpdates: [
            ...automaticFirst.combatUpdates!,
            ...optionalDeclinedFirst.combatUpdates!,
          ],
        },
        'passive-gold:decline:choice-2': resume(automaticFirst, false),
      },
    },
  ],
  [
    unavailablePayment.id,
    {
      party: unavailablePayment,
      actions: {
        'passive-gold:decline': resume(unavailablePayment, false),
      },
    },
  ],
  [
    invalidPayment.id,
    {
      party: invalidPayment,
      actions: {
        'passive-discard:decline': resume(invalidPayment, false),
        'passive-discard:pay': manualPaid,
      },
    },
  ],
])

const confirmed = new Map<unknown, Party>()

export function resetCombatScenarios() {
  confirmed.clear()
}

export function combatScenario(partyId: unknown) {
  const scenario = scenarios.get(partyId)
  if (scenario)
    return { ...scenario, party: confirmed.get(partyId) ?? scenario.party }
}

export function acceptCombatResponse(
  partyId: unknown,
  response: PartyActionResponse,
) {
  const { combatUpdates, ...snapshot } = response
  const party = { ...snapshot, id: String(partyId) }
  confirmed.set(partyId, party)
  return { ...party, combatUpdates: combatUpdates ?? [] }
}
