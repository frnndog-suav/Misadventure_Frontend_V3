import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import { enemyAbilityPrioritiesSchema } from './catalog'
import { enemyBehaviorSchema } from './vocabulary'
import { ApiError, requestJson } from './http'

/**
 * Laboratório (CONTRATO §3 FEAT-03): valores ajustáveis do Apêndice A, com
 * padrões e limites prontos do backend. O frontend não valida regra (D-23).
 */

const gameConfigInt = z.number().int()

/** Valores ajustáveis; cada FEAT seguinte acrescenta as suas chaves. */
const numericGameConfigValuesSchema = z.object({
  minPlayers: gameConfigInt,
  maxPlayers: gameConfigInt,
  actionPointsPerTurn: gameConfigInt,
  initialPeak: gameConfigInt,
  initialVigor: gameConfigInt,
  baseHealth: gameConfigInt,
  initialGold: gameConfigInt,
  initialHandSize: gameConfigInt,
  // FEAT-06
  minDeckSize: gameConfigInt,
  lockOneEssential: gameConfigInt,
  lockTwoEssentials: gameConfigInt,
  mapMaxAttempts: gameConfigInt,
  defaultAttack: gameConfigInt,
  defaultDefense: gameConfigInt,
  defaultAccuracy: gameConfigInt,
  defaultEvasion: gameConfigInt,
  defaultCelerity: gameConfigInt,
  defaultPiercing: gameConfigInt,
  defaultReflection: gameConfigInt,
  // FEAT-09
  maxCopiesPerCard: gameConfigInt,
  tcgFolderCapacity: gameConfigInt,
  recoverHealthPercent: gameConfigInt,
  recoverVigorPercent: gameConfigInt,
  recoverHandSize: gameConfigInt,
  // FEAT-10
  inventoryCapacity: gameConfigInt,
  purseCapacity: gameConfigInt,
  // FEAT-32
  vaultCapacity: gameConfigInt,
  vaultDeckSlots: gameConfigInt,
  vaultGoldCapacity: gameConfigInt,
})

export const knockoutConfigDefaults = {
  knockoutHealthPercent: 10,
  knockoutPeakLossPercent: 10,
  knockoutVigorCapPercent: 50,
  soloKnockoutGoldLossPercent: 10,
  soloKnockoutWaitRounds: 1,
}

export const knockoutConfigLimits = {
  knockoutHealthPercent: { min: 1, max: 100 },
  knockoutPeakLossPercent: { min: 0, max: 100 },
  knockoutVigorCapPercent: { min: 0, max: 100 },
  soloKnockoutGoldLossPercent: { min: 0, max: 100 },
  soloKnockoutWaitRounds: { min: 0, max: 10 },
}

export const questConfigDefaults = {
  questBoardSize: 3,
  maxOpenQuests: 3,
  trialMinPeak: 30,
  mentorBaseGoldCost: 150,
  trialRandomEventTarget: 3,
  trialCombatTarget: 3,
  mentorRandomEventTarget: 5,
  mentorCombatTarget: 5,
  lockSpecializationAdditional: 6,
  lockSpecializationReinforcement: 4,
}

export const questConfigLimits = {
  questBoardSize: { min: 1, max: 50 },
  maxOpenQuests: { min: 1, max: 50 },
  trialMinPeak: { min: 0, max: 1000 },
  mentorBaseGoldCost: { min: 0, max: 1000000 },
  trialRandomEventTarget: { min: 0, max: 1000 },
  trialCombatTarget: { min: 0, max: 1000 },
  mentorRandomEventTarget: { min: 0, max: 1000 },
  mentorCombatTarget: { min: 0, max: 1000 },
  lockSpecializationAdditional: { min: 0, max: 200 },
  lockSpecializationReinforcement: { min: 0, max: 200 },
}

export type KnockoutConfigKey = keyof typeof knockoutConfigDefaults

