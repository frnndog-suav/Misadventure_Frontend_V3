import { useId, type ReactNode } from 'react'
import type { Rarity, RuleText } from '../../api/catalog'
import { rarityLabels } from '../labels'
import './cards.css'

/**
 * Partes comuns das cartas (REQ-09 a REQ-13, D-30). Regras comuns: flavor só
 * quando não é `null`; listas vazias e campos `null` não aparecem; `RuleText`
 * como veio (D-27).
 */

/**
 * Moldura da carta: `article` com o nome (ou título) como título acessível.
 * Zona e eventos não têm raridade; zona não tem flavor (CONTRATO §3 FEAT-04).
 */
export function CardFrame({
  name,
  rarity,
  flavorText = null,
  children,
}: {
  name: string
  rarity?: Rarity
  flavorText?: string | null
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <article className="game-card" aria-labelledby={titleId}>
      <h3 id={titleId} className="game-card-name">
        {name}
      </h3>
      {rarity !== undefined && (
        <p className="game-card-rarity">{rarityLabels[rarity]}</p>
      )}
      {children}
      {flavorText !== null && <p className="game-card-flavor">{flavorText}</p>}
    </article>
  )
}

/** Lista rotulada que some quando vazia. */
export function LabeledList<T>({
  label,
  items,
  render,
}: {
  label: string
  items: readonly T[]
  render: (item: T, index: number) => ReactNode
}) {
  if (items.length === 0) return null
  return (
    <ul className="game-card-list" aria-label={label}>
      {items.map((item, i) => (
        <li key={i}>{render(item, i)}</li>
      ))}
    </ul>
  )
}

export function Tags({ tags }: { tags: readonly string[] }) {
  return (
    <LabeledList
      label="Etiquetas"
      items={tags}
      render={(tag) => <span className="game-card-tag">{tag}</span>}
    />
  )
}

export function Abilities({
  abilities,
}: {
  abilities: readonly { name: string; text: string }[]
}) {
  return (
    <LabeledList
      label="Habilidades"
      items={abilities}
      render={(a) => (
        <>
          <strong>{a.name}</strong> <span>{a.text}</span>
        </>
      )}
    />
  )
}

/** Bloco com título curto e um texto de regra (D-27). */
export function RuleBlock({ title, rule }: { title: string; rule: RuleText }) {
  return (
    <div className="game-card-block">
      <p className="game-card-block-title">{title}</p>
      <p>{rule.text}</p>
    </div>
  )
}

/** Desfecho dos eventos (REQ-13): coisa boa, coisa ruim e "Sem fuga". */
export function EventOutcomes({
  goodOutcome,
  badOutcome,
  noEscape,
}: {
  goodOutcome: RuleText
  badOutcome: RuleText
  noEscape: boolean
}) {
  return (
    <>
      <RuleBlock title="Coisa boa" rule={goodOutcome} />
      <RuleBlock title="Coisa ruim" rule={badOutcome} />
      {noEscape && <p>Sem fuga</p>}
    </>
  )
}

export function Effects({ effects }: { effects: readonly RuleText[] }) {
  return <LabeledList label="Efeitos" items={effects} render={(e) => e.text} />
}
