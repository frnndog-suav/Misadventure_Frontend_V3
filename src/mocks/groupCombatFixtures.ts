import { HttpResponse } from 'msw'
import { z } from 'zod'
import { combatDecisionActionSchema } from '../api/combat'
import type { Party, PartyActionResponse } from '../api/parties'
import { combatFixture } from './combatFixtures'
import { partyWithHelpersFixture } from './partyFixtures'

type Decision = NonNullable<Party['pendingCombatDecision']>
type Update = NonNullable<PartyActionResponse['combatUpdates']>[number]
type Combat = NonNullable<Party['combat']>
type Result = NonNullable<Party['lastCombatResult']>
type Member = Party['members'][number]

const attack = z.strictObject({
  type: z.literal('combatAttack'),
  combatId: z.string().min(1),
  turnId: z.string().min(1),
  targetId: z.string().min(1),
})
const reward = z.strictObject({
  type: z.literal('resolveReward'),
  rewardId: z.string().min(1),
})
const fixtureActionSchema = z.union([
  combatDecisionActionSchema,
  attack,
  reward.extend({ choice: z.literal('leave') }),
  reward.extend({ choice: z.literal('keep'), discard: z.tuple([]) }),
  z.strictObject({ type: z.literal('endTurn') }),
])

const campaign = partyWithHelpersFixture(3)
const [human, helper, decliningHelper, remoteHelper] = campaign.members
const combatId = 'fixture.group-combat'
const rewardId = 'fixture.group-combat-loot'
const automaticRewardId = 'fixture.group-combat-loot-ai'
const rewardCardId = 'fixture.short-sword'
const turnId = 'fixture.group-combat-turn'
const card = combatFixture.card
const enemy = combatFixture.enemies[0]!
const groupQuest = {
  type: 'zoneQuest',
  questId: 'fixture.group-combat-quest',
  questCardId: 'fixture.group-combat-quest-card',
  originZoneId: helper.player.zoneId,
  title: 'Patrulha em grupo',
  stage: {
    index: 0,
    text: 'Derrote o inimigo da patrulha.',
    location: { type: 'zoneType', zoneType: 'urban' },
    status: 'inProgress',
    objectives: null,
  },
} satisfies Member['player']['openQuests'][number]

function decision<T extends Decision['type']>(type: T) {
  return { type, id: combatId + '-' + type, combatId, memberId: human.id }
}

const roster: Decision = {
  ...decision('roster'),
  candidateMemberIds: [helper.id, decliningHelper.id],
}
const invite: Decision = {
  ...decision('invite'),
  initiatorMemberId: helper.id,
  cardTitle: card.title,
}
const order: Decision = {
  ...decision('order'),
  defaultMemberIds: [helper.id, human.id],
  alternativeMemberOrders: [[human.id, helper.id]],
}

const inviteOpened = {
  type: 'combatInviteOpened',
  combatId,
  initiatorMemberId: helper.id,
  inviteeMemberId: human.id,
} satisfies Update

function setup(suffix: string, pending: Decision): Party {
  const questOwner = {
    ...helper,
    player: { ...helper.player, openQuests: [groupQuest] },
  }
  const invitedCampaign = [human, suffix === 'decline' ? helper : questOwner]
  return {
    ...campaign,
    id: 'fixture.group-combat-' + suffix,
    status: 'inSession',
    revision: 1,
    combat: null,
    pendingCombatDecision: pending,
    turn: {
      ...campaign.turn,
      memberId: pending.type === 'roster' ? human.id : helper.id,
    },
    members:
      pending.type === 'roster'
        ? [
            human,
            {
              ...helper,
              player: {
                ...helper.player,
                health: Math.ceil(helper.player.maxHealth / 2),
              },
            },
            {
              ...decliningHelper,
              player: {
                ...decliningHelper.player,
                health: Math.ceil(decliningHelper.player.maxHealth / 2) - 1,
              },
            },
            {
              ...remoteHelper,
              player: { ...remoteHelper.player, zoneId: 'fixture.stone-bend' },
            },
          ]
        : invitedCampaign,
    turnOrder:
      pending.type === 'roster' ? campaign.turnOrder : [helper.id, human.id],
  }
}

