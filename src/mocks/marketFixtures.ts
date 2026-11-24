import type { Party, PlayerState } from '../api/parties'
import { partyInSessionFixture } from './partyFixtures'

/**
 * Respostas fixas dos cenários do CONTRATO §3 FEAT-16 (v0.81), sem estado
 * (D-29, D-62 item 5). Preços, capacidades e resultados são os do contrato
 * ou valores de exemplo prontos; nada é calculado aqui (Princípio 3).
 */

const A = 'fixture.arrows'
const C = 'fixture.lucky-coin'
const BO = 'fixture.booster'
const base = partyInSessionFixture.members[0]!
const baseMarket = base.player.market!

function withPlayer(id: string, player: Partial<PlayerState>): Party {
  return {
    ...partyInSessionFixture,
    id,
    members: [{ ...base, player: { ...base.player, ...player } }],
    savedAt: '2026-11-23T21:00:00.000Z',
  }
}

const spent = { ...partyInSessionFixture.turn, actionPoints: 2 }

/** "Estoque e lote": 2 compras de Flechas com 100 de ouro. */
export const partyMarketArrowsFixture: Party = {
  ...withPlayer(partyInSessionFixture.id, {
    gold: 92,
    inventory: [{ cardId: A, quantity: 20 }],
    market: {
      ...baseMarket,
      sellOffers: [
        { source: 'inventory', cardId: A, owned: 20, lotSize: 10, price: 1 },
      ],
    },
    lastMarketVisit: {
      zoneId: baseMarket.zoneId,
      results: [
        {
          operation: 'buyStock',
          cardId: A,
          quantity: 2,
          copiesReceived: 20,
          gold: -8,
        },
      ],
      goldLost: 0,
    },
  }),
  turn: spent,
}

/** "Ouro perdido": vender a Moeda com 290 na bolsa de 300. */
export const partyMarketGoldLostFixture: Party = {
  ...withPlayer(partyInSessionFixture.id, {
    gold: 300,
    lastMarketVisit: {
      zoneId: baseMarket.zoneId,
      results: [
        {
          operation: 'sell',
          source: 'inventory',
          cardId: C,
          quantity: 1,
          gold: 25,
        },
      ],
      goldLost: 15,
    },
  }),
  turn: spent,
}

/** "Expansões": bolsa comprada com 300 de ouro. */
export const partyMarketPurseFixture: Party = {
  ...withPlayer(partyInSessionFixture.id, {
    gold: 150,
    purseCapacity: 600,
    expansions: { ...base.player.expansions, purse: 1 },
    market: {
      ...baseMarket,
      services: baseMarket.services.map((service) =>
        service.expansion === 'purse'
          ? { expansion: 'purse', price: 300, capacity: 1200 }
          : service,
      ),
    },
    lastMarketVisit: {
      zoneId: baseMarket.zoneId,
      results: [
        {
          operation: 'buyExpansion',
          expansion: 'purse',
          capacity: 600,
          gold: -150,
        },
      ],
      goldLost: 0,
    },
  }),
  turn: spent,
}

/** "Venda": Moeda, Espada Curta e 2 Força da pasta, num lote. */
export const partyMarketSaleFixture: Party = {
  ...withPlayer(partyInSessionFixture.id, {
    gold: 42,
    lastMarketVisit: {
      zoneId: baseMarket.zoneId,
      results: [
        {
          operation: 'sell',
          source: 'inventory',
          cardId: C,
          quantity: 1,
          gold: 25,
        },
        {
          operation: 'sell',
          source: 'inventory',
          cardId: 'fixture.short-sword',
          quantity: 1,
          gold: 3,
        },
        {
          operation: 'sell',
          source: 'tcgFolder',
          cardId: 'fixture.strength-basic',
          quantity: 2,
          gold: 4,
        },
      ],
      goldLost: 0,
    },
  }),
  turn: spent,
}

