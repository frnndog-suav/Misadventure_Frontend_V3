import { http, HttpResponse } from 'msw'
import type { EditorCard } from '../api/editor'
import type { MarketOperation } from '../api/market'
import type { Party, PlayerState } from '../api/parties'
import { fixtureCardsFixture, testDimensionFixture } from './catalogFixtures'
import {
  marketRefusalFixture,
  partyBoosterOpenedFixture,
  partyVaultBoosterOpenedFixture,
} from './marketFixtures'
import { partyInSessionFixture } from './partyFixtures'

const own = 'msw-current'
const extended = 'msw-extended'
const reprint = 'fixture'
const outside = 'msw-outside'

export const circulationDimension = {
  ...testDimensionFixture,
  id: `${own}.dimension`,
  collectionId: own,
  releaseOrder: 4,
  extendedCollectionIds: [extended],
  reprintCollectionIds: [reprint],
}

const editorDimension = {
  status: 'published',
  card: circulationDimension,
} satisfies EditorCard

const originalBooster = fixtureCardsFixture.find(
  (card) => card.type === 'item' && card.id === 'fixture.booster',
)!
const extraBoosters = [
  [own, 'Booster da coleção atual'],
  [extended, 'Booster da coleção estendida'],
  [outside, 'Booster fora de oferta'],
].map(([collectionId, name]) => ({
  ...originalBooster,
  name,
  id: `${collectionId}.booster`,
  collectionId,
  boosterCollectionId: collectionId,
}))
const [ownBooster, extendedBooster, outsideBooster] = extraBoosters
const member = partyInSessionFixture.members[0]
const player = member.player
const baseMarket = player.market!
const [single] = baseMarket.showcase!
const offers = [
  { cardId: originalBooster.id, price: 30 },
  { cardId: ownBooster.id, price: 34 },
  { cardId: extendedBooster.id, price: 28 },
]

function partyWithMarket(id: string, boosters: typeof offers): Party {
  return {
    ...partyInSessionFixture,
    id,
    dimension: {
      ...partyInSessionFixture.dimension,
      dimensionCardId: circulationDimension.id,
    },
    members: [
      {
        ...member,
        player: {
          ...player,
          gold: 150,
          market: { ...baseMarket, boosters, showcase: [single] },
        },
      },
    ],
  }
}

export const circulationMarket = partyWithMarket('party-msw-feat-33', offers)
export const legacyCirculationMarket = partyWithMarket(
  'party-msw-feat-33-legacy',
  [offers[1]],
)
const marketPlayer = circulationMarket.members[0].player
const buySingle = {
  operation: 'buySingle',
  slotIndex: single.slotIndex,
} as const
const buyBoosters = offers.map(({ cardId }) => ({
  operation: 'buyBooster' as const,
  cardId,
  quantity: 1,
}))
const rejectedBooster: MarketOperation = {
  operation: 'buyBooster',
  cardId: outsideBooster.id,
  quantity: 1,
}

function afterPurchase(changes: Partial<PlayerState>): Party {
  return {
    ...circulationMarket,
    savedAt: '2026-11-26T18:01:00.000Z',
    turn: { ...circulationMarket.turn, actionPoints: 2 },
    members: [{ ...member, player: { ...marketPlayer, ...changes } }],
  }
}

const boughtBoosters = afterPurchase({
  gold: 58,
  inventory: [
    ...marketPlayer.inventory,
    ...offers.map(({ cardId }) => ({ cardId, quantity: 1 })),
  ],
  lastMarketVisit: {
    zoneId: baseMarket.zoneId,
    goldLost: 0,
    results: offers.map(({ cardId, price }) => ({
      operation: 'buyBooster',
      cardId,
      quantity: 1,
      gold: -price,
      received: [{ space: 'inventory', quantity: 1 }],
    })),
  },
})

const singleOffer = single.offer!
const boughtSingle = afterPurchase({
  gold: 144,
  tcgFolder: [{ cardId: singleOffer.cardId, copies: 1 }],
  market: { ...marketPlayer.market!, showcase: [{ ...single, offer: null }] },
  lastMarketVisit: {
    zoneId: baseMarket.zoneId,
    goldLost: 0,
    results: [
      {
        ...buySingle,
        cardId: singleOffer.cardId,
        destination: singleOffer.destination,
        gold: -singleOffer.price,
      },
    ],
  },
})

