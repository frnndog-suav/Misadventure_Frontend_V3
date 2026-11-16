import type { Card } from '../api/catalog'
import type {
  ClassInput,
  CollectionExport,
  ContentInvalidDetails,
  DimensionValidation,
  EditorCard,
  EditorCardSummary,
  EditorClass,
  EditorClassSummary,
  EditorCollection,
  EditorCollectionSummary,
  ImportResult,
} from '../api/editor'
import type { ErrorEnvelope } from '../api/http'
import { fixtureCardsFixture } from './catalogFixtures'
import { rogueClassFixture, warriorClassFixture } from './classFixtures'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-31 (v0.22). Valores prontos,
 * nenhuma regra (Princípio 3). A coleção `fixture` reaproveita as 6 cartas da
 * FEAT-04 (todas `published`).
 */

const zeroCardCounts = {
  zone: 0,
  attribute: 0,
  equipment: 0,
  item: 0,
  randomEvent: 0,
  combatEvent: 0,
  dimension: 0,
}

const zeroRarityCounts = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
}

/** GET /lab/content/collections. */
export const editorCollectionsFixture: EditorCollectionSummary[] = [
  {
    id: 'fixture',
    name: 'Coleção de Teste',
    description: '',
    publishedCount: 12,
    draftCount: 0,
  },
]

/** GET /lab/content/collections/fixture. */
export const fixtureCollectionFixture: EditorCollection = {
  ...editorCollectionsFixture[0],
  // Contagens da FEAT-06 (CONTRATO v0.21); raridades das 5 cartas que têm
  // raridade (3 atributos e o item comuns, o equipamento raro).
  cardCounts: {
    zone: 4,
    attribute: 3,
    equipment: 1,
    item: 1,
    randomEvent: 1,
    combatEvent: 1,
    dimension: 1,
  },
  rarityCounts: { ...zeroRarityCounts, common: 4, rare: 1 },
  tags: ['duas mãos', 'espada', 'poção'],
}

/** 201 de POST /lab/content/collections com "bosque". */
export const bosqueCollectionFixture: EditorCollection = {
  id: 'bosque',
  name: 'Bosque Sombrio',
  description: 'Coleção de teste do editor.',
  publishedCount: 0,
  draftCount: 0,
  cardCounts: zeroCardCounts,
  rarityCounts: zeroRarityCounts,
  tags: [],
}

/** 200 de PATCH /lab/content/collections/bosque com "Bosque Antigo". */
export const bosqueRenamedFixture: EditorCollection = {
  ...bosqueCollectionFixture,
  name: 'Bosque Antigo',
}

interface ContentFieldsEnvelope {
  error: {
    code: 'CONTENT_INVALID' | 'CONTENT_ID_TAKEN'
    message: string
    details: ContentInvalidDetails
  }
}

function contentInvalid(
  fields: ContentInvalidDetails['fields'],
): ContentFieldsEnvelope {
  return {
    error: {
      code: 'CONTENT_INVALID',
      message: 'Conteúdo inválido.',
      details: { fields },
    },
  }
}

function idTaken(path: string, message: string): ContentFieldsEnvelope {
  return {
    error: {
      code: 'CONTENT_ID_TAKEN',
      message: 'Este identificador já está em uso.',
      details: { fields: [{ path, message }] },
    },
  }
}

/** 409 ao criar uma coleção com id já usado. */
export const collectionIdTakenFixture = idTaken(
  'id',
  'Já existe uma coleção com este identificador.',
)

/** 400 de POST /lab/content/collections com "Bosque X" e nome em branco. */
export const collectionInvalidFixture = contentInvalid([
  { path: 'id', message: 'Use só letras minúsculas, números e hífens.' },
  { path: 'name', message: 'Informe o nome.' },
])

/** 400 de POST …/bosque/cards com "forca-sorte" (2 atributos numa básica). */
export const forcaSorteInvalidFixture = contentInvalid([
  { path: 'attributes', message: 'Carta básica tem exatamente 1 atributo.' },
])

