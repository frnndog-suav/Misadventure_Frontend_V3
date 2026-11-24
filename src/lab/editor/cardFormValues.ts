import { z } from 'zod'
import {
  effectSchema,
  zoneEffectSchema,
  type Effect,
  type ZoneEffect,
} from '../../api/effects'
import {
  modifierSchema,
  zoneQuestCardSchema,
  type Ability,
  type CombatEventCard,
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
import type { randomEventRulesSchema } from '../../api/randomEvents'
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

export const effectPartLabels = {
  trigger: 'Gatilho',
  cost: 'Custo',
  activation: 'Ativação',
  duration: 'Duração',
} as const

export const effectParts = Object.keys(
  effectPartLabels,
) as (keyof typeof effectPartLabels)[]

export type EffectForm = Record<keyof typeof effectPartLabels, string> & {
  text: string
  mark: Effect['mark']
  polarity: ZoneEffect['polarity']
}

function effectToForm(effect: Effect | ZoneEffect): EffectForm {
  return {
    text: effect.text,
    trigger: JSON.stringify(effect.trigger),
    cost: JSON.stringify(effect.cost),
    activation: JSON.stringify(effect.activation),
    duration: JSON.stringify(effect.duration),
    mark: 'mark' in effect ? effect.mark : null,
    polarity: 'polarity' in effect ? effect.polarity : 'positive',
  }
}

export function emptyEffect(): EffectForm {
  return effectToForm({
    text: '',
    trigger: null,
    cost: [],
    activation: [],
    duration: { kind: 'immediate' },
    mark: null,
  })
}

export function parseEffectPart(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function toEffects<T>(
  forms: EffectForm[],
  schema: z.ZodType<T>,
): T[] | undefined {
  if (!forms.every((effect) => filled(effect.text))) return undefined
  return z.array(schema).safeParse(
    forms.map((effect) => ({
      ...effect,
      trigger: parseEffectPart(effect.trigger),
      cost: parseEffectPart(effect.cost),
      activation: parseEffectPart(effect.activation),
      duration: parseEffectPart(effect.duration),
    })),
  ).data
}
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
  questDeck?: string[]
  zoneActions: ZoneAction[]
  effects: EffectForm[]
  /** FEAT-16 (REQ-72): desmarcado = `market: null`; o que foi digitado fica guardado. */
  marketEnabled: boolean
  marketStock: string[]
  marketSingles: boolean
}

export interface AttributeForm {
  type: 'attribute'
  slug: string
  name: string
  flavorText: string
  rarity: Rarity | ''
  attributeKind: AttributeKind | ''
  attributes: (Attribute | '')[]
  effects: EffectForm[]
  /** FEAT-16 (REQ-72). */
  priceMultiplier: string
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
  abilities: AbilityForm[]
  effects: EffectForm[]
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
  effects: EffectForm[]
  /** FEAT-32: vazio = `null`. */
  toolKind: string
  scavengeZoneTypes: ZoneType[]
  /** FEAT-32: vazio = `null`. */
  scavengeTool: string
  /** FEAT-16 (REQ-72). */
  priceMultiplier: string
  /** Vazio = `null`. */
  stockPrice: string
  stockQuantity: string
  /** Vazio = `null` ("Nenhuma"). */
  boosterCollectionId: string
}

export interface RandomEventForm {
  type: 'randomEvent'
  slug: string
  title: string
  flavorText: string
  requirements: string[]
  rules?: {
    requirements: string
    goodSteps: string
    badSteps: string
    threshold: string
  }
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
  abilities: AbilityForm[]
  combatRules?: string
  behavior: EnemyBehavior | ''
}

export interface AbilityForm {
  name: string
  text: string
  executable?: string
}

function abilityFromCard({ name, text, ...fields }: Ability): AbilityForm {
  return 'id' in fields
    ? { name, text, executable: JSON.stringify(fields, null, 2) }
    : { name, text }
}

const jsonObject = z.record(z.string(), z.unknown())
const jsonList = z.array(z.unknown())

function parseOptionalJson<T>(value: string | undefined, schema: z.ZodType<T>) {
  if (!value?.trim()) return undefined
  try {
    const result = schema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function toAbilities(forms: AbilityForm[]): Ability[] | null {
  const abilities: Ability[] = []
  for (const { name, text, executable } of forms) {
    const fields = parseOptionalJson(executable, jsonObject)
    if (!filled(name) || !filled(text) || fields === null) return null
    abilities.push({ ...fields, name, text } as Ability)
  }
  return abilities
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
  escapeThreshold?: string
  goodSteps?: string
  badSteps?: string
}

export interface DimensionForm {
  type: 'dimension'
  slug: string
  name: string
  flavorText: string
  releaseOrder: string
  /** Vazio = `null` (sorteada pelo backend, REQ-31). */
  arrivalZoneTitle: string
  effects: EffectForm[]
  /** FEAT-32 (README 3.4). */
  rewardDecks: {
    zoneType: ZoneType | ''
    cards: { cardId: string; copies: string }[]
  }[]
  eventDecks?: DimensionForm['rewardDecks']
}

function deckForm(
  decks: { zoneType: ZoneType; cards: { cardId: string; copies: number }[] }[],
): DimensionForm['rewardDecks'] {
  return decks.map(({ zoneType, cards }) => ({
    zoneType,
    cards: cards.map(({ cardId, copies }) => ({
      cardId,
      copies: String(copies),
    })),
  }))
}

function deckInput(decks: DimensionForm['rewardDecks']) {
  const result: {
    zoneType: ZoneType
    cards: { cardId: string; copies: number }[]
  }[] = []
  for (const deck of decks) {
    if (deck.zoneType === '') return null
    const cards: { cardId: string; copies: number }[] = []
    for (const entry of deck.cards) {
      const copies = parseNumber(entry.copies)
      if (!filled(entry.cardId) || copies === null) return null
      cards.push({ cardId: entry.cardId, copies })
    }
    result.push({ zoneType: deck.zoneType, cards })
  }
  return result
}

export type QuestStageForm = {
  type: 'interaction' | 'objectives' | 'randomEvent' | 'combatEvent'
  text: string
  locationType: 'zoneType' | 'zoneTitle'
  zoneType: ZoneType | ''
  title: string
  randomEventSuccesses: string
  combatVictories: string
  eventCardId: string
  combat: string
}

export function emptyQuestStage(): QuestStageForm {
  return {
    type: 'interaction',
    text: '',
    locationType: 'zoneType',
    zoneType: '',
    title: '',
    randomEventSuccesses: '0',
    combatVictories: '0',
    eventCardId: '',
    combat: '',
  }
}

export type QuestForm = {
  type: 'zoneQuest'
  slug: string
  title: string
  summary: string
  stages: QuestStageForm[]
  rewards: string
}

export type CardForm =
  | QuestForm
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
    case 'zoneQuest':
      return {
        type,
        slug: '',
        title: '',
        summary: '',
        stages: [],
        rewards: '[]',
      }
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
        marketEnabled: false,
        marketStock: [],
        marketSingles: false,
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
        priceMultiplier: '1',
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
        priceMultiplier: '1',
        stockPrice: '',
        stockQuantity: '1',
        boosterCollectionId: '',
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
    case 'zoneQuest':
      return {
        type: card.type,
        slug: slugOf(card),
        title: card.title,
        summary: card.summary,
        stages: card.stages.map((stage) => ({
          ...emptyQuestStage(),
          type: stage.type,
          text: stage.text,
          locationType: stage.location.type,
          ...(stage.location.type === 'zoneTitle'
            ? { title: stage.location.title }
            : { zoneType: stage.location.zoneType }),
          ...(stage.type === 'objectives'
            ? {
                randomEventSuccesses: String(stage.randomEventSuccesses),
                combatVictories: String(stage.combatVictories),
              }
            : {}),
          ...(stage.type === 'randomEvent'
            ? { eventCardId: stage.eventCardId }
            : {}),
          ...(stage.type === 'combatEvent'
            ? { combat: JSON.stringify(stage.combat, null, 2) }
            : {}),
        })),
        rewards: JSON.stringify(card.rewards, null, 2),
      }
    case 'zone':
      return {
        type: 'zone',
        slug: slugOf(card),
        title: card.title,
        zoneType: card.zoneType,
        location: card.location,
        connectionArrows: String(card.connectionArrows),
        arrowLayout: card.arrowLayout ?? '',
        questDeck: card.questDeck.length ? card.questDeck : undefined,
        zoneActions: zoneActionOrder.filter((a) =>
          card.zoneActions.includes(a),
        ),
        effects: card.effects.map(effectToForm),
        marketEnabled: card.market !== null,
        marketStock: card.market?.stock ?? [],
        marketSingles: card.market?.singles ?? false,
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
        effects: card.effects.map(effectToForm),
        priceMultiplier: String(card.priceMultiplier),
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
        abilities: card.abilities.map(abilityFromCard),
        effects: card.effects.map(effectToForm),
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
        effects: card.effects.map(effectToForm),
        toolKind: card.toolKind ?? '',
        scavengeZoneTypes: [...card.scavengeZoneTypes],
        scavengeTool: card.scavengeTool ?? '',
        priceMultiplier: String(card.priceMultiplier),
        stockPrice: card.stockPrice === null ? '' : String(card.stockPrice),
        stockQuantity: String(card.stockQuantity),
        boosterCollectionId: card.boosterCollectionId ?? '',
      }
    case 'randomEvent':
      return {
        type: 'randomEvent',
        slug: slugOf(card),
        title: card.title,
        flavorText: card.flavorText ?? '',
        requirements: card.requirements.map((r) => r.text),
        rules:
          card.escapeThreshold === undefined
            ? undefined
            : {
                requirements: JSON.stringify(card.requirements, null, 2),
                goodSteps: JSON.stringify(card.goodOutcome.steps, null, 2),
                badSteps: JSON.stringify(card.badOutcome.steps, null, 2),
                threshold:
                  card.escapeThreshold === null
                    ? ''
                    : String(card.escapeThreshold),
              },
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
          abilities: enemy.abilities.map(abilityFromCard),
          behavior: enemy.behavior,
          combatRules: JSON.stringify(enemy.combatRules, null, 2),
        })),
        goodOutcome: card.goodOutcome.text,
        badOutcome: card.badOutcome.text,
        noEscape: card.noEscape,
        escapeThreshold:
          card.escapeThreshold === undefined
            ? undefined
            : numberText(card.escapeThreshold),
        goodSteps:
          'steps' in card.goodOutcome
            ? JSON.stringify(card.goodOutcome.steps, null, 2)
            : undefined,
        badSteps:
          'steps' in card.badOutcome
            ? JSON.stringify(card.badOutcome.steps, null, 2)
            : undefined,
      }
    case 'dimension':
      return {
        type: 'dimension',
        slug: slugOf(card),
        name: card.name,
        flavorText: card.flavorText ?? '',
        releaseOrder: String(card.releaseOrder),
        arrivalZoneTitle: card.arrivalZoneTitle ?? '',
        effects: card.effects.map(effectToForm),
        eventDecks: card.eventDecks && deckForm(card.eventDecks),
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
  const abilities = toAbilities(form.abilities)
  const combatRules = parseOptionalJson(form.combatRules, jsonObject)
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
    abilities === null ||
    combatRules === null ||
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
    abilities,
    ...(combatRules && { combatRules: combatRules as Enemy['combatRules'] }),
    behavior: form.behavior,
  }
}

