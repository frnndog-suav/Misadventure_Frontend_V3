import type {
  DimensionInvalidDetails,
  Party,
  PartyInvalidDetails,
  PartySummary,
} from '../api/parties'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-05 (v0.14) e FEAT-06 (v0.21) e FEAT-07 (v0.28).
 * `id`, datas, mão e mapa são gerados (e sorteados) pelo backend; aqui são
 * valores fixos de exemplo que respeitam as invariantes do cenário (D-32,
 * D-48). Só valores prontos — nenhuma regra (Princípio 3).
 */

const partyId = 'party-os-teimosos'
const strength = 'fixture.strength-basic'
const endurance = 'fixture.endurance-basic'
const blade = 'fixture.blade-of-dusk'
const shield = 'fixture.oak-shield'
const helm = 'fixture.iron-helm'
const wand = 'fixture.arcane-wand'
const potion = 'fixture.healing-potion'

/** FEAT-17 (CONTRATO v0.85): estado padrão de uma cópia de equipamento. */
export const standardEquipmentState = {
  refinement: 0,
  enchantments: [],
  repairMarks: 0,
  broken: false,
}
const gear = (cardId: string) => ({
  cardId,
  quantity: 1,
  equipmentState: standardEquipmentState,
})

const member: Party['members'][number] = {
  id: 'member-lia',
  characterName: 'Lia',
  kind: 'human',
  isHost: true,
  player: {
    questBoard: [],
    openQuests: [],
    questChoices: [],
    specializations: [],
    playerClasses: [{ playerClass: 'warrior', deckLockMet: true }],
    gold: 10,
    baseHealth: 20,
    maxHealth: 22,
    health: 22,
    peak: 10,
    vigor: 10,
    modifiers: {
      attack: 6,
      defense: 5,
      accuracy: 45,
      evasion: 15,
      celerity: 8,
      piercing: 0,
      reflection: 0,
    },
    hand: [
      strength,
      endurance,
      strength,
      strength,
      endurance,
      endurance,
      strength,
    ],
    attributeDeckCount: 53,
    attributeDiscardPileCount: 0,
    zoneId: 'fixture.gray-harbor',
    respawnZoneId: 'fixture.gray-harbor',
    lastKnockout: null,
    skipNextTurn: false,
    moveTargets: ['fixture.stone-bend', 'fixture.whispering-grove'],
    // FEAT-32, FEAT-16 e FEAT-17: a cidade inicial tem `useVault`,
    // `visitBlacksmith` e `visitMarket` (CONTRATO v0.85).
    availableActions: [
      'move',
      'recover',
      'adjustDeck',
      'useVault',
      'visitBlacksmith',
      'visitMarket',
      'endTurn',
    ],
    build: [
      { cardId: endurance, copies: 30 },
      { cardId: strength, copies: 30 },
    ],
    buildSize: 60,
    tcgFolder: [],
    tcgFolderCapacity: 30,
    // FEAT-10 (CONTRATO v0.41): ⌊modificador × (100 + Pico) ÷ 100⌋, pronto do backend.
    inventory: [],
    inventoryCapacity: 10,
    equipment: {
      head: null,
      torso: null,
      legs: null,
      feet: null,
      cape: null,
      weapon: null,
      shield: null,
      accessory: null,
    },
    purseCapacity: 300,
    statuses: [],
    activatableEffects: [],
    effectiveModifiers: {
      attack: 6,
      defense: 5,
      accuracy: 49,
      evasion: 16,
      celerity: 8,
      piercing: 0,
      reflection: 0,
    },
    // FEAT-32 (CONTRATO v0.46): cofre vazio e capacidades do laboratório.
    vault: { slots: [], decks: [], gold: 0 },
    vaultCapacity: 30,
    vaultDeckSlots: 10,
    vaultGoldCapacity: 2000,
    scavengeTargets: [],
    lastScavenge: null,
    // FEAT-16 (CONTRATO v0.81, cenário "Estado inicial" com fator 115). A
    // vitrine é sorteada pelo backend; aqui é fixa, de exemplo (D-62 item 5).
    expansions: {
      vaultSlots: 0,
      deckSlots: 0,
      tcgFolder: 0,
      purse: 0,
      vaultGold: 0,
    },
    market: {
      zoneId: 'fixture.gray-harbor',
      factorPercent: 115,
      stock: [
        { cardId: potion, price: 7, copiesPerPurchase: 1 },
        { cardId: 'fixture.arrows', price: 4, copiesPerPurchase: 10 },
        { cardId: 'fixture.fishing-rod', price: 23, copiesPerPurchase: 1 },
      ],
      boosters: [{ cardId: 'fixture.booster', price: 30 }],
      showcase: [
        {
          slotIndex: 0,
          offer: { cardId: strength, price: 6, destination: 'tcgFolder' },
        },
        {
          slotIndex: 1,
          offer: {
            cardId: 'fixture.short-sword',
            price: 7,
            destination: 'inventory',
          },
        },
        {
          slotIndex: 2,
          offer: {
            cardId: 'fixture.iron-ore',
            price: 6,
            destination: 'inventory',
          },
        },
        { slotIndex: 3, offer: null },
      ],
      services: [
        { expansion: 'vaultSlots', price: 50, capacity: 35 },
        { expansion: 'deckSlots', price: 100, capacity: 11 },
        { expansion: 'tcgFolder', price: 60, capacity: 40 },
        { expansion: 'purse', price: 150, capacity: 600 },
        { expansion: 'vaultGold', price: 500, capacity: 4000 },
      ],
      sellOffers: [],
    },
    lastMarketVisit: null,
    lastBoosterOpening: null,
    // FEAT-17 (CONTRATO v0.85): nada equipado; ferreiro do Porto Cinzento,
    // com o Fio de Brasa do cenário "Estado inicial" (limiar 0 no laboratório).
    equipmentStates: {
      head: null,
      torso: null,
      legs: null,
      feet: null,
      cape: null,
      weapon: null,
      shield: null,
      accessory: null,
    },
    blacksmith: {
      zoneId: 'fixture.gray-harbor',
      blacksmith: { equipment: [] },
      workshop: null,
      enchantments: [
        {
          enchantment: {
            id: 'ember-edge',
            name: 'Fio de Brasa',
            kind: 'element',
            element: 'fire',
            bonusPercent: 10,
            materials: [{ cardId: 'fixture.ember-shard', quantity: 1 }],
          },
          gold: 50,
          threshold: 0,
        },
      ],
      recipes: [],
    },
    lastBlacksmithVisit: null,
    handCopies: [
      strength,
      endurance,
      strength,
      strength,
      endurance,
      endurance,
      strength,
    ].map((cardId, index) => ({ cardId, copyId: `h${index + 1}` })),
    nextTurnActionPointDebt: 0,
    lastRandomEvent: null,
    lastRewardSearch: null,
    lastRewardDelivery: null,
  },
}

