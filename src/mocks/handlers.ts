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
import {
  partiesFixture,
  partyBelowMinPlayersFixture,
  partyCreatedFixture,
  partyIdleFixture,
  partyInSessionFixture,
  partyInvalidFieldsFixture,
  partyNotFoundFixture,
} from './partyFixtures'

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
 * POST /parties: tabela de cenários do contrato (D-32) — os corpos dos dois
 * cenários de erro devolvem a fixture de erro; qualquer outro, o grupo
 * criado de exemplo. Não valida nem guarda estado.
 */
async function createPartyScenario(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => undefined)
  if (
    typeof body === 'object' &&
    body !== null &&
    'name' in body &&
    'characterName' in body
  ) {
    if (
      body.name === '   ' &&
      body.characterName === 'Um nome com mais de vinte e quatro letras'
    ) {
      return HttpResponse.json(partyInvalidFieldsFixture, { status: 400 })
    }
    if (body.name === 'Solo' && body.characterName === 'Lia') {
      return HttpResponse.json(partyBelowMinPlayersFixture, { status: 400 })
    }
  }
  return HttpResponse.json(partyCreatedFixture, { status: 201 })
}

/** Rotas de um grupo: o grupo de exemplo responde, qualquer outro é 404. */
function knownParty(partyId: unknown, ok: () => Response): Response {
  return partyId === partyCreatedFixture.id
    ? ok()
    : HttpResponse.json(partyNotFoundFixture, { status: 404 })
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
  http.get('*/parties', () => HttpResponse.json(partiesFixture)),
  http.post('*/parties', ({ request }) => createPartyScenario(request)),
  http.post('*/parties/:partyId/session', ({ params }) =>
    knownParty(params.partyId, () => HttpResponse.json(partyInSessionFixture)),
  ),
  http.post('*/parties/:partyId/session/end', ({ params }) =>
    knownParty(params.partyId, () => HttpResponse.json(partyIdleFixture)),
  ),
  http.delete('*/parties/:partyId', ({ params }) =>
    knownParty(params.partyId, () => new HttpResponse(null, { status: 204 })),
  ),
]
