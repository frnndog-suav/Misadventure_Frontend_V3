import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import { ApiError, requestJson } from './http'

/**
 * Laboratório (CONTRATO §3 FEAT-03): valores ajustáveis do Apêndice A, com
 * padrões e limites prontos do backend. O frontend não valida regra (D-23).
 */

const gameConfigInt = z.number().int()

/** Valores ajustáveis; cada FEAT seguinte acrescenta as suas chaves. */
export const gameConfigValuesSchema = z.object({
  minPlayers: gameConfigInt,
  maxPlayers: gameConfigInt,
  actionPointsPerTurn: gameConfigInt,
  initialPeak: gameConfigInt,
  initialVigor: gameConfigInt,
  baseHealth: gameConfigInt,
  initialGold: gameConfigInt,
  initialHandSize: gameConfigInt,
})

export type GameConfigValues = z.infer<typeof gameConfigValuesSchema>
export type GameConfigKey = keyof GameConfigValues

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
