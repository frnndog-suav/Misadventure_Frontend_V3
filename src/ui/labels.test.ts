import { describe, expect, it } from 'vitest'
import {
  cardTypeSchema,
  elementSchema,
  enemyBehaviorSchema,
  enemyCategorySchema,
  enemyTypeSchema,
  playerClassSchema,
  raritySchema,
  zoneActionSchema,
  zoneTypeSchema,
} from '../api/catalog'
import {
  behaviorLabels,
  cardTypeLabels,
  elementLabels,
  enemyCategoryLabels,
  enemyTypeLabels,
  playerClassLabels,
  rarityLabels,
  zoneActionLabels,
  zoneTypeLabels,
} from './labels'

// A completude também é garantida em tempo de compilação
// (`satisfies Record<União, string>` em labels.ts).
const cases = [
  ['cardType', cardTypeSchema.options, cardTypeLabels],
  ['rarity', raritySchema.options, rarityLabels],
  ['zoneType', zoneTypeSchema.options, zoneTypeLabels],
  ['playerClass', playerClassSchema.options, playerClassLabels],
  ['element', elementSchema.options, elementLabels],
  ['enemyTypes', enemyTypeSchema.options, enemyTypeLabels],
  ['enemyCategory', enemyCategorySchema.options, enemyCategoryLabels],
  ['behavior', enemyBehaviorSchema.options, behaviorLabels],
  ['zoneAction', zoneActionSchema.options, zoneActionLabels],
] as const

describe('rótulos pt-BR dos identificadores do catálogo (CONTRATO §2.7)', () => {
  it.each(cases)(
    'REQ-04 (T-12): todo valor de %s tem rótulo não vazio, sem sobras',
    (_name, options, labels) => {
      const map: Record<string, string> = labels
      expect(Object.keys(map).sort()).toEqual([...options].sort())
      for (const id of options) expect(map[id], id).not.toBe('')
    },
  )

  it('REQ-04 (T-12): rótulos seguem o glossário', () => {
    expect(cardTypeLabels.randomEvent).toBe('Evento aleatório')
    expect(cardTypeLabels.combatEvent).toBe('Evento de combate')
    expect(rarityLabels.legendary).toBe('Lendária')
    expect(zoneTypeLabels.lacustrine).toBe('Lacustre')
    expect(playerClassLabels.artificer).toBe('Artífice')
    expect(elementLabels.blood).toBe('Sanguíneo')
    expect(enemyTypeLabels.undead).toBe('Morto-vivo')
    expect(enemyCategoryLabels.boss).toBe('Chefe')
    expect(behaviorLabels.hunter).toBe('Caçador')
    expect(zoneActionLabels.adjustDeck).toBe('Ajustar deck')
    expect(zoneActionLabels.continueQuest).toBe('Continuar missão')
  })
})
