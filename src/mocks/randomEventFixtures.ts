import { executableEventFixture } from './catalogFixtures'
import type { Party } from '../api/parties'
import { partyInSessionFixture } from './partyFixtures'

const member = partyInSessionFixture.members[0]!
const strength = 'fixture.strength-basic'
const copy = { copyId: 'h2', cardId: strength }
const hand = [{ copyId: 'h1', cardId: strength }, copy]
const requirement: NonNullable<
  Party['randomEventEncounter']
>['requirements'][number] = {
  requirementId: 'attrs',
  status: 'unpaid',
  remaining: { specific: { strength: 2 }, any: 0 },
  payable: true,
  handCardSelection: 'choose',
  eligibleHandCopyIds: ['h1', 'h2'],
  eligibleEquipmentSlots: [],
  eligibleResourceCardIds: [],
  amountDue: null,
}

const readyPlayer: Party['members'][number]['player'] = {
  ...member.player,
  hand: [strength, strength],
  handCopies: hand,
  availableActions: ['startEvent', 'endTurn'],
}

export const partyRandomEventReadyFixture: Party = {
  ...partyInSessionFixture,
  id: 'party-evento-aleatorio',
  members: [{ ...member, player: readyPlayer }],
  turn: { ...partyInSessionFixture.turn, actionPoints: 1 },
}

export const partyAnticipationFixture: Party = {
  ...partyRandomEventReadyFixture,
  members: [
    {
      ...member,
      player: { ...readyPlayer, availableActions: ['revealEvent'] },
    },
  ],
  turn: { ...partyRandomEventReadyFixture.turn, actionPoints: 0 },
  randomEventEncounter: {
    id: 'e1',
    memberId: member.id,
    zoneType: 'urban',
    phase: 'anticipation',
    card: null,
    payments: [],
    requirements: [],
    escape: null,
    decisionDeadlineAt: null,
  },
}

export const partyEncounterFixture: Party = {
  ...partyAnticipationFixture,
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        availableActions: ['giveUpEvent', 'payEventRequirement', 'escapeEvent'],
      },
    },
  ],
  randomEventEncounter: {
    ...partyAnticipationFixture.randomEventEncounter!,
    phase: 'encounter',
    card: executableEventFixture,
    requirements: [
      {
        ...requirement,
        eligibleHandCopyIds: [...requirement.eligibleHandCopyIds],
      },
    ],
    escape: {
      vigorCost: 2,
      threshold: 10,
      automatic: false,
      unavailableReason: null,
    },
  },
}

export const partyPartialEventFixture: Party = {
  ...partyEncounterFixture,
  id: 'party-evento-parcial',
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        hand: [strength],
        handCopies: [hand[0]!],
        availableActions: ['giveUpEvent', 'payEventRequirement'],
      },
    },
  ],
  randomEventEncounter: {
    ...partyEncounterFixture.randomEventEncounter!,
    payments: [{ requirementId: 'attrs', handCards: [copy] }],
    requirements: [
      {
        ...requirement,
        status: 'partial',
        remaining: { specific: { strength: 1 }, any: 0 },
        eligibleHandCopyIds: ['h1'],
      },
    ],
  },
}

export const eventMinimumNotMetFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: {
      reason: 'eventMinimumNotMet',
      checks: [
        { requirementId: 'min-vigor', stat: 'vigor', minimum: 5, actual: 4 },
      ],
    },
  },
}

const partialEncounter = partyPartialEventFixture.randomEventEncounter!
const paidPlayer = partyPartialEventFixture.members[0]!.player
const potion = 'fixture.healing-potion'
export const partyEventConsumableFixture: Party = {
  ...partyEncounterFixture,
  id: 'party-evento-consumivel',
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        health: 10,
        inventory: [{ cardId: potion, quantity: 2 }],
        availableActions: [
          'giveUpEvent',
          'payEventRequirement',
          'escapeEvent',
          'prepare',
        ],
        activatableEffects: [
          {
            source: 'inventory',
            cardId: potion,
            effectIndex: 0,
            handPayment: null,
          },
        ],
      },
    },
  ],
}

const consumablePlayer = partyEventConsumableFixture.members[0]!.player
export const partyEventConsumableUsedFixture: Party = {
  ...partyEventConsumableFixture,
  members: [
    {
      ...member,
      player: {
        ...consumablePlayer,
        health: 15,
        inventory: [{ cardId: potion, quantity: 1 }],
      },
    },
  ],
}

