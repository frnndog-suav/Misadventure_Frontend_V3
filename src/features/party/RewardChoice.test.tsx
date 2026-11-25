import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Card } from '../../api/catalog'
import type { Party } from '../../api/parties'
import type { ReceiveSpace } from '../../api/vocabulary'
import {
  healingPotionFixture,
  ironOreFixture,
  shortSwordFixture,
} from '../../mocks/catalogFixtures'
import { RewardChoice } from './RewardChoice'

const cards = new Map<string, Card>([
  [healingPotionFixture.id, healingPotionFixture],
  [ironOreFixture.id, ironOreFixture],
  [shortSwordFixture.id, shortSwordFixture],
])

function reward(destination: ReceiveSpace): Party['pendingRewards'][number] {
  return {
    id: 'r1',
    memberId: 'm1',
    cardId: ironOreFixture.id,
    origin: { type: 'fixed' },
    source: { type: 'scavenge' },
    destination,
    discardOptions: [
      { cardId: shortSwordFixture.id, space: 'inventory', maxCopies: 1 },
      { cardId: healingPotionFixture.id, space: 'inventory', maxCopies: 1 },
      {
        cardId: healingPotionFixture.id,
        space: 'mountInventory',
        maxCopies: 2,
      },
    ],
    decisionDeadlineAt: null,
  }
}

function renderChoice(destination: ReceiveSpace, onResolve = vi.fn()) {
  render(
    <RewardChoice
      reward={reward(destination)}
      cards={cards}
      disabled={false}
      onResolve={onResolve}
    />,
  )
  return onResolve
}

describe('REQ-88: Recompensa pendente com montaria', () => {
  it.each([
    ['inventory', 'o inventário'],
    ['tcgFolder', 'a pasta de TCG'],
    ['mountInventory', 'o inventário extra'],
    ['mountTcgFolder', 'a pasta extra'],
  ] as const)('REQ-88: destino %s aparece como "%s"', (destination, text) => {
    renderChoice(destination)
    expect(
      screen.getByText(`1× Minério de Ferro para ${text}.`),
    ).toBeInTheDocument()
  })

  it('REQ-88: uma seleção por carta e espaço, com o espaço no nome; Manter envia só as seleções > 0', () => {
    const onResolve = renderChoice('mountInventory')
    expect(
      screen.getByLabelText('Descartar Espada Curta (Inventário)'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Descartar Poção de Cura (Inventário)'),
    ).toBeInTheDocument()
    fireEvent.change(
      screen.getByLabelText('Descartar Poção de Cura (Inventário extra)'),
      { target: { value: '2' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Manter' }))
    expect(onResolve).toHaveBeenCalledWith({
      type: 'resolveReward',
      rewardId: 'r1',
      choice: 'keep',
      discard: [
        {
          cardId: healingPotionFixture.id,
          space: 'mountInventory',
          copies: 2,
        },
      ],
    })
  })
})
