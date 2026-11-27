import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { resetGroupCombatScenarios } from '../mocks/groupCombatFixtures'
import { handlers } from '../mocks/handlers'
import { requestJson } from './http'
import {
  getParty,
  partyActionResponseSchema,
  partySessionResponseSchema,
} from './parties'

const server = setupServer(...handlers)
beforeEach(resetGroupCombatScenarios)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const act = async (
  id: string,
  action: object,
  key: string = crypto.randomUUID(),
) =>
  partyActionResponseSchema.parse(
    await requestJson('POST', '/parties/' + id + '/actions', action, {
      'Idempotency-Key': key,
    }),
  )

it('REQ-110 and REQ-112 confirm a roster and project the agreed order and combatants', async () => {
  const id = 'fixture.group-combat-roster'
  const initial = await getParty(id)
  const roster = initial.pendingCombatDecision!
  if (roster.type !== 'roster') throw new Error('Expected roster')
  const action = {
    type: 'confirmCombatRoster',
    combatId: roster.combatId,
    decisionId: roster.id,
  }
  await expect(
    act(id, { ...action, inviteeMemberIds: ['unknown'] }),
  ).rejects.toMatchObject({
    details: { reason: 'combatCandidateIneligible' },
  })
  const confirmed = await act(id, {
    ...action,
    inviteeMemberIds: roster.candidateMemberIds,
  })
  expect(confirmed.combatUpdates).toMatchObject([
    {
      type: 'combatRosterConfirmed',
      declinedMemberIds: [roster.candidateMemberIds[1]],
    },
  ])
  const order = confirmed.pendingCombatDecision!
  if (order.type !== 'order') throw new Error('Expected order')
  const started = await act(id, {
    type: 'confirmCombatOrder',
    combatId: order.combatId,
    decisionId: order.id,
    memberIds: order.alternativeMemberOrders[0],
  })
  expect(started.combat?.participants).toHaveLength(2)
  expect(started.combat?.order[1]).toBe(order.memberId)
  expect(started.pendingCombatDecision?.type).toBe('turn')
})

it('REQ-111, REQ-113 and REQ-114 persist pauses and replay the complete old receipt', async () => {
  const id = 'fixture.group-combat-invite'
  const initial = await getParty(id)
  const invite = initial.pendingCombatDecision!
  if (invite.type !== 'invite') throw new Error('Expected invite')
  expect(invite.memberId).not.toBe(initial.turn.memberId)
  const session = partySessionResponseSchema.parse(
    await requestJson('POST', '/parties/' + id + '/session'),
  )
  expect(session.pendingCombatDecision).toEqual(invite)
  await expect(act(id, { type: 'endTurn' })).rejects.toMatchObject({
    details: { reason: 'combatDecisionPending' },
  })
  const key = crypto.randomUUID()
  const answer = {
    type: 'respondCombatInvite',
    combatId: invite.combatId,
    decisionId: invite.id,
    accept: true,
  }
  const started = await act(id, answer, key)
  const turn = started.pendingCombatDecision!
  if (turn.type !== 'turn') throw new Error('Expected turn')
  const reopened = partySessionResponseSchema.parse(
    await requestJson('POST', '/parties/' + id + '/session'),
  )
  expect(reopened.pendingCombatDecision).toEqual(turn)
  expect(reopened.combat?.turn.actorId).toBe(invite.memberId)
  const victory = await act(id, {
    type: 'combatAttack',
    combatId: turn.combatId,
    turnId: turn.turnId,
    targetId: started.combat!.attackTargetIds[0],
  })
  expect(victory.turn).toEqual(initial.turn)
  expect(victory.lastCombatResult?.participants).toMatchObject([
    {
      memberId: initial.turn.memberId,
      condition: 'knockedOut',
      respawned: false,
    },
    { memberId: invite.memberId, condition: 'standing', goldGranted: 5 },
  ])
  expect(victory.pendingCombatDecision).toMatchObject({
    type: 'reward',
    rotationPosition: 1,
  })
  expect(victory.domainEvents).toMatchObject(
    victory.combatUpdates!.map((update, combatUpdateIndex) => ({
      memberId: initial.turn.memberId,
      payload: { update, combatUpdateIndex },
    })),
  )
  expect(await act(id, answer, key)).toEqual(started)
  expect((await getParty(id)).pendingCombatDecision).toEqual(
    victory.pendingCombatDecision,
  )
  await expect(act(id, answer)).rejects.toMatchObject({
    details: { reason: 'combatDecisionExpired' },
  })
  const settled = await act(id, {
    type: 'resolveReward',
    rewardId: victory.pendingRewards[0]!.id,
    choice: 'keep',
    discard: [],
  })
  expect(settled.pendingCombatDecision).toBeNull()
  expect(settled.lastCombatResult?.participants?.[0]?.respawned).toBe(true)
  expect(settled.lastCombatResult?.participants?.[1]?.rewardIds).toEqual([
    victory.pendingRewards[0]!.id,
  ])
})

