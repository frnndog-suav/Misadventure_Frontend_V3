import { useId, useState } from 'react'
import type { Card } from '../../api/catalog'
import type { Party } from '../../api/parties'
import type { ResolveRewardAction } from '../../api/randomEvents'
import { nameOf } from './cardNames'

export function RewardChoice({
  reward,
  cards,
  disabled,
  onResolve,
}: {
  reward: Party['pendingRewards'][number]
  cards: ReadonlyMap<string, Card>
  disabled: boolean
  onResolve: (action: ResolveRewardAction) => void
}) {
  const title = useId()
  const [selected, setSelected] = useState<Record<string, number>>({})
  const {
    id: rewardId,
    cardId,
    destination,
    discardOptions,
    decisionDeadlineAt,
  } = reward
  const action = { type: 'resolveReward', rewardId } as const

  return (
    <section aria-labelledby={title}>
      <h2 id={title}>Recompensa pendente</h2>
      <p>
        1× {nameOf(cards, cardId)} para{' '}
        {destination === 'inventory' ? 'o inventário' : 'a pasta de TCG'}.
      </p>
      {reward.source.type === 'booster' && (
        <p>Origem: Booster {nameOf(cards, reward.source.boosterCardId)}</p>
      )}
      {decisionDeadlineAt !== null && (
        <p>
          Prazo da escolha{' '}
          <time dateTime={decisionDeadlineAt}>
            {new Date(decisionDeadlineAt).toLocaleString('pt-BR')}
          </time>
        </p>
      )}
      <fieldset disabled={disabled}>
        <legend>Manter ou deixar a recompensa</legend>
        {discardOptions.map(({ cardId, maxCopies }) => (
          <label key={cardId}>
            Descartar {nameOf(cards, cardId)}
            <select
              value={Math.min(selected[cardId] ?? 0, maxCopies)}
              onChange={(event) => {
                const copies = Number(event.target.value)
                setSelected((current) => ({ ...current, [cardId]: copies }))
              }}
            >
              {Array.from({ length: maxCopies + 1 }, (_, copies) => (
                <option key={copies} value={copies}>
                  {copies}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={() =>
            onResolve({
              ...action,
              choice: 'keep',
              discard: discardOptions.flatMap(
                ({ cardId, space, maxCopies }) => {
                  const copies = Math.min(selected[cardId] ?? 0, maxCopies)
                  return copies > 0 ? [{ cardId, space, copies }] : []
                },
              ),
            })
          }
        >
          Manter
        </button>
        <button
          type="button"
          onClick={() => onResolve({ ...action, choice: 'leave' })}
        >
          Deixar
        </button>
      </fieldset>
    </section>
  )
}
