import { HttpResponse } from 'msw'
import type { MarketView } from '../api/market'
import type { Party, PlayerState } from '../api/parties'
import {
  directRoutes,
  partyInSessionFixture,
  standardEquipmentState,
} from './partyFixtures'

/**
 * Respostas fixas dos cenários do CONTRATO §3 FEAT-18 (v0.90), sem estado
 * (D-29, D-64 item 6). Preços, rotas, destinos e "pode vender" são os do
 * contrato ou valores de exemplo prontos; nada é calculado por pedido
 * (Princípio 3). Dois grupos de dev: `party-estabulo` (cenário "Estábulo",
 * na Mina Velha) e `party-montaria` (com o Pônei de Guerra e conteúdo).
 */

const H = 'fixture.plow-horse'
const WP = 'fixture.war-pony'
const P = 'fixture.healing-potion'
const W = 'fixture.short-sword'
const STR = 'fixture.strength-basic'
const O = 'fixture.iron-ore'
const mine = 'fixture.old-mine'
const harbor = 'fixture.gray-harbor'
const bend = 'fixture.stone-bend'
const base = partyInSessionFixture.members[0]!
const mapZones = new Set(
  partyInSessionFixture.dimension.map.zones.map(({ zoneId }) => zoneId),
)

function withPlayer(id: string, player: Partial<PlayerState>): Party {
  return {
    ...partyInSessionFixture,
    id,
    members: [{ ...base, player: { ...base.player, ...player } }],
    savedAt: '2026-11-24T18:00:00.000Z',
  }
}

/** Mercado da Mina Velha (Rural com Estábulo, laboratório do cenário: fator 115%). */
const mineMarket = (stable: MarketView['stable']): MarketView => ({
  zoneId: mine,
  factorPercent: 115,
  stock: [],
  boosters: [],
  showcase: null,
  services: [],
  sellOffers: [],
  stable,
})

const outsideCity = {
  zoneId: mine,
  moveTargets: [bend],
  moveRoutes: directRoutes([bend]),
  blacksmith: null,
  availableActions: [
    'move',
    'recover',
    'prepare',
    'adjustDeck',
    'visitMarket',
    'endTurn',
  ],
} satisfies Partial<PlayerState>

/** Cenário "Estábulo": na Mina Velha com 400 de ouro, sem montaria. */
export const partyStableFixture = withPlayer('party-estabulo', {
  ...outsideCity,
  gold: 400,
  inventoryCapacity: 1,
  market: mineMarket({
    offers: [{ cardId: H, price: 322 }],
    currentMount: null,
  }),
})

const boughtMount = {
  cardId: H,
  inventory: [],
  inventoryCapacity: 1,
  tcgFolder: [],
  tcgFolderCapacity: 10,
}

/** 200 de `[{ buyMount H }]` no cenário "Estábulo". */
export const partyStableBoughtFixture = withPlayer('party-estabulo', {
  ...outsideCity,
  gold: 78,
  inventoryCapacity: 1,
  mount: boughtMount,
  market: mineMarket({
    offers: [{ cardId: H, price: 322 }],
    currentMount: { cardId: H, price: 140, sellable: true },
  }),
  lastMarketVisit: {
    zoneId: mine,
    results: [{ operation: 'buyMount', cardId: H, gold: -322 }],
    goldLost: 0,
  },
})

const ponyMount = {
  cardId: WP,
  inventory: [{ cardId: P, quantity: 2 }],
  inventoryCapacity: 4,
  tcgFolder: [{ cardId: STR, copies: 1 }],
  tcgFolderCapacity: 10,
}

/** Recompensa pendente do cenário "Descarte com montaria" (inventário e inventário extra cheios). */
const mountReward = {
  id: 'reward-montaria',
  memberId: base.id,
  cardId: O,
  origin: { type: 'fixed' },
  source: { type: 'scavenge' },
  destination: 'mountInventory',
  discardOptions: [
    { cardId: W, space: 'inventory', maxCopies: 1 },
    { cardId: P, space: 'mountInventory', maxCopies: 2 },
  ],
  decisionDeadlineAt: null,
} satisfies Party['pendingRewards'][number]

