import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { z } from 'zod'
import { ApiError, requestJson } from './http'
import { parseDetails, partySchema } from './parties'
import type { Party } from './parties'

/**
 * Doação do laboratório (CONTRATO §3 FEAT-10): carta ou ouro para um membro.
 * Não é ação do jogo; só existe no laboratório (D-07, D-58). Os números vão
 * como digitados: o backend valida (D-23).
 */

export type LabGrantRequest =
  | { type: 'card'; cardId: string; quantity: number }
  | { type: 'gold'; amount: number }

export interface LabGrantVariables {
  partyId: string
  memberId: string
  grant: LabGrantRequest
}

export const labGrantInvalidDetailsSchema = z.object({
  fields: z.array(
    z.object({
      field: z.string().nullable(),
      reason: z.enum([
        'invalidBody',
        'required',
        'notString',
        'unknownKey',
        'unknownGrantType',
        'notPositiveInteger',
        'notGrantable',
      ]),
    }),
  ),
})
export type LabGrantInvalidDetails = z.infer<
  typeof labGrantInvalidDetailsSchema
>

/** `400 LAB_GRANT_INVALID` com `details` já validado. */
export class LabGrantInvalidError extends ApiError {
  readonly fields: LabGrantInvalidDetails['fields']

  constructor(message: string, details: LabGrantInvalidDetails) {
    super('LAB_GRANT_INVALID', message, details)
    this.name = 'LabGrantInvalidError'
    this.fields = details.fields
  }
}

export const labGrantNoSpaceDetailsSchema = z.object({
  reason: z.enum(['inventoryFull', 'tcgFolderFull']),
})
export type LabGrantNoSpaceDetails = z.infer<
  typeof labGrantNoSpaceDetailsSchema
>

/** `409 LAB_GRANT_NO_SPACE` com `details` já validado; nada mudou no backend. */
export class LabGrantNoSpaceError extends ApiError {
  readonly reason: LabGrantNoSpaceDetails['reason']

  constructor(message: string, details: LabGrantNoSpaceDetails) {
    super('LAB_GRANT_NO_SPACE', message, details)
    this.name = 'LabGrantNoSpaceError'
    this.reason = details.reason
  }
}

async function grantToMember({
  partyId,
  memberId,
  grant,
}: LabGrantVariables): Promise<Party> {
  const path = `/lab/parties/${encodeURIComponent(partyId)}/members/${encodeURIComponent(memberId)}/grants`
  try {
    return partySchema.parse(await requestJson('POST', path, grant))
  } catch (error) {
    if (error instanceof ApiError && error.code === 'LAB_GRANT_INVALID') {
      throw new LabGrantInvalidError(
        error.message,
        parseDetails(error, labGrantInvalidDetailsSchema),
      )
    }
    if (error instanceof ApiError && error.code === 'LAB_GRANT_NO_SPACE') {
      throw new LabGrantNoSpaceError(
        error.message,
        parseDetails(error, labGrantNoSpaceDetailsSchema),
      )
    }
    throw error
  }
}

/**
 * Doa uma carta ou ouro a um membro e entrega o `Party` devolvido;
 * `LAB_GRANT_INVALID` e `LAB_GRANT_NO_SPACE` chegam com os detalhes validados,
 * os demais erros §1.4 como `ApiError`. Sem retry (D-16).
 */
export function useLabGrant(): UseMutationResult<
  Party,
  Error,
  LabGrantVariables
> {
  return useMutation({ mutationFn: grantToMember, retry: false })
}
