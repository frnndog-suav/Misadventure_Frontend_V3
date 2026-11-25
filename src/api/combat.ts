import { z } from 'zod'
import { combatEventCardSchema, modifierValuesSchema } from './catalog'
import { playerStatusSchema } from './effects'
import type { EventPayment } from './randomEvents'
import { elementSchema, equipmentSlotSchema } from './vocabulary'

const id = z.string()
const count = z.number().int().nonnegative()
const positive = count.min(1)
const costFields = z.object({ costIndex: count, text: z.string() })
const paymentCostSchema = z.discriminatedUnion('type', [
  costFields.extend({ type: z.literal('automatic') }),
  costFields.extend({
    type: z.literal('handCards'),
    count: positive,
    eligibleCopyIds: z.array(id),
  }),
  costFields.extend({
    type: z.literal('equipmentSlots'),
    count: positive,
    eligibleSlots: z.array(equipmentSlotSchema),
  }),
  costFields.extend({
    type: z.literal('resources'),
    count: positive,
    eligibleResources: z.array(z.object({ cardId: id, maxCopies: positive })),
  }),
])
const optionSchema = z.object({
  targetIds: z.array(id),
  vigorCost: count,
  paymentCosts: z.array(paymentCostSchema),
})
/** Exatamente uma origem: slot de equipamento ou a montaria (FEAT-18). */
export const combatAbilityOptionSchema = z.union([
  optionSchema.extend({
    equipmentSlot: equipmentSlotSchema,
    mountAbility: z.undefined().optional(),
    abilityId: id,
  }),
  optionSchema.extend({
    equipmentSlot: z.undefined().optional(),
    mountAbility: z.literal(true),
    abilityId: id,
  }),
])
export type CombatAbilityOption = z.infer<typeof combatAbilityOptionSchema>
const originFields = { cardId: id, effectIndex: count }
const inventoryOrigin = z.object({
  ...originFields,
  type: z.literal('inventory'),
})
const equipmentOrigin = z.object({
  ...originFields,
  type: z.literal('equipment'),
  equipmentSlot: equipmentSlotSchema,
})
const mountOrigin = z.object({ ...originFields, type: z.literal('mount') })
const effectFields = { effectId: id, text: z.string() }
const effectOptionSchema = optionSchema.extend({
  ...effectFields,
  origin: z.discriminatedUnion('type', [
    inventoryOrigin,
    equipmentOrigin,
    mountOrigin,
  ]),
})
const triggeredOptionSchema = z.object({
  ...effectFields,
  origin: z.discriminatedUnion('type', [
    inventoryOrigin,
    equipmentOrigin,
    equipmentOrigin.extend({
      type: z.literal('equipmentAbility'),
      abilityId: id,
    }),
    mountOrigin,
    mountOrigin.extend({ type: z.literal('mountAbility'), abilityId: id }),
  ]),
})
export const triggeredEffectChoiceSchema = z.object({
  choiceId: id,
  memberId: id,
  decisionDeadlineAt: z.iso.datetime().nullable(),
  effects: z.array(
    z.discriminatedUnion('mode', [
      triggeredOptionSchema.extend({
        mode: z.literal('automatic'),
        paymentCosts: z.tuple([]),
      }),
      triggeredOptionSchema.extend({
        mode: z.literal('optional'),
        paymentCosts: z.array(paymentCostSchema),
        canPay: z.boolean(),
      }),
    ]),
  ),
})

