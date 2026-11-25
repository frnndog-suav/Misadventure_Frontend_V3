import { z } from 'zod'
import {
  zoneTypeSchema,
  zoneActionSchema,
  equipmentSlotSchema,
  itemCategorySchema,
  playerClassSchema,
  modifierSchema,
  attributeSchema,
  elementSchema,
  enemyTypeSchema,
  enemyCategorySchema,
  enemyBehaviorSchema,
} from './vocabulary'

/** CONTRATO v0.52 §3 FEAT-11: only shapes; cross-field game rules belong to the backend. */
export const eventPhaseSchema = z.enum([
  'anticipation',
  'encounter',
  'success',
  'setback',
])
export type EventPhase = z.infer<typeof eventPhaseSchema>

export const comparisonSchema = z.enum(['eq', 'lt', 'lte', 'gt', 'gte'])
export type Comparison = z.infer<typeof comparisonSchema>

export const modifierComparisonSchema = z.object({
  left: z.array(modifierSchema),
  op: comparisonSchema,
  right: z.union([z.array(modifierSchema), z.null()]),
  value: z.union([z.number(), z.null()]),
})
export type ModifierComparison = z.infer<typeof modifierComparisonSchema>

export const triggerSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('onEnterThisZone'),
  }),
  z.object({
    kind: z.literal('onEnterZoneTitle'),
    zoneTitle: z.string(),
  }),
  z.object({
    kind: z.literal('onEnterZoneFilter'),
    zoneTypes: z.array(zoneTypeSchema),
    excludeZoneTypes: z.array(zoneTypeSchema),
    locations: z.array(z.string()),
    excludeLocations: z.array(z.string()),
  }),
  z.object({
    kind: z.literal('onZoneActionUsed'),
    action: zoneActionSchema,
    times: z.number(),
    consecutive: z.boolean(),
  }),
  z.object({
    kind: z.literal('onZoneActionSkipped'),
    action: zoneActionSchema,
    zones: z.number(),
  }),
  z.object({
    kind: z.literal('whileZoneActionCountBelow'),
    action: zoneActionSchema,
    max: z.number(),
  }),
  z.object({
    kind: z.literal('onQuestCompleted'),
  }),
  z.object({
    kind: z.literal('onZoneQuestsCompleted'),
  }),
  z.object({
    kind: z.literal('onQuestCountReached'),
    count: z.number(),
    perZone: z.boolean(),
  }),
  z.object({
    kind: z.literal('onQuestAbandoned'),
  }),
  z.object({
    kind: z.literal('onEventPhase'),
    phases: z.array(eventPhaseSchema),
    exclude: z.boolean(),
  }),
  z.object({
    kind: z.literal('onEnemyDefeated'),
    count: z.number(),
    distinct: z.boolean(),
  }),
  z.object({
    kind: z.literal('onCombatFleeAttempt'),
  }),
  z.object({
    kind: z.literal('onAbilityUsed'),
    slots: z.array(equipmentSlotSchema),
    excludeSlots: z.array(equipmentSlotSchema),
    tags: z.array(z.string()),
    cardId: z.union([z.string(), z.null()]),
  }),
  z.object({
    kind: z.literal('onResourceEffectActivated'),
    source: z.enum(['any', 'inventory', 'equipment']),
    count: z.number(),
    distinct: z.boolean(),
  }),
  z.object({
    kind: z.literal('whileResourceActivationCountBelow'),
    max: z.number(),
    distinct: z.boolean(),
  }),
  z.object({
    kind: z.literal('whileInventoryResourceCount'),
    count: z.number(),
    op: comparisonSchema,
    distinct: z.boolean(),
  }),
  z.object({
    kind: z.literal('whileEffectUseCount'),
    source: z.enum(['any', 'inventory', 'equipment']),
    slots: z.array(equipmentSlotSchema),
    excludeSlots: z.array(equipmentSlotSchema),
    itemCategories: z.array(itemCategorySchema),
    count: z.number(),
    op: comparisonSchema,
    distinct: z.boolean(),
  }),
  z.object({
    kind: z.literal('whileClassIs'),
    classes: z.array(playerClassSchema),
    mode: z.enum(['anyOf', 'allOf']),
  }),
  z.object({
    kind: z.literal('whileSpecializationOf'),
    classes: z.array(playerClassSchema),
  }),
  z.object({
    kind: z.literal('whilePrimaryClassCount'),
    min: z.number(),
    max: z.union([z.number(), z.null()]),
  }),
  z.object({
    kind: z.literal('whileSpecializationCount'),
    min: z.number(),
    max: z.union([z.number(), z.null()]),
  }),
  z.object({
    kind: z.literal('whileHighestModifier'),
    modifiers: z.array(modifierSchema),
  }),
  z.object({
    kind: z.literal('whileLowestModifier'),
    modifiers: z.array(modifierSchema),
  }),
  z
    .object({
      kind: z.literal('whileModifierComparison'),
    })
    .extend(modifierComparisonSchema.shape),
  z.object({
    kind: z.literal('whileHandAttributeCount'),
    attributes: z.array(attributeSchema),
    mode: z.enum(['each', 'any']),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileHandDistinctAttributes'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileHandCount'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileAttributeDiscardCount'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileAttributeDeckCount'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileHealth'),
    value: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileGold'),
    value: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('whileVigorRatio'),
    percent: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('onVigorReached'),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('whilePeak'),
    value: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('onVigorSpent'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('onPeakLost'),
  }),
  z.object({
    kind: z.literal('onElementAbilityUsed'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('onElementalAdvantageHit'),
  }),
  z.object({
    kind: z.literal('onElementDamageTaken'),
    element: z.union([elementSchema, z.null()]),
  }),
  z.object({
    kind: z.literal('whileUsedAbilitiesSameElement'),
  }),
  z.object({
    kind: z.literal('onEngageEnemyElement'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('onEngageEnemyType'),
    enemyTypes: z.array(enemyTypeSchema),
  }),
  z.object({
    kind: z.literal('onEnemyCategoryDefeated'),
    category: enemyCategorySchema,
  }),
  z.object({
    kind: z.literal('whileEnemyCount'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('onAttackedByEnemyBehavior'),
    behavior: enemyBehaviorSchema,
  }),
])
export type Trigger = z.infer<typeof triggerSchema>

export const handRequirementSchema = z.object({
  requirements: z.array(
    z.object({
      attribute: z.union([attributeSchema, z.literal('any')]),
      count: z.number(),
    }),
  ),
  excludeAttributes: z.array(attributeSchema),
  constraint: z.enum(['none', 'distinct', 'same']),
  random: z.boolean(),
})
export type HandRequirement = z.infer<typeof handRequirementSchema>

export const quantitySchema = z.union([
  z.number(),
  z.object({
    base: z.enum([
      'equipmentInUseCount',
      'equipmentInInventoryCount',
      'resourcesInInventoryCount',
      'relicsAndDocumentsInInventoryCount',
      'attributeDiscardCount',
      'halfHealth',
      'halfGold',
      'halfVigor',
      'allVigor',
      'highestModifier',
      'lowestModifier',
      'perEnemy',
    ]),
    multiplier: z.number(),
    minimum: z.number(),
  }),
])
export type Quantity = z.infer<typeof quantitySchema>

export const equipmentSelectionSchema = z.object({
  slots: z.array(equipmentSlotSchema),
  excludeSlots: z.array(equipmentSlotSchema),
  count: z.number(),
  random: z.boolean(),
})
export type EquipmentSelection = z.infer<typeof equipmentSelectionSchema>

export const resourceOfferSchema = z.object({
  requirements: z.array(
    z.object({
      resource: z.string(),
      count: z.number(),
    }),
  ),
  constraint: z.enum(['none', 'distinct', 'same']),
  exclude: z.array(z.string()),
})
export type ResourceOffer = z.infer<typeof resourceOfferSchema>

export const costSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('consumeSelf'),
  }),
  z
    .object({
      kind: z.literal('discardFromHand'),
    })
    .extend(handRequirementSchema.shape),
  z.object({
    kind: z.literal('discardHandDownTo'),
    leave: z.number(),
    minimum: z.number(),
  }),
  z.object({
    kind: z.literal('discardWholeHand'),
    minimum: z.number(),
  }),
  z.object({
    kind: z.literal('donateLife'),
    amount: quantitySchema,
  }),
  z.object({
    kind: z.literal('payGold'),
    amount: quantitySchema,
  }),
  z
    .object({
      kind: z.literal('abandonEquipment'),
    })
    .extend(equipmentSelectionSchema.shape),
  z
    .object({
      kind: z.literal('offerResources'),
    })
    .extend(resourceOfferSchema.shape),
  z.object({
    kind: z.literal('manipulateAttributeCards'),
    mode: z.enum([
      'millTop',
      'millBottom',
      'reshuffleDiscard',
      'reshuffleHand',
      'handToTop',
      'handToBottom',
    ]),
    count: z.number(),
    minimum: z.union([z.number(), z.null()]),
  }),
  z.object({
    kind: z.literal('spendVigor'),
    amount: quantitySchema,
  }),
  z.object({
    kind: z.literal('reducePeak'),
    amount: z.union([z.number(), z.null()]),
    percent: z.union([z.number(), z.null()]),
  }),
])
export type Cost = z.infer<typeof costSchema>

