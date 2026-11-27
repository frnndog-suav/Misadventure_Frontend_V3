import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { cardSchema, collectionSummarySchema } from './catalog'
import { ApiError } from './http'
import { labConfigSchema } from './labConfig'
import { useLabGrant } from './labGrant'
import {
  ActionNotAllowedError,
  actionNotAllowedDetailsSchema,
  partyActionTypeSchema,
  partySchema,
  playerStateSchema,
  usePartyAction,
} from './parties'
import type { PartyAction } from './parties'
import {
  collectionsFixture,
  fishingRodFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
  grayHarborFixture,
  ironOreFixture,
  pickaxeFixture,
  silverFishFixture,
  testDimensionFixture,
} from '../mocks/catalogFixtures'
import { labConfigDefaultsFixture } from '../mocks/fixtures'
import {
  partyCreatedFixture,
  partyFishingRodGrantedFixture,
  partyGearInSessionFixture,
  partyInSessionFixture,
  partyMovedToStoneBendFixture,
  partyScavengedFixture,
  partyVaultUsedFixture,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'

/** CONTRATO §3 FEAT-32 (v0.47): cofre, deck de recompensas e Vasculhar (D-59). */

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => server.resetHandlers())
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
})

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const F = 'fixture.fishing-rod'
const S = 'fixture.silver-fish'
const I = 'fixture.iron-ore'
const P = 'fixture.healing-potion'
const partyId = partyInSessionFixture.id

async function send(id: string, action: PartyAction) {
  const { result } = renderHook(() => usePartyAction(id), { wrapper })
  act(() => result.current.mutate(action))
  await waitFor(() => expect(result.current.isIdle).toBe(false))
  await waitFor(() => expect(result.current.isPending).toBe(false))
  return result.current
}

function notAllowed(details: unknown) {
  return http.post('*/parties/:partyId/actions', () =>
    HttpResponse.json(
      {
        error: {
          code: 'ACTION_NOT_ALLOWED',
          message: 'Esta ação não é permitida agora.',
          details,
        },
      },
      { status: 409 },
    ),
  )
}

describe('REQ-47: GameConfigValues com as chaves da FEAT-32', () => {
  const keys = ['vaultCapacity', 'vaultDeckSlots', 'vaultGoldCapacity'] as const

  it('REQ-47: o LabConfig dos padrões traz as 3 chaves novas, com os padrões e limites do contrato', () => {
    const config = labConfigSchema.parse(labConfigDefaultsFixture)
    expect(keys.map((key) => config.values[key])).toEqual([30, 10, 2000])
    expect(keys.map((key) => config.defaults[key])).toEqual([30, 10, 2000])
    expect(keys.map((key) => config.limits[key])).toEqual([
      { min: 0, max: 1000 },
      { min: 1, max: 100 },
      { min: 0, max: 10000000 },
    ])
  })

  it('REQ-47: LabConfig sem uma chave nova é resposta fora do contrato', () => {
    for (const key of keys) {
      const values: Record<string, unknown> = {
        ...labConfigDefaultsFixture.values,
      }
      delete values[key]
      expect(
        labConfigSchema.safeParse({ ...labConfigDefaultsFixture, values })
          .success,
      ).toBe(false)
    }
  })
})

describe('REQ-48: ferramentas e decks de recompensas nas cartas', () => {
  it('REQ-48: a fixture tem 32 cartas (item 12) em ordem de id e todas validam', () => {
    expect(
      collectionSummarySchema.parse(collectionsFixture[0]).cardCounts.item,
    ).toBe(12)
    expect(fixtureCardsFixture).toHaveLength(32)
    const ids = fixtureCardsFixture.map((card) => card.id)
    expect(ids).toEqual([...ids].sort())
    for (const card of fixtureCardsFixture) {
      expect(cardSchema.safeParse(card).success).toBe(true)
    }
    expect(fixtureCardsByTypeFixture.item.map((card) => card.id)).toEqual([
      'fixture.arrows',
      'fixture.booster',
      'fixture.ember-shard',
      F,
      P,
      I,
      'fixture.lucky-coin',
      'fixture.pickaxe',
      'fixture.shard',
      S,
      'fixture.strength-tonic',
      'fixture.sword-blueprint',
    ])
  })

  it('REQ-48: ferramentas e cartas coletáveis trazem os campos do cenário', () => {
    expect(fishingRodFixture).toMatchObject({
      type: 'item',
      name: 'Vara de Pesca',
      itemCategory: 'tool',
      toolKind: 'fishing-rod',
      scavengeZoneTypes: ['coastal', 'fluvial', 'lacustrine', 'urban'],
      scavengeTool: null,
    })
    expect(pickaxeFixture).toMatchObject({
      toolKind: 'pickaxe',
      scavengeZoneTypes: ['underground', 'mountainous'],
    })
    expect(silverFishFixture).toMatchObject({
      name: 'Peixe Prateado',
      itemCategory: 'material',
      toolKind: null,
      scavengeTool: 'fishing-rod',
    })
    expect(ironOreFixture).toMatchObject({
      name: 'Minério de Ferro',
      scavengeTool: 'pickaxe',
    })
    expect(testDimensionFixture).toMatchObject({
      rewardDecks: [
        {
          zoneType: 'urban',
          cards: [
            { cardId: S, copies: 1 },
            { cardId: I, copies: 1 },
            { cardId: P, copies: 2 },
          ],
        },
      ],
    })
    expect(grayHarborFixture).toMatchObject({
      zoneActions: [
        'startEvent',
        'scavenge',
        'useVault',
        'visitBlacksmith',
        'visitMarket',
        'saveRespawnPoint',
      ],
    })
  })

  it('REQ-48: item, equipamento ou dimensão sem um campo novo é carta fora do contrato', () => {
    const cases: [object, string][] = [
      [fishingRodFixture, 'toolKind'],
      [fishingRodFixture, 'scavengeZoneTypes'],
      [fishingRodFixture, 'scavengeTool'],
      [
        fixtureCardsFixture.find((card) => card.type === 'equipment') ?? {},
        'scavengeTool',
      ],
      [testDimensionFixture, 'rewardDecks'],
    ]
    for (const [card, key] of cases) {
      const copy: Record<string, unknown> = { ...card }
      delete copy[key]
      expect(cardSchema.safeParse(copy).success).toBe(false)
    }
  })
})

