import type {
  Attribute,
  AttributeCard,
  Card,
  CardType,
  EquipmentSlot,
  ItemCategory,
  Modifier,
  PlayerClass,
  Rarity,
  ZoneAction,
  ZoneCard,
  ZoneType,
} from '../../api/catalog'
import type { CardInput } from '../../api/editor'
import { playerClassLabels, zoneActionLabels } from '../../ui/labels'

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

export interface EquipmentForm {
  type: 'equipment'
  slug: string
  name: string
  flavorText: string
  rarity: Rarity | ''
  slot: EquipmentSlot | ''
  tags: string[]
  modifiers: { modifier: Modifier | ''; value: string }[]
  peakRequirement: string
  classRestriction: PlayerClass[]
  blocksShield: boolean
  abilities: { name: string; text: string }[]
  effects: string[]
  /** Desligado = não refinável; o que foi digitado fica guardado. */
  refinement: { enabled: boolean; maxLevel: string; materials: string }
  /** Desligado = não encantável. */
  enchantment: { enabled: boolean; text: string }
  priceMultiplier: string
}

export interface ItemForm {
  type: 'item'
  slug: string
  name: string
  flavorText: string
  rarity: Rarity | ''
  itemCategory: ItemCategory | ''
  tags: string[]
  effects: string[]
}

export type CardForm = ZoneForm | AttributeForm | EquipmentForm | ItemForm

/** Tipos com formulário; os eventos chegam na T-25 (D-43). */
export type FormCardType = CardForm['type']

export function hasForm(type: CardType): type is FormCardType {
  return (
    type === 'zone' ||
    type === 'attribute' ||
    type === 'equipment' ||
    type === 'item'
  )
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
    case 'equipment':
      return {
        type,
        slug: '',
        name: '',
        flavorText: '',
        rarity: '',
        slot: '',
        tags: [],
        modifiers: [],
        peakRequirement: '',
        classRestriction: [],
        blocksShield: false,
        abilities: [],
        effects: [],
        refinement: { enabled: false, maxLevel: '', materials: '' },
        enchantment: { enabled: false, text: '' },
        priceMultiplier: '1',
      }
    case 'item':
      return {
        type,
        slug: '',
        name: '',
        flavorText: '',
        rarity: '',
        itemCategory: '',
        tags: [],
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

/** Classes na ordem do glossário (CONTRATO §2.4). */
export const classOrder = Object.keys(playerClassLabels) as PlayerClass[]

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
      return {
        type: 'equipment',
        slug: slugOf(card),
        name: card.name,
        flavorText: card.flavorText ?? '',
        rarity: card.rarity,
        slot: card.slot,
        tags: [...card.tags],
        modifiers: card.modifiers.map(({ modifier, value }) => ({
          modifier,
          value: String(value),
        })),
        peakRequirement:
          card.peakRequirement === null ? '' : String(card.peakRequirement),
        classRestriction: classOrder.filter((c) =>
          card.classRestriction.includes(c),
        ),
        blocksShield: card.blocksShield,
        abilities: card.abilities.map(({ name, text }) => ({ name, text })),
        effects: card.effects.map((e) => e.text),
        refinement:
          card.refinement === null
            ? { enabled: false, maxLevel: '', materials: '' }
            : {
                enabled: true,
                maxLevel: String(card.refinement.maxLevel),
                materials: card.refinement.materials.text,
              },
        enchantment:
          card.enchantment === null
            ? { enabled: false, text: '' }
            : { enabled: true, text: card.enchantment.text },
        priceMultiplier: String(card.priceMultiplier),
      }
    case 'item':
      return {
        type: 'item',
        slug: slugOf(card),
        name: card.name,
        flavorText: card.flavorText ?? '',
        rarity: card.rarity,
        itemCategory: card.itemCategory,
        tags: [...card.tags],
        effects: card.effects.map((e) => e.text),
      }
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
    case 'equipment': {
      const modifiers: { modifier: Modifier; value: number }[] = []
      for (const entry of form.modifiers) {
        const value = parseNumber(entry.value)
        if (entry.modifier === '' || value === null) return null
        modifiers.push({ modifier: entry.modifier, value })
      }
      const peak = parseNumber(form.peakRequirement)
      const price = parseNumber(form.priceMultiplier)
      const maxLevel = parseNumber(form.refinement.maxLevel)
      if (
        !filled(form.slug) ||
        !filled(form.name) ||
        form.rarity === '' ||
        form.slot === '' ||
        !form.tags.every(filled) ||
        (filled(form.peakRequirement) && peak === null) ||
        price === null ||
        !form.abilities.every((a) => filled(a.name) && filled(a.text)) ||
        !form.effects.every(filled) ||
        (form.refinement.enabled &&
          (maxLevel === null || !filled(form.refinement.materials))) ||
        (form.enchantment.enabled && !filled(form.enchantment.text))
      )
        return null
      return {
        slug: form.slug,
        type: 'equipment',
        name: form.name,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        rarity: form.rarity,
        slot: form.slot,
        tags: form.tags,
        modifiers,
        peakRequirement: peak,
        classRestriction: form.classRestriction,
        blocksShield: form.blocksShield,
        abilities: form.abilities,
        effects: form.effects.map((text) => ({ text })),
        refinement:
          form.refinement.enabled && maxLevel !== null
            ? { maxLevel, materials: { text: form.refinement.materials } }
            : null,
        enchantment: form.enchantment.enabled
          ? { text: form.enchantment.text }
          : null,
        priceMultiplier: price,
      }
    }
    case 'item': {
      if (
        !filled(form.slug) ||
        !filled(form.name) ||
        form.rarity === '' ||
        form.itemCategory === '' ||
        !form.tags.every(filled) ||
        !form.effects.every(filled)
      )
        return null
      return {
        slug: form.slug,
        type: 'item',
        name: form.name,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        rarity: form.rarity,
        itemCategory: form.itemCategory,
        tags: form.tags,
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
