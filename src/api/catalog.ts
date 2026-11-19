import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import { getJson } from './http'

/**
 * Catálogo (CONTRATO §3 FEAT-04): conteúdo publicado, só leitura. Os textos
 * de regra chegam prontos (D-27). O schema confere o formato (campos, uniões
 * do glossário, faixas numéricas do contrato); invariantes entre campos
 * (ex.: zona `urban` com 4 setas) são do backend e não se conferem aqui.
 */

export * from './vocabulary'
import {
  type CardType,
  raritySchema,
  zoneTypeSchema,
  equipmentSlotSchema,
  itemCategorySchema,
  elementSchema,
  enemyTypeSchema,
  enemyCategorySchema,
  enemyBehaviorSchema,
  playerClassSchema,
  attributeSchema,
  modifierSchema,
  type Modifier,
  zoneActionSchema,
} from './vocabulary'
import { effectSchema, zoneEffectSchema } from './effects'

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
    dimension: countByCardType,
  }) satisfies z.ZodType<Record<CardType, number>>,
})
export type CollectionSummary = z.infer<typeof collectionSummarySchema>

const cardBase = { id: z.string(), collectionId: z.string() }
const flavorText = z.string().nullable()
const nonNegativeInt = z.number().int().min(0)

/** Os 7 modificadores, inteiros ≥ 0. */
export const modifierValuesSchema = z.object({
  attack: nonNegativeInt,
  defense: nonNegativeInt,
  accuracy: nonNegativeInt,
  evasion: nonNegativeInt,
  celerity: nonNegativeInt,
  piercing: nonNegativeInt,
  reflection: nonNegativeInt,
}) satisfies z.ZodType<Record<Modifier, number>>

/** README 3.4 */
export const zoneCardSchema = z.object({
  type: z.literal('zone'),
  ...cardBase,
  title: z.string(),
  zoneType: zoneTypeSchema,
  location: z.string(),
  connectionArrows: z.number().int().min(1).max(4),
  /** FEAT-06: só com 2 setas; `null` nos outros casos (o backend confere). */
  arrowLayout: z.enum(['straight', 'corner']).nullable(),
  zoneActions: z.array(zoneActionSchema),
  effects: z.array(zoneEffectSchema),
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
  effects: z.array(effectSchema),
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
  effects: z.array(effectSchema),
  refinement: z
    .object({
      maxLevel: z.number().int().min(1).max(10),
      materials: ruleTextSchema,
    })
    .nullable(),
  enchantment: ruleTextSchema.nullable(),
  priceMultiplier: z.number().min(0.8).max(1.5),
  /** FEAT-32: `toolKind` da ferramenta que coleta esta carta; `null` = não coletável. */
  scavengeTool: z.string().nullable(),
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
  effects: z.array(effectSchema),
  /** FEAT-32: só em ferramenta (texto kebab-case, exibido como recebido, D-59). */
  toolKind: z.string().nullable(),
  /** FEAT-32: tipos de zona onde a ferramenta vasculha. */
  scavengeZoneTypes: z.array(zoneTypeSchema),
  /** FEAT-32: como em `equipmentCardSchema`. */
  scavengeTool: z.string().nullable(),
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
  modifiers: modifierValuesSchema,
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

/** README 3.2 (FEAT-06). Conclusão e chefe final entram na FEAT-19. */
export const dimensionCardSchema = z.object({
  type: z.literal('dimension'),
  ...cardBase,
  name: z.string(),
  flavorText,
  releaseOrder: z.number().int().min(1),
  /** `null` = sorteada pelo backend entre as `urban` sem efeito negativo. */
  arrivalZoneTitle: z.string().nullable(),
  effects: z.array(zoneEffectSchema),
  /** FEAT-32 (README 3.4): composição do deck de recompensas por tipo de zona. */
  rewardDecks: z.array(
    z.object({
      zoneType: zoneTypeSchema,
      cards: z
        .array(
          z.object({ cardId: z.string(), copies: z.number().int().min(1) }),
        )
        .min(1),
    }),
  ),
})

export const cardSchema = z.discriminatedUnion('type', [
  zoneCardSchema,
  attributeCardSchema,
  equipmentCardSchema,
  itemCardSchema,
  randomEventCardSchema,
  combatEventCardSchema,
  dimensionCardSchema,
])
export type Card = z.infer<typeof cardSchema>
export type ZoneCard = z.infer<typeof zoneCardSchema>
export type AttributeCard = z.infer<typeof attributeCardSchema>
export type EquipmentCard = z.infer<typeof equipmentCardSchema>
export type ItemCard = z.infer<typeof itemCardSchema>
export type RandomEventCard = z.infer<typeof randomEventCardSchema>
export type CombatEventCard = z.infer<typeof combatEventCardSchema>
export type DimensionCard = z.infer<typeof dimensionCardSchema>

/** GET /catalog/classes — README 8.6, 8.7, 4.4 (FEAT-06). */
export const classDefinitionSchema = z.object({
  playerClass: playerClassSchema,
  collectionId: z.string(),
  name: z.string(),
  essentialAttributes: z.array(attributeSchema).min(1).max(2),
  baseModifiers: modifierValuesSchema,
  starterDeck: z.array(
    z.object({ cardId: z.string(), copies: z.number().int().min(1) }),
  ),
})
export type ClassDefinition = z.infer<typeof classDefinitionSchema>

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

/**
 * Cartas da coleção, filtradas pelo backend quando há `type` (REQ-08);
 * `null`: consulta parada (REQ-46, enquanto não há coleção).
 */
export function useCards(
  collectionId: string | null,
  type?: CardType,
): UseQueryResult<Card[], Error> {
  return useQuery({
    queryKey: ['catalog', 'cards', collectionId, type ?? 'all'],
    queryFn: () => getCards(collectionId ?? '', type),
    enabled: collectionId !== null,
    retry: false,
  })
}

/** Classes publicadas, na ordem recebida (REQ-29). */
export function useClasses(): UseQueryResult<ClassDefinition[], Error> {
  return useQuery({
    queryKey: ['catalog', 'classes'],
    queryFn: async () =>
      z.array(classDefinitionSchema).parse(await getJson('/catalog/classes')),
    retry: false,
  })
}

function catalogCardQuery(cardId: string) {
  return {
    queryKey: ['catalog', 'card', cardId],
    queryFn: async () =>
      cardSchema.parse(
        await getJson(`/catalog/cards/${encodeURIComponent(cardId)}`),
      ),
    retry: false,
    staleTime: Infinity,
  } as const
}

/** Uma carta do catálogo; cache por id, sem novo pedido (D-48). */
export function useCatalogCard(cardId: string): UseQueryResult<Card, Error> {
  return useQuery(catalogCardQuery(cardId))
}

export interface CatalogCards {
  /** Cartas já recebidas, por id. */
  cards: ReadonlyMap<string, Card>
  isPending: boolean
  /** Primeiro erro entre as consultas, se houver. */
  error: Error | null
}

/** Várias cartas: uma consulta por id distinto, no mesmo cache (D-48, D-51). */
export function useCatalogCards(cardIds: readonly string[]): CatalogCards {
  return useQueries({
    queries: [...new Set(cardIds)].map(catalogCardQuery),
    combine: (results) => {
      const cards = new Map<string, Card>()
      for (const r of results) {
        if (r.data !== undefined) cards.set(r.data.id, r.data)
      }
      return {
        cards,
        isPending: results.some((r) => r.isPending),
        error: results.find((r) => r.error !== null)?.error ?? null,
      }
    },
  })
}
