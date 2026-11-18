import {
  modifierSchema,
  type Attribute,
  type AttributeCard,
  type Card,
  type Element,
  type Enemy,
  type EnemyBehavior,
  type EnemyCategory,
  type EnemyType,
  type EquipmentSlot,
  type ItemCategory,
  type Modifier,
  type PlayerClass,
  type Rarity,
  type ZoneAction,
  type ZoneCard,
  type ZoneType,
} from '../../api/catalog'
import type { CardInput } from '../../api/editor'
import {
  enemyTypeLabels,
  playerClassLabels,
  zoneActionLabels,
} from '../../ui/labels'

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
  /** `''` = "Não se aplica" (`null`, REQ-31). */
  arrowLayout: NonNullable<ZoneCard['arrowLayout']> | ''
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
  /** FEAT-32: vazio = `null`. */
  scavengeTool: string
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
  /** FEAT-32: vazio = `null`. */
  toolKind: string
  scavengeZoneTypes: ZoneType[]
  /** FEAT-32: vazio = `null`. */
  scavengeTool: string
}

export interface RandomEventForm {
  type: 'randomEvent'
  slug: string
  title: string
  flavorText: string
  requirements: string[]
  goodOutcome: string
  badOutcome: string
  noEscape: boolean
}

export interface EnemyForm {
  name: string
  flavorText: string
  count: string
  enemyTypes: EnemyType[]
  creature: string
  enemyCategory: EnemyCategory | ''
  /** `''` = sem elemento (`null`). */
  element: Element | ''
  health: string
  modifiers: Record<Modifier, string>
  /** Vazio = sem Vigor (`null`). */
  vigor: string
  abilities: { name: string; text: string }[]
  behavior: EnemyBehavior | ''
}

export interface CombatEventForm {
  type: 'combatEvent'
  slug: string
  title: string
  flavorText: string
  enemies: EnemyForm[]
  goodOutcome: string
  badOutcome: string
  noEscape: boolean
}

export interface DimensionForm {
  type: 'dimension'
  slug: string
  name: string
  flavorText: string
  releaseOrder: string
  /** Vazio = `null` (sorteada pelo backend, REQ-31). */
  arrivalZoneTitle: string
  effects: string[]
  /** FEAT-32 (README 3.4). */
  rewardDecks: {
    zoneType: ZoneType | ''
    cards: { cardId: string; copies: string }[]
  }[]
}

export type CardForm =
  | ZoneForm
  | AttributeForm
  | EquipmentForm
  | ItemForm
  | RandomEventForm
  | CombatEventForm
  | DimensionForm

export type FormCardType = CardForm['type']

/** Modificadores na ordem do glossário (CONTRATO §2.3). */
export const modifierOrder = modifierSchema.options

/** Tipos de inimigo na ordem do glossário. */
export const enemyTypeOrder = Object.keys(enemyTypeLabels) as EnemyType[]

