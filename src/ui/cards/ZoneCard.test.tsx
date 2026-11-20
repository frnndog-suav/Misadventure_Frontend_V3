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
    expect(within(card).getByText('Terras Selvagens')).toBeVisible()
    expect(within(card).getByText('Setas de conexão: 2')).toBeVisible()
    const actions = within(card).getByRole('list', { name: 'Ações de zona' })
    expect(
      within(actions)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Iniciar evento'])
    // a fixture real não tem efeitos: a lista não aparece
    expect(within(card).queryByRole('list', { name: 'Efeitos' })).toBeNull()
  })

  it('REQ-12: efeito positivo marcado com texto "Positivo"', () => {
    render(
      <ZoneCard
        card={{
          ...grove,
          effects: [
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Esquiva +1 nesta zona.',
              polarity: 'positive',
            },
          ],
        }}
      />,
    )
    const effects = screen.getByRole('list', { name: 'Efeitos' })
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
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Esquiva +1.',
              polarity: 'positive',
            },
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Perca 1 de Vida ao entrar.',
              polarity: 'negative',
            },
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

  it('REQ-28: depois de "Setas de conexão", "Setas opostas" (straight)', () => {
    render(<ZoneCard card={grove} />)
    const card = screen.getByRole('article', { name: 'Bosque Sussurrante' })
    const texts = within(card)
      .getAllByRole('paragraph')
      .map((p) => p.textContent)
    const i = texts.indexOf('Setas de conexão: 2')
    expect(texts[i + 1]).toBe('Setas opostas')
  })

  it('REQ-28: "Setas vizinhas" (corner)', () => {
    render(<ZoneCard card={{ ...grove, arrowLayout: 'corner' }} />)
    expect(screen.getByText('Setas vizinhas')).toBeVisible()
  })

  it('REQ-28: arrowLayout null não mostra forma', () => {
    render(<ZoneCard card={{ ...grove, arrowLayout: null }} />)
    expect(screen.queryByText(/Setas (opostas|vizinhas)/)).toBeNull()
  })

  it('REQ-12 (regras comuns): sem ações e efeitos, as listas não aparecem', () => {
    render(<ZoneCard card={{ ...grove, zoneActions: [], effects: [] }} />)
    expect(screen.queryByRole('list', { name: 'Ações de zona' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
  })
})
