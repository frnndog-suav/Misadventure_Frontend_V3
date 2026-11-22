import { resetQuestEditorCards } from '../mocks/questEditorFixtures'
import { resetQuestScenarios } from '../mocks/questFixtures'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act as renderAct, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { handlers } from '../mocks/handlers'
import { requestJson } from './http'
import { ActionNotAllowedError, partySchema, usePartyAction } from './parties'
import { labConfigSchema } from './labConfig'
import { cardSchema } from './catalog'

const server = setupServer(...handlers)
beforeEach(() => {
  resetQuestEditorCards()
  resetQuestScenarios()
})
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const path = (scenario: string) => '/parties/fixture.quest-' + scenario
const get = async (scenario: string) =>
  partySchema.parse(await requestJson('GET', path(scenario)))
const act = async (scenario: string, action: object) =>
  partySchema.parse(
    await requestJson('POST', path(scenario) + '/actions', action),
  )

it('REQ-66 and REQ-69 replace an offer, preserve a refusal and reload a pending reward', async () => {
  const accepted = await act('board', { type: 'takeQuest', questCardId: 'B' })
  expect(accepted.members[0]!.player).toMatchObject({
    questBoard: [
      { questCardId: 'A' },
      { questCardId: 'D' },
      { questCardId: 'C' },
    ],
    openQuests: [{ questId: 'q1' }],
  })
  await expect(
    act('board', { type: 'finishQuest', questId: 'q1' }),
  ).rejects.toMatchObject({
    details: { reason: 'questWrongZone', questId: 'q1' },
  })
  expect(await get('board')).toEqual(accepted)
  await act('board', { type: 'move', zoneId: 'fixture.gray-harbor' })
  const finished = await act('board', { type: 'finishQuest', questId: 'q1' })
  expect(finished.pendingRewards[0]?.source).toEqual({
    type: 'quest',
    questId: 'q1',
    questCardId: 'B',
  })
  expect(await get('board')).toEqual(finished)
})

it('REQ-67 grants an inactive specialization after the objectives', async () => {
  const result = await act('trial', { type: 'finishQuest', questId: 'trial-1' })
  expect(result.members[0]!.player).toMatchObject({
    specializations: [
      { classId: 'warrior', specializationId: 'knight', deckLockMet: false },
    ],
  })
})

it('REQ-68 charges all remaining AP and preserves mentor gold on abandonment', async () => {
  const trained = await act('mentor', {
    type: 'trainWithMentor',
    classId: 'mage',
  })
  expect(trained.turn.actionPoints).toBe(0)
  expect(trained.members[0]!.player.gold).toBe(50)
  const abandoned = await act('mentor', {
    type: 'abandonQuest',
    questId: 'mentor-1',
  })
  expect(abandoned.members[0]!.player).toMatchObject({
    gold: 50,
    openQuests: [],
  })
})

it('REQ-70 parses quest content and serves atomic lab values', async () => {
  const config = labConfigSchema.parse(await requestJson('GET', '/lab/config'))
  expect(config.values).toMatchObject({
    questBoardSize: 3,
    mentorBaseGoldCost: 150,
  })
  await expect(
    requestJson('PATCH', '/lab/config', { questBoardSize: 0 }),
  ).rejects.toMatchObject({
    details: { fields: [{ field: 'questBoardSize', reason: 'outOfRange' }] },
  })
  expect(
    cardSchema.safeParse({
      type: 'zoneQuest',
      id: 'fixture.delivery',
      collectionId: 'fixture',
      title: 'Entrega',
      summary: 'Entregue a mensagem',
      rewards: [],
      stages: [
        {
          type: 'interaction',
          text: 'Entregue a mensagem',
          location: { type: 'zoneTitle', title: 'Porto' },
        },
      ],
    }).success,
  ).toBe(true)
})

it('REQ-67 and REQ-69 count a success once on the first POST and keep it through session reload', async () => {
  await act('progress', {
    type: 'takeTrialQuest',
    classId: 'warrior',
    specializationId: 'knight',
  })
  await expect(
    act('progress', { type: 'finishQuest', questId: 'trial-1' }),
  ).rejects.toMatchObject({
    details: { reason: 'questObjectivesIncomplete', questId: 'trial-1' },
  })
  await act('progress', { type: 'continueQuest', questId: 'q1' })
  await act('progress', { type: 'revealEvent', encounterId: 'e1' })
  const success = await act('progress', {
    type: 'payEventRequirement',
    encounterId: 'e1',
    requirementId: 'gold',
  })
  expect(success.members[0]!.player).toMatchObject({
    openQuests: [
      { stage: { status: 'completed' } },
      {
        stage: {
          objectives: { randomEventSuccesses: { current: 1, target: 3 } },
        },
      },
      {
        objectives: {
          randomEventSuccesses: { current: 1, target: 3 },
          combatVictories: { current: 0 },
        },
      },
    ],
    questChoices: [],
  })
  expect(success.pendingRewards).toMatchObject([
    { source: { type: 'randomEvent', encounterId: 'e1' } },
  ])
  expect(await get('progress')).toEqual(success)
  await requestJson('POST', path('progress') + '/session/end')
  expect(
    partySchema.parse(await requestJson('POST', path('progress') + '/session')),
  ).toEqual(success)
  const resolved = await act('progress', {
    type: 'resolveReward',
    rewardId: 'r1',
    choice: 'leave',
  })
  expect(resolved.members[0]!.player.openQuests).toEqual(
    success.members[0]!.player.openQuests,
  )
  const advanced = await act('progress', {
    type: 'continueQuest',
    questId: 'q1',
  })
  expect(advanced.members[0]!.player.openQuests[0]).toMatchObject({
    stage: { index: 1, status: 'ready' },
  })
})