export const partyEventRandomDiscardFixture: Party = {
  ...partyEncounterFixture,
  id: 'party-evento-descarte-aleatorio',
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        hand: [strength, strength, strength],
        handCopies: [...hand, { copyId: 'h3', cardId: strength }],
        vigor: 4,
        availableActions: ['giveUpEvent', 'payEventRequirement', 'escapeEvent'],
      },
    },
  ],
  randomEventEncounter: {
    ...partyEncounterFixture.randomEventEncounter!,
    card: {
      ...partialEncounter.card!,
      requirements: [
        {
          id: 'discard',
          text: 'Descarte duas cartas aleatórias.',
          kind: 'discardFromHand',
          requirements: [{ attribute: 'any', count: 2 }],
          excludeAttributes: [],
          constraint: 'none',
          random: true,
        },
        {
          id: 'min-vigor',
          text: 'Mantenha 5 de Vigor.',
          kind: 'minimum',
          stat: 'vigor',
          value: 5,
        },
      ],
    },
    requirements: [
      {
        ...requirement,
        requirementId: 'discard',
        remaining: { copies: 2 },
        handCardSelection: 'random',
        eligibleHandCopyIds: [],
      },
      {
        ...requirement,
        requirementId: 'min-vigor',
        status: 'check',
        payable: false,
        handCardSelection: null,
        eligibleHandCopyIds: [],
        remaining: undefined,
      },
    ],
  },
}

const randomEncounter = partyEventRandomDiscardFixture.randomEventEncounter!
const randomPlayer = partyEventRandomDiscardFixture.members[0]!.player
export const partyEventRandomDiscardPartialFixture: Party = {
  ...partyEventRandomDiscardFixture,
  id: 'party-evento-descarte-parcial',
  members: [
    {
      ...member,
      player: {
        ...randomPlayer,
        hand: [strength, strength],
        handCopies: [hand[0]!, randomPlayer.handCopies[2]!],
        availableActions: ['giveUpEvent', 'payEventRequirement'],
      },
    },
  ],
  randomEventEncounter: {
    ...randomEncounter,
    payments: [{ requirementId: 'discard', handCards: [copy] }],
    requirements: [
      {
        ...randomEncounter.requirements[0]!,
        status: 'partial',
        remaining: { copies: 1 },
      },
      randomEncounter.requirements[1]!,
    ],
  },
}

const synergy = { copyId: 'h1', cardId: 'fixture.strength-dexterity' }
const paidAttributes = { requirementId: 'attrs', handCards: [synergy] }
const paidGold = { requirementId: 'gold', gold: 10 }
const goldRequirement: typeof requirement = {
  ...requirement,
  requirementId: 'gold',
  amountDue: 10,
  handCardSelection: null,
  eligibleHandCopyIds: [],
  remaining: undefined,
}

export const partyEventMinimumFixture: Party = {
  ...partyPartialEventFixture,
  id: 'party-evento-minimo',
  members: [
    {
      ...member,
      player: { ...paidPlayer, hand: [], handCopies: [], vigor: 7, gold: 10 },
    },
  ],
  randomEventEncounter: {
    ...partialEncounter,
    card: {
      ...partialEncounter.card!,
      requirements: [
        {
          id: 'attrs',
          text: 'Entregue For?a e Destreza.',
          kind: 'attributes',
          specific: { strength: 1, dexterity: 1 },
          any: 0,
        },
        { id: 'gold', text: 'Pague 10 moedas.', kind: 'payGold', amount: 10 },
        {
          id: 'vigor',
          text: 'Gaste 3 de Vigor.',
          kind: 'spendVigor',
          amount: 3,
        },
        {
          id: 'min-vigor',
          text: 'Mantenha 5 de Vigor.',
          kind: 'minimum',
          stat: 'vigor',
          value: 5,
        },
      ],
    },
    payments: [paidAttributes, paidGold],
    requirements: [
      {
        ...requirement,
        status: 'paid',
        payable: false,
        eligibleHandCopyIds: [],
      },
      { ...goldRequirement, status: 'paid', payable: false, amountDue: null },
      {
        ...requirement,
        requirementId: 'vigor',
        handCardSelection: null,
        eligibleHandCopyIds: [],
        amountDue: 3,
        remaining: undefined,
      },
      {
        ...requirement,
        requirementId: 'min-vigor',
        status: 'check',
        payable: false,
        handCardSelection: null,
        eligibleHandCopyIds: [],
        remaining: undefined,
      },
    ],
  },
}

