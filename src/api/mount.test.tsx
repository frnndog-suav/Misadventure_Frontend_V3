import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createElement, type ReactNode } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { handlers } from '../mocks/handlers'
import { cardSchema, collectionSummarySchema } from './catalog'
import { combatStateSchema, triggeredEffectChoiceSchema } from './combat'
import { activationSchema } from './effects'
import { ApiError, requestJson } from './http'
import { labConfigSchema } from './labConfig'
import { LabGrantNoSpaceError, useLabGrant } from './labGrant'
import {
  boosterOpeningResultSchema,
  marketOperationResultSchema,
} from './market'
import {
  ActionNotAllowedError,
  actionNotAllowedDetailsSchema,
  partySchema,
  playerStateSchema,
  usePartyAction,
  type PartyAction,
} from './parties'
import { pendingRewardSchema } from './randomEvents'

/** CONTRATO §3 FEAT-18 (v0.90): montaria, Estábulo, Transferir e destinos prontos (D-64). */

const server = setupServer(...handlers)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const H = 'fixture.plow-horse'
const WP = 'fixture.war-pony'
const P = 'fixture.healing-potion'
const STR = 'fixture.strength-basic'
const stable = 'party-estabulo'
const mounted = 'party-montaria'

function wrapper() {
  const client = new QueryClient()
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

async function send(action: PartyAction, id: string) {
  const { result } = renderHook(() => usePartyAction(id), {
    wrapper: wrapper(),
  })
  let outcome: unknown
  await act(async () => {
    outcome = await result.current.mutateAsync(action).catch((e) => e)
  })
  return outcome
}

async function player(action: PartyAction, id: string) {
  const party = await send(action, id)
  return partySchema.parse(party).members[0]!.player
}

async function refusal(action: PartyAction, id: string) {
  const error = await send(action, id)
  expect(error).toBeInstanceOf(ActionNotAllowedError)
  return error as ActionNotAllowedError
}

async function invalid(action: unknown, id: string) {
  const error = await send(action as PartyAction, id)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).code).toBe('ACTION_INVALID')
  return (error as ApiError).details
}

async function get(id: string) {
  return partySchema.parse(await requestJson('GET', `/parties/${id}`))
    .members[0]!.player
}

describe('REQ-82: valores da montaria e doação', () => {
  it('REQ-82: o LabConfig traz as 7 chaves com padrões e limites do contrato', async () => {
    const config = labConfigSchema.parse(
      await requestJson('GET', '/lab/config'),
    )
    expect(config.values).toMatchObject({
      mountPriceCommon: 80,
      mountPriceUncommon: 150,
      mountPriceRare: 280,
      mountPriceEpic: 550,
      mountPriceLegendary: 1100,
      mountInventorySlots: 4,
      mountFolderCapacity: 10,
    })
    expect(config.defaults.mountFolderCapacity).toBe(10)
    expect(config.limits.mountPriceRare).toEqual({ min: 0, max: 1000000 })
    expect(config.limits.mountInventorySlots).toEqual({ min: 0, max: 100 })
    expect(config.limits.mountFolderCapacity).toEqual({ min: 0, max: 1000 })
  })

  it('REQ-82: config de antes da FEAT-18 lê os padrões', async () => {
    const config = labConfigSchema.parse(
      await requestJson('GET', '/lab/config'),
    )
    const legacy = { ...config.values } as Record<string, unknown>
    delete legacy.mountPriceRare
    delete legacy.mountInventorySlots
    const parsed = labConfigSchema.parse({ ...config, values: legacy })
    expect(parsed.values.mountPriceRare).toBe(280)
    expect(parsed.values.mountInventorySlots).toBe(4)
  })

  async function grant(partyId: string, cardId: string) {
    const { result } = renderHook(() => useLabGrant(), { wrapper: wrapper() })
    let outcome: unknown
    await act(async () => {
      outcome = await result.current
        .mutateAsync({
          partyId,
          memberId: 'member-lia',
          grant: { type: 'card', cardId, quantity: 1 },
        })
        .catch((e) => e)
    })
    return outcome
  }

  it('REQ-82: a doação de montaria devolve o membro com a montaria', async () => {
    const party = partySchema.parse(await grant('party-os-teimosos', H))
    expect(party.members[0]!.player.mount).toEqual({
      cardId: H,
      inventory: [],
      inventoryCapacity: 4,
      tcgFolder: [],
      tcgFolderCapacity: 10,
    })
  })

  it('REQ-82: doar montaria a quem já tem → LAB_GRANT_NO_SPACE mountAlreadyOwned', async () => {
    const error = await grant(mounted, WP)
    expect(error).toBeInstanceOf(LabGrantNoSpaceError)
    expect((error as LabGrantNoSpaceError).reason).toBe('mountAlreadyOwned')
  })
})

