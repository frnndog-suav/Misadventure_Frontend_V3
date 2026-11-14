import { useId, type ReactNode } from 'react'
import type { Rarity, RuleText } from '../../api/catalog'
import { rarityLabels } from '../labels'
import './cards.css'

/**
 * Partes comuns das cartas (REQ-09 a REQ-13, D-30). Regras comuns: flavor só
 * quando não é `null`; listas vazias e campos `null` não aparecem; `RuleText`
 * como veio (D-27).
 */

/** Moldura da carta: `article` com o nome como título acessível. */
export function CardFrame({
  name,
  rarity,
  flavorText,
  children,
}: {
  name: string
  rarity: Rarity
  flavorText: string | null
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <article className="game-card" aria-labelledby={titleId}>
      <h3 id={titleId} className="game-card-name">
        {name}
      </h3>
      <p className="game-card-rarity">{rarityLabels[rarity]}</p>
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

export function Effects({ effects }: { effects: readonly RuleText[] }) {
  return <LabeledList label="Efeitos" items={effects} render={(e) => e.text} />
}
