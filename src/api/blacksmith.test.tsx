import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { createElement, type ReactNode } from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { handlers } from '../mocks/handlers'
import { partyInSessionFixture } from '../mocks/partyFixtures'
import { blacksmithOperationResultSchema } from './blacksmith'
import { cardSchema } from './catalog'
import { ApiError, requestJson } from './http'
import { labConfigSchema } from './labConfig'
import {
  ActionNotAllowedError,
  actionNotAllowedDetailsSchema,
  partySchema,
  playerStateSchema,
  usePartyAction,
  type PartyAction,
} from './parties'

/** CONTRATO §3 FEAT-17 (v0.85): ferreiro, Oficina do Artífice e estado do equipamento (D-63). */

const server = setupServer(...handlers)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

const W = 'fixture.short-sword'
const O = 'fixture.iron-ore'
const E = 'fixture.ember-shard'
const B = 'fixture.sword-blueprint'
const smithy = 'party-ferreiro'
const workshop = 'party-artifice'
const weapon = { location: 'equipment', slot: 'weapon' } as const
const standard = {
  refinement: 0,
  enchantments: [],
  repairMarks: 0,
  broken: false,
}

async function send(action: PartyAction, id = smithy) {
  const client = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  const { result } = renderHook(() => usePartyAction(id), { wrapper })
  let outcome: unknown
  await act(async () => {
    outcome = await result.current.mutateAsync(action).catch((e) => e)
  })
  return outcome
}

async function player(action: PartyAction, id = smithy) {
  const party = await send(action, id)
  return partySchema.parse(party).members[0]!.player
}

async function refusal(action: PartyAction, id = smithy) {
  const error = await send(action, id)
  expect(error).toBeInstanceOf(ActionNotAllowedError)
  return error as ActionNotAllowedError
}

async function invalidFields(action: PartyAction) {
  const error = await send(action)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).code).toBe('ACTION_INVALID')
  return (error as ApiError).details
}

type Operations = Extract<
  PartyAction,
  { type: 'visitBlacksmith' }
>['operations']
const visit = (operations: Operations): PartyAction => ({
  type: 'visitBlacksmith',
  operations,
})

describe('REQ-80: estado inicial com ferreiro', () => {
  it('REQ-80: a cidade traz visitBlacksmith logo antes de visitMarket', async () => {
    const party = partySchema.parse(
      await requestJson('POST', '/parties/party-os-teimosos/session'),
    )
    const actions = party.members[0]!.player.availableActions
    expect(actions.indexOf('visitBlacksmith')).toBe(
      actions.indexOf('visitMarket') - 1,
    )
    expect(actions).not.toContain('artificerWorkshop')
  })

  it('REQ-80: a projeção do ferreiro traz os níveis seguintes e os encantamentos', async () => {
    const party = partySchema.parse(
      await requestJson('GET', `/parties/${smithy}`),
    )
    const p = party.members[0]!.player
    expect(p.equipmentStates.weapon).toEqual(standard)
    expect(p.lastBlacksmithVisit).toBeNull()
    expect(p.availableActions).not.toContain('artificerWorkshop')
    expect(p.blacksmith).toMatchObject({
      zoneId: 'fixture.gray-harbor',
      workshop: null,
      enchantments: [
        { enchantment: { id: 'ember-edge' }, gold: 50, threshold: 0 },
      ],
    })
    const sword = p.blacksmith!.blacksmith!.equipment[0]!
    expect(sword.target).toEqual(weapon)
    expect(sword.repair).toBeNull()
    expect(sword.refineSteps).toHaveLength(10)
    expect(sword.refineSteps[0]).toEqual({
      targetLevel: 1,
      materials: [{ cardId: O, quantity: 1 }],
      gold: 10,
      threshold: 0,
      d20Bonus: 0,
      breaksOnFailure: false,
    })
    expect(sword.refineSteps[3]).toMatchObject({
      targetLevel: 4,
      gold: 40,
      threshold: 21,
      breaksOnFailure: true,
    })
    expect(sword.enchantOptions).toEqual([
      {
        enchantmentId: 'ember-edge',
        replaceRequired: false,
        extra: false,
        requiresRefinement: 2,
      },
    ])
  })

  it('REQ-80: com Artífice ativo, a Oficina aparece com a vista workshop', async () => {
    const party = partySchema.parse(
      await requestJson('GET', `/parties/${workshop}`),
    )
    const p = party.members[0]!.player
    expect(p.availableActions).toContain('artificerWorkshop')
    expect(p.blacksmith?.workshop?.equipment[0]?.enchantOptions).toEqual([])
  })
})

