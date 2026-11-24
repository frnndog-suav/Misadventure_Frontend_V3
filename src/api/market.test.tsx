import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createElement, type ReactNode } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { handlers } from '../mocks/handlers'
import { cardSchema } from './catalog'
import { ApiError, requestJson } from './http'
import {
  labConfigInvalidDetailsSchema,
  labConfigSchema,
  type LabConfig,
} from './labConfig'
import {
  ActionNotAllowedError,
  partySchema,
  playerStateSchema,
  usePartyAction,
  type PartyAction,
} from './parties'
import { pendingRewardSchema } from './randomEvents'
import { partyInSessionFixture } from '../mocks/partyFixtures'

/** CONTRATO §3 FEAT-16 (v0.81): mercado, boosters e expansões (D-62). */

const server = setupServer(...handlers)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const A = 'fixture.arrows'
const P = 'fixture.healing-potion'
const F = 'fixture.fishing-rod'
const BO = 'fixture.booster'
const C = 'fixture.lucky-coin'
const partyId = 'party-os-teimosos'

function setup(id = partyId) {
  const client = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return renderHook(() => usePartyAction(id), { wrapper }).result
}

async function send(action: PartyAction, id = partyId) {
  const result = setup(id)
  let outcome: unknown
  await act(async () => {
    outcome = await result.current.mutateAsync(action).catch((e) => e)
  })
  return outcome
}

async function player(action: PartyAction, id = partyId) {
  const party = await send(action, id)
  if (!(party && typeof party === 'object' && 'members' in party))
    throw new Error('esperava um Party, veio ' + String(party))
  return partySchema.parse(party).members[0]!.player
}

async function refusal(action: PartyAction, id = partyId) {
  const error = await send(action, id)
  expect(error).toBeInstanceOf(ActionNotAllowedError)
  return error as ActionNotAllowedError
}

const visit = (
  operations: Extract<PartyAction, { type: 'visitMarket' }>['operations'],
): PartyAction => ({ type: 'visitMarket', operations })

describe('REQ-73 e REQ-76: estado inicial na cidade com mercado', () => {
  it('REQ-73: a sessão traz o mercado pronto e visitMarket depois de useVault', async () => {
    const party = partySchema.parse(
      await requestJson('POST', `/parties/${partyId}/session`),
    )
    const p = party.members[0]!.player
    expect(p.availableActions).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'useVault',
      'visitMarket',
      'endTurn',
    ])
    expect(p.expansions).toEqual({
      vaultSlots: 0,
      deckSlots: 0,
      tcgFolder: 0,
      purse: 0,
      vaultGold: 0,
    })
    expect(p.lastMarketVisit).toBeNull()
    expect(p.lastBoosterOpening).toBeNull()
    expect(p.market).toMatchObject({
      zoneId: 'fixture.gray-harbor',
      factorPercent: 115,
      stock: [
        { cardId: P, price: 7, copiesPerPurchase: 1 },
        { cardId: A, price: 4, copiesPerPurchase: 10 },
        { cardId: F, price: 23, copiesPerPurchase: 1 },
      ],
      boosters: [{ cardId: BO, price: 30 }],
      services: [
        { expansion: 'vaultSlots', price: 50, capacity: 35 },
        { expansion: 'deckSlots', price: 100, capacity: 11 },
        { expansion: 'tcgFolder', price: 60, capacity: 40 },
        { expansion: 'purse', price: 150, capacity: 600 },
        { expansion: 'vaultGold', price: 500, capacity: 4000 },
      ],
      sellOffers: [],
    })
    expect(p.market?.showcase).toHaveLength(4)
  })

  it('REQ-76: resposta sem os campos da FEAT-16 recebe os valores legados', () => {
    const feat16 = [
      'expansions',
      'market',
      'lastMarketVisit',
      'lastBoosterOpening',
    ]
    const legacy = Object.fromEntries(
      Object.entries(partyInSessionFixture.members[0]!.player).filter(
        ([key]) => !feat16.includes(key),
      ),
    )
    const parsed = playerStateSchema.parse(legacy)
    expect(parsed.expansions).toEqual({
      vaultSlots: 0,
      deckSlots: 0,
      tcgFolder: 0,
      purse: 0,
      vaultGold: 0,
    })
    expect(parsed.market).toBeNull()
    expect(parsed.lastMarketVisit).toBeNull()
    expect(parsed.lastBoosterOpening).toBeNull()
  })

  it('REQ-73: um slot da vitrine com oferta fora de inventory|tcgFolder é recusado', () => {
    const p = structuredClone(partyInSessionFixture.members[0]!.player)
    expect(
      playerStateSchema.safeParse({
        ...p,
        market: {
          ...p.market,
          showcase: [
            {
              slotIndex: 0,
              offer: { cardId: A, price: 1, destination: 'vault' },
            },
          ],
        },
      }).success,
    ).toBe(false)
  })
})

