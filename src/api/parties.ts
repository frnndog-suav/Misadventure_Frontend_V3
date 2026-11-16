import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import { modifierValuesSchema, playerClassSchema } from './catalog'
import type { PlayerClass } from './catalog'
import { ApiError, requestJson } from './http'

/**
 * Campanha solo (CONTRATO §3 FEAT-05) e preparação da partida (FEAT-06):
 * grupos (saves) e sessão. O frontend só envia intenções e mostra o estado
 * devolvido, com os valores já calculados (D-32, D-48); sem retry (D-16).
 */

export const partyStatusSchema = z.enum(['idle', 'inSession'])
export type PartyStatus = z.infer<typeof partyStatusSchema>

/**
 * POST /parties; os textos vão como digitados (o backend apara e valida).
 * `playerClass` ausente = nenhuma classe escolhida (o backend responde
 * `required`, REQ-29).
 */
export interface CreatePartyRequest {
  name: string
  characterName: string
  playerClass?: PlayerClass
}

const nonNegativeInt = z.number().int().min(0)

/** Direção na mesa (não da carta). `y` cresce para o sul. */
export const directionSchema = z.enum(['north', 'east', 'south', 'west'])
export type Direction = z.infer<typeof directionSchema>

/** README 3.5: zonas viradas para cima e travessias. */
export const partyMapSchema = z.object({
  zones: z.array(
    z.object({
      zoneId: z.string(),
      x: z.number().int(),
      y: z.number().int(),
      arrows: z.array(directionSchema),
    }),
  ),
  crossings: z.array(z.object({ zoneIds: z.tuple([z.string(), z.string()]) })),
})
export type PartyMap = z.infer<typeof partyMapSchema>

export const partyDimensionSchema = z.object({
  dimensionCardId: z.string(),
  startingCityZoneId: z.string(),
  map: partyMapSchema,
})
export type PartyDimension = z.infer<typeof partyDimensionSchema>

/** Estado do jogador na partida; tudo calculado pelo backend (§1.3). */
export const playerStateSchema = z.object({
  playerClasses: z.array(
    z.object({ playerClass: playerClassSchema, deckLockMet: z.boolean() }),
  ),
  gold: nonNegativeInt,
  baseHealth: nonNegativeInt,
  maxHealth: nonNegativeInt,
  health: nonNegativeInt,
  peak: nonNegativeInt,
  vigor: nonNegativeInt,
  modifiers: modifierValuesSchema,
  hand: z.array(z.string()),
  attributeDeckCount: nonNegativeInt,
  attributeDiscardPileCount: nonNegativeInt,
  zoneId: z.string(),
  respawnZoneId: z.string(),
})
export type PlayerState = z.infer<typeof playerStateSchema>

export const partyMemberSchema = z.object({
  id: z.string(),
  characterName: z.string(),
  kind: z.literal('human'),
  isHost: z.boolean(),
  player: playerStateSchema,
})
export type PartyMember = z.infer<typeof partyMemberSchema>

export const partySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: partyStatusSchema,
  members: z.array(partyMemberSchema),
  dimension: partyDimensionSchema,
  /** Ids de membro, do 1º ao último (README 11.2). */
  turnOrder: z.array(z.string()),
  createdAt: z.iso.datetime(),
  savedAt: z.iso.datetime(),
})
export type Party = z.infer<typeof partySchema>

export const partySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: partyStatusSchema,
  characterNames: z.array(z.string()),
  createdAt: z.iso.datetime(),
  savedAt: z.iso.datetime(),
})
export type PartySummary = z.infer<typeof partySummarySchema>

export const partyInvalidDetailsSchema = z.object({
  fields: z.array(
    z.object({
      field: z
        .enum(['name', 'characterName', 'playerClass', 'members'])
        .nullable(),
      reason: z.enum([
        'invalidBody',
        'required',
        'notString',
        'blank',
        'tooLong',
        'unknownClass',
        'belowMinPlayers',
      ]),
    }),
  ),
})
export type PartyInvalidDetails = z.infer<typeof partyInvalidDetailsSchema>

