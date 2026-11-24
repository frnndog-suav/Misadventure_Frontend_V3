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
  zoneQuestPeakGain: 3,
  genericQuestPeakGain: 5,
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
  zoneQuestPeakGain: { min: 0, max: 1000 },
  genericQuestPeakGain: { min: 0, max: 1000 },
}

/** FEAT-16 (CONTRATO v0.81): padrões das 37 chaves do mercado. */
export const marketConfigDefaults = {
  singlesShowcaseSlots: 4,
  singlesDecayMax: 3,
  singlesPoolSize: 20,
  marketFactorMinPercent: 80,
  marketFactorMaxPercent: 120,
  singlesStockCommon: 6,
  singlesStockUncommon: 4,
  singlesStockRare: 2,
  singlesStockEpic: 1,
  singlesStockLegendary: 1,
  singlesPriceCommon: 5,
  singlesPriceUncommon: 15,
  singlesPriceRare: 45,
  singlesPriceEpic: 130,
  singlesPriceLegendary: 370,
  scarcityStepPercent: 10,
  treasureValueCommon: 10,
  treasureValueUncommon: 25,
  treasureValueRare: 60,
  treasureValueEpic: 150,
  treasureValueLegendary: 400,
  boosterPrice: 30,
  boosterCardCount: 8,
  boosterSalePrice: 15,
  boosterChanceCommon: 600,
  boosterChanceUncommon: 250,
  boosterChanceRare: 110,
  boosterChanceEpic: 35,
  boosterChanceLegendary: 5,
  vaultExpansionSlots: 5,
  vaultExpansionBasePrice: 50,
  deckSlotExpansionSlots: 1,
  deckSlotExpansionBasePrice: 100,
  tcgFolderExpansionSlots: 10,
  tcgFolderExpansionBasePrice: 60,
  purseExpansionPricePercent: 50,
  vaultGoldExpansionPricePercent: 25,
}

