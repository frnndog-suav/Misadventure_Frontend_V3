import { useState } from 'react'
import type { Party, PartyAction } from '../../api/parties'

type Decision = NonNullable<Party['pendingCombatDecision']>
type Recruitment = Extract<Decision, { type: 'roster' | 'invite' | 'order' }>

export function CombatRecruitment({
  decision,
  names,
  pending,
  onAction,
}: {
  decision: Recruitment
  names: ReadonlyMap<string, string>
  pending: boolean
  onAction: (action: PartyAction) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const name = (id: string) => names.get(id) ?? id
  const ids = { combatId: decision.combatId, decisionId: decision.id }

  if (decision.type === 'invite') {
    return (
      <fieldset disabled={pending}>
        <legend>Convite para combate</legend>
        <p>
          {name(decision.initiatorMemberId)} convidou você para{' '}
          {decision.cardTitle}.
        </p>
        <p>O custo do encontro cabe a {name(decision.initiatorMemberId)}.</p>
        <button
          type="button"
          onClick={() =>
            onAction({ type: 'respondCombatInvite', ...ids, accept: true })
          }
        >
          Aceitar convite
        </button>
        <button
          type="button"
          onClick={() =>
            onAction({ type: 'respondCombatInvite', ...ids, accept: false })
          }
        >
          Recusar convite
        </button>
      </fieldset>
    )
  }

  if (decision.type === 'order') {
    const orders = [
      decision.defaultMemberIds,
      ...decision.alternativeMemberOrders,
    ]
    return (
      <fieldset disabled={pending}>
        <legend>Desempate entre combatentes</legend>
        {orders.map((memberIds, index) => (
          <button
            key={JSON.stringify(memberIds)}
            type="button"
            onClick={() =>
              onAction({ type: 'confirmCombatOrder', ...ids, memberIds })
            }
          >
            {memberIds.map(name).join(' → ')}
            {index === 0 && ' (padrão)'}
          </button>
        ))}
      </fieldset>
    )
  }

  return (
    <fieldset disabled={pending}>
      <legend>Recrutar ajudantes</legend>
      <p>
        O custo do encontro cabe a {name(decision.memberId)}. Confirme sem
        convidados para combater solo.
      </p>
      <ul>
        {decision.candidateMemberIds.map((id) => (
          <li key={id}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(id)}
                onChange={({ currentTarget: { checked } }) =>
                  setSelected((previous) =>
                    checked
                      ? [...previous, id]
                      : previous.filter((memberId) => memberId !== id),
                  )
                }
              />
              {name(id)}
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          onAction({
            type: 'confirmCombatRoster',
            ...ids,
            inviteeMemberIds: decision.candidateMemberIds.filter((id) =>
              selected.includes(id),
            ),
          })
        }
      >
        Confirmar elenco
      </button>
    </fieldset>
  )
}
