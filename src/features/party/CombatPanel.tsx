import { useId, useState, type ReactNode } from 'react'
import type { AbilitySource, CombatAction } from '../../api/combat'
import type { Card } from '../../api/catalog'
import type {
  Party,
  PartyAction,
  PartyActionResponse,
  PartyMember,
} from '../../api/parties'
import type { EventPayment } from '../../api/randomEvents'
import { nameOf } from './cardNames'

type Combat = NonNullable<Party['combat']>
type Option = Combat['abilities'][number] | Combat['effects'][number]
type Update = NonNullable<PartyActionResponse['combatUpdates']>[number]
type Result = NonNullable<Party['lastCombatResult']>
type Cards = ReadonlyMap<string, Card>

function ProjectedAction({
  option,
  label,
  button,
  host,
  cards,
  pending,
  name,
  onSubmit,
  children,
}: {
  option: Pick<Option, 'paymentCosts'> &
    Partial<Pick<Option, 'targetIds' | 'vigorCost'>>
  label: string
  button: string
  host: PartyMember
  cards: Cards
  pending: boolean
  name?: (id: string) => string
  onSubmit: (selection: { targetId?: string; payment?: EventPayment }) => void
  children?: ReactNode
}) {
  const [target, setTarget] = useState('')
  const [choices, setChoices] = useState<Map<number, Map<string, number>>>(
    () => new Map(),
  )
  const { targetIds = [], vigorCost } = option
  const targetId =
    targetIds.length === 1
      ? targetIds[0]
      : targetIds.find((id) => id === target)
  const handCards = new Set<string>()
  const equipmentSlots = new Set<
    NonNullable<EventPayment['equipmentSlots']>[number]
  >()
  const resources = new Map<string, number>()
  let valid = !targetIds.length || targetId !== undefined

  function select(index: number, id: string, quantity: number) {
    setChoices((current) =>
      new Map(current).set(
        index,
        new Map(current.get(index)).set(id, quantity),
      ),
    )
  }

  const costs: ReactNode[] = []
  for (const cost of option.paymentCosts) {
    const { costIndex, text } = cost
    if (cost.type === 'automatic') {
      costs.push(<p key={costIndex}>{text}</p>)
      continue
    }

    const candidates =
      cost.type === 'resources'
        ? cost.eligibleResources.map(({ cardId, maxCopies }) => ({
            id: cardId,
            label: nameOf(cards, cardId, cardId),
            max: maxCopies,
          }))
        : cost.type === 'handCards'
          ? cost.eligibleCopyIds.map((id) => {
              const cardId = host.player.handCopies.find(
                ({ copyId }) => id === copyId,
              )?.cardId
              return {
                id,
                label: cardId ? `${nameOf(cards, cardId, cardId)} (${id})` : id,
                max: 1,
              }
            })
          : cost.eligibleSlots.map((id) => {
              const cardId = host.player.equipment[id]
              return {
                id,
                label: cardId ? `${nameOf(cards, cardId, cardId)} (${id})` : id,
                max: 1,
              }
            })

    let total = 0
    for (const { id, max } of candidates) {
      const quantity = choices.get(costIndex)?.get(id) ?? 0
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > max)
        valid = false
      if (quantity <= 0) continue
      total += quantity
      if (cost.type === 'handCards') {
        if (handCards.has(id)) valid = false
        handCards.add(id)
      } else if (cost.type === 'resources') {
        resources.set(id, (resources.get(id) ?? 0) + quantity)
      }
    }
    if (cost.type === 'equipmentSlots') {
      for (const slot of cost.eligibleSlots) {
        if (choices.get(costIndex)?.get(slot) !== 1) continue
        if (equipmentSlots.has(slot)) valid = false
        equipmentSlots.add(slot)
      }
    }
    if (total !== cost.count) valid = false

    costs.push(
      <fieldset key={costIndex}>
        <legend>
          {text} ({cost.count})
        </legend>
        {candidates.map(({ id, label, max }) => (
          <label key={id}>
            {label}{' '}
            {cost.type === 'resources' ? (
              <input
                type="number"
                min={0}
                max={max}
                step={1}
                value={choices.get(costIndex)?.get(id) ?? 0}
                onChange={(event) =>
                  select(costIndex, id, Number(event.target.value))
                }
              />
            ) : (
              <input
                type="checkbox"
                checked={choices.get(costIndex)?.get(id) === 1}
                onChange={(event) =>
                  select(costIndex, id, Number(event.target.checked))
                }
              />
            )}
          </label>
        ))}
      </fieldset>,
    )
  }

  function submit() {
    const payment: EventPayment = {
      ...(handCards.size > 0 && { handCards: [...handCards] }),
      ...(equipmentSlots.size > 0 && { equipmentSlots: [...equipmentSlots] }),
      ...(resources.size > 0 && {
        resources: [...resources].map(([cardId, copies]) => ({
          cardId,
          copies,
        })),
      }),
    }
    onSubmit({
      ...(targetId !== undefined && { targetId }),
      ...(Object.keys(payment).length > 0 && { payment }),
    })
  }

  return (
    <fieldset disabled={pending}>
      <legend>{label}</legend>
      {vigorCost !== undefined && <p>Vigor: {vigorCost}</p>}
      {targetIds.length > 0 && (
        <label>
          Alvo{' '}
          <select
            value={targetId ?? ''}
            onChange={(event) => setTarget(event.target.value)}
          >
            {!targetId && <option value="">Escolha um alvo</option>}
            {targetIds.map((id) => (
              <option key={id} value={id}>
                {name?.(id) ?? id}
              </option>
            ))}
          </select>
        </label>
      )}
      {costs}
      <button type="button" disabled={!valid} onClick={submit}>
        {button}
      </button>
      {children}
    </fieldset>
  )
}