describe('REQ-74: Ir ao Mercado (lote)', () => {
  it('REQ-74: compra no estoque devolve o resultado pronto em lastMarketVisit', async () => {
    const p = await player(
      visit([{ operation: 'buyStock', cardId: A, quantity: 2 }]),
    )
    expect(p.gold).toBe(92)
    expect(p.inventory).toContainEqual({ cardId: A, quantity: 20 })
    expect(p.lastMarketVisit).toEqual({
      zoneId: 'fixture.gray-harbor',
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
    })
    expect(p.market?.sellOffers).toContainEqual({
      source: 'inventory',
      cardId: A,
      owned: 20,
      lotSize: 10,
      price: 1,
    })
  })

  it('REQ-74: venda fora do lote é recusada com o índice da operação', async () => {
    const error = await refusal(
      visit([
        { operation: 'sell', source: 'inventory', cardId: A, quantity: 15 },
      ]),
    )
    expect(error.reason).toBe('notLotMultiple')
    expect(error.cardId).toBe(A)
    expect(error.operationIndex).toBe(0)
  })

  it('REQ-74: lote recusado aponta a segunda operação (notEnoughGold)', async () => {
    const error = await refusal(
      visit([
        { operation: 'buyBooster', cardId: BO, quantity: 1 },
        { operation: 'buyStock', cardId: P, quantity: 1 },
      ]),
    )
    expect(error).toMatchObject({
      reason: 'notEnoughGold',
      cardId: P,
      operationIndex: 1,
    })
  })

  it('REQ-74: cada motivo novo chega como ActionNotAllowedError', async () => {
    expect(
      (
        await refusal(
          visit([
            { operation: 'buyStock', cardId: 'fixture.pickaxe', quantity: 1 },
          ]),
        )
      ).reason,
    ).toBe('notInMarketStock')
    expect(
      (await refusal(visit([{ operation: 'buySingle', slotIndex: 4 }]))).reason,
    ).toBe('showcaseSlotNotFound')
    expect(
      (await refusal(visit([{ operation: 'buySingle', slotIndex: 3 }]))).reason,
    ).toBe('showcaseSlotEmpty')
    expect(
      (
        await refusal(
          visit([{ operation: 'buyExpansion', expansion: 'vaultGold' }]),
        )
      ).reason,
    ).toBe('notEnoughGold')
  })

  it('REQ-74: lote de vendas devolve um resultado por operação', async () => {
    const p = await player(
      visit([
        { operation: 'sell', source: 'inventory', cardId: C, quantity: 1 },
        {
          operation: 'sell',
          source: 'inventory',
          cardId: 'fixture.short-sword',
          quantity: 1,
        },
        {
          operation: 'sell',
          source: 'tcgFolder',
          cardId: 'fixture.strength-basic',
          quantity: 2,
        },
      ]),
    )
    expect(p.lastMarketVisit?.results.map((r) => r.gold)).toEqual([25, 3, 4])
  })

  it('REQ-76: duas expansões do cofre sem ouro recusam a segunda', async () => {
    const error = await refusal(
      visit([
        { operation: 'buyExpansion', expansion: 'vaultSlots' },
        { operation: 'buyExpansion', expansion: 'vaultSlots' },
      ]),
    )
    expect(error).toMatchObject({ reason: 'notEnoughGold', operationIndex: 1 })
  })

  it('REQ-74: ouro de venda acima da bolsa aparece em goldLost', async () => {
    const p = await player(
      visit([
        { operation: 'sell', source: 'inventory', cardId: C, quantity: 1 },
      ]),
    )
    expect(p.gold).toBe(300)
    expect(p.lastMarketVisit?.goldLost).toBe(15)
  })

  it('REQ-74: lote vazio → 400 ACTION_INVALID invalidLength', async () => {
    const error = await send(visit([]))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'ACTION_INVALID',
      details: { fields: [{ field: 'operations', reason: 'invalidLength' }] },
    })
  })
})

