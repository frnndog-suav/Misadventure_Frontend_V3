import { setupServer } from 'msw/node'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { cardSchema } from './catalog'
import { collectionExportSchema, editorCardSchema } from './editor'
import { partySchema } from './parties'
import {
  circulationDimension,
  circulationMarket,
  legacyCirculationMarket,
} from '../mocks/collectionCirculationFixtures'
import { handlers } from '../mocks/handlers'

const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterAll(() => server.close())

const api = 'http://localhost'

it.each([
  [
    'prepare',
    { type: 'prepare', operation: 'openBooster', cardId: 'fixture.booster' },
  ],
  [
    'useVault',
    {
      type: 'useVault',
      operations: [{ operation: 'openBooster', cardId: 'fixture.booster' }],
    },
  ],
] as const)(
  'REQ-100: %s returns original card IDs and destinations',
  async (via, action) => {
    const scenario = via === 'prepare' ? 'prepare' : 'vault'
    const response = await fetch(
      `${api}/parties/party-msw-feat-33-${scenario}/actions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      },
    )
    const party = partySchema.parse(await response.json())
    const opening = party.members[0].player.lastBoosterOpening!
    expect(opening).toMatchObject({ via, boosterCardId: 'fixture.booster' })
    expect(opening.cards).toContainEqual({
      cardId: 'fixture.strength-basic',
      destination: via === 'prepare' ? 'tcgFolder' : 'vault',
    })
    expect(
      opening.cards.every(({ cardId }) => cardId.startsWith('fixture.')),
    ).toBe(true)
  },
)

it('REQ-97: catalog, editor and export retain the configured lists', async () => {
  const catalog = await fetch(`${api}/catalog/cards/${circulationDimension.id}`)
  const editor = await fetch(
    `${api}/lab/content/cards/${circulationDimension.id}`,
  )
  const card = cardSchema.parse(await catalog.json())
  const editorCard = editorCardSchema.parse(await editor.json())
  expect(card).toEqual(circulationDimension)
  expect(editorCard.card).toEqual(card)
  expect(
    collectionExportSchema.parse({
      formatVersion: 1,
      collection: {
        id: circulationDimension.collectionId,
        name: 'Current',
        description: '',
      },
      cards: [editorCard],
    }).cards,
  ).toEqual([editorCard])
})

it('REQ-98, REQ-99 e REQ-101: mixed offers, single purchase and atomic batch refusal', async () => {
  const path = `${api}/parties/${circulationMarket.id}`
  const getParty = async () =>
    partySchema.parse(await (await fetch(path)).json())
  const send = (operations: object[]) =>
    fetch(`${path}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visitMarket', operations }),
    })
  const before = await getParty()
  const { market } = before.members[0].player
  const legacy = partySchema.parse(
    await (await fetch(`${api}/parties/${legacyCirculationMarket.id}`)).json(),
  )
  expect(market?.boosters.map(({ cardId }) => cardId)).toEqual([
    'fixture.booster',
    'msw-current.booster',
    'msw-extended.booster',
  ])
  expect(legacy.members[0].player.market?.boosters).toEqual([
    market!.boosters[1],
  ])
  const single = { operation: 'buySingle', slotIndex: 0 }
  const rejected = await send([
    single,
    { operation: 'buyBooster', cardId: 'msw-outside.booster', quantity: 1 },
  ])
  expect(rejected.status).toBe(409)
  expect(await rejected.json()).toMatchObject({
    error: {
      code: 'ACTION_NOT_ALLOWED',
      details: { reason: 'notMarketBooster', operationIndex: 1 },
    },
  })
  expect(await getParty()).toEqual(before)
  const boughtSingle = partySchema.parse(await (await send([single])).json())
  expect(boughtSingle.members[0].player.lastMarketVisit?.results).toEqual([
    {
      ...single,
      cardId: 'fixture.strength-basic',
      destination: 'tcgFolder',
      gold: -6,
    },
  ])
  const purchases = market!.boosters.map(({ cardId }) => ({
    operation: 'buyBooster',
    cardId,
    quantity: 1,
  }))
  const boughtBatch = partySchema.parse(await (await send(purchases)).json())
  expect(boughtBatch.members[0].player.lastMarketVisit?.results).toMatchObject(
    purchases,
  )
})
