import { HttpResponse } from 'msw'
import { questConfigDefaults, type GameConfigValues } from '../api/labConfig'
import {
  partyActionTypeSchema,
  type Party,
  type PartyActionResponse,
  type PlayerState,
} from '../api/parties'
import {
  questActionSchema,
  type OpenQuest,
  type QuestAction,
} from '../api/quests'
import {
  actionInvalidUnknownActionFixture,
  actionNotAllowedFixture,
  partyInSessionFixture,
  partySessionNotActiveFixture,
} from './partyFixtures'
import { partyEncounterFixture } from './randomEventFixtures'
import { warriorClassFixture } from './classFixtures'
import { labConfigDefaultsFixture } from './fixtures'
import { knockoutCombatFixture } from './combatFixtures'

const prefix = 'fixture.quest-'
const harbor = 'fixture.gray-harbor'
const woods = 'fixture.whispering-grove'
/** Mercado do Porto Cinzento (FEAT-16); fora dele, `market: null`. */
const harborMarket = partyInSessionFixture.members[0]!.player.market
/** Ferreiro do Porto Cinzento (FEAT-17); fora dele, `blacksmith: null`. */
const harborBlacksmith = partyInSessionFixture.members[0]!.player.blacksmith
const offer = (questCardId: string) => ({
  questCardId,
  title: questCardId === 'B' ? 'Entrega' : questCardId,
  summary: 'Entregue a mensagem',
})
const objectives = (target: number, current = 0) => ({
  randomEventSuccesses: { current, target },
  combatVictories: { current, target },
})
const eventPeakGain = 2
const sequenceFinalPeakSteps = [3, 4]
const questEvent = {
  ...partyEncounterFixture.randomEventEncounter!,
  card: {
    ...partyEncounterFixture.randomEventEncounter!.card!,
    id: 'fixture.wounded-traveler',
    title: 'Viajante Ferido',
    requirements: [
      {
        id: 'gold',
        kind: 'payGold' as const,
        amount: 5,
        text: 'Pague 5 de ouro.',
      },
    ],
    goodOutcome: {
      text: 'O viajante agradece.',
      steps: [
        {
          type: 'effect' as const,
          effect: {
            text: 'Ganhe 2 de Pico.',
            duration: { kind: 'immediate' },
            activation: [{ kind: 'gainPeak', amount: eventPeakGain }],
            mark: null,
          },
        },
        {
          type: 'grantReward' as const,
          cardId: 'fixture.strength-basic',
          copies: 1,
        },
      ],
    },
  },
  requirements: [
    {
      requirementId: 'gold',
      status: 'unpaid' as const,
      payable: true,
      handCardSelection: null,
      eligibleHandCopyIds: [],
      eligibleEquipmentSlots: [],
      eligibleResourceCardIds: [],
      amountDue: 5,
    },
  ],
} satisfies NonNullable<Party['randomEventEncounter']>
const trialAction = {
  type: 'takeTrialQuest',
  classId: 'warrior',
  specializationId: 'knight',
} as const
const mentorAction = { type: 'trainWithMentor', classId: 'mage' } as const
const specialization = {
  classId: trialAction.classId,
  specializationId: trialAction.specializationId,
  deckLockMet: true,
}
const trial: Extract<OpenQuest, { type: 'trialQuest' }> = {
  type: 'trialQuest',
  questId: 'trial-1',
  title: 'Cavaleiro',
  classId: 'warrior',
  specializationId: 'knight',
  objectives: objectives(3, 3),
}

const states = new Map<string, Party>()
type QuestPeakConfig = Pick<
  GameConfigValues,
  'zoneQuestPeakGain' | 'genericQuestPeakGain'
>
const peakSnapshots = new Map<string, QuestPeakConfig>()
const decks = new Map<string, string[]>()
const originBoards = new Map<string, PlayerState['questBoard']>()
const nextQuestIds = new Map<string, number>()

export function resetQuestScenarios() {
  states.clear()
  peakSnapshots.clear()
  decks.clear()
  originBoards.clear()
  nextQuestIds.clear()
}

function withPlayer(party: Party, fields: Partial<PlayerState>): Party {
  const member = party.members[0]!
  return {
    ...party,
    members: [{ ...member, player: { ...member.player, ...fields } }],
  }
}

