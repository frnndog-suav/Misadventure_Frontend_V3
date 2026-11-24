import type { Effect, ZoneEffect } from '../../api/effects'
import { effectMarkLabels, effectPolarityLabels } from '../labels'
import { useId, type ReactNode } from 'react'
import {
  useCatalogCard,
  useCollections,
  type Ability,
  type Rarity,
  type RuleText,
} from '../../api/catalog'
import { rarityLabels } from '../labels'
import { formatNumber } from './format'
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

/** "Coletada com" (REQ-48): o `toolKind` como veio (D-59 item 4); `null`, nada. */
export function ScavengeTool({ tool }: { tool: string | null }) {
  if (tool === null) return null
  return <p>Coletada com: {tool}</p>
}

/** Ajuste de preço (REQ-72, README 24.1): "Preço ×1,2". */
export function PriceAdjust({ multiplier }: { multiplier: number }) {
  return <p>Preço ×{formatNumber(multiplier)}</p>
}

/**
 * Nome da carta de `GET /catalog/cards/:cardId` (mesmo cache, D-48); até
 * chegar, "…"; com erro, o id da carta.
 */
export function CardName({ cardId }: { cardId: string }) {
  const { data, isError } = useCatalogCard(cardId)
  if (data !== undefined) return 'name' in data ? data.name : data.title
  return isError ? cardId : '…'
}

/** "Coleção: {nome}" (REQ-72): sem a coleção na lista (ou com erro), o id. */
export function CollectionName({ collectionId }: { collectionId: string }) {
  const { data } = useCollections()
  const name = data?.find((c) => c.id === collectionId)?.name
  return <p>Coleção: {name ?? collectionId}</p>
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

export function Abilities({ abilities }: { abilities: readonly Ability[] }) {
  return (
    <LabeledList
      label="Habilidades"
      items={abilities}
      render={(ability) =>
        'id' in ability ? (
          <AbilityDetails ability={ability} />
        ) : (
          <>
            <strong>{ability.name}</strong> <span>{ability.text}</span>
          </>
        )
      }
    />
  )
}

const abilityFormLabels = {
  targeted: 'Direcionada',
  projectile: 'Projétil',
  area: 'Área',
  continuous: 'Contínua',
  channeled: 'Canalizada',
  passive: 'Passiva',
}

function AbilityDetails({
  ability,
}: {
  ability: Extract<Ability, { id: string }>
}) {
  const { name, text, ...parameters } = ability
  return (
    <>
      <strong>{name}</strong> <span>{text}</span>
      <p>{abilityFormLabels[ability.form]}</p>
      {ability.power !== null && <p>Poder: {ability.power}</p>}
      <details>
        <summary>Parâmetros da habilidade</summary>
        <pre>{JSON.stringify(parameters, null, 2)}</pre>
      </details>
    </>
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

export function Effects({
  effects,
}: {
  effects: readonly (Effect | ZoneEffect)[]
}) {
  return (
    <LabeledList
      label="Efeitos"
      items={effects}
      render={(effect) => {
        const label =
          'polarity' in effect
            ? effectPolarityLabels[effect.polarity]
            : effect.mark && effectMarkLabels[effect.mark]
        return label ? `${label}: ${effect.text}` : effect.text
      }}
    />
  )
}