const positiveInt = gameConfigInt.min(1)
export const gameConfigValuesSchema = numericGameConfigValuesSchema.extend({
  questBoardSize: gameConfigInt.default(questConfigDefaults.questBoardSize),
  maxOpenQuests: gameConfigInt.default(questConfigDefaults.maxOpenQuests),
  trialMinPeak: gameConfigInt.default(questConfigDefaults.trialMinPeak),
  mentorBaseGoldCost: gameConfigInt.default(
    questConfigDefaults.mentorBaseGoldCost,
  ),
  trialRandomEventTarget: gameConfigInt.default(
    questConfigDefaults.trialRandomEventTarget,
  ),
  trialCombatTarget: gameConfigInt.default(
    questConfigDefaults.trialCombatTarget,
  ),
  mentorRandomEventTarget: gameConfigInt.default(
    questConfigDefaults.mentorRandomEventTarget,
  ),
  mentorCombatTarget: gameConfigInt.default(
    questConfigDefaults.mentorCombatTarget,
  ),
  lockSpecializationAdditional: gameConfigInt.default(
    questConfigDefaults.lockSpecializationAdditional,
  ),
  lockSpecializationReinforcement: gameConfigInt.default(
    questConfigDefaults.lockSpecializationReinforcement,
  ),
  knockoutHealthPercent: gameConfigInt.default(
    knockoutConfigDefaults.knockoutHealthPercent,
  ),
  knockoutPeakLossPercent: gameConfigInt.default(
    knockoutConfigDefaults.knockoutPeakLossPercent,
  ),
  knockoutVigorCapPercent: gameConfigInt.default(
    knockoutConfigDefaults.knockoutVigorCapPercent,
  ),
  soloKnockoutGoldLossPercent: gameConfigInt.default(
    knockoutConfigDefaults.soloKnockoutGoldLossPercent,
  ),
  soloKnockoutWaitRounds: gameConfigInt.default(
    knockoutConfigDefaults.soloKnockoutWaitRounds,
  ),
  // A configuração das versões anteriores à FEAT-13 omite os campos de combate.
  maxCombatCycles: gameConfigInt.optional(),
  combatEscapeThreshold: gameConfigInt.optional(),
  combatEscapePeakLoss: gameConfigInt.optional(),
  exhaustionPenaltyPercent: gameConfigInt.optional(),
  projectileAccuracyBonusPercent: gameConfigInt.optional(),
  areaDamagePercent: gameConfigInt.optional(),
  shieldProjectileDamagePercent: gameConfigInt.optional(),
  channelInterruptDamagePercent: gameConfigInt.optional(),
  elementAdvantageBonusPercent: gameConfigInt.optional(),
  elementDisadvantagePenaltyPercent: gameConfigInt.optional(),
  enemyAbilityPriorities: z
    .record(enemyBehaviorSchema, enemyAbilityPrioritiesSchema)
    .optional(),
  escapeVigorPercent: gameConfigInt,
  reserveDeck: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('gold'),
          amount: positiveInt,
          weight: positiveInt,
        }),
        z.object({
          type: z.literal('card'),
          cardId: z.string(),
          weight: positiveInt,
        }),
      ]),
    )
    .min(1),
})

export type GameConfigValues = z.infer<typeof gameConfigValuesSchema>
export type GameConfigKey = keyof z.infer<typeof numericGameConfigValuesSchema>

const limitSchema = z.object({ min: gameConfigInt, max: gameConfigInt })

export const labConfigSchema = z.object({
  values: gameConfigValuesSchema,
  defaults: gameConfigValuesSchema,
  limits: z.object({
    minPlayers: limitSchema,
    maxPlayers: limitSchema,
    actionPointsPerTurn: limitSchema,
    initialPeak: limitSchema,
    initialVigor: limitSchema,
    baseHealth: limitSchema,
    initialGold: limitSchema,
    initialHandSize: limitSchema,
    minDeckSize: limitSchema,
    lockOneEssential: limitSchema,
    lockTwoEssentials: limitSchema,
    mapMaxAttempts: limitSchema,
    defaultAttack: limitSchema,
    defaultDefense: limitSchema,
    defaultAccuracy: limitSchema,
    defaultEvasion: limitSchema,
    defaultCelerity: limitSchema,
    defaultPiercing: limitSchema,
    defaultReflection: limitSchema,
    maxCopiesPerCard: limitSchema,
    tcgFolderCapacity: limitSchema,
    recoverHealthPercent: limitSchema,
    recoverVigorPercent: limitSchema,
    recoverHandSize: limitSchema,
    inventoryCapacity: limitSchema,
    purseCapacity: limitSchema,
    vaultCapacity: limitSchema,
    vaultDeckSlots: limitSchema,
    vaultGoldCapacity: limitSchema,
    knockoutHealthPercent: limitSchema.default(
      knockoutConfigLimits.knockoutHealthPercent,
    ),
    knockoutPeakLossPercent: limitSchema.default(
      knockoutConfigLimits.knockoutPeakLossPercent,
    ),
    knockoutVigorCapPercent: limitSchema.default(
      knockoutConfigLimits.knockoutVigorCapPercent,
    ),
    soloKnockoutGoldLossPercent: limitSchema.default(
      knockoutConfigLimits.soloKnockoutGoldLossPercent,
    ),
    soloKnockoutWaitRounds: limitSchema.default(
      knockoutConfigLimits.soloKnockoutWaitRounds,
    ),
    questBoardSize: limitSchema.default(questConfigLimits.questBoardSize),
    maxOpenQuests: limitSchema.default(questConfigLimits.maxOpenQuests),
    trialMinPeak: limitSchema.default(questConfigLimits.trialMinPeak),
    mentorBaseGoldCost: limitSchema.default(
      questConfigLimits.mentorBaseGoldCost,
    ),
    trialRandomEventTarget: limitSchema.default(
      questConfigLimits.trialRandomEventTarget,
    ),
    trialCombatTarget: limitSchema.default(questConfigLimits.trialCombatTarget),
    mentorRandomEventTarget: limitSchema.default(
      questConfigLimits.mentorRandomEventTarget,
    ),
    mentorCombatTarget: limitSchema.default(
      questConfigLimits.mentorCombatTarget,
    ),
    lockSpecializationAdditional: limitSchema.default(
      questConfigLimits.lockSpecializationAdditional,
    ),
    lockSpecializationReinforcement: limitSchema.default(
      questConfigLimits.lockSpecializationReinforcement,
    ),
    maxCombatCycles: limitSchema.optional(),
    combatEscapeThreshold: limitSchema.optional(),
    combatEscapePeakLoss: limitSchema.optional(),
    exhaustionPenaltyPercent: limitSchema.optional(),
    projectileAccuracyBonusPercent: limitSchema.optional(),
    areaDamagePercent: limitSchema.optional(),
    shieldProjectileDamagePercent: limitSchema.optional(),
    channelInterruptDamagePercent: limitSchema.optional(),
    elementAdvantageBonusPercent: limitSchema.optional(),
    elementDisadvantagePenaltyPercent: limitSchema.optional(),
    escapeVigorPercent: limitSchema.optional(),
    reserveDeck: z
      .object({ minEntries: positiveInt, minWeight: positiveInt })
      .optional(),
  }) satisfies z.ZodType<Record<GameConfigKey, { min: number; max: number }>>,
})