export const marketConfigLimits = {
  singlesShowcaseSlots: { min: 1, max: 20 },
  singlesDecayMax: { min: 0, max: 20 },
  singlesPoolSize: { min: 1, max: 1000 },
  marketFactorMinPercent: { min: 1, max: 1000 },
  marketFactorMaxPercent: { min: 1, max: 1000 },
  singlesStockCommon: { min: 1, max: 100 },
  singlesStockUncommon: { min: 1, max: 100 },
  singlesStockRare: { min: 1, max: 100 },
  singlesStockEpic: { min: 1, max: 100 },
  singlesStockLegendary: { min: 1, max: 100 },
  singlesPriceCommon: { min: 1, max: 1000000 },
  singlesPriceUncommon: { min: 1, max: 1000000 },
  singlesPriceRare: { min: 1, max: 1000000 },
  singlesPriceEpic: { min: 1, max: 1000000 },
  singlesPriceLegendary: { min: 1, max: 1000000 },
  scarcityStepPercent: { min: 0, max: 1000 },
  treasureValueCommon: { min: 1, max: 1000000 },
  treasureValueUncommon: { min: 1, max: 1000000 },
  treasureValueRare: { min: 1, max: 1000000 },
  treasureValueEpic: { min: 1, max: 1000000 },
  treasureValueLegendary: { min: 1, max: 1000000 },
  boosterPrice: { min: 0, max: 1000000 },
  boosterCardCount: { min: 1, max: 50 },
  boosterSalePrice: { min: 1, max: 1000000 },
  boosterChanceCommon: { min: 0, max: 1000 },
  boosterChanceUncommon: { min: 0, max: 1000 },
  boosterChanceRare: { min: 0, max: 1000 },
  boosterChanceEpic: { min: 0, max: 1000 },
  boosterChanceLegendary: { min: 0, max: 1000 },
  vaultExpansionSlots: { min: 1, max: 1000 },
  vaultExpansionBasePrice: { min: 0, max: 1000000 },
  deckSlotExpansionSlots: { min: 1, max: 100 },
  deckSlotExpansionBasePrice: { min: 0, max: 1000000 },
  tcgFolderExpansionSlots: { min: 1, max: 1000 },
  tcgFolderExpansionBasePrice: { min: 0, max: 1000000 },
  purseExpansionPricePercent: { min: 0, max: 1000 },
  vaultGoldExpansionPricePercent: { min: 0, max: 1000 },
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
  zoneQuestPeakGain: gameConfigInt.default(
    questConfigDefaults.zoneQuestPeakGain,
  ),
  genericQuestPeakGain: gameConfigInt.default(
    questConfigDefaults.genericQuestPeakGain,
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
  singlesShowcaseSlots: gameConfigInt.default(
    marketConfigDefaults.singlesShowcaseSlots,
  ),
  singlesDecayMax: gameConfigInt.default(marketConfigDefaults.singlesDecayMax),
  singlesPoolSize: gameConfigInt.default(marketConfigDefaults.singlesPoolSize),
  marketFactorMinPercent: gameConfigInt.default(
    marketConfigDefaults.marketFactorMinPercent,
  ),
  marketFactorMaxPercent: gameConfigInt.default(
    marketConfigDefaults.marketFactorMaxPercent,
  ),
  singlesStockCommon: gameConfigInt.default(
    marketConfigDefaults.singlesStockCommon,
  ),
  singlesStockUncommon: gameConfigInt.default(
    marketConfigDefaults.singlesStockUncommon,
  ),
  singlesStockRare: gameConfigInt.default(
    marketConfigDefaults.singlesStockRare,
  ),
  singlesStockEpic: gameConfigInt.default(
    marketConfigDefaults.singlesStockEpic,
  ),
  singlesStockLegendary: gameConfigInt.default(
    marketConfigDefaults.singlesStockLegendary,
  ),
  singlesPriceCommon: gameConfigInt.default(
    marketConfigDefaults.singlesPriceCommon,
  ),
  singlesPriceUncommon: gameConfigInt.default(
    marketConfigDefaults.singlesPriceUncommon,
  ),
  singlesPriceRare: gameConfigInt.default(
    marketConfigDefaults.singlesPriceRare,
  ),
  singlesPriceEpic: gameConfigInt.default(
    marketConfigDefaults.singlesPriceEpic,
  ),
  singlesPriceLegendary: gameConfigInt.default(
    marketConfigDefaults.singlesPriceLegendary,
  ),
  scarcityStepPercent: gameConfigInt.default(
    marketConfigDefaults.scarcityStepPercent,
  ),
  treasureValueCommon: gameConfigInt.default(
    marketConfigDefaults.treasureValueCommon,
  ),
  treasureValueUncommon: gameConfigInt.default(
    marketConfigDefaults.treasureValueUncommon,
  ),
  treasureValueRare: gameConfigInt.default(
    marketConfigDefaults.treasureValueRare,
  ),
  treasureValueEpic: gameConfigInt.default(
    marketConfigDefaults.treasureValueEpic,
  ),
  treasureValueLegendary: gameConfigInt.default(
    marketConfigDefaults.treasureValueLegendary,
  ),
  boosterPrice: gameConfigInt.default(marketConfigDefaults.boosterPrice),
  boosterCardCount: gameConfigInt.default(
    marketConfigDefaults.boosterCardCount,
  ),
  boosterSalePrice: gameConfigInt.default(
    marketConfigDefaults.boosterSalePrice,
  ),
  boosterChanceCommon: gameConfigInt.default(
    marketConfigDefaults.boosterChanceCommon,
  ),
  boosterChanceUncommon: gameConfigInt.default(
    marketConfigDefaults.boosterChanceUncommon,
  ),
  boosterChanceRare: gameConfigInt.default(
    marketConfigDefaults.boosterChanceRare,
  ),
  boosterChanceEpic: gameConfigInt.default(
    marketConfigDefaults.boosterChanceEpic,
  ),
  boosterChanceLegendary: gameConfigInt.default(
    marketConfigDefaults.boosterChanceLegendary,
  ),
  vaultExpansionSlots: gameConfigInt.default(
    marketConfigDefaults.vaultExpansionSlots,
  ),
  vaultExpansionBasePrice: gameConfigInt.default(
    marketConfigDefaults.vaultExpansionBasePrice,
  ),
  deckSlotExpansionSlots: gameConfigInt.default(
    marketConfigDefaults.deckSlotExpansionSlots,
  ),
  deckSlotExpansionBasePrice: gameConfigInt.default(
    marketConfigDefaults.deckSlotExpansionBasePrice,
  ),
  tcgFolderExpansionSlots: gameConfigInt.default(
    marketConfigDefaults.tcgFolderExpansionSlots,
  ),
  tcgFolderExpansionBasePrice: gameConfigInt.default(
    marketConfigDefaults.tcgFolderExpansionBasePrice,
  ),
  purseExpansionPricePercent: gameConfigInt.default(
    marketConfigDefaults.purseExpansionPricePercent,
  ),
  vaultGoldExpansionPricePercent: gameConfigInt.default(
    marketConfigDefaults.vaultGoldExpansionPricePercent,
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
    zoneQuestPeakGain: limitSchema.default(questConfigLimits.zoneQuestPeakGain),
    genericQuestPeakGain: limitSchema.default(
      questConfigLimits.genericQuestPeakGain,
    ),
    singlesShowcaseSlots: limitSchema.default(
      marketConfigLimits.singlesShowcaseSlots,
    ),
    singlesDecayMax: limitSchema.default(marketConfigLimits.singlesDecayMax),
    singlesPoolSize: limitSchema.default(marketConfigLimits.singlesPoolSize),
    marketFactorMinPercent: limitSchema.default(
      marketConfigLimits.marketFactorMinPercent,
    ),
    marketFactorMaxPercent: limitSchema.default(
      marketConfigLimits.marketFactorMaxPercent,
    ),
    singlesStockCommon: limitSchema.default(
      marketConfigLimits.singlesStockCommon,
    ),
    singlesStockUncommon: limitSchema.default(
      marketConfigLimits.singlesStockUncommon,
    ),
    singlesStockRare: limitSchema.default(marketConfigLimits.singlesStockRare),
    singlesStockEpic: limitSchema.default(marketConfigLimits.singlesStockEpic),
    singlesStockLegendary: limitSchema.default(
      marketConfigLimits.singlesStockLegendary,
    ),
    singlesPriceCommon: limitSchema.default(
      marketConfigLimits.singlesPriceCommon,
    ),
    singlesPriceUncommon: limitSchema.default(
      marketConfigLimits.singlesPriceUncommon,
    ),
    singlesPriceRare: limitSchema.default(marketConfigLimits.singlesPriceRare),
    singlesPriceEpic: limitSchema.default(marketConfigLimits.singlesPriceEpic),
    singlesPriceLegendary: limitSchema.default(
      marketConfigLimits.singlesPriceLegendary,
    ),
    scarcityStepPercent: limitSchema.default(
      marketConfigLimits.scarcityStepPercent,
    ),
    treasureValueCommon: limitSchema.default(
      marketConfigLimits.treasureValueCommon,
    ),
    treasureValueUncommon: limitSchema.default(
      marketConfigLimits.treasureValueUncommon,
    ),
    treasureValueRare: limitSchema.default(
      marketConfigLimits.treasureValueRare,
    ),
    treasureValueEpic: limitSchema.default(
      marketConfigLimits.treasureValueEpic,
    ),
    treasureValueLegendary: limitSchema.default(
      marketConfigLimits.treasureValueLegendary,
    ),
    boosterPrice: limitSchema.default(marketConfigLimits.boosterPrice),
    boosterCardCount: limitSchema.default(marketConfigLimits.boosterCardCount),
    boosterSalePrice: limitSchema.default(marketConfigLimits.boosterSalePrice),
    boosterChanceCommon: limitSchema.default(
      marketConfigLimits.boosterChanceCommon,
    ),
    boosterChanceUncommon: limitSchema.default(
      marketConfigLimits.boosterChanceUncommon,
    ),
    boosterChanceRare: limitSchema.default(
      marketConfigLimits.boosterChanceRare,
    ),
    boosterChanceEpic: limitSchema.default(
      marketConfigLimits.boosterChanceEpic,
    ),
    boosterChanceLegendary: limitSchema.default(
      marketConfigLimits.boosterChanceLegendary,
    ),
    vaultExpansionSlots: limitSchema.default(
      marketConfigLimits.vaultExpansionSlots,
    ),
    vaultExpansionBasePrice: limitSchema.default(
      marketConfigLimits.vaultExpansionBasePrice,
    ),
    deckSlotExpansionSlots: limitSchema.default(
      marketConfigLimits.deckSlotExpansionSlots,
    ),
    deckSlotExpansionBasePrice: limitSchema.default(
      marketConfigLimits.deckSlotExpansionBasePrice,
    ),
    tcgFolderExpansionSlots: limitSchema.default(
      marketConfigLimits.tcgFolderExpansionSlots,
    ),
    tcgFolderExpansionBasePrice: limitSchema.default(
      marketConfigLimits.tcgFolderExpansionBasePrice,
    ),
    purseExpansionPricePercent: limitSchema.default(
      marketConfigLimits.purseExpansionPricePercent,
    ),
    vaultGoldExpansionPricePercent: limitSchema.default(
      marketConfigLimits.vaultGoldExpansionPricePercent,
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
        // FEAT-16: as 5 chances do booster não somam 1000.
        'sumMismatch',
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