/** Grupo com 1 booster no inventário e `prepare` (dev e testes, D-62 item 5). */
export const partyWithBoosterFixture: Party = withPlayer('party-com-booster', {
  inventory: [{ cardId: BO, quantity: 1 }],
  market: {
    ...baseMarket,
    sellOffers: [
      { source: 'inventory', cardId: BO, owned: 1, lotSize: 1, price: 15 },
    ],
  },
  availableActions: [
    'move',
    'recover',
    'prepare',
    'adjustDeck',
    'useVault',
    'visitMarket',
    'endTurn',
  ],
})

/** 8 cartas de exemplo e destinos prontos; a última é o slot Incomum ou melhor. */
const boosterCards: {
  cardId: string
  destination: 'tcgFolder' | 'inventory'
}[] = [
  { cardId: 'fixture.strength-basic', destination: 'tcgFolder' },
  { cardId: 'fixture.endurance-basic', destination: 'tcgFolder' },
  { cardId: 'fixture.healing-potion', destination: 'inventory' },
  { cardId: 'fixture.dexterity-basic', destination: 'tcgFolder' },
  { cardId: 'fixture.iron-ore', destination: 'inventory' },
  { cardId: 'fixture.strength-basic', destination: 'tcgFolder' },
  { cardId: 'fixture.silver-fish', destination: 'inventory' },
  { cardId: 'fixture.blade-of-dusk', destination: 'inventory' },
]

/** "Abrir booster" no Preparar: atributos → pasta; recursos → inventário. */
export const partyBoosterOpenedFixture: Party = withPlayer(
  partyWithBoosterFixture.id,
  {
    ...partyWithBoosterFixture.members[0]!.player,
    inventory: [
      { cardId: 'fixture.healing-potion', quantity: 1 },
      { cardId: 'fixture.iron-ore', quantity: 1 },
      { cardId: 'fixture.silver-fish', quantity: 1 },
      { cardId: 'fixture.blade-of-dusk', quantity: 1 },
    ],
    tcgFolder: [
      { cardId: 'fixture.dexterity-basic', copies: 1 },
      { cardId: 'fixture.endurance-basic', copies: 1 },
      { cardId: 'fixture.strength-basic', copies: 2 },
    ],
    lastBoosterOpening: {
      boosterCardId: BO,
      via: 'prepare',
      cards: boosterCards,
    },
  },
)

/** "Booster no cofre": guardar e abrir; as 8 cartas ficam em `vault.slots`. */
export const partyVaultBoosterOpenedFixture: Party = {
  ...withPlayer(partyInSessionFixture.id, {
    vault: {
      ...base.player.vault,
      slots: [
        { cardId: 'fixture.strength-basic', quantity: 2 },
        { cardId: 'fixture.endurance-basic', quantity: 1 },
        { cardId: 'fixture.healing-potion', quantity: 1 },
        { cardId: 'fixture.dexterity-basic', quantity: 1 },
        { cardId: 'fixture.iron-ore', quantity: 1 },
        { cardId: 'fixture.silver-fish', quantity: 1 },
        { cardId: 'fixture.blade-of-dusk', quantity: 1 },
      ],
    },
    lastBoosterOpening: {
      boosterCardId: BO,
      via: 'useVault',
      cards: boosterCards.map(({ cardId }) => ({
        cardId,
        destination: 'vault',
      })),
    },
  }),
  turn: spent,
}

type Refusal = {
  reason: string
  cardId?: string
  operationIndex?: number
}

/** 409 `ACTION_NOT_ALLOWED` de um cenário do contrato. */
export function marketRefusalFixture(details: Refusal) {
  return {
    error: {
      code: 'ACTION_NOT_ALLOWED',
      message: 'Esta ação não é permitida agora.',
      details,
    },
  } as const
}

/** 400 `ACTION_INVALID` dos cenários "Formato". */
export function marketInvalidFixture(field: string, reason: string) {
  return {
    error: {
      code: 'ACTION_INVALID',
      message: 'Ação inválida.',
      details: { fields: [{ field, reason }] },
    },
  } as const
}