const mountedPlayer = {
  zoneId: mine,
  moveTargets: [bend, harbor],
  moveRoutes: [
    { zoneId: bend, direct: true, via: [] },
    { zoneId: harbor, direct: false, via: [bend] },
  ],
  blacksmith: null,
  gold: 100,
  inventory: [
    { cardId: W, quantity: 1, equipmentState: standardEquipmentState },
  ],
  inventoryCapacity: 1,
  tcgFolder: [
    { cardId: STR, copies: 2 },
    { cardId: 'fixture.dexterity-basic', copies: 1 },
  ],
  mount: ponyMount,
  activatableEffects: [
    { cardId: WP, effectIndex: 0, source: 'mount', handPayment: null },
  ],
  usableAbilities: [
    {
      targetIds: [],
      vigorCost: 0,
      paymentCosts: [],
      abilityId: 'pony-trot',
      mountAbility: true,
    },
  ],
  market: mineMarket({
    offers: [{ cardId: H, price: 322 }],
    currentMount: { cardId: WP, price: 40, sellable: false },
  }),
  availableActions: [
    'move',
    'recover',
    'prepare',
    'adjustDeck',
    'visitMarket',
    'resolveReward',
    'endTurn',
  ],
} satisfies Partial<PlayerState>

/** Grupo de dev com montaria: conteúdo, rota a 2 zonas e descarte na montaria. */
export const partyMountedFixture: Party = {
  ...withPlayer('party-montaria', mountedPlayer),
  pendingRewards: [mountReward],
}

const mounted = (player: Partial<PlayerState>, rest: Partial<Party> = {}) => ({
  ...withPlayer('party-montaria', { ...mountedPlayer, ...player }),
  ...rest,
})

/** 200 de `transferMount` `toMount` da pasta (cenário "Transferir"). */
export const partyMountTransferredFixture = mounted(
  {
    tcgFolder: [{ cardId: 'fixture.dexterity-basic', copies: 1 }],
    mount: { ...ponyMount, tcgFolder: [{ cardId: STR, copies: 2 }] },
  },
  { pendingRewards: [mountReward] },
)

/** 200 de `move` para o Porto Cinzento, a 2 travessias. */
export const partyMountMovedFixture = mounted(
  {
    zoneId: harbor,
    moveTargets: [bend, 'fixture.whispering-grove', mine],
    moveRoutes: [
      { zoneId: bend, direct: true, via: [] },
      { zoneId: 'fixture.whispering-grove', direct: true, via: [] },
      { zoneId: mine, direct: false, via: [bend] },
    ],
    market: null,
  },
  {
    pendingRewards: [mountReward],
    turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
  },
)

/** 200 de `move` para a Curva de Pedra (1 travessia). */
export const partyMountMovedToBendFixture = mounted(
  {
    zoneId: bend,
    moveTargets: [harbor, mine],
    moveRoutes: directRoutes([harbor, mine]),
    market: null,
  },
  {
    pendingRewards: [mountReward],
    turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
  },
)

/** 200 de `buyStock` com o inventário cheio (cenário "Destino pronto"). */
export const partyMountStockFixture = mounted(
  {
    gold: 93,
    mount: { ...ponyMount, inventory: [{ cardId: P, quantity: 3 }] },
    lastMarketVisit: {
      zoneId: mine,
      results: [
        {
          operation: 'buyStock',
          cardId: P,
          quantity: 1,
          copiesReceived: 1,
          gold: -7,
          received: [{ space: 'mountInventory', quantity: 1 }],
        },
      ],
      goldLost: 0,
    },
  },
  { pendingRewards: [mountReward] },
)

/** 200 de manter descartando `P` da montaria (cenário "Descarte com montaria"). */
export const partyMountRewardKeptFixture = mounted({
  mount: { ...ponyMount, inventory: [{ cardId: O, quantity: 1 }] },
  lastRewardDelivery: {
    rewardId: mountReward.id,
    cardId: O,
    origin: mountReward.origin,
    disposition: 'kept',
    space: 'mountInventory',
  },
})

/** 200 de deixar a recompensa. */
export const partyMountRewardLeftFixture = mounted({
  lastRewardDelivery: {
    rewardId: mountReward.id,
    cardId: O,
    origin: mountReward.origin,
    disposition: 'sentToLimbo',
    space: null,
  },
})