export const partyEventSetbackFixture: Party = {
  ...partyRandomEventReadyFixture,
  turn: partyAnticipationFixture.turn,
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        availableActions: ['endTurn'],
        peak: 9,
        lastRandomEvent: {
          encounterId: 'e1',
          cardId: 'fixture.event-cart-test',
          resolution: 'setback',
          cause: 'gaveUp',
          payments: [{ requirementId: 'attrs', handCards: [copy] }],
          peakDelta: -1,
          replacement: { requested: 1, drawn: 1 },
          escape: null,
        },
      },
    },
  ],
}

export const partyEventSuccessFixture: Party = {
  ...partyEventSetbackFixture,
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        handCopies: [
          { copyId: 'h3', cardId: strength },
          { copyId: 'h4', cardId: strength },
        ],
        peak: 11,
        availableActions: ['endTurn'],
        lastRandomEvent: {
          encounterId: 'e1',
          cardId: 'fixture.event-cart-test',
          resolution: 'success',
          cause: 'requirementsMet',
          payments: [
            { requirementId: 'attrs', handCards: [copy] },
            { requirementId: 'attrs', handCards: [hand[0]!] },
          ],
          peakDelta: 1,
          replacement: { requested: 2, drawn: 2 },
          escape: null,
        },
      },
    },
  ],
}

export const partyEventEscapeFailedFixture: Party = {
  ...partyEventSetbackFixture,
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        vigor: 4,
        peak: 9,
        nextTurnActionPointDebt: 1,
        availableActions: ['endTurn'],
        lastRandomEvent: {
          encounterId: 'e1',
          cardId: 'fixture.event-cart-test',
          resolution: 'setback',
          cause: 'escapeFailed',
          payments: [],
          peakDelta: -1,
          replacement: { requested: 0, drawn: 0 },
          escape: {
            vigorSpent: 2,
            naturalRoll: 10,
            total: 10,
            threshold: 10,
            succeeded: false,
            actionPointsLost: 0,
            nextTurnActionPointDebtAdded: 1,
          },
        },
      },
    },
  ],
}

const ore = 'fixture.iron-ore'
const fish = 'fixture.silver-fish'
const reward = {
  id: 'r1',
  memberId: member.id,
  cardId: fish,
  origin: { type: 'rewardDeck', zoneType: 'urban' },
  source: { type: 'scavenge' },
  destination: 'inventory',
  discardOptions: [{ cardId: ore, maxCopies: 1 }],
  decisionDeadlineAt: null,
} satisfies Party['pendingRewards'][number]

export const partyScavengeWithoutSpaceFixture: Party = {
  ...partyRandomEventReadyFixture,
  id: 'party-vasculhar-sem-espaco',
  members: [
    {
      ...member,
      player: {
        ...readyPlayer,
        inventoryCapacity: 1,
        inventory: [{ cardId: ore, quantity: 1 }],
        scavengeTargets: [fish],
        availableActions: ['scavenge', 'endTurn'],
      },
    },
  ],
}

const fullPlayer = partyScavengeWithoutSpaceFixture.members[0]!.player
export const partyScavengePendingFixture: Party = {
  ...partyScavengeWithoutSpaceFixture,
  turn: partyAnticipationFixture.turn,
  pendingRewards: [reward],
  members: [
    {
      ...member,
      player: {
        ...fullPlayer,
        availableActions: ['resolveReward'],
        lastScavenge: { cardId: fish, found: true, delivery: 'pending' },
      },
    },
  ],
}

export const partyScavengeLeftFixture: Party = {
  ...partyScavengePendingFixture,
  pendingRewards: [],
  members: [
    {
      ...member,
      player: {
        ...fullPlayer,
        availableActions: ['endTurn'],
        lastScavenge: { cardId: fish, found: true, delivery: 'left' },
        lastRewardDelivery: {
          rewardId: reward.id,
          cardId: fish,
          origin: reward.origin,
          disposition: 'returnedToDeck',
        },
      },
    },
  ],
}