describe('REQ-79: estado do equipamento', () => {
  it('REQ-79: resposta sem os campos da FEAT-17 recebe os valores legados', () => {
    const feat17 = ['equipmentStates', 'blacksmith', 'lastBlacksmithVisit']
    const legacy = Object.fromEntries(
      Object.entries(partyInSessionFixture.members[0]!.player).filter(
        ([key]) => !feat17.includes(key),
      ),
    )
    const parsed = playerStateSchema.parse(legacy)
    expect(Object.values(parsed.equipmentStates)).toEqual(Array(8).fill(null))
    expect(parsed.blacksmith).toBeNull()
    expect(parsed.lastBlacksmithVisit).toBeNull()
  })

  it('REQ-79: slot de equipamento no inventário e no cofre aceita equipmentState', () => {
    const p = structuredClone(partyInSessionFixture.members[0]!.player)
    const slot = {
      cardId: W,
      quantity: 1,
      equipmentState: { ...standard, refinement: 3, broken: true },
    }
    const parsed = playerStateSchema.parse({
      ...p,
      inventory: [slot],
      vault: { ...p.vault, slots: [slot] },
    })
    expect(parsed.inventory[0]?.equipmentState?.refinement).toBe(3)
    expect(parsed.vault.slots[0]?.equipmentState?.broken).toBe(true)
  })

  it('REQ-79: venda valorizada traz uma oferta por cópia com índice e estado', async () => {
    const p = await player({
      type: 'prepare',
      operation: 'unequip',
      slot: 'weapon',
    })
    const offer = p.market?.sellOffers.find((o) => o.cardId === W)
    expect(offer).toMatchObject({
      owned: 1,
      lotSize: 1,
      price: 3,
      inventorySlotIndex: expect.any(Number),
    })
    expect(offer?.equipmentState).toEqual(
      p.inventory[offer!.inventorySlotIndex!]?.equipmentState,
    )
  })
})

