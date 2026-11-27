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
  /** `details` do envelope, ainda não validado (cada código tem o seu formato). */
  readonly details: unknown
  readonly status?: number

  constructor(
    code: string,
    message: string,
    details?: unknown,
    status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }
}

/** GET em `path`; veja `requestJson`. */
export function getJson(path: string): Promise<unknown> {
  return requestJson('GET', path)
}

/**
 * Pedido em `path`, relativo a `VITE_API_URL` (spec D-10; vazio = mesma
 * origem); `body`, quando há, vai como JSON. Resposta ok → corpo devolvido
 * como `unknown` (o chamador valida com o schema do contrato, D-14). Erro no
 * formato §1.4 → lança `ApiError`. Qualquer outra falha (rede, corpo fora do
 * envelope) → `Error` genérico. `204` (sem corpo) → `undefined`.
 */
export async function requestJson(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<unknown> {
  const base = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(
    `${base}${path}`,
    body === undefined
      ? { method }
      : {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
        },
  )
  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => undefined)
    const envelope = errorEnvelopeSchema.safeParse(errorBody)
    if (envelope.success) {
      const { code, message, details } = envelope.data.error
      throw new ApiError(code, message, details, response.status)
    }
    throw new Error(
      `Resposta de erro fora do contrato (§1.4): HTTP ${response.status}`,
    )
  }
  if (response.status === 204) return undefined
  return response.json()
}
