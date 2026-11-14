import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AttributeCard as AttributeCardData } from '../../api/catalog'
import { strengthBasicFixture } from '../../mocks/catalogFixtures'
import { AttributeCard } from './AttributeCard'

if (strengthBasicFixture.type !== 'attribute') throw new Error('fixture')
const basic: AttributeCardData = strengthBasicFixture

const synergy: AttributeCardData = {
  ...basic,
  id: 'test.synergy',
  name: 'Diplomata',
  rarity: 'uncommon',
  attributeKind: 'synergy',
  attributes: ['charisma', 'wisdom'],
  flavorText: 'Palavras abrem portas.',
}

const enhanced: AttributeCardData = {
  ...basic,
  id: 'test.enhanced',
  name: 'Força Bruta',
  rarity: 'rare',
  attributeKind: 'enhanced',
  effects: [{ text: '+1 de Ataque neste combate.' }],
}

describe('AttributeCard', () => {
  it('REQ-09: mostra nome, raridade, tipo e cada atributo valendo 1 (fixture do contrato)', () => {
    render(<AttributeCard card={basic} />)
    const card = screen.getByRole('article', { name: 'Força' })
    expect(within(card).getByRole('heading', { name: 'Força' })).toBeVisible()
    expect(within(card).getByText('Comum')).toBeVisible()
    expect(within(card).getByText('Básica')).toBeVisible()
    const items = within(card).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['1 Força'])
  })

  it('REQ-09: carta sinérgica lista todos os atributos como termo do jogo', () => {
    render(<AttributeCard card={synergy} />)
    expect(screen.getByText('Sinérgica')).toBeVisible()
    const list = screen.getByRole('list', { name: 'Atributos' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['1 Carisma', '1 Sabedoria'])
    expect(within(list).getByText('Carisma')).toHaveClass('term')
  })

  it('REQ-09: carta aprimorada mostra também os efeitos como vieram', () => {
    render(<AttributeCard card={enhanced} />)
    expect(screen.getByText('Aprimorada')).toBeVisible()
    expect(screen.getByText('+1 de Ataque neste combate.')).toBeVisible()
  })

  it('REQ-09 (regras comuns): flavor só quando não é null; listas vazias não aparecem', () => {
    const { rerender } = render(<AttributeCard card={basic} />)
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
    rerender(<AttributeCard card={synergy} />)
    expect(screen.getByText('Palavras abrem portas.')).toBeVisible()
  })
})
