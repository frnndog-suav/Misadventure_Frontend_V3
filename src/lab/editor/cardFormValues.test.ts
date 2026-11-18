import { describe, expect, it } from 'vitest'
import {
  fixtureCardsFixture,
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