/** 200 de ativar o efeito do Pônei (exemplo: +2 de ouro). */
export const partyMountEffectFixture = mounted(
  { gold: 102 },
  { pendingRewards: [mountReward] },
)

/** 200 da doação de uma montaria a quem não tem (laboratório). */
export const partyMountGrantedFixture: Party = {
  ...partyInSessionFixture,
  members: [
    {
      ...base,
      player: {
        ...base.player,
        mount: { ...boughtMount, inventoryCapacity: 4 },
      },
    },
  ],
  savedAt: '2026-11-24T18:05:00.000Z',
}

export const mountParties = [partyStableFixture, partyMountedFixture]

export function mountParty(id: unknown): Party | undefined {
  return mountParties.find((party) => party.id === id)
}

function refuse(details: {
  reason: string
  operationIndex?: number
  cardId?: string
}) {
  return HttpResponse.json(
    {
      error: {
        code: 'ACTION_NOT_ALLOWED',
        message: 'Esta ação não é permitida agora.',
        details,
      },
    },
    { status: 409 },
  )
}

function malformed(field: string, reason: string) {
  return HttpResponse.json(
    {
      error: {
        code: 'ACTION_INVALID',
        message: 'Ação inválida.',
        details: { fields: [{ field, reason }] },
      },
    },
    { status: 400 },
  )
}

function get(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null && key in body
    ? (body as Record<string, unknown>)[key]
    : undefined
}

/** Formato de `transferMount` e de `useAbility` (iguais em qualquer grupo). */
function formatScenario(body: unknown): Response | undefined {
  if (get(body, 'type') !== 'prepare') return undefined
  const operation = get(body, 'operation')
  if (operation === 'transferMount') {
    const direction = get(body, 'direction')
    if (direction !== 'toMount' && direction !== 'fromMount')
      return malformed('direction', 'unknownOption')
    const quantity = get(body, 'quantity')
    if (!Number.isInteger(quantity) || (quantity as number) < 1)
      return malformed('quantity', 'notPositiveInteger')
  }
  if (operation === 'useAbility') {
    const slot = get(body, 'equipmentSlot') !== undefined
    const fromMount = get(body, 'mountAbility') !== undefined
    if (slot === fromMount) return malformed('mountAbility', 'invalidBody')
  }
  return undefined
}

/**
 * Pedidos da FEAT-18 em qualquer grupo: devolve a resposta do cenário, ou
 * `undefined` para o handler seguir com as tabelas das FEATs anteriores.
 */
export function mountAction(
  partyId: unknown,
  body: unknown,
): Response | undefined {
  const format = formatScenario(body)
  if (format) return format
  const type = get(body, 'type')
  const operation = get(body, 'operation')
  const operations = get(body, 'operations')
  const first = Array.isArray(operations) ? operations[0] : undefined
  const firstOperation = get(first, 'operation')

  if (partyId === partyMountedFixture.id) return mountedAction(body)

  const usesMount =
    (type === 'prepare' &&
      (operation === 'transferMount' ||
        (operation === 'useAbility' && get(body, 'mountAbility') === true))) ||
    (type === 'move' && get(body, 'viaZoneId') !== undefined) ||
    (type === 'visitMarket' && firstOperation === 'sellMount')
  if (type === 'move' && get(body, 'viaZoneId') !== undefined) {
    const via = get(body, 'viaZoneId')
    if (typeof via !== 'string' || !mapZones.has(via))
      return malformed('viaZoneId', 'zoneNotInMap')
  }
  if (usesMount) {
    return refuse(
      type === 'visitMarket'
        ? { reason: 'noMount', operationIndex: 0 }
        : { reason: 'noMount' },
    )
  }
  if (type === 'visitMarket' && firstOperation === 'buyMount') {
    const cardId = get(first, 'cardId')
    return partyId === partyStableFixture.id && cardId === H
      ? HttpResponse.json(partyStableBoughtFixture)
      : refuse({
          reason: 'mountNotOffered',
          operationIndex: 0,
          ...(typeof cardId === 'string' && { cardId }),
        })
  }
  return undefined
}

