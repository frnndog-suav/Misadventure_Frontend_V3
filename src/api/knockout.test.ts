import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act as renderAct, renderHook } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createElement, type ReactNode } from 'react'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { resetKnockoutScenarios } from '../mocks/knockoutFixtures'
import { handlers } from '../mocks/handlers'
import { requestJson } from './http'
import { labConfigSchema } from './labConfig'
import { partySchema, usePartyAction, type PartyAction } from './parties'

const server = setupServer(...handlers)
beforeEach(resetKnockoutScenarios)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const path = (id: string) => '/parties/fixture.knockout-' + id
const get = async (id: string) =>
  partySchema.parse(await requestJson('GET', path(id)))
const act = (id: string, action: PartyAction) =>
  requestJson('POST', path(id) + '/actions', action)
const player = (party: ReturnType<typeof partySchema.parse>) =>
  party.members[0]!.player!

it('REQ-63 saves the current urban zone, persists it and rejects invalid attempts', async () => {
  expect(player(await get('spawn'))).toMatchObject({
    zoneId: 'fixture.gray-harbor',
    respawnZoneId: 'fixture.gray-harbor',
    lastKnockout: null,
  })
  await act('spawn', { type: 'move', zoneId: 'fixture.respawn-town' })
  const save = { type: 'saveRespawnPoint' } as const
  const client = new QueryClient()
  const { result } = renderHook(
    () => usePartyAction('fixture.knockout-spawn'),
    {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client, children }),
    },
  )
  const first = await renderAct(() => result.current.mutateAsync(save))
  expect(first).toMatchObject({ combatUpdates: [], turn: { actionPoints: 1 } })
  expect(player(await get('spawn')).respawnZoneId).toBe('fixture.respawn-town')
  await act('spawn', save)
  const saved = await get('spawn')
  expect(player(saved).availableActions).not.toContain(save.type)
  await expect(act('spawn', save)).rejects.toMatchObject({
    details: { reason: 'noActionPoints' },
  })
  await expect(
    requestJson('POST', path('spawn') + '/actions', {
      ...save,
      zoneId: 'forged',
    }),
  ).rejects.toMatchObject({
    details: { fields: [{ field: 'zoneId', reason: 'unknownKey' }] },
  })
  expect(await get('spawn')).toEqual(saved)
  await expect(act('donation', save)).rejects.toMatchObject({
    details: { reason: 'zoneActionUnavailable' },
  })
})

it('REQ-64 persists the result of fatal donation after the setback', async () => {
  const response = await act('fatal-payment', {
    type: 'payEventRequirement',
    encounterId: 'e1',
    requirementId: 'life',
  })
  expect(response).toMatchObject({
    combatUpdates: [],
    pendingRewards: [],
    randomEventEncounter: null,
  })
  const saved = await get('fatal-payment')
  expect(saved.turn).toMatchObject({ round: 8, actionPoints: 3 })
  expect(player(saved)).toMatchObject({
    zoneId: 'fixture.respawn-town',
    health: 2,
    maxHealth: 21,
    down: false,
    peak: 8,
    vigor: 4,
    gold: 29,
    vault: { gold: 80 },
    skipNextTurn: false,
    lastKnockout: {
      combatId: null,
      peakLost: 1,
      vigorLost: 5,
      purseGoldLost: 3,
    },
    lastRandomEvent: {
      resolution: 'setback',
      cause: 'gaveUp',
      peakDelta: -1,
      replacement: { requested: 1, drawn: 1 },
      payments: [
        { requirementId: 'attrs', handCards: [{ copyId: 'h1' }] },
        { requirementId: 'life', health: 2 },
      ],
    },
    handCopies: [{ copyId: 'h2' }],
    attributeDiscardPileCount: 1,
  })
  expect(await get('fatal-payment')).toEqual(saved)
})

it.each([
  ['heal', { type: 'giveUpEvent', encounterId: 'e2' }, 'reward-2'],
  [
    'reflection',
    {
      type: 'combatAttack',
      combatId: 'combat-1',
      turnId: 'turn-1',
      targetId: 'wolf-1',
    },
    'reward-1',
  ],
] as const)(
  'REQ-64 preserves the downed choice across reopening (%s)',
  async (id, action, rewardId) => {
    await requestJson('POST', path(id) + '/actions', action)
    expect(player(await get(id))).toMatchObject({
      health: 0,
      down: true,
      availableActions: ['resolveReward'],
    })
    await requestJson('POST', path(id) + '/session/end')
    const reopened = partySchema.parse(
      await requestJson('POST', path(id) + '/session'),
    )
    expect(reopened.pendingRewards?.[0]?.id).toBe(rewardId)
    await act(id, { type: 'resolveReward', rewardId, choice: 'leave' })
    const saved = await get(id)
    expect(saved.pendingRewards).toEqual([])
    expect(player(saved)).toMatchObject({
      health: 2,
      down: false,
      gold: 34,
      lastKnockout: { healthRestored: 2 },
    })
  },
)