describe('REQ-83: carta de montaria e Estábulo da zona', () => {
  it('REQ-83: o catálogo devolve as montarias da fixture', async () => {
    const horse = cardSchema.parse(
      await requestJson('GET', `/catalog/cards/${H}`),
    )
    expect(horse).toEqual({
      type: 'mount',
      id: H,
      collectionId: 'fixture',
      name: 'Cavalo de Arado',
      flavorText: null,
      rarity: 'rare',
      mountTypes: ['beast'],
      creature: 'Cavalo',
      effects: [],
      abilities: [],
    })
    const pony = cardSchema.parse(
      await requestJson('GET', `/catalog/cards/${WP}`),
    )
    expect(pony).toMatchObject({ type: 'mount', creature: 'Pônei' })
    if (pony.type !== 'mount') throw new Error('montaria')
    expect(pony.effects).toHaveLength(1)
    expect(pony.abilities).toHaveLength(1)
  })

  it('REQ-83: o filtro por tipo mount devolve as 2 montarias', async () => {
    const cards = (await requestJson(
      'GET',
      '/catalog/collections/fixture/cards?type=mount',
    )) as unknown[]
    expect(cards.map((card) => cardSchema.parse(card).id)).toEqual([H, WP])
  })

  it('REQ-83: cardCounts.mount = 2; resumo antigo lê 0', async () => {
    const [fixture] = (await requestJson(
      'GET',
      '/catalog/collections',
    )) as unknown[]
    expect(collectionSummarySchema.parse(fixture).cardCounts.mount).toBe(2)
    const legacy = collectionSummarySchema.parse(fixture)
    const counts = { ...legacy.cardCounts } as Record<string, number>
    delete counts.mount
    expect(
      collectionSummarySchema.parse({ ...legacy, cardCounts: counts })
        .cardCounts.mount,
    ).toBe(0)
  })

  it('REQ-83: a Velha Mina é Rural com Estábulo; o Porto Cinzento tem mounts vazio', async () => {
    const mine = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.old-mine'),
    )
    expect(mine).toMatchObject({
      type: 'zone',
      zoneType: 'rural',
      zoneActions: ['startEvent', 'visitMarket'],
      market: { stock: [], singles: false, mounts: [H] },
    })
    const harbor = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.gray-harbor'),
    )
    expect(harbor).toMatchObject({ market: { mounts: [] } })
  })

  it('REQ-83: mercado de zona legado lê mounts []', () => {
    const zone = cardSchema.parse({
      type: 'zone',
      id: 'z',
      collectionId: 'c',
      title: 'Z',
      zoneType: 'urban',
      location: 'L',
      connectionArrows: 4,
      arrowLayout: null,
      zoneActions: [],
      effects: [],
      market: { stock: [], singles: true },
    })
    expect(zone).toMatchObject({ market: { mounts: [] } })
  })

  it('REQ-89: a ativação loseMount é aceita', () => {
    expect(activationSchema.parse({ kind: 'loseMount' })).toEqual({
      kind: 'loseMount',
    })
  })
})

describe('REQ-84: estado da montaria', () => {
  it('REQ-84: sem montaria, mount null e rotas diretas', async () => {
    const p = await get('party-os-teimosos')
    expect(p.mount).toBeNull()
    expect(p.moveRoutes).toEqual(
      p.moveTargets.map((zoneId) => ({ zoneId, direct: true, via: [] })),
    )
  })

  it('REQ-84: saves antigos leem mount null e moveRoutes []', async () => {
    const p = await get('party-os-teimosos')
    const legacy = { ...p } as Record<string, unknown>
    delete legacy.mount
    delete legacy.moveRoutes
    const parsed = playerStateSchema.parse(legacy)
    expect(parsed.mount).toBeNull()
    expect(parsed.moveRoutes).toEqual([])
  })

  it('REQ-84: o grupo com montaria traz inventário extra e pasta extra', async () => {
    const p = await get(mounted)
    expect(p.mount).toMatchObject({
      cardId: WP,
      inventory: [{ cardId: P, quantity: 2 }],
      inventoryCapacity: 4,
      tcgFolder: [{ cardId: STR, copies: 1 }],
      tcgFolderCapacity: 10,
    })
  })
})

