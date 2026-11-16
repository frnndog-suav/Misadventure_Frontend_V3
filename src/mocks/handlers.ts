import { http, HttpResponse, type RequestHandler } from 'msw'
import { cardTypeSchema } from '../api/catalog'
import {
  catalogCardNotFoundFixture,
  catalogQueryInvalidFixture,
  collectionNotFoundFixture,
  collectionsFixture,
  fixtureCardsByTypeFixture,
  fixtureCardsFixture,
} from './catalogFixtures'
import { classesFixture } from './classFixtures'
import type { EditorCard, EditorCollection } from '../api/editor'
import {
  bosqueCardsDraftFixture,
  bosqueCardsSearchFixture,
  bosqueCollectionFixture,
  bosqueExportFixture,
  bosqueRenamedFixture,
  cardNotFoundFixture,
  collectionIdTakenFixture,
  collectionInvalidFixture,
  contentLockedFixture,
  editorCollectionsFixture,
  fixtureCardSummariesFixture,
  fixtureCollectionFixture,
  fixtureDimensionFixture,
  fixtureEditorCardsFixture,
  fixtureExportFixture,
  forcaBrutaCopyFixture,
  forcaBrutaDraftFixture,
  forcaBrutaPublishedFixture,
  forcaBrutaRenamedFixture,
  forcaDraftFixture,
  forcaSorteInvalidFixture,
  importIdTakenFixture,
  importInvalidFixture,
  importResultFixture,
  unknownCardTypeFixture,
} from './editorFixtures'
import {
  healthFixture,
  labConfigDefaultsFixture,
  labConfigUpdatedFixture,
} from './fixtures'
import {
  partiesFixture,
  partyBelowMinPlayersFixture,
  partyClassRequiredFixture,
  partyCreatedFixture,
  partyIdleFixture,
  partyInSessionFixture,
  partyInvalidFieldsFixture,
  partyNotFoundFixture,
  partyUnknownClassFixture,
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
    // Cenários da FEAT-06: corpo sem classe e classe não publicada.
    if (body.name === 'Os Teimosos' && body.characterName === 'Lia') {
      if (!('playerClass' in body)) {
        return HttpResponse.json(partyClassRequiredFixture, { status: 400 })
      }
      if (body.playerClass === 'mage') {
        return HttpResponse.json(partyUnknownClassFixture, { status: 400 })
      }
    }
  }
  return HttpResponse.json(partyCreatedFixture, { status: 201 })
}

/** GET /catalog/cards/:cardId: as cartas da `fixture`; qualquer outra é 404. */
function catalogCardScenario(cardId: string): Response {
  const card = fixtureCardsFixture.find((entry) => entry.id === cardId)
  return card === undefined
    ? HttpResponse.json(catalogCardNotFoundFixture, { status: 404 })
    : HttpResponse.json(card)
}

/** Rotas de um grupo: o grupo de exemplo responde, qualquer outro é 404. */
function knownParty(partyId: unknown, ok: () => Response): Response {
  return partyId === partyCreatedFixture.id
    ? ok()
    : HttpResponse.json(partyNotFoundFixture, { status: 404 })
}

/** Lê o corpo JSON do pedido como `unknown` (inválido → `undefined`). */
async function jsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined)
}

function field(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null && key in body
    ? (body as Record<string, unknown>)[key]
    : undefined
}

const notFound = {
  collection: () =>
    HttpResponse.json(collectionNotFoundFixture, { status: 404 }),
  card: () => HttpResponse.json(cardNotFoundFixture, { status: 404 }),
}

/** Coleções que o editor conhece nos cenários (D-40). */
const editorCollections: Record<string, EditorCollection> = {
  fixture: fixtureCollectionFixture,
  bosque: bosqueRenamedFixture,
}

/** Cartas que o editor conhece nos cenários (D-40). */
const editorCards: Record<string, EditorCard> = Object.fromEntries(
  [
    ...fixtureEditorCardsFixture,
    forcaDraftFixture,
    forcaBrutaRenamedFixture,
    forcaBrutaCopyFixture,
  ].map((entry) => [entry.card.id, entry]),
)

/** POST /lab/content/collections: erro só nos corpos dos cenários. */
async function createCollectionScenario(request: Request): Promise<Response> {
  const id = field(await jsonBody(request), 'id')
  if (id === 'Bosque X') {
    return HttpResponse.json(collectionInvalidFixture, { status: 400 })
  }
  if (id === 'fixture') {
    return HttpResponse.json(collectionIdTakenFixture, { status: 409 })
  }
  return HttpResponse.json(bosqueCollectionFixture, { status: 201 })
}

/** GET …/:collectionId/cards: listas prontas pelo pedido, sem filtrar. */
function editorCardsScenario(collectionId: string, url: URL): Response {
  const type = url.searchParams.get('type')
  if (type !== null && !cardTypeSchema.safeParse(type).success) {
    return HttpResponse.json(unknownCardTypeFixture, { status: 400 })
  }
  if (collectionId === 'fixture') {
    return HttpResponse.json(fixtureCardSummariesFixture)
  }
  if (collectionId === 'bosque') {
    return HttpResponse.json(
      url.searchParams.get('status') === 'draft'
        ? bosqueCardsDraftFixture
        : bosqueCardsSearchFixture,
    )
  }
  return notFound.collection()
}

