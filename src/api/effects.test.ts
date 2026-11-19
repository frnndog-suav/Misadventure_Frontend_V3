import { describe, expect, it } from 'vitest'
import {
  activationSchema,
  activatableEffectSchema,
  costSchema,
  durationSchema,
  effectSchema,
  playerStatusSchema,
  triggerSchema,
  zoneEffectSchema,
} from './effects'
import { cardSchema } from './catalog'
import { actionNotAllowedDetailsSchema, partySchema } from './parties'
import { healingPotionFixture } from '../mocks/catalogFixtures'
import { partyCreatedFixture } from '../mocks/partyFixtures'
import {
  partyEffectsReadyFixture,
  partyPotionActivatedFixture,
  partyTonicActivatedFixture,
} from '../mocks/effectFixtures'

const potionEffect = {
  text: 'Recupera 5 de vida.',
  trigger: null,
  cost: [{ kind: 'consumeSelf' }],
  activation: [{ kind: 'heal', amount: 5 }],
  duration: { kind: 'immediate' },
  mark: null,
}

const tonicStatus = {
  statusId: 'status-tonic',
  sourceCardId: 'fixture.strength-tonic',
  effectIndex: 0,
  text: '+3 de Ataque durante 2 vezes suas.',
  mark: 'buff',
  activation: [
    { kind: 'modifierFlat', changes: [{ modifier: 'attack', amount: 3 }] },
  ],
  duration: { kind: 'forOwnTurns', turns: 2 },
  remaining: 2,
}

describe('REQ-53: formato estruturado de efeitos do CONTRATO v0.52', () => {
  it('REQ-53: preserva todas as partes da poção no catálogo', () => {
    const card = { ...healingPotionFixture, effects: [potionEffect] }
    expect(effectSchema.parse(potionEffect)).toEqual(potionEffect)
    expect(cardSchema.parse(card)).toEqual(card)
  })

  it.each(['text', 'trigger', 'cost', 'activation', 'duration', 'mark'])(
    'REQ-53: rejeita efeito sem o campo obrigatório %s',
    (field) => {
      const input: Record<string, unknown> = { ...potionEffect }
      delete input[field]
      expect(effectSchema.safeParse(input).success).toBe(false)
    },
  )

  it('REQ-53: não aceita o RuleText antigo como efeito', () => {
    expect(
      effectSchema.safeParse({ text: 'Recupera 5 de vida.' }).success,
    ).toBe(false)
  })

  it('REQ-53: preserva uma variante modelada ainda não executada', () => {
    const input = {
      ...potionEffect,
      text: 'Pague 5 moedas: some 3 ao resultado do dado até o fim do evento.',
      cost: [{ kind: 'payGold', amount: 5 }],
      activation: [{ kind: 'diceResultModifier', amount: 3 }],
      duration: { kind: 'untilEventEnd' },
      mark: 'buff',
    }
    expect(effectSchema.parse(input)).toEqual(input)
  })

  it('REQ-53: zona e dimensão preservam polaridade no lugar de marca', () => {
    const input = {
      text: 'Ao entrar nesta zona, ganhe 1 moeda.',
      trigger: { kind: 'onEnterThisZone' },
      cost: [],
      activation: [{ kind: 'gainGold', amount: 1 }],
      duration: { kind: 'immediate' },
      polarity: 'positive',
    }
    expect(zoneEffectSchema.parse(input)).toEqual(input)
    expect(
      zoneEffectSchema.safeParse({ ...input, polarity: 'buff' }).success,
    ).toBe(false)
  })

  it('REQ-53: preserva filtros, fórmulas e listas aninhadas', () => {
    const trigger = {
      kind: 'onEnterZoneFilter',
      zoneTypes: ['forest'],
      excludeZoneTypes: [],
      locations: ['Bosque'],
      excludeLocations: [],
    }
    const cost = {
      kind: 'donateLife',
      amount: { base: 'halfHealth', multiplier: 1, minimum: 2 },
    }
    const duration = {
      kind: 'whileModifierComparison',
      left: ['defense', 'evasion'],
      op: 'gt',
      right: ['attack'],
      value: null,
    }
    expect(triggerSchema.parse(trigger)).toEqual(trigger)
    expect(costSchema.parse(cost)).toEqual(cost)
    expect(durationSchema.parse(duration)).toEqual(duration)
  })

  it('REQ-53: preserva os parâmetros de descarte de cartas da mão', () => {
    const input = {
      kind: 'discardFromHand',
      requirements: [{ attribute: 'strength', count: 1 }],
      excludeAttributes: [],
      constraint: 'none',
      random: false,
    }
    expect(costSchema.parse(input)).toEqual(input)
  })

  it.each([
    ['gatilho', () => triggerSchema.safeParse({ kind: 'unknown' })],
    ['custo', () => costSchema.safeParse({ kind: 'unknown' })],
    ['ativação', () => activationSchema.safeParse({ kind: 'unknown' })],
    ['duração', () => durationSchema.safeParse({ kind: 'unknown' })],
    [
      'parâmetro numérico',
      () => activationSchema.safeParse({ kind: 'heal', amount: '5' }),
    ],
    [
      'parâmetro obrigatório',
      () => durationSchema.safeParse({ kind: 'forOwnTurns' }),
    ],
    [
      'enum aninhado',
      () =>
        costSchema.safeParse({
          kind: 'spendVigor',
          amount: { base: 'unknown', multiplier: 1, minimum: 0 },
        }),
    ],
  ])('REQ-53: rejeita %s inválido', (_label, parse) => {
    expect(parse().success).toBe(false)
  })

  it('REQ-55: não decide a regra de consumível sem consumeSelf', () => {
    expect(
      cardSchema.safeParse({
        ...healingPotionFixture,
        effects: [{ ...potionEffect, cost: [] }],
      }).success,
    ).toBe(true)
  })
})

