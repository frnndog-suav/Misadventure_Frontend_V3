import { z } from 'zod'

export const cardTypeSchema = z.enum([
  'zone',
  'attribute',
  'equipment',
  'item',
  'randomEvent',
  'combatEvent',
  'zoneQuest',
  'dimension',
])
export type CardType = z.infer<typeof cardTypeSchema>

export const raritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
])
export type Rarity = z.infer<typeof raritySchema>

/** README 3.3 */
export const zoneTypeSchema = z.enum([
  'mountainous',
  'forest',
  'coastal',
  'lacustrine',
  'swamp',
  'grassland',
  'desert',
  'volcanic',
  'fluvial',
  'underground',
  'urban',
  'rural',
  'inhabited',
  'fortified',
  'religious',
  'industrial',
])
export type ZoneType = z.infer<typeof zoneTypeSchema>

/** README 5.1 */
export const equipmentSlotSchema = z.enum([
  'head',
  'torso',
  'legs',
  'feet',
  'cape',
  'weapon',
  'shield',
  'accessory',
])
export type EquipmentSlot = z.infer<typeof equipmentSlotSchema>

/** README 5.2 */
export const itemCategorySchema = z.enum([
  'consumable',
  'material',
  'relic',
  'tool',
  'treasure',
  'document',
  'booster',
  'special',
])
export type ItemCategory = z.infer<typeof itemCategorySchema>

/** README 16.2 */
export const elementSchema = z.enum([
  'earth',
  'water',
  'fire',
  'air',
  'frost',
  'electric',
  'organic',
  'toxic',
  'arcane',
  'dark',
  'celestial',
  'draconic',
  'cosmic',
  'sonic',
  'psychic',
  'blood',
  'spiritual',
])
export type Element = z.infer<typeof elementSchema>

/** README 18.2 */
export const enemyTypeSchema = z.enum([
  'beast',
  'humanoid',
  'undead',
  'spirit',
  'demon',
  'celestial',
  'elemental',
  'construct',
  'draconic',
  'aberration',
  'plant',
])
export type EnemyType = z.infer<typeof enemyTypeSchema>

/** README 18.3 */
export const enemyCategorySchema = z.enum(['common', 'elite', 'boss'])
export type EnemyCategory = z.infer<typeof enemyCategorySchema>

/** README 18.1 / 19.6 */
export const enemyBehaviorSchema = z.enum([
  'aggressive',
  'defensive',
  'support',
  'hunter',
])
export type EnemyBehavior = z.infer<typeof enemyBehaviorSchema>

/** README 8.6 */
export const playerClassSchema = z.enum([
  'warrior',
  'mage',
  'rogue',
  'cleric',
  'ranger',
  'druid',
  'monk',
  'bard',
  'alchemist',
  'artificer',
  'warlock',
  'sorcerer',
])
export type PlayerClass = z.infer<typeof playerClassSchema>

/** CONTRATO §2.3 (README 4.1) */
export const attributeSchema = z.enum([
  'strength',
  'dexterity',
  'endurance',
  'intelligence',
  'wisdom',
  'charisma',
  'spirit',
  'sanity',
  'luck',
])
export type Attribute = z.infer<typeof attributeSchema>

/** CONTRATO §2.3 (README 7.1) */
export const modifierSchema = z.enum([
  'attack',
  'defense',
  'accuracy',
  'evasion',
  'celerity',
  'piercing',
  'reflection',
])
export type Modifier = z.infer<typeof modifierSchema>

/** CONTRATO §2.5 (README 12.2) */
export const zoneActionSchema = z.enum([
  'move',
  'recover',
  'prepare',
  'adjustDeck',
  'negotiate',
  'abandonQuest',
  'artificerWorkshop',
  'startEvent',
  'scavenge',
  'useVault',
  'takeQuest',
  'continueQuest',
  'finishQuest',
  'takeTrialQuest',
  'completeDimension',
  'visitBlacksmith',
  'visitMarket',
  'trainWithMentor',
  'saveRespawnPoint',
])
export type ZoneAction = z.infer<typeof zoneActionSchema>
