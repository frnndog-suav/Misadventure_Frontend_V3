import type {
  Card,
  CardType,
  CatalogQueryInvalidDetails,
  CollectionSummary,
} from '../api/catalog'
import type { ErrorEnvelope } from '../api/http'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-04 (v0.11). Só a carta de
 * atributo é cópia exata do contrato; as outras 5 são PROVISÓRIAS (ids e
 * tipos do contrato, conteúdo inventado no formato) e serão trocadas pelas
 * cópias exatas que chegam com o `implementado (BE)`. Nenhuma regra
 * (Princípio 3).
 */

export const collectionsFixture: CollectionSummary[] = [
  {
    id: 'fixture',
    name: 'Coleção de Teste',
    cardCounts: {
      zone: 1,
      attribute: 1,
      equipment: 1,
      item: 1,
      randomEvent: 1,
      combatEvent: 1,
    },
  },
]

/** Provisória. */
export const bladeOfDuskFixture: Card = {
  type: 'equipment',
  id: 'fixture.blade-of-dusk',
  collectionId: 'fixture',
  name: 'Lâmina do Crepúsculo',
  flavorText: null,
  rarity: 'rare',
  slot: 'weapon',
  tags: ['Espada'],
  modifiers: [{ modifier: 'attack', value: 3 }],
  peakRequirement: null,
  classRestriction: [],
  blocksShield: false,
  abilities: [],
  effects: [],
  refinement: null,
  enchantment: null,
  priceMultiplier: 1,
}

/** Provisória. */
export const healingPotionFixture: Card = {
  type: 'item',
  id: 'fixture.healing-potion',
  collectionId: 'fixture',
  name: 'Poção de Cura',
  flavorText: null,
  rarity: 'common',
  itemCategory: 'consumable',
  tags: ['Poção'],
  effects: [{ text: 'Recupera 5 de Vida.' }],
}

/** Provisória. */
export const howlingWolvesFixture: Card = {
  type: 'combatEvent',
  id: 'fixture.howling-wolves',
  collectionId: 'fixture',
  title: 'Lobos Uivantes',
  flavorText: null,
  enemies: [
    {
      name: 'Lobo Cinzento',
      flavorText: null,
      count: 1,
      enemyTypes: ['beast'],
      creature: 'Lobo',
      enemyCategory: 'common',
      element: null,
      health: 6,
      modifiers: {
        attack: 2,
        defense: 1,
        accuracy: 1,
        evasion: 1,
        celerity: 2,
        piercing: 0,
        reflection: 0,
      },
      vigor: null,
      abilities: [],
      behavior: 'aggressive',
    },
  ],
  goodOutcome: { text: 'Ganhe 3 de ouro.' },
  badOutcome: { text: 'Perca 2 de Vida.' },
  noEscape: false,
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

/** Provisória. */
export const whisperingGroveFixture: Card = {
  type: 'zone',
  id: 'fixture.whispering-grove',
  collectionId: 'fixture',
  title: 'Bosque Sussurrante',
  zoneType: 'forest',
  location: 'Bosque',
  connectionArrows: 2,
  zoneActions: ['startEvent', 'scavenge'],
  effects: [{ text: 'Esquiva +1 nesta zona.', polarity: 'positive' }],
}

/** Provisória. */
export const woundedTravelerFixture: Card = {
  type: 'randomEvent',
  id: 'fixture.wounded-traveler',
  collectionId: 'fixture',
  title: 'Viajante Ferido',
  flavorText: null,
  requirements: [{ text: 'Sabedoria 2.' }],
  goodOutcome: { text: 'Ganhe 1 item.' },
  badOutcome: { text: 'Perca 1 de Vida.' },
  noEscape: false,
}

/** GET /catalog/collections/fixture/cards — 6 cartas na ordem de `id`. */
export const fixtureCardsFixture: Card[] = [
  bladeOfDuskFixture,
  healingPotionFixture,
  howlingWolvesFixture,
  strengthBasicFixture,
  whisperingGroveFixture,
  woundedTravelerFixture,
]

/** GET /catalog/collections/fixture/cards?type=<tipo> — listas prontas. */
export const fixtureCardsByTypeFixture: Record<CardType, Card[]> = {
  zone: [whisperingGroveFixture],
  attribute: [strengthBasicFixture],
  equipment: [bladeOfDuskFixture],
  item: [healingPotionFixture],
  randomEvent: [woundedTravelerFixture],
  combatEvent: [howlingWolvesFixture],
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

/** Coleção inexistente → 404 COLLECTION_NOT_FOUND. */
export const collectionNotFoundFixture: ErrorEnvelope = {
  error: { code: 'COLLECTION_NOT_FOUND', message: 'Coleção não encontrada.' },
}
