import type {
  Attribute,
  AttributeCard,
  Card,
  CardType,
  Rarity,
  ZoneAction,
  ZoneCard,
  ZoneType,
} from '../../api/catalog'
import type { CardInput } from '../../api/editor'
import { zoneActionLabels } from '../../ui/labels'

/**
 * Valores do formulário de carta (REQ-21, D-43). Números ficam como texto e
 * seleções podem estar vazias (`''`) até o autor escolher; `toInput` só
 * confere formato (número, texto obrigatório, seleção feita), nunca regra.
 */

type Polarity = ZoneCard['effects'][number]['polarity']
type AttributeKind = AttributeCard['attributeKind']

export interface ZoneForm {
  type: 'zone'
  slug: string
  title: string
  zoneType: ZoneType | ''
  location: string
  connectionArrows: string
  zoneActions: ZoneAction[]
  effects: { text: string; polarity: Polarity }[]
}

export interface AttributeForm {
  type: 'attribute'
  slug: string
  name: string
  flavorText: string
  rarity: Rarity | ''
  attributeKind: AttributeKind | ''
  attributes: (Attribute | '')[]
  effects: string[]
}

export type CardForm = ZoneForm | AttributeForm

/** Tipos com formulário; os demais chegam na T-24 e na T-25 (D-43). */
export type FormCardType = CardForm['type']

export function hasForm(type: CardType): type is FormCardType {
  return type === 'zone' || type === 'attribute'
}

export function emptyForm(type: FormCardType): CardForm {
  switch (type) {
    case 'zone':
      return {
        type,
        slug: '',
        title: '',
        zoneType: '',
        location: '',
        connectionArrows: '',
        zoneActions: [],
        effects: [],
      }
    case 'attribute':
      return {
        type,
        slug: '',
        name: '',
        flavorText: '',
        rarity: '',
        attributeKind: '',
        attributes: [],
        effects: [],
      }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

/** Ações na ordem do glossário (CONTRATO §2.5). */
export const zoneActionOrder = Object.keys(zoneActionLabels) as ZoneAction[]

/** `id` = `<collectionId>.<slug>` (CONTRATO §3 FEAT-31). */
function slugOf(card: Card): string {
  const prefix = `${card.collectionId}.`
  return card.id.startsWith(prefix) ? card.id.slice(prefix.length) : card.id
}

/** Valores de uma carta recebida; `null` para tipos ainda sem formulário. */
export function formFromCard(card: Card): CardForm | null {
  switch (card.type) {
    case 'zone':
      return {
        type: 'zone',
        slug: slugOf(card),
        title: card.title,
        zoneType: card.zoneType,
        location: card.location,
        connectionArrows: String(card.connectionArrows),
        zoneActions: zoneActionOrder.filter((a) =>
          card.zoneActions.includes(a),
        ),
        effects: card.effects.map(({ text, polarity }) => ({ text, polarity })),
      }
    case 'attribute':
      return {
        type: 'attribute',
        slug: slugOf(card),
        name: card.name,
        flavorText: card.flavorText ?? '',
        rarity: card.rarity,
        attributeKind: card.attributeKind,
        attributes: [...card.attributes],
        effects: card.effects.map((e) => e.text),
      }
    case 'equipment':
    case 'item':
    case 'randomEvent':
    case 'combatEvent':
      return null
    default: {
      const _exhaustive: never = card
      return _exhaustive
    }
  }
}

const filled = (text: string): boolean => text.trim() !== ''

function parseNumber(text: string): number | null {
  if (!filled(text)) return null
  const value = Number(text.trim())
  return Number.isFinite(value) ? value : null
}

function chosen<T extends string>(values: readonly (T | '')[]): T[] | null {
  const result: T[] = []
  for (const value of values) {
    if (value === '') return null
    result.push(value)
  }
  return result
}

/** O corpo do envio, ou `null` se falta formato (Salvar desabilitado). */
export function toInput(form: CardForm): CardInput | null {
  switch (form.type) {
    case 'zone': {
      const arrows = parseNumber(form.connectionArrows)
      if (
        !filled(form.slug) ||
        !filled(form.title) ||
        !filled(form.location) ||
        form.zoneType === '' ||
        arrows === null ||
        !form.effects.every((e) => filled(e.text))
      )
        return null
      return {
        slug: form.slug,
        type: 'zone',
        title: form.title,
        zoneType: form.zoneType,
        location: form.location,
        connectionArrows: arrows,
        zoneActions: form.zoneActions,
        effects: form.effects,
      }
    }
    case 'attribute': {
      const attributes = chosen(form.attributes)
      if (
        !filled(form.slug) ||
        !filled(form.name) ||
        form.rarity === '' ||
        form.attributeKind === '' ||
        attributes === null ||
        !form.effects.every(filled)
      )
        return null
      return {
        slug: form.slug,
        type: 'attribute',
        name: form.name,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        rarity: form.rarity,
        attributeKind: form.attributeKind,
        attributes,
        effects: form.effects.map((text) => ({ text })),
      }
    }
    default: {
      const _exhaustive: never = form
      return _exhaustive
    }
  }
}

/** A carta que o `CardInput` formaria na coleção (para a pré-visualização). */
export function inputToCard(input: CardInput, collectionId: string): unknown {
  const { slug, ...rest } = input
  return { ...rest, id: `${collectionId}.${slug}`, collectionId }
}

export function sameForm(a: CardForm, b: CardForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