it('REQ-69 lets an escape retry and completes fatal victory without adding a standing win', async () => {
  const begin = () => act('combat', { type: 'continueQuest', questId: 'q1' })
  const first = await begin()
  expect(first.combat).toMatchObject({ cardId: 'sequence' })
  const escaped = await act('combat', {
    type: 'escapeCombat',
    combatId: first.combat!.id,
    turnId: first.combat!.turn.id,
  })
  expect(escaped.members[0]!.player.openQuests[0]).toMatchObject({
    stage: { status: 'ready' },
  })
  const retry = await begin()
  const victory = await act('combat', {
    type: 'combatAttack',
    combatId: retry.combat!.id,
    turnId: retry.combat!.turn.id,
    targetId: retry.combat!.attackTargetIds[0],
  })
  expect(victory.lastCombatResult).toMatchObject({
    resolution: 'victory',
    playerDown: true,
  })
  expect(victory.members[0]!.player.openQuests).toMatchObject([
    { stage: { status: 'completed' } },
    { objectives: { combatVictories: { current: 1 } } },
  ])
  expect(victory.pendingRewards).toHaveLength(1)
  const respawned = await act('combat', {
    type: 'resolveReward',
    rewardId: 'r1',
    choice: 'leave',
  })
  expect(respawned.members[0]!.player.down).toBe(false)
  expect(respawned.members[0]!.player.openQuests).toEqual(
    victory.members[0]!.player.openQuests,
  )
})

it('REQ-70 saves a quest draft, publishes and preserves the last valid reference', async () => {
  const draft = {
    slug: 'help-at-the-port',
    type: 'zoneQuest',
    title: 'Ajuda no Porto',
    summary: 'Socorra o viajante',
    stages: [
      {
        type: 'randomEvent',
        text: 'Ajude o viajante',
        location: { type: 'zoneTitle', title: 'Porto' },
        eventCardId: 'fixture.wounded-traveler',
      },
    ],
    rewards: [],
  }
  const saved = await requestJson(
    'POST',
    '/lab/content/collections/fixture/cards',
    draft,
  )
  const cardPath = '/lab/content/cards/fixture.help-at-the-port'
  expect(saved).toMatchObject({
    status: 'draft',
    card: { id: 'fixture.help-at-the-port' },
  })
  const published = await requestJson('POST', cardPath + '/publish')
  expect(published).toMatchObject({ status: 'published' })
  await expect(
    requestJson('PUT', cardPath, {
      ...draft,
      stages: [{ ...draft.stages[0], eventCardId: 'fixture.road-ambush' }],
    }),
  ).rejects.toMatchObject({
    code: 'CONTENT_INVALID',
    details: { fields: [{ path: 'stages.0.eventCardId' }] },
  })
  await expect(
    requestJson('PUT', cardPath, {
      ...draft,
      stages: [
        {
          ...draft.stages[0],
          location: { type: 'zoneTitle', title: 'Porto Inexistente' },
        },
      ],
    }),
  ).rejects.toMatchObject({
    code: 'CONTENT_INVALID',
    details: { fields: [{ path: 'stages.0.location.title' }] },
  })
  expect(await requestJson('GET', cardPath)).toEqual(published)
  expect(
    await requestJson(
      'GET',
      '/catalog/collections/fixture/cards?type=zoneQuest',
    ),
  ).toEqual([(published as { card: unknown }).card])
})

it('REQ-70 updates and resets the lab and rejects a mixed invalid patch atomically', async () => {
  await requestJson('POST', '/lab/config/reset')
  const updated = labConfigSchema.parse(
    await requestJson('PATCH', '/lab/config', { questBoardSize: 4 }),
  )
  expect(updated.values.questBoardSize).toBe(4)
  await expect(
    requestJson('PATCH', '/lab/config', {
      questBoardSize: 5,
      trialMinPeak: -1,
    }),
  ).rejects.toMatchObject({
    code: 'LAB_CONFIG_INVALID',
    details: { fields: [{ field: 'trialMinPeak', reason: 'outOfRange' }] },
  })
  expect(
    labConfigSchema.parse(await requestJson('GET', '/lab/config')).values
      .questBoardSize,
  ).toBe(4)
  const reset = labConfigSchema.parse(
    await requestJson('POST', '/lab/config/reset'),
  )
  expect(reset.values.questBoardSize).toBe(3)
})

