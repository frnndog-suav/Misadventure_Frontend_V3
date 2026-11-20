import { z } from 'zod'
import { costSchema, effectSchema, eventPhaseSchema } from './effects'
import {
  attributeSchema,
  equipmentSlotSchema,
  modifierSchema,
  zoneTypeSchema,
} from './vocabulary'

const count = z.number().int().nonnegative()
const positive = count.min(1)
const copy = z.object({ copyId: z.string(), cardId: z.string() })
const cardCopies = z.object({ cardId: z.string(), copies: positive })
const attributes = z.object({
  specific: z.partialRecord(attributeSchema, positive),
  any: count,
})
const minimumStat = z.union([
  z.literal('peak'),
  z.literal('vigor'),
  modifierSchema,
])
const requirementCostKinds = new Set<string>([
  'discardFromHand',
  'discardHandDownTo',
  'discardWholeHand',
  'donateLife',
  'payGold',
  'spendVigor',
  'abandonEquipment',
  'offerResources',
  'manipulateAttributeCards',
])
const requirementCost = z.union(
  costSchema.options.filter((schema) =>
    requirementCostKinds.has(schema.shape.kind.value),
  ),
)
const requirement = z
  .object({ id: z.string(), text: z.string() })
  .and(
    z.union([
      attributes.extend({ kind: z.literal('attributes') }),
      z.object({
        kind: z.literal('minimum'),
        stat: minimumStat,
        value: z.number(),
      }),
      requirementCost,
    ]),
  )

const outcome = z.object({
  text: z.string(),
  steps: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('effect'),
        effect: effectSchema.omit({ trigger: true, cost: true }),
      }),
      z.object({ type: z.literal('drawRewards'), count: positive }),
      z.object({ type: z.literal('searchReward'), cardId: z.string() }),
      cardCopies.extend({ type: z.literal('grantReward') }),
    ]),
  ),
})

export const randomEventRulesSchema = z.object({
  requirements: z.array(requirement).min(1),
  goodOutcome: outcome,
  badOutcome: outcome,
  escapeThreshold: z.number().nullable(),
})

const receipt = z.object({
  requirementId: z.string(),
  gold: count.optional(),
  health: count.optional(),
  vigor: count.optional(),
  handCards: z.array(copy).optional(),
  equipment: z
    .array(z.object({ slot: equipmentSlotSchema, cardId: z.string() }))
    .optional(),
  resources: z.array(cardCopies).optional(),
  movedAttributeCards: z.array(copy).optional(),
})

export function encounterSchema<Card extends z.ZodType>(card: Card) {
  return z.object({
    id: z.string(),
    memberId: z.string(),
    zoneType: zoneTypeSchema,
    phase: eventPhaseSchema,
    card: card.nullable(),
    payments: z.array(receipt),
    requirements: z.array(
      z.object({
        requirementId: z.string(),
        status: z.enum(['unpaid', 'partial', 'paid', 'check']),
        remaining: z
          .union([attributes, z.object({ copies: count })])
          .optional(),
        payable: z.boolean(),
        handCardSelection: z.enum(['choose', 'random']).nullable(),
        eligibleHandCopyIds: z.array(z.string()),
        eligibleEquipmentSlots: z.array(equipmentSlotSchema),
        eligibleResourceCardIds: z.array(z.string()),
        amountDue: count.nullable(),
      }),
    ),
    escape: z
      .object({
        vigorCost: count,
        threshold: z.number(),
        automatic: z.boolean(),
        unavailableReason: z.string().nullable(),
      })
      .nullable(),
    decisionDeadlineAt: z.iso.datetime().nullable(),
  })
}

export const randomEventResultSchema = z.object({
  encounterId: z.string(),
  cardId: z.string(),
  resolution: z.enum(['success', 'setback', 'escaped']),
  cause: z.enum([
    'requirementsMet',
    'gaveUp',
    'escapeSucceeded',
    'escapeFailed',
    'timedOut',
  ]),
  payments: z.array(receipt),
  peakDelta: z.number().int(),
  replacement: z.object({ requested: count, drawn: count }),
  escape: z
    .object({
      vigorSpent: count,
      naturalRoll: z.number().int().min(1).max(20).nullable(),
      total: z.number().nullable(),
      threshold: z.number(),
      succeeded: z.boolean(),
      actionPointsLost: count,
      nextTurnActionPointDebtAdded: count,
    })
    .nullable(),
})

const rewardOrigin = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rewardDeck'), zoneType: zoneTypeSchema }),
  z.object({ type: z.literal('reserveDeck') }),
  z.object({ type: z.literal('fixed') }),
])

export const pendingRewardSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  cardId: z.string(),
  origin: rewardOrigin,
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('randomEvent'), encounterId: z.string() }),
    z.object({ type: z.literal('scavenge') }),
  ]),
  destination: z.enum(['inventory', 'tcgFolder']),
  discardOptions: z.array(
    z.object({ cardId: z.string(), maxCopies: positive }),
  ),
  decisionDeadlineAt: z.iso.datetime().nullable(),
})

export const randomEventPlayerFields = {
  handCopies: z.array(copy),
  nextTurnActionPointDebt: count,
  lastRandomEvent: randomEventResultSchema.nullable(),
  lastRewardSearch: z
    .object({ encounterId: z.string(), cardId: z.string(), found: z.boolean() })
    .nullable(),
  lastRewardDelivery: z
    .object({
      rewardId: z.string(),
      cardId: z.string(),
      origin: rewardOrigin,
      disposition: z.enum(['kept', 'returnedToDeck', 'removed', 'sentToLimbo']),
    })
    .nullable(),
}

export const eventMinimumCheckSchema = z.object({
  requirementId: z.string(),
  stat: minimumStat,
  minimum: z.number(),
  actual: z.number(),
})

export const randomEventActionTypes = [
  'startEvent',
  'revealEvent',
  'payEventRequirement',
  'resolveEvent',
  'giveUpEvent',
  'escapeEvent',
  'resolveReward',
] as const

export type RandomEventAction =
  | { type: 'startEvent' }
  | {
      type: 'revealEvent' | 'resolveEvent' | 'giveUpEvent' | 'escapeEvent'
      encounterId: string
    }
  | {
      type: 'payEventRequirement'
      encounterId: string
      requirementId: string
      payment?: {
        handCards?: string[]
        equipmentSlots?: z.infer<typeof equipmentSlotSchema>[]
        resources?: z.infer<typeof cardCopies>[]
      }
    }

export type ResolveRewardAction = {
  type: 'resolveReward'
  rewardId: string
} & (
  | { choice: 'leave' }
  | { choice: 'keep'; discard: z.infer<typeof cardCopies>[] }
)
