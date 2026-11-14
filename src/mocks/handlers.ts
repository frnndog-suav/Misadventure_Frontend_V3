import { http, HttpResponse, type RequestHandler } from 'msw'
import { healthFixture } from './fixtures'

/**
 * Handlers do MSW: respondem só fixtures do contrato (Princípio 3).
 * O path `*\/health` casa tanto a chamada relativa no dev (VITE_API_URL
 * vazio, mesma origem) quanto a absoluta nos testes em Node.
 */
export const handlers: RequestHandler[] = [
  http.get('*/health', () => HttpResponse.json(healthFixture)),
]
