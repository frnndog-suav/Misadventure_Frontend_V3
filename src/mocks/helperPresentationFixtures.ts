import type { DomainEvent } from '../api/parties'
import { partyWithHelpersFixture } from './partyFixtures'

export const helperPresentationId = 'fixture.party-helper-presentation'

const group = partyWithHelpersFixture(1)
const [human, helper] = group.members
const zones = ['fixture.gray-harbor', 'fixture.whispering-grove'] as const
const encounterId = 'helper-event'
const cardId = 'fixture.wounded-traveler'
const combatId = 'helper-combat'

export function helperPresentation(round: number) {
  const [origin, destination] = round === 1 ? zones : [zones[1], zones[0]]
  const combatCardId = 'fixture.gray-wolf'
  const result = {
    finalBoss: false,
    combatId,
    cardId: combatCardId,
    memberId: helper.id,
    resolution: 'victory',
    cause: 'enemiesDefeated',
    peakDelta: 1,
    playerDown: false,
  } as const
  const context = {
    memberId: helper.id,
    dimensionId: group.dimension.dimensionCardId,
    round,
  }
  const domainEvents: DomainEvent[] = [
    {
      ...context,
      id: `${round}-start`,
      type: 'turnStarted',
      payload: { zoneId: origin, actionPoints: 3 },
    },
    {
      ...context,
      id: `${round}-move`,
      type: 'moved',
      payload: { fromZoneId: origin, traversedZoneIds: [destination] },
    },
    {
      ...context,
      id: `${round}-event`,
      type: 'randomEventStarted',
      payload: { encounterId, zoneId: destination },
    },
    {
      ...context,
      id: `${round}-reveal`,
      type: 'randomEventRevealed',
      payload: { encounterId, cardId, cardTitle: 'Viajante ferido' },
    },
    {
      ...context,
      id: `${round}-end-event`,
      type: 'randomEventEnded',
      payload: { encounterId, cardId, resolution: 'setback', cause: 'gaveUp' },
    },
    {
      ...context,
      id: `${round}-combat`,
      type: 'combatUpdated',
      payload: {
        combatUpdateIndex: 0,
        update: {
          type: 'combatStarted',
          combatId,
          cardId: combatCardId,
          cardTitle: 'Lobo Cinzento',
          participants: [
            { type: 'player', id: helper.id, name: helper.characterName },
          ],
        },
      },
    },
    {
      ...context,
      id: `${round}-combat-turn`,
      type: 'combatUpdated',
      payload: {
        combatUpdateIndex: 1,
        update: {
          type: 'combatTurnStarted',
          combatId,
          actorId: helper.id,
          turnId: 'helper-combat-turn',
          cycle: 1,
        },
      },
    },
    {
      ...context,
      id: `${round}-combat-end`,
      type: 'combatUpdated',
      payload: {
        combatUpdateIndex: 2,
        update: { type: 'combatEnded', combatId, result },
      },
    },
    {
      ...context,
      id: `${round}-end`,
      type: 'turnEnded',
      payload: { reason: 'passed' },
    },
  ]
  const party = {
    ...group,
    id: helperPresentationId,
    status: 'inSession' as const,
    revision: round + 1,
    lastCombatResult: result,
    members: [
      human,
      { ...helper, player: { ...helper.player, zoneId: destination } },
    ],
    turn: { ...group.turn, round, memberId: human.id },
  }
  const combatUpdates = domainEvents.flatMap((event) =>
    event.type === 'combatUpdated' ? [event.payload.update] : [],
  )
  return { party, domainEvents, combatUpdates }
}
