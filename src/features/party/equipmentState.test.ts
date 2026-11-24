import { describe, expect, it } from 'vitest'
import { partyBlacksmithFixture } from '../../mocks/blacksmithFixtures'
import { equipmentStateSuffix } from './equipmentState'

const ember =
  partyBlacksmithFixture.members[0]!.player.blacksmith!.enchantments[0]!
    .enchantment
const applied = (active: boolean) => ({
  enchantment: ember,
  zoneId: 'fixture.gray-harbor',
  slotIndex: 0,
  active,
})
const standard = {
  refinement: 0,
  enchantments: [],
  repairMarks: 0,
  broken: false,
}

describe('REQ-79: sufixo do estado do equipamento', () => {
  it('REQ-79: estado padrão ou ausente não acrescenta nada', () => {
    expect(equipmentStateSuffix(standard)).toBe('')
    expect(equipmentStateSuffix(null)).toBe('')
    expect(equipmentStateSuffix(undefined)).toBe('')
  })

  it('REQ-79: ordem "+{refinement}", "quebrado", "Reparado ×{n}", "encantamentos: …"; "(desligado)" só com active false', () => {
    expect(
      equipmentStateSuffix({
        refinement: 3,
        broken: true,
        repairMarks: 1,
        enchantments: [applied(false), applied(true)],
      }),
    ).toBe(
      ' +3, quebrado, Reparado ×1, encantamentos: Fio de Brasa (desligado), Fio de Brasa',
    )
  })

  it('REQ-79: sem refino, o primeiro item vem depois de vírgula', () => {
    expect(equipmentStateSuffix({ ...standard, repairMarks: 2 })).toBe(
      ', Reparado ×2',
    )
  })
})
