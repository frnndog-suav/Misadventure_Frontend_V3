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
    card: {
      type: 'randomEvent',
      id: 'fixture.event-cart-test',
      collectionId: 'fixture',
      title: 'Carroça na estrada',
      flavorText: null,
      noEscape: false,
      escapeThreshold: null,
      requirements: [
        {
          id: 'attrs',
          text: 'Entregue duas Forças.',
          kind: 'attributes',
          specific: { strength: 2 },
          any: 0,
        },
      ],
      goodOutcome: { text: 'A passagem está livre.', steps: [] },
      badOutcome: { text: 'Você precisa voltar.', steps: [] },
    },
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

export const partyEventMinimumFixture: Party = {
  ...partyPartialEventFixture,
  id: 'party-evento-minimo',
  members: [
    {
      ...member,
      player: { ...paidPlayer, hand: [], handCopies: [], vigor: 7 },
    },
  ],
  randomEventEncounter: {
    ...partialEncounter,
    card: {
      ...partialEncounter.card!,
      requirements: [
        ...partialEncounter.card!.requirements,
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
    payments: [
      ...partialEncounter.payments,
      { requirementId: 'attrs', handCards: [hand[0]!] },
    ],
    requirements: [
      {
        ...requirement,
        status: 'paid',
        payable: false,
        eligibleHandCopyIds: [],
      },
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
        vigor: 8,
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
