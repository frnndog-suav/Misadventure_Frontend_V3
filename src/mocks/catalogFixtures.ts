import type {
  Card,
  CardType,
  CombatEventCard,
  ItemCard,
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
      item: 12,
      randomEvent: 2,
      combatEvent: 1,
      zoneQuest: 0,
      dimension: 1,
      mount: 2,
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
  // FEAT-17 (CONTRATO v0.85): materiais estruturados; sem encantamento.
  refinement: {
    maxLevel: 3,
    materials: [{ cardId: 'fixture.iron-ore', quantity: 1 }],
  },
  enchantment: null,
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
  completionItem: false,
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
  priceMultiplier: 1,
  stockPrice: 6,
  stockQuantity: 1,
  boosterCollectionId: null,
  recipe: null,
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
  priceMultiplier: 1,
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
  market: null,
  blacksmith: null,
  id: 'fixture.whispering-grove',
  title: 'Bosque Sussurrante',
  zoneType: 'forest',
  location: 'Terras Selvagens',
  connectionArrows: 2,
  arrowLayout: 'straight',
  questDeck: [],
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
  questDeck: [],
  // FEAT-16 (CONTRATO v0.81): mercado com estoque e singles.
  zoneActions: [
    'startEvent',
    'scavenge',
    'useVault',
    'visitBlacksmith',
    'visitMarket',
    'saveRespawnPoint',
  ],
  effects: [],
  market: {
    stock: ['fixture.healing-potion', 'fixture.arrows', 'fixture.fishing-rod'],
    singles: true,
    // FEAT-18 (CONTRATO v0.88): Porto Cinzento sem Estábulo.
    mounts: [],
  },
  // FEAT-17 (CONTRATO v0.85): ferreiro com o Fio de Brasa.
  blacksmith: {
    enchantments: [
      {
        id: 'ember-edge',
        name: 'Fio de Brasa',
        kind: 'element',
        element: 'fire',
        bonusPercent: 10,
        materials: [{ cardId: 'fixture.ember-shard', quantity: 1 }],
      },
    ],
  },
}