/** Mapa de exemplo: a cidade em (0, 0); as 4 zonas ligadas por 3 travessias. */
const dimension: Party['dimension'] = {
  dimensionCardId: 'fixture.test-dimension',
  startingCityZoneId: 'fixture.gray-harbor',
  map: {
    zones: [
      {
        zoneId: 'fixture.gray-harbor',
        x: 0,
        y: 0,
        arrows: ['north', 'east', 'south', 'west'],
      },
      {
        zoneId: 'fixture.whispering-grove',
        x: 1,
        y: 0,
        arrows: ['east', 'west'],
      },
      { zoneId: 'fixture.stone-bend', x: 0, y: 1, arrows: ['north', 'east'] },
      { zoneId: 'fixture.old-mine', x: 1, y: 1, arrows: ['west'] },
    ],
    crossings: [
      { zoneIds: ['fixture.gray-harbor', 'fixture.stone-bend'] },
      { zoneIds: ['fixture.gray-harbor', 'fixture.whispering-grove'] },
      { zoneIds: ['fixture.old-mine', 'fixture.stone-bend'] },
    ],
  },
}

/** 201 de POST /parties com "Os Teimosos" / "Lia" / `warrior`. */
export const partyCreatedFixture: Party = {
  id: partyId,
  name: 'Os Teimosos',
  status: 'idle',
  members: [member],
  dimension,
  turnOrder: [member.id],
  randomEventEncounter: null,
  pendingRewards: [],
  turn: { round: 1, memberId: member.id, actionPoints: 3 },
  createdAt: '2026-11-14T21:30:00.000Z',
  savedAt: '2026-11-14T21:30:00.000Z',
}

