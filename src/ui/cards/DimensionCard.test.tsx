import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DimensionCard as DimensionCardData } from '../../api/catalog'
import { testDimensionFixture } from '../../mocks/catalogFixtures'
import { DimensionCard } from './DimensionCard'
import { FullCard } from './FullCard'

if (testDimensionFixture.type !== 'dimension') throw new Error('fixture')
const dimension: DimensionCardData = testDimensionFixture

describe('DimensionCard', () => {
  it('REQ-28: mostra nome, ordem de lançamento e zona de chegada (fixture)', () => {
    render(<DimensionCard card={dimension} />)
    const card = screen.getByRole('article', { name: 'Dimensão de Teste' })
    expect(within(card).getByText('Ordem de lançamento 1')).toBeVisible()
    expect(
      within(card).getByText('Zona de chegada: Porto Cinzento'),
    ).toBeVisible()
    // a fixture não tem efeitos nem flavor
    expect(within(card).queryByRole('list', { name: 'Efeitos' })).toBeNull()
  })

  it('REQ-28: zona de chegada null mostra o texto do sorteio', () => {
    render(<DimensionCard card={{ ...dimension, arrivalZoneTitle: null }} />)
    expect(
      screen.getByText(
        'Zona de chegada: sorteada entre as Urbanas sem efeito negativo',
      ),
    ).toBeVisible()
  })

  it('REQ-28: mostra flavor e efeitos quando houver', () => {
    render(
      <DimensionCard
        card={{
          ...dimension,
          flavorText: 'Um mundo à deriva.',
          effects: [{ text: 'Efeito A.' }, { text: 'Efeito B.' }],
        }}
      />,
    )
    expect(screen.getByText('Um mundo à deriva.')).toBeVisible()
    const items = within(
      screen.getByRole('list', { name: 'Efeitos' }),
    ).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'Efeito A.',
      'Efeito B.',
    ])
  })

  it('REQ-28: FullCard mostra a Carta de Dimensão', () => {
    render(<FullCard card={dimension} />)
    expect(
      screen.getByRole('article', { name: 'Dimensão de Teste' }),
    ).toBeVisible()
  })
})