function choices(party: Party): Party {
  const player = party.members[0]!.player
  const projected: PlayerState['questChoices'] = []
  const enabled =
    !party.combat &&
    !party.randomEventEncounter &&
    !party.pendingRewards.length &&
    !player.down
  const ap = party.turn.actionPoints
  const add = (action: QuestAction, actionPoints = 1, gold = 0) => {
    projected.push({ ...action, actionPoints, gold })
  }
  if (enabled) {
    if (ap > 0) {
      if (player.openQuests.length < 3) {
        for (const { questCardId } of player.questBoard)
          add({ type: 'takeQuest', questCardId })
      }
      for (const quest of player.openQuests) {
        if (quest.type === 'zoneQuest') {
          if (quest.stage.status === 'inProgress') continue
          if (quest.questCardId === 'sequence') {
            add({
              type:
                quest.stage.index === 1 && quest.stage.status === 'completed'
                  ? 'finishQuest'
                  : 'continueQuest',
              questId: quest.questId,
            })
          } else if (player.zoneId === harbor && complete(quest)) {
            add({ type: 'finishQuest', questId: quest.questId })
          }
        } else if (player.zoneId === harbor && complete(quest)) {
          add({ type: 'finishQuest', questId: quest.questId })
        }
      }
      if (
        player.openQuests.length < 3 &&
        !player.openQuests.some((quest) => quest.type !== 'zoneQuest') &&
        player.zoneId === harbor
      ) {
        if (!player.specializations.length && player.peak >= 30)
          add(trialAction)
        if (
          player.specializations.length === player.playerClasses.length &&
          !player.playerClasses.some(
            ({ playerClass }) => playerClass === 'mage',
          ) &&
          player.gold >= 150
        )
          add(mentorAction, ap, 150)
      }
    }
    for (const { questId } of player.openQuests)
      add({ type: 'abandonQuest', questId }, 0)
  }
  const encounter = party.randomEventEncounter
  const available: PlayerState['availableActions'] = party.pendingRewards.length
    ? ['resolveReward']
    : party.combat
      ? ['combatAttack', 'escapeCombat', 'endCombatTurn']
      : encounter?.phase === 'anticipation'
        ? ['revealEvent']
        : encounter
          ? ['payEventRequirement', 'giveUpEvent', 'escapeEvent']
          : ap > 0
            ? ['move', 'adjustDeck', 'endTurn']
            : ['endTurn']
  return withPlayer(party, {
    questChoices: projected,
    availableActions: [
      ...new Set([...available, ...projected.map(({ type }) => type)]),
    ].sort(
      (a, b) =>
        partyActionTypeSchema.options.indexOf(a) -
        partyActionTypeSchema.options.indexOf(b),
    ),
  })
}

function complete(quest: OpenQuest) {
  const counters =
    quest.type === 'zoneQuest' ? quest.stage.objectives : quest.objectives
  return (
    !counters ||
    Object.values(counters).every(({ current, target }) => current >= target)
  )
}

function zoneQuest(
  questCardId: string,
  questId: string,
  originZoneId: string,
): Extract<OpenQuest, { type: 'zoneQuest' }> {
  return {
    type: 'zoneQuest',
    questId,
    questCardId,
    originZoneId,
    title: offer(questCardId).title,
    stage: {
      index: 0,
      text: 'Entregue a mensagem',
      location: { type: 'zoneTitle', title: 'Porto' },
      status: 'ready',
      objectives: null,
    },
  }
}