/** POST …/:collectionId/cards: "forca-sorte" é o cenário de erro. */
async function createCardScenario(
  collectionId: string,
  request: Request,
): Promise<Response> {
  if (!Object.hasOwn(editorCollections, collectionId))
    return notFound.collection()
  if (field(await jsonBody(request), 'slug') === 'forca-sorte') {
    return HttpResponse.json(forcaSorteInvalidFixture, { status: 400 })
  }
  return HttpResponse.json(forcaDraftFixture, { status: 201 })
}

/** PUT /lab/content/cards/:cardId: cenários de renomear e de publicada. */
async function saveCardScenario(
  cardId: string,
  request: Request,
): Promise<Response> {
  const current = editorCards[cardId]
  if (current === undefined) return notFound.card()
  const body = await jsonBody(request)
  if (cardId === 'bosque.forca')
    return HttpResponse.json(forcaBrutaDraftFixture)
  if (cardId === 'bosque.forca-bruta') {
    if (field(body, 'slug') === 'outra') {
      return HttpResponse.json(contentLockedFixture, { status: 409 })
    }
    return HttpResponse.json(
      field(body, 'name') === 'Força Bruta'
        ? forcaBrutaRenamedFixture
        : forcaBrutaPublishedFixture,
    )
  }
  return HttpResponse.json(current)
}

/** POST /lab/content/import: cenários do contrato pelo corpo e pelo `replace`. */
async function importScenario(request: Request): Promise<Response> {
  const body = await jsonBody(request)
  // Cenário do contrato: corpo `{}` (sem validar outros corpos).
  if (
    typeof body === 'object' &&
    body !== null &&
    Object.keys(body).length === 0
  ) {
    return HttpResponse.json(importInvalidFixture, { status: 400 })
  }
  const replace = new URL(request.url).searchParams.get('replace') === 'true'
  const collectionId = field(field(body, 'collection'), 'id')
  if (
    !replace &&
    typeof collectionId === 'string' &&
    Object.hasOwn(editorCollections, collectionId)
  ) {
    return HttpResponse.json(importIdTakenFixture, { status: 409 })
  }
  return HttpResponse.json(importResultFixture, { status: 201 })
}

function knownCollection(
  collectionId: unknown,
  ok: (id: string) => Response,
): Response {
  return typeof collectionId === 'string' &&
    Object.hasOwn(editorCollections, collectionId)
    ? ok(collectionId)
    : notFound.collection()
}

function knownCard(cardId: unknown, ok: (id: string) => Response): Response {
  return typeof cardId === 'string' && Object.hasOwn(editorCards, cardId)
    ? ok(cardId)
    : notFound.card()
}

/** Editor de conteúdo (FEAT-31): tabela de cenários, sem estado (D-29, D-40). */
const editorHandlers: RequestHandler[] = [
  http.get('*/lab/content/collections', () =>
    HttpResponse.json(editorCollectionsFixture),
  ),
  http.post('*/lab/content/collections', ({ request }) =>
    createCollectionScenario(request),
  ),
  http.get('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(editorCollections[id]),
    ),
  ),
  http.patch('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(editorCollections[id]),
    ),
  ),
  http.delete('*/lab/content/collections/:collectionId', ({ params }) =>
    knownCollection(
      params.collectionId,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ),
  http.post(
    '*/lab/content/collections/:collectionId/validate-dimension',
    ({ params }) =>
      knownCollection(params.collectionId, () =>
        HttpResponse.json(fixtureDimensionFixture),
      ),
  ),
  http.get('*/lab/content/collections/:collectionId/export', ({ params }) =>
    knownCollection(params.collectionId, (id) =>
      HttpResponse.json(
        id === 'fixture' ? fixtureExportFixture : bosqueExportFixture,
      ),
    ),
  ),
  http.post('*/lab/content/import', ({ request }) => importScenario(request)),
  http.get(
    '*/lab/content/collections/:collectionId/cards',
    ({ params, request }) =>
      editorCardsScenario(String(params.collectionId), new URL(request.url)),
  ),
  http.post(
    '*/lab/content/collections/:collectionId/cards',
    ({ params, request }) =>
      createCardScenario(String(params.collectionId), request),
  ),
  http.get('*/lab/content/cards/:cardId', ({ params }) =>
    knownCard(params.cardId, (id) => HttpResponse.json(editorCards[id])),
  ),
  http.put('*/lab/content/cards/:cardId', ({ params, request }) =>
    saveCardScenario(String(params.cardId), request),
  ),
  http.post('*/lab/content/cards/:cardId/publish', ({ params }) =>
    knownCard(params.cardId, (id) =>
      HttpResponse.json(
        id.startsWith('bosque.') ? forcaBrutaPublishedFixture : editorCards[id],
      ),
    ),
  ),
  http.post('*/lab/content/cards/:cardId/duplicate', ({ params }) =>
    knownCard(params.cardId, () =>
      HttpResponse.json(forcaBrutaCopyFixture, { status: 201 }),
    ),
  ),
  http.delete('*/lab/content/cards/:cardId', ({ params }) =>
    knownCard(params.cardId, () => new HttpResponse(null, { status: 204 })),
  ),
]

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
  http.get('*/catalog/cards/:cardId', ({ params }) =>
    catalogCardScenario(String(params.cardId)),
  ),
  http.get('*/catalog/classes', () => HttpResponse.json(classesFixture)),
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
  ...editorHandlers,
]
