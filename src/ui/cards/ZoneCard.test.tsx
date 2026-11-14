import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ZoneCard as ZoneCardData } from '../../api/catalog'
import { whisperingGroveFixture } from '../../mocks/catalogFixtures'
import { ZoneCard } from './ZoneCard'

if (whisperingGroveFixture.type !== 'zone') throw new Error('fixture')
const grove: ZoneCardData = whisperingGroveFixture

describe('ZoneCard', () => {
  it('REQ-12: mostra título, tipo de zona, local, setas, ações e efeitos (fixture)', () => {
    render(<ZoneCard card={grove} />)
    const card = screen.getByRole('article', { name: 'Bosque Sussurrante' })
    expect(within(card).getByText('Florestal')).toBeVisible()
    expect(within(card).getByText('Bosque')).toBeVisible()
    expect(within(card).getByText('Setas de conexão: 2')).toBeVisible()
    const actions = within(card).getByRole('list', { name: 'Ações de zona' })
    expect(
      within(actions)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Iniciar evento', 'Vasculhar'])
    const effects = within(card).getByRole('list', { name: 'Efeitos' })
    expect(within(effects).getByRole('listitem')).toHaveTextContent(
      'Positivo: Esquiva +1 nesta zona.',
    )
  })

  it('REQ-12: efeito negativo marcado com texto "Negativo"', () => {
    render(
      <ZoneCard
        card={{
          ...grove,
          effects: [
            { text: 'Esquiva +1.', polarity: 'positive' },
            { text: 'Perca 1 de Vida ao entrar.', polarity: 'negative' },
          ],
        }}
      />,
    )
    const items = within(
      screen.getByRole('list', { name: 'Efeitos' }),
    ).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'Positivo: Esquiva +1.',
      'Negativo: Perca 1 de Vida ao entrar.',
    ])
  })

  it('REQ-12 (regras comuns): sem ações e efeitos, as listas não aparecem', () => {
    render(<ZoneCard card={{ ...grove, zoneActions: [], effects: [] }} />)
    expect(screen.queryByRole('list', { name: 'Ações de zona' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
  })
})