/** 409 ao salvar uma carta com slug já usado (formato do contrato; sem cenário). */
export const cardIdTakenFixture = idTaken(
  'slug',
  'Já existe uma carta com este identificador.',
)

/** 400 de GET …/cards?type=monster. */
export const unknownCardTypeFixture = contentInvalid([
  { path: 'type', message: 'Tipo de carta desconhecido.' },
])

/** 409 de import sem `replace` com a coleção já existente. */
export const importIdTakenFixture = idTaken(
  'collection.id',
  'Já existe uma coleção com este identificador.',
)

/** 400 de POST /lab/content/import com `{}`. */
export const importInvalidFixture = contentInvalid([
  { path: 'formatVersion', message: 'Versão do arquivo não suportada.' },
])

/** 409 de PUT com outro slug numa carta publicada. */
export const contentLockedFixture: ErrorEnvelope = {
  error: {
    code: 'CONTENT_LOCKED',
    message: 'O identificador de uma carta publicada não pode mudar.',
  },
}

export const cardNotFoundFixture: ErrorEnvelope = {
  error: { code: 'CARD_NOT_FOUND', message: 'Carta não encontrada.' },
}

function forca(slug: string, name: string): Card {
  return {
    type: 'attribute',
    id: `bosque.${slug}`,
    collectionId: 'bosque',
    name,
    flavorText: null,
    rarity: 'common',
    attributeKind: 'basic',
    attributes: ['strength'],
    effects: [],
  }
}

/** 201 de POST …/bosque/cards com "forca". */
export const forcaDraftFixture: EditorCard = {
  status: 'draft',
  card: forca('forca', 'Força'),
}

/** 200 de PUT bosque.forca com "slug": "forca-bruta" (renomeia). */
export const forcaBrutaDraftFixture: EditorCard = {
  status: 'draft',
  card: forca('forca-bruta', 'Força'),
}

/** 200 de POST bosque.forca-bruta/publish. */
export const forcaBrutaPublishedFixture: EditorCard = {
  status: 'published',
  card: forca('forca-bruta', 'Força'),
}

/** 200 de PUT na publicada com "name": "Força Bruta" (continua publicada). */
export const forcaBrutaRenamedFixture: EditorCard = {
  status: 'published',
  card: forca('forca-bruta', 'Força Bruta'),
}

/** 201 de POST bosque.forca-bruta/duplicate. */
export const forcaBrutaCopyFixture: EditorCard = {
  status: 'draft',
  card: forca('forca-bruta-copia', 'Força Bruta'),
}

/** As 12 cartas da `fixture`, publicadas. */
export const fixtureEditorCardsFixture: EditorCard[] = fixtureCardsFixture.map(
  (card) => ({ status: 'published', card }),
)

function summary({ status, card }: EditorCard): EditorCardSummary {
  return {
    id: card.id,
    type: card.type,
    name: 'name' in card ? card.name : card.title,
    status,
  }
}

/** GET …/fixture/cards sem filtro. */
export const fixtureCardSummariesFixture: EditorCardSummary[] =
  fixtureEditorCardsFixture.map(summary)

/** GET …/bosque/cards?status=draft depois de duplicar. */
export const bosqueCardsDraftFixture: EditorCardSummary[] = [
  summary(forcaBrutaCopyFixture),
]

/** GET …/bosque/cards?q=bruta (e sem filtro) depois de duplicar. */
export const bosqueCardsSearchFixture: EditorCardSummary[] = [
  summary(forcaBrutaRenamedFixture),
  summary(forcaBrutaCopyFixture),
]

/** POST /lab/content/collections/fixture/validate-dimension (FEAT-06). */
export const fixtureDimensionFixture: DimensionValidation = {
  valid: true,
  problems: [],
}

/**
 * POST /lab/content/collections/bosque/validate-dimension (FEAT-06). O texto
 * da falta de Carta de Dimensão e a ordem são provisórios até o
 * `implementado (BE)` (D-52).
 */
