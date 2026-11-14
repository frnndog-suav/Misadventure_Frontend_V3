import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { z } from 'zod'
import { getJson } from './http'

/**
 * Catálogo (CONTRATO §3 FEAT-04): conteúdo publicado, só leitura. Os textos
 * de regra chegam prontos (D-27). O schema confere o formato (campos, uniões
 * do glossário, faixas numéricas do contrato); invariantes entre campos
 * (ex.: zona `urban` com 4 setas) são do backend e não se conferem aqui.
 */

export const cardTypeSchema = z.enum([
  'zone',
  'attribute',
  'equipment',
  'item',
  'randomEvent',
  'combatEvent',
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

/** Texto de regra para exibir (pt-BR). Estruturado na FEAT-11. */
export const ruleTextSchema = z.object({ text: z.string() })
export type RuleText = z.infer<typeof ruleTextSchema>

export const abilitySchema = z.object({ name: z.string(), text: z.string() })
export type Ability = z.infer<typeof abilitySchema>

const countByCardType = z.number().int().min(0)

export const collectionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  cardCounts: z.object({
    zone: countByCardType,
    attribute: countByCardType,
    equipment: countByCardType,
    item: countByCardType,
    randomEvent: countByCardType,
    combatEvent: countByCardType,
  }) satisfies z.ZodType<Record<CardType, number>>,
})
export type CollectionSummary = z.infer<typeof collectionSummarySchema>

const cardBase = { id: z.string(), collectionId: z.string() }
const flavorText = z.string().nullable()
const nonNegativeInt = z.number().int().min(0)

/** README 3.4 */
export const zoneCardSchema = z.object({
  type: z.literal('zone'),
  ...cardBase,
  title: z.string(),
  zoneType: zoneTypeSchema,
  location: z.string(),
  connectionArrows: z.number().int().min(1).max(4),
  zoneActions: z.array(zoneActionSchema),
  effects: z.array(
    ruleTextSchema.extend({ polarity: z.enum(['positive', 'negative']) }),
  ),
})

/** README 4.3 */
export const attributeCardSchema = z.object({
  type: z.literal('attribute'),
  ...cardBase,
  name: z.string(),
  flavorText,
  rarity: raritySchema,
  attributeKind: z.enum(['basic', 'synergy', 'enhanced']),
  attributes: z.array(attributeSchema).min(1),
  effects: z.array(ruleTextSchema),
})

/** README 5.1 */
export const equipmentCardSchema = z.object({
  type: z.literal('equipment'),
  ...cardBase,
  name: z.string(),
  flavorText,
  rarity: raritySchema,
  slot: equipmentSlotSchema,
  tags: z.array(z.string()),
  modifiers: z.array(z.object({ modifier: modifierSchema, value: z.number() })),
  peakRequirement: z.number().nullable(),
  classRestriction: z.array(playerClassSchema),
  blocksShield: z.boolean(),
  abilities: z.array(abilitySchema),
  effects: z.array(ruleTextSchema),
  refinement: z
    .object({
      maxLevel: z.number().int().min(1).max(10),
      materials: ruleTextSchema,
    })
    .nullable(),
  enchantment: ruleTextSchema.nullable(),
  priceMultiplier: z.number().min(0.8).max(1.5),
})

/** README 5.2 */
export const itemCardSchema = z.object({
  type: z.literal('item'),
  ...cardBase,
  name: z.string(),
  flavorText,
  rarity: raritySchema,
  itemCategory: itemCategorySchema,
  tags: z.array(z.string()),
  effects: z.array(ruleTextSchema),
})

/** README 14.1 */
export const randomEventCardSchema = z.object({
  type: z.literal('randomEvent'),
  ...cardBase,
  title: z.string(),
  flavorText,
  requirements: z.array(ruleTextSchema).min(1),
  goodOutcome: ruleTextSchema,
  badOutcome: ruleTextSchema,
  noEscape: z.boolean(),
})

/** README 18.1 — impresso dentro da carta de combate. */
export const enemySchema = z.object({
  name: z.string(),
  flavorText,
  count: z.number().int().min(1),
  enemyTypes: z.array(enemyTypeSchema).min(1),
  creature: z.string(),
  enemyCategory: enemyCategorySchema,
  element: elementSchema.nullable(),
  health: z.number().int().min(1),
  modifiers: z.object({
    attack: nonNegativeInt,
    defense: nonNegativeInt,
    accuracy: nonNegativeInt,
    evasion: nonNegativeInt,
    celerity: nonNegativeInt,
    piercing: nonNegativeInt,
    reflection: nonNegativeInt,
  }) satisfies z.ZodType<Record<Modifier, number>>,
  vigor: z.number().nullable(),
  abilities: z.array(abilitySchema),
  behavior: enemyBehaviorSchema,
})
export type Enemy = z.infer<typeof enemySchema>

/** README 14.1, 18.1 */
export const combatEventCardSchema = z.object({
  type: z.literal('combatEvent'),
  ...cardBase,
  title: z.string(),
  flavorText,
  enemies: z.array(enemySchema).min(1),
  goodOutcome: ruleTextSchema,
  badOutcome: ruleTextSchema,
  noEscape: z.boolean(),
})

export const cardSchema = z.discriminatedUnion('type', [
  zoneCardSchema,
  attributeCardSchema,
  equipmentCardSchema,
  itemCardSchema,
  randomEventCardSchema,
  combatEventCardSchema,
])
export type Card = z.infer<typeof cardSchema>
export type ZoneCard = z.infer<typeof zoneCardSchema>
export type AttributeCard = z.infer<typeof attributeCardSchema>
export type EquipmentCard = z.infer<typeof equipmentCardSchema>
export type ItemCard = z.infer<typeof itemCardSchema>
export type RandomEventCard = z.infer<typeof randomEventCardSchema>
export type CombatEventCard = z.infer<typeof combatEventCardSchema>

/** `details` do erro CATALOG_QUERY_INVALID (a tela mostra só a `message`). */
export interface CatalogQueryInvalidDetails {
  field: 'type'
  reason: 'unknownCardType'
}

async function getCollections(): Promise<CollectionSummary[]> {
  return z
    .array(collectionSummarySchema)
    .parse(await getJson('/catalog/collections'))
}

async function getCards(
  collectionId: string,
  type: CardType | undefined,
): Promise<Card[]> {
  const query = type === undefined ? '' : `?type=${type}`
  return z
    .array(cardSchema)
    .parse(
      await getJson(
        `/catalog/collections/${encodeURIComponent(collectionId)}/cards${query}`,
      ),
    )
}

/** Coleções do catálogo. Sem retry automático (como D-16/D-23). */
export function useCollections(): UseQueryResult<CollectionSummary[], Error> {
  return useQuery({
    queryKey: ['catalog', 'collections'],
    queryFn: getCollections,
    retry: false,
  })
}

/** Cartas da coleção, filtradas pelo backend quando há `type` (REQ-08). */
export function useCards(
  collectionId: string,
  type?: CardType,
): UseQueryResult<Card[], Error> {
  return useQuery({
    queryKey: ['catalog', 'cards', collectionId, type ?? 'all'],
    queryFn: () => getCards(collectionId, type),
    retry: false,
  })
}