describe('REQ-76: expansões', () => {
  it('REQ-76: expansão da bolsa devolve capacidade efetiva e contador', async () => {
    const p = await player(
      visit([{ operation: 'buyExpansion', expansion: 'purse' }]),
    )
    expect(p.gold).toBe(150)
    expect(p.purseCapacity).toBe(600)
    expect(p.expansions.purse).toBe(1)
    expect(p.market?.services).toContainEqual({
      expansion: 'purse',
      price: 300,
      capacity: 1200,
    })
    expect(p.lastMarketVisit?.results).toEqual([
      {
        operation: 'buyExpansion',
        expansion: 'purse',
        capacity: 600,
        gold: -150,
      },
    ])
  })
})

describe('REQ-75: abrir booster', () => {
  it('REQ-75: no Preparar, as cartas e os destinos vêm em lastBoosterOpening', async () => {
    const p = await player(
      { type: 'prepare', operation: 'openBooster', cardId: BO },
      'party-com-booster',
    )
    expect(p.inventory.some((slot) => slot.cardId === BO)).toBe(false)
    expect(p.lastBoosterOpening?.boosterCardId).toBe(BO)
    expect(p.lastBoosterOpening?.via).toBe('prepare')
    expect(p.lastBoosterOpening?.cards).toHaveLength(8)
    for (const card of p.lastBoosterOpening!.cards)
      expect(['tcgFolder', 'inventory']).toContain(card.destination)
  })

  it('REQ-75: openBooster de carta que não é booster → notBooster', async () => {
    const error = await refusal(
      { type: 'prepare', operation: 'openBooster', cardId: P },
      'party-com-booster',
    )
    expect(error.reason).toBe('notBooster')
  })

  it('REQ-75: no Usar cofre, as 8 cartas vão para o cofre', async () => {
    const p = await player({
      type: 'useVault',
      operations: [
        { operation: 'store', cardId: BO, quantity: 1 },
        { operation: 'openBooster', cardId: BO },
      ],
    })
    expect(p.lastBoosterOpening?.via).toBe('useVault')
    expect(p.lastBoosterOpening?.cards).toHaveLength(8)
    for (const card of p.lastBoosterOpening!.cards)
      expect(card.destination).toBe('vault')
  })

  it('REQ-75: entrega pendente aceita a fonte booster', () => {
    expect(
      pendingRewardSchema.parse({
        id: 'r1',
        memberId: 'member-lia',
        cardId: P,
        origin: { type: 'fixed' },
        source: { type: 'booster', boosterCardId: BO },
        destination: 'inventory',
        discardOptions: [],
        decisionDeadlineAt: null,
      }).source,
    ).toEqual({ type: 'booster', boosterCardId: BO })
  })
})