describe('REQ-50: PlayerState com o cofre e o Vasculhar', () => {
  const player = partyCreatedFixture.members[0].player

  it('REQ-50: o grupo criado traz o cofre vazio, as capacidades e useVault na cidade', () => {
    expect(playerStateSchema.safeParse(player).success).toBe(true)
    expect(player.vault).toEqual({ slots: [], decks: [], gold: 0 })
    expect(player.vaultCapacity).toBe(30)
    expect(player.vaultDeckSlots).toBe(10)
    expect(player.vaultGoldCapacity).toBe(2000)
    expect(player.scavengeTargets).toEqual([])
    expect(player.lastScavenge).toBeNull()
    expect(player.availableActions).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'useVault',
      'visitBlacksmith',
      'visitMarket',
      'endTurn',
    ])
  })

  it('REQ-50: fora da cidade não há useVault; com equipamento, prepare antes de useVault', () => {
    expect(
      partyMovedToStoneBendFixture.members[0].player.availableActions,
    ).not.toContain('useVault')
    expect(
      partyGearInSessionFixture.members[0].player.availableActions,
    ).toEqual([
      'move',
      'recover',
      'prepare',
      'adjustDeck',
      'useVault',
      'visitBlacksmith',
      'visitMarket',
      'endTurn',
    ])
  })

  it('REQ-50: availableActions aceita scavenge e useVault, na ordem do contrato', () => {
    expect(partyActionTypeSchema.options).toEqual([
      'move',
      'recover',
      'prepare',
      'adjustDeck',
      'abandonQuest',
      'artificerWorkshop',
      'scavenge',
      'useVault',
      'takeQuest',
      'continueQuest',
      'finishQuest',
      'takeTrialQuest',
      'visitBlacksmith',
      'visitMarket',
      'trainWithMentor',
      'saveRespawnPoint',
      'startEvent',
      'revealEvent',
      'payEventRequirement',
      'resolveEvent',
      'giveUpEvent',
      'escapeEvent',
      'resolveReward',
      'confirmCombatRoster',
      'respondCombatInvite',
      'confirmCombatOrder',
      'activateCombatEffect',
      'useAbility',
      'escapeCombat',
      'combatAttack',
      'endCombatTurn',
      'resolveTriggeredEffect',
      'completeDimension',
      'endTurn',
    ])
  })

  it('REQ-50: PlayerState sem um campo novo é resposta fora do contrato', () => {
    for (const key of [
      'vault',
      'vaultCapacity',
      'vaultDeckSlots',
      'vaultGoldCapacity',
      'scavengeTargets',
      'lastScavenge',
    ]) {
      const copy: Record<string, unknown> = { ...player }
      delete copy[key]
      expect(playerStateSchema.safeParse(copy).success).toBe(false)
    }
  })

  it('REQ-50: cofre com slot de quantidade 0 é resposta fora do contrato', () => {
    expect(
      playerStateSchema.safeParse({
        ...player,
        vault: { slots: [{ cardId: P, quantity: 0 }], decks: [], gold: 0 },
      }).success,
    ).toBe(false)
  })

  it('REQ-50: a doação da vara de pesca devolve scavengeTargets com S e scavenge antes de useVault', async () => {
    const { result } = renderHook(() => useLabGrant(), { wrapper })
    act(() =>
      result.current.mutate({
        partyId: partyCreatedFixture.id,
        memberId: partyCreatedFixture.members[0].id,
        grant: { type: 'card', cardId: F, quantity: 1 },
      }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyFishingRodGrantedFixture)
    const granted = partyFishingRodGrantedFixture.members[0].player
    expect(granted.scavengeTargets).toEqual([S])
    expect(granted.availableActions).toEqual([
      'move',
      'recover',
      'adjustDeck',
      'scavenge',
      'useVault',
      'visitBlacksmith',
      'visitMarket',
      'endTurn',
    ])
  })
})

