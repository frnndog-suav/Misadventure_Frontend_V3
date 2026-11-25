import { useState } from 'react'
import type {
  BlacksmithOperation,
  BlacksmithOperationResult,
  BlacksmithVisitResult,
  BlacksmithView,
  EquipmentTarget,
  ServiceView,
} from '../../api/blacksmith'
import type { Card, MaterialRequirement } from '../../api/catalog'
import { ActionNotAllowedError, type PartyMember } from '../../api/parties'
import { categoryCatalog } from '../../ui/categories'
import { nameOf } from './cardNames'
import { equipmentStateSuffix } from './equipmentState'
import { receiveSpaceText } from './receiveSpace'

type Cards = ReadonlyMap<string, Card>
type Player = PartyMember['player']
type Entry = ServiceView['equipment'][number]
export type BlacksmithSource = 'blacksmith' | 'workshop'

/** Limite de itens do lote (REQ-81). */
const maxOperations = 50

const title: Record<BlacksmithSource, string> = {
  blacksmith: 'Ferreiro',
  workshop: 'Oficina do Artífice',
}

const sameTarget = (a: EquipmentTarget, b: EquipmentTarget): boolean =>
  a.location === 'equipment'
    ? b.location === 'equipment' && a.slot === b.slot
    : b.location === 'inventory' &&
      a.inventorySlotIndex === b.inventorySlotIndex

/** "{quantidade}× {nome}" de cada material, separados por vírgula. */
const materialsText = (materials: MaterialRequirement[], cards: Cards) =>
  materials.map((m) => `${m.quantity}× ${nameOf(cards, m.cardId)}`).join(', ')

/** {teste} do REQ-80: "sem teste" ou "D20 [+ bônus] ≥ limiar". */
function testText(threshold: number, d20Bonus = 0): string {
  if (threshold === 0) return 'sem teste'
  return `D20${d20Bonus > 0 ? ` + ${d20Bonus}` : ''} ≥ ${threshold}`
}

/** {rolagem} do REQ-81. */
function rollText(roll: number | null, threshold: number, d20Bonus = 0) {
  if (roll === null) return ''
  return `, D20 ${roll}${d20Bonus > 0 ? ` + ${d20Bonus}` : ''} contra ${threshold}`
}

const enchantmentName = (view: BlacksmithView | null, id: string) =>
  view?.enchantments.find((e) => e.enchantment.id === id)?.enchantment.name ??
  id

/** Carta do alvo de uma operação, pela projeção recebida. */
function operationCardId(
  op: BlacksmithOperation,
  view: BlacksmithView,
  service: ServiceView,
): string {
  if (op.operation === 'craft')
    return (
      view.recipes.find((r) => r.inventorySlotIndex === op.inventorySlotIndex)
        ?.cardId ?? ''
    )
  return (
    service.equipment.find((e) => sameTarget(e.target, op.target))?.cardId ?? ''
  )
}

/**
 * Passo de refino da operação `index` (D-63 item 2): o k-ésimo refino do
 * mesmo alvo na lista mostra `refineSteps[k]`. Indexar a projeção, não calcular.
 */
function refineStepAt(
  operations: BlacksmithOperation[],
  index: number,
  entry: Entry | undefined,
) {
  const op = operations[index]
  if (op === undefined || op.operation !== 'refine' || entry === undefined)
    return undefined
  const k = operations
    .slice(0, index)
    .filter(
      (o) => o.operation === 'refine' && sameTarget(o.target, op.target),
    ).length
  return entry.refineSteps[k]
}