/** `400 PARTY_INVALID` com `details` já validado. */
export class PartyInvalidError extends ApiError {
  readonly fields: PartyInvalidDetails['fields']

  constructor(message: string, details: PartyInvalidDetails) {
    super('PARTY_INVALID', message, details)
    this.name = 'PartyInvalidError'
    this.fields = details.fields
  }
}

export const dimensionInvalidDetailsSchema = z.object({
  /** `null` quando não há Carta de Dimensão publicada. */
  dimensionCardId: z.string().nullable(),
  /** Textos pt-BR prontos (D-38, D-48). */
  problems: z.array(z.string()),
})
export type DimensionInvalidDetails = z.infer<
  typeof dimensionInvalidDetailsSchema
>

/** `409 DIMENSION_INVALID` com `details` já validado (REQ-29). */
export class DimensionInvalidError extends ApiError {
  readonly dimensionCardId: string | null
  readonly problems: string[]

  constructor(message: string, details: DimensionInvalidDetails) {
    super('DIMENSION_INVALID', message, details)
    this.name = 'DimensionInvalidError'
    this.dimensionCardId = details.dimensionCardId
    this.problems = details.problems
  }
}

export const partiesKey = ['parties'] as const

async function getParties(): Promise<PartySummary[]> {
  return z.array(partySummarySchema).parse(await requestJson('GET', '/parties'))
}

/** `details` de um erro esperado validado; fora do contrato → erro genérico. */
function parseDetails<T>(error: ApiError, schema: z.ZodType<T>): T {
  const details = schema.safeParse(error.details)
  if (!details.success) {
    throw new Error(`${error.code} com details fora do contrato`, {
      cause: error,
    })
  }
  return details.data
}

async function createParty(request: CreatePartyRequest): Promise<Party> {
  try {
    return partySchema.parse(await requestJson('POST', '/parties', request))
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PARTY_INVALID') {
      throw new PartyInvalidError(
        error.message,
        parseDetails(error, partyInvalidDetailsSchema),
      )
    }
    if (error instanceof ApiError && error.code === 'DIMENSION_INVALID') {
      throw new DimensionInvalidError(
        error.message,
        parseDetails(error, dimensionInvalidDetailsSchema),
      )
    }
    throw error
  }
}

function partyPath(partyId: string): string {
  return `/parties/${encodeURIComponent(partyId)}`
}

/** Saves do servidor, na ordem recebida. */
export function useParties(): UseQueryResult<PartySummary[], Error> {
  return useQuery({ queryKey: partiesKey, queryFn: getParties, retry: false })
}

/**
 * Cria o grupo de 1, já preparado; erro de campo vira `PartyInvalidError` e
 * dimensão inválida vira `DimensionInvalidError`.
 */
export function useCreateParty(): UseMutationResult<
  Party,
  Error,
  CreatePartyRequest
> {
  return useMutation({ mutationFn: createParty, retry: false })
}

/** Continuar: abre (ou mantém) a sessão do grupo. */
export function useStartSession(
  partyId: string,
): UseMutationResult<Party, Error, void> {
  return useMutation({
    mutationFn: async () =>
      partySchema.parse(
        await requestJson('POST', `${partyPath(partyId)}/session`),
      ),
    retry: false,
  })
}

/** Encerra a sessão; o sucesso invalida `useParties`. */
export function useEndSession(
  partyId: string,
): UseMutationResult<Party, Error, void> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      partySchema.parse(
        await requestJson('POST', `${partyPath(partyId)}/session/end`),
      ),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partiesKey }),
  })
}

/** Abandona o grupo (`204`); sucesso ou erro invalida `useParties`. */
export function useAbandonParty(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (partyId: string) => {
      await requestJson('DELETE', partyPath(partyId))
    },
    retry: false,
    onSettled: () => queryClient.invalidateQueries({ queryKey: partiesKey }),
  })
}