/** Inimigo novo: quantidade 1 e modificadores 0; o resto vazio (D-45). */
export function emptyEnemy(): EnemyForm {
  return {
    name: '',
    flavorText: '',
    count: '1',
    enemyTypes: [],
    creature: '',
    enemyCategory: '',
    element: '',
    health: '',
    modifiers: Object.fromEntries(modifierOrder.map((m) => [m, '0'])) as Record<
      Modifier,
      string
    >,
    vigor: '',
    abilities: [],
    behavior: '',
  }
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
        arrowLayout: '',
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
        scavengeTool: '',
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
        toolKind: '',
        scavengeZoneTypes: [],
        scavengeTool: '',
      }
    case 'randomEvent':
      return {
        type,
        slug: '',
        title: '',
        flavorText: '',
        requirements: [],
        goodOutcome: '',
        badOutcome: '',
        noEscape: false,
      }
    case 'combatEvent':
      return {
        type,
        slug: '',
        title: '',
        flavorText: '',
        enemies: [],
        goodOutcome: '',
        badOutcome: '',
        noEscape: false,
      }
    case 'dimension':
      return {
        type,
        slug: '',
        name: '',
        flavorText: '',
        releaseOrder: '',
        arrivalZoneTitle: '',
        effects: [],
        rewardDecks: [],
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

const numberText = (value: number | null): string =>
  value === null ? '' : String(value)

/** Valores de uma carta recebida. */
export function formFromCard(card: Card): CardForm {
  switch (card.type) {
    case 'zone':
      return {
        type: 'zone',
        slug: slugOf(card),
        title: card.title,
        zoneType: card.zoneType,
        location: card.location,
        connectionArrows: String(card.connectionArrows),
        arrowLayout: card.arrowLayout ?? '',
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
        scavengeTool: card.scavengeTool ?? '',
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
        toolKind: card.toolKind ?? '',
        scavengeZoneTypes: [...card.scavengeZoneTypes],
        scavengeTool: card.scavengeTool ?? '',
      }
    case 'randomEvent':
      return {
        type: 'randomEvent',
        slug: slugOf(card),
        title: card.title,
        flavorText: card.flavorText ?? '',
        requirements: card.requirements.map((r) => r.text),
        goodOutcome: card.goodOutcome.text,
        badOutcome: card.badOutcome.text,
        noEscape: card.noEscape,
      }
    case 'combatEvent':
      return {
        type: 'combatEvent',
        slug: slugOf(card),
        title: card.title,
        flavorText: card.flavorText ?? '',
        enemies: card.enemies.map((enemy) => ({
          name: enemy.name,
          flavorText: enemy.flavorText ?? '',
          count: String(enemy.count),
          enemyTypes: enemyTypeOrder.filter((t) =>
            enemy.enemyTypes.includes(t),
          ),
          creature: enemy.creature,
          enemyCategory: enemy.enemyCategory,
          element: enemy.element ?? '',
          health: String(enemy.health),
          modifiers: Object.fromEntries(
            modifierOrder.map((m) => [m, String(enemy.modifiers[m])]),
          ) as Record<Modifier, string>,
          vigor: numberText(enemy.vigor),
          abilities: enemy.abilities.map(({ name, text }) => ({ name, text })),
          behavior: enemy.behavior,
        })),
        goodOutcome: card.goodOutcome.text,
        badOutcome: card.badOutcome.text,
        noEscape: card.noEscape,
      }
    case 'dimension':
      return {
        type: 'dimension',
        slug: slugOf(card),
        name: card.name,
        flavorText: card.flavorText ?? '',
        releaseOrder: String(card.releaseOrder),
        arrivalZoneTitle: card.arrivalZoneTitle ?? '',
        effects: card.effects.map((e) => e.text),
        rewardDecks: card.rewardDecks.map(({ zoneType, cards }) => ({
          zoneType,
          cards: cards.map(({ cardId, copies }) => ({
            cardId,
            copies: String(copies),
          })),
        })),
      }
    default: {
      const _exhaustive: never = card
      return _exhaustive
    }
  }
}

export const filled = (text: string): boolean => text.trim() !== ''

export function parseNumber(text: string): number | null {
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

/** Um inimigo no formato do contrato, ou `null` se falta formato. */
function toEnemy(form: EnemyForm): Enemy | null {
  const count = parseNumber(form.count)
  const health = parseNumber(form.health)
  const vigor = parseNumber(form.vigor)
  const modifiers: Partial<Record<Modifier, number>> = {}
  for (const m of modifierOrder) {
    const value = parseNumber(form.modifiers[m])
    if (value === null) return null
    modifiers[m] = value
  }
  if (
    !filled(form.name) ||
    count === null ||
    !filled(form.creature) ||
    form.enemyCategory === '' ||
    health === null ||
    (filled(form.vigor) && vigor === null) ||
    !form.abilities.every((a) => filled(a.name) && filled(a.text)) ||
    form.behavior === ''
  )
    return null
  return {
    name: form.name,
    flavorText: filled(form.flavorText) ? form.flavorText : null,
    count,
    enemyTypes: form.enemyTypes,
    creature: form.creature,
    enemyCategory: form.enemyCategory,
    element: form.element === '' ? null : form.element,
    health,
    modifiers: modifiers as Record<Modifier, number>,
    vigor,
    abilities: form.abilities,
    behavior: form.behavior,
  }
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
        arrowLayout: form.arrowLayout === '' ? null : form.arrowLayout,
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
        scavengeTool: filled(form.scavengeTool) ? form.scavengeTool : null,
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
        toolKind: filled(form.toolKind) ? form.toolKind : null,
        scavengeZoneTypes: form.scavengeZoneTypes,
        scavengeTool: filled(form.scavengeTool) ? form.scavengeTool : null,
      }
    }
    case 'randomEvent': {
      if (
        !filled(form.slug) ||
        !filled(form.title) ||
        !form.requirements.every(filled) ||
        !filled(form.goodOutcome) ||
        !filled(form.badOutcome)
      )
        return null
      return {
        slug: form.slug,
        type: 'randomEvent',
        title: form.title,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        requirements: form.requirements.map((text) => ({ text })),
        goodOutcome: { text: form.goodOutcome },
        badOutcome: { text: form.badOutcome },
        noEscape: form.noEscape,
      }
    }
    case 'combatEvent': {
      const enemies: Enemy[] = []
      for (const enemy of form.enemies) {
        const parsed = toEnemy(enemy)
        if (parsed === null) return null
        enemies.push(parsed)
      }
      if (
        !filled(form.slug) ||
        !filled(form.title) ||
        !filled(form.goodOutcome) ||
        !filled(form.badOutcome)
      )
        return null
      return {
        slug: form.slug,
        type: 'combatEvent',
        title: form.title,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        enemies,
        goodOutcome: { text: form.goodOutcome },
        badOutcome: { text: form.badOutcome },
        noEscape: form.noEscape,
      }
    }
    case 'dimension': {
      const releaseOrder = parseNumber(form.releaseOrder)
      const rewardDecks: {
        zoneType: ZoneType
        cards: { cardId: string; copies: number }[]
      }[] = []
      for (const deck of form.rewardDecks) {
        const cards: { cardId: string; copies: number }[] = []
        for (const entry of deck.cards) {
          const copies = parseNumber(entry.copies)
          if (!filled(entry.cardId) || copies === null) return null
          cards.push({ cardId: entry.cardId, copies })
        }
        if (deck.zoneType === '') return null
        rewardDecks.push({ zoneType: deck.zoneType, cards })
      }
      if (
        !filled(form.slug) ||
        !filled(form.name) ||
        releaseOrder === null ||
        !form.effects.every(filled)
      )
        return null
      return {
        slug: form.slug,
        type: 'dimension',
        name: form.name,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        releaseOrder,
        arrivalZoneTitle: filled(form.arrivalZoneTitle)
          ? form.arrivalZoneTitle
          : null,
        effects: form.effects.map((text) => ({ text })),
        rewardDecks,
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
