import type { Party, PartyActionResponse } from '../api/parties'
import type { CombatEventCard } from '../api/catalog'
import { howlingWolvesFixture } from './catalogFixtures'
import { partyAnticipationFixture } from './randomEventFixtures'

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

const scenarios: ReadonlyMap<unknown, Scenario> = new Map<unknown, Scenario>([
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
        'passive-gold:pay': resume(simultaneous, true),
        'passive-gold:decline': resume(automaticFirst, false),
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