describe('REQ-85: Transferir', () => {
  it('REQ-85: fromMount para o inventário ocupado → inventoryFull', async () => {
    const error = await refusal(
      {
        type: 'prepare',
        operation: 'transferMount',
        direction: 'fromMount',
        space: 'inventory',
        cardId: P,
        quantity: 2,
      },
      mounted,
    )
    expect(error.reason).toBe('inventoryFull')
  })

  it('REQ-85: toMount de atributo que não está na pasta → notOwned', async () => {
    const error = await refusal(
      {
        type: 'prepare',
        operation: 'transferMount',
        direction: 'toMount',
        space: 'tcgFolder',
        cardId: 'fixture.endurance-basic',
        quantity: 1,
      },
      mounted,
    )
    expect(error.reason).toBe('notOwned')
  })

  it('REQ-85: toMount da pasta → 200 com a carta na pasta extra e os PA iguais', async () => {
    const before = partySchema.parse(
      await requestJson('GET', `/parties/${mounted}`),
    )
    const party = partySchema.parse(
      await send(
        {
          type: 'prepare',
          operation: 'transferMount',
          direction: 'toMount',
          space: 'tcgFolder',
          cardId: STR,
          quantity: 1,
        },
        mounted,
      ),
    )
    expect(party.members[0]!.player.mount!.tcgFolder).toEqual([
      { cardId: STR, copies: 2 },
    ])
    expect(party.turn.actionPoints).toBe(before.turn.actionPoints)
  })

  it('REQ-85: sem montaria → noMount', async () => {
    const error = await refusal(
      {
        type: 'prepare',
        operation: 'transferMount',
        direction: 'toMount',
        space: 'inventory',
        cardId: P,
        quantity: 1,
      },
      stable,
    )
    expect(error.reason).toBe('noMount')
  })

  it('REQ-85: formato — direction desconhecida e quantity 0', async () => {
    const transfer = {
      type: 'prepare',
      operation: 'transferMount',
      direction: 'toMount',
      space: 'inventory',
      cardId: P,
      quantity: 1,
    }
    expect(await invalid({ ...transfer, direction: 'up' }, mounted)).toEqual({
      fields: [{ field: 'direction', reason: 'unknownOption' }],
    })
    expect(await invalid({ ...transfer, quantity: 0 }, mounted)).toEqual({
      fields: [{ field: 'quantity', reason: 'notPositiveInteger' }],
    })
  })
})

describe('REQ-86: Movimentar com montaria', () => {
  it('REQ-86: moveRoutes traz a zona a 2 travessias com a zona do meio', async () => {
    const p = await get(mounted)
    expect(p.zoneId).toBe('fixture.old-mine')
    expect(p.moveTargets).toContain('fixture.gray-harbor')
    expect(p.moveRoutes).toContainEqual({
      zoneId: 'fixture.gray-harbor',
      direct: false,
      via: ['fixture.stone-bend'],
    })
  })

  it('REQ-86: move a 2 zonas sem viaZoneId → 200 no destino', async () => {
    const p = await player(
      { type: 'move', zoneId: 'fixture.gray-harbor' },
      mounted,
    )
    expect(p.zoneId).toBe('fixture.gray-harbor')
  })

  it('REQ-86: viaZoneId fora do via → notConnected', async () => {
    const error = await refusal(
      {
        type: 'move',
        zoneId: 'fixture.gray-harbor',
        viaZoneId: 'fixture.whispering-grove',
      },
      mounted,
    )
    expect(error.reason).toBe('notConnected')
  })

  it('REQ-86: viaZoneId sem montaria → noMount; fora do mapa → 400', async () => {
    const error = await refusal(
      {
        type: 'move',
        zoneId: 'fixture.old-mine',
        viaZoneId: 'fixture.stone-bend',
      },
      'party-os-teimosos',
    )
    expect(error.reason).toBe('noMount')
    expect(
      await invalid(
        { type: 'move', zoneId: 'fixture.stone-bend', viaZoneId: 'x' },
        'party-os-teimosos',
      ),
    ).toEqual({ fields: [{ field: 'viaZoneId', reason: 'zoneNotInMap' }] })
  })
})

