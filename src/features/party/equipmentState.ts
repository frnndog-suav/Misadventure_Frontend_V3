import type { EquipmentState } from '../../api/blacksmith'

/**
 * REQ-79: sufixo do estado de uma cópia de equipamento, só o que difere do
 * padrão. Exibição do estado recebido; nenhum cálculo.
 */
export function equipmentStateSuffix(
  state: EquipmentState | null | undefined,
): string {
  if (state == null) return ''
  const parts: string[] = []
  if (state.broken) parts.push('quebrado')
  if (state.repairMarks > 0) parts.push(`Reparado ×${state.repairMarks}`)
  if (state.enchantments.length > 0)
    parts.push(
      `encantamentos: ${state.enchantments
        .map(
          ({ enchantment, active }) =>
            `${enchantment.name}${active ? '' : ' (desligado)'}`,
        )
        .join(', ')}`,
    )
  const refinement = state.refinement > 0 ? ` +${state.refinement}` : ''
  return refinement + parts.map((p) => `, ${p}`).join('')
}