export const bosqueDimensionFixture: DimensionValidation = {
  valid: false,
  problems: [
    'A coleção precisa de pelo menos 1 Carta de Dimensão publicada.',
    'A coleção precisa de pelo menos 1 zona Urbana publicada.',
  ],
}

/** GET /lab/content/collections/bosque/export com a forca-bruta publicada. */
export const bosqueExportFixture: CollectionExport = {
  formatVersion: 1,
  collection: {
    id: 'bosque',
    name: 'Bosque Antigo',
    description: 'Coleção de teste do editor.',
  },
  cards: [forcaBrutaRenamedFixture],
  classes: [],
}

/** GET /lab/content/collections/fixture/export (cartas e classes publicadas). */
export const fixtureExportFixture: CollectionExport = {
  formatVersion: 1,
  collection: { id: 'fixture', name: 'Coleção de Teste', description: '' },
  cards: fixtureEditorCardsFixture,
  classes: [
    { status: 'published', classDefinition: rogueClassFixture },
    { status: 'published', classDefinition: warriorClassFixture },
  ],
}

/** 201 de POST /lab/content/import com o export do `bosque`. */
export const importResultFixture: ImportResult = {
  collectionId: 'bosque',
  cardCount: 1,
  classCount: 0,
}

// Classes (CONTRATO §3 FEAT-06). `mage` segue o cenário; os campos que o
// contrato omite ("…") e os textos de `fields[].message` são provisórios até
// o `implementado (BE)` (D-52).

/** Corpo do cenário `POST …/bosque/classes` com `mage`. */
export const mageInput: ClassInput = {
  playerClass: 'mage',
  name: 'Mago',
  essentialAttributes: ['intelligence', 'spirit'],
  baseModifiers: {
    attack: 3,
    defense: 2,
    accuracy: 50,
    evasion: 15,
    celerity: 10,
    piercing: 0,
    reflection: 0,
  },
  starterDeck: [{ cardId: 'fixture.strength-basic', copies: 60 }],
}

/** 201 do cenário `POST …/bosque/classes` com `mage`. */
export const mageDraftFixture: EditorClass = {
  status: 'draft',
  classDefinition: { ...mageInput, collectionId: 'bosque' },
}

/** As classes da `fixture`, publicadas. */
export const fixtureEditorClassesFixture: EditorClass[] =
  fixtureExportFixture.classes

function classSummary(entry: EditorClass): EditorClassSummary {
  return {
    playerClass: entry.classDefinition.playerClass,
    name: entry.classDefinition.name,
    status: entry.status,
  }
}

/** GET /lab/content/collections/fixture/classes. */
export const fixtureClassSummariesFixture: EditorClassSummary[] =
  fixtureEditorClassesFixture.map(classSummary)

/** GET /lab/content/collections/bosque/classes, com o `mage` em rascunho. */
export const bosqueClassSummariesFixture: EditorClassSummary[] = [
  classSummary(mageDraftFixture),
]

/** 409 ao criar uma classe com `playerClass` já usado. */
export const classIdTakenFixture = idTaken(
  'playerClass',
  'Já existe uma classe com este identificador.',
)

/** 400 de POST /lab/content/classes/mage/publish (trava não cumprida). */
export const magePublishInvalidFixture = contentInvalid([
  {
    path: 'starterDeck',
    message: 'O deck pré-pronto não cumpre a trava da classe.',
  },
])

export const classNotFoundFixture: ErrorEnvelope = {
  error: { code: 'CLASS_NOT_FOUND', message: 'Classe não encontrada.' },
}

/** 409 de DELETE /lab/content/cards/fixture.dexterity-basic. */
export const contentReferencedFixture: ErrorEnvelope = {
  error: {
    code: 'CONTENT_REFERENCED',
    message:
      'Esta carta está no deck pré-pronto de uma classe e não pode ser apagada nem renomeada.',
  },
}
