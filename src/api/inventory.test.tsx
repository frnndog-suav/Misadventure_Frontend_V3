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
import {
  LabGrantInvalidError,
  LabGrantNoSpaceError,
  useLabGrant,
} from './labGrant'
import {
  ActionNotAllowedError,
  partyActionTypeSchema,
  partySchema,
  playerStateSchema,
  useParty,
  usePartyAction,
} from './parties'
import type { PartyAction } from './parties'
import {
  arcaneWandFixture,
  collectionsFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
  ironHelmFixture,
  oakShieldFixture,
  pickaxeFixture,
  shortSwordFixture,
} from '../mocks/catalogFixtures'
import { labConfigDefaultsFixture } from '../mocks/fixtures'
import {
  partyCreatedFixture,
  partyBladeEquippedFixture,
  partyBladeUnequippedFixture,
  partyGearInSessionFixture,
  partyGrantedCardFixture,
  partyGrantedGoldFixture,
  partyInSessionFixture,
  partyNotFoundFixture,
  standardEquipmentState,
} from '../mocks/partyFixtures'
import { handlers } from '../mocks/handlers'

/** CONTRATO §3 FEAT-10 (v0.41): inventário, equipar, bolsa e doação. */

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

const B = 'fixture.blade-of-dusk'
const W = 'fixture.short-sword'
const D = 'fixture.oak-shield'
const H = 'fixture.iron-helm'
const R = 'fixture.arcane-wand'
const P = 'fixture.healing-potion'
const K = 'fixture.pickaxe'
const gearId = partyGearInSessionFixture.id
const memberId = partyCreatedFixture.members[0].id

