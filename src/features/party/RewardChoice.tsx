import { useId, useState } from 'react'
import type { Card } from '../../api/catalog'
import type { Party } from '../../api/parties'
import type { ResolveRewardAction } from '../../api/randomEvents'
import type { ReceiveSpace } from '../../api/vocabulary'
import { nameOf } from './cardNames'
import { receiveSpaceText } from './receiveSpace'

const spaceName: Record<ReceiveSpace, string> = {
  inventory: 'Inventário',
  tcgFolder: 'Pasta de TCG',
  mountInventory: 'Inventário extra',
  mountTcgFolder: 'Pasta extra',
}

/** Uma seleção por carta e espaço (REQ-88). */
const optionKey = (cardId: string, space: ReceiveSpace) => `${space}:${cardId}`

export function RewardChoice({
  reward,
  recipient,
  rotationPosition,
  cards,
  disabled,
  onResolve,
}: {
  reward: Party['pendingRewards'][number]
  recipient?: string
  rotationPosition?: number
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
      {recipient && (
        <p>
          {recipient}
          {rotationPosition !== undefined &&
            ` · posição ${rotationPosition} no rodízio`}
        </p>
      )}
      <p>{`1× ${nameOf(cards, cardId)} para ${receiveSpaceText[destination]}.`}</p>
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
        {discardOptions.map(({ cardId, space, maxCopies }) => (
          <label key={optionKey(cardId, space)}>
            {`Descartar ${nameOf(cards, cardId)} (${spaceName[space]})`}
            <select
              value={Math.min(
                selected[optionKey(cardId, space)] ?? 0,
                maxCopies,
              )}
              onChange={(event) => {
                const copies = Number(event.target.value)
                setSelected((current) => ({
                  ...current,
                  [optionKey(cardId, space)]: copies,
                }))
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
                  const copies = Math.min(
                    selected[optionKey(cardId, space)] ?? 0,
                    maxCopies,
                  )
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
