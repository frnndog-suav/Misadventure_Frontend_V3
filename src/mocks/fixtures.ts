import type { HealthResponse } from '../api/health'
import type { ErrorEnvelope } from '../api/http'
import type { LabConfig, LabConfigInvalidDetails } from '../api/labConfig'

/**
 * Fixtures dos cenários de validação do CONTRATO §3 (FEAT-01 v0.4, FEAT-03
 * v0.7). Só valores prontos do contrato — nenhuma regra (Princípio 3).
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

/** Rota inexistente ou laboratório desligado: 404 NOT_FOUND (FEAT-01, FEAT-03). */
export const notFoundFixture: ErrorEnvelope = {
  error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
}

/** GET /lab/config sem ajuste salvo (tabela Padrão / Mínimo–máximo). */
export const labConfigDefaultsFixture: LabConfig = {
  values: {
    minPlayers: 1,
    maxPlayers: 6,
    actionPointsPerTurn: 3,
    initialPeak: 10,
    initialVigor: 10,
    baseHealth: 20,
    initialGold: 10,
    initialHandSize: 7,
  },
  defaults: {
    minPlayers: 1,
    maxPlayers: 6,
    actionPointsPerTurn: 3,
    initialPeak: 10,
    initialVigor: 10,
    baseHealth: 20,
    initialGold: 10,
    initialHandSize: 7,
  },
  limits: {
    minPlayers: { min: 1, max: 6 },
    maxPlayers: { min: 1, max: 6 },
    actionPointsPerTurn: { min: 1, max: 10 },
    initialPeak: { min: 1, max: 1000 },
    initialVigor: { min: 0, max: 1000 },
    baseHealth: { min: 1, max: 1000 },
    initialGold: { min: 0, max: 100000 },
    initialHandSize: { min: 0, max: 60 },
  },
}

/** PATCH /lab/config com { actionPointsPerTurn: 4 }. */
export const labConfigUpdatedFixture: LabConfig = {
  ...labConfigDefaultsFixture,
  values: { ...labConfigDefaultsFixture.values, actionPointsPerTurn: 4 },
}

type LabConfigInvalidEnvelope = {
  error: {
    code: 'LAB_CONFIG_INVALID'
    message: string
    details: LabConfigInvalidDetails
  }
}

function labConfigInvalid(
  fields: LabConfigInvalidDetails['fields'],
): LabConfigInvalidEnvelope {
  return {
    error: {
      code: 'LAB_CONFIG_INVALID',
      message: 'Configuração do laboratório inválida.',
      details: { fields },
    },
  }
}

/** PATCH com { actionPointsPerTurn: 0, foo: 1 }. */
export const labConfigInvalidFixture = labConfigInvalid([
  { field: 'actionPointsPerTurn', reason: 'outOfRange' },
  { field: 'foo', reason: 'unknownKey' },
])

/** PATCH com { minPlayers: 5, maxPlayers: 3 }. */
export const labConfigMinAboveMaxFixture = labConfigInvalid([
  { field: 'minPlayers', reason: 'minAboveMax' },
  { field: 'maxPlayers', reason: 'minAboveMax' },
])

/** PATCH com { initialGold: 2.5 }. */
export const labConfigNotIntegerFixture = labConfigInvalid([
  { field: 'initialGold', reason: 'notInteger' },
])