describe('REQ-43: GameConfigValues com as chaves da FEAT-10', () => {
  const keys = ['inventoryCapacity', 'purseCapacity'] as const

  it('REQ-43: o LabConfig dos padrões traz as 2 chaves novas, com os padrões e limites do contrato', () => {
    const config = labConfigSchema.parse(labConfigDefaultsFixture)
    expect(keys.map((key) => config.values[key])).toEqual([10, 300])
    expect(keys.map((key) => config.defaults[key])).toEqual([10, 300])
    expect(keys.map((key) => config.limits[key])).toEqual([
      { min: 0, max: 100 },
      { min: 0, max: 1000000 },
    ])
  })

  it('REQ-43: LabConfig sem uma chave nova é resposta fora do contrato', () => {
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

describe('REQ-44: PlayerState com inventário, equipamentos, bolsa e modificadores efetivos', () => {
  const player = partyCreatedFixture.members[0].player

  it('REQ-44: as fixtures do grupo criado trazem o cenário de criação do contrato', () => {
    expect(playerStateSchema.safeParse(player).success).toBe(true)
    expect(player.inventory).toEqual([])
    expect(player.inventoryCapacity).toBe(10)
    expect(player.purseCapacity).toBe(300)
    expect(Object.keys(player.equipment).sort()).toEqual(
      [
        'accessory',
        'cape',
        'feet',
        'head',
        'legs',
        'shield',
        'torso',
        'weapon',
      ].sort(),
    )
    expect(Object.values(player.equipment).every((id) => id === null)).toBe(
      true,
    )
    expect(player.effectiveModifiers).toEqual({
      attack: 6,
      defense: 5,
      accuracy: 49,
      evasion: 16,
      celerity: 8,
      piercing: 0,
      reflection: 0,
    })
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

  it('REQ-44: campo novo ausente é resposta fora do contrato', () => {
    for (const key of [
      'inventory',
      'inventoryCapacity',
      'equipment',
      'purseCapacity',
      'effectiveModifiers',
    ]) {
      const without: Record<string, unknown> = { ...player }
      delete without[key]
      expect(playerStateSchema.safeParse(without).success).toBe(false)
    }
  })

  it('REQ-44: equipment sem uma das 8 categorias, ou com id que não é texto, é inválido', () => {
    const sevenSlots: Record<string, unknown> = { ...player.equipment }
    delete sevenSlots.head
    expect(
      playerStateSchema.safeParse({ ...player, equipment: sevenSlots }).success,
    ).toBe(false)
    expect(
      playerStateSchema.safeParse({
        ...player,
        equipment: { ...player.equipment, weapon: 3 },
      }).success,
    ).toBe(false)
    expect(
      playerStateSchema.safeParse({
        ...player,
        equipment: { ...player.equipment, weapon: B },
      }).success,
    ).toBe(true)
  })

  it('REQ-44: slot do inventário com quantidade fora de inteiro ≥ 1 é inválido', () => {
    for (const quantity of [0, 1.5, '2']) {
      expect(
        playerStateSchema.safeParse({
          ...player,
          inventory: [{ cardId: P, quantity }],
        }).success,
      ).toBe(false)
    }
    expect(
      playerStateSchema.safeParse({
        ...player,
        inventory: [{ cardId: P, quantity: 5 }],
      }).success,
    ).toBe(true)
  })

  it('REQ-44: effectiveModifiers sem um dos 7 modificadores é inválido', () => {
    const six: Record<string, unknown> = { ...player.effectiveModifiers }
    delete six.piercing
    expect(
      playerStateSchema.safeParse({ ...player, effectiveModifiers: six })
        .success,
    ).toBe(false)
  })

  it('REQ-44: o grupo com equipamento mostra o inventário do cenário e prepare disponível', () => {
    const gear = partyGearInSessionFixture.members[0].player
    expect(partySchema.safeParse(partyGearInSessionFixture).success).toBe(true)
    expect(gear.inventory).toEqual([
      { cardId: B, quantity: 1, equipmentState: standardEquipmentState },
      { cardId: D, quantity: 1, equipmentState: standardEquipmentState },
      { cardId: H, quantity: 1, equipmentState: standardEquipmentState },
      { cardId: R, quantity: 1, equipmentState: standardEquipmentState },
      { cardId: P, quantity: 2 },
    ])
    expect(gear.availableActions).toEqual([
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

  it('REQ-45: availableActions aceita prepare na ordem do contrato e recusa tipo desconhecido', () => {
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
      'activateCombatEffect',
      'useAbility',
      'escapeCombat',
      'combatAttack',
      'endCombatTurn',
      'resolveTriggeredEffect',
      'completeDimension',
      'endTurn',
    ])
    expect(partyActionTypeSchema.safeParse('wear').success).toBe(false)
  })
})

describe('REQ-44: cartas novas da fixture', () => {
  it('REQ-44: as 5 cartas novas validam e o catálogo de teste está na ordem de id', async () => {
    for (const card of [
      shortSwordFixture,
      oakShieldFixture,
      ironHelmFixture,
      arcaneWandFixture,
      pickaxeFixture,
    ]) {
      expect(cardSchema.safeParse(card).success).toBe(true)
    }
    const response = await fetch(
      'http://localhost:3000/catalog/collections/fixture/cards',
    )
    const ids = ((await response.json()) as { id: string }[]).map(
      (card) => card.id,
    )
    expect(ids).toEqual([...ids].sort())
    expect(ids).toHaveLength(32)
    expect(fixtureCardsFixture).toHaveLength(32)
    expect(ids).toEqual(expect.arrayContaining([W, D, H, R, K]))
  })

  it('REQ-44: as propriedades fixadas pelos cenários do contrato', () => {
    expect(shortSwordFixture).toMatchObject({
      type: 'equipment',
      slot: 'weapon',
      blocksShield: false,
      modifiers: [{ modifier: 'attack', value: 2 }],
    })
    expect(oakShieldFixture).toMatchObject({
      type: 'equipment',
      slot: 'shield',
      modifiers: [{ modifier: 'defense', value: 2 }],
    })
    expect(ironHelmFixture).toMatchObject({
      type: 'equipment',
      slot: 'head',
      peakRequirement: 50,
      modifiers: [{ modifier: 'defense', value: 1 }],
    })
    expect(arcaneWandFixture).toMatchObject({
      type: 'equipment',
      slot: 'weapon',
      classRestriction: ['mage'],
    })
    expect(pickaxeFixture).toMatchObject({
      type: 'item',
      itemCategory: 'tool',
    })
  })

  it('REQ-44: as contagens da coleção e as listas por tipo seguem as cartas', () => {
    expect(collectionsFixture[0].cardCounts).toEqual({
      zone: 4,
      attribute: 3,
      equipment: 7,
      item: 12,
      randomEvent: 2,
      combatEvent: 1,
      zoneQuest: 0,
      dimension: 1,
      mount: 2,
    })
    expect(
      collectionSummarySchema.safeParse(collectionsFixture[0]).success,
    ).toBe(true)
    expect(fixtureCardsByTypeFixture.equipment.map((c) => c.id)).toEqual([
      R,
      B,
      'fixture.focus-amulet',
      'fixture.guardian-armor',
      H,
      D,
      W,
    ])
    expect(fixtureCardsByTypeFixture.item.map((c) => c.id)).toEqual([
      'fixture.arrows',
      'fixture.booster',
      'fixture.ember-shard',
      'fixture.fishing-rod',
      P,
      'fixture.iron-ore',
      'fixture.lucky-coin',
      K,
      'fixture.shard',
      'fixture.silver-fish',
      'fixture.strength-tonic',
      'fixture.sword-blueprint',
    ])
  })
})

describe('REQ-45: Preparar por usePartyAction', () => {
  function renderAction(partyId: string) {
    return renderHook(() => usePartyAction(partyId), { wrapper })
  }

  async function send(partyId: string, action: PartyAction) {
    const { result } = renderAction(partyId)
    act(() => result.current.mutate(action))
    await waitFor(() =>
      expect(result.current.isSuccess || result.current.isError).toBe(true),
    )
    return result.current
  }

  it('REQ-45: equip da arma devolve o Party com a arma em uso e envia o corpo do contrato', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyBladeEquippedFixture)
      }),
    )
    const state = await send(gearId, {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(body).toEqual({ type: 'prepare', operation: 'equip', cardId: B })
    expect(state.data).toEqual(partyBladeEquippedFixture)
    const player = partyBladeEquippedFixture.members[0].player
    expect(player.equipment.weapon).toBe(B)
    expect(player.inventory.some((slot) => slot.cardId === B)).toBe(false)
    expect(player.effectiveModifiers.attack).toBe(9)
    expect(player.effectiveModifiers.accuracy).toBe(50)
    expect(partyBladeEquippedFixture.turn.actionPoints).toBe(3)
  })

  it('REQ-45: pelo handler padrão, equip B e unequip weapon dão os Party prontos do cenário', async () => {
    const equipped = await send(gearId, {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(equipped.data).toEqual(partyBladeEquippedFixture)
    queryClient.clear()
    const unequipped = await send(gearId, {
      type: 'prepare',
      operation: 'unequip',
      slot: 'weapon',
    })
    expect(unequipped.data).toEqual(partyBladeUnequippedFixture)
    const player = partyBladeUnequippedFixture.members[0].player
    expect(player.equipment.weapon).toBeNull()
    expect(player.inventory.at(-1)).toEqual({
      cardId: B,
      quantity: 1,
      equipmentState: standardEquipmentState,
    })
    expect(player.effectiveModifiers.attack).toBe(6)
  })

  it('REQ-45: cada motivo de recusa do equip vira ActionNotAllowedError com o reason', async () => {
    const table: [string, string][] = [
      [D, 'shieldBlocked'],
      [H, 'peakRequirementNotMet'],
      [R, 'classRestricted'],
      [P, 'notEquipment'],
      [K, 'notInInventory'],
    ]
    for (const [cardId, reason] of table) {
      queryClient.clear()
      const state = await send(gearId, {
        type: 'prepare',
        operation: 'equip',
        cardId,
      })
      expect(state.error).toBeInstanceOf(ActionNotAllowedError)
      expect(state.error).toMatchObject({
        code: 'ACTION_NOT_ALLOWED',
        reason,
      })
    }
  })

  it('REQ-45: unequip de slot vazio vira ActionNotAllowedError slotEmpty', async () => {
    const state = await send(gearId, {
      type: 'prepare',
      operation: 'unequip',
      slot: 'head',
    })
    expect(state.error).toBeInstanceOf(ActionNotAllowedError)
    expect(state.error).toMatchObject({ reason: 'slotEmpty' })
  })

  it('REQ-45: inventoryFull é motivo conhecido; motivo fora do contrato é erro de validação', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_NOT_ALLOWED',
              message: 'Esta ação não é permitida agora.',
              details: { reason: 'inventoryFull' },
            },
          },
          { status: 409 },
        ),
      ),
    )
    const full = await send(gearId, {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(full.error).toMatchObject({ reason: 'inventoryFull' })

    queryClient.clear()
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_NOT_ALLOWED',
              message: 'Esta ação não é permitida agora.',
              details: { reason: 'brandNew' },
            },
          },
          { status: 409 },
        ),
      ),
    )
    const unknown = await send(gearId, {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(unknown.error).not.toBeInstanceOf(ActionNotAllowedError)
    expect(unknown.error).toBeInstanceOf(Error)
  })

  it('REQ-45: pelo handler padrão, operation desconhecida dá 400 e o grupo sem pontos ainda equipa', async () => {
    const wear = await send(gearId, {
      type: 'prepare',
      operation: 'wear',
    } as unknown as PartyAction)
    expect(wear.error).toMatchObject({ code: 'ACTION_INVALID' })
    queryClient.clear()
    const noPoints = await send('party-sem-pontos', {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(noPoints.isSuccess).toBe(true)
  })

  it('REQ-45: operation desconhecida chega como ApiError ACTION_INVALID', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_INVALID',
              message: 'Ação inválida.',
              details: {
                fields: [{ field: 'operation', reason: 'unknownOperation' }],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const state = await send(partyInSessionFixture.id, {
      type: 'prepare',
      operation: 'equip',
      cardId: B,
    })
    expect(state.error).toBeInstanceOf(ApiError)
    expect(state.error).toMatchObject({ code: 'ACTION_INVALID' })
  })
})

describe('REQ-46: useParty (GET /parties/:partyId)', () => {
  it('REQ-46: entrega o Party validado do grupo pedido', async () => {
    const { result } = renderHook(() => useParty(partyCreatedFixture.id), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(partyCreatedFixture)
  })

  it('REQ-46: partyId null deixa a consulta parada, sem pedido', () => {
    const { result } = renderHook(() => useParty(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('REQ-46: 404 PARTY_NOT_FOUND chega como ApiError', async () => {
    const { result } = renderHook(() => useParty('party-inexistente'), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error).toMatchObject({
      code: partyNotFoundFixture.error.code,
    })
  })

  it('REQ-46: resposta fora do contrato vira erro, sem Party', async () => {
    server.use(
      http.get('*/parties/:partyId', () => HttpResponse.json({ id: 'x' })),
    )
    const { result } = renderHook(() => useParty('x'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe('REQ-46: useLabGrant (POST /lab/parties/:partyId/members/:memberId/grants)', () => {
  async function grant(
    grantBody: Parameters<ReturnType<typeof useLabGrant>['mutate']>[0]['grant'],
    ids: { partyId?: string; memberId?: string } = {},
  ) {
    const { result } = renderHook(() => useLabGrant(), { wrapper })
    act(() =>
      result.current.mutate({
        partyId: ids.partyId ?? partyCreatedFixture.id,
        memberId: ids.memberId ?? memberId,
        grant: grantBody,
      }),
    )
    await waitFor(() =>
      expect(result.current.isSuccess || result.current.isError).toBe(true),
    )
    return result.current
  }

  it('REQ-46: doar carta envia o corpo do contrato e devolve o Party com P em 2', async () => {
    let seen: { url: string; body: unknown } | undefined
    server.use(
      http.post(
        '*/lab/parties/:partyId/members/:memberId/grants',
        async ({ request }) => {
          seen = { url: request.url, body: await request.json() }
          return HttpResponse.json(partyGrantedCardFixture)
        },
      ),
    )
    const state = await grant({ type: 'card', cardId: P, quantity: 2 })
    expect(seen?.url).toBe(
      `http://localhost:3000/lab/parties/${partyCreatedFixture.id}/members/${memberId}/grants`,
    )
    expect(seen?.body).toEqual({ type: 'card', cardId: P, quantity: 2 })
    expect(state.data?.members[0].player.inventory).toEqual([
      { cardId: P, quantity: 2 },
    ])
  })

  it('REQ-46: os números vão como digitados (o backend valida)', async () => {
    let body: unknown
    server.use(
      http.post(
        '*/lab/parties/:partyId/members/:memberId/grants',
        async ({ request }) => {
          body = await request.json()
          return HttpResponse.json(partyGrantedGoldFixture)
        },
      ),
    )
    await grant({ type: 'gold', amount: 2.5 })
    expect(body).toEqual({ type: 'gold', amount: 2.5 })
  })

  it('REQ-46: pelo handler padrão, doar carta dá P em 2 e doar ouro dá ouro 300', async () => {
    const card = await grant({ type: 'card', cardId: P, quantity: 2 })
    expect(card.data).toEqual(partyGrantedCardFixture)
    const gold = await grant({ type: 'gold', amount: 295 })
    expect(gold.data).toEqual(partyGrantedGoldFixture)
    expect(partyGrantedGoldFixture.members[0].player.gold).toBe(300)
  })

  it('REQ-46: 400 LAB_GRANT_INVALID vira LabGrantInvalidError com os campos', async () => {
    const state = await grant({
      type: 'card',
      cardId: 'fixture.gray-harbor',
      quantity: 1,
    })
    expect(state.error).toBeInstanceOf(LabGrantInvalidError)
    expect(state.error).toBeInstanceOf(ApiError)
    expect(state.error).toMatchObject({
      code: 'LAB_GRANT_INVALID',
      message: 'Doação inválida.',
      fields: [{ field: 'cardId', reason: 'notGrantable' }],
    })
  })

  it('REQ-46: 409 LAB_GRANT_NO_SPACE vira LabGrantNoSpaceError com o reason', async () => {
    for (const reason of ['inventoryFull', 'tcgFolderFull']) {
      queryClient.clear()
      server.use(
        http.post('*/lab/parties/:partyId/members/:memberId/grants', () =>
          HttpResponse.json(
            {
              error: {
                code: 'LAB_GRANT_NO_SPACE',
                message: 'Não há espaço para essa doação.',
                details: { reason },
              },
            },
            { status: 409 },
          ),
        ),
      )
      const state = await grant({ type: 'card', cardId: K, quantity: 1 })
      expect(state.error).toBeInstanceOf(LabGrantNoSpaceError)
      expect(state.error).toMatchObject({ code: 'LAB_GRANT_NO_SPACE', reason })
    }
  })

  it('REQ-46: details fora do contrato nos dois erros viram erro de validação', async () => {
    for (const [code, status] of [
      ['LAB_GRANT_INVALID', 400],
      ['LAB_GRANT_NO_SPACE', 409],
    ] as const) {
      queryClient.clear()
      server.use(
        http.post('*/lab/parties/:partyId/members/:memberId/grants', () =>
          HttpResponse.json(
            { error: { code, message: 'x', details: { reason: 'nova' } } },
            { status },
          ),
        ),
      )
      const state = await grant({ type: 'gold', amount: 1 })
      expect(state.error).toBeInstanceOf(Error)
      expect(state.error).not.toBeInstanceOf(LabGrantInvalidError)
      expect(state.error).not.toBeInstanceOf(LabGrantNoSpaceError)
    }
  })

  it('REQ-46: CARD_NOT_FOUND, MEMBER_NOT_FOUND e PARTY_NOT_FOUND chegam como ApiError', async () => {
    const card = await grant({
      type: 'card',
      cardId: 'fixture.nope',
      quantity: 1,
    })
    expect(card.error).toMatchObject({ code: 'CARD_NOT_FOUND' })
    queryClient.clear()
    const member = await grant(
      { type: 'gold', amount: 1 },
      { memberId: 'member-outro' },
    )
    expect(member.error).toMatchObject({
      code: 'MEMBER_NOT_FOUND',
      message: 'Membro não encontrado neste grupo.',
    })
    queryClient.clear()
    const party = await grant(
      { type: 'gold', amount: 1 },
      { partyId: 'party-inexistente' },
    )
    expect(party.error).toMatchObject({ code: 'PARTY_NOT_FOUND' })
    for (const state of [card, member, party]) {
      expect(state.error).toBeInstanceOf(ApiError)
    }
  })

  it('REQ-46: Party fora do contrato no 200 vira erro, sem dado', async () => {
    server.use(
      http.post('*/lab/parties/:partyId/members/:memberId/grants', () =>
        HttpResponse.json({ id: 'x' }),
      ),
    )
    const state = await grant({ type: 'gold', amount: 1 })
    expect(state.error).toBeInstanceOf(Error)
    expect(state.data).toBeUndefined()
  })
})
