import type { Party, PartyInvalidDetails, PartySummary } from '../api/parties'

/**
 * Fixtures dos cenários do CONTRATO §3 FEAT-05 (v0.14). `id` e datas são
 * gerados pelo backend; aqui são valores fixos de exemplo (D-32). Só valores
 * prontos — nenhuma regra (Princípio 3).
 */

const partyId = 'party-os-teimosos'
const member = {
  id: 'member-lia',
  characterName: 'Lia',
  kind: 'human',
  isHost: true,
} as const

/** 201 de POST /parties com "Os Teimosos" / "Lia". */
export const partyCreatedFixture: Party = {
  id: partyId,
  name: 'Os Teimosos',
  status: 'idle',
  members: [member],
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
