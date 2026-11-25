import type {
  BlacksmithView,
  EquipmentState,
  ServiceView,
} from '../api/blacksmith'
import type { Party, PlayerState } from '../api/parties'
import { partyInSessionFixture, standardEquipmentState } from './partyFixtures'

/**
 * Respostas fixas dos cenários do CONTRATO §3 FEAT-17 (v0.85), sem estado
 * (D-29, D-63 item 6). Custos, limiares, estados e resultados são os do
 * contrato (laboratório do cenário: limiar +4 a +6 = 21, quebra a partir de
 * +4, encantamento de elemento sem teste) ou valores de exemplo prontos; nada
 * é calculado por pedido (Princípio 3). O grupo com Artífice ativo é dado de
 * exemplo, só para a tela da Oficina no dev (decisão do autor, 2026-11-24).
 */

const W = 'fixture.short-sword'
const O = 'fixture.iron-ore'
const E = 'fixture.ember-shard'
const B = 'fixture.sword-blueprint'
const harbor = 'fixture.gray-harbor'
const base = partyInSessionFixture.members[0]!
const baseView = base.player.blacksmith!
const emberEdge = baseView.enchantments[0]!.enchantment
const weapon = { location: 'equipment', slot: 'weapon' } as const
type Step = ServiceView['equipment'][number]['refineSteps'][number]

function withPlayer(id: string, player: Partial<PlayerState>): Party {
  return {
    ...partyInSessionFixture,
    id,
    members: [{ ...base, player: { ...base.player, ...player } }],
    savedAt: '2026-11-24T12:00:00.000Z',
  }
}

/** Um nível seguinte, com os valores prontos do cenário. */
const step = (
  targetLevel: number,
  threshold: number,
  breaksOnFailure: boolean,
  d20Bonus = 0,
): Step => ({
  targetLevel,
  materials: [{ cardId: O, quantity: 1 }],
  gold: targetLevel * 10,
  threshold,
  d20Bonus,
  breaksOnFailure,
})

/** Níveis +1 a +10 no laboratório do cenário (valores do contrato). */
const scenarioSteps: Step[] = [
  step(1, 0, false),
  step(2, 0, false),
  step(3, 0, false),
  step(4, 21, true),
  step(5, 21, true),
  step(6, 21, true),
  step(7, 12, true),
  step(8, 12, true),
  step(9, 12, true),
  step(10, 16, true),
]

const swordEntry = (
  state: EquipmentState,
  overrides: Partial<ServiceView['equipment'][number]> = {},
): ServiceView['equipment'][number] => ({
  target: weapon,
  cardId: W,
  state,
  repair: null,
  refineSteps: scenarioSteps.slice(state.refinement),
  enchantOptions: [],
  ...overrides,
})

const smithyView = (
  equipment: ServiceView['equipment'],
  recipes: BlacksmithView['recipes'] = [],
): BlacksmithView => ({ ...baseView, blacksmith: { equipment }, recipes })

const cityActions = [
  'move',
  'recover',
  'prepare',
  'adjustDeck',
  'useVault',
  'visitBlacksmith',
  'visitMarket',
  'endTurn',
] as const

/** Fio de Brasa aplicado no slot 0 (`active` conforme o estado). */
const applied = (active: boolean) => ({
  enchantment: emberEdge,
  zoneId: harbor,
  slotIndex: 0,
  active,
})

const brokenState: EquipmentState = {
  refinement: 3,
  enchantments: [applied(false)],
  repairMarks: 0,
  broken: true,
}
const repairedState: EquipmentState = {
  refinement: 3,
  enchantments: [applied(true)],
  repairMarks: 1,
  broken: false,
}

/** "Estado inicial": Espada Curta em uso, 4 Minérios, 1 Fragmento, o Projeto e 300 de ouro. */
export const partyBlacksmithFixture: Party = withPlayer('party-ferreiro', {
  gold: 300,
  equipment: { ...base.player.equipment, weapon: W },
  equipmentStates: {
    ...base.player.equipmentStates,
    weapon: standardEquipmentState,
  },
  inventory: [
    { cardId: O, quantity: 4 },
    { cardId: E, quantity: 1 },
    { cardId: B, quantity: 1 },
  ],
  availableActions: [...cityActions],
  blacksmith: smithyView(
    [
      swordEntry(standardEquipmentState, {
        enchantOptions: [
          {
            enchantmentId: 'ember-edge',
            replaceRequired: false,
            extra: false,
            requiresRefinement: 2,
          },
        ],
      }),
    ],
    [
      {
        inventorySlotIndex: 2,
        cardId: B,
        equipmentId: W,
        materials: [{ cardId: O, quantity: 2 }],
        gold: 15,
        consumed: false,
        canCraft: true,
      },
    ],
  ),
})