describe('REQ-87: Estábulo', () => {
  it('REQ-87: em Porto Cinzento stable é null; na Velha Mina traz a oferta', async () => {
    expect((await get('party-os-teimosos')).market!.stable).toBeNull()
    const p = await get(stable)
    expect(p.zoneId).toBe('fixture.old-mine')
    expect(p.market!.stable).toEqual({
      offers: [{ cardId: H, price: 322 }],
      currentMount: null,
    })
  })

  it('REQ-87: comprar a montaria → 200 com a montaria vazia e o resultado', async () => {
    const p = await player(
      {
        type: 'visitMarket',
        operations: [{ operation: 'buyMount', cardId: H }],
      },
      stable,
    )
    expect(p.gold).toBe(78)
    expect(p.mount).toEqual({
      cardId: H,
      inventory: [],
      inventoryCapacity: 1,
      tcgFolder: [],
      tcgFolderCapacity: 10,
    })
    expect(p.lastMarketVisit!.results).toEqual([
      { operation: 'buyMount', cardId: H, gold: -322 },
    ])
    expect(p.market!.stable!.currentMount).toEqual({
      cardId: H,
      price: 140,
      sellable: true,
    })
  })

  it('REQ-87: recusas do Estábulo', async () => {
    const owned = await refusal(
      {
        type: 'visitMarket',
        operations: [{ operation: 'buyMount', cardId: H }],
      },
      mounted,
    )
    expect(owned.reason).toBe('mountAlreadyOwned')
    expect(owned.operationIndex).toBe(0)
    expect(owned.cardId).toBe(H)
    const notOffered = await refusal(
      {
        type: 'visitMarket',
        operations: [{ operation: 'buyMount', cardId: H }],
      },
      'party-os-teimosos',
    )
    expect(notOffered.reason).toBe('mountNotOffered')
    const none = await refusal(
      { type: 'visitMarket', operations: [{ operation: 'sellMount' }] },
      stable,
    )
    expect(none.reason).toBe('noMount')
  })

  it('REQ-87: vender com conteúdo → sellable false e mountNotEmpty', async () => {
    expect((await get(mounted)).market!.stable!.currentMount).toMatchObject({
      sellable: false,
    })
    const error = await refusal(
      { type: 'visitMarket', operations: [{ operation: 'sellMount' }] },
      mounted,
    )
    expect(error.reason).toBe('mountNotEmpty')
  })

  it('REQ-87: os 4 motivos novos e o resultado sellMount são aceitos', () => {
    for (const reason of [
      'noMount',
      'mountAlreadyOwned',
      'mountNotOffered',
      'mountNotEmpty',
    ]) {
      expect(actionNotAllowedDetailsSchema.parse({ reason }).reason).toBe(
        reason,
      )
    }
    expect(
      marketOperationResultSchema.parse({
        operation: 'sellMount',
        cardId: H,
        gold: 140,
      }),
    ).toEqual({ operation: 'sellMount', cardId: H, gold: 140 })
  })
})

