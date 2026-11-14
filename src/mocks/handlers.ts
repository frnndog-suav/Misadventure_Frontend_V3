import { http, HttpResponse, type RequestHandler } from 'msw'
import { cardTypeSchema } from '../api/catalog'
import {
  catalogQueryInvalidFixture,
  collectionNotFoundFixture,
  collectionsFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
} from './catalogFixtures'
import {
  healthFixture,
  labConfigDefaultsFixture,
  labConfigUpdatedFixture,
} from './fixtures'

/**
 * GET /catalog/collections/:collectionId/cards: tabela de cenários do
 * contrato — escolhe a resposta pronta pelo pedido, sem filtrar nem calcular
 * (decisão do autor na T-11).
 */
function catalogCardsScenario(
  collectionId: string,
  type: string | null,
): Response {
  if (collectionId !== 'fixture') {
    return HttpResponse.json(collectionNotFoundFixture, { status: 404 })
  }
  if (type === null) return HttpResponse.json(fixtureCardsFixture)
  const cardType = cardTypeSchema.safeParse(type)
  if (cardType.success) {
    return HttpResponse.json(fixtureCardsByTypeFixture[cardType.data])
  }
  return HttpResponse.json(catalogQueryInvalidFixture, { status: 400 })
}

/**
 * Handlers do MSW: respondem só fixtures do contrato (Princípio 3) — a
 * resposta é fixa (o catálogo de cartas escolhe a fixture do cenário pelo
 * pedido, sem calcular); os testes trocam o handler por cenário. O path
 * `*\/...` casa tanto a chamada relativa no dev (VITE_API_URL vazio, mesma
 * origem) quanto a absoluta nos testes em Node.
 */
export const handlers: RequestHandler[] = [
  http.get('*/health', () => HttpResponse.json(healthFixture)),
  http.get('*/lab/config', () => HttpResponse.json(labConfigDefaultsFixture)),
  http.patch('*/lab/config', () => HttpResponse.json(labConfigUpdatedFixture)),
  http.post('*/lab/config/reset', () =>
    HttpResponse.json(labConfigDefaultsFixture),
  ),
  http.get('*/catalog/collections', () =>
    HttpResponse.json(collectionsFixture),
  ),
  http.get('*/catalog/collections/:collectionId/cards', ({ params, request }) =>
    catalogCardsScenario(
      String(params.collectionId),
      new URL(request.url).searchParams.get('type'),
    ),
  ),
]
