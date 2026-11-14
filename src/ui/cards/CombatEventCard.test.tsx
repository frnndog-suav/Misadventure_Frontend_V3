import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  CombatEventCard as CombatEventCardData,
  Enemy,
} from '../../api/catalog'
import { howlingWolvesFixture } from '../../mocks/catalogFixtures'
import { CombatEventCard } from './CombatEventCard'

if (howlingWolvesFixture.type !== 'combatEvent') throw new Error('fixture')
const wolves: CombatEventCardData = howlingWolvesFixture
const wolf: Enemy = wolves.enemies[0]

const boss: Enemy = {
  name: 'Lich Ancestral',
  flavorText: 'Seus olhos ardem.',
  count: 3,
  enemyTypes: ['undead', 'spirit'],
  creature: 'Lich',
  enemyCategory: 'boss',
  element: 'dark',
  health: 40,
  modifiers: {
    attack: 9,
    defense: 6,
    accuracy: 5,
    evasion: 2,
    celerity: 3,
    piercing: 4,
    reflection: 1,
  },
  vigor: 12,
  abilities: [{ name: 'Drenar', text: 'Rouba 3 de Vida.' }],
  behavior: 'support',
}

describe('CombatEventCard', () => {
  it('REQ-13: mostra título, coisa boa, coisa ruim e o inimigo (fixture)', () => {
    render(<CombatEventCard card={wolves} />)
    const card = screen.getByRole('article', { name: 'Lobos Uivantes' })
    expect(within(card).getByText('Coisa boa')).toBeVisible()
    expect(within(card).getByText('Ganhe 3 de ouro.')).toBeVisible()
    expect(within(card).getByText('Coisa ruim')).toBeVisible()
    expect(within(card).getByText('Perca 2 de Vida.')).toBeVisible()
    expect(within(card).queryByText('Sem fuga')).toBeNull()

    const enemy = within(card).getByRole('region', { name: 'Lobo Cinzento' })
    expect(within(enemy).getByText('Fera')).toBeVisible()
    expect(within(enemy).getByText('Criatura: Lobo')).toBeVisible()
    expect(within(enemy).getByText('Categoria: Comum')).toBeVisible()
    expect(within(enemy).getByText('Vida 6')).toBeVisible()
    expect(within(enemy).getByText('Comportamento: Agressivo')).toBeVisible()
    const mods = within(enemy).getByRole('list', { name: 'Modificadores' })
    expect(within(mods).getAllByRole('listitem')).toHaveLength(7)
    expect(within(mods).getAllByRole('listitem')[0]).toHaveTextContent(
      /^2 Ataque/,
    )
    // campos ausentes não aparecem
    expect(within(enemy).queryByText(/Elemento|Vigor/)).toBeNull()
    expect(
      within(enemy).queryByRole('list', { name: 'Habilidades' }),
    ).toBeNull()
    expect(within(card).queryByText(/Nenhum|—/)).toBeNull()
  })

  it('REQ-13: inimigo completo com contagem, elemento, Vigor e habilidades', () => {
    render(
      <CombatEventCard
        card={{ ...wolves, noEscape: true, enemies: [wolf, boss] }}
      />,
    )
    expect(screen.getByText('Sem fuga')).toBeVisible()
    const enemy = screen.getByRole('region', { name: '3× Lich Ancestral' })
    expect(within(enemy).getByText('Seus olhos ardem.')).toBeVisible()
    const types = within(enemy).getByRole('list', { name: 'Tipos' })
    expect(
      within(types)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Morto-vivo', 'Espírito'])
    expect(within(enemy).getByText('Categoria: Chefe')).toBeVisible()
    expect(within(enemy).getByText('Elemento: Obscuro')).toBeVisible()
    expect(within(enemy).getByText('Vida 40')).toBeVisible()
    expect(within(enemy).getByText('Vigor 12')).toBeVisible()
    expect(within(enemy).getByText('Drenar')).toBeVisible()
    expect(within(enemy).getByText('Rouba 3 de Vida.')).toBeVisible()
    expect(within(enemy).getByText('Comportamento: Suporte')).toBeVisible()
  })
})
