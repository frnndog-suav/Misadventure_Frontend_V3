import type { HealthResponse } from '../api/health'
import type { ErrorEnvelope } from '../api/http'

/**
 * Fixtures dos cenários de validação do CONTRATO §3 FEAT-01 (v0.4).
 * Só valores prontos do contrato — nenhuma regra (Princípio 3).
 */

/** Cenário de sucesso do GET /health. */
export const healthFixture: HealthResponse = {
  status: 'ok',
  contractVersion: '0.4',
}

/** Falha inesperada no servidor: 500 INTERNAL_ERROR (CONTRATO §1.4/§4). */
export const internalErrorFixture: ErrorEnvelope = {
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Erro inesperado no servidor. Tente novamente.',
  },
}
