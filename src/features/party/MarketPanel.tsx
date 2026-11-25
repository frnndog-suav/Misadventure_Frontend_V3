import { useState } from 'react'
import type { Card } from '../../api/catalog'
import { ActionNotAllowedError, type PartyMember } from '../../api/parties'
import type {
  MarketExpansion,
  MarketOperation,
  MarketOperationResult,
  MarketVisitResult,
} from '../../api/market'
import { nameOf } from './cardNames'
import { receiveSpaceText } from './receiveSpace'
import { equipmentStateSuffix } from './equipmentState'
import { invalidQuantity, isIntFrom } from './fieldRules'
import { NumberField } from './fields'

type Cards = ReadonlyMap<string, Card>
type Player = PartyMember['player']
type Market = NonNullable<Player['market']>

const expansionLabel: Record<MarketExpansion, string> = {
  vaultSlots: 'Expansão do cofre',
  deckSlots: 'Slot de deck',
  tcgFolder: 'Expansão da pasta de TCG',
  purse: 'Expansão da bolsa',
  vaultGold: 'Expansão do ouro do cofre',
}

const sourceLabel = { inventory: 'Inventário', tcgFolder: 'Pasta de TCG' }

/** Oferta de venda de uma operação; equipamento, pela cópia (REQ-79). */
function sellOffer(
  market: Market,
  op: Extract<MarketOperation, { operation: 'sell' }>,
) {
  return market.sellOffers.find(
    (o) =>
      o.source === op.source &&
      o.cardId === op.cardId &&
      o.inventorySlotIndex === op.inventorySlotIndex,
  )
}