describe('REQ-81: Ir ao Ferreiro e Oficina (lote)', () => {
  // O pedido do cenário no CONTRATO v0.85 lista 5 operações, mas os resultados
  // descritos são 6 (o último `skipped`); segue-se a descrição (D-63 item 8).
  it('REQ-81: lote com falha e quebra traz um resultado por operação', async () => {
    const p = await player(
      visit([
        { operation: 'refine', target: weapon },
        { operation: 'refine', target: weapon },
        { operation: 'enchant', target: weapon, enchantmentId: 'ember-edge' },
        { operation: 'refine', target: weapon },
        { operation: 'refine', target: weapon },
        { operation: 'refine', target: weapon },
      ]),
    )
    const visitResult = p.lastBlacksmithVisit!
    expect(visitResult.source).toBe('blacksmith')
    expect(visitResult.actionPointsSpent).toBe(3)
    expect(visitResult.results.map((r) => r.operation)).toEqual([
      'refine',
      'refine',
      'enchant',
      'refine',
      'refine',
      'refine',
    ])
    expect(visitResult.results[4]).toMatchObject({
      targetLevel: 4,
      threshold: 21,
      success: false,
      broke: true,
      gold: -40,
    })
    expect(visitResult.results[5]).toMatchObject({ skipped: true, gold: 0 })
    expect(p.gold).toBe(150)
    expect(p.equipmentStates.weapon).toMatchObject({
      refinement: 3,
      broken: true,
      enchantments: [{ slotIndex: 0, active: false }],
    })
  })

  it('REQ-81: lote recusado aponta a operação (notBroken na segunda)', async () => {
    const error = await refusal(
      visit([
        { operation: 'repair', target: weapon },
        { operation: 'repair', target: weapon },
      ]),
    )
    expect(error.reason).toBe('notBroken')
    expect(error.operationIndex).toBe(1)
  })

  it('REQ-81: refinar equipamento quebrado → equipmentBroken', async () => {
    const error = await refusal(
      visit([{ operation: 'refine', target: weapon }]),
    )
    expect(error.reason).toBe('equipmentBroken')
    expect(error.operationIndex).toBe(0)
  })

  it('REQ-81: consertar devolve o estado com a marca de reparo', async () => {
    const p = await player(visit([{ operation: 'repair', target: weapon }]))
    expect(p.gold).toBe(139)
    expect(p.equipmentStates.weapon).toMatchObject({
      broken: false,
      repairMarks: 1,
      enchantments: [{ active: true }],
    })
    expect(p.lastBlacksmithVisit?.results[0]).toMatchObject({
      operation: 'repair',
      gold: -11,
      repairMarks: 1,
      skipped: false,
    })
  })

  it('REQ-81: criar pela receita põe a espada nova no fim do inventário', async () => {
    const p = await player(
      visit([{ operation: 'craft', inventorySlotIndex: 2 }]),
    )
    expect(p.gold).toBe(124)
    expect(p.inventory.map((s) => s.cardId)).toContain(B)
    expect(p.inventory.at(-1)).toEqual({
      cardId: W,
      quantity: 1,
      equipmentState: standard,
    })
    expect(p.lastBlacksmithVisit?.results[0]).toMatchObject({
      operation: 'craft',
      recipeCardId: B,
      equipmentId: W,
      destination: 'inventory',
    })
  })

  it('REQ-88: craft sem destination lê inventory e aceita mountInventory', () => {
    const base = {
      operation: 'craft',
      recipeCardId: B,
      equipmentId: W,
      gold: -15,
      inventorySlotIndex: 0,
      skipped: false,
    }
    expect(blacksmithOperationResultSchema.parse(base)).toMatchObject({
      destination: 'inventory',
    })
    expect(
      blacksmithOperationResultSchema.parse({
        ...base,
        destination: 'mountInventory',
      }),
    ).toMatchObject({ destination: 'mountInventory' })
    expect(() =>
      blacksmithOperationResultSchema.parse({ ...base, destination: 'vault' }),
    ).toThrow()
  })

  it('REQ-81: craft apontando para o que não é receita → recipeMissing', async () => {
    const error = await refusal(
      visit([{ operation: 'craft', inventorySlotIndex: 0 }]),
    )
    expect(error.reason).toBe('recipeMissing')
  })

  it('REQ-81: Oficina sem Artífice ativo → artificerInactive', async () => {
    const error = await refusal({
      type: 'artificerWorkshop',
      operations: [{ operation: 'repair', target: weapon }],
    })
    expect(error.reason).toBe('artificerInactive')
    expect(error.operationIndex).toBeUndefined()
  })

  it('REQ-81: com Artífice ativo, a Oficina gasta 1 PA e responde workshop', async () => {
    const p = await player(
      {
        type: 'artificerWorkshop',
        operations: [{ operation: 'refine', target: weapon }],
      },
      workshop,
    )
    expect(p.lastBlacksmithVisit).toMatchObject({
      source: 'workshop',
      actionPointsSpent: 1,
    })
  })

  it('REQ-81: formato do lote recusado com o campo e o motivo', async () => {
    expect(await invalidFields(visit([]))).toEqual({
      fields: [{ field: 'operations', reason: 'invalidLength' }],
    })
    expect(
      await invalidFields(
        visit([
          {
            operation: 'refine',
            // @ts-expect-error valor fora do contrato, de propósito
            target: { location: 'bag', slot: 'weapon' },
          },
        ]),
      ),
    ).toEqual({
      fields: [
        { field: 'operations.0.target.location', reason: 'unknownOption' },
      ],
    })
    expect(
      await invalidFields(
        visit([{ operation: 'craft', inventorySlotIndex: -1 }]),
      ),
    ).toEqual({
      fields: [
        {
          field: 'operations.0.inventorySlotIndex',
          reason: 'notNonNegativeInteger',
        },
      ],
    })
    expect(
      // @ts-expect-error operação fora do contrato, de propósito
      await invalidFields(visit([{ operation: 'polish' }])),
    ).toEqual({
      fields: [{ field: 'operations.0.operation', reason: 'unknownOperation' }],
    })
  })

  it('REQ-81: cada motivo novo do contrato é aceito pelo schema', () => {
    const reasons = [
      'artificerInactive',
      'equipmentNotFound',
      'notBroken',
      'equipmentBroken',
      'notRefinable',
      'refinementMaterialsMissing',
      'refineLevelMax',
      'refineLevelTooHigh',
      'enchantNotAvailable',
      'enchantmentNotOffered',
      'notEnchantable',
      'enchantSlotUnavailable',
      'replaceIndexRequired',
      'replaceIndexInvalid',
      'recipeMissing',
      'materialsMissing',
    ]
    for (const reason of reasons)
      expect(actionNotAllowedDetailsSchema.parse({ reason }).reason).toBe(
        reason,
      )
  })
})

