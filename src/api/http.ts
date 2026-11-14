import { z } from 'zod'

/** Envelope de erro do backend (CONTRATO §1.4). */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>

/**
 * Erro esperado do backend (CONTRATO §1.4, spec D-01): a UI decide o
 * comportamento pelo `code` e mostra `message` (pt-BR) — nunca vira exceção
 * visível na tela.
 */
export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/**
 * GET em `path`, relativo a `VITE_API_URL` (spec D-10; vazio = mesma origem).
 * Resposta ok → corpo devolvido como `unknown` (o chamador valida com o
 * schema do contrato, D-14). Erro no formato §1.4 → lança `ApiError`.
 * Qualquer outra falha (rede, corpo fora do envelope) → `Error` genérico.
 */
export async function getJson(path: string): Promise<unknown> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(`${base}${path}`)
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined)
    const envelope = errorEnvelopeSchema.safeParse(body)
    if (envelope.success) {
      throw new ApiError(envelope.data.error.code, envelope.data.error.message)
    }
    throw new Error(
      `Resposta de erro fora do contrato (§1.4): HTTP ${response.status}`,
    )
  }
  return response.json()
}