export const activationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('gainGold'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('loseGold'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('heal'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('loseLife'),
    amount: z.union([z.number(), z.literal('halfHealth')]),
  }),
  z.object({
    kind: z.literal('gainPeak'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('restoreVigor'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('modifierFlat'),
    changes: z.array(
      z.object({
        modifier: modifierSchema,
        amount: z.number(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('modifierPercent'),
    changes: z.array(
      z.object({
        modifier: modifierSchema,
        percent: z.number(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('zeroModifiers'),
    modifiers: z.array(modifierSchema),
  }),
  z.object({
    kind: z.literal('attributeValueMultiplier'),
    attribute: attributeSchema,
    factor: z.number(),
  }),
  z.object({
    kind: z.literal('effectDamage'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('enemyModifierFlat'),
    changes: z.array(
      z.object({
        modifier: modifierSchema,
        amount: z.number(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('gainBaseHealth'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('drawCards'),
    count: z.number(),
  }),
  z
    .object({
      kind: z.literal('discardHandCards'),
    })
    .extend(handRequirementSchema.shape),
  z.object({
    kind: z.literal('returnDiscardToDeckTop'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('millDeck'),
    count: z.number(),
    from: z.enum(['top', 'bottom']),
  }),
  z.object({
    kind: z.literal('searchAttribute'),
    attribute: attributeSchema,
    count: z.number(),
    source: z.enum(['deck', 'discardPile']),
    shuffle: z.boolean(),
  }),
  z.object({
    kind: z.literal('handToDeckTop'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('nullifyEffects'),
    target: z.enum(['equipment', 'item', 'attributeCard']),
    slots: z.array(equipmentSlotSchema),
    itemCategories: z.array(itemCategorySchema),
  }),
  z.object({
    kind: z.literal('nullifyAbilities'),
    slots: z.array(equipmentSlotSchema),
    tags: z.array(z.string()),
  }),
  z.object({
    kind: z.literal('keepPeakOnKnockout'),
  }),
  z.object({
    kind: z.literal('actionPointsOverride'),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('actionPointsBonus'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('moveDistanceBonus'),
    zones: z.number(),
  }),
  z.object({
    kind: z.literal('recoverHealPercentOverride'),
    percent: z.number(),
  }),
  z.object({
    kind: z.literal('skipEventBackfire'),
  }),
  z.object({
    kind: z.literal('handLimit'),
    max: z.number(),
  }),
  z.object({
    kind: z.literal('fleeTargetOverride'),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('fleeTargetModifier'),
    amount: z.union([z.number(), z.literal('minusHandCount')]),
  }),
  z.object({
    kind: z.literal('marketShowcaseModifier'),
    mode: z.enum(['add', 'set']),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('diceChooseResult'),
  }),
  z.object({
    kind: z.literal('diceResultModifier'),
    amount: z.union([z.number(), z.literal('minusHandCount')]),
  }),
  z.object({
    kind: z.literal('breakEquipment'),
    slots: z.array(equipmentSlotSchema),
  }),
  z
    .object({
      kind: z.literal('abandonOwnEquipment'),
    })
    .extend(equipmentSelectionSchema.shape),
  z.object({
    kind: z.literal('repairEquipment'),
    target: z.enum(['self', 'allyInZone']),
  }),
  z
    .object({
      kind: z.literal('offerResourcesAsEffect'),
    })
    .extend(resourceOfferSchema.shape),
  z.object({
    kind: z.literal('changeNextAbilityElement'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('grantElementToAbility'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('removeEnemyElement'),
  }),
  z.object({
    kind: z.literal('ignoreElementalDisadvantage'),
  }),
  z.object({
    kind: z.literal('elementalAdvantageOverride'),
    percent: z.number(),
  }),
  z.object({
    kind: z.literal('invertElementalRelations'),
  }),
  z.object({
    kind: z.literal('elementResistance'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('elementImmunity'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('elementVulnerability'),
    element: elementSchema,
  }),
  z.object({
    kind: z.literal('elementVigorCostModifier'),
    element: elementSchema,
    percent: z.number(),
  }),
  z.object({
    kind: z.literal('defeatEnemy'),
  }),
  z.object({
    kind: z.literal('extraAttack'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('skipEnemyTurn'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('swapCombatOrder'),
  }),
  z.object({
    kind: z.literal('reviveAlly'),
    healthPercent: z.number(),
  }),
  z.object({
    kind: z.literal('teleportToRespawn'),
  }),
  z.object({
    kind: z.literal('moveToZoneOfType'),
    zoneType: z.union([zoneTypeSchema, z.literal('sameAsCurrent')]),
  }),
  z.object({
    kind: z.literal('removeDebuffs'),
    target: z.enum(['self', 'allyInZone', 'enemy']),
  }),
  z.object({
    kind: z.literal('removeBuffs'),
    target: z.enum(['self', 'allyInZone', 'enemy']),
  }),
  /** FEAT-18: montaria, inventário extra e pasta extra vão ao limbo. */
  z.object({ kind: z.literal('loseMount') }),
])
export type Activation = z.infer<typeof activationSchema>

export const durationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('immediate'),
  }),
  z.object({
    kind: z.literal('whileSourceActive'),
  }),
  z.object({
    kind: z.literal('infinite'),
  }),
  z.object({
    kind: z.literal('untilThisCardDiscarded'),
  }),
  z.object({
    kind: z.literal('untilCardDiscarded'),
    cardId: z.string(),
  }),
  z.object({
    kind: z.literal('untilHandCount'),
    count: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('untilResourcesInLimbo'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilEndOfTurn'),
  }),
  z.object({
    kind: z.literal('untilStartOfNextTurn'),
  }),
  z.object({
    kind: z.literal('forOwnTurns'),
    turns: z.number(),
  }),
  z.object({
    kind: z.literal('untilEndOfNextPlayerTurn'),
  }),
  z.object({
    kind: z.literal('untilEndOfRound'),
  }),
  z.object({
    kind: z.literal('forRounds'),
    rounds: z.number(),
  }),
  z.object({
    kind: z.literal('untilStartOfNextRound'),
  }),
  z.object({
    kind: z.literal('whileInThisZone'),
  }),
  z.object({
    kind: z.literal('untilLeaveZone'),
  }),
  z.object({
    kind: z.literal('untilEnterZoneType'),
    zoneTypes: z.array(zoneTypeSchema),
  }),
  z.object({
    kind: z.literal('forZonesPassed'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilEventEnd'),
  }),
  z.object({
    kind: z.literal('forEvents'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilEventSuccess'),
  }),
  z.object({
    kind: z.literal('untilEventFailure'),
  }),
  z.object({
    kind: z.literal('untilNextCombatEnd'),
  }),
  z.object({
    kind: z.literal('forCombats'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilCombatWon'),
  }),
  z.object({
    kind: z.literal('untilEventPhaseEnd'),
    phase: eventPhaseSchema,
  }),
  z.object({
    kind: z.literal('duringEventPhases'),
    phases: z.array(eventPhaseSchema),
  }),
  z.object({
    kind: z.literal('untilZoneActionUsed'),
    action: zoneActionSchema,
    count: z.number(),
  }),
  z.object({
    kind: z.literal('forZoneActions'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilOwnCombatTurnEnd'),
  }),
  z.object({
    kind: z.literal('forOwnCombatTurns'),
    turns: z.number(),
  }),
  z.object({
    kind: z.literal('forCombatCycles'),
    cycles: z.number(),
  }),
  z.object({
    kind: z.literal('untilDamageTaken'),
  }),
  z.object({
    kind: z.literal('untilAttackMade'),
  }),
  z.object({
    kind: z.literal('untilAttackMissed'),
  }),
  z.object({
    kind: z.literal('untilAbilityUsed'),
    element: z.union([elementSchema, z.null()]),
  }),
  z.object({
    kind: z.literal('forAbilitiesUsed'),
    count: z.number(),
  }),
  z.object({
    kind: z.literal('whileAbilityActive'),
    cardId: z.string(),
  }),
  z.object({
    kind: z.literal('untilOtherResourceEffectActivated'),
  }),
  z.object({
    kind: z.literal('untilAnyEffectNullified'),
  }),
  z.object({
    kind: z.literal('whileEffectActive'),
    cardId: z.string(),
    effectIndex: z.number(),
  }),
  z.object({
    kind: z.literal('whileAttributeInHand'),
    attribute: attributeSchema,
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilAttributeDiscarded'),
    attribute: attributeSchema,
  }),
  z.object({
    kind: z.literal('untilAttributeInDiscard'),
    attribute: attributeSchema,
    count: z.number(),
  }),
  z.object({
    kind: z.literal('untilKnockout'),
  }),
  z.object({
    kind: z.literal('whileHealthThreshold'),
    value: z.number(),
    op: comparisonSchema,
  }),
  z.object({
    kind: z.literal('untilHandEmpty'),
  }),
  z.object({
    kind: z.literal('untilGoldSpent'),
    amount: z.number(),
  }),
  z.object({
    kind: z.literal('whileResourceInInventory'),
    cardId: z.string(),
  }),
  z.object({
    kind: z.literal('untilInventoryFull'),
  }),
  z.object({
    kind: z.literal('untilResourceOffered'),
  }),
  z.object({
    kind: z.literal('whileHighestModifierIs'),
    modifiers: z.array(modifierSchema),
  }),
  z.object({
    kind: z.literal('untilVigorBelow'),
    value: z.number(),
  }),
  z
    .object({
      kind: z.literal('whileModifierComparison'),
    })
    .extend(modifierComparisonSchema.shape),
  z.object({
    kind: z.literal('whileHasClass'),
    classes: z.array(playerClassSchema),
  }),
  z.object({
    kind: z.literal('untilSpecializationGained'),
  }),
  z.object({
    kind: z.literal('whileSinglePrimaryClass'),
  }),
  z.object({
    kind: z.literal('untilPartyEnd'),
  }),
  z.object({
    kind: z.literal('untilLeaveDimension'),
  }),
])
export type Duration = z.infer<typeof durationSchema>

export const effectSchema = z.object({
  text: z.string(),
  trigger: z.union([triggerSchema, z.null()]),
  cost: z.array(costSchema),
  activation: z.array(activationSchema),
  duration: durationSchema,
  mark: z.union([z.literal('buff'), z.literal('debuff'), z.null()]),
})
export type Effect = z.infer<typeof effectSchema>

export const zoneEffectSchema = effectSchema.omit({ mark: true }).extend(
  z.object({
    polarity: z.enum(['positive', 'negative']),
  }).shape,
)
export type ZoneEffect = z.infer<typeof zoneEffectSchema>

/** Estado pronto do backend; não recalcular disponibilidade ou duração. */
export const playerStatusSchema = z.object({
  statusId: z.string(),
  sourceCardId: z.string(),
  effectIndex: z.number().int().min(0),
  text: z.string(),
  mark: z.enum(['buff', 'debuff']),
  activation: z.array(activationSchema),
  duration: durationSchema,
  remaining: z.number().int().min(0).nullable(),
})
export type PlayerStatus = z.infer<typeof playerStatusSchema>

export const activatableEffectSchema = z.object({
  cardId: z.string(),
  effectIndex: z.number().int().min(0),
  /** FEAT-18: `mount` = efeito da carta de montaria. */
  source: z.enum(['inventory', 'equipment', 'mount']),
  handPayment: z
    .object({ count: z.number().int().min(1), text: z.string() })
    .nullable(),
})
export type ActivatableEffect = z.infer<typeof activatableEffectSchema>
