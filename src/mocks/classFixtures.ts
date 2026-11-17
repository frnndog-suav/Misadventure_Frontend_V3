import type { ClassDefinition } from '../api/catalog'

/**
 * Fixtures das classes do CONTRATO §3 FEAT-06 (v0.25). As duas classes
 * são cópias exatas do conteúdo de teste do backend (coleção `fixture`).
 * Nenhuma regra (Princípio 3).
 */

export const rogueClassFixture: ClassDefinition = {
  playerClass: 'rogue',
  collectionId: 'fixture',
  name: 'Ladino',
  essentialAttributes: ['dexterity'],
  baseModifiers: {
    attack: 5,
    defense: 2,
    accuracy: 46,
    evasion: 22,
    celerity: 12,
    piercing: 0,
    reflection: 0,
  },
  starterDeck: [
    { cardId: 'fixture.dexterity-basic', copies: 40 },
    { cardId: 'fixture.strength-basic', copies: 20 },
  ],
}

export const warriorClassFixture: ClassDefinition = {
  playerClass: 'warrior',
  collectionId: 'fixture',
  name: 'Guerreiro',
  essentialAttributes: ['strength', 'endurance'],
  baseModifiers: {
    attack: 6,
    defense: 5,
    accuracy: 45,
    evasion: 15,
    celerity: 8,
    piercing: 0,
    reflection: 0,
  },
  starterDeck: [
    { cardId: 'fixture.endurance-basic', copies: 30 },
    { cardId: 'fixture.strength-basic', copies: 30 },
  ],
}

/** GET /catalog/classes — ordem por `playerClass`. */
export const classesFixture: ClassDefinition[] = [
  rogueClassFixture,
  warriorClassFixture,
]