function mountedAction(body: unknown): Response | undefined {
  const type = get(body, 'type')
  const operation = get(body, 'operation')
  if (type === 'prepare' && operation === 'transferMount') {
    const direction = get(body, 'direction')
    const space = get(body, 'space')
    const cardId = get(body, 'cardId')
    if (direction === 'fromMount' && space === 'inventory')
      return refuse({ reason: 'inventoryFull' })
    const owned =
      direction === 'toMount'
        ? space === 'tcgFolder'
          ? mountedPlayer.tcgFolder.some((entry) => entry.cardId === cardId)
          : mountedPlayer.inventory.some((slot) => slot.cardId === cardId)
        : space === 'tcgFolder'
          ? ponyMount.tcgFolder.some((entry) => entry.cardId === cardId)
          : false
    return owned
      ? HttpResponse.json(partyMountTransferredFixture)
      : refuse({
          reason: 'notOwned',
          ...(typeof cardId === 'string' && { cardId }),
        })
  }
  if (type === 'prepare' && operation === 'useAbility')
    return HttpResponse.json(partyMountEffectFixture)
  if (
    type === 'prepare' &&
    operation === 'activate' &&
    get(body, 'cardId') === WP
  )
    return HttpResponse.json(partyMountEffectFixture)
  if (type === 'move') {
    const zoneId = get(body, 'zoneId')
    const via = get(body, 'viaZoneId')
    if (via !== undefined && (typeof via !== 'string' || !mapZones.has(via)))
      return malformed('viaZoneId', 'zoneNotInMap')
    const route = mountedPlayer.moveRoutes.find((r) => r.zoneId === zoneId)
    if (
      !route ||
      (via !== undefined && !route.via.some((zone: string) => zone === via))
    )
      return refuse({ reason: 'notConnected' })
    return HttpResponse.json(
      zoneId === harbor ? partyMountMovedFixture : partyMountMovedToBendFixture,
    )
  }
  if (type === 'visitMarket') {
    const operations = get(body, 'operations')
    const index = Array.isArray(operations)
      ? operations.findIndex((op) => {
          const kind = get(op, 'operation')
          return kind === 'buyMount' || kind === 'sellMount'
        })
      : -1
    if (index >= 0 && Array.isArray(operations)) {
      const op: unknown = operations[index]
      if (get(op, 'operation') === 'sellMount')
        return refuse({ reason: 'mountNotEmpty', operationIndex: index })
      const cardId = get(op, 'cardId')
      return refuse({
        reason: 'mountAlreadyOwned',
        operationIndex: index,
        ...(typeof cardId === 'string' && { cardId }),
      })
    }
    return HttpResponse.json(partyMountStockFixture)
  }
  if (type === 'resolveReward') {
    if (get(body, 'choice') === 'leave')
      return HttpResponse.json(partyMountRewardLeftFixture)
    const discard = get(body, 'discard')
    const options = mountReward.discardOptions
    const fits =
      Array.isArray(discard) &&
      discard.some((entry) => get(entry, 'space') === 'mountInventory') &&
      discard.every((entry) => {
        const copies = get(entry, 'copies')
        const option = options.find(
          (o) =>
            o.cardId === get(entry, 'cardId') &&
            o.space === get(entry, 'space'),
        )
        return (
          option !== undefined &&
          typeof copies === 'number' &&
          copies <= option.maxCopies
        )
      })
    return fits
      ? HttpResponse.json(partyMountRewardKeptFixture)
      : refuse({ reason: 'rewardDoesNotFit' })
  }
  return undefined
}

/** Doação de montaria (laboratório); outra carta segue o cenário da FEAT-10. */
export function mountGrant(
  partyId: unknown,
  body: unknown,
): Response | undefined {
  const cardId = get(body, 'cardId')
  if (get(body, 'type') !== 'card' || (cardId !== H && cardId !== WP))
    return undefined
  if (partyId === partyMountedFixture.id) {
    return HttpResponse.json(
      {
        error: {
          code: 'LAB_GRANT_NO_SPACE',
          message: 'O membro já tem uma montaria.',
          details: { reason: 'mountAlreadyOwned' },
        },
      },
      { status: 409 },
    )
  }
  return HttpResponse.json(partyMountGrantedFixture)
}
