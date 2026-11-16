import type {
  DimensionInvalidDetails,
  Party,
  PartyInvalidDetails,
  PartySummary,
} from '../api/parties'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-05 (v0.14) e FEAT-06 (v0.21).
 * `id`, datas, mão e mapa são gerados (e sorteados) pelo backend; aqui são
 * valores fixos de exemplo que respeitam as invariantes do cenário (D-32,
 * D-48). Só valores prontos — nenhuma regra (Princípio 3).
 */

const partyId = 'party-os-teimosos'
const strength = 'fixture.strength-basic'
const endurance = 'fixture.endurance-basic'

const member: Party['members'][number] = {
  id: 'member-lia',
  characterName: 'Lia',
  kind: 'human',
  isHost: true,
  player: {
    playerClasses: [{ playerClass: 'warrior', deckLockMet: true }],
    gold: 10,
    baseHealth: 20,
    maxHealth: 22,
    health: 22,
    peak: 10,
    vigor: 10,
    modifiers: {
      attack: 6,
      defense: 5,
      accuracy: 45,
      evasion: 15,
      celerity: 8,
      piercing: 0,
      reflection: 0,
    },
    hand: [
      strength,
      endurance,
      strength,
      strength,
      endurance,
      endurance,
      strength,
    ],
    attributeDeckCount: 53,
    attributeDiscardPileCount: 0,
    zoneId: 'fixture.gray-harbor',
    respawnZoneId: 'fixture.gray-harbor',
  },
}

/** Mapa de exemplo: a cidade em (0, 0); as 4 zonas ligadas por 3 travessias. */
const dimension: Party['dimension'] = {
  dimensionCardId: 'fixture.test-dimension',
  startingCityZoneId: 'fixture.gray-harbor',
  map: {
    zones: [
      {
        zoneId: 'fixture.gray-harbor',
        x: 0,
        y: 0,
        arrows: ['north', 'east', 'south', 'west'],
      },
      {
        zoneId: 'fixture.whispering-grove',
        x: 1,
        y: 0,
        arrows: ['east', 'west'],
      },
      { zoneId: 'fixture.stone-bend', x: 0, y: 1, arrows: ['north', 'east'] },
      { zoneId: 'fixture.old-mine', x: 1, y: 1, arrows: ['west'] },
    ],
    crossings: [
      { zoneIds: ['fixture.gray-harbor', 'fixture.stone-bend'] },
      { zoneIds: ['fixture.gray-harbor', 'fixture.whispering-grove'] },
      { zoneIds: ['fixture.old-mine', 'fixture.stone-bend'] },
    ],
  },
}

/** 201 de POST /parties com "Os Teimosos" / "Lia" / `warrior`. */
export const partyCreatedFixture: Party = {
  id: partyId,
  name: 'Os Teimosos',
  status: 'idle',
  members: [member],
  dimension,
  turnOrder: [member.id],
  createdAt: '2026-11-14T21:30:00.000Z',
  savedAt: '2026-11-14T21:30:00.000Z',
}

/** 200 de POST …/session (Continuar). */
export const partyInSessionFixture: Party = {
  ...partyCreatedFixture,
  status: 'inSession',
}

/** 200 de POST …/session/end (grava o save e deixa `idle`). */
export const partyIdleFixture: Party = {
  ...partyCreatedFixture,
  savedAt: '2026-11-14T22:05:00.000Z',
}

/** 200 de GET /parties com o grupo criado. */
export const partiesFixture: PartySummary[] = [
  {
    id: partyId,
    name: 'Os Teimosos',
    status: 'idle',
    characterNames: ['Lia'],
    createdAt: '2026-11-14T21:30:00.000Z',
    savedAt: '2026-11-14T21:30:00.000Z',
  },
]

interface PartyInvalidEnvelope {
  error: {
    code: 'PARTY_INVALID'
    message: string
    details: PartyInvalidDetails
  }
}

/** 400 de POST /parties com nome em branco e personagem longo demais. */
export const partyInvalidFieldsFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: {
      fields: [
        { field: 'name', reason: 'blank' },
        { field: 'characterName', reason: 'tooLong' },
      ],
    },
  },
}

/** 400 de POST /parties "Solo" com `minPlayers = 2` no laboratório. */
export const partyBelowMinPlayersFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'members', reason: 'belowMinPlayers' }] },
  },
}

/** 400 de POST /parties sem `playerClass`. */
export const partyClassRequiredFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'playerClass', reason: 'required' }] },
  },
}

/** 400 de POST /parties com `playerClass: "mage"` (sem classe publicada). */
export const partyUnknownClassFixture: PartyInvalidEnvelope = {
  error: {
    code: 'PARTY_INVALID',
    message: 'Dados do grupo inválidos.',
    details: { fields: [{ field: 'playerClass', reason: 'unknownClass' }] },
  },
}

/**
 * 409 DIMENSION_INVALID. Sem cenário no contrato (a `fixture` é válida); os
 * problemas são exemplos com os textos do `validate-dimension` (FEAT-31),
 * usados só nos testes que trocam o handler.
 */
export const dimensionInvalidFixture: {
  error: {
    code: 'DIMENSION_INVALID'
    message: string
    details: DimensionInvalidDetails
  }
} = {
  error: {
    code: 'DIMENSION_INVALID',
    message:
      'Não foi possível preparar a dimensão. Avise o designer da coleção.',
    details: {
      dimensionCardId: null,
      problems: ['A coleção precisa de pelo menos 1 zona Urbana publicada.'],
    },
  },
}

/** 404 de grupo inexistente ou abandonado. */
export const partyNotFoundFixture = {
  error: { code: 'PARTY_NOT_FOUND', message: 'Grupo não encontrado.' },
} as const

/** 409 de encerrar sessão num grupo sem sessão. */
export const partySessionNotActiveFixture = {
  error: {
    code: 'PARTY_SESSION_NOT_ACTIVE',
    message: 'Não há sessão em andamento neste grupo.',
  },
} as const