export type LabConfig = z.infer<typeof labConfigSchema>

/** PATCH /lab/config — só as chaves a alterar. */
export type LabConfigPatch = Partial<GameConfigValues>

export const labConfigInvalidDetailsSchema = z.object({
  fields: z.array(
    z.object({
      field: z.string().nullable(),
      reason: z.enum([
        'invalidBody',
        'unknownKey',
        'notInteger',
        'outOfRange',
        'minAboveMax',
      ]),
    }),
  ),
})

export type LabConfigInvalidDetails = z.infer<
  typeof labConfigInvalidDetailsSchema
>

/** `400 LAB_CONFIG_INVALID` com `details` já validado. */
export class LabConfigInvalidError extends ApiError {
  readonly fields: LabConfigInvalidDetails['fields']

  constructor(message: string, details: LabConfigInvalidDetails) {
    super('LAB_CONFIG_INVALID', message, details)
    this.name = 'LabConfigInvalidError'
    this.fields = details.fields
  }
}

const labConfigKey = ['lab', 'config'] as const

async function getLabConfig(): Promise<LabConfig> {
  return labConfigSchema.parse(await requestJson('GET', '/lab/config'))
}

async function patchLabConfig(patch: LabConfigPatch): Promise<LabConfig> {
  try {
    return labConfigSchema.parse(
      await requestJson('PATCH', '/lab/config', patch),
    )
  } catch (error) {
    if (error instanceof ApiError && error.code === 'LAB_CONFIG_INVALID') {
      const details = labConfigInvalidDetailsSchema.safeParse(error.details)
      if (!details.success) {
        throw new Error('LAB_CONFIG_INVALID com details fora do contrato', {
          cause: error,
        })
      }
      throw new LabConfigInvalidError(error.message, details.data)
    }
    throw error
  }
}

async function resetLabConfig(): Promise<LabConfig> {
  return labConfigSchema.parse(await requestJson('POST', '/lab/config/reset'))
}

/** Configuração em vigor. Sem retry automático (D-23). */
export function useLabConfig(): UseQueryResult<LabConfig, Error> {
  return useQuery({
    queryKey: labConfigKey,
    queryFn: getLabConfig,
    retry: false,
  })
}

/** Ajuste parcial; o sucesso atualiza o cache de `useLabConfig`. */
export function useUpdateLabConfig(): UseMutationResult<
  LabConfig,
  Error,
  LabConfigPatch
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: patchLabConfig,
    retry: false,
    onSuccess: (config) => queryClient.setQueryData(labConfigKey, config),
  })
}

/** Volta aos padrões; o sucesso atualiza o cache de `useLabConfig`. */
export function useResetLabConfig(): UseMutationResult<LabConfig, Error, void> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resetLabConfig,
    retry: false,
    onSuccess: (config) => queryClient.setQueryData(labConfigKey, config),
  })
}