function setupRotation(): Party {
  const base = setup('rotation', invite)
  const members: Member[] = [
    {
      ...human,
      player: { ...human.player, availableActions: ['combatAttack'] },
    },
    base.members[1]!,
    decliningHelper,
  ]
  const turnOrder = [helper.id, decliningHelper.id, human.id]
  return {
    ...base,
    members,
    turnOrder,
    combat: started(base, members, turnOrder).combat,
    pendingCombatDecision: { ...decision('turn'), turnId },
  }
}

const initial = [
  setup('roster', roster),
  setup('invite', invite),
  setup('decline', invite),
  setup('recovery', invite),
  setupRotation(),
]
type Receipt = { body: string; response: PartyActionResponse }
type Checkpoint = {
  key: string
  receipt: Receipt
  party: Party
  decisionId: string
}
type Scenario = {
  party: Party
  receipts: Map<string, Receipt>
  consumed: Set<string>
  interruptNext?: boolean
  checkpoint?: Checkpoint
}
const scenarios = new Map<string, Scenario>()

export function resetGroupCombatScenarios() {
  scenarios.clear()
  for (const party of initial) {
    scenarios.set(party.id, {
      party,
      receipts: new Map(),
      consumed: new Set(),
      interruptNext: party.id === 'fixture.group-combat-recovery',
    })
  }
}
resetGroupCombatScenarios()

function scenarioFor(partyId: unknown) {
  return typeof partyId === 'string' ? scenarios.get(partyId) : undefined
}

export function groupCombatParty(partyId: unknown) {
  return scenarioFor(partyId)?.party
}

function finish(scenario: Scenario, checkpoint: Checkpoint) {
  scenario.party = checkpoint.party
  scenario.receipts.set(checkpoint.key, checkpoint.receipt)
  scenario.consumed.add(checkpoint.decisionId)
  scenario.checkpoint = undefined
  return checkpoint.receipt.response
}

export function groupCombatSession(partyId: unknown) {
  const scenario = scenarioFor(partyId)
  if (!scenario) return
  const resumed = scenario.checkpoint && finish(scenario, scenario.checkpoint)
  return HttpResponse.json({
    ...scenario.party,
    domainEvents: resumed?.domainEvents ?? [],
  })
}

function rosterConfirmed(
  initiatorMemberId: string,
  participantMemberIds: string[],
  declinedMemberIds: string[],
): Update {
  return {
    type: 'combatRosterConfirmed',
    combatId,
    initiatorMemberId,
    participantMemberIds,
    declinedMemberIds,
  }
}

function started(
  party: Party,
  members: Member[],
  priority: string[],
): { combat: Combat; updates: Update[] } {
  const actorId = members.length === 1 ? members[0]!.id : human.id
  const combat: Combat = {
    ...combatFixture,
    id: combatId,
    memberId: party.turn.memberId,
    cardId: card.id,
    turn: { id: turnId, actorId, phase: 'attack', attacksRemaining: 1 },
    cycle: 1,
    order: [enemy.id, ...priority],
    attackTargetIds: [enemy.id],
    abilities: [],
    effects: [],
    abilityStates: [],
    participants:
      members.length > 1
        ? members.map(({ id, player }) => ({
            memberId: id,
            health: player.health,
            maxHealth: player.maxHealth,
            condition: 'standing',
          }))
        : undefined,
  }
  return {
    combat,
    updates: [
      {
        type: 'combatStarted',
        combatId,
        cardId: card.id,
        cardTitle: card.title,
        participants: [
          ...members.map(({ id, characterName }) => ({
            type: 'player' as const,
            id,
            name: characterName,
          })),
          {
            type: 'enemy',
            id: enemy.id,
            name: card.title,
            blockIndex: enemy.blockIndex,
            copyIndex: enemy.copyIndex,
          },
        ],
      },
      { type: 'combatTurnStarted', combatId, actorId, turnId, cycle: 1 },
    ],
  }
}

