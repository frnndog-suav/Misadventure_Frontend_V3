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
 * Campanha solo (CONTRATO §3 FEAT-05): grupos (saves) e sessão. O frontend
 * só envia intenções e mostra o estado devolvido (D-32); sem retry (D-16).
 */

export const partyStatusSchema = z.enum(['idle', 'inSession'])
export type PartyStatus = z.infer<typeof partyStatusSchema>

/** POST /parties; os textos vão como digitados (o backend apara e valida). */
export interface CreatePartyRequest {
  name: string
  characterName: string
}

export const partyMemberSchema = z.object({
  id: z.string(),
  characterName: z.string(),
  kind: z.literal('human'),
  isHost: z.boolean(),
})
export type PartyMember = z.infer<typeof partyMemberSchema>

export const partySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: partyStatusSchema,
  members: z.array(partyMemberSchema),
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
      field: z.enum(['name', 'characterName', 'members']).nullable(),
      reason: z.enum([
        'invalidBody',
        'required',
        'notString',
        'blank',
        'tooLong',
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

export const partiesKey = ['parties'] as const

async function getParties(): Promise<PartySummary[]> {
  return z.array(partySummarySchema).parse(await requestJson('GET', '/parties'))
}

async function createParty(request: CreatePartyRequest): Promise<Party> {
  try {
    return partySchema.parse(await requestJson('POST', '/parties', request))
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PARTY_INVALID') {
      const details = partyInvalidDetailsSchema.safeParse(error.details)
      if (!details.success) {
        throw new Error('PARTY_INVALID com details fora do contrato', {
          cause: error,
        })
      }
      throw new PartyInvalidError(error.message, details.data)
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

/** Cria o grupo de 1; erro de campo vira `PartyInvalidError`. */
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
