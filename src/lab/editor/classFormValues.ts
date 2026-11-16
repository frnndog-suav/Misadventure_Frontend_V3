import type { Attribute, Modifier, PlayerClass } from '../../api/catalog'
import type { ClassInput, EditorClass } from '../../api/editor'
import { filled, modifierOrder, parseNumber } from './cardFormValues'

/**
 * Valores do formulário de classe (REQ-32), no formato do formulário como a
 * D-43: números como texto, seleções com a opção vazia.
 */
export interface ClassForm {
  playerClass: PlayerClass | ''
  name: string
  essentialAttributes: (Attribute | '')[]
  baseModifiers: Record<Modifier, string>
  starterDeck: { cardId: string; copies: string }[]
}

export function emptyClassForm(): ClassForm {
  return {
    playerClass: '',
    name: '',
    essentialAttributes: [],
    baseModifiers: Object.fromEntries(
      modifierOrder.map((m) => [m, '']),
    ) as Record<Modifier, string>,
    starterDeck: [],
  }
}

/** Valores de uma classe recebida. */
export function formFromClass({ classDefinition }: EditorClass): ClassForm {
  return {
    playerClass: classDefinition.playerClass,
    name: classDefinition.name,
    essentialAttributes: [...classDefinition.essentialAttributes],
    baseModifiers: Object.fromEntries(
      modifierOrder.map((m) => [m, String(classDefinition.baseModifiers[m])]),
    ) as Record<Modifier, string>,
    starterDeck: classDefinition.starterDeck.map(({ cardId, copies }) => ({
      cardId,
      copies: String(copies),
    })),
  }
}

/** O corpo do contrato, ou `null` se falta formato (limites ficam com o backend). */
export function toClassInput(form: ClassForm): ClassInput | null {
  if (form.playerClass === '' || !filled(form.name)) return null
  const essentialAttributes: Attribute[] = []
  for (const attribute of form.essentialAttributes) {
    if (attribute === '') return null
    essentialAttributes.push(attribute)
  }
  const baseModifiers = {} as Record<Modifier, number>
  for (const modifier of modifierOrder) {
    const value = parseNumber(form.baseModifiers[modifier])
    if (value === null) return null
    baseModifiers[modifier] = value
  }
  const starterDeck: ClassInput['starterDeck'] = []
  for (const entry of form.starterDeck) {
    const copies = parseNumber(entry.copies)
    if (!filled(entry.cardId) || copies === null) return null
    starterDeck.push({ cardId: entry.cardId, copies })
  }
  return {
    playerClass: form.playerClass,
    name: form.name,
    essentialAttributes,
    baseModifiers,
    starterDeck,
  }
}

export function sameClassForm(a: ClassForm, b: ClassForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
