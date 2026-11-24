import { z } from 'zod'

/**
 * Mercado (CONTRATO §3 FEAT-16, D-62): projeção com preços, resultado da
 * visita, abertura de booster e expansões. Tudo pronto do backend; o
 * frontend só valida o formato, monta o lote e envia.
 */

const id = z.string().min(1)
const count = z.number().int().nonnegative()
const positive = z.number().int().min(1)

export const marketExpansionSchema = z.enum([
  'vaultSlots',
  'deckSlots',
  'tcgFolder',
  'purse',
  'vaultGold',
])
export type MarketExpansion = z.infer<typeof marketExpansionSchema>

const sellSource = z.enum(['inventory', 'tcgFolder'])
const singleDestination = z.enum(['inventory', 'tcgFolder'])

export const marketViewSchema = z.object({
  zoneId: id,
  factorPercent: count,
  stock: z.array(
    z.object({ cardId: id, price: count, copiesPerPurchase: positive }),
  ),
  boosters: z.array(z.object({ cardId: id, price: count })),
  showcase: z
    .array(
      z.object({
        slotIndex: count,
        offer: z
          .object({ cardId: id, price: count, destination: singleDestination })
          .nullable(),
      }),
    )
    .nullable(),
  services: z.array(
    z.object({
      expansion: marketExpansionSchema,
      price: count,
      capacity: count,
    }),
  ),
  sellOffers: z.array(
    z.object({
      source: sellSource,
      cardId: id,
      owned: positive,
      lotSize: positive,
      price: count,
    }),
  ),
})
export type MarketView = z.infer<typeof marketViewSchema>

export const marketOperationResultSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('buyStock'),
    cardId: id,
    quantity: positive,
    copiesReceived: positive,
    gold: z.number().int(),
  }),
  z.object({
    operation: z.literal('buyBooster'),
    cardId: id,
    quantity: positive,
    gold: z.number().int(),
  }),
  z.object({
    operation: z.literal('buySingle'),
    slotIndex: count,
    cardId: id,
    destination: singleDestination,
    gold: z.number().int(),
  }),
  z.object({
    operation: z.literal('sell'),
    source: sellSource,
    cardId: id,
    quantity: positive,
    gold: z.number().int(),
  }),
  z.object({
    operation: z.literal('buyExpansion'),
    expansion: marketExpansionSchema,
    capacity: count,
    gold: z.number().int(),
  }),
])
export type MarketOperationResult = z.infer<typeof marketOperationResultSchema>

export const marketVisitResultSchema = z.object({
  zoneId: id,
  results: z.array(marketOperationResultSchema),
  goldLost: count,
})
export type MarketVisitResult = z.infer<typeof marketVisitResultSchema>

export const boosterOpeningResultSchema = z.object({
  boosterCardId: id,
  via: z.enum(['prepare', 'useVault']),
  cards: z.array(
    z.object({
      cardId: id,
      destination: z.enum(['tcgFolder', 'inventory', 'vault', 'pending']),
    }),
  ),
})
export type BoosterOpeningResult = z.infer<typeof boosterOpeningResultSchema>

/** Campos do `PlayerState` da FEAT-16; respostas anteriores os omitem (legado). */
export const playerMarketFields = {
  expansions: z
    .object({
      vaultSlots: count,
      deckSlots: count,
      tcgFolder: count,
      purse: count,
      vaultGold: count,
    })
    .default({
      vaultSlots: 0,
      deckSlots: 0,
      tcgFolder: 0,
      purse: 0,
      vaultGold: 0,
    }),
  market: marketViewSchema.nullable().default(null),
  lastMarketVisit: marketVisitResultSchema.nullable().default(null),
  lastBoosterOpening: boosterOpeningResultSchema.nullable().default(null),
}

/** Uma operação do lote do Ir ao Mercado (README 24). */
export type MarketOperation =
  | { operation: 'buyStock'; cardId: string; quantity: number }
  | { operation: 'buyBooster'; cardId: string; quantity: number }
  | { operation: 'buySingle'; slotIndex: number }
  | {
      operation: 'sell'
      source: 'inventory' | 'tcgFolder'
      cardId: string
      quantity: number
    }
  | { operation: 'buyExpansion'; expansion: MarketExpansion }

/** Ir ao Mercado (README 12.2, 24): 1 PA, lote aplicado em ordem (D-62). */
export interface VisitMarketAction {
  type: 'visitMarket'
  operations: MarketOperation[]
}