export const partyScavengeKeptFixture: Party = {
  ...partyScavengeLeftFixture,
  members: [
    {
      ...member,
      player: {
        ...fullPlayer,
        availableActions: ['endTurn'],
        inventory: [{ cardId: fish, quantity: 1 }],
        lastScavenge: { cardId: fish, found: true, delivery: 'inventory' },
        lastRewardDelivery: {
          rewardId: reward.id,
          cardId: fish,
          origin: reward.origin,
          disposition: 'kept',
        },
      },
    },
  ],
}
type EventResult = NonNullable<
  Party['members'][number]['player']['lastRandomEvent']
>
type Player = Party['members'][number]['player']

function withPlayer(party: Party, player: Partial<Player>): Party {
  return {
    ...party,
    members: [
      { ...member, player: { ...party.members[0]!.player, ...player } },
    ],
  }
}

function resolved(
  party: Party,
  result: Partial<EventResult>,
  player: Partial<Player> = {},
): Party {
  return withPlayer(
    { ...party, randomEventEncounter: null, pendingRewards: [] },
    {
      availableActions: ['endTurn'],
      lastRandomEvent: {
        encounterId: 'e1',
        cardId: party.randomEventEncounter!.card!.id,
        resolution: 'success',
        cause: 'requirementsMet',
        payments: party.randomEventEncounter!.payments,
        peakDelta: 1,
        replacement: { requested: 0, drawn: 0 },
        escape: null,
        ...result,
      },
      ...player,
    },
  )
}

const encounter = partyEncounterFixture.randomEventEncounter!
const dodgeCheck = {
  id: 'min-evasion',
  text: 'Esquiva 80.',
  kind: 'minimum',
  stat: 'evasion',
  value: 80,
} as const
const dodgeEncounter = {
  ...encounter,
  card: { ...encounter.card!, requirements: [dodgeCheck] },
  requirements: [
    {
      ...requirement,
      requirementId: dodgeCheck.id,
      status: 'check',
      remaining: undefined,
      payable: false,
      handCardSelection: null,
      eligibleHandCopyIds: [],
    },
  ],
} satisfies NonNullable<Party['randomEventEncounter']>
const dodgeReady = withPlayer(
  { ...partyEncounterFixture, randomEventEncounter: dodgeEncounter },
  {
    availableActions: ['giveUpEvent', 'resolveEvent', 'escapeEvent'],
    effectiveModifiers: { ...readyPlayer.effectiveModifiers, evasion: 80 },
  },
)
const dodgeLow = withPlayer(dodgeReady, {
  availableActions: ['giveUpEvent', 'escapeEvent'],
  effectiveModifiers: { ...readyPlayer.effectiveModifiers, evasion: 79 },
})
const vigorReady = withPlayer(partyEventMinimumFixture, { vigor: 8 })
const vigorPayments = [
  ...vigorReady.randomEventEncounter!.payments,
  { requirementId: 'vigor', vigor: 3 },
]
const randomReady = withPlayer(partyEventRandomDiscardPartialFixture, {
  vigor: 5,
})
const randomPayments = [
  ...randomReady.randomEventEncounter!.payments,
  { requirementId: 'discard', handCards: [{ copyId: 'h3', cardId: strength }] },
]
const failedEscape =
  partyEventEscapeFailedFixture.members[0]!.player.lastRandomEvent!.escape!
const escapeReady = withPlayer(partyEncounterFixture, { vigor: 6, peak: 10 })
const forbiddenEscape = withPlayer(
  {
    ...escapeReady,
    randomEventEncounter: {
      ...encounter,
      card: { ...encounter.card!, noEscape: true },
      escape: { ...encounter.escape!, unavailableReason: 'escapeForbidden' },
    },
  },
  { availableActions: ['giveUpEvent', 'payEventRequirement'] },
)
const lowVigorEscape = withPlayer(
  {
    ...escapeReady,
    randomEventEncounter: {
      ...encounter,
      escape: { ...encounter.escape!, unavailableReason: 'notEnoughVigor' },
    },
  },
  { vigor: 1, availableActions: ['giveUpEvent', 'payEventRequirement'] },
)