const smithyPlayer = partyBlacksmithFixture.members[0]!.player
const noPoints = { ...partyInSessionFixture.turn, actionPoints: 0 }

/** "Lote com falha e quebra": +1, +2, Fio de Brasa, +3, +4 falha e quebra, 5º pulado. */
export const partyBlacksmithBatchFixture: Party = {
  ...withPlayer(partyBlacksmithFixture.id, {
    ...smithyPlayer,
    gold: 150,
    inventory: [{ cardId: B, quantity: 1 }],
    equipmentStates: { ...smithyPlayer.equipmentStates, weapon: brokenState },
    availableActions: ['prepare', 'endTurn'],
    blacksmith: smithyView(
      [swordEntry(brokenState, { repair: { gold: 11 }, refineSteps: [] })],
      [{ ...smithyPlayer.blacksmith!.recipes[0]!, canCraft: false }],
    ),
    lastBlacksmithVisit: {
      source: 'blacksmith',
      zoneId: harbor,
      actionPointsSpent: 3,
      results: [
        ...[1, 2].map((targetLevel) => ({
          operation: 'refine' as const,
          target: weapon,
          cardId: W,
          targetLevel,
          gold: -10 * targetLevel,
          roll: null,
          d20Bonus: 0,
          threshold: 0,
          success: true,
          broke: false,
          skipped: false,
        })),
        {
          operation: 'enchant',
          target: weapon,
          cardId: W,
          enchantmentId: 'ember-edge',
          gold: -50,
          roll: null,
          threshold: 0,
          success: true,
          replaced: null,
          skipped: false,
        },
        {
          operation: 'refine',
          target: weapon,
          cardId: W,
          targetLevel: 3,
          gold: -30,
          roll: null,
          d20Bonus: 0,
          threshold: 0,
          success: true,
          broke: false,
          skipped: false,
        },
        {
          operation: 'refine',
          target: weapon,
          cardId: W,
          targetLevel: 4,
          gold: -40,
          roll: 14,
          d20Bonus: 0,
          threshold: 21,
          success: false,
          broke: true,
          skipped: false,
        },
        {
          operation: 'refine',
          target: weapon,
          cardId: W,
          targetLevel: 4,
          gold: 0,
          roll: null,
          d20Bonus: 0,
          threshold: 21,
          success: false,
          broke: false,
          skipped: true,
        },
      ],
    },
  }),
  turn: noPoints,
}

/** "Consertar": na vez seguinte, 5 + 2 × 3 = 11 de ouro (valor do contrato). */
export const partyBlacksmithRepairedFixture: Party = {
  ...withPlayer(partyBlacksmithFixture.id, {
    ...smithyPlayer,
    gold: 139,
    inventory: [{ cardId: B, quantity: 1 }],
    equipmentStates: {
      ...smithyPlayer.equipmentStates,
      weapon: repairedState,
    },
    availableActions: ['prepare', 'endTurn'],
    blacksmith: smithyView([swordEntry(repairedState)], []),
    lastBlacksmithVisit: {
      source: 'blacksmith',
      zoneId: harbor,
      actionPointsSpent: 3,
      results: [
        {
          operation: 'repair',
          target: weapon,
          cardId: W,
          gold: -11,
          repairMarks: 1,
          skipped: false,
        },
      ],
    },
  }),
  turn: noPoints,
}

/** "Criar": 2 Minérios e 15 de ouro; o Projeto continua e a espada nova entra no fim. */
export const partyBlacksmithCraftedFixture: Party = {
  ...withPlayer(partyBlacksmithFixture.id, {
    ...smithyPlayer,
    gold: 124,
    inventory: [
      { cardId: B, quantity: 1 },
      { cardId: W, quantity: 1, equipmentState: standardEquipmentState },
    ],
    availableActions: ['prepare', 'endTurn'],
    lastBlacksmithVisit: {
      source: 'blacksmith',
      zoneId: harbor,
      actionPointsSpent: 3,
      results: [
        {
          operation: 'craft',
          recipeCardId: B,
          equipmentId: W,
          gold: -15,
          inventorySlotIndex: 1,
          destination: 'inventory',
          skipped: false,
        },
      ],
    },
  }),
  turn: noPoints,
}