it('REQ-110 and REQ-114 preserve solo when the human declines an AI invitation', async () => {
  const id = 'fixture.group-combat-decline'
  const initial = await getParty(id)
  const decision = initial.pendingCombatDecision!
  const solo = await act(id, {
    type: 'respondCombatInvite',
    combatId: decision.combatId,
    decisionId: decision.id,
    accept: false,
  })
  expect(solo.pendingCombatDecision).toBeNull()
  expect(solo.lastCombatResult?.memberId).toBe(initial.turn.memberId)
  expect(solo.lastCombatResult?.participants).toBeUndefined()
  const legacy = await getParty('party-combat-active')
  expect(legacy.pendingCombatDecision).toBeUndefined()
  expect(legacy.combat?.participants).toBeUndefined()
})

it('REQ-114 resumes the interrupted decision with the winning key', async () => {
  const id = 'fixture.group-combat-recovery'
  const initial = await getParty(id)
  const pending = initial.pendingCombatDecision!
  const key = crypto.randomUUID()
  const action = {
    type: 'respondCombatInvite',
    combatId: pending.combatId,
    decisionId: pending.id,
    accept: true,
  }
  await expect(act(id, action, key)).rejects.toBeInstanceOf(TypeError)
  await expect(act(id, action)).rejects.toMatchObject({
    code: 'ACTION_ADVANCE_PENDING',
  })
  await expect(
    act(id, { ...action, accept: false }, key),
  ).rejects.toMatchObject({
    code: 'ACTION_IDEMPOTENCY_CONFLICT',
  })
  expect(await getParty(id)).toEqual(initial)
  const [resumed, replay] = await Promise.all([
    act(id, action, key),
    act(id, action, key),
  ])
  expect(replay).toEqual(resumed)
  expect(resumed.pendingCombatDecision?.type).toBe('turn')
  expect(resumed.revision).toBe(initial.revision! + 1)
})

it('REQ-114 session recovery completes the same action receipt', async () => {
  const id = 'fixture.group-combat-recovery'
  const pending = (await getParty(id)).pendingCombatDecision!
  const key = crypto.randomUUID()
  const action = {
    type: 'respondCombatInvite',
    combatId: pending.combatId,
    decisionId: pending.id,
    accept: true,
  }
  await expect(act(id, action, key)).rejects.toBeInstanceOf(TypeError)
  const opened = partySessionResponseSchema.parse(
    await requestJson('POST', '/parties/' + id + '/session'),
  )
  const receipt = await act(id, action, key)
  expect(opened.domainEvents).toEqual(receipt.domainEvents)
  expect(opened.pendingCombatDecision).toEqual(receipt.pendingCombatDecision)
  expect(opened.revision).toBe(receipt.revision)
  const reloaded = partySessionResponseSchema.parse(
    await requestJson('POST', '/parties/' + id + '/session'),
  )
  expect(reloaded.domainEvents).toEqual([])
  expect(reloaded.pendingCombatDecision).toEqual(opened.pendingCombatDecision)
})
