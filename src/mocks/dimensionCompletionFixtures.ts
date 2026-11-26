import { HttpResponse } from 'msw'
import type { DimensionCard } from '../api/catalog'
import type { Party, PartyActionResponse, PartySummary } from '../api/parties'
import { testDimensionFixture } from './catalogFixtures'
import { combatFixture, executableCombatCardFixture } from './combatFixtures'
import { partyInSessionFixture, actionNotAllowedFixture } from './partyFixtures'

const mine = 'fixture.old-mine'
const shard = 'fixture.shard'
const blade = 'fixture.blade-of-dusk'
const base = partyInSessionFixture
const member = base.members[0]
const player = member.player

export const nextDimensionFixture: DimensionCard = {
  ...testDimensionFixture,
  id: 'fixture.next-dimension',
  name: 'Segunda Dimensão',
  releaseOrder: 2,
  completion: null,
}

const finalBoss = {
  title: 'Guardião da Mina',
  flavorText: null,
  enemies: executableCombatCardFixture.enemies.map((enemy) => ({
    ...enemy,
    enemyCategory: 'boss' as const,
    count: 1,
  })),
  noEscape: true,
}
export const bossDimensionFixture: DimensionCard = {
  ...testDimensionFixture,
  id: 'fixture.boss-dimension',
  completion: { ...testDimensionFixture.completion!, finalBoss },
}
export const escapableBossDimensionFixture: DimensionCard = {
  ...bossDimensionFixture,
  id: 'fixture.escapable-boss-dimension',
  completion: {
    ...testDimensionFixture.completion!,
    finalBoss: { ...finalBoss, noEscape: false },
  },
}

export function grantCompletionShard(party: Party, quantity: number): Party {
  const [owner, ...others] = party.members
  return {
    ...party,
    members: [
      {
        ...owner,
        player: {
          ...owner.player,
          completionItems: [{ cardId: shard, quantity }],
        },
      },
      ...others,
    ],
  }
}

const ready: Party = {
  ...base,
  id: 'party-conclusao',
  name: 'Conclusão na Mina Velha',
  members: [
    {
      ...member,
      player: {
        ...player,
        zoneId: mine,
        moveTargets: [],
        moveRoutes: [],
        completionItems: [{ cardId: shard, quantity: 3 }],
        availableActions: ['completeDimension', 'endTurn'],
      },
    },
  ],
}

const result = {
  completedDimensionCardId: testDimensionFixture.id,
  completedDimensionName: testDimensionFixture.name,
  completedByMemberId: member.id,
  finalBossDefeated: false,
  members: [
    {
      memberId: member.id,
      peakDelta: 25,
      gold: 100,
      cards: [{ cardId: blade, copies: 1, destination: 'inventory' as const }],
    },
  ],
  completedAt: ready.savedAt,
}

const completed: Party = {
  ...base,
  id: 'party-dimensao-concluida',
  name: 'Dimensão concluída',
  dimension: { ...base.dimension, dimensionCardId: nextDimensionFixture.id },
  lastDimensionCompletion: {
    ...result,
    next: {
      type: 'nextDimension',
      dimensionCardId: nextDimensionFixture.id,
      name: nextDimensionFixture.name,
    },
  },
  members: [
    {
      ...member,
      player: {
        ...player,
        peak: player.peak + 25,
        gold: player.gold + 100,
        inventory: [...player.inventory, { cardId: blade, quantity: 1 }],
      },
    },
  ],
}

const frozen: Party = {
  ...completed,
  id: 'party-congelado',
  name: 'Save congelado',
  status: 'frozen',
  dimension: ready.dimension,
  turn: { ...ready.turn, actionPoints: 0 },
  lastDimensionCompletion: { ...result, next: { type: 'frozen' } },
  members: completed.members.map((entry) => ({
    ...entry,
    player: { ...entry.player, zoneId: mine, availableActions: [] },
  })),
}
const bossReady: Party = {
  ...ready,
  id: 'party-chefe-final',
  name: 'Conclusão com chefe final',
  dimension: { ...ready.dimension, dimensionCardId: bossDimensionFixture.id },
}
const bossEscapeReady: Party = {
  ...bossReady,
  id: 'party-chefe-final-fuga',
  dimension: {
    ...bossReady.dimension,
    dimensionCardId: escapableBossDimensionFixture.id,
  },
}
const bossDefeatReady: Party = { ...bossReady, id: 'party-chefe-final-derrota' }
const bossLimitReady: Party = { ...bossReady, id: 'party-chefe-final-limite' }
const bossScenarios = [
  bossReady,
  bossEscapeReady,
  bossDefeatReady,
  bossLimitReady,
]

