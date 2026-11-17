import type {
  Card,
  CardType,
  CatalogQueryInvalidDetails,
  CollectionSummary,
} from '../api/catalog'
import type { ErrorEnvelope } from '../api/http'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-04 e FEAT-06 (v0.25).
 * As 12 cartas são cópias exatas do conteúdo de teste do backend
 * (coleção `fixture`).
 * Nenhuma regra (Princípio 3).
 */

export const collectionsFixture: CollectionSummary[] = [
  {
    id: 'fixture',
    name: 'Coleção de Teste',
    cardCounts: {
      zone: 4,
      attribute: 3,
      equipment: 1,
      item: 1,
      randomEvent: 1,
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
  type: 'equipment',
  collectionId: 'fixture',
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const healingPotionFixture: Card = {
  id: 'fixture.healing-potion',
  name: 'Poção de Cura',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'consumable',
  tags: ['poção'],
  effects: [
    {
      text: 'Recupera 5 de vida.',
    },
  ],
  type: 'item',
  collectionId: 'fixture',
}

/** Cópia exata do backend (coleção `fixture`, CONTRATO v0.12). */
export const howlingWolvesFixture: Card = {
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
  zoneActions: ['startEvent', 'useVault', 'saveRespawnPoint'],
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

/** GET /catalog/collections/fixture/cards — 12 cartas na ordem de `id`. */
export const fixtureCardsFixture: Card[] = [
  bladeOfDuskFixture,
  dexterityBasicFixture,
  enduranceBasicFixture,
  grayHarborFixture,
  healingPotionFixture,
  howlingWolvesFixture,
  oldMineFixture,
  stoneBendFixture,
  strengthBasicFixture,
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
  equipment: [bladeOfDuskFixture],
  item: [healingPotionFixture],
  randomEvent: [woundedTravelerFixture],
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
