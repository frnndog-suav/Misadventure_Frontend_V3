import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Card } from '../../api/catalog'
import type { PlayerState } from '../../api/parties'
import {
  enduranceBasicFixture,
  healingPotionFixture,
  strengthBasicFixture,
} from '../../mocks/catalogFixtures'
import { partyCreatedFixture } from '../../mocks/partyFixtures'
import { EffectsPanel } from './EffectsPanel'

const potion = healingPotionFixture

const cards = new Map<string, Card>([
  [potion.id, potion],
  [strengthBasicFixture.id, strengthBasicFixture],
  [enduranceBasicFixture.id, enduranceBasicFixture],
])

function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    ...partyCreatedFixture.members[0]!.player,
    statuses: [],
    activatableEffects: [
      {
        cardId: potion.id,
        effectIndex: 0,
        source: 'inventory',
        handPayment: null,
      },
    ],
    availableActions: ['prepare', 'endTurn'],
    ...overrides,
  }
}

const activateName = `Ativar ${potion.name} — efeito 1`

describe('REQ-54: status e ativação em Preparar', () => {
  it('REQ-54: mostra lista vazia de status', () => {
    render(
      <EffectsPanel
        player={player()}
        cards={cards}
        pending={false}
        onActivate={vi.fn()}
      />,
    )
    expect(
      within(screen.getByRole('region', { name: 'Status' })).getByText(
        'Nenhum status ativo.',
      ),
    ).toBeInTheDocument()
  })

  it('REQ-54: mostra o texto copiado, marca e contagem sem usar o texto atual da carta', () => {
    render(
      <EffectsPanel
        player={player({
          statuses: [
            {
              statusId: 'old-status',
              sourceCardId: potion.id,
              effectIndex: 0,
              text: 'Texto guardado quando foi ativado.',
              mark: 'debuff',
              activation: [
                {
                  kind: 'modifierFlat',
                  changes: [{ modifier: 'attack', amount: -3 }],
                },
              ],
              duration: { kind: 'forOwnTurns', turns: 2 },
              remaining: 1,
            },
          ],
        })}
        cards={cards}
        pending={false}
        onActivate={vi.fn()}
      />,
    )
    const status = within(screen.getByRole('region', { name: 'Status' }))
    expect(
      status.getByText('Texto guardado quando foi ativado.'),
    ).toBeInTheDocument()
    expect(status.getByText('Debuff')).toBeInTheDocument()
    expect(status.getByText(/Restantes: 1/)).toBeInTheDocument()
    expect(status.getByText(new RegExp(potion.name))).toBeInTheDocument()
    expect(status.queryByText('Recupera 5 de vida.')).not.toBeInTheDocument()
  })

  it('REQ-54: usa id como fallback da origem e omite contagem nula', () => {
    render(
      <EffectsPanel
        player={player({
          statuses: [
            {
              statusId: 'unknown-status',
              sourceCardId: 'fixture.removed-card',
              effectIndex: 0,
              text: 'Buff preservado.',
              mark: 'buff',
              activation: [{ kind: 'gainGold', amount: 1 }],
              duration: { kind: 'infinite' },
              remaining: null,
            },
          ],
        })}
        cards={cards}
        pending={false}
        onActivate={vi.fn()}
      />,
    )
    const status = within(screen.getByRole('region', { name: 'Status' }))
    expect(status.getByText(/fixture.removed-card/)).toBeInTheDocument()
    expect(status.getByText('Buff')).toBeInTheDocument()
    expect(status.queryByText(/Restantes:/)).not.toBeInTheDocument()
  })

  it('REQ-54: envia somente a intenção sem payment quando o backend não pede escolha', () => {
    const onActivate = vi.fn()
    render(
      <EffectsPanel
        player={player({ vigor: 0 })}
        cards={cards}
        pending={false}
        onActivate={onActivate}
      />,
    )
    const effects = within(
      screen.getByRole('region', { name: 'Ativar efeitos' }),
    )
    expect(effects.getByText('Recupera 5 de vida.')).toBeInTheDocument()
    expect(effects.getByText(/Inventário/)).toBeInTheDocument()
    fireEvent.click(effects.getByRole('button', { name: activateName }))
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(
      {
        type: 'prepare',
        operation: 'activate',
        cardId: potion.id,
        effectIndex: 0,
      },
      expect.any(Function),
    )
  })

  it('REQ-54: sem prepare não mostra controles, mesmo se existir efeito ativável', () => {
    render(
      <EffectsPanel
        player={player({ availableActions: ['endTurn'] })}
        cards={cards}
        pending={false}
        onActivate={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('button', { name: activateName }),
    ).not.toBeInTheDocument()
  })

  it('REQ-54: não inventa ativações para cartas que só estão no inventário', () => {
    render(
      <EffectsPanel
        player={player({
          inventory: [{ cardId: potion.id, quantity: 2 }],
          activatableEffects: [],
        })}
        cards={cards}
        pending={false}
        onActivate={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('button', { name: activateName }),
    ).not.toBeInTheDocument()
  })

  it('REQ-54: não permite enviar antes da carta do catálogo carregar', () => {
    const onActivate = vi.fn()
    render(
      <EffectsPanel
        player={player()}
        cards={new Map()}
        pending={false}
        onActivate={onActivate}
      />,
    )
    for (const button of screen.queryAllByRole('button')) {
      expect(button).toBeDisabled()
      fireEvent.click(button)
    }
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('REQ-54: escolhe cópias separadamente, preserva ids repetidos e não filtra atributos', () => {
    const onActivate = vi.fn()
    render(
      <EffectsPanel
        player={player({
          hand: [
            strengthBasicFixture.id,
            strengthBasicFixture.id,
            enduranceBasicFixture.id,
          ],
          activatableEffects: [
            {
              cardId: potion.id,
              effectIndex: 0,
              source: 'equipment',
              handPayment: {
                count: 2,
                text: 'Escolha duas cartas conforme o custo recebido.',
              },
            },
          ],
        })}
        cards={cards}
        pending={false}
        onActivate={onActivate}
      />,
    )
    const effects = within(
      screen.getByRole('region', { name: 'Ativar efeitos' }),
    )
    expect(
      effects.getByText('Escolha duas cartas conforme o custo recebido.'),
    ).toBeInTheDocument()
    expect(effects.getByText(/Equipamento/)).toBeInTheDocument()
    const choices = effects.getAllByRole('checkbox')
    expect(choices).toHaveLength(3)
    expect(choices[0]).toHaveAccessibleName(/Força/)
    expect(choices[1]).toHaveAccessibleName(/Força/)
    expect(choices[2]).toHaveAccessibleName(/Resistência/)
    const activate = effects.getByRole('button', { name: activateName })
    expect(activate).toBeDisabled()
    fireEvent.click(choices[0]!)
    expect(activate).toBeDisabled()
    fireEvent.click(choices[1]!)
    expect(activate).toBeEnabled()
    fireEvent.click(activate)
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(
      {
        type: 'prepare',
        operation: 'activate',
        cardId: potion.id,
        effectIndex: 0,
        payment: {
          handCards: [strengthBasicFixture.id, strengthBasicFixture.id],
        },
      },
      expect.any(Function),
    )
  })

  it('REQ-54: desabilita botões e escolhas durante o pedido', () => {
    render(
      <EffectsPanel
        player={player({
          activatableEffects: [
            {
              cardId: potion.id,
              effectIndex: 0,
              source: 'inventory',
              handPayment: { count: 1, text: 'Escolha uma carta.' },
            },
          ],
        })}
        cards={cards}
        pending
        onActivate={vi.fn()}
      />,
    )
    for (const control of [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('checkbox'),
    ]) {
      expect(control).toBeDisabled()
    }
  })
})