const prepareParty: Party = {
  ...circulationMarket,
  id: 'party-msw-feat-33-prepare',
  members: [
    {
      ...member,
      player: {
        ...marketPlayer,
        inventory: [{ cardId: originalBooster.id, quantity: 1 }],
        availableActions: [...marketPlayer.availableActions, 'prepare'],
      },
    },
  ],
}
const legacyPlayer = legacyCirculationMarket.members[0].player
const vaultParty: Party = {
  ...legacyCirculationMarket,
  id: 'party-msw-feat-33-vault',
  members: [
    {
      ...member,
      player: {
        ...legacyPlayer,
        vault: {
          ...legacyPlayer.vault,
          slots: [{ cardId: originalBooster.id, quantity: 1 }],
        },
      },
    },
  ],
}
const prepared = partyBoosterOpenedFixture.members[0].player
const vaultOpened = partyVaultBoosterOpenedFixture.members[0].player

/** Respostas controladas para o cliente. A vigência e o pool são regras do backend. */
export const collectionCirculationHandlers = [
  http.get(`*/catalog/cards/${circulationDimension.id}`, () =>
    HttpResponse.json(circulationDimension),
  ),
  http.get(`*/lab/content/cards/${circulationDimension.id}`, () =>
    HttpResponse.json(editorDimension),
  ),
  ...extraBoosters.map((card) =>
    http.get(`*/catalog/cards/${card.id}`, () => HttpResponse.json(card)),
  ),
  ...[
    circulationMarket,
    legacyCirculationMarket,
    prepareParty,
    vaultParty,
  ].flatMap((party) => [
    http.get(`*/parties/${party.id}`, () => HttpResponse.json(party)),
    http.post(`*/parties/${party.id}/session`, () => HttpResponse.json(party)),
  ]),
  http.post(`*/parties/${prepareParty.id}/actions`, async ({ request }) => {
    const action = await request.json()
    if (
      !action ||
      typeof action !== 'object' ||
      !('type' in action) ||
      action.type !== 'prepare' ||
      !('operation' in action) ||
      action.operation !== 'openBooster' ||
      !('cardId' in action) ||
      action.cardId !== originalBooster.id
    )
      return
    return HttpResponse.json({
      ...prepareParty,
      members: [
        {
          ...member,
          player: {
            ...prepareParty.members[0].player,
            inventory: prepared.inventory,
            tcgFolder: prepared.tcgFolder,
            lastBoosterOpening: prepared.lastBoosterOpening,
          },
        },
      ],
    } satisfies Party)
  }),
  http.post(`*/parties/${vaultParty.id}/actions`, async ({ request }) => {
    const action = await request.json()
    if (
      !action ||
      typeof action !== 'object' ||
      !('type' in action) ||
      action.type !== 'useVault' ||
      !('operations' in action) ||
      !Array.isArray(action.operations) ||
      action.operations.length !== 1
    )
      return
    const [operation] = action.operations
    if (
      operation?.operation !== 'openBooster' ||
      operation.cardId !== originalBooster.id
    )
      return
    return HttpResponse.json({
      ...vaultParty,
      turn: partyVaultBoosterOpenedFixture.turn,
      members: [
        {
          ...member,
          player: {
            ...vaultParty.members[0].player,
            vault: vaultOpened.vault,
            lastBoosterOpening: vaultOpened.lastBoosterOpening,
          },
        },
      ],
    } satisfies Party)
  }),
  http.post(
    `*/parties/${circulationMarket.id}/actions`,
    async ({ request }) => {
      const action = await request.json()
      if (
        !action ||
        typeof action !== 'object' ||
        !('type' in action) ||
        action.type !== 'visitMarket' ||
        !('operations' in action) ||
        !Array.isArray(action.operations)
      )
        return
      const operations = action.operations
      const matches = (expected: MarketOperation[]) =>
        operations.length === expected.length &&
        expected.every((operation, index) =>
          Object.entries(operation).every(
            ([key, value]) => operations[index]?.[key] === value,
          ),
        )
      if (matches([buySingle, rejectedBooster])) {
        return HttpResponse.json(
          marketRefusalFixture({
            reason: 'notMarketBooster',
            operationIndex: 1,
            cardId: outsideBooster.id,
          }),
          { status: 409 },
        )
      }
      if (matches(buyBoosters)) return HttpResponse.json(boughtBoosters)
      if (matches([buySingle])) return HttpResponse.json(boughtSingle)
    },
  ),
]