export function getQuestScenario(
  id: unknown,
  labValues: Partial<QuestPeakConfig>,
  status?: Party['status'],
): Party | undefined {
  if (typeof id !== 'string' || !id.startsWith(prefix)) return
  const name = id.slice(prefix.length)
  if (
    ![
      'board',
      'trial',
      'mentor',
      'sequence',
      'progress',
      'combat',
      'mentor-ready',
      'limit',
    ].includes(name)
  )
    return
  let party = states.get(id)
  if (!party) {
    peakSnapshots.set(id, {
      zoneQuestPeakGain:
        labValues.zoneQuestPeakGain ?? questConfigDefaults.zoneQuestPeakGain,
      genericQuestPeakGain:
        labValues.genericQuestPeakGain ??
        questConfigDefaults.genericQuestPeakGain,
    })
    const openQuests: OpenQuest[] = []
    if (name === 'trial') openQuests.push(trial)
    if (name === 'mentor-ready')
      openQuests.push({
        type: 'mentorQuest',
        questId: 'mentor-1',
        title: 'Mentor',
        classId: 'mage',
        objectives: objectives(5, 5),
      })
    if (['sequence', 'progress', 'combat'].includes(name)) {
      const sequence = zoneQuest('sequence', 'q1', harbor)
      if (name === 'combat') sequence.stage.index = 1
      openQuests.push(sequence)
    }
    if (name === 'progress') {
      const counters = zoneQuest('counters', 'q2', harbor)
      counters.stage.objectives = objectives(3)
      openQuests.push(counters)
    }
    if (name === 'combat')
      openQuests.push({ ...trial, objectives: objectives(3, 1) })
    if (name === 'limit')
      openQuests.push(
        ...['A', 'B', 'C'].map((card, index) =>
          zoneQuest(card, 'q' + index, harbor),
        ),
      )
    party = choices(
      withPlayer(
        {
          ...partyInSessionFixture,
          id,
          turn: {
            ...partyInSessionFixture.turn,
            actionPoints: name === 'mentor' ? 2 : 3,
          },
        },
        {
          zoneId: name === 'board' ? woods : harbor,
          market: name === 'board' ? null : harborMarket,
          blacksmith: name === 'board' ? null : harborBlacksmith,
          moveTargets: [name === 'board' ? harbor : woods],
          peak: ['trial', 'progress'].includes(name) ? 30 : 10,
          gold: 200,
          questBoard: name === 'board' ? ['A', 'B', 'C'].map(offer) : [],
          openQuests,
          specializations: name.startsWith('mentor') ? [specialization] : [],
        },
      ),
    )
    decks.set(id, name === 'board' ? ['D'] : [])
    originBoards.set(id, party.members[0]!.player.questBoard)
    nextQuestIds.set(id, 1)
  }
  if (status) party = { ...party, status }
  states.set(id, party)
  return party
}

function increment(
  quests: OpenQuest[],
  key: 'combatVictories' | 'randomEventSuccesses',
): OpenQuest[] {
  return quests.map((quest) => {
    const counters =
      quest.type === 'zoneQuest' ? quest.stage.objectives : quest.objectives
    if (!counters) return quest
    const counter = counters[key]
    const updated = {
      ...counters,
      [key]: {
        ...counter,
        current: Math.min(counter.target, counter.current + 1),
      },
    }
    return quest.type === 'zoneQuest'
      ? { ...quest, stage: { ...quest.stage, objectives: updated } }
      : { ...quest, objectives: updated }
  })
}