const bossTurn = {
  ...combatFixture.turn,
  actorId: member.id,
  attacksRemaining: 1,
}
const bossTarget = combatFixture.enemies[0].id
function startBossCombat(party: Party): PartyActionResponse {
  const canEscape = party.id === bossEscapeReady.id
  return {
    ...party,
    turn: { ...party.turn, actionPoints: 2 },
    combat: {
      ...combatFixture,
      finalBoss: true,
      memberId: member.id,
      turn: bossTurn,
      attackTargetIds: canEscape ? [] : [bossTarget],
      card: {
        ...combatFixture.card,
        ...finalBoss,
        id: party.dimension.dimensionCardId,
        noEscape: !canEscape,
        goodOutcome: { text: '', steps: [] },
        badOutcome: { text: '', steps: [] },
      },
      escape: {
        ...combatFixture.escape,
        automatic: canEscape,
        unavailableReason: canEscape ? null : 'noEscape',
      },
    },
    members: [
      {
        ...party.members[0],
        player: {
          ...party.members[0].player,
          availableActions: canEscape
            ? ['escapeCombat']
            : ['combatAttack', 'endCombatTurn'],
        },
      },
    ],
    combatUpdates: [
      {
        type: 'combatStarted',
        combatId: combatFixture.id,
        cardId: party.dimension.dimensionCardId,
        cardTitle: finalBoss.title,
        participants: [
          { type: 'player', id: member.id, name: member.characterName },
          {
            type: 'enemy',
            id: combatFixture.enemies[0].id,
            name: finalBoss.enemies[0].name,
            blockIndex: 0,
            copyIndex: 0,
          },
        ],
      },
    ],
  }
}

type BossResult = NonNullable<Party['lastCombatResult']>

function bossResult(
  party: Party,
  resolution: BossResult['resolution'],
  cause: BossResult['cause'],
): Party {
  const victory = resolution === 'victory'
  const lastCombatResult: BossResult = {
    finalBoss: true,
    combatId: combatFixture.id,
    cardId: party.dimension.dimensionCardId,
    memberId: member.id,
    resolution,
    cause,
    peakDelta: victory ? 15 : 0,
    playerDown: cause === 'playerDown',
  }
  const outcome: Party = victory
    ? {
        ...completed,
        lastDimensionCompletion: {
          ...completed.lastDimensionCompletion!,
          completedDimensionCardId: bossDimensionFixture.id,
          finalBossDefeated: true,
          members: result.members.map((award) => ({ ...award, peakDelta: 40 })),
        },
        members: completed.members.map((winner) => ({
          ...winner,
          player: { ...winner.player, peak: player.peak + 40 },
        })),
      }
    : party
  return {
    ...outcome,
    id: party.id,
    name: party.name,
    lastCombatResult,
  }
}

function bossActionResponse(
  party: Party,
  resolution: BossResult['resolution'],
  cause: BossResult['cause'],
) {
  const snapshot = bossResult(party, resolution, cause)
  return HttpResponse.json({
    ...snapshot,
    combatUpdates: [
      {
        type: 'combatEnded',
        combatId: combatFixture.id,
        result: snapshot.lastCombatResult,
      },
    ],
  })
}

const bossCompleted: Party = {
  ...bossResult(bossReady, 'victory', 'enemiesDefeated'),
  id: 'party-chefe-final-concluida',
}

export function finalBossAction(
  id: unknown,
  type: unknown,
  combatId: unknown,
  turnId: unknown,
  targetId: unknown,
) {
  if (combatId !== combatFixture.id || turnId !== bossTurn.id) return
  if (id === bossReady.id && type === 'combatAttack' && targetId === bossTarget)
    return bossActionResponse(bossReady, 'victory', 'enemiesDefeated')
  if (id === bossEscapeReady.id && type === 'escapeCombat')
    return bossActionResponse(bossEscapeReady, 'escaped', 'escapeSucceeded')
  if (id === bossDefeatReady.id && type === 'endCombatTurn')
    return bossActionResponse(bossDefeatReady, 'defeat', 'playerDown')
  if (id === bossLimitReady.id && type === 'endCombatTurn')
    return bossActionResponse(bossLimitReady, 'defeat', 'cycleLimit')
}

const lastDimension: Party = {
  ...ready,
  id: 'party-ultima-dimensao',
  name: 'Última dimensão',
}
const scenarios = [
  ready,
  completed,
  frozen,
  ...bossScenarios,
  bossCompleted,
  lastDimension,
]

export const completionPartySummaries: PartySummary[] = scenarios.map(
  (party) => ({
    id: party.id,
    name: party.name,
    status: party.status,
    characterNames: party.members.map((entry) => entry.characterName),
    createdAt: party.createdAt,
    savedAt: party.savedAt,
  }),
)

export function completionParty(id: unknown) {
  return scenarios.find((party) => party.id === id)
}

export function startCompletionSession(party: Party) {
  return party.status === 'frozen'
    ? HttpResponse.json(
        {
          error: {
            code: 'PARTY_FROZEN',
            message:
              'Este save está congelado até o lançamento da próxima dimensão.',
          },
        },
        { status: 409 },
      )
    : HttpResponse.json(party)
}

export function completeDimension(id: unknown) {
  const boss = bossScenarios.find((party) => party.id === id)
  if (boss) return HttpResponse.json(startBossCombat(boss))
  if (id === ready.id)
    return HttpResponse.json({ ...completed, id: ready.id, name: ready.name })
  if (id === lastDimension.id)
    return HttpResponse.json({
      ...frozen,
      id: lastDimension.id,
      name: lastDimension.name,
    })
  return HttpResponse.json(
    {
      error: {
        ...actionNotAllowedFixture.error,
        details: {
          reason: id === completed.id ? 'noCompletion' : 'notCompletionZone',
        },
      },
    },
    { status: 409 },
  )
}
