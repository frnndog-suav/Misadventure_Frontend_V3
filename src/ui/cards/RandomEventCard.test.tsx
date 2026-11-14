import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RandomEventCard as RandomEventCardData } from '../../api/catalog'
import { woundedTravelerFixture } from '../../mocks/catalogFixtures'
import { RandomEventCard } from './RandomEventCard'

if (woundedTravelerFixture.type !== 'randomEvent') throw new Error('fixture')
const traveler: RandomEventCardData = woundedTravelerFixture

describe('RandomEventCard', () => {
  it('REQ-13: mostra título, requisitos, coisa boa e coisa ruim (fixture)', () => {
    render(<RandomEventCard card={traveler} />)
    const card = screen.getByRole('article', { name: 'Viajante Ferido' })
    const reqs = within(card).getByRole('list', { name: 'Requisitos' })
    expect(within(reqs).getByRole('listitem')).toHaveTextContent('Sabedoria 2.')
    expect(within(card).getByText('Coisa boa')).toBeVisible()
    expect(within(card).getByText('Ganhe 1 item.')).toBeVisible()
    expect(within(card).getByText('Coisa ruim')).toBeVisible()
    expect(within(card).getByText('Perca 1 de Vida.')).toBeVisible()
  })

  it('REQ-13: "Sem fuga" só quando noEscape é true', () => {
    const { unmount } = render(<RandomEventCard card={traveler} />)
    expect(screen.queryByText('Sem fuga')).toBeNull()
    unmount()
    render(<RandomEventCard card={{ ...traveler, noEscape: true }} />)
    expect(screen.getByText('Sem fuga')).toBeVisible()
  })

  it('REQ-13 (regras comuns): flavor só quando presente', () => {
    const { unmount } = render(<RandomEventCard card={traveler} />)
    expect(screen.queryByText(/Nenhum|—/)).toBeNull()
    unmount()
    render(<RandomEventCard card={{ ...traveler, flavorText: 'Ele geme.' }} />)
    expect(screen.getByText('Ele geme.')).toBeVisible()
  })
})