/** Carta da habilidade: a do slot de equipamento ou a da montaria (FEAT-18). */
function abilityCardId(
  option: Combat['abilities'][number],
  host: PartyMember,
): string | null | undefined {
  return option.mountAbility
    ? host.player.mount?.cardId
    : host.player.equipment[option.equipmentSlot]
}

/** Origem enviada com a habilidade: `equipmentSlot` ou `mountAbility`. */
function abilitySource(option: Combat['abilities'][number]): AbilitySource {
  return option.mountAbility
    ? { mountAbility: true }
    : { equipmentSlot: option.equipmentSlot }
}

function equippedAbility(
  option: Combat['abilities'][number],
  host: PartyMember,
  cards: Cards,
) {
  const card = cards.get(abilityCardId(option, host) ?? '')
  if (card && 'abilities' in card) {
    return card.abilities.find(
      (ability) => 'id' in ability && ability.id === option.abilityId,
    )
  }
}

type Controls = {
  host: PartyMember
  cards: Cards
  pending: boolean
  onAction: (action: PartyAction) => void
}

export function TriggeredEffectPanel({
  choice,
  host,
  cards,
  pending,
  onAction,
}: Controls & { choice: NonNullable<Party['triggeredEffectChoice']> }) {
  const title = useId()
  if (
    host.id !== choice.memberId ||
    !host.player.availableActions.includes('resolveTriggeredEffect')
  )
    return null

  return (
    <section aria-labelledby={title}>
      <h2 id={title}>Efeitos disparados</h2>
      {choice.effects.map((effect) => {
        const { choiceId } = choice
        const { effectId, text } = effect
        const key = JSON.stringify([choiceId, effectId])
        const intent = {
          type: 'resolveTriggeredEffect',
          choiceId,
          effectId,
        } as const
        const decision = effect.mode === 'automatic' ? 'resolve' : 'decline'
        const decide = (
          <button
            type="button"
            disabled={pending}
            onClick={() => onAction({ ...intent, decision })}
          >
            {decision === 'resolve' ? 'Resolver' : 'Recusar'}
          </button>
        )
        if (effect.mode === 'optional' && effect.canPay) {
          return (
            <ProjectedAction
              key={key}
              option={effect}
              label={text}
              button="Pagar"
              host={host}
              cards={cards}
              pending={pending}
              onSubmit={({ payment }) =>
                onAction({
                  ...intent,
                  decision: 'pay',
                  ...(payment && { payment }),
                })
              }
            >
              {decide}
            </ProjectedAction>
          )
        }
        return (
          <fieldset key={key}>
            <legend>{text}</legend>
            {decide}
          </fieldset>
        )
      })}
    </section>
  )
}

