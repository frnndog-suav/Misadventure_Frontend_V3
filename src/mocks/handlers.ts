import { http, HttpResponse, type RequestHandler } from 'msw'
import {
  healthFixture,
  labConfigDefaultsFixture,
  labConfigUpdatedFixture,
} from './fixtures'

/**
 * Handlers do MSW: respondem só fixtures do contrato (Princípio 3) — a
 * resposta é fixa e não depende do pedido; os testes trocam o handler por
 * cenário. O path `*\/...` casa tanto a chamada relativa no dev (VITE_API_URL
 * vazio, mesma origem) quanto a absoluta nos testes em Node.
 */
export const handlers: RequestHandler[] = [
  http.get('*/health', () => HttpResponse.json(healthFixture)),
  http.get('*/lab/config', () => HttpResponse.json(labConfigDefaultsFixture)),
  http.patch('*/lab/config', () => HttpResponse.json(labConfigUpdatedFixture)),
  http.post('*/lab/config/reset', () =>
    HttpResponse.json(labConfigDefaultsFixture),
  ),
]