describe('REQ-54: estado autoritativo e motivos da ativação', () => {
  it.each(['statuses', 'activatableEffects'])(
    'REQ-54: rejeita Party sem o campo obrigatório player.%s',
    (field) => {
      const member = partyCreatedFixture.members[0]!
      const player: Record<string, unknown> = { ...member.player }
      delete player[field]
      expect(
        partySchema.safeParse({
          ...partyCreatedFixture,
          members: [{ ...member, player }],
        }).success,
      ).toBe(false)
    },
  )

  it.each([
    partyEffectsReadyFixture,
    partyPotionActivatedFixture,
    partyTonicActivatedFixture,
  ])('REQ-54: fixtures estáticas preservam o estado completo', (party) => {
    expect(partySchema.parse(party)).toEqual(party)
  })
  it('REQ-54: preserva o texto copiado e a contagem do status', () => {
    expect(playerStatusSchema.parse(tonicStatus)).toEqual(tonicStatus)
    expect(
      playerStatusSchema.parse({ ...tonicStatus, remaining: null }).remaining,
    ).toBeNull()
    expect(
      playerStatusSchema.safeParse({ ...tonicStatus, text: undefined }).success,
    ).toBe(false)
  })

  it.each([null, { count: 1, text: 'Escolha 1 carta de Força.' }])(
    'REQ-54: preserva handPayment recebido: %j',
    (handPayment) => {
      const input = {
        cardId: 'fixture.focus-amulet',
        effectIndex: 2,
        source: 'equipment',
        handPayment,
      }
      expect(activatableEffectSchema.parse(input)).toEqual(input)
    },
  )

  it('REQ-54: rejeita pagamento ausente, quantidade inválida e origem desconhecida', () => {
    const input = {
      cardId: 'fixture.focus-amulet',
      effectIndex: 2,
      source: 'equipment',
      handPayment: null,
    }
    expect(
      activatableEffectSchema.safeParse({ ...input, handPayment: undefined })
        .success,
    ).toBe(false)
    expect(
      activatableEffectSchema.safeParse({
        ...input,
        handPayment: { count: 0, text: 'Escolha.' },
      }).success,
    ).toBe(false)
    expect(
      activatableEffectSchema.safeParse({ ...input, source: 'vault' }).success,
    ).toBe(false)
  })

  it('REQ-54: Party preserva status, efeitos ativáveis e modificadores prontos', () => {
    const first = partyCreatedFixture.members[0]!
    const input = {
      ...partyCreatedFixture,
      turn: { ...partyCreatedFixture.turn, actionPoints: 0 },
      members: [
        {
          ...first,
          player: {
            ...first.player,
            statuses: [tonicStatus],
            activatableEffects: [
              {
                cardId: 'fixture.healing-potion',
                effectIndex: 0,
                source: 'inventory',
                handPayment: null,
              },
            ],
            availableActions: ['prepare', 'endTurn'],
            effectiveModifiers: {
              ...first.player.effectiveModifiers,
              attack: 9,
            },
          },
        },
      ],
    }
    expect(partySchema.parse(input)).toEqual(input)
  })

  it.each([
    'equipmentNotInUse',
    'effectNotFound',
    'notActivatable',
    'notActivatableYet',
    'notEnoughVigor',
    'notEnoughLife',
    'notEnoughPeak',
    'paymentInvalid',
    'minimumNotMet',
  ])('REQ-54: preserva o motivo %s de ACTION_NOT_ALLOWED', (reason) => {
    expect(actionNotAllowedDetailsSchema.parse({ reason })).toEqual({ reason })
  })
})