describe('REQ-72: campos do mercado nas cartas', () => {
  it('REQ-72: Porto Cinzento traz o mercado e as outras zonas não', async () => {
    const harbor = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.gray-harbor'),
    )
    expect(harbor).toMatchObject({
      zoneActions: [
        'startEvent',
        'scavenge',
        'useVault',
        'visitMarket',
        'saveRespawnPoint',
      ],
      market: { stock: [P, A, F], singles: true },
    })
    const grove = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.whispering-grove'),
    )
    expect(grove).toMatchObject({ market: null })
  })

  it('REQ-72: flechas, booster e preços das cartas do contrato', async () => {
    const get = async (id: string) =>
      cardSchema.parse(await requestJson('GET', '/catalog/cards/' + id))
    expect(await get(A)).toMatchObject({
      itemCategory: 'consumable',
      stockPrice: 3,
      stockQuantity: 10,
      boosterCollectionId: null,
    })
    expect(await get(BO)).toMatchObject({
      itemCategory: 'booster',
      boosterCollectionId: 'fixture',
      stockPrice: null,
    })
    expect(await get(P)).toMatchObject({ stockPrice: 6 })
    expect(await get(F)).toMatchObject({ stockPrice: 20 })
    expect(await get('fixture.short-sword')).toMatchObject({
      priceMultiplier: 1.2,
    })
  })

  it('REQ-72: carta sem os campos novos recebe os valores legados', () => {
    expect(
      cardSchema.parse({
        type: 'attribute',
        id: 'x.a',
        collectionId: 'x',
        name: 'A',
        flavorText: null,
        rarity: 'common',
        attributeKind: 'basic',
        attributes: ['strength'],
        effects: [],
      }),
    ).toMatchObject({ priceMultiplier: 1 })
    expect(
      cardSchema.parse({
        type: 'item',
        id: 'x.i',
        collectionId: 'x',
        name: 'I',
        flavorText: null,
        rarity: 'common',
        itemCategory: 'relic',
        tags: [],
        effects: [],
        toolKind: null,
        scavengeZoneTypes: [],
        scavengeTool: null,
      }),
    ).toMatchObject({
      priceMultiplier: 1,
      stockPrice: null,
      stockQuantity: 1,
      boosterCollectionId: null,
    })
  })
})

describe('REQ-71: valores do mercado no laboratório', () => {
  it('REQ-71: GET traz as chaves da FEAT-16 com padrões e limites', async () => {
    const config: LabConfig = labConfigSchema.parse(
      await requestJson('GET', '/lab/config'),
    )
    expect(config.values.boosterPrice).toBe(30)
    expect(config.defaults.singlesPoolSize).toBe(20)
    expect(config.limits.boosterChanceCommon).toEqual({ min: 0, max: 1000 })
    expect(config.limits.marketFactorMinPercent).toEqual({ min: 1, max: 1000 })
  })

  it('REQ-71: as cinco chances que não somam 1000 → sumMismatch', async () => {
    const error = await requestJson('PATCH', '/lab/config', {
      boosterChanceCommon: 700,
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    const details = labConfigInvalidDetailsSchema.parse(
      (error as ApiError).details,
    )
    expect(details.fields).toEqual(
      [
        'boosterChanceCommon',
        'boosterChanceUncommon',
        'boosterChanceRare',
        'boosterChanceEpic',
        'boosterChanceLegendary',
      ].map((field) => ({ field, reason: 'sumMismatch' })),
    )
  })

  it('REQ-71: fator mínimo acima do máximo → minAboveMax nos dois', async () => {
    const error = await requestJson('PATCH', '/lab/config', {
      marketFactorMinPercent: 130,
    }).catch((e: unknown) => e)
    expect((error as ApiError).details).toEqual({
      fields: [
        { field: 'marketFactorMinPercent', reason: 'minAboveMax' },
        { field: 'marketFactorMaxPercent', reason: 'minAboveMax' },
      ],
    })
  })
})
