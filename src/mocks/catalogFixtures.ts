import type {
  Card,
  CardType,
  CombatEventCard,
  CatalogQueryInvalidDetails,
  CollectionSummary,
} from '../api/catalog'
import type { ErrorEnvelope } from '../api/http'

/**
 * Fixtures da coleção `fixture`, atualizadas até o CONTRATO v0.52 (FEAT-11).
 * Metadados de exemplo são indicados junto das cartas correspondentes.
 * Nenhuma regra (Princípio 3).
 */

export const collectionsFixture: CollectionSummary[] = [
  {
    id: 'fixture',
    name: 'Coleção de Teste',
    cardCounts: {
      zone: 4,
      attribute: 3,
      equipment: 7,
      item: 7,
      randomEvent: 2,
      combatEvent: 1,
      dimension: 1,
    },
  },
]

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const bladeOfDuskFixture: Card = {
  id: 'fixture.blade-of-dusk',
  name: 'Lâmina do Crepúsculo',
  flavorText: 'Forjada na hora em que o dia cede à noite.',
  rarity: 'rare',
  slot: 'weapon',
  tags: ['espada', 'duas mãos'],
  modifiers: [
    {
      modifier: 'attack',
      value: 3,
    },
    {
      modifier: 'accuracy',
      value: 1,
    },
  ],
  peakRequirement: null,
  classRestriction: [],
  blocksShield: true,
  abilities: [],
  effects: [],
  refinement: {
    maxLevel: 3,
    materials: {
      text: '1 Minério de Ferro por nível.',
    },
  },
  enchantment: {
    text: 'Encantamento: causa dano sombrio extra.',
  },
  priceMultiplier: 1,
  scavengeTool: null,
  type: 'equipment',
  collectionId: 'fixture',
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const healingPotionFixture: Extract<Card, { type: 'item' }> = {
  id: 'fixture.healing-potion',
  name: 'Poção de Cura',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'consumable',
  tags: ['poção'],
  effects: [
    {
      text: 'Recupera 5 de vida.',
      trigger: null,
      cost: [{ kind: 'consumeSelf' }],
      activation: [{ kind: 'heal', amount: 5 }],
      duration: { kind: 'immediate' },
      mark: null,
    },
  ],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: null,
  type: 'item',
  collectionId: 'fixture',
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const howlingWolvesFixture: CombatEventCard = {
  id: 'fixture.howling-wolves',
  title: 'Lobos Uivantes',
  flavorText: 'Uivos ecoam entre as árvores.',
  enemies: [
    {
      name: 'Lobo Cinzento',
      flavorText: null,
      count: 2,
      enemyTypes: ['beast'],
      creature: 'Lobo',
      enemyCategory: 'common',
      element: null,
      health: 6,
      modifiers: {
        attack: 2,
        defense: 1,
        accuracy: 2,
        evasion: 2,
        celerity: 3,
        piercing: 0,
        reflection: 0,
      },
      vigor: null,
      abilities: [],
      behavior: 'aggressive',
    },
  ],
  goodOutcome: {
    text: 'Os lobos fogem e deixam peles para trás.',
  },
  badOutcome: {
    text: 'A matilha fere o grupo antes de recuar.',
  },
  noEscape: false,
  type: 'combatEvent',
  collectionId: 'fixture',
}

/** Cópia exata do 3º cenário do contrato. */
export const strengthBasicFixture: Card = {
  type: 'attribute',
  id: 'fixture.strength-basic',
  collectionId: 'fixture',
  name: 'Força',
  flavorText: null,
  rarity: 'common',
  attributeKind: 'basic',
  attributes: ['strength'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const whisperingGroveFixture: Card = {
  id: 'fixture.whispering-grove',
  title: 'Bosque Sussurrante',
  zoneType: 'forest',
  location: 'Terras Selvagens',
  connectionArrows: 2,
  arrowLayout: 'straight',
  zoneActions: ['startEvent'],
  effects: [],
  type: 'zone',
  collectionId: 'fixture',
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const grayHarborFixture: Card = {
  type: 'zone',
  id: 'fixture.gray-harbor',
  collectionId: 'fixture',
  title: 'Porto Cinzento',
  zoneType: 'urban',
  location: 'Costa Cinzenta',
  connectionArrows: 4,
  arrowLayout: null,
  zoneActions: ['startEvent', 'scavenge', 'useVault', 'saveRespawnPoint'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const stoneBendFixture: Card = {
  type: 'zone',
  id: 'fixture.stone-bend',
  collectionId: 'fixture',
  title: 'Curva de Pedra',
  zoneType: 'forest',
  location: 'Terras Selvagens',
  connectionArrows: 2,
  arrowLayout: 'corner',
  zoneActions: ['startEvent'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const oldMineFixture: Card = {
  type: 'zone',
  id: 'fixture.old-mine',
  collectionId: 'fixture',
  title: 'Mina Velha',
  zoneType: 'forest',
  location: 'Terras Selvagens',
  connectionArrows: 1,
  arrowLayout: null,
  zoneActions: ['startEvent'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const enduranceBasicFixture: Card = {
  type: 'attribute',
  id: 'fixture.endurance-basic',
  collectionId: 'fixture',
  name: 'Resistência',
  flavorText: null,
  rarity: 'common',
  attributeKind: 'basic',
  attributes: ['endurance'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const dexterityBasicFixture: Card = {
  type: 'attribute',
  id: 'fixture.dexterity-basic',
  collectionId: 'fixture',
  name: 'Destreza',
  flavorText: null,
  rarity: 'common',
  attributeKind: 'basic',
  attributes: ['dexterity'],
  effects: [],
}

/** Cópia exata do cenário `GET /catalog/cards/fixture.test-dimension`. */
export const testDimensionFixture: Card = {
  type: 'dimension',
  id: 'fixture.test-dimension',
  collectionId: 'fixture',
  name: 'Dimensão de Teste',
  flavorText: null,
  releaseOrder: 1,
  arrivalZoneTitle: 'Porto Cinzento',
  effects: [],
  eventDecks: [
    {
      zoneType: 'urban',
      cards: [
        { cardId: 'fixture.event-cart-test', copies: 2 },
        { cardId: 'fixture.howling-wolves', copies: 1 },
      ],
    },
  ],
  // FEAT-32 (CONTRATO v0.46)
  rewardDecks: [
    {
      zoneType: 'urban',
      cards: [
        { cardId: 'fixture.silver-fish', copies: 1 },
        { cardId: 'fixture.iron-ore', copies: 1 },
        { cardId: 'fixture.healing-potion', copies: 2 },
      ],
    },
  ],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const woundedTravelerFixture: Card = {
  id: 'fixture.wounded-traveler',
  title: 'Viajante Ferido',
  flavorText: 'Um estranho jaz à beira da trilha.',
  requirements: [
    {
      text: 'Possuir uma Poção de Cura.',
    },
  ],
  goodOutcome: {
    text: 'O viajante agradece e revela um atalho.',
  },
  badOutcome: {
    text: 'Era uma emboscada; o grupo perde suprimentos.',
  },
  noEscape: false,
  type: 'randomEvent',
  collectionId: 'fixture',
}

/**
 * Cartas acrescentadas à `fixture` na FEAT-10 (CONTRATO v0.41). Montadas só
 * com o que os cenários do contrato fixam (slot, modificadores, requisito de
 * Pico, restrição de classe, bloqueio de escudo, categoria); nomes, raridade,
 * tags e textos são de exemplo, não cópia do backend (decisão do autor, T-45).
 */
export const shortSwordFixture: Card = {
  id: 'fixture.short-sword',
  name: 'Espada Curta',
  flavorText: null,
  rarity: 'common',
  slot: 'weapon',
  tags: ['espada'],
  modifiers: [{ modifier: 'attack', value: 2 }],
  peakRequirement: null,
  classRestriction: [],
  blocksShield: false,
  abilities: [],
  effects: [],
  refinement: null,
  enchantment: null,
  priceMultiplier: 1,
  scavengeTool: null,
  type: 'equipment',
  collectionId: 'fixture',
}

export const oakShieldFixture: Card = {
  id: 'fixture.oak-shield',
  name: 'Escudo de Carvalho',
  flavorText: null,
  rarity: 'common',
  slot: 'shield',
  tags: ['escudo'],
  modifiers: [{ modifier: 'defense', value: 2 }],
  peakRequirement: null,
  classRestriction: [],
  blocksShield: false,
  abilities: [],
  effects: [],
  refinement: null,
  enchantment: null,
  priceMultiplier: 1,
  scavengeTool: null,
  type: 'equipment',
  collectionId: 'fixture',
}

export const ironHelmFixture: Card = {
  id: 'fixture.iron-helm',
  name: 'Elmo de Ferro',
  flavorText: null,
  rarity: 'uncommon',
  slot: 'head',
  tags: ['elmo'],
  modifiers: [{ modifier: 'defense', value: 1 }],
  peakRequirement: 50,
  classRestriction: [],
  blocksShield: false,
  abilities: [],
  effects: [],
  refinement: null,
  enchantment: null,
  priceMultiplier: 1,
  scavengeTool: null,
  type: 'equipment',
  collectionId: 'fixture',
}

export const arcaneWandFixture: Card = {
  id: 'fixture.arcane-wand',
  name: 'Varinha Arcana',
  flavorText: null,
  rarity: 'uncommon',
  slot: 'weapon',
  tags: ['varinha'],
  modifiers: [{ modifier: 'attack', value: 1 }],
  peakRequirement: null,
  classRestriction: ['mage'],
  blocksShield: false,
  abilities: [],
  effects: [],
  refinement: null,
  enchantment: null,
  priceMultiplier: 1,
  scavengeTool: null,
  type: 'equipment',
  collectionId: 'fixture',
}

export const pickaxeFixture: Card = {
  id: 'fixture.pickaxe',
  name: 'Picareta',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'tool',
  tags: ['ferramenta'],
  effects: [],
  // FEAT-32 (CONTRATO v0.46)
  toolKind: 'pickaxe',
  scavengeZoneTypes: ['underground', 'mountainous'],
  scavengeTool: null,
  type: 'item',
  collectionId: 'fixture',
}

/**
 * Cartas acrescentadas à `fixture` na FEAT-32 (CONTRATO v0.46). Montadas com
 * o que o contrato fixa (nome, categoria, ferramenta e coleta); raridade, tags
 * e textos são de exemplo, como na T-45.
 */
export const fishingRodFixture: Card = {
  id: 'fixture.fishing-rod',
  name: 'Vara de Pesca',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'tool',
  tags: ['ferramenta'],
  effects: [],
  toolKind: 'fishing-rod',
  scavengeZoneTypes: ['coastal', 'fluvial', 'lacustrine', 'urban'],
  scavengeTool: null,
  type: 'item',
  collectionId: 'fixture',
}

export const silverFishFixture: Card = {
  id: 'fixture.silver-fish',
  name: 'Peixe Prateado',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'material',
  tags: ['peixe'],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: 'fishing-rod',
  type: 'item',
  collectionId: 'fixture',
}

export const ironOreFixture: Card = {
  id: 'fixture.iron-ore',
  name: 'Minério de Ferro',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'material',
  tags: ['minério'],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: 'pickaxe',
  type: 'item',
  collectionId: 'fixture',
}

/** FEAT-11: valores do cenário; metadados não fixados são exemplos estáticos. */
export const strengthTonicFixture: Card = {
  ...healingPotionFixture,
  id: 'fixture.strength-tonic',
  name: 'Tônico de Força',
  effects: [
    {
      text: '+3 de Ataque durante 2 vezes suas.',
      trigger: null,
      cost: [{ kind: 'consumeSelf' }],
      activation: [
        { kind: 'modifierFlat', changes: [{ modifier: 'attack', amount: 3 }] },
      ],
      duration: { kind: 'forOwnTurns', turns: 2 },
      mark: 'buff',
    },
  ],
}

export const guardianArmorFixture: Card = {
  ...oakShieldFixture,
  id: 'fixture.guardian-armor',
  name: 'Armadura do Guardião',
  slot: 'torso',
  tags: [],
  modifiers: [{ modifier: 'defense', value: 10 }],
  effects: [
    {
      text: '+20% de Defesa enquanto estiver em uso.',
      trigger: null,
      cost: [],
      activation: [
        {
          kind: 'modifierPercent',
          changes: [{ modifier: 'defense', percent: 20 }],
        },
      ],
      duration: { kind: 'whileSourceActive' },
      mark: 'buff',
    },
  ],
}

export const focusAmuletFixture: Card = {
  ...oakShieldFixture,
  id: 'fixture.focus-amulet',
  name: 'Amuleto do Foco',
  slot: 'accessory',
  tags: [],
  modifiers: [{ modifier: 'evasion', value: 1 }],
  effects: [
    {
      text: 'Gaste 5 de Vigor: ganhe 10 moedas de ouro.',
      trigger: null,
      cost: [{ kind: 'spendVigor', amount: 5 }],
      activation: [{ kind: 'gainGold', amount: 10 }],
      duration: { kind: 'immediate' },
      mark: null,
    },
    {
      text: 'Doe 5 de vida: restaure 5 de Vigor.',
      trigger: null,
      cost: [{ kind: 'donateLife', amount: 5 }],
      activation: [{ kind: 'restoreVigor', amount: 5 }],
      duration: { kind: 'immediate' },
      mark: null,
    },
    {
      text: 'Pague um de Força: compre 2 cartas.',
      trigger: null,
      cost: [
        {
          kind: 'discardFromHand',
          requirements: [{ attribute: 'strength', count: 1 }],
          excludeAttributes: [],
          constraint: 'none',
          random: false,
        },
      ],
      activation: [{ kind: 'drawCards', count: 2 }],
      duration: { kind: 'immediate' },
      mark: null,
    },
  ],
}

export const luckyCoinFixture: Card = {
  ...healingPotionFixture,
  id: 'fixture.lucky-coin',
  name: 'Moeda da Sorte',
  itemCategory: 'treasure',
  tags: [],
  effects: [
    {
      text: 'Pague 5 moedas: some 3 ao resultado do dado até o fim do evento.',
      trigger: null,
      cost: [{ kind: 'payGold', amount: 5 }],
      activation: [{ kind: 'diceResultModifier', amount: 3 }],
      duration: { kind: 'untilEventEnd' },
      mark: 'buff',
    },
  ],
}

export const executableEventFixture = {
  type: 'randomEvent',
  id: 'fixture.event-cart-test',
  collectionId: 'fixture',
  title: 'Carroça na estrada',
  flavorText: null,
  noEscape: false,
  escapeThreshold: null,
  requirements: [
    {
      id: 'attrs',
      text: 'Entregue duas Forças.',
      kind: 'attributes',
      specific: { strength: 2 },
      any: 0,
    },
  ],
  goodOutcome: { text: 'A passagem está livre.', steps: [] },
  badOutcome: { text: 'Você precisa voltar.', steps: [] },
} satisfies Card

/** GET /catalog/collections/fixture/cards — 25 cartas na ordem de `id`. */
export const fixtureCardsFixture: Card[] = [
  arcaneWandFixture,
  bladeOfDuskFixture,
  dexterityBasicFixture,
  enduranceBasicFixture,
  executableEventFixture,
  fishingRodFixture,
  focusAmuletFixture,
  grayHarborFixture,
  guardianArmorFixture,
  healingPotionFixture,
  howlingWolvesFixture,
  ironHelmFixture,
  ironOreFixture,
  luckyCoinFixture,
  oakShieldFixture,
  oldMineFixture,
  pickaxeFixture,
  shortSwordFixture,
  silverFishFixture,
  stoneBendFixture,
  strengthBasicFixture,
  strengthTonicFixture,
  testDimensionFixture,
  whisperingGroveFixture,
  woundedTravelerFixture,
]

/** GET /catalog/collections/fixture/cards?type=<tipo> — listas prontas. */
export const fixtureCardsByTypeFixture: Record<CardType, Card[]> = {
  zone: [
    grayHarborFixture,
    oldMineFixture,
    stoneBendFixture,
    whisperingGroveFixture,
  ],
  attribute: [
    dexterityBasicFixture,
    enduranceBasicFixture,
    strengthBasicFixture,
  ],
  equipment: [
    arcaneWandFixture,
    bladeOfDuskFixture,
    focusAmuletFixture,
    guardianArmorFixture,
    ironHelmFixture,
    oakShieldFixture,
    shortSwordFixture,
  ],
  item: [
    fishingRodFixture,
    healingPotionFixture,
    ironOreFixture,
    luckyCoinFixture,
    pickaxeFixture,
    silverFishFixture,
    strengthTonicFixture,
  ],
  randomEvent: [executableEventFixture, woundedTravelerFixture],
  combatEvent: [howlingWolvesFixture],
  dimension: [testDimensionFixture],
}

/** ?type=monster → 400 CATALOG_QUERY_INVALID. */
export const catalogQueryInvalidFixture: {
  error: {
    code: 'CATALOG_QUERY_INVALID'
    message: string
    details: CatalogQueryInvalidDetails
  }
} = {
  error: {
    code: 'CATALOG_QUERY_INVALID',
    message: 'Filtro do catálogo inválido.',
    details: { field: 'type', reason: 'unknownCardType' },
  },
}

/** Carta inexistente → 404 CARD_NOT_FOUND. */
export const catalogCardNotFoundFixture: ErrorEnvelope = {
  error: { code: 'CARD_NOT_FOUND', message: 'Carta não encontrada.' },
}

/** Coleção inexistente → 404 COLLECTION_NOT_FOUND. */
export const collectionNotFoundFixture: ErrorEnvelope = {
  error: { code: 'COLLECTION_NOT_FOUND', message: 'Coleção não encontrada.' },
}