it('REQ-66 and REQ-69 abandon at zero AP and reaccept with a new instance', async () => {
  await act('board', { type: 'takeQuest', questCardId: 'B' })
  await act('board', { type: 'takeQuest', questCardId: 'A' })
  await act('board', { type: 'takeQuest', questCardId: 'D' })
  const abandoned = await act('board', { type: 'abandonQuest', questId: 'q1' })
  expect(abandoned.turn.actionPoints).toBe(0)
  expect(abandoned.members[0]!.player.questBoard).toMatchObject([
    { questCardId: 'C' },
    { questCardId: 'B' },
  ])
  await act('board', { type: 'endTurn' })
  const reaccepted = await act('board', { type: 'takeQuest', questCardId: 'B' })
  expect(reaccepted.members[0]!.player.openQuests.at(-1)).toMatchObject({
    questId: 'q4',
    stage: { index: 0, status: 'ready' },
  })
})

it('REQ-67 activates Cavaleiro on the next build save and preserves the grant on reload', async () => {
  const granted = await act('trial', {
    type: 'finishQuest',
    questId: 'trial-1',
  })
  expect(granted.members[0]!.player.specializations[0]?.deckLockMet).toBe(false)
  const adjusted = await act('trial', {
    type: 'adjustDeck',
    build: [
      { cardId: 'fixture.endurance-basic', copies: 14 },
      { cardId: 'fixture.strength-basic', copies: 40 },
      { cardId: 'fixture.wisdom-basic', copies: 6 },
    ],
  })
  expect(adjusted.members[0]!.player).toMatchObject({
    playerClasses: [{ playerClass: 'warrior', deckLockMet: true }],
    specializations: [
      { classId: 'warrior', specializationId: 'knight', deckLockMet: true },
    ],
  })
  expect(await get('trial')).toEqual(adjusted)
})

it('REQ-68 grants the mentor class inactive and preserves acquisition order and inventory capacity', async () => {
  const initial = await get('mentor-ready')
  const finished = await act('mentor-ready', {
    type: 'finishQuest',
    questId: 'mentor-1',
  })
  expect(finished.members[0]!.player).toMatchObject({
    playerClasses: [
      { playerClass: 'warrior', deckLockMet: true },
      { playerClass: 'mage', deckLockMet: false },
    ],
    inventoryCapacity: initial.members[0]!.player.inventoryCapacity,
    modifiers: initial.members[0]!.player.modifiers,
  })
  expect(await get('mentor-ready')).toEqual(finished)
})

it('REQ-66 sends only the quest intent and preserves typed refusal details in the action client', async () => {
  const client = new QueryClient()
  const { result } = renderHook(() => usePartyAction('fixture.quest-board'), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client, children }),
  })
  const initial = await get('board')
  const offer = initial.members[0]!.player.questChoices.find(
    (choice) => choice.type === 'takeQuest' && choice.questCardId === 'B',
  )!
  const accepted = await renderAct(() => result.current.mutateAsync(offer))
  expect(accepted.turn.actionPoints).toBe(2)
  await renderAct(async () => {
    const refusal = result.current.mutateAsync({
      type: 'finishQuest',
      questId: 'q1',
    })
    await expect(refusal).rejects.toBeInstanceOf(ActionNotAllowedError)
    await expect(refusal).rejects.toMatchObject({
      reason: 'questWrongZone',
      details: { questId: 'q1' },
    })
  })
})

it('REQ-66 completes both attempts separately from delivery and spends exactly one AP per quest action', async () => {
  const next = () => act('sequence', { type: 'continueQuest', questId: 'q1' })
  const anticipation = await next()
  expect(anticipation.turn.actionPoints).toBe(2)
  await act('sequence', { type: 'revealEvent', encounterId: 'e1' })
  await act('sequence', {
    type: 'payEventRequirement',
    encounterId: 'e1',
    requirementId: 'gold',
  })
  await act('sequence', {
    type: 'resolveReward',
    rewardId: 'r1',
    choice: 'leave',
  })
  const delivered = await next()
  expect(delivered.turn.actionPoints).toBe(1)
  expect(delivered.members[0]!.player.openQuests[0]).toMatchObject({
    stage: { index: 1, status: 'ready' },
  })
  const started = await next()
  const won = await act('sequence', {
    type: 'combatAttack',
    combatId: started.combat!.id,
    turnId: started.combat!.turn.id,
    targetId: started.combat!.attackTargetIds[0],
  })
  expect(won.turn.actionPoints).toBe(0)
  expect(won.members[0]!.player.questChoices).toEqual([
    { type: 'abandonQuest', questId: 'q1', actionPoints: 0, gold: 0 },
  ])
  await act('sequence', { type: 'endTurn' })
  const finished = await act('sequence', { type: 'finishQuest', questId: 'q1' })
  expect(finished.turn.actionPoints).toBe(2)
  expect(finished.members[0]!.player.openQuests).toEqual([])
  expect(finished.members[0]!.player.gold).toBe(won.members[0]!.player.gold + 5)
})