describe('REQ-78: campos do ferreiro nas cartas', () => {
  it('REQ-78: Espada Curta refinável e encantável; Projeto com receita', async () => {
    const sword = cardSchema.parse(
      await requestJson('GET', `/catalog/cards/${W}`),
    )
    expect(sword).toMatchObject({
      refinement: { maxLevel: 10, materials: [{ cardId: O, quantity: 1 }] },
      enchantment: { slots: [{ kind: 'element', minRefinement: 2 }] },
    })
    const blueprint = cardSchema.parse(
      await requestJson('GET', `/catalog/cards/${B}`),
    )
    expect(blueprint).toMatchObject({
      itemCategory: 'document',
      recipe: {
        equipmentId: W,
        materials: [{ cardId: O, quantity: 2 }],
        gold: 15,
        consumed: false,
      },
    })
    const shard = cardSchema.parse(
      await requestJson('GET', `/catalog/cards/${E}`),
    )
    expect(shard).toMatchObject({ itemCategory: 'material', recipe: null })
  })

  it('REQ-78: Porto Cinzento traz o ferreiro e Ir ao Ferreiro', async () => {
    const harbor = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.gray-harbor'),
    )
    if (harbor.type !== 'zone') throw new Error('esperava zona')
    expect(harbor.zoneActions).toEqual([
      'startEvent',
      'scavenge',
      'useVault',
      'visitBlacksmith',
      'visitMarket',
      'saveRespawnPoint',
    ])
    expect(harbor.blacksmith).toEqual({
      enchantments: [
        {
          id: 'ember-edge',
          name: 'Fio de Brasa',
          kind: 'element',
          element: 'fire',
          bonusPercent: 10,
          materials: [{ cardId: E, quantity: 1 }],
        },
      ],
    })
    const grove = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.whispering-grove'),
    )
    expect(grove).toMatchObject({ blacksmith: null })
  })

  it('REQ-78: materiais em texto (formato anterior) são recusados', () => {
    expect(
      cardSchema.safeParse({
        type: 'equipment',
        id: 'x.y',
        collectionId: 'x',
        name: 'Y',
        flavorText: null,
        rarity: 'common',
        slot: 'weapon',
        tags: [],
        modifiers: [],
        peakRequirement: null,
        classRestriction: [],
        blocksShield: false,
        abilities: [],
        effects: [],
        refinement: { maxLevel: 3, materials: { text: 'Minério' } },
        enchantment: null,
        priceMultiplier: 1,
        scavengeTool: null,
      }).success,
    ).toBe(false)
  })
})

describe('REQ-77: valores do ferreiro no laboratório', () => {
  it('REQ-77: GET traz as 19 chaves com padrões e limites', async () => {
    const config = labConfigSchema.parse(
      await requestJson('GET', '/lab/config'),
    )
    expect(config.defaults).toMatchObject({
      repairBaseGold: 5,
      repairGoldPerLevel: 2,
      repairMarkPercent: 12,
      refineGoldPerLevel: 10,
      refineThreshold1to3: 0,
      refineThreshold4to6: 8,
      refineThreshold7to9: 12,
      refineThreshold10: 16,
      refineBreakFromLevel: 7,
      refineBonusPercent: 5,
      enchantElementGold: 50,
      enchantEffectGold: 100,
      enchantElementThreshold: 10,
      enchantEffectThreshold: 13,
      saleRefinePercent: 8,
      saleEnchantPercent: 20,
      artificerRepairDiscountPercent: 50,
      artificerMaxRefineLevel: 6,
      artificerD20Bonus: 2,
    })
    expect(config.limits.refineThreshold10).toEqual({ min: 0, max: 21 })
    expect(config.limits.refineBreakFromLevel).toEqual({ min: 1, max: 11 })
    expect(config.limits.artificerD20Bonus).toEqual({ min: 0, max: 20 })
  })
})