export function questPartyAction(party: Party, body: unknown) {
  if (party.status === 'idle')
    return HttpResponse.json(partySessionNotActiveFixture, { status: 409 })
  const player = party.members[0]!.player
  const raw =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
  const parsed = questActionSchema.safeParse(raw)
  const action = parsed.data
  const target =
    action && 'questId' in action
      ? player.openQuests.find(({ questId }) => questId === action.questId)
      : undefined
  const deny = (reason: string) => {
    const ids = { ...action } as Partial<QuestAction>
    delete ids.type
    return HttpResponse.json(
      {
        error: {
          ...actionNotAllowedFixture.error,
          details: { reason, ...ids },
        },
      },
      { status: 409 },
    )
  }
  const invalid = (fields: { field: string; reason: string }[]) =>
    HttpResponse.json(
      {
        error: {
          ...actionInvalidUnknownActionFixture.error,
          details: { fields },
        },
      },
      { status: 400 },
    )
  const save = (
    fields: Partial<PlayerState> = {},
    cost = 0,
    changes: Partial<Party> = {},
    combatUpdates: PartyActionResponse['combatUpdates'] = [],
  ) => {
    const next = choices(
      withPlayer(
        {
          ...party,
          turn: { ...party.turn, actionPoints: party.turn.actionPoints - cost },
          savedAt: new Date(Date.parse(party.savedAt) + 1000).toISOString(),
          ...changes,
        },
        fields,
      ),
    )
    states.set(party.id, next)
    return HttpResponse.json({ ...next, combatUpdates })
  }
  const setStage = (
    status: 'ready' | 'inProgress' | 'completed',
    index?: number,
  ) =>
    player.openQuests.map((quest) =>
      quest.type === 'zoneQuest' && quest.questCardId === 'sequence'
        ? {
            ...quest,
            stage: {
              ...quest.stage,
              status,
              index: index ?? quest.stage.index,
            },
          }
        : quest,
    )
  const pending = (
    source: Party['pendingRewards'][number]['source'],
  ): Party['pendingRewards'] => [
    {
      id: 'r1',
      memberId: party.members[0]!.id,
      cardId: 'fixture.strength-basic',
      origin: { type: 'fixed' },
      source,
      destination: 'tcgFolder',
      discardOptions: [],
      decisionDeadlineAt: null,
    },
  ]
  if (raw.type === 'resolveReward') {
    if (!party.pendingRewards.some(({ id }) => id === raw.rewardId))
      return deny('staleReward')
    if (raw.choice !== 'leave') return deny('rewardDoesNotFit')
    return save(
      player.down
        ? { down: false, health: 2, zoneId: player.respawnZoneId ?? harbor }
        : {},
      0,
      { pendingRewards: [], randomEventEncounter: null },
    )
  }
  if (
    raw.type === 'revealEvent' &&
    party.randomEventEncounter?.phase === 'anticipation' &&
    raw.encounterId === 'e1'
  ) {
    return save({}, 0, { randomEventEncounter: questEvent })
  }
  if (
    raw.type === 'payEventRequirement' &&
    party.randomEventEncounter?.phase === 'encounter' &&
    raw.encounterId === 'e1' &&
    raw.requirementId === 'gold'
  ) {
    if (player.gold < 5) return deny('notEnoughGold')
    const payments = [{ requirementId: 'gold', gold: 5 }]
    return save(
      {
        gold: player.gold - 5,
        peak: player.peak + eventPeakGain,
        openQuests: increment(setStage('completed'), 'randomEventSuccesses'),
        lastRandomEvent: {
          encounterId: 'e1',
          cardId: questEvent.card.id,
          resolution: 'success',
          cause: 'requirementsMet',
          payments,
          peakDelta: eventPeakGain,
          replacement: { requested: 0, drawn: 0 },
          escape: null,
        },
      },
      0,
      {
        randomEventEncounter: {
          ...party.randomEventEncounter,
          phase: 'success',
          payments,
          requirements: questEvent.requirements.map((requirement) => ({
            ...requirement,
            status: 'paid',
            payable: false,
            amountDue: 0,
          })),
        },
        pendingRewards: pending({ type: 'randomEvent', encounterId: 'e1' }),
      },
    )
  }
  if (
    (raw.type === 'giveUpEvent' || raw.type === 'escapeEvent') &&
    party.randomEventEncounter?.phase === 'encounter' &&
    raw.encounterId === 'e1'
  ) {
    return save({ openQuests: setStage('ready') }, 0, {
      randomEventEncounter: null,
    })
  }
  if (
    party.combat &&
    ['combatAttack', 'escapeCombat', 'endCombatTurn'].includes(String(raw.type))
  ) {
    if (raw.combatId !== party.combat.id) return deny('staleCombat')
    if (raw.turnId !== party.combat.turn.id) return deny('staleCombatTurn')
    const escaped = raw.type === 'escapeCombat'
    const defeated = raw.type === 'endCombatTurn'
    const playerDown =
      raw.type === 'combatAttack' && party.id === prefix + 'combat'
    const result = {
      combatId: party.combat.id,
      cardId: party.combat.cardId ?? party.combat.card.id,
      memberId: party.combat.memberId,
      cause: escaped
        ? 'escapeSucceeded'
        : defeated
          ? 'playerDown'
          : 'enemiesDefeated',
      resolution: escaped ? 'escaped' : defeated ? 'defeat' : 'victory',
      playerDown: playerDown || defeated,
      peakDelta: 0,
    } satisfies NonNullable<Party['lastCombatResult']>
    return save(
      {
        ...(playerDown ? { health: 0, down: true } : {}),
        openQuests:
          escaped || defeated
            ? setStage('ready')
            : playerDown
              ? setStage('completed')
              : increment(setStage('completed'), 'combatVictories'),
      },
      0,
      {
        combat: null,
        lastCombatResult: result,
        pendingRewards: playerDown
          ? pending({ type: 'combatEvent', combatId: party.combat.id })
          : [],
      },
      [{ type: 'combatEnded', combatId: result.combatId, result }],
    )
  }
  if (party.pendingRewards.length || party.randomEventEncounter)
    return deny('choicePending')
  if (party.combat) return deny('combatInProgress')
  if (raw.type === 'endTurn')
    return save({}, 0, {
      turn: { ...party.turn, round: party.turn.round + 1, actionPoints: 3 },
    })
  if (
    raw.type === 'move' &&
    typeof raw.zoneId === 'string' &&
    player.moveTargets.includes(raw.zoneId) &&
    party.turn.actionPoints > 0
  ) {
    if (player.zoneId === woods) originBoards.set(party.id, player.questBoard)
    return save(
      {
        zoneId: raw.zoneId,
        market: raw.zoneId === harbor ? harborMarket : null,
        blacksmith: raw.zoneId === harbor ? harborBlacksmith : null,
        moveTargets: [player.zoneId],
        questBoard: raw.zoneId === woods ? originBoards.get(party.id)! : [],
      },
      1,
    )
  }
  if (
    raw.type === 'adjustDeck' &&
    Array.isArray(raw.build) &&
    party.turn.actionPoints > 0
  ) {
    const build = raw.build as PlayerState['build']
    const count = (cardId: string) =>
      build.find((entry) => entry.cardId === 'fixture.' + cardId + '-basic')
        ?.copies ?? 0
    const warrior = count('strength') >= 10 && count('endurance') >= 10
    const mage = count('intelligence') >= 10 && count('spirit') >= 10
    const chosen = player.playerClasses.find(({ playerClass }) =>
      playerClass === 'warrior' ? warrior : mage,
    )
    const defaults = labConfigDefaultsFixture.defaults
    const modifiers =
      chosen?.playerClass === 'warrior'
        ? warriorClassFixture.baseModifiers
        : chosen?.playerClass === 'mage'
          ? {
              attack: 4,
              defense: 2,
              accuracy: 55,
              evasion: 20,
              celerity: 10,
              piercing: 0,
              reflection: 0,
            }
          : {
              attack: defaults.defaultAttack,
              defense: defaults.defaultDefense,
              accuracy: defaults.defaultAccuracy,
              evasion: defaults.defaultEvasion,
              celerity: defaults.defaultCelerity,
              piercing: defaults.defaultPiercing,
              reflection: defaults.defaultReflection,
            }
    return save(
      {
        modifiers,
        effectiveModifiers: modifiers,
        build,
        buildSize: build.reduce((total, entry) => total + entry.copies, 0),
        playerClasses: player.playerClasses.map((entry) => ({
          ...entry,
          deckLockMet: entry.playerClass === 'warrior' ? warrior : mage,
        })),
        specializations: player.specializations.map((entry) => ({
          ...entry,
          deckLockMet:
            warrior && count('endurance') >= 14 && count('wisdom') >= 6,
        })),
      },
      1,
    )
  }
  if (!action) {
    const schema = questActionSchema.options.find(
      (option) => option.shape.type.value === raw.type,
    )
    if (!schema) return invalid([{ field: 'type', reason: 'unknownAction' }])
    return invalid(
      Object.keys(schema.shape)
        .filter(
          (key) =>
            key !== 'type' &&
            (typeof raw[key] !== 'string' ||
              raw[key] === '' ||
              key === 'classId'),
        )
        .map((field) => ({
          field,
          reason:
            raw[field] === undefined || raw[field] === ''
              ? 'required'
              : typeof raw[field] === 'string'
                ? 'invalidValue'
                : 'notString',
        })),
    )
  }
  const extras = Object.keys(raw).filter((key) => !Object.hasOwn(action, key))
  if (extras.length)
    return invalid(extras.map((field) => ({ field, reason: 'unknownKey' })))
  if (action.type !== 'abandonQuest' && !party.turn.actionPoints)
    return deny('noActionPoints')
  if ('questId' in action && !target) return deny('questNotOpen')
  const otherQuests = player.openQuests.filter((quest) => quest !== target)
  const deck = decks.get(party.id)!
  switch (action.type) {
    case 'takeQuest': {
      if (player.openQuests.length >= 3) return deny('questLimitReached')
      const index = player.questBoard.findIndex(
        ({ questCardId }) => questCardId === action.questCardId,
      )
      if (index < 0) return deny('questOfferUnavailable')
      const replacement = deck.shift()
      const board = player.questBoard.toSpliced(
        index,
        1,
        ...(replacement ? [offer(replacement)] : []),
      )
      const id = nextQuestIds.get(party.id)!
      nextQuestIds.set(party.id, id + 1)
      return save(
        {
          questBoard: board,
          openQuests: [
            ...player.openQuests,
            zoneQuest(action.questCardId, 'q' + id, player.zoneId),
          ],
        },
        1,
      )
    }
    case 'abandonQuest': {
      if (
        target?.type !== 'zoneQuest' ||
        target.questCardId === 'sequence' ||
        target.questCardId === 'counters'
      )
        return save({ openQuests: otherQuests })
      const here = player.zoneId === target.originZoneId
      const board = here ? player.questBoard : originBoards.get(party.id)!
      if (deck.length || board.length >= 3) {
        deck.push(target.questCardId)
        return save({ openQuests: otherQuests })
      }
      const filled = [...board, offer(target.questCardId)]
      originBoards.set(party.id, filled)
      return save({
        openQuests: otherQuests,
        questBoard: here ? filled : player.questBoard,
      })
    }
    case 'takeTrialQuest':
    case 'trainWithMentor': {
      if (player.openQuests.length >= 3) return deny('questLimitReached')
      if (player.openQuests.some((quest) => quest.type !== 'zoneQuest'))
        return deny('genericQuestAlreadyOpen')
      if (player.zoneId !== harbor) return deny('questWrongZone')
      if (action.type === 'takeTrialQuest') {
        if (action.classId !== 'warrior' || player.specializations.length)
          return deny('questClassIneligible')
        if (action.specializationId !== 'knight')
          return deny('questSpecializationIneligible')
        if (player.peak < 30) return deny('questPeakTooLow')
        return save(
          {
            openQuests: [
              ...player.openQuests,
              { ...trial, objectives: objectives(3) },
            ],
          },
          1,
        )
      }
      if (
        action.classId !== 'mage' ||
        player.specializations.length !== player.playerClasses.length ||
        player.playerClasses.some(
          ({ playerClass }) => playerClass === action.classId,
        )
      )
        return deny('questClassIneligible')
      if (player.gold < 150) return deny('notEnoughGold')
      return save(
        {
          gold: player.gold - 150,
          openQuests: [
            ...player.openQuests,
            {
              type: 'mentorQuest',
              questId: 'mentor-1',
              classId: action.classId,
              title: 'Mentor',
              objectives: objectives(5),
            },
          ],
        },
        party.turn.actionPoints,
      )
    }
    case 'continueQuest': {
      if (target?.type !== 'zoneQuest' || target.questCardId !== 'sequence')
        return deny('questWrongStage')
      if (target.stage.status === 'completed') {
        return target.stage.index === 0
          ? save({ openQuests: setStage('ready', 1) }, 1)
          : deny('questWrongStage')
      }
      const openQuests = setStage('inProgress')
      if (target.stage.index === 1) {
        const combat = {
          ...knockoutCombatFixture,
          cardId: target.questCardId,
          card: {
            ...knockoutCombatFixture.card,
            id: target.questCardId,
            title: target.title,
          },
        }
        return save({ openQuests }, 1, { combat, lastCombatResult: null }, [
          {
            type: 'combatStarted',
            combatId: combat.id,
            cardId: target.questCardId,
            cardTitle: target.title,
            participants: [],
          },
        ])
      }
      return save({ openQuests }, 1, {
        randomEventEncounter: {
          ...questEvent,
          phase: 'anticipation',
          card: null,
          requirements: [],
          escape: null,
        },
      })
    }
    case 'finishQuest': {
      if (player.zoneId !== harbor) return deny('questWrongZone')
      if (!target || !complete(target)) return deny('questObjectivesIncomplete')
      const config = peakSnapshots.get(party.id)!
      const completed = {
        openQuests: otherQuests,
        peak:
          player.peak +
          (target.type === 'zoneQuest'
            ? config.zoneQuestPeakGain
            : config.genericQuestPeakGain),
      }
      if (target.type === 'trialQuest')
        return save(
          {
            ...completed,
            specializations: [
              ...player.specializations,
              {
                classId: target.classId,
                specializationId: target.specializationId,
                deckLockMet: false,
              },
            ],
          },
          1,
        )
      if (target.type === 'mentorQuest')
        return save(
          {
            ...completed,
            playerClasses: [
              ...player.playerClasses,
              { playerClass: target.classId, deckLockMet: false },
            ],
          },
          1,
        )
      if (target.questCardId === 'sequence') {
        if (target.stage.index !== 1 || target.stage.status !== 'completed')
          return deny('questWrongStage')
        const explicitPeakGain = sequenceFinalPeakSteps.reduce(
          (total, amount) => total + amount,
          0,
        )
        return save(
          {
            ...completed,
            peak: player.peak + explicitPeakGain,
            gold: player.gold + 5,
          },
          1,
        )
      }
      return save(completed, 1, {
        pendingRewards: pending({
          type: 'quest',
          questId: target.questId,
          questCardId: target.questCardId,
        }),
      })
    }
  }
}