describe('REQ-88: destinos prontos e descarte com montaria', () => {
  it('REQ-88: buyStock com o inventário cheio traz received no inventário extra', async () => {
    const p = await player(
      {
        type: 'visitMarket',
        operations: [{ operation: 'buyStock', cardId: P, quantity: 1 }],
      },
      mounted,
    )
    expect(p.lastMarketVisit!.results[0]).toMatchObject({
      operation: 'buyStock',
      received: [{ space: 'mountInventory', quantity: 1 }],
    })
  })

  it('REQ-88: destinos da montaria na vitrine, no single e no booster', () => {
    expect(
      marketOperationResultSchema.parse({
        operation: 'buySingle',
        slotIndex: 0,
        cardId: STR,
        destination: 'mountTcgFolder',
        gold: -5,
      }),
    ).toMatchObject({ destination: 'mountTcgFolder' })
    expect(
      boosterOpeningResultSchema.parse({
        boosterCardId: 'fixture.booster',
        via: 'prepare',
        cards: [
          { cardId: STR, destination: 'mountTcgFolder' },
          { cardId: P, destination: 'mountInventory' },
        ],
      }).cards,
    ).toHaveLength(2)
  })

  it('REQ-88: buyStock e buyBooster de antes da FEAT-18 leem received []', () => {
    expect(
      marketOperationResultSchema.parse({
        operation: 'buyBooster',
        cardId: 'fixture.booster',
        quantity: 1,
        gold: -10,
      }),
    ).toMatchObject({ received: [] })
  })

  it('REQ-88: a recompensa pendente oferece descarte por espaço', async () => {
    const party = partySchema.parse(
      await requestJson('GET', `/parties/${mounted}`),
    )
    const reward = party.pendingRewards[0]!
    expect(reward.discardOptions).toEqual([
      { cardId: 'fixture.short-sword', space: 'inventory', maxCopies: 1 },
      { cardId: P, space: 'mountInventory', maxCopies: 2 },
    ])
  })

  it('REQ-88: manter descartando da montaria → 200 com lastRewardDelivery.space', async () => {
    const party = partySchema.parse(
      await requestJson('GET', `/parties/${mounted}`),
    )
    const p = await player(
      {
        type: 'resolveReward',
        rewardId: party.pendingRewards[0]!.id,
        choice: 'keep',
        discard: [{ cardId: P, space: 'mountInventory', copies: 2 }],
      },
      mounted,
    )
    expect(p.lastRewardDelivery).toMatchObject({
      disposition: 'kept',
      space: 'mountInventory',
    })
  })

  it('REQ-88: manter com cópias acima do espaço → 409 rewardDoesNotFit', async () => {
    const party = partySchema.parse(
      await requestJson('GET', `/parties/${mounted}`),
    )
    const error = await refusal(
      {
        type: 'resolveReward',
        rewardId: party.pendingRewards[0]!.id,
        choice: 'keep',
        discard: [{ cardId: P, space: 'mountInventory', copies: 3 }],
      },
      mounted,
    )
    expect(error.reason).toBe('rewardDoesNotFit')
  })

  it('REQ-88: descarte legado sem space lê inventory/tcgFolder pelo destino', () => {
    const reward = pendingRewardSchema.parse({
      id: 'r',
      memberId: 'member-lia',
      cardId: P,
      origin: { type: 'fixed' },
      source: { type: 'scavenge' },
      destination: 'tcgFolder',
      discardOptions: [{ cardId: STR, maxCopies: 1 }],
      decisionDeadlineAt: null,
    })
    expect(reward.discardOptions).toEqual([
      { cardId: STR, space: 'tcgFolder', maxCopies: 1 },
    ])
  })

  it('REQ-88: lastScavenge aceita mountInventory', () => {
    const p = playerStateSchema.shape.lastScavenge.parse({
      cardId: P,
      found: true,
      delivery: 'mountInventory',
    })
    expect(p?.delivery).toBe('mountInventory')
  })
})

describe('REQ-89: efeitos e habilidades da montaria', () => {
  it('REQ-89: activatableEffects com source mount e habilidade com mountAbility', async () => {
    const pony = await get(mounted)
    expect(pony.mount!.cardId).toBe(WP)
    expect(pony.activatableEffects).toContainEqual(
      expect.objectContaining({ cardId: WP, source: 'mount' }),
    )
    expect(pony.usableAbilities).toContainEqual(
      expect.objectContaining({ mountAbility: true }),
    )
  })

  it('REQ-89: useAbility com equipmentSlot e mountAbility juntos → 400', async () => {
    const pony = await get(mounted)
    const abilityId = pony.usableAbilities![0]!.abilityId
    await invalid(
      {
        type: 'prepare',
        operation: 'useAbility',
        abilityId,
        equipmentSlot: 'weapon',
        mountAbility: true,
      },
      mounted,
    )
  })

  it('REQ-89: mountAbility sem montaria → noMount', async () => {
    const error = await refusal(
      {
        type: 'prepare',
        operation: 'useAbility',
        abilityId: 'any',
        mountAbility: true,
      },
      stable,
    )
    expect(error.reason).toBe('noMount')
  })

  it('REQ-89: origens da montaria no combate e nos efeitos disparados', () => {
    const ability = {
      targetIds: [],
      vigorCost: 0,
      paymentCosts: [],
      abilityId: 'a',
      mountAbility: true,
    }
    const option = combatStateSchema.shape.abilities.element.parse(ability)
    expect(option).toMatchObject({ mountAbility: true })
    expect(() =>
      combatStateSchema.shape.abilities.element.parse({
        ...ability,
        equipmentSlot: 'weapon',
      }),
    ).toThrow()
    expect(
      combatStateSchema.shape.effects.element.parse({
        targetIds: [],
        vigorCost: 0,
        paymentCosts: [],
        effectId: 'e',
        text: 't',
        origin: { type: 'mount', cardId: WP, effectIndex: 0 },
      }).origin.type,
    ).toBe('mount')
    const triggered = triggeredEffectChoiceSchema.shape.effects.element
    expect(
      triggered.parse({
        mode: 'automatic',
        paymentCosts: [],
        effectId: 'e',
        text: 't',
        origin: {
          type: 'mountAbility',
          cardId: WP,
          abilityId: 'a',
          effectIndex: 0,
        },
      }).origin.type,
    ).toBe('mountAbility')
  })
})