/** Descrição de uma operação (REQ-80): o texto do botão; refino com o nível. */
function describeOperation(
  operations: BlacksmithOperation[],
  index: number,
  view: BlacksmithView,
  service: ServiceView,
  cards: Cards,
): string {
  const op = operations[index]!
  switch (op.operation) {
    case 'repair':
      return `Consertar ${nameOf(cards, operationCardId(op, view, service))}`
    case 'refine': {
      const entry = service.equipment.find((e) =>
        sameTarget(e.target, op.target),
      )
      const step = refineStepAt(operations, index, entry)
      return `Refinar ${nameOf(cards, entry?.cardId ?? '')}${step ? ` para +${step.targetLevel}` : ''}`
    }
    case 'enchant':
      return `Encantar ${nameOf(cards, operationCardId(op, view, service))} com ${enchantmentName(view, op.enchantmentId)}`
    case 'craft': {
      const recipe = view.recipes.find(
        (r) => r.inventorySlotIndex === op.inventorySlotIndex,
      )
      return `Criar ${nameOf(cards, recipe?.equipmentId ?? '')}`
    }
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

/** "Total previsto" (REQ-81, D-63 item 3): soma dos preços exibidos. */
function forecast(
  operations: BlacksmithOperation[],
  view: BlacksmithView,
  service: ServiceView,
): number {
  return operations.reduce((sum, op, index) => {
    switch (op.operation) {
      case 'repair':
        return (
          sum +
          (service.equipment.find((e) => sameTarget(e.target, op.target))
            ?.repair?.gold ?? 0)
        )
      case 'refine': {
        const entry = service.equipment.find((e) =>
          sameTarget(e.target, op.target),
        )
        return sum + (refineStepAt(operations, index, entry)?.gold ?? 0)
      }
      case 'enchant':
        return (
          sum +
          (view.enchantments.find((e) => e.enchantment.id === op.enchantmentId)
            ?.gold ?? 0)
        )
      case 'craft':
        return (
          sum +
          (view.recipes.find(
            (r) => r.inventorySlotIndex === op.inventorySlotIndex,
          )?.gold ?? 0)
        )
      default: {
        const _exhaustive: never = op
        return _exhaustive
      }
    }
  }, 0)
}

function targetLabel(target: EquipmentTarget): string {
  return target.location === 'equipment'
    ? `Em uso: ${categoryCatalog[target.slot].label}`
    : `Inventário, slot ${target.inventorySlotIndex + 1}`
}

/** Um encantamento oferecido a um equipamento, com a seleção "Substituir". */
function EnchantEntry({
  entry,
  option,
  view,
  cards,
  disabled,
  onAdd,
}: {
  entry: Entry
  option: Entry['enchantOptions'][number]
  view: BlacksmithView
  cards: Cards
  disabled: boolean
  onAdd: (op: BlacksmithOperation) => void
}) {
  const [replaceIndex, setReplaceIndex] = useState(0)
  const offer = view.enchantments.find(
    (e) => e.enchantment.id === option.enchantmentId,
  )
  const name = enchantmentName(view, option.enchantmentId)
  const equipmentName = nameOf(cards, entry.cardId)
  const text = `${name} — ${materialsText(offer?.enchantment.materials ?? [], cards)}, ${offer?.gold ?? 0} de ouro, ${testText(offer?.threshold ?? 0)}${option.requiresRefinement > 0 ? `; requer refino +${option.requiresRefinement}` : ''}${option.extra ? '; encantamento extra' : ''}`
  return (
    <li>
      <span>{text}</span>
      {option.replaceRequired && (
        <label>
          Substituir
          <select
            value={replaceIndex}
            onChange={(e) => setReplaceIndex(Number(e.target.value))}
          >
            {entry.state.enchantments.map(({ enchantment }, n) => (
              <option
                key={n}
                value={n}
              >{`${n + 1}: ${enchantment.name}`}</option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onAdd({
            operation: 'enchant',
            target: entry.target,
            enchantmentId: option.enchantmentId,
            ...(option.extra ? { extra: true } : {}),
            ...(option.replaceRequired ? { replaceIndex } : {}),
          })
        }
      >
        {`Encantar ${equipmentName} com ${name}`}
      </button>
    </li>
  )
}

/**
 * Seção "Ferreiro" ou "Oficina do Artífice" (REQ-80, REQ-81): monta o lote
 * da projeção recebida e envia em "Confirmar". Nada é conferido aqui (D-63 item 4).
 */
export function BlacksmithPanel({
  source,
  player,
  actionPoints,
  cards,
  onConfirm,
  onCancel,
  pending,
  failureText,
}: {
  source: BlacksmithSource
  player: Player
  actionPoints: number
  cards: Cards
  onConfirm: (
    operations: BlacksmithOperation[],
    onError: (error: Error) => void,
  ) => void
  onCancel: () => void
  pending: boolean
  /** Texto da recusa na seção; '' quando ela vai para a área de status. */
  failureText: (error: Error, refusedCardId: string) => string
}) {
  const [operations, setOperations] = useState<BlacksmithOperation[]>([])
  const [failure, setFailure] = useState<{
    error: Error
    operations: BlacksmithOperation[]
  } | null>(null)
  const view = player.blacksmith
  const service = view?.[source] ?? null
  const titleId = `${source}-title`

  function edit(next: BlacksmithOperation[]): void {
    setOperations(next)
    setFailure(null)
  }
  const append = (op: BlacksmithOperation) => edit([...operations, op])
  function swap(i: number, j: number): void {
    const next = [...operations]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    edit(next)
  }

  if (view === null || service === null) {
    return (
      <section aria-labelledby={titleId}>
        <h2 id={titleId}>{title[source]}</h2>
        <p>Servidor indisponível. Tente novamente.</p>
        <button type="button" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </section>
    )
  }

  const refusedIndex =
    failure?.error instanceof ActionNotAllowedError
      ? failure.error.operationIndex
      : undefined
  const refused =
    refusedIndex === undefined ? undefined : failure?.operations[refusedIndex]
  const failureMessage =
    failure === null
      ? ''
      : failureText(
          failure.error,
          refused === undefined ? '' : operationCardId(refused, view, service),
        )
  const full = operations.length >= maxOperations
  const addDisabled = pending || full

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>{title[source]}</h2>
      <p>{`Ouro na bolsa ${player.gold}`}</p>
      <p>
        {source === 'blacksmith'
          ? `Gasta todos os pontos de ação restantes (${actionPoints}).`
          : 'Gasta 1 ponto de ação.'}
      </p>
      <h3 id={`${source}-operations-title`}>Operações</h3>
      {operations.length === 0 && <p>Nenhuma operação.</p>}
      <ol aria-labelledby={`${source}-operations-title`}>
        {operations.map((_, i) => (
          <li key={i}>
            <span>
              {i + 1}. {describeOperation(operations, i, view, service, cards)}
            </span>
            {failure !== null && refusedIndex === i && (
              <strong>Recusada</strong>
            )}
            <button
              type="button"
              onClick={() => edit(operations.filter((_, j) => j !== i))}
              disabled={pending}
            >
              Remover
            </button>
            <button
              type="button"
              onClick={() => swap(i, i - 1)}
              disabled={pending || i === 0}
            >
              Subir
            </button>
            <button
              type="button"
              onClick={() => swap(i, i + 1)}
              disabled={pending || i === operations.length - 1}
            >
              Descer
            </button>
          </li>
        ))}
      </ol>
      <p>{`Total previsto: ${forecast(operations, view, service)} de ouro`}</p>
      {failureMessage !== '' && <p>{failureMessage}</p>}
      <button
        type="button"
        onClick={() =>
          onConfirm(operations, (error) => setFailure({ error, operations }))
        }
        disabled={pending || operations.length === 0}
      >
        {source === 'blacksmith'
          ? 'Confirmar (todos os pontos de ação)'
          : 'Confirmar (1 ponto de ação)'}
      </button>
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancelar
      </button>

      <div>
        <h3 id={`${source}-equipment-title`}>Equipamentos</h3>
        <ul aria-labelledby={`${source}-equipment-title`}>
          {service.equipment.map((entry) => {
            const name = nameOf(cards, entry.cardId)
            const k = operations.filter(
              (o) =>
                o.operation === 'refine' && sameTarget(o.target, entry.target),
            ).length
            const step = entry.refineSteps[k]
            const key =
              entry.target.location === 'equipment'
                ? entry.target.slot
                : `inventory-${entry.target.inventorySlotIndex}`
            return (
              <li key={key}>
                <span>{`${name}${equipmentStateSuffix(entry.state)} — ${targetLabel(entry.target)}`}</span>
                <ul>
                  {entry.repair !== null && (
                    <li>
                      <span>{`Consertar — ${entry.repair.gold} de ouro`}</span>
                      <button
                        type="button"
                        disabled={addDisabled}
                        onClick={() =>
                          append({ operation: 'repair', target: entry.target })
                        }
                      >
                        {`Consertar ${name}`}
                      </button>
                    </li>
                  )}
                  {entry.refineSteps.length > 0 && (
                    <li>
                      {step !== undefined && (
                        <span>{`Refinar para +${step.targetLevel} — ${materialsText(step.materials, cards)}, ${step.gold} de ouro, ${testText(step.threshold, step.d20Bonus)}${step.breaksOnFailure ? '; quebra se falhar' : ''}`}</span>
                      )}
                      <button
                        type="button"
                        disabled={addDisabled || step === undefined}
                        onClick={() =>
                          append({ operation: 'refine', target: entry.target })
                        }
                      >
                        {`Refinar ${name}`}
                      </button>
                    </li>
                  )}
                  {source === 'blacksmith' &&
                    entry.enchantOptions.map((option) => (
                      <EnchantEntry
                        key={option.enchantmentId}
                        entry={entry}
                        option={option}
                        view={view}
                        cards={cards}
                        disabled={addDisabled}
                        onAdd={append}
                      />
                    ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h3 id={`${source}-recipes-title`}>Receitas</h3>
        {view.recipes.length === 0 && <p>Nenhuma receita no inventário.</p>}
        <ul aria-labelledby={`${source}-recipes-title`}>
          {view.recipes.map((recipe) => {
            const equipment = nameOf(cards, recipe.equipmentId)
            return (
              <li key={recipe.inventorySlotIndex}>
                <span>{`${nameOf(cards, recipe.cardId)}: cria ${equipment} — ${materialsText(recipe.materials, cards)}, ${recipe.gold} de ouro${recipe.consumed ? ', consumida' : ''}${recipe.canCraft ? '' : ' (faltam materiais ou ouro)'}`}</span>
                <button
                  type="button"
                  disabled={addDisabled}
                  onClick={() =>
                    append({
                      operation: 'craft',
                      inventorySlotIndex: recipe.inventorySlotIndex,
                    })
                  }
                >
                  {`Criar ${equipment}`}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** Descrição de uma operação a partir do resultado (para `skipped`). */
function resultDescription(
  result: BlacksmithOperationResult,
  view: BlacksmithView | null,
  cards: Cards,
): string {
  switch (result.operation) {
    case 'repair':
      return `Consertar ${nameOf(cards, result.cardId)}`
    case 'refine':
      return `Refinar ${nameOf(cards, result.cardId)} para +${result.targetLevel}`
    case 'enchant':
      return `Encantar ${nameOf(cards, result.cardId)} com ${enchantmentName(view, result.enchantmentId)}`
    case 'craft':
      return `Criar ${nameOf(cards, result.equipmentId)}`
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}

/** Uma linha do "Resultado do ferreiro" (REQ-81). */
function resultText(
  result: BlacksmithOperationResult,
  view: BlacksmithView | null,
  cards: Cards,
): string {
  if (result.skipped)
    return `${resultDescription(result, view, cards)}: não feito (a operação anterior falhou).`
  const gold = -result.gold
  switch (result.operation) {
    case 'repair':
      return `Consertou ${nameOf(cards, result.cardId)} por ${gold} de ouro (Reparado ×${result.repairMarks}).`
    case 'refine': {
      const name = nameOf(cards, result.cardId)
      const roll = rollText(result.roll, result.threshold, result.d20Bonus)
      return result.success
        ? `Refinou ${name} para +${result.targetLevel} por ${gold} de ouro${roll}.`
        : `Falhou ao refinar ${name} para +${result.targetLevel}: ${gold} de ouro perdidos${roll}.${result.broke ? ` ${name} quebrou.` : ''}`
    }
    case 'enchant': {
      const name = nameOf(cards, result.cardId)
      const enchantment = enchantmentName(view, result.enchantmentId)
      const roll = rollText(result.roll, result.threshold)
      return result.success
        ? `Encantou ${name} com ${enchantment} por ${gold} de ouro${roll}.${result.replaced ? ` Substituiu ${result.replaced.enchantment.name}.` : ''}`
        : `Falhou ao encantar ${name} com ${enchantment}: ${gold} de ouro perdidos${roll}.`
    }
    case 'craft':
      return `Criou ${nameOf(cards, result.equipmentId)} por ${gold} de ouro; foi para ${receiveSpaceText[result.destination]}.`
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}

/** Lista "Resultado do ferreiro" de `lastBlacksmithVisit` (REQ-81). */
export function BlacksmithResult({
  visit,
  view,
  cards,
}: {
  visit: BlacksmithVisitResult
  view: BlacksmithView | null
  cards: Cards
}) {
  return (
    <>
      <h2 id="blacksmith-result-title">Resultado do ferreiro</h2>
      <ul aria-labelledby="blacksmith-result-title">
        {visit.results.map((result, i) => (
          <li key={i}>{resultText(result, view, cards)}</li>
        ))}
      </ul>
    </>
  )
}
