import { describe, expect, it } from 'vitest'
import { abilitySchema, combatEventCardSchema } from './catalog'
import { labConfigSchema } from './labConfig'
import { partySchema, actionNotAllowedDetailsSchema } from './parties'
import { howlingWolvesFixture } from '../mocks/catalogFixtures'
import { labConfigDefaultsFixture } from '../mocks/fixtures'
import { partyInSessionFixture } from '../mocks/partyFixtures'

describe('FEAT-13 contract v0.64', () => {
  it('REQ-60 preserves executable outcomes and rejects malformed variants', () => {
    const card = {
      ...howlingWolvesFixture,
      escapeThreshold: 0,
      goodOutcome: { text: 'Vitória', steps: [] },
    }
    expect(combatEventCardSchema.parse(card)).toMatchObject(card)
    expect(
      abilitySchema.safeParse({ id: 'hit', name: 'Golpe', text: '' }).success,
    ).toBe(false)
    expect(
      combatEventCardSchema.safeParse({
        ...card,
        goodOutcome: { text: 'Vitória', steps: null },
      }).success,
    ).toBe(false)
  })

  it('REQ-60 retains combat configuration and limits', () => {
    const config = {
      ...labConfigDefaultsFixture,
      values: { ...labConfigDefaultsFixture.values, maxCombatCycles: 20 },
      limits: {
        ...labConfigDefaultsFixture.limits,
        maxCombatCycles: { min: 1, max: 100 },
      },
    }
    expect(labConfigSchema.parse(config)).toMatchObject(config)
  })

  it('REQ-62 retains the pending choice and parses refusal reasons', () => {
    const choice = {
      choiceId: 'choice-1',
      memberId: 'member-1',
      decisionDeadlineAt: null,
      effects: [
        {
          effectId: 'effect-1',
          origin: { type: 'inventory', cardId: 'fixture.item', effectIndex: 0 },
          text: 'Pague 1 ouro',
          mode: 'optional',
          canPay: false,
          paymentCosts: [],
        },
      ],
    }
    expect(
      partySchema.parse({
        ...partyInSessionFixture,
        triggeredEffectChoice: choice,
      }),
    ).toMatchObject({ triggeredEffectChoice: choice })
    expect(
      actionNotAllowedDetailsSchema.parse({
        reason: 'staleTriggeredEffectChoice',
      }),
    ).toEqual({ reason: 'staleTriggeredEffectChoice' })
  })
})
