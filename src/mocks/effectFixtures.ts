import type { Party } from '../api/parties'
import { partyInSessionFixture } from './partyFixtures'

/** CONTRATO v0.52: estados estáticos de ativação, sem executar efeitos no MSW. */
const member = partyInSessionFixture.members[0]!

export const partyEffectsReadyFixture: Party = {
  ...partyInSessionFixture,
  turn: { ...partyInSessionFixture.turn, actionPoints: 0 },
  members: [
    {
      ...member,
      player: {
        ...member.player,
        health: 17,
        inventory: [
          { cardId: 'fixture.healing-potion', quantity: 2 },
          { cardId: 'fixture.strength-tonic', quantity: 1 },
        ],
        availableActions: ['prepare', 'endTurn'],
        activatableEffects: [
          {
            cardId: 'fixture.healing-potion',
            effectIndex: 0,
            source: 'inventory',
            handPayment: null,
          },
          {
            cardId: 'fixture.strength-tonic',
            effectIndex: 0,
            source: 'inventory',
            handPayment: null,
          },
        ],
      },
    },
  ],
}

export const partyPotionActivatedFixture: Party = {
  ...partyEffectsReadyFixture,
  members: [
    {
      ...member,
      player: {
        ...partyEffectsReadyFixture.members[0]!.player,
        health: 22,
        inventory: [
          { cardId: 'fixture.healing-potion', quantity: 1 },
          { cardId: 'fixture.strength-tonic', quantity: 1 },
        ],
      },
    },
  ],
}

export const partyTonicActivatedFixture: Party = {
  ...partyEffectsReadyFixture,
  members: [
    {
      ...member,
      player: {
        ...partyEffectsReadyFixture.members[0]!.player,
        inventory: [{ cardId: 'fixture.healing-potion', quantity: 2 }],
        effectiveModifiers: { ...member.player.effectiveModifiers, attack: 9 },
        activatableEffects: [
          {
            cardId: 'fixture.healing-potion',
            effectIndex: 0,
            source: 'inventory',
            handPayment: null,
          },
        ],
        statuses: [
          {
            statusId: 'status-tonic',
            sourceCardId: 'fixture.strength-tonic',
            effectIndex: 0,
            text: '+3 de Ataque durante 2 vezes suas.',
            mark: 'buff',
            activation: [
              {
                kind: 'modifierFlat',
                changes: [{ modifier: 'attack', amount: 3 }],
              },
            ],
            duration: { kind: 'forOwnTurns', turns: 2 },
            remaining: 2,
          },
        ],
      },
    },
  ],
}
