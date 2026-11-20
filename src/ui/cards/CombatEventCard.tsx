import { useId } from 'react'
import type {
  CombatEventCard as CombatEventCardData,
  Enemy,
  Modifier,
} from '../../api/catalog'
import {
  behaviorLabels,
  elementLabels,
  enemyCategoryLabels,
  enemyTypeLabels,
} from '../labels'
import { Term } from '../Term'
import { formatNumber } from './format'
import { Abilities, CardFrame, EventOutcomes, LabeledList } from './parts'

/** Ordem de exibição dos 7 modificadores (CONTRATO §2.3). */
const modifierOrder = [
  'attack',
  'defense',
  'accuracy',
  'evasion',
  'celerity',
  'piercing',
  'reflection',
] as const satisfies readonly Modifier[]

/** Carta de evento de combate (REQ-13, README 14.1, 18.1). */
export function CombatEventCard({ card }: { card: CombatEventCardData }) {
  return (
    <CardFrame name={card.title} flavorText={card.flavorText}>
      <EventOutcomes
        goodOutcome={card.goodOutcome}
        badOutcome={card.badOutcome}
        noEscape={card.noEscape}
      />
      {card.escapeThreshold != null && (
        <p>Limiar de fuga: {card.escapeThreshold}</p>
      )}
      {(
        [
          ['Vitória', card.goodOutcome],
          ['Derrota', card.badOutcome],
        ] as const
      ).map(([label, outcome]) => {
        if (!('steps' in outcome)) return null
        if (outcome.steps.length === 0)
          return <p key={label}>Desfecho executável sem passos</p>
        return (
          <details key={label}>
            <summary>Passos do desfecho de {label.toLowerCase()}</summary>
            <pre>{JSON.stringify(outcome.steps, null, 2)}</pre>
          </details>
        )
      })}
      {card.enemies.map((enemy, i) => (
        <EnemyBlock key={i} enemy={enemy} />
      ))}
    </CardFrame>
  )
}

/** Bloco de um inimigo impresso na carta; valores como vieram do backend. */
function EnemyBlock({ enemy }: { enemy: Enemy }) {
  const titleId = useId()
  const title = enemy.count === 1 ? enemy.name : `${enemy.count}× ${enemy.name}`
  return (
    <section className="game-card-block" aria-labelledby={titleId}>
      <h4 id={titleId} className="game-card-block-title">
        {title}
      </h4>
      {enemy.flavorText !== null && (
        <p className="game-card-flavor">{enemy.flavorText}</p>
      )}
      <LabeledList
        label="Tipos"
        items={enemy.enemyTypes}
        render={(t) => enemyTypeLabels[t]}
      />
      <p>Criatura: {enemy.creature}</p>
      <p>Categoria: {enemyCategoryLabels[enemy.enemyCategory]}</p>
      {enemy.element !== null && (
        <p>Elemento: {elementLabels[enemy.element]}</p>
      )}
      <p>Vida {formatNumber(enemy.health)}</p>
      <LabeledList
        label="Modificadores"
        items={modifierOrder}
        render={(m) => (
          <>
            {formatNumber(enemy.modifiers[m])} <Term id={m} />
          </>
        )}
      />
      {enemy.vigor !== null && <p>Vigor {formatNumber(enemy.vigor)}</p>}
      <Abilities abilities={enemy.abilities} />
      {enemy.combatRules && (
        <details>
          <summary>Regras de combate</summary>
          <pre>{JSON.stringify(enemy.combatRules, null, 2)}</pre>
        </details>
      )}
      <p>Comportamento: {behaviorLabels[enemy.behavior]}</p>
    </section>
  )
}