/** 200 de POST …/session (Continuar). */
export const partyInSessionFixture: Party = {
  ...partyCreatedFixture,
  status: 'inSession',
}

/** 200 de POST …/session/end (grava o save e deixa `idle`). */
export const partyIdleFixture: Party = {
  ...partyCreatedFixture,
  savedAt: '2026-11-14T22:05:00.000Z',
}

/**
 * Party em sessão com o jogador em `zoneId` (cenário de mover, FEAT-07 e
 * FEAT-08): o resto do `player` fica igual; `moveTargets` e os 2 pontos de
 * ação que restam depois de 1 movimento são valores prontos do backend.
 */
function partyMovedTo(zoneId: string, moveTargets: string[]): Party {
  return {
    ...partyInSessionFixture,
    members: [
      {
        ...member,
        player: {
          ...member.player,
          zoneId,
          moveTargets,
          // Fora da cidade: sem `useVault` (FEAT-32), sem mercado (FEAT-16)
          // e sem ferreiro (FEAT-17).
          market: null,
          blacksmith: null,
          availableActions: ['move', 'recover', 'adjustDeck', 'endTurn'],
        },
      },
    ],
    turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
    savedAt: '2026-11-14T21:40:00.000Z',
  }
}

/** 200 de POST …/actions com `move` para `fixture.stone-bend`. */
export const partyMovedToStoneBendFixture = partyMovedTo('fixture.stone-bend', [
  'fixture.gray-harbor',
  'fixture.old-mine',
])

/** 200 de POST …/actions com `move` para `fixture.whispering-grove`. */
export const partyMovedToGroveFixture = partyMovedTo(
  'fixture.whispering-grove',
  ['fixture.gray-harbor'],
)

/**
 * Grupo de exemplo com 0 pontos de ação (CONTRATO §3 FEAT-08): jogador em
 * `fixture.stone-bend`, só `endTurn` disponível. O `id` próprio é a chave do
 * cenário no handler (D-56 item 3).
 */
export const partyNoPointsFixture: Party = {
  ...partyMovedToStoneBendFixture,
  id: 'party-sem-pontos',
  members: [
    {
      ...member,
      player: {
        ...partyMovedToStoneBendFixture.members[0].player,
        availableActions: ['endTurn'],
      },
    },
  ],
  turn: { ...partyInSessionFixture.turn, actionPoints: 0 },
  savedAt: '2026-11-14T21:50:00.000Z',
}

/** 200 de POST …/actions com `endTurn`: rodada 2, pontos cheios. */
export const partyNextRoundFixture: Party = {
  ...partyInSessionFixture,
  turn: { round: 2, memberId: member.id, actionPoints: 3 },
  savedAt: '2026-11-14T21:45:00.000Z',
}

/**
 * Party em sessão depois de uma ação de 1 ponto que não muda a zona
 * (Recuperar, Ajustar deck; CONTRATO §3 FEAT-09): 2 pontos restantes e o
 * `player` com as mudanças prontas do backend.
 */
function partyAfterDeckAction(
  player: Partial<Party['members'][number]['player']>,
  savedAt: string,
): Party {
  return {
    ...partyInSessionFixture,
    members: [{ ...member, player: { ...member.player, ...player } }],
    turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
    savedAt,
  }
}

/** 200 de `recover` `drawToHand` com a mão já cheia: nada comprado, vida e Vigor no máximo. */
export const partyRecoveredDrawFixture = partyAfterDeckAction(
  {},
  '2026-11-14T21:41:00.000Z',
)

/** 200 de `recover` `shuffleHand`: mão vazia, as 7 cartas de volta ao deck. */
export const partyRecoveredShuffleHandFixture = partyAfterDeckAction(
  { hand: [], handCopies: [], attributeDeckCount: 60 },
  '2026-11-14T21:42:00.000Z',
)

/** 200 de `recover` `shuffleDiscard` com o descarte vazio. */
export const partyRecoveredShuffleDiscardFixture = partyAfterDeckAction(
  {},
  '2026-11-14T21:43:00.000Z',
)