function victory(memberId: string): Result {
  return {
    finalBoss: false,
    combatId,
    cardId: card.id,
    memberId,
    resolution: 'victory',
    cause: 'enemiesDefeated',
    playerDown: false,
    peakDelta: 1,
  }
}

function error(status: number, code: string, details?: object) {
  return HttpResponse.json(
    { error: { code, message: code, details } },
    { status },
  )
}

const deny = (reason: string) => error(409, 'ACTION_NOT_ALLOWED', { reason })

export function groupCombatAction(
  partyId: unknown,
  body: unknown,
  key: string | null,
) {
  const scenario = scenarioFor(partyId)
  if (!scenario) return
  const parsed = fixtureActionSchema.safeParse(body)
  if (!key || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(key)) {
    return error(400, 'ACTION_INVALID', {
      fields: [{ field: 'Idempotency-Key', reason: 'invalidIdempotencyKey' }],
    })
  }
  if (!parsed.success) return error(400, 'ACTION_INVALID')
  const action = parsed.data
  const signature = JSON.stringify(action)
  const receipt = scenario.receipts.get(key)
  if (receipt)
    return signature === receipt.body
      ? HttpResponse.json(receipt.response)
      : error(409, 'ACTION_IDEMPOTENCY_CONFLICT')
  const { checkpoint } = scenario
  if (checkpoint) {
    if (key !== checkpoint.key) return error(409, 'ACTION_ADVANCE_PENDING')
    if (signature !== checkpoint.receipt.body)
      return error(409, 'ACTION_IDEMPOTENCY_CONFLICT')
    return HttpResponse.json(finish(scenario, checkpoint))
  }

  const { party } = scenario
  const pending = party.pendingCombatDecision
  if (action.type === 'endTurn') return deny('combatDecisionPending')
  if (
    'decisionId' in action &&
    scenario.consumed.has(action.decisionId) &&
    action.combatId === combatId
  ) {
    return deny('combatDecisionExpired')
  }
  if (
    action.type === 'confirmCombatRoster' &&
    pending?.type !== 'roster' &&
    action.combatId === combatId
  ) {
    return deny('combatRecruitmentClosed')
  }
  if (
    !pending ||
    ('combatId' in action && action.combatId !== pending.combatId) ||
    ('decisionId' in action && action.decisionId !== pending.id) ||
    (action.type === 'combatAttack' &&
      (pending.type !== 'turn' || action.turnId !== pending.turnId)) ||
    (action.type === 'resolveReward' &&
      (pending.type !== 'reward' || action.rewardId !== pending.rewardId))
  ) {
    return deny('combatDecisionExpired')
  }
  if (pending.memberId !== human.id) return deny('combatDecisionNotOwned')

  const updates: Update[] = []
  let next: Party = { ...party, pendingCombatDecision: null }
  switch (action.type) {
    case 'confirmCombatRoster': {
      if (pending.type !== 'roster') return deny('combatDecisionPending')
      const selected = action.inviteeMemberIds
      if (
        new Set(selected).size !== selected.length ||
        selected.some((id) => !pending.candidateMemberIds.includes(id))
      ) {
        return deny('combatCandidateIneligible')
      }
      const joined = selected.includes(helper.id)
      updates.push(
        rosterConfirmed(
          human.id,
          joined ? [human.id, helper.id] : [human.id],
          selected.filter((id) => id === decliningHelper.id),
        ),
      )
      next.turn = { ...party.turn, actionPoints: party.turn.actionPoints - 1 }
      if (joined) next.pendingCombatDecision = order
      else {
        const solo = started(next, [human], [human.id])
        next = {
          ...next,
          combat: solo.combat,
          pendingCombatDecision: { ...decision('turn'), turnId },
        }
        updates.push(...solo.updates)
      }
      break
    }
    case 'respondCombatInvite': {
      if (pending.type !== 'invite') return deny('combatDecisionPending')
      const { accept } = action
      const initiator = party.members.find(({ id }) => id === helper.id)!
      const allies = accept ? [initiator, human] : [initiator]
      updates.push(
        { ...inviteOpened, type: 'combatInviteAnswered', accept },
        rosterConfirmed(
          helper.id,
          allies.map(({ id }) => id),
          accept ? [] : [human.id],
        ),
      )
      if (accept) {
        const group = started(party, allies, party.turnOrder)
        next = {
          ...next,
          combat: group.combat,
          pendingCombatDecision: { ...decision('turn'), turnId },
        }
        updates.push(...group.updates)
      } else {
        const solo = started(party, [helper], [helper.id])
        const result = victory(helper.id)
        next.lastCombatResult = result
        next.members = party.members.map((member) =>
          member.id === helper.id
            ? {
                ...member,
                player: {
                  ...member.player,
                  peak: member.player.peak + result.peakDelta,
                },
              }
            : member,
        )
        updates.push(...solo.updates, { type: 'combatEnded', combatId, result })
      }
      break
    }
    case 'confirmCombatOrder': {
      if (pending.type !== 'order') return deny('combatDecisionPending')
      const priority = [
        pending.defaultMemberIds,
        ...pending.alternativeMemberOrders,
      ].find(
        (option) => JSON.stringify(option) === JSON.stringify(action.memberIds),
      )
      if (!priority) return deny('combatOrderInvalid')
      const group = started(
        party,
        party.members.filter(({ id }) => priority.includes(id)),
        priority,
      )
      next = {
        ...next,
        combat: group.combat,
        pendingCombatDecision: { ...decision('turn'), turnId },
      }
      updates.push(...group.updates)
      break
    }
    case 'combatAttack': {
      if (!party.combat?.attackTargetIds.includes(action.targetId))
        return deny('combatTargetUnavailable')
      const result = victory(party.turn.memberId)
      next.combat = null
      const knockedOut = party.turn.memberId === helper.id
      const automaticRecipient = party.combat.participants?.find(
        ({ memberId }) => memberId === decliningHelper.id,
      )?.memberId
      const quest = party.members
        .find(({ id }) => id === result.memberId)
        ?.player.openQuests.find(
          (openQuest) =>
            openQuest.type === 'zoneQuest' &&
            openQuest.questId === groupQuest.questId,
        )
      if (knockedOut)
        updates.push({
          type: 'combatParticipantKnockedOut',
          combatId,
          memberId: helper.id,
        })
      updates.push({
        type: 'combatDamageResolved',
        combatId,
        actorId: human.id,
        targetId: enemy.id,
        source: 'attack',
        hit: true,
        damage: enemy.health,
        reflectedDamage: 0,
        targetHealth: 0,
        actorHealth: human.player.health,
      })
      if (party.combat.participants) {
        result.playerDown = knockedOut
        result.peakDelta = knockedOut ? -1 : 1
        result.participants = party.combat.participants.map(({ memberId }) => {
          const down = knockedOut && memberId === helper.id
          return {
            memberId,
            condition: down ? 'knockedOut' : 'standing',
            peakDelta: down ? -1 : 1,
            vigorDelta: 0,
            goldGranted: down
              ? 0
              : automaticRecipient
                ? 2
                : memberId === human.id
                  ? 5
                  : 0,
            rewardIds: [],
            knockedOut: down,
            revived: false,
            respawned: false,
            skipsNextTurn: false,
          }
        })
        next.members = party.members.map((member) => {
          const outcome = result.participants?.find(
            ({ memberId }) => memberId === member.id,
          )
          if (!outcome) return member
          const { player } = member
          return {
            ...member,
            player: {
              ...player,
              peak: player.peak + outcome.peakDelta,
              gold: player.gold + outcome.goldGranted,
              health: outcome.knockedOut ? 0 : player.health,
              down: outcome.knockedOut,
              openQuests: player.openQuests.map((openQuest) =>
                openQuest === quest && openQuest.type === 'zoneQuest'
                  ? {
                      ...openQuest,
                      stage: { ...openQuest.stage, status: 'completed' },
                    }
                  : openQuest,
              ),
            },
          }
        })
        next.pendingCombatDecision = {
          ...decision('reward'),
          rewardId,
          rotationPosition: automaticRecipient ? 2 : knockedOut ? 1 : undefined,
        }
        next.pendingRewards = [
          {
            id: rewardId,
            memberId: human.id,
            cardId: rewardCardId,
            origin: { type: 'fixed' },
            source:
              quest?.type === 'zoneQuest'
                ? {
                    type: 'quest',
                    questId: quest.questId,
                    questCardId: quest.questCardId,
                  }
                : { type: 'combatEvent', combatId },
            destination: 'inventory',
            discardOptions: [],
            decisionDeadlineAt: null,
          },
        ]
      }
      next.lastCombatResult = result
      updates.push({ type: 'combatEnded', combatId, result })
      if (automaticRecipient && result.participants) {
        next.lastCombatResult = {
          ...result,
          participants: result.participants.map((participant) =>
            participant.memberId === automaticRecipient
              ? { ...participant, rewardIds: [automaticRewardId] }
              : participant,
          ),
        }
        next.members = next.members.map((member) =>
          member.id === automaticRecipient
            ? {
                ...member,
                player: {
                  ...member.player,
                  inventory: [
                    ...member.player.inventory,
                    { cardId: rewardCardId, quantity: 1 },
                  ],
                },
              }
            : member,
        )
        updates.push({
          type: 'combatRewardDelivered',
          combatId,
          memberId: automaticRecipient,
          rewardId: automaticRewardId,
        })
      }
      break
    }
    case 'resolveReward': {
      next.pendingRewards = []
      const result = party.lastCombatResult
      const kept = action.choice === 'keep'
      if (kept)
        updates.push({
          type: 'combatRewardDelivered',
          combatId,
          memberId: human.id,
          rewardId,
        })
      if (result?.participants)
        next.lastCombatResult = {
          ...result,
          participants: result.participants.map((participant) =>
            participant.knockedOut
              ? { ...participant, respawned: true, skipsNextTurn: true }
              : kept && participant.memberId === human.id
                ? { ...participant, rewardIds: [rewardId] }
                : participant,
          ),
        }
      next.members = party.members.map((member) => {
        const { player } = member
        if (
          result?.participants?.some(
            ({ memberId, knockedOut }) => memberId === member.id && knockedOut,
          )
        ) {
          return {
            ...member,
            player: {
              ...player,
              down: false,
              health: player.maxHealth,
              zoneId: player.respawnZoneId ?? player.zoneId,
            },
          }
        }
        if (kept && member.id === human.id) {
          return {
            ...member,
            player: {
              ...player,
              inventory: [
                ...player.inventory,
                { cardId: rewardCardId, quantity: 1 },
              ],
            },
          }
        }
        return member
      })
      break
    }
  }

  const revision = party.revision! + 1
  next = {
    ...next,
    revision,
    members: next.members.map((member) =>
      member.id === human.id
        ? {
            ...member,
            player: {
              ...member.player,
              availableActions:
                next.pendingCombatDecision?.type === 'turn'
                  ? ['combatAttack']
                  : next.pendingCombatDecision?.type === 'reward'
                    ? ['resolveReward']
                    : [],
            },
          }
        : member,
    ),
  }
  const response: PartyActionResponse = {
    ...next,
    combatUpdates: updates,
    domainEvents: updates.map((update, index) => ({
      type: 'combatUpdated',
      id: party.id + '-' + revision + '-' + index,
      memberId: party.turn.memberId,
      dimensionId: party.dimension.dimensionCardId,
      round: party.turn.round,
      payload: { update, combatUpdateIndex: index },
    })),
  }
  if (scenario.interruptNext) {
    scenario.interruptNext = false
    scenario.checkpoint = {
      key,
      receipt: { body: signature, response },
      party: next,
      decisionId: pending.id,
    }
    return HttpResponse.error()
  }
  scenario.party = next
  if ('decisionId' in action) scenario.consumed.add(pending.id)
  scenario.receipts.set(key, { body: signature, response })
  return HttpResponse.json(response)
}