export function PrepareAbilities({ host, cards, pending, onAction }: Controls) {
  if (!host.player.availableActions.includes('prepare')) return null
  return host.player.usableAbilities?.map((option) => (
    <ProjectedAction
      key={JSON.stringify(option)}
      option={option}
      label={`Preparar habilidade · ${equippedAbility(option, host, cards)?.name ?? option.abilityId}`}
      button="Usar habilidade"
      host={host}
      cards={cards}
      pending={pending}
      name={() => host.characterName}
      onSubmit={({ payment }) =>
        onAction({
          type: 'prepare',
          operation: 'useAbility',
          ...abilitySource(option),
          abilityId: option.abilityId,
          ...(payment && { payment }),
        })
      }
    />
  ))
}

export function CombatPanel({
  combat,
  host,
  cards,
  pending,
  onAction,
  names,
  catalogPending,
}: Omit<Controls, 'host'> & {
  combat: Combat
  host?: PartyMember
  names: ReadonlyMap<string, string>
  catalogPending: boolean
}) {
  const title = useId()
  const name = (id: string) => names.get(id) ?? id
  const ids = { combatId: combat.id, turnId: combat.turn.id }
  const actions =
    host?.id === combat.memberId ? host.player.availableActions : []
  const offer = (type: CombatAction['type']) => actions.includes(type)
  const { escape } = combat

  return (
    <section aria-labelledby={title}>
      <h2 id={title}>
        {combat.finalBoss && 'Chefe final · '}
        {combat.card.title}
      </h2>
      <p>
        Ciclo {combat.cycle}/{combat.maxCycles}
      </p>
      <p>
        Turno de {name(combat.turn.actorId)} ·{' '}
        {combat.turn.phase === 'prepare' ? 'Preparar' : 'Atacar'} · Ataques
        restantes: {combat.turn.attacksRemaining}
      </p>
      <ol aria-label="Ordem de combate">
        {combat.order.map((id) => (
          <li key={id}>{name(id)}</li>
        ))}
      </ol>
      <ul aria-label="Participantes">
        <li>
          {name(combat.memberId)}
          {host?.id === combat.memberId &&
            ` · PV ${host.player.health}/${host.player.maxHealth} · Vigor ${host.player.vigor}`}
        </li>
        {combat.enemies.map((enemy) => (
          <li key={enemy.id}>
            {name(enemy.id)} · PV {enemy.health}/{enemy.maxHealth}
            {enemy.vigor !== null && ` · Vigor ${enemy.vigor}`}
            {enemy.element && ` · ${enemy.element}`}
          </li>
        ))}
      </ul>
      {host &&
        offer('activateCombatEffect') &&
        combat.effects.map((option) => (
          <ProjectedAction
            key={JSON.stringify([ids, option])}
            option={option}
            label={option.text}
            button="Ativar efeito"
            host={host}
            cards={cards}
            pending={pending}
            name={name}
            onSubmit={(selection) =>
              onAction({
                type: 'activateCombatEffect',
                ...ids,
                effectId: option.effectId,
                ...selection,
              })
            }
          />
        ))}
      {host &&
        offer('useAbility') &&
        combat.abilities.map((option) => {
          const ability = equippedAbility(option, host, cards)
          const cardId = abilityCardId(option, host)
          const loadingAbility =
            catalogPending && !!cardId && !cards.has(cardId)
          const allOpponents =
            ability && 'target' in ability && ability.target === 'allOpponents'
          return (
            <ProjectedAction
              key={JSON.stringify([ids, option])}
              option={allOpponents ? { ...option, targetIds: [] } : option}
              label={ability?.name ?? option.abilityId}
              button="Usar habilidade"
              host={host}
              cards={cards}
              pending={pending || loadingAbility}
              name={name}
              onSubmit={(selection) =>
                onAction({
                  type: 'useAbility',
                  ...ids,
                  abilityId: option.abilityId,
                  ...abilitySource(option),
                  ...selection,
                })
              }
            />
          )
        })}
      {escape.unavailableReason && (
        <p>Fuga indisponível: {escape.unavailableReason}</p>
      )}
      {offer('escapeCombat') && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onAction({ type: 'escapeCombat', ...ids })}
        >
          Fugir · {escape.vigorCost} Vigor ·{' '}
          {escape.automatic ? 'automática' : `limiar ${escape.threshold}`}
        </button>
      )}
      {offer('combatAttack') &&
        combat.attackTargetIds.map((targetId) => (
          <button
            key={targetId}
            type="button"
            disabled={pending}
            onClick={() => onAction({ type: 'combatAttack', ...ids, targetId })}
          >
            Atacar {name(targetId)}
          </button>
        ))}
      {offer('endCombatTurn') && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onAction({ type: 'endCombatTurn', ...ids })}
        >
          Encerrar turno de combate
        </button>
      )}
    </section>
  )
}

