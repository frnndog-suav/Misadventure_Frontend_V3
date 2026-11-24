import { z } from 'zod'
import {
  blacksmithEnchantmentSchema,
  equipmentSlotSchema,
  materialRequirementSchema,
} from './catalog'

/**
 * Ferreiro e Oficina do Artífice (CONTRATO §3 FEAT-17, D-63): estado de cada
 * cópia de equipamento, projeção com custos e testes, resultado da visita.
 * Tudo pronto do backend; o frontend só valida o formato, monta o lote e envia.
 */

const id = z.string().min(1)
const count = z.number().int().nonnegative()

export const appliedEnchantmentSchema = z.object({
  /** Cópia da definição no momento do encantamento. */
  enchantment: blacksmithEnchantmentSchema,
  zoneId: id,
  /** `null` = o encantamento extra do Ferreiro Arcano. */
  slotIndex: count.nullable(),
  active: z.boolean(),
})
export type AppliedEnchantment = z.infer<typeof appliedEnchantmentSchema>

/** Estado de uma cópia de equipamento (README 5.1, 25). */
export const equipmentStateSchema = z.object({
  refinement: z.number().int().min(0).max(10),
  enchantments: z.array(appliedEnchantmentSchema),
  repairMarks: count,
  broken: z.boolean(),
})
export type EquipmentState = z.infer<typeof equipmentStateSchema>

export const equipmentTargetSchema = z.discriminatedUnion('location', [
  z.object({ location: z.literal('equipment'), slot: equipmentSlotSchema }),
  z.object({ location: z.literal('inventory'), inventorySlotIndex: count }),
])
export type EquipmentTarget = z.infer<typeof equipmentTargetSchema>

const testFields = {
  gold: count,
  threshold: z.number().int().min(0).max(21),
}

export const serviceViewSchema = z.object({
  equipment: z.array(
    z.object({
      target: equipmentTargetSchema,
      cardId: id,
      state: equipmentStateSchema,
      repair: z.object({ gold: count }).nullable(),
      refineSteps: z.array(
        z.object({
          targetLevel: z.number().int().min(1).max(10),
          materials: z.array(materialRequirementSchema),
          ...testFields,
          d20Bonus: count,
          breaksOnFailure: z.boolean(),
        }),
      ),
      enchantOptions: z.array(
        z.object({
          enchantmentId: id,
          replaceRequired: z.boolean(),
          extra: z.boolean(),
          requiresRefinement: z.number().int().min(0).max(10),
        }),
      ),
    }),
  ),
})
export type ServiceView = z.infer<typeof serviceViewSchema>

export const blacksmithViewSchema = z.object({
  zoneId: id.nullable(),
  blacksmith: serviceViewSchema.nullable(),
  workshop: serviceViewSchema.nullable(),
  enchantments: z.array(
    z.object({ enchantment: blacksmithEnchantmentSchema, ...testFields }),
  ),
  recipes: z.array(
    z.object({
      inventorySlotIndex: count,
      cardId: id,
      equipmentId: id,
      materials: z.array(materialRequirementSchema),
      gold: count,
      consumed: z.boolean(),
      canCraft: z.boolean(),
    }),
  ),
})
export type BlacksmithView = z.infer<typeof blacksmithViewSchema>

const resultBase = {
  gold: z.number().int(),
  skipped: z.boolean(),
}

export const blacksmithOperationResultSchema = z.discriminatedUnion(
  'operation',
  [
    z.object({
      operation: z.literal('repair'),
      target: equipmentTargetSchema,
      cardId: id,
      repairMarks: count,
      ...resultBase,
    }),
    z.object({
      operation: z.literal('refine'),
      target: equipmentTargetSchema,
      cardId: id,
      targetLevel: z.number().int().min(1).max(10),
      roll: z.number().int().min(1).max(20).nullable(),
      d20Bonus: count,
      threshold: z.number().int().min(0).max(21),
      success: z.boolean(),
      broke: z.boolean(),
      ...resultBase,
    }),
    z.object({
      operation: z.literal('enchant'),
      target: equipmentTargetSchema,
      cardId: id,
      enchantmentId: id,
      roll: z.number().int().min(1).max(20).nullable(),
      threshold: z.number().int().min(0).max(21),
      success: z.boolean(),
      replaced: appliedEnchantmentSchema.nullable(),
      ...resultBase,
    }),
    z.object({
      operation: z.literal('craft'),
      recipeCardId: id,
      equipmentId: id,
      inventorySlotIndex: count,
      ...resultBase,
    }),
  ],
)
export type BlacksmithOperationResult = z.infer<
  typeof blacksmithOperationResultSchema
>

export const blacksmithVisitResultSchema = z.object({
  source: z.enum(['blacksmith', 'workshop']),
  zoneId: id,
  actionPointsSpent: count,
  results: z.array(blacksmithOperationResultSchema),
})
export type BlacksmithVisitResult = z.infer<typeof blacksmithVisitResultSchema>

/** Campos do `PlayerState` da FEAT-17; respostas anteriores os omitem (legado). */
export const playerBlacksmithFields = {
  equipmentStates: z
    .object({
      head: equipmentStateSchema.nullable(),
      torso: equipmentStateSchema.nullable(),
      legs: equipmentStateSchema.nullable(),
      feet: equipmentStateSchema.nullable(),
      cape: equipmentStateSchema.nullable(),
      weapon: equipmentStateSchema.nullable(),
      shield: equipmentStateSchema.nullable(),
      accessory: equipmentStateSchema.nullable(),
    })
    .default({
      head: null,
      torso: null,
      legs: null,
      feet: null,
      cape: null,
      weapon: null,
      shield: null,
      accessory: null,
    }),
  blacksmith: blacksmithViewSchema.nullable().default(null),
  lastBlacksmithVisit: blacksmithVisitResultSchema.nullable().default(null),
}

/** Uma operação do lote do ferreiro ou da Oficina (README 25). */
export type BlacksmithOperation =
  | { operation: 'repair'; target: EquipmentTarget }
  | { operation: 'refine'; target: EquipmentTarget }
  | {
      operation: 'enchant'
      target: EquipmentTarget
      enchantmentId: string
      replaceIndex?: number
      extra?: boolean
    }
  | { operation: 'craft'; inventorySlotIndex: number }

/** Ir ao Ferreiro (README 12.2, 25): gasta todos os PA restantes. */
export interface VisitBlacksmithAction {
  type: 'visitBlacksmith'
  operations: BlacksmithOperation[]
}

/** Oficina do Artífice (README 25.5): 1 PA, qualquer zona, sem `enchant`. */
export interface ArtificerWorkshopAction {
  type: 'artificerWorkshop'
  operations: BlacksmithOperation[]
}
