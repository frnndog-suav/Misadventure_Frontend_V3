import type { RequestHandler } from 'msw'

/**
 * Handlers do MSW: respondem só fixtures do contrato (Princípio 3).
 * Nenhum endpoint no contrato ainda — a seção da FEAT-01 é definida
 * com /contrato depois da T-03.
 */
export const handlers: RequestHandler[] = []