/** O corpo do envio, ou `null` se falta formato (Salvar desabilitado). */
export function toInput(form: CardForm): CardInput | null {
  switch (form.type) {
    case 'zoneQuest': {
      if (!filled(form.slug) || !filled(form.title)) return null
      const stages = form.stages.map((stage) => {
        const location =
          stage.locationType === 'zoneType'
            ? { type: stage.locationType, zoneType: stage.zoneType }
            : { type: stage.locationType, title: stage.title }
        const base = { type: stage.type, text: stage.text, location }
        switch (stage.type) {
          case 'interaction':
            return base
          case 'objectives':
            return {
              ...base,
              randomEventSuccesses: parseNumber(stage.randomEventSuccesses),
              combatVictories: parseNumber(stage.combatVictories),
            }
          case 'randomEvent':
            return { ...base, eventCardId: stage.eventCardId }
          case 'combatEvent':
            return { ...base, combat: parseEffectPart(stage.combat) }
        }
      })
      const result = zoneQuestCardSchema
        .omit({ id: true, collectionId: true })
        .safeParse({
          type: form.type,
          title: form.title,
          summary: form.summary,
          stages,
          rewards: parseEffectPart(form.rewards),
        })
      return result.success ? { ...result.data, slug: form.slug } : null
    }
    case 'zone': {
      const effects = toEffects(form.effects, zoneEffectSchema)
      if (effects === undefined) return null
      const arrows = parseNumber(form.connectionArrows)
      if (
        !filled(form.slug) ||
        !filled(form.title) ||
        !filled(form.location) ||
        form.zoneType === '' ||
        arrows === null
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
        ...(form.questDeck !== undefined ? { questDeck: form.questDeck } : {}),
        zoneActions: form.zoneActions,
        effects,
        market: form.marketEnabled
          ? { stock: form.marketStock, singles: form.marketSingles }
          : null,
      }
    }
    case 'attribute': {
      const effects = toEffects(form.effects, effectSchema)
      if (effects === undefined) return null
      const attributes = chosen(form.attributes)
      const price = parseNumber(form.priceMultiplier)
      if (
        price === null ||
        !filled(form.slug) ||
        !filled(form.name) ||
        form.rarity === '' ||
        form.attributeKind === '' ||
        attributes === null
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
        effects,
        priceMultiplier: price,
      }
    }
    case 'equipment': {
      const abilities = toAbilities(form.abilities)
      const effects = toEffects(form.effects, effectSchema)
      if (effects === undefined) return null
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
        abilities === null ||
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
        abilities,
        effects,
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
      const effects = toEffects(form.effects, effectSchema)
      if (effects === undefined) return null
      const price = parseNumber(form.priceMultiplier)
      const stockPrice = parseNumber(form.stockPrice)
      const stockQuantity = parseNumber(form.stockQuantity)
      if (
        price === null ||
        (filled(form.stockPrice) && stockPrice === null) ||
        stockQuantity === null ||
        !filled(form.slug) ||
        !filled(form.name) ||
        form.rarity === '' ||
        form.itemCategory === '' ||
        !form.tags.every(filled)
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
        effects,
        toolKind: filled(form.toolKind) ? form.toolKind : null,
        scavengeZoneTypes: form.scavengeZoneTypes,
        scavengeTool: filled(form.scavengeTool) ? form.scavengeTool : null,
        priceMultiplier: price,
        stockPrice,
        stockQuantity,
        boosterCollectionId: filled(form.boosterCollectionId)
          ? form.boosterCollectionId
          : null,
      }
    }
    case 'randomEvent': {
      if (
        !filled(form.slug) ||
        !filled(form.title) ||
        (!form.rules && !form.requirements.every(filled)) ||
        !filled(form.goodOutcome) ||
        !filled(form.badOutcome)
      )
        return null
      const base = {
        slug: form.slug,
        type: 'randomEvent' as const,
        title: form.title,
        flavorText: filled(form.flavorText) ? form.flavorText : null,
        noEscape: form.noEscape,
      }
      if (!form.rules)
        return {
          ...base,
          requirements: form.requirements.map((text) => ({ text })),
          goodOutcome: { text: form.goodOutcome },
          badOutcome: { text: form.badOutcome },
        }
      const { requirements, goodSteps, badSteps, threshold } = form.rules
      const escapeThreshold = parseNumber(threshold)
      if (filled(threshold) && escapeThreshold === null) return null
      try {
        const lists: unknown[] = [requirements, goodSteps, badSteps].map(
          (value) => JSON.parse(value),
        )
        if (!lists.every(Array.isArray)) return null
        const rules = {
          requirements: lists[0],
          goodOutcome: { text: form.goodOutcome, steps: lists[1] },
          badOutcome: { text: form.badOutcome, steps: lists[2] },
          escapeThreshold,
        } as z.infer<typeof randomEventRulesSchema>
        return { ...base, ...rules }
      } catch {
        return null
      }
    }
    case 'combatEvent': {
      const goodSteps = parseOptionalJson(form.goodSteps, jsonList)
      const badSteps = parseOptionalJson(form.badSteps, jsonList)
      const threshold = parseNumber(form.escapeThreshold ?? '')
      if (
        goodSteps === null ||
        badSteps === null ||
        (form.escapeThreshold?.trim() && threshold === null)
      )
        return null
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
        goodOutcome: {
          text: form.goodOutcome,
          ...(goodSteps && { steps: goodSteps }),
        } as CombatEventCard['goodOutcome'],
        badOutcome: {
          text: form.badOutcome,
          ...(badSteps && { steps: badSteps }),
        } as CombatEventCard['badOutcome'],
        ...(form.escapeThreshold !== undefined && {
          escapeThreshold: threshold,
        }),
        noEscape: form.noEscape,
      }
    }
    case 'dimension': {
      const effects = toEffects(form.effects, zoneEffectSchema)
      if (effects === undefined) return null
      const releaseOrder = parseNumber(form.releaseOrder)
      const rewardDecks = deckInput(form.rewardDecks)
      const eventDecks = form.eventDecks && deckInput(form.eventDecks)
      if (rewardDecks === null || eventDecks === null) return null
      if (!filled(form.slug) || !filled(form.name) || releaseOrder === null)
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
        effects,
        rewardDecks,
        ...(eventDecks === undefined ? {} : { eventDecks }),
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