export const combatStateSchema = z.object({
  id,
  cardId: id.optional(),
  card: combatEventCardSchema,
  memberId: id,
  cycle: positive,
  maxCycles: positive,
  turn: z.object({
    id,
    actorId: id,
    phase: z.enum(['prepare', 'attack']),
    attacksRemaining: count,
  }),
  order: z.array(id),
  enemies: z.array(
    z.object({
      id,
      blockIndex: count,
      copyIndex: count,
      health: count,
      maxHealth: count,
      vigor: count.nullable(),
      element: elementSchema.nullable(),
      effectiveModifiers: modifierValuesSchema,
      statuses: z.array(playerStatusSchema),
    }),
  ),
  attackTargetIds: z.array(id),
  abilities: z.array(combatAbilityOptionSchema),
  effects: z.array(effectOptionSchema),
  abilityStates: z.array(
    z.object({
      actorId: id,
      equipmentSlot: equipmentSlotSchema.nullable(),
      mountAbility: z.boolean().default(false),
      abilityId: id,
      cooldownRemaining: count,
      usesRemaining: count,
      charges: count.nullable(),
      active: z.boolean(),
    }),
  ),
  escape: z.object({
    vigorCost: count,
    threshold: count,
    automatic: z.boolean(),
    unavailableReason: z.string().nullable(),
  }),
})

export const combatResultSchema = z.object({
  combatId: id,
  cardId: id,
  memberId: id,
  resolution: z.enum(['victory', 'defeat', 'escaped']),
  cause: z.enum([
    'enemiesDefeated',
    'playerDown',
    'escapeSucceeded',
    'cycleLimit',
  ]),
  playerDown: z.boolean(),
  peakDelta: z.number().int(),
})

const update = z.object({ combatId: id })
export const combatUpdateSchema = z.discriminatedUnion('type', [
  update.extend({
    type: z.literal('combatStarted'),
    cardId: id,
    cardTitle: z.string(),
    participants: z.array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('player'), id, name: z.string() }),
        z.object({
          type: z.literal('enemy'),
          id,
          name: z.string(),
          blockIndex: count,
          copyIndex: count,
        }),
      ]),
    ),
  }),
  update.extend({
    type: z.literal('combatTurnStarted'),
    actorId: id,
    turnId: id,
    cycle: positive,
  }),
  update.extend({
    type: z.literal('combatAbilityUsed'),
    actorId: id,
    abilityId: id,
    equipmentSlot: equipmentSlotSchema.nullable(),
    mountAbility: z.boolean().default(false),
  }),
  update.extend({
    type: z.literal('combatEffectActivated'),
    actorId: id,
    effectId: id,
  }),
  update.extend({
    type: z.literal('combatDamageResolved'),
    actorId: id.nullable(),
    targetId: id,
    source: z.enum(['attack', 'ability', 'effect']),
    hit: z.boolean().nullable(),
    damage: count,
    reflectedDamage: count,
    targetHealth: count,
    actorHealth: count.nullable(),
  }),
  update.extend({
    type: z.literal('combatEscapeAttempted'),
    actorId: id,
    naturalRoll: z.number().nullable(),
    total: z.number().nullable(),
    threshold: count,
    vigorSpent: count,
    succeeded: z.boolean(),
  }),
  update.extend({ type: z.literal('combatEnded'), result: combatResultSchema }),
])

export const combatActionTypes = [
  'activateCombatEffect',
  'useAbility',
  'escapeCombat',
  'combatAttack',
  'endCombatTurn',
  'resolveTriggeredEffect',
] as const

/** FEAT-18: habilidade de equipamento em uso ou da montaria, nunca as duas. */
export type AbilitySource =
  | { equipmentSlot: z.infer<typeof equipmentSlotSchema>; mountAbility?: never }
  | { equipmentSlot?: never; mountAbility: true }

type CombatTurnAction = { combatId: string; turnId: string }
type PaidCombatAction = { targetId?: string; payment?: EventPayment }

export type CombatAction = CombatTurnAction &
  (
    | { type: 'combatAttack'; targetId: string }
    | { type: 'endCombatTurn' }
    | { type: 'escapeCombat' }
    | (PaidCombatAction & {
        type: 'useAbility'
        abilityId: string
      } & AbilitySource)
    | (PaidCombatAction & { type: 'activateCombatEffect'; effectId: string })
  )

export type ResolveTriggeredEffectAction = {
  type: 'resolveTriggeredEffect'
  choiceId: string
  effectId: string
} & (
  | { decision: 'resolve' | 'decline'; payment?: never }
  | { decision: 'pay'; payment?: EventPayment }
)