/** "Venda valorizada": a espada consertada guardada vale 3 de ouro (valor do contrato). */
export const partyBlacksmithSaleFixture: Party = withPlayer(
  partyBlacksmithFixture.id,
  {
    ...smithyPlayer,
    gold: 139,
    equipment: { ...smithyPlayer.equipment, weapon: null },
    equipmentStates: { ...smithyPlayer.equipmentStates, weapon: null },
    inventory: [
      { cardId: B, quantity: 1 },
      { cardId: W, quantity: 1, equipmentState: repairedState },
    ],
    market: {
      ...base.player.market!,
      sellOffers: [
        {
          source: 'inventory',
          cardId: W,
          owned: 1,
          lotSize: 1,
          price: 3,
          inventorySlotIndex: 1,
          equipmentState: repairedState,
        },
      ],
    },
    blacksmith: smithyView(
      [
        {
          ...swordEntry(repairedState),
          target: { location: 'inventory', inventorySlotIndex: 1 },
        },
      ],
      [],
    ),
  },
)

/** Níveis da Oficina com os padrões do laboratório: até +6, bônus +2 do Artífice. */
const workshopSteps: Step[] = [
  step(1, 0, false, 2),
  step(2, 0, false, 2),
  step(3, 0, false, 2),
  step(4, 8, false, 2),
  step(5, 8, false, 2),
  step(6, 8, false, 2),
]

/** Exemplo de dev: Artífice ativo no Porto Cinzento, com ferreiro e Oficina. */
export const partyArtificerFixture: Party = withPlayer('party-artifice', {
  ...smithyPlayer,
  playerClasses: [{ playerClass: 'artificer', deckLockMet: true }],
  availableActions: [
    'move',
    'recover',
    'prepare',
    'adjustDeck',
    'artificerWorkshop',
    'useVault',
    'visitBlacksmith',
    'visitMarket',
    'endTurn',
  ],
  blacksmith: {
    ...smithyPlayer.blacksmith!,
    workshop: {
      equipment: [
        swordEntry(standardEquipmentState, { refineSteps: workshopSteps }),
      ],
    },
  },
})

const artificerPlayer = partyArtificerFixture.members[0]!.player
const refinedOnce: EquipmentState = { ...standardEquipmentState, refinement: 1 }

/** Exemplo de dev: Oficina com um refino +1 sem teste, 1 PA. */
export const partyArtificerWorkshopFixture: Party = {
  ...withPlayer(partyArtificerFixture.id, {
    ...artificerPlayer,
    gold: 290,
    inventory: [
      { cardId: O, quantity: 3 },
      { cardId: E, quantity: 1 },
      { cardId: B, quantity: 1 },
    ],
    equipmentStates: {
      ...artificerPlayer.equipmentStates,
      weapon: refinedOnce,
    },
    blacksmith: {
      ...artificerPlayer.blacksmith!,
      workshop: {
        equipment: [
          swordEntry(refinedOnce, { refineSteps: workshopSteps.slice(1) }),
        ],
      },
    },
    lastBlacksmithVisit: {
      source: 'workshop',
      zoneId: harbor,
      actionPointsSpent: 1,
      results: [
        {
          operation: 'refine',
          target: weapon,
          cardId: W,
          targetLevel: 1,
          gold: -10,
          roll: null,
          d20Bonus: 2,
          threshold: 0,
          success: true,
          broke: false,
          skipped: false,
        },
      ],
    },
  }),
  turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
}

/** 409 `ACTION_NOT_ALLOWED` do ferreiro, com `operationIndex` quando há. */
export function blacksmithRefusalFixture(details: {
  reason: string
  operationIndex?: number
  cardId?: string
}) {
  return {
    error: {
      code: 'ACTION_NOT_ALLOWED',
      message: 'Esta ação não é permitida agora.',
      details,
    },
  } as const
}