/** 200 de `adjustDeck` com a build atual (sem mudança): mesma build, 7 na mão. */
export const partyDeckAdjustedFixture = partyAfterDeckAction(
  {},
  '2026-11-14T21:44:00.000Z',
)

/**
 * Grupo de exemplo com equipamentos no inventário (CONTRATO §3 FEAT-10):
 * `B`, `D`, `H`, `R` e 2 poções; `prepare` disponível. O `id` próprio é a
 * chave do cenário no handler (D-58 item 4).
 */
export const partyGearInSessionFixture: Party = {
  ...partyInSessionFixture,
  id: 'party-com-equipamento',
  members: [
    {
      ...member,
      player: {
        ...member.player,
        inventory: [
          gear(blade),
          gear(shield),
          gear(helm),
          gear(wand),
          { cardId: potion, quantity: 2 },
        ],
        availableActions: [
          'move',
          'recover',
          'prepare',
          'adjustDeck',
          'useVault',
          'visitBlacksmith',
          'visitMarket',
          'endTurn',
        ],
      },
    },
  ],
  savedAt: '2026-11-14T21:55:00.000Z',
}

const gearPlayer = partyGearInSessionFixture.members[0].player

/** 200 de `prepare` `equip` de `B`: arma em uso, `B` fora do inventário, Ataque 9, Precisão 50, pontos intactos. */
export const partyBladeEquippedFixture: Party = {
  ...partyGearInSessionFixture,
  members: [
    {
      ...member,
      player: {
        ...gearPlayer,
        inventory: [
          gear(shield),
          gear(helm),
          gear(wand),
          { cardId: potion, quantity: 2 },
        ],
        equipment: { ...gearPlayer.equipment, weapon: blade },
        equipmentStates: {
          ...gearPlayer.equipmentStates,
          weapon: standardEquipmentState,
        },
        effectiveModifiers: {
          ...gearPlayer.effectiveModifiers,
          attack: 9,
          accuracy: 50,
        },
      },
    },
  ],
  savedAt: '2026-11-14T21:56:00.000Z',
}

/** 200 de `prepare` `unequip` de `weapon`: arma no fim do inventário, Ataque 6. */
export const partyBladeUnequippedFixture: Party = {
  ...partyGearInSessionFixture,
  members: [
    {
      ...member,
      player: {
        ...gearPlayer,
        inventory: [
          gear(shield),
          gear(helm),
          gear(wand),
          { cardId: potion, quantity: 2 },
          gear(blade),
        ],
      },
    },
  ],
  savedAt: '2026-11-14T21:57:00.000Z',
}

/** 200 da doação de `P` × 2 (laboratório): inventário com `P` em 2. */
export const partyGrantedCardFixture: Party = {
  ...partyCreatedFixture,
  members: [
    {
      ...member,
      player: {
        ...member.player,
        inventory: [{ cardId: potion, quantity: 2 }],
      },
    },
  ],
  savedAt: '2026-11-14T21:58:00.000Z',
}

/** 200 da doação de 295 de ouro (laboratório): ouro 300, 5 perdidas. */
export const partyGrantedGoldFixture: Party = {
  ...partyCreatedFixture,
  members: [{ ...member, player: { ...member.player, gold: 300 } }],
  savedAt: '2026-11-14T21:59:00.000Z',
}

const fishingRod = 'fixture.fishing-rod'
const silverFish = 'fixture.silver-fish'

/**
 * 200 da doação de `F` (laboratório, CONTRATO §3 FEAT-32): `scavengeTargets`
 * com `S` e `scavenge` antes de `useVault`, prontos do backend.
 */
export const partyFishingRodGrantedFixture: Party = {
  ...partyCreatedFixture,
  members: [
    {
      ...member,
      player: {
        ...member.player,
        inventory: [{ cardId: fishingRod, quantity: 1 }],
        scavengeTargets: [silverFish],
        availableActions: [
          'move',
          'recover',
          'adjustDeck',
          'scavenge',
          'useVault',
          'visitBlacksmith',
          'visitMarket',
          'endTurn',
        ],
      },
    },
  ],
  savedAt: '2026-11-18T21:00:00.000Z',
}

