import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { z } from 'zod'
import { getJson } from './http'

/**
 * GET /health (CONTRATO §3 FEAT-01): prova a ponte FE↔BE e informa a versão
 * do contrato que o backend implementa (§1.5).
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  contractVersion: z.string(),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

async function getHealth(): Promise<HealthResponse> {
  return healthResponseSchema.parse(await getJson('/health'))
}

/**
 * Estado da ponte com o servidor (REQ-01). Sem retry automático (D-16): o
 * erro aparece imediatamente na área de status.
 */
export function useHealth(): UseQueryResult<HealthResponse, Error> {
  return useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false })
}