const resolution = { victory: 'Vitória', defeat: 'Derrota', escaped: 'Fuga' }
const cause = {
  enemiesDefeated: 'inimigos derrotados',
  playerDown: 'jogador derrotado',
  escapeSucceeded: 'fuga bem-sucedida',
  cycleLimit: 'limite de ciclos',
}

function updateText(update: Update, name: (id: string) => string) {
  switch (update.type) {
    case 'combatStarted':
      return `Combate iniciado · ${update.cardTitle} · ${update.participants.map(({ id }) => name(id)).join(', ')}`
    case 'combatTurnStarted':
      return `Turno de ${name(update.actorId)} · ciclo ${update.cycle}`
    case 'combatAbilityUsed':
      return `${name(update.actorId)} usou ${update.abilityId}`
    case 'combatEffectActivated':
      return `${name(update.actorId)} ativou ${update.effectId}`
    case 'combatDamageResolved':
      return `${update.actorId === null ? 'Efeito' : name(update.actorId)} → ${name(update.targetId)} · ${update.hit === false ? 'errou' : `${update.damage} de dano`} · ${update.targetHealth} PV${update.reflectedDamage ? ` · Reflexão: ${update.reflectedDamage} de dano` : ''}`
    case 'combatEscapeAttempted':
      return `${name(update.actorId)} · fuga ${update.succeeded ? 'bem-sucedida' : 'falhou'} · ${update.vigorSpent} Vigor${update.total === null ? '' : ` · total ${update.total}, limiar ${update.threshold}`}`
    case 'combatEnded':
      return `Combate encerrado · ${resolution[update.result.resolution]}`
  }
}

export function CombatReport({
  result,
  updates,
  names,
  onViewCompletion,
}: {
  result: Result | null | undefined
  updates: Update[] | undefined
  names: ReadonlyMap<string, string>
  onViewCompletion?: () => void
}) {
  const started = updates?.find((update) => update.type === 'combatStarted')
  const displayNames = new Map(
    started?.participants.map(({ id, name }) => [id, name]),
  )
  const name = (id: string) => names.get(id) ?? displayNames.get(id) ?? id
  return (
    <div aria-live="polite">
      {updates && updates.length > 0 && (
        <ol aria-label="Transições de combate">
          {updates.map((update, index) => (
            <li key={index}>{updateText(update, name)}</li>
          ))}
        </ol>
      )}
      {result && (
        <p>
          {resolution[result.resolution]} · {cause[result.cause]} · Pico{' '}
          {result.peakDelta > 0 ? '+' : ''}
          {result.peakDelta}
          {result.playerDown && ' · jogador caído'}
        </p>
      )}
      {result?.finalBoss && result.resolution !== 'victory' && (
        <p>A dimensão não foi concluída. Você pode tentar de novo.</p>
      )}
      {onViewCompletion && (
        <button type="button" onClick={onViewCompletion}>
          Ver conclusão da dimensão
        </button>
      )}
    </div>
  )
}