/** Descrição de uma operação na lista "Operações" (REQ-73). */
function describeOperation(
  op: MarketOperation,
  cards: Cards,
  market: Market,
): string {
  switch (op.operation) {
    case 'buyStock':
    case 'buyBooster':
      return `Comprar ${op.quantity}× ${nameOf(cards, op.cardId)}`
    case 'buySingle': {
      const offer = market.showcase?.find(
        (s) => s.slotIndex === op.slotIndex,
      )?.offer
      return `Comprar ${nameOf(cards, offer?.cardId ?? '')} (slot ${op.slotIndex + 1})`
    }
    case 'sell':
      return `Vender ${op.quantity}× ${nameOf(cards, op.cardId)}${equipmentStateSuffix(sellOffer(market, op)?.equipmentState)}`
    case 'buyExpansion':
      return `Comprar ${expansionLabel[op.expansion]}`
    case 'buyMount':
      return `Comprar a montaria ${nameOf(cards, op.cardId)}`
    case 'sellMount':
      return `Vender a montaria ${nameOf(cards, market.stable?.currentMount?.cardId ?? '')}`
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

/**
 * "Total previsto" (REQ-74, D-62 item 3): só soma os preços exibidos × a
 * quantidade de cada operação; o cobrado vem de `lastMarketVisit`.
 */
function forecast(
  operations: MarketOperation[],
  market: Market,
): { pay: number; receive: number } {
  let pay = 0
  let receive = 0
  for (const op of operations) {
    switch (op.operation) {
      case 'buyStock':
        pay +=
          (market.stock.find((e) => e.cardId === op.cardId)?.price ?? 0) *
          op.quantity
        break
      case 'buyBooster':
        pay +=
          (market.boosters.find((e) => e.cardId === op.cardId)?.price ?? 0) *
          op.quantity
        break
      case 'buySingle':
        pay +=
          market.showcase?.find((s) => s.slotIndex === op.slotIndex)?.offer
            ?.price ?? 0
        break
      case 'sell': {
        const offer = sellOffer(market, op)
        // O preço exibido é por unidade, ou por lote de `lotSize`.
        receive +=
          offer === undefined
            ? 0
            : offer.price * Math.floor(op.quantity / offer.lotSize)
        break
      }
      case 'buyExpansion':
        pay +=
          market.services.find((s) => s.expansion === op.expansion)?.price ?? 0
        break
      case 'buyMount':
        pay +=
          market.stable?.offers.find((o) => o.cardId === op.cardId)?.price ?? 0
        break
      case 'sellMount':
        receive += market.stable?.currentMount?.price ?? 0
        break
      default: {
        const _exhaustive: never = op
        return _exhaustive
      }
    }
  }
  return { pay, receive }
}

/** Entrada com campo de quantidade e "Acrescentar" (Estoque, Boosters, Vender). */
function QuantityEntry({
  text,
  fieldLabel,
  initial,
  onAdd,
  pending,
}: {
  text: string
  fieldLabel: string
  initial: number
  onAdd: (quantity: number) => void
  pending: boolean
}) {
  const [quantity, setQuantity] = useState(String(initial))
  const [error, setError] = useState('')
  function add(): void {
    if (!isIntFrom(quantity, 1)) {
      setError(invalidQuantity)
      return
    }
    setError('')
    onAdd(Number(quantity))
  }
  return (
    <li>
      <span>{text}</span>
      <NumberField
        label={fieldLabel}
        value={quantity}
        onChange={setQuantity}
        min={1}
        error={error}
      />
      <button type="button" onClick={add} disabled={pending}>
        Acrescentar
      </button>
    </li>
  )
}

/** Seção "Mercado" (REQ-73, REQ-74): monta o lote e envia em "Confirmar". */
export function MarketPanel({
  player,
  cards,
  onConfirm,
  onCancel,
  pending,
  failureText,
}: {
  player: Player
  cards: Cards
  onConfirm: (
    operations: MarketOperation[],
    onError: (error: Error) => void,
  ) => void
  onCancel: () => void
  pending: boolean
  /** `message` + texto do motivo (REQ-74); `refused`: a operação recusada. */
  failureText: (error: Error, refused: MarketOperation | undefined) => string
}) {
  const [operations, setOperations] = useState<MarketOperation[]>([])
  const [failure, setFailure] = useState<{
    error: Error
    operations: MarketOperation[]
  } | null>(null)
  const { market } = player

  // Editar a lista tira a marca e o texto da recusa: o índice deixaria de valer.
  function edit(next: MarketOperation[]): void {
    setOperations(next)
    setFailure(null)
  }
  const append = (op: MarketOperation) => edit([...operations, op])
  function swap(i: number, j: number): void {
    const next = [...operations]
    ;[next[i], next[j]] = [next[j], next[i]]
    edit(next)
  }

  if (market === null) {
    return (
      <section aria-labelledby="market-title">
        <h2 id="market-title">Mercado</h2>
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
  const failureMessage =
    failure === null
      ? ''
      : failureText(
          failure.error,
          refusedIndex === undefined
            ? undefined
            : failure.operations[refusedIndex],
        )
  const { pay, receive } = forecast(operations, market)
  const slotsInBatch = new Set(
    operations.flatMap((op) =>
      op.operation === 'buySingle' ? [op.slotIndex] : [],
    ),
  )

  return (
    <section aria-labelledby="market-title">
      <h2 id="market-title">Mercado</h2>
      <p>{`Ouro na bolsa ${player.gold} (capacidade ${player.purseCapacity})`}</p>
      <p>Fator do mercado {market.factorPercent}%</p>
      <h3 id="market-operations-title">Operações</h3>
      {operations.length === 0 && <p>Nenhuma operação.</p>}
      <ol aria-labelledby="market-operations-title">
        {operations.map((op, i) => (
          <li key={i}>
            <span>
              {i + 1}. {describeOperation(op, cards, market)}
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
      <p>{`Total previsto: ${pay} de ouro a pagar, ${receive} de ouro a receber`}</p>
      {failureMessage !== '' && <p>{failureMessage}</p>}
      <button
        type="button"
        onClick={() =>
          onConfirm(operations, (error) => setFailure({ error, operations }))
        }
        disabled={pending || operations.length === 0}
      >
        Confirmar (1 ponto de ação)
      </button>
      <button type="button" onClick={onCancel} disabled={pending}>
        Cancelar
      </button>

      <div>
        <h3 id="market-stock-title">Estoque</h3>
        {market.stock.length === 0 && <p>Sem estoque.</p>}
        <ul aria-labelledby="market-stock-title">
          {market.stock.map(({ cardId, price, copiesPerPurchase }) => {
            const name = nameOf(cards, cardId)
            return (
              <QuantityEntry
                key={cardId}
                text={`${name}${copiesPerPurchase > 1 ? ` (${copiesPerPurchase} unidades)` : ''} — ${price} de ouro`}
                fieldLabel={`Compras de ${name}`}
                initial={1}
                onAdd={(quantity) =>
                  append({ operation: 'buyStock', cardId, quantity })
                }
                pending={pending}
              />
            )
          })}
        </ul>
      </div>

      <div>
        <h3 id="market-boosters-title">Boosters</h3>
        {market.boosters.length === 0 && <p>Nenhum booster à venda.</p>}
        <ul aria-labelledby="market-boosters-title">
          {market.boosters.map(({ cardId, price }) => {
            const name = nameOf(cards, cardId)
            return (
              <QuantityEntry
                key={cardId}
                text={`${name} — ${price} de ouro`}
                fieldLabel={`Boosters de ${name}`}
                initial={1}
                onAdd={(quantity) =>
                  append({ operation: 'buyBooster', cardId, quantity })
                }
                pending={pending}
              />
            )
          })}
        </ul>
      </div>

      {market.showcase !== null && (
        <div>
          <h3 id="market-singles-title">Singles</h3>
          <ul aria-labelledby="market-singles-title">
            {market.showcase.map(({ slotIndex, offer }) => (
              <li key={slotIndex}>
                {offer === null ? (
                  <span>{`Slot ${slotIndex + 1}: vazio`}</span>
                ) : (
                  <>
                    <span>{`Slot ${slotIndex + 1}: ${nameOf(cards, offer.cardId)} — ${offer.price} de ouro (vai para ${receiveSpaceText[offer.destination]})`}</span>
                    <button
                      type="button"
                      onClick={() =>
                        append({ operation: 'buySingle', slotIndex })
                      }
                      disabled={pending || slotsInBatch.has(slotIndex)}
                    >
                      Comprar {nameOf(cards, offer.cardId)}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 id="market-sell-title">Vender</h3>
        {market.sellOffers.length === 0 && <p>Nada para vender.</p>}
        <ul aria-labelledby="market-sell-title">
          {market.sellOffers.map(
            ({
              source,
              cardId,
              owned,
              lotSize,
              price,
              inventorySlotIndex,
              equipmentState,
            }) => {
              const name = nameOf(cards, cardId)
              // REQ-79: equipamento é vendido por cópia, sem campo de unidades.
              if (equipmentState !== undefined)
                return (
                  <li key={`${source}:${cardId}:${inventorySlotIndex}`}>
                    <span>{`${name}${equipmentStateSuffix(equipmentState)} (${sourceLabel[source]}, ${owned} unidades) — ${price} de ouro ${lotSize > 1 ? `por lote de ${lotSize}` : 'por unidade'}`}</span>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          operation: 'sell',
                          source,
                          cardId,
                          quantity: 1,
                          inventorySlotIndex,
                        })
                      }
                      disabled={pending}
                    >
                      Acrescentar
                    </button>
                  </li>
                )
              return (
                <QuantityEntry
                  key={`${source}:${cardId}`}
                  text={`${name} (${sourceLabel[source]}, ${owned} unidades) — ${price} de ouro ${lotSize > 1 ? `por lote de ${lotSize}` : 'por unidade'}`}
                  fieldLabel={`Unidades de ${name}`}
                  initial={lotSize}
                  onAdd={(quantity) =>
                    append({ operation: 'sell', source, cardId, quantity })
                  }
                  pending={pending}
                />
              )
            },
          )}
        </ul>
      </div>

      <div>
        <h3 id="market-services-title">Serviços</h3>
        <ul aria-labelledby="market-services-title">
          {market.services.map(({ expansion, price, capacity }) => (
            <li key={expansion}>
              <span>{`${expansionLabel[expansion]} — ${price} de ouro (capacidade passa a ${capacity})`}</span>
              <button
                type="button"
                onClick={() => append({ operation: 'buyExpansion', expansion })}
                disabled={pending}
              >
                Comprar {expansionLabel[expansion]}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {market.stable !== null && (
        <div>
          <h3 id="market-stable-title">Estábulo</h3>
          <ul aria-labelledby="market-stable-title">
            {market.stable.offers.map(({ cardId, price }) => (
              <li key={cardId}>
                <span>{`${nameOf(cards, cardId)} — ${price} de ouro`}</span>
                <button
                  type="button"
                  onClick={() => append({ operation: 'buyMount', cardId })}
                  disabled={pending}
                >
                  Comprar {nameOf(cards, cardId)}
                </button>
              </li>
            ))}
            {market.stable.currentMount !== null && (
              <li>
                <span>{`Sua montaria: ${nameOf(cards, market.stable.currentMount.cardId)} — vende por ${market.stable.currentMount.price} de ouro${market.stable.currentMount.sellable ? '' : ' (esvazie o inventário extra e a pasta extra antes)'}`}</span>
                <button
                  type="button"
                  onClick={() => append({ operation: 'sellMount' })}
                  disabled={pending}
                >
                  Vender {nameOf(cards, market.stable.currentMount.cardId)}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Quanto entrou em cada espaço, só com o inventário extra presente (REQ-88). */
function receivedText(
  received: Extract<
    MarketOperationResult,
    { operation: 'buyStock' }
  >['received'],
): string {
  if (!received.some(({ space }) => space === 'mountInventory')) return ''
  const parts = received.map(
    ({ space, quantity }) =>
      `${quantity} no ${space === 'inventory' ? 'inventário' : 'inventário extra'}`,
  )
  return ` (${parts.join(', ')})`
}

/** Uma linha do "Resultado do mercado" (REQ-74). */
function resultText(result: MarketOperationResult, cards: Cards): string {
  const name = (cardId: string) => nameOf(cards, cardId)
  switch (result.operation) {
    case 'buyStock':
      return `Comprou ${result.copiesReceived}× ${name(result.cardId)} por ${-result.gold} de ouro${receivedText(result.received)}`
    case 'buyBooster':
      return `Comprou ${result.quantity}× ${name(result.cardId)} por ${-result.gold} de ouro${receivedText(result.received)}`
    case 'buySingle':
      return `Comprou ${name(result.cardId)} (slot ${result.slotIndex + 1}) por ${-result.gold} de ouro; foi para ${receiveSpaceText[result.destination]}`
    case 'sell':
      return `Vendeu ${result.quantity}× ${name(result.cardId)} por ${result.gold} de ouro`
    case 'buyExpansion':
      return `Comprou ${expansionLabel[result.expansion]} por ${-result.gold} de ouro (capacidade ${result.capacity})`
    case 'buyMount':
      return `Comprou a montaria ${name(result.cardId)} por ${-result.gold} de ouro`
    case 'sellMount':
      return `Vendeu a montaria ${name(result.cardId)} por ${result.gold} de ouro`
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}

/** Lista "Resultado do mercado" de `lastMarketVisit` (REQ-74). */
export function MarketResult({
  visit,
  cards,
}: {
  visit: MarketVisitResult
  cards: Cards
}) {
  return (
    <>
      <h2 id="market-result-title">Resultado do mercado</h2>
      <ul aria-labelledby="market-result-title">
        {visit.results.map((result, i) => (
          <li key={i}>{resultText(result, cards)}</li>
        ))}
      </ul>
      {visit.goldLost > 0 && (
        <p>{`${visit.goldLost} de ouro perdidos: a bolsa estava cheia.`}</p>
      )}
    </>
  )
}