/**
 * Grupo de exemplo com `F` no inventário, em sessão: o `id` próprio é a chave
 * do cenário no handler (D-59 item 11), para o Vasculhar aparecer no dev.
 */
export const partyFishingRodInSessionFixture: Party = {
  ...partyFishingRodGrantedFixture,
  id: 'party-com-vara',
  status: 'inSession',
}

/** 200 de `scavenge` de `S` com `F` no inventário: `S` achado, 2 pontos. */
export const partyScavengedFixture: Party = {
  ...partyInSessionFixture,
  members: [
    {
      ...member,
      player: {
        ...partyFishingRodGrantedFixture.members[0].player,
        inventory: [
          { cardId: fishingRod, quantity: 1 },
          { cardId: silverFish, quantity: 1 },
        ],
        lastScavenge: {
          cardId: silverFish,
          found: true,
          delivery: 'inventory',
        },
      },
    },
  ],
  turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
  savedAt: '2026-11-18T21:01:00.000Z',
}

/**
 * 200 de `useVault` com `P` ×3 e 100 de ouro: guardar 2 `P`, guardar 60 de
 * ouro e descartar 1 `P` (CONTRATO §3 FEAT-32). Valores prontos do backend.
 */
export const partyVaultUsedFixture: Party = {
  ...partyInSessionFixture,
  members: [
    {
      ...member,
      player: {
        ...member.player,
        gold: 40,
        inventory: [{ cardId: potion, quantity: 1 }],
        vault: {
          slots: [{ cardId: potion, quantity: 1 }],
          decks: [],
          gold: 60,
        },
      },
    },
  ],
  turn: { ...partyInSessionFixture.turn, actionPoints: 2 },
  savedAt: '2026-11-18T21:02:00.000Z',
}

/** 200 de GET /parties com o grupo criado. */
export const partiesFixture: PartySummary[] = [
  {
    id: partyId,
    name: 'Os Teimosos',
    status: 'idle',
    characterNames: ['Lia'],
    createdAt: '2026-11-14T21:30:00.000Z',
    savedAt: '2026-11-14T21:30:00.000Z',
  },
]

interface PartyInvalidEnvelope {
  error: {
    code: 'PARTY_INVALID'
    message: string
    details: PartyInvalidDetails
  }
}

/** 400 de POST /parties com nome em branco e personagem longo demais. */
export const partyInvalidFieldsFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: {
      fields: [
        { field: 'name', reason: 'blank' },
        { field: 'characterName', reason: 'tooLong' },
      ],
    },
  },
}

/** 400 de POST /parties "Solo" com `minPlayers = 2` no laboratório. */
export const partyBelowMinPlayersFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'members', reason: 'belowMinPlayers' }] },
  },
}

/** 400 de POST /parties sem `playerClass`. */
export const partyClassRequiredFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'playerClass', reason: 'required' }] },
  },
}

/** 400 de POST /parties com `playerClass: "mage"` (sem classe publicada). */
export const partyUnknownClassFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'playerClass', reason: 'unknownClass' }] },
  },
}

/**
 * 409 DIMENSION_INVALID. Sem cenário no contrato (a `fixture` é válida); os
 * problemas são exemplos com os textos do `validate-dimension` (FEAT-31),
 * usados só nos testes que trocam o handler.
 */
export const dimensionInvalidFixture: {
  error: {
    code: 'DIMENSION_INVALID'
    message: string
    details: DimensionInvalidDetails
  }
} = {
  error: {
    code: 'DIMENSION_INVALID',
    message:
      'Não foi possível preparar a dimensão. Avise o designer da coleção.',
    details: {
      dimensionCardId: null,
      problems: ['A coleção precisa de pelo menos 1 zona Urbana publicada.'],
    },
  },
}

/** 404 de grupo inexistente ou abandonado. */
export const partyNotFoundFixture = {
  error: { code: 'PARTY_NOT_FOUND', message: 'Grupo não encontrado.' },
} as const

/** 409 de encerrar sessão num grupo sem sessão. */
export const partySessionNotActiveFixture = {
  error: {
    code: 'PARTY_SESSION_NOT_ACTIVE',
    message: 'Não há sessão em andamento neste grupo.',
  },
} as const