describe('REQ-51: Vasculhar', () => {
  it('REQ-51: scavenge de S devolve o Party com S no inventário e lastScavenge found', async () => {
    const state = await send(partyId, { type: 'scavenge', cardId: S })
    expect(state.data).toEqual(partyScavengedFixture)
    expect(partySchema.safeParse(partyScavengedFixture).success).toBe(true)
    const player = partyScavengedFixture.members[0].player
    expect(player.inventory.at(-1)).toEqual({ cardId: S, quantity: 1 })
    expect(player.lastScavenge).toEqual({
      cardId: S,
      found: true,
      delivery: 'inventory',
    })
    expect(partyScavengedFixture.turn.actionPoints).toBe(2)
  })

  it('REQ-51: scavenge de I vira ActionNotAllowedError notScavengeable', async () => {
    const state = await send(partyId, { type: 'scavenge', cardId: I })
    expect(state.error).toBeInstanceOf(ActionNotAllowedError)
    expect(state.error).toMatchObject({
      code: 'ACTION_NOT_ALLOWED',
      reason: 'notScavengeable',
    })
  })

  it('REQ-51: lastScavenge com found: false é aceito; sem found é resposta fora do contrato', () => {
    const player = partyScavengedFixture.members[0].player
    expect(
      playerStateSchema.safeParse({
        ...player,
        lastScavenge: { cardId: S, found: false, delivery: 'none' },
      }).success,
    ).toBe(true)
    expect(
      playerStateSchema.safeParse({ ...player, lastScavenge: { cardId: S } })
        .success,
    ).toBe(false)
  })
})

describe('REQ-52: Usar cofre', () => {
  it('REQ-52: o lote do cenário devolve o Party com o cofre preenchido', async () => {
    const state = await send(partyId, {
      type: 'useVault',
      operations: [
        { operation: 'store', cardId: P, quantity: 2 },
        { operation: 'storeGold', amount: 60 },
        { operation: 'discard', cardId: P, quantity: 1 },
      ],
    })
    expect(state.data).toEqual(partyVaultUsedFixture)
    const player = partyVaultUsedFixture.members[0].player
    expect(player.vault).toEqual({
      slots: [{ cardId: P, quantity: 1 }],
      decks: [],
      gold: 60,
    })
    expect(player.gold).toBe(40)
    expect(player.inventory).toEqual([{ cardId: P, quantity: 1 }])
    expect(partyVaultUsedFixture.turn.actionPoints).toBe(2)
  })

  it('REQ-52: lote com take de 5 vira ActionNotAllowedError notInVault com operationIndex 1', async () => {
    const state = await send(partyId, {
      type: 'useVault',
      operations: [
        { operation: 'takeGold', amount: 10 },
        { operation: 'take', cardId: P, quantity: 5 },
      ],
    })
    expect(state.error).toBeInstanceOf(ActionNotAllowedError)
    expect(state.error).toMatchObject({
      reason: 'notInVault',
      operationIndex: 1,
    })
  })

  it('REQ-52: operations vazia vira ApiError ACTION_INVALID com invalidLength', async () => {
    const state = await send(partyId, { type: 'useVault', operations: [] })
    expect(state.error).toBeInstanceOf(ApiError)
    expect(state.error).toMatchObject({
      code: 'ACTION_INVALID',
      details: { fields: [{ field: 'operations', reason: 'invalidLength' }] },
    })
  })

  it('REQ-52: os motivos novos da FEAT-32 são conhecidos; operationIndex só inteiro ≥ 0', async () => {
    const reasons = [
      'zoneActionUnavailable',
      'notInTcgFolder',
      'notStorable',
      'notInVault',
      'vaultFull',
      'notEnoughGold',
      'vaultGoldFull',
      'notEnoughVaultGold',
      'purseFull',
      'notAttribute',
      'deckSlotsFull',
      'deckNotFound',
      'notScavengeable',
    ]
    for (const reason of reasons) {
      expect(
        actionNotAllowedDetailsSchema.safeParse({ reason, operationIndex: 0 })
          .success,
      ).toBe(true)
    }
    expect(
      actionNotAllowedDetailsSchema.safeParse({
        reason: 'purseFull',
        operationIndex: -1,
      }).success,
    ).toBe(false)

    server.use(notAllowed({ reason: 'purseFull', operationIndex: 0 }))
    const state = await send(partyId, {
      type: 'useVault',
      operations: [{ operation: 'takeGold', amount: 1 }],
    })
    expect(state.error).toMatchObject({
      reason: 'purseFull',
      operationIndex: 0,
    })
  })

  it('REQ-52: recusa sem operationIndex deixa o campo indefinido', async () => {
    server.use(notAllowed({ reason: 'zoneActionUnavailable' }))
    const state = await send(partyId, {
      type: 'useVault',
      operations: [{ operation: 'unpackDeck', deckIndex: 0 }],
    })
    expect(state.error).toBeInstanceOf(ActionNotAllowedError)
    expect(
      (state.error as ActionNotAllowedError).operationIndex,
    ).toBeUndefined()
  })
})
