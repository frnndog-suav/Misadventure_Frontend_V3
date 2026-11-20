import { executableCombatCardFixture } from '../../mocks/combatFixtures'
import { partyEncounterFixture } from '../../mocks/randomEventFixtures'
import { describe, expect, it } from 'vitest'
import {
  fixtureCardsFixture,
  howlingWolvesFixture,
  pickaxeFixture,
  testDimensionFixture,
} from '../../mocks/catalogFixtures'
import { formFromCard, inputToCard, toInput } from './cardFormValues'

/** FEAT-32 (T-49): o formulário carrega os campos novos de ida e volta. */

describe('REQ-49: campos da FEAT-32 no CardInput do editor', () => {
  it('REQ-49: carta recebida → formulário → CardInput mantém ferramenta, coleta e decks de recompensas', () => {
    for (const card of fixtureCardsFixture) {
      const input = toInput(formFromCard(card))
      expect(input).not.toBeNull()
      if (input !== null) expect(inputToCard(input, 'fixture')).toEqual(card)
    }
    expect(toInput(formFromCard(pickaxeFixture))).toMatchObject({
      toolKind: 'pickaxe',
      scavengeZoneTypes: ['underground', 'mountainous'],
      scavengeTool: null,
    })
    expect(toInput(formFromCard(testDimensionFixture))).toMatchObject({
      rewardDecks: [{ zoneType: 'urban' }],
    })
  })

  it('REQ-49: deck de recompensas sem tipo de zona ou com cópias fora do formato não forma CardInput', () => {
    const form = formFromCard(testDimensionFixture)
    if (form.type !== 'dimension') throw new Error('esperava dimensão')
    const [deck] = form.rewardDecks
    expect(
      toInput({ ...form, rewardDecks: [{ ...deck, zoneType: '' }] }),
    ).toBeNull()
    expect(
      toInput({
        ...form,
        rewardDecks: [{ ...deck, cards: [{ cardId: 'x', copies: 'duas' }] }],
      }),
    ).toBeNull()
  })
})

it('REQ-56: preserves executable rules and ordered zone decks when editing', () => {
  const fixture = partyEncounterFixture.randomEventEncounter!.card!
  const card = {
    ...fixture,
    escapeThreshold: 12,
    noEscape: true,
    goodOutcome: {
      text: fixture.goodOutcome.text,
      steps: [
        { type: 'drawRewards' as const, count: 2 },
        {
          type: 'grantReward' as const,
          cardId: 'fixture.healing-potion',
          copies: 1,
        },
      ],
    },
    badOutcome: { text: fixture.badOutcome.text, steps: [] },
  }
  expect(toInput(formFromCard(card))).toMatchObject({
    requirements: card.requirements,
    goodOutcome: card.goodOutcome,
    badOutcome: card.badOutcome,
    escapeThreshold: card.escapeThreshold,
    noEscape: true,
  })
  const eventDecks = [
    { zoneType: 'urban' as const, cards: [{ cardId: card.id, copies: 2 }] },
  ]
  if (testDimensionFixture.type !== 'dimension')
    throw new Error('esperava dimensão')
  expect(
    toInput(formFromCard({ ...testDimensionFixture, eventDecks })),
  ).toMatchObject({ eventDecks })
})
it('REQ-60: preserves executable combat content and absent legacy fields', () => {
  const card = {
    ...executableCombatCardFixture,
    enemies: executableCombatCardFixture.enemies.map((enemy) => ({
      ...enemy,
      combatRules: {
        abilityUsesPerTurn: 2,
        abilityPriority: ['selfBuff' as const, 'highestPower' as const],
        preferredAbilityIds: ['bite'],
      },
    })),
    goodOutcome: {
      text: executableCombatCardFixture.goodOutcome.text,
      steps: [{ type: 'drawRewards' as const, count: 2 }],
    },
  }
  expect(toInput(formFromCard(card))).toMatchObject({
    escapeThreshold: 0,
    enemies: card.enemies,
    goodOutcome: card.goodOutcome,
    badOutcome: card.badOutcome,
  })
  expect(
    toInput(formFromCard({ ...card, escapeThreshold: null })),
  ).toHaveProperty('escapeThreshold', null)
  expect(toInput(formFromCard(howlingWolvesFixture))).not.toHaveProperty(
    'escapeThreshold',
  )
})