/** 409 de ação sem travessia com a zona atual (CONTRATO §3 FEAT-07). */
export const actionNotAllowedFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: { reason: 'notConnected' },
  },
} as const

/** 409 de `move` sem pontos de ação (CONTRATO §3 FEAT-08). */
export const actionNoActionPointsFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: { reason: 'noActionPoints' },
  },
} as const

/** 409 de `adjustDeck` com a build abaixo do mínimo (CONTRATO §3 FEAT-09). */
export const actionBuildBelowMinimumFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: { reason: 'buildBelowMinimum' },
  },
} as const

/** 409 de `adjustDeck` com cópias além da build + pasta de `cardId`. */
export function actionNotOwnedFixture(cardId: string) {
  return {
    error: {
      code: 'ACTION_NOT_ALLOWED',
      message: 'Esta ação não é permitida agora.',
      details: { reason: 'notOwned', cardId },
    },
  } as const
}

/** 409 de `prepare` recusado pela regra (CONTRATO §3 FEAT-10). */
export function actionPrepareNotAllowedFixture(
  reason:
    | 'notInInventory'
    | 'notEquipment'
    | 'peakRequirementNotMet'
    | 'classRestricted'
    | 'shieldBlocked'
    | 'inventoryFull'
    | 'slotEmpty',
) {
  return {
    error: {
      code: 'ACTION_NOT_ALLOWED',
      message: 'Esta ação não é permitida agora.',
      details: { reason },
    },
  } as const
}

/** 400 de `prepare` com `operation` desconhecida (CONTRATO §3 FEAT-10). */
export const actionInvalidUnknownOperationFixture = {
  error: {
    code: 'ACTION_INVALID',
    message: 'Ação inválida.',
    details: { fields: [{ field: 'operation', reason: 'unknownOperation' }] },
  },
} as const

/** 409 de `scavenge` de carta fora de `scavengeTargets` (CONTRATO §3 FEAT-32). */
export const actionNotScavengeableFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: { reason: 'notScavengeable' },
  },
} as const

/** 409 do lote com `take` de 5 `P` na 2ª operação (CONTRATO §3 FEAT-32). */
export const actionNotInVaultFixture = {
  error: {
    code: 'ACTION_NOT_ALLOWED',
    message: 'Esta ação não é permitida agora.',
    details: { reason: 'notInVault', operationIndex: 1 },
  },
} as const

/** 400 de `useVault` com `operations: []` (CONTRATO §3 FEAT-32). */
export const actionInvalidOperationsLengthFixture = {
  error: {
    code: 'ACTION_INVALID',
    message: 'Ação inválida.',
    details: { fields: [{ field: 'operations', reason: 'invalidLength' }] },
  },
} as const

/** 400 da doação de carta que não se doa (CONTRATO §3 FEAT-10). */
export const labGrantNotGrantableFixture = {
  error: {
    code: 'LAB_GRANT_INVALID',
    message: 'Doação inválida.',
    details: { fields: [{ field: 'cardId', reason: 'notGrantable' }] },
  },
} as const

/** 404 da doação para um membro que não é do grupo. */
export const memberNotFoundFixture = {
  error: {
    code: 'MEMBER_NOT_FOUND',
    message: 'Membro não encontrado neste grupo.',
  },
} as const

/** 400 de `recover` com opção desconhecida (CONTRATO §3 FEAT-09). */
export const actionInvalidUnknownOptionFixture = {
  error: {
    code: 'ACTION_INVALID',
    message: 'Ação inválida.',
    details: { fields: [{ field: 'option', reason: 'unknownOption' }] },
  },
} as const

/** 400 de `move` para uma zona que não é do mapa. */
export const actionInvalidZoneNotInMapFixture = {
  error: {
    code: 'ACTION_INVALID',
    message: 'Ação inválida.',
    details: { fields: [{ field: 'zoneId', reason: 'zoneNotInMap' }] },
  },
} as const

/** 400 de ação com `type` desconhecido. */
export const actionInvalidUnknownActionFixture = {
  error: {
    code: 'ACTION_INVALID',
    message: 'Ação inválida.',
    details: { fields: [{ field: 'type', reason: 'unknownAction' }] },
  },
} as const