it('REQ-65 projects knockout defaults and limits and persists only valid patches', async () => {
  const read = async () =>
    labConfigSchema.parse(await requestJson('GET', '/lab/config'))
  const defaults = await read()
  expect(defaults.defaults).toMatchObject({
    knockoutHealthPercent: 10,
    knockoutPeakLossPercent: 10,
    knockoutVigorCapPercent: 50,
    soloKnockoutGoldLossPercent: 10,
    soloKnockoutWaitRounds: 1,
  })
  expect(defaults.limits).toMatchObject({
    knockoutHealthPercent: { min: 1, max: 100 },
    soloKnockoutWaitRounds: { min: 0, max: 10 },
  })
  await requestJson('PATCH', '/lab/config', { soloKnockoutWaitRounds: 0 })
  expect((await read()).values).toMatchObject({ soloKnockoutWaitRounds: 0 })
  await expect(
    requestJson('PATCH', '/lab/config', {
      knockoutHealthPercent: 0,
      soloKnockoutWaitRounds: 1.5,
    }),
  ).rejects.toMatchObject({
    code: 'LAB_CONFIG_INVALID',
    details: {
      fields: [
        { field: 'knockoutHealthPercent', reason: 'outOfRange' },
        { field: 'soloKnockoutWaitRounds', reason: 'notInteger' },
      ],
    },
  })
  expect((await read()).values).toMatchObject({ soloKnockoutWaitRounds: 0 })
  expect(
    labConfigSchema.parse(await requestJson('POST', '/lab/config/reset')),
  ).toEqual(defaults)
})

it('REQ-64 restores the solo turn after defeat and does not replay a legacy outcome', async () => {
  const result = await act('defeat', {
    type: 'endCombatTurn',
    combatId: 'combat-1',
    turnId: 'turn-1',
  })
  expect(result).toMatchObject({
    combat: null,
    lastCombatResult: {
      resolution: 'defeat',
      cause: 'playerDown',
      playerDown: true,
    },
    combatUpdates: [{ type: 'combatDamageResolved' }, { type: 'combatEnded' }],
  })
  const legacy = await get('legacy-defeat')
  expect(legacy.status).toBe('idle')
  expect(player(legacy)).toMatchObject({
    gold: 29,
    down: false,
    availableActions: [],
    lastKnockout: { combatId: 'combat-1' },
  })
  expect(await get('legacy-defeat')).toEqual(legacy)
  const active = partySchema.parse(
    await requestJson('POST', path('legacy-defeat') + '/session'),
  )
  expect(player(active).lastKnockout).toEqual(player(legacy).lastKnockout)
  expect(active.turn).toMatchObject({ round: 8, actionPoints: 3 })
})

it('REQ-64 projects expired status and ready ability after the skipped round', async () => {
  expect(player(await get('donation')).statuses).toMatchObject([
    { remaining: 2 },
  ])
  await act('donation', {
    type: 'prepare',
    operation: 'useAbility',
    equipmentSlot: 'weapon',
    abilityId: 'donate-life',
  })
  const saved = await get('donation')
  expect(saved.turn.round).toBe(8)
  expect(player(saved)).toMatchObject({
    statuses: [],
    usableAbilities: [{ abilityId: 'focus' }],
    gold: 34,
    vault: { gold: 80 },
    lastKnockout: { combatId: null, roundAtKnockout: 6, roundAfterRespawn: 8 },
  })
  expect(player(saved).availableActions).toContain('prepare')
})

it('REQ-64 resolves fatal Reflection automatically when the reward fits', async () => {
  const result = await act('reflection-auto', {
    type: 'combatAttack',
    combatId: 'combat-1',
    turnId: 'turn-1',
    targetId: 'wolf-1',
  })
  expect(result).toMatchObject({
    pendingRewards: [],
    lastCombatResult: { resolution: 'victory', playerDown: true },
  })
  expect(player(await get('reflection-auto'))).toMatchObject({
    down: false,
    health: 2,
    inventory: [{ cardId: 'fixture.pickaxe', quantity: 1 }],
  })
})
