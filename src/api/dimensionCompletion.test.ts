import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../mocks/handlers'
import { combatResultSchema } from './combat'
import { contentInvalidDetailsSchema } from './editor'
import { requestJson } from './http'
import { pendingRewardSchema } from './randomEvents'
import { cardSchema } from './catalog'
import {
  actionNotAllowedDetailsSchema,
  partySchema,
  partySummarySchema,
} from './parties'
import { partyInSessionFixture } from '../mocks/partyFixtures'
import { testDimensionFixture } from '../mocks/catalogFixtures'
import { labConfigSchema } from './labConfig'
import { labConfigDefaultsFixture } from '../mocks/fixtures'

const server = setupServer(...handlers)
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

describe('FEAT-19', () => {
  it('REQ-90: preenche os valores de Pico em configuração legada', () => {
    const values = { ...labConfigDefaultsFixture.values }
    Reflect.deleteProperty(values, 'bossPeakGain')
    Reflect.deleteProperty(values, 'dimensionCompletionPeakGain')
    expect(
      labConfigSchema.parse({ ...labConfigDefaultsFixture, values }).values,
    ).toMatchObject({ bossPeakGain: 15, dimensionCompletionPeakGain: 25 })
  })

  it('REQ-91: preserva a configuração da conclusão no catálogo', () => {
    expect(cardSchema.parse(testDimensionFixture)).toMatchObject({
      completion: { zoneTitle: 'Mina Velha', finalBoss: null },
    })
  })

  it('REQ-91 e REQ-92: entrega o Fragmento na área de conclusão', async () => {
    const party = partyInSessionFixture
    const member = party.members[0]
    const item = cardSchema.parse(
      await requestJson('GET', '/catalog/cards/fixture.shard'),
    )
    expect(item).toMatchObject({ completionItem: true })
    const updated = partySchema.parse(
      await requestJson(
        'POST',
        `/lab/parties/${party.id}/members/${member.id}/grants`,
        { type: 'card', cardId: 'fixture.shard', quantity: 3 },
      ),
    )
    expect(updated.members[0].player).toMatchObject({
      inventory: member.player.inventory,
      completionItems: [{ cardId: 'fixture.shard', quantity: 3 }],
    })
  })

  it('REQ-93 e REQ-95: envia a conclusão e lê o prêmio e a próxima dimensão', async () => {
    const party = partySchema.parse(
      await requestJson('POST', '/parties/party-conclusao/actions', {
        type: 'completeDimension',
      }),
    )
    expect(party.lastDimensionCompletion).toMatchObject({
      members: [{ peakDelta: 25, gold: 100 }],
      next: {
        type: 'nextDimension',
        dimensionCardId: 'fixture.next-dimension',
      },
    })
    expect(party.members[0].player.completionItems).toEqual([])
    const reopened = partySchema.parse(
      await requestJson('GET', '/parties/party-dimensao-concluida'),
    )
    expect(reopened.lastDimensionCompletion).toEqual(
      party.lastDimensionCompletion,
    )
    await expect(
      requestJson('POST', '/parties/party-dimensao-concluida/actions', {
        type: 'completeDimension',
      }),
    ).rejects.toMatchObject({
      code: 'ACTION_NOT_ALLOWED',
      details: { reason: 'noCompletion' },
    })
    for (const reason of [
      'noCompletion',
      'notCompletionZone',
      'completionRequirementNotMet',
    ]) {
      expect(actionNotAllowedDetailsSchema.parse({ reason })).toEqual({
        reason,
      })
    }
  })

  it('REQ-94: projeta o chefe final no schema de combate', async () => {
    const party = partySchema.parse(
      await requestJson('POST', '/parties/party-chefe-final/actions', {
        type: 'completeDimension',
      }),
    )
    expect(party.combat).toMatchObject({
      finalBoss: true,
      card: { title: 'Guardião da Mina', enemies: [{ enemyCategory: 'boss' }] },
      escape: { unavailableReason: 'noEscape' },
    })
    expect(party.lastDimensionCompletion).toBeNull()
  })

  it('REQ-96: anuncia o save congelado e devolve PARTY_FROZEN ao abrir', async () => {
    const summaries = partySummarySchema
      .array()
      .parse(await requestJson('GET', '/parties'))
    expect(summaries).toContainEqual(
      expect.objectContaining({ id: 'party-congelado', status: 'frozen' }),
    )
    await expect(
      requestJson('POST', '/parties/party-congelado/session'),
    ).rejects.toMatchObject({
      code: 'PARTY_FROZEN',
      message: 'Este save está congelado até o lançamento da próxima dimensão.',
    })
  })

  it('REQ-91: preserva o caminho e a mensagem do editor', () => {
    const fields = [
      {
        path: 'completion.requirement.0.cardId',
        message: 'Selecione um item de conclusão.',
      },
    ]
    expect(contentInvalidDetailsSchema.parse({ fields })).toEqual({ fields })
  })

  it('REQ-94 e REQ-95: lê o resultado do chefe e o prêmio pendente', () => {
    const member = partyInSessionFixture.members[0]
    expect(
      combatResultSchema.parse({
        combatId: 'boss-combat',
        cardId: testDimensionFixture.id,
        memberId: member.id,
        resolution: 'victory',
        cause: 'enemiesDefeated',
        playerDown: false,
        peakDelta: 15,
        finalBoss: true,
      }),
    ).toMatchObject({ finalBoss: true, peakDelta: 15 })
    const source = {
      type: 'grandPrize',
      dimensionCardId: testDimensionFixture.id,
    }
    expect(
      pendingRewardSchema.parse({
        id: 'unclaimed-blade',
        memberId: member.id,
        cardId: 'fixture.blade-of-dusk',
        origin: { type: 'fixed' },
        source,
        destination: 'inventory',
        discardOptions: [],
        decisionDeadlineAt: null,
      }),
    ).toMatchObject({ source })
  })

  it('REQ-92 a REQ-96: lê ação, itens, resumo e estado congelado', () => {
    const base = structuredClone(partyInSessionFixture)
    const member = base.members[0]
    const completion = {
      completedDimensionCardId: 'fixture.test-dimension',
      completedDimensionName: 'Dimensão de Teste',
      completedByMemberId: member.id,
      finalBossDefeated: false,
      members: [{ memberId: member.id, peakDelta: 25, gold: 100, cards: [] }],
      next: { type: 'frozen' },
      completedAt: base.savedAt,
    }
    expect(
      partySchema.parse({
        ...base,
        status: 'frozen',
        lastDimensionCompletion: completion,
        members: [
          {
            ...member,
            player: {
              ...member.player,
              availableActions: ['completeDimension', 'endTurn'],
              completionItems: [{ cardId: 'fixture.shard', quantity: 3 }],
            },
          },
        ],
      }),
    ).toMatchObject({
      status: 'frozen',
      lastDimensionCompletion: completion,
      members: [
        {
          player: {
            completionItems: [{ cardId: 'fixture.shard', quantity: 3 }],
          },
        },
      ],
    })
  })
})
