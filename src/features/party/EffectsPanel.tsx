import { useId, useState } from 'react'
import type { Card } from '../../api/catalog'
import type { PlayerState, PrepareAction } from '../../api/parties'
import { effectMarkLabels } from '../../ui/labels'
import { nameOf } from './cardNames'

type Cards = ReadonlyMap<string, Card>
type Activation = PlayerState['activatableEffects'][number]
export type ActivateEffect = (
  action: Extract<PrepareAction, { operation: 'activate' }>,
  onSuccess: () => void,
) => void

function EffectActivation({
  activation,
  hand,
  cards,
  pending,
  onActivate,
}: {
  activation: Activation
  hand: PlayerState['hand']
  cards: Cards
  pending: boolean
  onActivate: ActivateEffect
}) {
  const { cardId, effectIndex, source, handPayment } = activation
  const [selected, setSelected] = useState<number[]>([])
  const copies = new Map<string, number>()
  const name = nameOf(cards, cardId, cardId)
  const card = cards.get(cardId)
  const effect =
    card && 'effects' in card ? card.effects[effectIndex] : undefined

  return (
    <li>
      <p>
        {source === 'inventory' ? 'Inventário' : 'Equipamento'} · {name}
      </p>
      {effect && <p>{effect.text}</p>}
      {handPayment !== null && (
        <fieldset disabled={pending}>
          <legend>{handPayment.text}</legend>
          {hand.map((id, index) => {
            const copy = (copies.get(id) ?? 0) + 1
            copies.set(id, copy)
            const checked = selected.includes(index)
            return (
              <label key={index}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= handPayment.count}
                  onChange={() =>
                    setSelected(
                      checked
                        ? selected.filter((i) => i !== index)
                        : [...selected, index],
                    )
                  }
                />
                {nameOf(cards, id, id)} (cópia {copy})
              </label>
            )
          })}
        </fieldset>
      )}
      <button
        type="button"
        disabled={
          pending ||
          effect === undefined ||
          (handPayment !== null && selected.length !== handPayment.count)
        }
        onClick={() =>
          onActivate(
            {
              type: 'prepare',
              operation: 'activate',
              cardId,
              effectIndex,
              ...(handPayment === null
                ? {}
                : {
                    payment: {
                      handCards: hand.filter((_, index) =>
                        selected.includes(index),
                      ),
                    },
                  }),
            },
            () => setSelected([]),
          )
        }
      >
        Ativar {name} — efeito {effectIndex + 1}
      </button>
    </li>
  )
}

export function EffectsPanel({
  player,
  cards,
  pending,
  onActivate,
}: {
  player: PlayerState
  cards: Cards
  pending: boolean
  onActivate?: ActivateEffect
}) {
  const statusId = useId()
  const activationId = useId()
  return (
    <>
      <section aria-labelledby={statusId}>
        <h3 id={statusId}>Status</h3>
        {player.statuses.length === 0 ? (
          <p>Nenhum status ativo.</p>
        ) : (
          <ul>
            {player.statuses.map(
              ({ statusId, sourceCardId, mark, text, remaining }) => (
                <li key={statusId}>
                  <strong>{effectMarkLabels[mark]}</strong>
                  <p>{text}</p>
                  <p>Origem: {nameOf(cards, sourceCardId, sourceCardId)}</p>
                  {remaining !== null && <p>Restantes: {remaining}</p>}
                </li>
              ),
            )}
          </ul>
        )}
      </section>
      {onActivate !== undefined &&
        player.availableActions.includes('prepare') &&
        player.activatableEffects.length > 0 && (
          <section aria-labelledby={activationId}>
            <h3 id={activationId}>Ativar efeitos</h3>
            <ul key={JSON.stringify(player.hand)}>
              {player.activatableEffects.map((activation) => (
                <EffectActivation
                  key={JSON.stringify([
                    activation.source,
                    activation.cardId,
                    activation.effectIndex,
                    activation.handPayment,
                  ])}
                  activation={activation}
                  hand={player.hand}
                  cards={cards}
                  pending={pending}
                  onActivate={onActivate}
                />
              ))}
            </ul>
          </section>
        )}
    </>
  )
}