export const respawnTownFixture: Card = {
  ...grayHarborFixture,
  id: 'fixture.respawn-town',
  title: 'Vila do Retorno',
  connectionArrows: 2,
  // Só o Porto Cinzento tem mercado na `fixture` (FEAT-16).
  zoneActions: ['startEvent', 'scavenge', 'useVault', 'saveRespawnPoint'],
  market: null,
  blacksmith: null,
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const stoneBendFixture: Card = {
  market: null,
  blacksmith: null,
  type: 'zone',
  id: 'fixture.stone-bend',
  collectionId: 'fixture',
  title: 'Curva de Pedra',
  zoneType: 'forest',
  location: 'Terras Selvagens',
  connectionArrows: 2,
  arrowLayout: 'corner',
  questDeck: [],
  zoneActions: ['startEvent'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25); FEAT-18 (v0.88): Rural com Estábulo. */
export const oldMineFixture: Card = {
  market: { stock: [], singles: false, mounts: ['fixture.plow-horse'] },
  blacksmith: null,
  type: 'zone',
  id: 'fixture.old-mine',
  collectionId: 'fixture',
  title: 'Mina Velha',
  zoneType: 'rural',
  location: 'Terras Selvagens',
  connectionArrows: 1,
  arrowLayout: null,
  questDeck: [],
  zoneActions: ['startEvent', 'visitMarket'],
  effects: [],
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.25). */
export const enduranceBasicFixture: Card = {
  priceMultiplier: 1,
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
  priceMultiplier: 1,
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
export const testDimensionFixture: Extract<Card, { type: 'dimension' }> = {
  type: 'dimension',
  id: 'fixture.test-dimension',
  collectionId: 'fixture',
  name: 'Dimensão de Teste',
  flavorText: null,
  releaseOrder: 1,
  completion: {
    zoneTitle: 'Mina Velha',
    requirement: [{ cardId: 'fixture.shard', count: 3 }],
    grandPrize: {
      cards: [{ cardId: 'fixture.blade-of-dusk', copies: 1 }],
      gold: 100,
    },
    finalBoss: null,
  },
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
  // FEAT-17 (CONTRATO v0.85): refinável até +10, slot de elemento a partir de +2.
  refinement: {
    maxLevel: 10,
    materials: [{ cardId: 'fixture.iron-ore', quantity: 1 }],
  },
  enchantment: { slots: [{ kind: 'element', minRefinement: 2 }] },
  // FEAT-16 (CONTRATO v0.81): ×1,2.
  priceMultiplier: 1.2,
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
  priceMultiplier: 1,
  stockPrice: null,
  stockQuantity: 1,
  boosterCollectionId: null,
  recipe: null,
  id: 'fixture.pickaxe',
  name: 'Picareta',
  flavorText: null,
  rarity: 'common',
  completionItem: false,
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
  completionItem: false,
  itemCategory: 'tool',
  tags: ['ferramenta'],
  effects: [],
  toolKind: 'fishing-rod',
  scavengeZoneTypes: ['coastal', 'fluvial', 'lacustrine', 'urban'],
  scavengeTool: null,
  priceMultiplier: 1,
  stockPrice: 20,
  stockQuantity: 1,
  boosterCollectionId: null,
  recipe: null,
  type: 'item',
  collectionId: 'fixture',
}

/**
 * Cartas acrescentadas à `fixture` na FEAT-16 (CONTRATO v0.81), só com o que
 * o contrato fixa (nome, categoria, raridade, estoque, lote e coleção).
 */
export const arrowsFixture: Card = {
  id: 'fixture.arrows',
  name: 'Flechas',
  flavorText: null,
  rarity: 'common',
  completionItem: false,
  itemCategory: 'consumable',
  tags: [],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: null,
  priceMultiplier: 1,
  stockPrice: 3,
  stockQuantity: 10,
  boosterCollectionId: null,
  recipe: null,
  type: 'item',
  collectionId: 'fixture',
}

export const boosterFixture: Card = {
  id: 'fixture.booster',
  name: 'Booster de Teste',
  flavorText: null,
  rarity: 'common',
  completionItem: false,
  itemCategory: 'booster',
  tags: [],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: null,
  priceMultiplier: 1,
  stockPrice: null,
  stockQuantity: 1,
  boosterCollectionId: 'fixture',
  recipe: null,
  type: 'item',
  collectionId: 'fixture',
}

export const silverFishFixture: Card = {
  priceMultiplier: 1,
  stockPrice: null,
  stockQuantity: 1,
  boosterCollectionId: null,
  recipe: null,
  id: 'fixture.silver-fish',
  name: 'Peixe Prateado',
  flavorText: null,
  rarity: 'common',
  completionItem: false,
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
  priceMultiplier: 1,
  stockPrice: null,
  stockQuantity: 1,
  boosterCollectionId: null,
  recipe: null,
  id: 'fixture.iron-ore',
  name: 'Minério de Ferro',
  flavorText: null,
  rarity: 'common',
  completionItem: false,
  itemCategory: 'material',
  tags: ['minério'],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: 'pickaxe',
  type: 'item',
  collectionId: 'fixture',
}

/**
 * FEAT-17 (CONTRATO v0.85): cartas novas do ferreiro. Categoria, raridade e
 * receita são do contrato; nomes de exemplo seguem o contrato, demais campos
 * nos valores legados.
 */
const feat17Item = {
  flavorText: null,
  tags: [],
  effects: [],
  toolKind: null,
  scavengeZoneTypes: [],
  scavengeTool: null,
  priceMultiplier: 1,
  stockPrice: null,
  stockQuantity: 1,
  boosterCollectionId: null,
  type: 'item',
  collectionId: 'fixture',
} satisfies Partial<ItemCard>

export const emberShardFixture: Card = {
  ...feat17Item,
  id: 'fixture.ember-shard',
  name: 'Fragmento de Brasa',
  rarity: 'rare',
  completionItem: false,
  itemCategory: 'material',
  recipe: null,
}

export const swordBlueprintFixture: Card = {
  ...feat17Item,
  id: 'fixture.sword-blueprint',
  name: 'Projeto: Espada Curta',
  rarity: 'uncommon',
  completionItem: false,
  itemCategory: 'document',
  recipe: {
    equipmentId: 'fixture.short-sword',
    materials: [{ cardId: 'fixture.iron-ore', quantity: 2 }],
    gold: 15,
    consumed: false,
  },
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
  completionItem: false,
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

/** FEAT-18 (CONTRATO v0.88): montaria do Estábulo da Mina Velha. */
export const plowHorseFixture: Card = {
  type: 'mount',
  id: 'fixture.plow-horse',
  collectionId: 'fixture',
  name: 'Cavalo de Arado',
  flavorText: null,
  rarity: 'rare',
  mountTypes: ['beast'],
  creature: 'Cavalo',
  effects: [],
  abilities: [],
}

/**
 * FEAT-18 (CONTRATO v0.90): montaria de teste com 1 efeito ativável e 1
 * habilidade fora de combate. Textos e valores de exemplo até o aviso
 * `implementado (BE)` (D-64 item 6).
 */
export const warPonyFixture: Card = {
  type: 'mount',
  id: 'fixture.war-pony',
  collectionId: 'fixture',
  name: 'Pônei de Guerra',
  flavorText: null,
  rarity: 'common',
  mountTypes: ['beast'],
  creature: 'Pônei',
  effects: [
    {
      text: 'Ganha 2 de ouro.',
      trigger: null,
      cost: [],
      activation: [{ kind: 'gainGold', amount: 2 }],
      duration: { kind: 'immediate' },
      mark: null,
    },
  ],
  abilities: [
    {
      id: 'pony-trot',
      name: 'Trote',
      text: 'Remove os debuffs de quem monta.',
      form: 'targeted',
      element: null,
      cost: [],
      power: null,
      effects: [],
      cooldown: 0,
      timing: 'outsideCombat',
      classRestriction: [],
      usesPerTurn: 1,
      target: 'self',
      duration: null,
      channel: null,
    },
  ],
}

/** GET /catalog/collections/fixture/cards — 31 cartas na ordem de `id`. */
export const completionShardFixture: Card = {
  ...healingPotionFixture,
  id: 'fixture.shard',
  name: 'Fragmento',
  itemCategory: 'special',
  tags: [],
  effects: [],
  completionItem: true,
}

export const fixtureCardsFixture: Card[] = [
  arcaneWandFixture,
  arrowsFixture,
  bladeOfDuskFixture,
  boosterFixture,
  dexterityBasicFixture,
  emberShardFixture,
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
  plowHorseFixture,
  completionShardFixture,
  shortSwordFixture,
  silverFishFixture,
  stoneBendFixture,
  strengthBasicFixture,
  strengthTonicFixture,
  swordBlueprintFixture,
  testDimensionFixture,
  warPonyFixture,
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
    arrowsFixture,
    boosterFixture,
    emberShardFixture,
    fishingRodFixture,
    healingPotionFixture,
    ironOreFixture,
    luckyCoinFixture,
    pickaxeFixture,
    completionShardFixture,
    silverFishFixture,
    strengthTonicFixture,
    swordBlueprintFixture,
  ],
  randomEvent: [executableEventFixture, woundedTravelerFixture],
  combatEvent: [howlingWolvesFixture],
  zoneQuest: [],
  dimension: [testDimensionFixture],
  mount: [plowHorseFixture, warPonyFixture],
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