const eventReward = {
  ...reward,
  cardId: ore,
  discardOptions: [{ cardId: fish, maxCopies: 1 }],
  source: { type: 'randomEvent', encounterId: 'e1' },
} satisfies Party['pendingRewards'][number]
const rewardDrawReady = {
  ...withPlayer(dodgeReady, {
    inventoryCapacity: 1,
    inventory: [{ cardId: fish, quantity: 1 }],
  }),
  randomEventEncounter: {
    ...dodgeEncounter,
    card: {
      ...dodgeEncounter.card!,
      goodOutcome: {
        text: 'Compre duas recompensas.',
        steps: [{ type: 'drawRewards', count: 2 }],
      },
    },
  },
} satisfies Party
const rewardEncounter = withPlayer(
  {
    ...partyScavengePendingFixture,
    randomEventEncounter: {
      ...rewardDrawReady.randomEventEncounter,
      phase: 'success',
    },
    pendingRewards: [eventReward],
  },
  { lastScavenge: null, inventory: [{ cardId: fish, quantity: 1 }] },
)
const fixedReward = {
  ...eventReward,
  origin: { type: 'fixed' },
} satisfies Party['pendingRewards'][number]
const reserveReward = {
  ...eventReward,
  id: 'r2',
  cardId: potion,
  discardOptions: [{ cardId: ore, maxCopies: 1 }],
  origin: { type: 'reserveDeck' },
} satisfies Party['pendingRewards'][number]
const reservePending = withPlayer(
  { ...rewardEncounter, pendingRewards: [reserveReward] },
  {
    inventory: [{ cardId: eventReward.cardId, quantity: 1 }],
    lastRewardDelivery: {
      rewardId: eventReward.id,
      cardId: eventReward.cardId,
      origin: eventReward.origin,
      disposition: 'kept',
    },
  },
)
const rewardSearchReady = {
  ...dodgeReady,
  randomEventEncounter: {
    ...dodgeEncounter,
    card: {
      ...dodgeEncounter.card!,
      goodOutcome: {
        text: 'Busque min?rio.',
        steps: [{ type: 'searchReward', cardId: ore }],
      },
    },
  },
} satisfies Party
const emptyDeck = withPlayer(partyRandomEventReadyFixture, {
  availableActions: ['endTurn'],
})
const scavengeSpent = {
  ...partyScavengeWithoutSpaceFixture,
  turn: partyAnticipationFixture.turn,
}
const minimumEncounter = partyEventMinimumFixture.randomEventEncounter!
const attributesPaid = withPlayer(
  {
    ...partyEventMinimumFixture,
    randomEventEncounter: {
      ...minimumEncounter,
      payments: [paidAttributes],
      requirements: [
        minimumEncounter.requirements[0]!,
        { ...goldRequirement, eligibleHandCopyIds: [] },
        ...minimumEncounter.requirements.slice(2),
      ],
    },
  },
  { gold: 20 },
)
const paymentReady = withPlayer(
  {
    ...attributesPaid,
    randomEventEncounter: {
      ...attributesPaid.randomEventEncounter!,
      payments: [],
      requirements: [
        {
          ...requirement,
          remaining: { specific: { strength: 1, dexterity: 1 }, any: 0 },
          eligibleHandCopyIds: ['h1'],
        },
        ...attributesPaid.randomEventEncounter!.requirements.slice(1),
      ],
    },
  },
  { hand: [synergy.cardId], handCopies: [synergy] },
)
const copyRefusal = withPlayer(
  {
    ...partyEncounterFixture,
    randomEventEncounter: {
      ...encounter,
      card: {
        ...encounter.card!,
        requirements: [
          {
            id: 'attrs',
            text: 'Entregue uma Força.',
            kind: 'attributes',
            specific: { strength: 1 },
            any: 0,
          },
          {
            id: 'min-vigor',
            text: 'Mantenha 5 de Vigor.',
            kind: 'minimum',
            stat: 'vigor',
            value: 5,
          },
        ],
      },
      requirements: [
        { ...requirement, remaining: { specific: { strength: 1 }, any: 0 } },
        { ...dodgeEncounter.requirements[0]!, requirementId: 'min-vigor' },
      ],
    },
  },
  { vigor: 4 },
)

type EventRefusal = {
  reason: string
  checks?: typeof eventMinimumNotMetFixture.error.details.checks
}
type EventResponse = Party | EventRefusal
type EventScenario = { party: Party; actions: Record<string, EventResponse> }

