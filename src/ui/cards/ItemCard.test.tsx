import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ItemCard as ItemCardData } from '../../api/catalog'
import {
  fishingRodFixture,
  healingPotionFixture,
  silverFishFixture,
} from '../../mocks/catalogFixtures'
import { ItemCard } from './ItemCard'

if (healingPotionFixture.type !== 'item') throw new Error('fixture')
const potion: ItemCardData = healingPotionFixture

describe('ItemCard', () => {
  it('REQ-11: mostra nome, categoria, etiquetas, raridade e efeitos (fixture)', () => {
    render(<ItemCard card={potion} />)
    const card = screen.getByRole('article', { name: 'Poção de Cura' })
    expect(within(card).getByText('Consumíveis')).toBeVisible()
    expect(within(card).getByText('poção')).toBeVisible()
    expect(within(card).getByText('Comum')).toBeVisible()
    expect(within(card).getByText('Recupera 5 de vida.')).toBeVisible()
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

  it('REQ-48: ferramenta mostra "Ferramenta" e "Vasculha em" depois dos efeitos, na ordem recebida', () => {
    if (fishingRodFixture.type !== 'item') throw new Error('fixture')
    render(
      <ItemCard
        card={{
          ...fishingRodFixture,
          effects: [
            {
              trigger: null,
              cost: [],
              activation: [],
              duration: { kind: 'immediate' },
              text: 'Efeito X.',
              mark: null,
            },
          ],
        }}
      />,
    )
    const card = screen.getByRole('article', { name: 'Vara de Pesca' })
    const tool = within(card).getByText('Ferramenta: fishing-rod')
    expect(tool).toBeVisible()
    expect(
      within(card).getByText(
        'Vasculha em: Costeira, Fluvial, Lacustre, Urbana',
      ),
    ).toBeVisible()
    const effects = within(card).getByRole('list', { name: 'Efeitos' })
    expect(
      effects.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(within(card).queryByText(/Coletada com/)).toBeNull()
  })

  it('REQ-48: scavengeTool mostra "Coletada com"; toolKind null não mostra ferramenta', () => {
    if (silverFishFixture.type !== 'item') throw new Error('fixture')
    render(<ItemCard card={silverFishFixture} />)
    expect(screen.getByText('Coletada com: fishing-rod')).toBeVisible()
    expect(screen.queryByText(/Ferramenta:|Vasculha em:/)).toBeNull()
  })

  it('REQ-48: sem toolKind nem scavengeTool, nada aparece', () => {
    render(<ItemCard card={potion} />)
    expect(
      screen.queryByText(/Ferramenta:|Vasculha em:|Coletada com:/),
    ).toBeNull()
  })

  it('REQ-11: flavor aparece quando presente', () => {
    render(<ItemCard card={{ ...potion, flavorText: 'Gosto de hortelã.' }} />)
    expect(screen.getByText('Gosto de hortelã.')).toBeVisible()
  })
})
