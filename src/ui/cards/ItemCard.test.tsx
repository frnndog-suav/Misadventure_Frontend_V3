import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ItemCard as ItemCardData } from '../../api/catalog'
import { healingPotionFixture } from '../../mocks/catalogFixtures'
import { ItemCard } from './ItemCard'

if (healingPotionFixture.type !== 'item') throw new Error('fixture')
const potion: ItemCardData = healingPotionFixture

describe('ItemCard', () => {
  it('REQ-11: mostra nome, categoria, etiquetas, raridade e efeitos (fixture)', () => {
    render(<ItemCard card={potion} />)
    const card = screen.getByRole('article', { name: 'Poção de Cura' })
    expect(within(card).getByText('Consumíveis')).toBeVisible()
    expect(within(card).getByText('Poção')).toBeVisible()
    expect(within(card).getByText('Comum')).toBeVisible()
    expect(within(card).getByText('Recupera 5 de Vida.')).toBeVisible()
  })

  it('REQ-11 (regras comuns): sem etiquetas, efeitos e flavor, nada aparece no lugar', () => {
    render(
      <ItemCard
        card={{ ...potion, tags: [], effects: [], flavorText: null }}
      />,
    )
    expect(screen.queryByRole('list', { name: 'Etiquetas' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
  })

  it('REQ-11: flavor aparece quando presente', () => {
    render(<ItemCard card={{ ...potion, flavorText: 'Gosto de hortelã.' }} />)
    expect(screen.getByText('Gosto de hortelã.')).toBeVisible()
  })
})
