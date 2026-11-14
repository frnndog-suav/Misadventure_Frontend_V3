import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EquipmentCard as EquipmentCardData } from '../../api/catalog'
import { bladeOfDuskFixture } from '../../mocks/catalogFixtures'
import { EquipmentCard } from './EquipmentCard'

if (bladeOfDuskFixture.type !== 'equipment') throw new Error('fixture')
const minimal: EquipmentCardData = bladeOfDuskFixture

const full: EquipmentCardData = {
  ...minimal,
  id: 'test.full',
  name: 'Montante do Rei',
  flavorText: 'Pesa como uma coroa.',
  rarity: 'legendary',
  tags: ['Espada', 'Pesada'],
  modifiers: [
    { modifier: 'attack', value: 12 },
    { modifier: 'celerity', value: -2 },
  ],
  peakRequirement: 5,
  classRestriction: ['warrior', 'monk'],
  blocksShield: true,
  abilities: [
    { name: 'Golpe Real', text: 'Uma vez por combate, ataque duas vezes.' },
  ],
  effects: [{ text: '−10% de Celeridade.' }],
  refinement: { maxLevel: 5, materials: { text: '2 Minério de Ferro.' } },
  enchantment: { text: 'Aceita encantamento de Fogo.' },
  priceMultiplier: 1.2,
}

describe('EquipmentCard', () => {
  it('REQ-10: mostra nome, categoria do slot, etiquetas, raridade, modificador principal e preço (fixture)', () => {
    render(<EquipmentCard card={minimal} />)
    const card = screen.getByRole('article', { name: 'Lâmina do Crepúsculo' })
    expect(within(card).getByText('Arma')).toBeVisible()
    expect(within(card).getByText('Espada')).toBeVisible()
    expect(within(card).getByText('Rara')).toBeVisible()
    const mods = within(card).getByRole('list', { name: 'Modificadores' })
    expect(
      within(mods)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['+3 Ataque (principal)'])
    expect(within(mods).getByText('Ataque')).toHaveClass('term')
    expect(within(card).getByText('Preço ×1')).toBeVisible()
  })

  it('REQ-10: campos opcionais ausentes não aparecem', () => {
    render(<EquipmentCard card={minimal} />)
    expect(screen.queryByText(/Pico/)).toBeNull()
    expect(screen.queryByText('Bloqueia escudo')).toBeNull()
    expect(screen.queryByText(/Refinável/)).toBeNull()
    expect(screen.queryByRole('list', { name: 'Habilidades' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Classes' })).toBeNull()
    expect(screen.queryByText('Encantamento')).toBeNull()
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
  })

  it('REQ-10: carta completa mostra todos os campos na ordem recebida', () => {
    render(<EquipmentCard card={full} />)
    const mods = screen.getByRole('list', { name: 'Modificadores' })
    expect(
      within(mods)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['+12 Ataque (principal)', '−2 Celeridade'])
    expect(screen.getByText('Preço ×1,2')).toBeVisible()
    expect(screen.getByText('Pico 5')).toBeVisible()
    const classes = screen.getByRole('list', { name: 'Classes' })
    expect(
      within(classes)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Guerreiro', 'Monge'])
    expect(screen.getByText('Bloqueia escudo')).toBeVisible()
    expect(screen.getByText('Golpe Real')).toBeVisible()
    expect(
      screen.getByText('Uma vez por combate, ataque duas vezes.'),
    ).toBeVisible()
    expect(screen.getByText('−10% de Celeridade.')).toBeVisible()
    expect(screen.getByText('Refinável até +5')).toBeVisible()
    expect(screen.getByText('2 Minério de Ferro.')).toBeVisible()
    expect(screen.getByText('Aceita encantamento de Fogo.')).toBeVisible()
    expect(screen.getByText('Pesa como uma coroa.')).toBeVisible()
    expect(screen.getByText('Pesada')).toBeVisible()
  })
})