// Each ID represents a fixed save. POST and GET never mutate fixture state.
export const eventScenarios: Partial<Record<string, EventScenario>> = {
  'party-evento-pagamento': {
    party: paymentReady,
    actions: { 'payEventRequirement:attrs': attributesPaid },
  },
  'party-evento-atributos-pagos': {
    party: attributesPaid,
    actions: { 'payEventRequirement:gold': partyEventMinimumFixture },
  },
  'party-evento-minimo': {
    party: partyEventMinimumFixture,
    actions: {
      'payEventRequirement:vigor': eventMinimumNotMetFixture.error.details,
      giveUpEvent: resolved(
        partyEventMinimumFixture,
        {
          resolution: 'setback',
          cause: 'gaveUp',
          peakDelta: -1,
          replacement: { requested: 1, drawn: 1 },
        },
        { peak: 9, hand: [strength], handCopies: [hand[0]!] },
      ),
    },
  },
  'party-evento-fuga-com-pa': {
    party: { ...escapeReady, turn: partyRandomEventReadyFixture.turn },
    actions: {
      escapeEvent: resolved(
        escapeReady,
        {
          resolution: 'setback',
          cause: 'escapeFailed',
          peakDelta: -1,
          escape: {
            ...failedEscape,
            actionPointsLost: 1,
            nextTurnActionPointDebtAdded: 0,
          },
        },
        { vigor: 4, peak: 9, nextTurnActionPointDebt: 0 },
      ),
    },
  },
  'party-evento-fuga-sem-pa': {
    party: escapeReady,
    actions: { escapeEvent: partyEventEscapeFailedFixture },
  },
  'party-evento-divida': {
    party: partyEventEscapeFailedFixture,
    actions: {
      endTurn: withPlayer(
        {
          ...partyEventEscapeFailedFixture,
          turn: {
            ...partyEventEscapeFailedFixture.turn,
            round: 2,
            actionPoints: 2,
          },
        },
        { nextTurnActionPointDebt: 0 },
      ),
    },
  },
  'party-evento-compra': {
    party: rewardDrawReady,
    actions: { resolveEvent: rewardEncounter },
  },
  'party-evento-antecipacao': {
    party: partyAnticipationFixture,
    actions: {
      startEvent: { reason: 'choicePending' },
      endTurn: { reason: 'choicePending' },
      revealEvent: partyEncounterFixture,
    },
  },
  'party-evento-revelado': {
    party: partyEncounterFixture,
    actions: {
      startEvent: { reason: 'choicePending' },
      endTurn: { reason: 'choicePending' },
    },
  },
  'party-evento-sem-deck': {
    party: emptyDeck,
    actions: { startEvent: { reason: 'eventDeckEmpty' } },
  },
  'party-evento-sem-fuga': {
    party: forbiddenEscape,
    actions: { escapeEvent: { reason: 'escapeForbidden' } },
  },
  'party-evento-sem-vigor': {
    party: lowVigorEscape,
    actions: { escapeEvent: { reason: 'notEnoughVigor' } },
  },
  'party-evento-consumivel-apos-parte': {
    party: withPlayer(partyPartialEventFixture, {
      health: 15,
      inventory: [{ cardId: potion, quantity: 1 }],
      activatableEffects: [],
    }),
    actions: { 'prepare:activate': { reason: 'eventPaymentStarted' } },
  },
  'party-evento-parcial': {
    party: partyPartialEventFixture,
    actions: {
      escapeEvent: { reason: 'eventPaymentStarted' },
      'prepare:activate': { reason: 'eventPaymentStarted' },
    },
  },
  'party-evento-minimo-ok': {
    party: dodgeReady,
    actions: { resolveEvent: resolved(dodgeReady, {}, { peak: 11 }) },
  },
  'party-evento-esquiva-baixa': {
    party: dodgeLow,
    actions: {
      resolveEvent: {
        reason: 'eventMinimumNotMet',
        checks: [
          {
            requirementId: dodgeCheck.id,
            stat: 'evasion',
            minimum: 80,
            actual: 79,
          },
        ],
      },
    },
  },
  'party-evento-copia-recusada': {
    party: copyRefusal,
    actions: {
      'payEventRequirement:attrs': eventMinimumNotMetFixture.error.details,
      giveUpEvent: resolved(copyRefusal, {
        resolution: 'setback',
        cause: 'gaveUp',
        peakDelta: -1,
      }),
    },
  },
  'party-evento-vigor-ok': {
    party: vigorReady,
    actions: {
      'payEventRequirement:vigor': resolved(
        vigorReady,
        {
          payments: vigorPayments,
          replacement: { requested: 1, drawn: 1 },
        },
        {
          vigor: 5,
          peak: 11,
          hand: [strength],
          handCopies: [{ copyId: 'h3', cardId: strength }],
        },
      ),
    },
  },
  'party-evento-descarte-ok': {
    party: randomReady,
    actions: {
      'payEventRequirement:discard': resolved(
        randomReady,
        {
          payments: randomPayments,
          replacement: { requested: 2, drawn: 2 },
        },
        {
          peak: 11,
          hand: [strength, strength, strength],
          handCopies: [
            hand[0]!,
            { copyId: 'h4', cardId: strength },
            { copyId: 'h5', cardId: strength },
          ],
        },
      ),
    },
  },
  'party-evento-fuga-ok': {
    party: escapeReady,
    actions: {
      escapeEvent: resolved(
        escapeReady,
        {
          resolution: 'escaped',
          cause: 'escapeSucceeded',
          peakDelta: 0,
          escape: {
            ...failedEscape,
            naturalRoll: 11,
            total: 11,
            succeeded: true,
            nextTurnActionPointDebtAdded: 0,
          },
        },
        { vigor: 4, peak: 10 },
      ),
    },
  },
  'party-vasculhar-pilha': {
    party: withPlayer(partyScavengeWithoutSpaceFixture, {
      scavengeTargets: [ore],
    }),
    actions: {
      scavenge: withPlayer(scavengeSpent, {
        availableActions: ['endTurn'],
        inventory: [{ cardId: ore, quantity: 2 }],
        lastScavenge: { cardId: ore, found: true, delivery: 'inventory' },
      }),
    },
  },
  'party-vasculhar-vazio': {
    party: withPlayer(partyScavengeWithoutSpaceFixture, {
      scavengeTargets: [ore],
    }),
    actions: {
      scavenge: withPlayer(scavengeSpent, {
        availableActions: ['endTurn'],
        lastScavenge: { cardId: ore, found: false, delivery: 'none' },
      }),
    },
  },
  'party-vasculhar-pendente': {
    party: partyScavengePendingFixture,
    actions: {
      'resolveReward:leave': partyScavengeLeftFixture,
      'resolveReward:keep:empty': { reason: 'rewardDoesNotFit' },
      'resolveReward:keep': partyScavengeKeptFixture,
    },
  },
  'party-evento-busca-vazia': {
    party: rewardSearchReady,
    actions: {
      resolveEvent: resolved(
        dodgeReady,
        {},
        { lastRewardSearch: { encounterId: 'e1', cardId: ore, found: false } },
      ),
    },
  },
  'party-evento-premio-urbano': {
    party: rewardEncounter,
    actions: {
      'resolveReward:leave': resolved(
        rewardEncounter,
        {},
        {
          lastRewardDelivery: {
            rewardId: 'r1',
            cardId: eventReward.cardId,
            origin: eventReward.origin,
            disposition: 'returnedToDeck',
          },
        },
      ),
      'resolveReward:keep:empty': { reason: 'rewardDoesNotFit' },
      'resolveReward:keep': reservePending,
      'resolveReward:leave:r2': resolved(
        reservePending,
        {},
        {
          lastRewardDelivery: {
            rewardId: reserveReward.id,
            cardId: reserveReward.cardId,
            origin: reserveReward.origin,
            disposition: 'removed',
          },
        },
      ),
    },
  },
  'party-evento-premio-fixo': {
    party: { ...rewardEncounter, pendingRewards: [fixedReward] },
    actions: {
      'resolveReward:leave': resolved(
        rewardEncounter,
        {},
        {
          lastRewardDelivery: {
            rewardId: 'r1',
            cardId: fixedReward.cardId,
            origin: fixedReward.origin,
            disposition: 'sentToLimbo',
          },
        },
      ),
    },
  },
  'party-evento-premio-reserva': {
    party: reservePending,
    actions: {
      'resolveReward:leave': resolved(
        reservePending,
        {},
        {
          lastRewardDelivery: {
            rewardId: 'r2',
            cardId: reserveReward.cardId,
            origin: reserveReward.origin,
            disposition: 'removed',
          },
        },
      ),
    },
  },
}
