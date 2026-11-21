import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { z } from 'zod'
import {
  executableRandomEventCardSchema,
  modifierValuesSchema,
  playerClassSchema,
} from './catalog'
import {
  combatActionTypes,
  combatAbilityOptionSchema,
  combatResultSchema,
  combatStateSchema,
  combatUpdateSchema,
  triggeredEffectChoiceSchema,
  type CombatAction,
  type ResolveTriggeredEffectAction,
} from './combat'
import type { EquipmentSlot, PlayerClass } from './catalog'
import { ApiError, requestJson } from './http'
import { activatableEffectSchema, playerStatusSchema } from './effects'
import {
  encounterSchema,
  eventMinimumCheckSchema,
  pendingRewardSchema,
  randomEventActionTypes,
  randomEventPlayerFields,
  type EventPayment,
  type RandomEventAction,
  type ResolveRewardAction,
} from './randomEvents'

/**
 * Campanha solo (CONTRATO §3 FEAT-05) e preparação da partida (FEAT-06):
 * grupos (saves) e sessão. O frontend só envia intenções e mostra o estado
 * devolvido, com os valores já calculados (D-32, D-48); sem retry (D-16).
 */

export const partyStatusSchema = z.enum(['idle', 'inSession'])
export type PartyStatus = z.infer<typeof partyStatusSchema>

/**
 * POST /parties; os textos vão como digitados (o backend apara e valida).
 * `playerClass` ausente = nenhuma classe escolhida (o backend responde
 * `required`, REQ-29).
 */
export interface CreatePartyRequest {
  name: string
  characterName: string
  playerClass?: PlayerClass
}

const nonNegativeInt = z.number().int().min(0)

/** Direção na mesa (não da carta). `y` cresce para o sul. */
export const directionSchema = z.enum(['north', 'east', 'south', 'west'])
export type Direction = z.infer<typeof directionSchema>

/** README 3.5: zonas viradas para cima e travessias. */
export const partyMapSchema = z.object({
  zones: z.array(
    z.object({
      zoneId: z.string(),
      x: z.number().int(),
      y: z.number().int(),
      arrows: z.array(directionSchema),
    }),
  ),
  crossings: z.array(z.object({ zoneIds: z.tuple([z.string(), z.string()]) })),
})
export type PartyMap = z.infer<typeof partyMapSchema>

export const partyDimensionSchema = z.object({
  dimensionCardId: z.string(),
  startingCityZoneId: z.string(),
  map: partyMapSchema,
})
export type PartyDimension = z.infer<typeof partyDimensionSchema>

/** Tipos de `PartyAction`, na ordem fixa do contrato (FEAT-08 a FEAT-10, FEAT-32). */
export const partyActionTypeSchema = z.enum([
  'move',
  'recover',
  'prepare',
  'adjustDeck',
  'scavenge',
  'useVault',
  'saveRespawnPoint',
  ...randomEventActionTypes,
  ...combatActionTypes,
  'endTurn',
])
export type PartyActionType = z.infer<typeof partyActionTypeSchema>

/** A vez: rodada, membro da vez e pontos restantes (FEAT-08, D-56). */
export const partyTurnSchema = z.object({
  round: z.number().int().min(1),
  memberId: z.string(),
  actionPoints: nonNegativeInt,
})
export type PartyTurn = z.infer<typeof partyTurnSchema>

/** Cópias de uma carta de atributo (build ou pasta de TCG, FEAT-09). */
export const cardCopiesSchema = z.object({
  cardId: z.string(),
  copies: z.number().int().min(1),
})
export type CardCopies = z.infer<typeof cardCopiesSchema>

/** Slot do inventário; `quantity` > 1 só em carta que empilha (FEAT-10). */
export const inventorySlotSchema = z.object({
  cardId: z.string(),
  quantity: z.number().int().min(1),
})
export type InventorySlot = z.infer<typeof inventorySlotSchema>

/** As 8 categorias de equipamento em uso; `null` = slot vazio (FEAT-10). */
const equipmentInUseSchema = z.object({
  head: z.string().nullable(),
  torso: z.string().nullable(),
  legs: z.string().nullable(),
  feet: z.string().nullable(),
  cape: z.string().nullable(),
  weapon: z.string().nullable(),
  shield: z.string().nullable(),
  accessory: z.string().nullable(),
}) satisfies z.ZodType<Record<EquipmentSlot, string | null>>

/** Cofre do jogador (FEAT-32, README 6.4): slots empilhados, decks guardados e ouro. */
export const vaultSchema = z.object({
  slots: z.array(inventorySlotSchema),
  decks: z.array(z.array(cardCopiesSchema)),
  gold: nonNegativeInt,
})
export type Vault = z.infer<typeof vaultSchema>

export const knockoutResultSchema = z.object({
  id: z.string(),
  combatId: z.string().nullable(),
  respawnZoneId: z.string(),
  healthRestored: nonNegativeInt,
  peakLost: nonNegativeInt,
  vigorLost: nonNegativeInt,
  purseGoldLost: nonNegativeInt,
  roundAtKnockout: nonNegativeInt,
  roundAfterRespawn: nonNegativeInt,
})
export type KnockoutResult = z.infer<typeof knockoutResultSchema>

/** Estado do jogador na partida; tudo calculado pelo backend (§1.3). */
export const playerStateSchema = z.object({
  playerClasses: z.array(
    z.object({ playerClass: playerClassSchema, deckLockMet: z.boolean() }),
  ),
  gold: nonNegativeInt,
  baseHealth: nonNegativeInt,
  maxHealth: nonNegativeInt,
  health: nonNegativeInt,
  peak: nonNegativeInt,
  vigor: nonNegativeInt,
  modifiers: modifierValuesSchema,
  hand: z.array(z.string()),
  attributeDeckCount: nonNegativeInt,
  attributeDiscardPileCount: nonNegativeInt,
  zoneId: z.string(),
  respawnZoneId: z.string(),
  lastKnockout: knockoutResultSchema.nullable().default(null),
  skipNextTurn: z.boolean().default(false),
  /** Destinos válidos do Movimentar, prontos do backend (FEAT-07, D-55). */
  moveTargets: z.array(z.string()),
  /** Ações que o jogador pode mandar agora, prontas do backend (FEAT-08, D-56). */
  availableActions: z.array(partyActionTypeSchema),
  // Saves e respostas de versões anteriores do backend omitem os campos da FEAT-13.
  down: z.boolean().optional(),
  usableAbilities: z.array(combatAbilityOptionSchema).optional(),
  /** Build salva, pasta e capacidade, prontas do backend (FEAT-09, D-57). */
  build: z.array(cardCopiesSchema),
  buildSize: nonNegativeInt,
  tcgFolder: z.array(cardCopiesSchema),
  tcgFolderCapacity: nonNegativeInt,
  /** Inventário, equipamentos, bolsa e modificadores efetivos, prontos (FEAT-10, D-58). */
  inventory: z.array(inventorySlotSchema),
  inventoryCapacity: nonNegativeInt,
  equipment: equipmentInUseSchema,
  purseCapacity: nonNegativeInt,
  effectiveModifiers: modifierValuesSchema,
  statuses: z.array(playerStatusSchema),
  activatableEffects: z.array(activatableEffectSchema),
  /** Cofre, capacidades, alvos e resultado do Vasculhar, prontos (FEAT-32, D-59). */
  vault: vaultSchema,
  vaultCapacity: nonNegativeInt,
  vaultDeckSlots: nonNegativeInt,
  vaultGoldCapacity: nonNegativeInt,
  scavengeTargets: z.array(z.string()),
  lastScavenge: z
    .object({
      cardId: z.string(),
      found: z.boolean(),
      delivery: z.enum(['inventory', 'pending', 'left', 'none']),
    })
    .nullable(),
  ...randomEventPlayerFields,
})
export type PlayerState = z.infer<typeof playerStateSchema>

export const partyMemberSchema = z.object({
  id: z.string(),
  characterName: z.string(),
  kind: z.literal('human'),
  isHost: z.boolean(),
  player: playerStateSchema,
})
export type PartyMember = z.infer<typeof partyMemberSchema>

export const partySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: partyStatusSchema,
  members: z.array(partyMemberSchema),
  dimension: partyDimensionSchema,
  /** Ids de membro, do 1º ao último (README 11.2). */
  turnOrder: z.array(z.string()),
  turn: partyTurnSchema,
  randomEventEncounter: encounterSchema(
    executableRandomEventCardSchema,
  ).nullable(),
  pendingRewards: z.array(pendingRewardSchema),
  combat: combatStateSchema.nullable().optional(),
  lastCombatResult: combatResultSchema.nullable().optional(),
  triggeredEffectChoice: triggeredEffectChoiceSchema.nullable().optional(),
  createdAt: z.iso.datetime(),
  savedAt: z.iso.datetime(),
})
export type Party = z.infer<typeof partySchema>

// Apenas o POST projeta o lote transitório. Respostas anteriores à FEAT-13 o omitem.
const partyActionResponseSchema = partySchema.extend({
  combatUpdates: z.array(combatUpdateSchema).optional(),
})
export type PartyActionResponse = z.infer<typeof partyActionResponseSchema>

export const partySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: partyStatusSchema,
  characterNames: z.array(z.string()),
  createdAt: z.iso.datetime(),
  savedAt: z.iso.datetime(),
})
export type PartySummary = z.infer<typeof partySummarySchema>

export const partyInvalidDetailsSchema = z.object({
  fields: z.array(
    z.object({
      field: z
        .enum(['name', 'characterName', 'playerClass', 'members'])
        .nullable(),
      reason: z.enum([
        'invalidBody',
        'required',
        'notString',
        'blank',
        'tooLong',
        'unknownClass',
        'belowMinPlayers',
      ]),
    }),
  ),
})
export type PartyInvalidDetails = z.infer<typeof partyInvalidDetailsSchema>

/** `400 PARTY_INVALID` com `details` já validado. */
export class PartyInvalidError extends ApiError {
  readonly fields: PartyInvalidDetails['fields']

  constructor(message: string, details: PartyInvalidDetails) {
    super('PARTY_INVALID', message, details)
    this.name = 'PartyInvalidError'
    this.fields = details.fields
  }
}

export const dimensionInvalidDetailsSchema = z.object({
  /** `null` quando não há Carta de Dimensão publicada. */
  dimensionCardId: z.string().nullable(),
  /** Textos pt-BR prontos (D-38, D-48). */
  problems: z.array(z.string()),
})
export type DimensionInvalidDetails = z.infer<
  typeof dimensionInvalidDetailsSchema
>

/** `409 DIMENSION_INVALID` com `details` já validado (REQ-29). */
export class DimensionInvalidError extends ApiError {
  readonly dimensionCardId: string | null
  readonly problems: string[]

  constructor(message: string, details: DimensionInvalidDetails) {
    super('DIMENSION_INVALID', message, details)
    this.name = 'DimensionInvalidError'
    this.dimensionCardId = details.dimensionCardId
    this.problems = details.problems
  }
}

export const partiesKey = ['parties'] as const

async function getParties(): Promise<PartySummary[]> {
  return z.array(partySummarySchema).parse(await requestJson('GET', '/parties'))
}

/** `details` de um erro esperado validado; fora do contrato → erro genérico. */
export function parseDetails<T>(error: ApiError, schema: z.ZodType<T>): T {
  const details = schema.safeParse(error.details)
  if (!details.success) {
    throw new Error(`${error.code} com details fora do contrato`, {
      cause: error,
    })
  }
  return details.data
}

async function createParty(request: CreatePartyRequest): Promise<Party> {
  try {
    return partySchema.parse(await requestJson('POST', '/parties', request))
  } catch (error) {
    if (error instanceof ApiError && error.code === 'PARTY_INVALID') {
      throw new PartyInvalidError(
        error.message,
        parseDetails(error, partyInvalidDetailsSchema),
      )
    }
    if (error instanceof ApiError && error.code === 'DIMENSION_INVALID') {
      throw new DimensionInvalidError(
        error.message,
        parseDetails(error, dimensionInvalidDetailsSchema),
      )
    }
    throw error
  }
}

function partyPath(partyId: string): string {
  return `/parties/${encodeURIComponent(partyId)}`
}

/** Saves do servidor, na ordem recebida. */
export function useParties(): UseQueryResult<PartySummary[], Error> {
  return useQuery({ queryKey: partiesKey, queryFn: getParties, retry: false })
}

/** Um grupo (`GET /parties/:partyId`); `null` deixa a consulta parada. */
export function useParty(
  partyId: string | null,
  enabled = true,
): UseQueryResult<Party, Error> {
  return useQuery({
    queryKey: [...partiesKey, partyId],
    queryFn: async () =>
      partySchema.parse(await requestJson('GET', partyPath(partyId ?? ''))),
    enabled: partyId !== null && enabled,
    retry: false,
  })
}

/**
 * Cria o grupo de 1, já preparado; erro de campo vira `PartyInvalidError` e
 * dimensão inválida vira `DimensionInvalidError`.
 */
export function useCreateParty(): UseMutationResult<
  Party,
  Error,
  CreatePartyRequest
> {
  return useMutation({ mutationFn: createParty, retry: false })
}

/** Continuar: abre (ou mantém) a sessão do grupo. */
export function useStartSession(
  partyId: string,
): UseMutationResult<Party, Error, void> {
  return useMutation({
    mutationFn: async () =>
      partySchema.parse(
        await requestJson('POST', `${partyPath(partyId)}/session`),
      ),
    retry: false,
  })
}

/** Intenção de jogo (CONTRATO §1.6); as FEATs seguintes acrescentam variantes. */
export type PartyAction =
  | MoveAction
  | { type: 'saveRespawnPoint' }
  | EndTurnAction
  | RecoverAction
  | AdjustDeckAction
  | PrepareAction
  | UseVaultAction
  | ScavengeAction
  | RandomEventAction
  | ResolveRewardAction
  | CombatAction
  | ResolveTriggeredEffectAction

/** Movimentar (README 12.2); `zoneId` vem de `moveTargets`. */
export interface MoveAction {
  type: 'move'
  zoneId: string
}

/** Encerrar a vez (README 11.1); sem campos. */
export interface EndTurnAction {
  type: 'endTurn'
}

/** Recuperar (README 12.2, 12.5): opções (a), (b) e (c). */
export interface RecoverAction {
  type: 'recover'
  option: 'drawToHand' | 'shuffleHand' | 'shuffleDiscard'
}

/** Ajustar deck (README 4.4, 6.3): a build nova inteira. */
export interface AdjustDeckAction {
  type: 'adjustDeck'
  build: CardCopies[]
}

/** Preparar (README 12.2, parte a): equipar uma carta ou guardar um slot. */
export type PrepareAction =
  | { type: 'prepare'; operation: 'equip'; cardId: string }
  | {
      type: 'prepare'
      operation: 'useAbility'
      equipmentSlot: EquipmentSlot
      abilityId: string
      payment?: EventPayment
    }
  | { type: 'prepare'; operation: 'unequip'; slot: EquipmentSlot }
  | {
      type: 'prepare'
      operation: 'activate'
      cardId: string
      effectIndex: number
      payment?: { handCards: string[] }
    }

/** Usar cofre (README 6.4, 12.2): lote aplicado em ordem pelo backend (D-59). */
export interface UseVaultAction {
  type: 'useVault'
  operations: VaultOperation[]
}

/** Uma operação do lote do Usar cofre (CONTRATO §3 FEAT-32). */
export type VaultOperation =
  | { operation: 'store'; cardId: string; quantity: number }
  | { operation: 'take'; cardId: string; quantity: number }
  | { operation: 'storeGold'; amount: number }
  | { operation: 'takeGold'; amount: number }
  | { operation: 'discard'; cardId: string; quantity: number }
  | { operation: 'saveDeck'; cards: CardCopies[] }
  | { operation: 'unpackDeck'; deckIndex: number }
  | { operation: 'swapBuild'; deckIndex: number }
  | { operation: 'editBuild'; build: CardCopies[] }

/** Vasculhar (README 12.6); `cardId` vem de `scavengeTargets`. */
export interface ScavengeAction {
  type: 'scavenge'
  cardId: string
}

export const actionNotAllowedDetailsSchema = z.object({
  reason: z.enum([
    'notConnected',
    'noActionPoints',
    'notOwned',
    'copyLimitExceeded',
    'buildBelowMinimum',
    'tcgFolderFull',
    // FEAT-10
    'notInInventory',
    'notEquipment',
    'peakRequirementNotMet',
    'classRestricted',
    'shieldBlocked',
    'inventoryFull',
    'slotEmpty',
    // FEAT-32
    'zoneActionUnavailable',
    'notInTcgFolder',
    'notStorable',
    'notInVault',
    'vaultFull',
    'notEnoughGold',
    'vaultGoldFull',
    'notEnoughVaultGold',
    'purseFull',
    'notAttribute',
    'deckSlotsFull',
    'deckNotFound',
    'notScavengeable',
    // FEAT-11
    'equipmentNotInUse',
    'effectNotFound',
    'notActivatable',
    'notActivatableYet',
    'notEnoughVigor',
    'notEnoughLife',
    'notEnoughPeak',
    'paymentInvalid',
    'minimumNotMet',
    'choicePending',
    'eventDeckEmpty',
    'staleEncounter',
    'wrongEventPhase',
    'eventPaymentStarted',
    'escapeForbidden',
    'requirementPaid',
    'requirementNotPayable',
    'requirementsNotPaid',
    'eventMinimumNotMet',
    'staleReward',
    'rewardDoesNotFit',
    'combatInProgress',
    'staleCombat',
    'staleCombatTurn',
    'wrongCombatPhase',
    'combatTargetUnavailable',
    'combatAbilityUnavailable',
    'playerDown',
    'staleTriggeredEffectChoice',
    'triggeredEffectUnavailable',
  ]),
  checks: z.array(eventMinimumCheckSchema).optional(),
  /** Carta envolvida na recusa, inclusive `paymentInvalid` (FEAT-11). */
  cardId: z.string().optional(),
  /** FEAT-32: só no `useVault`, índice da operação recusada (a partir de 0). */
  operationIndex: nonNegativeInt.optional(),
})
export type ActionNotAllowedDetails = z.infer<
  typeof actionNotAllowedDetailsSchema
>

/** `409 ACTION_NOT_ALLOWED` com `details` já validado (REQ-42). */
export class ActionNotAllowedError extends ApiError {
  readonly reason: ActionNotAllowedDetails['reason']
  readonly cardId: string | undefined
  readonly operationIndex: number | undefined
  readonly checks: ActionNotAllowedDetails['checks']

  constructor(message: string, details: ActionNotAllowedDetails) {
    super('ACTION_NOT_ALLOWED', message, details)
    this.name = 'ActionNotAllowedError'
    this.reason = details.reason
    this.cardId = details.cardId
    this.operationIndex = details.operationIndex
    this.checks = details.checks
  }
}

async function takePartyAction(
  partyId: string,
  action: PartyAction,
): Promise<PartyActionResponse> {
  try {
    return partyActionResponseSchema.parse(
      await requestJson('POST', `${partyPath(partyId)}/actions`, action),
    )
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ACTION_NOT_ALLOWED') {
      throw new ActionNotAllowedError(
        error.message,
        parseDetails(error, actionNotAllowedDetailsSchema),
      )
    }
    throw error
  }
}

/**
 * Envia uma intenção (`POST /parties/:partyId/actions`) e entrega o `Party`
 * já com o efeito; erros §1.4 chegam como `ApiError`, e `ACTION_NOT_ALLOWED`
 * como `ActionNotAllowedError` com o motivo (D-55, D-57).
 */
export function usePartyAction(
  partyId: string,
): UseMutationResult<PartyActionResponse, Error, PartyAction> {
  return useMutation({
    mutationFn: (action: PartyAction) => takePartyAction(partyId, action),
    retry: false,
  })
}

/** Encerra a sessão; o sucesso invalida `useParties`. */
export function useEndSession(
  partyId: string,
): UseMutationResult<Party, Error, void> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      partySchema.parse(
        await requestJson('POST', `${partyPath(partyId)}/session/end`),
      ),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partiesKey }),
  })
}

/** Abandona o grupo (`204`); sucesso ou erro invalida `useParties`. */
export function useAbandonParty(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (partyId: string) => {
      await requestJson('DELETE', partyPath(partyId))
    },
    retry: false,
    onSettled: () => queryClient.invalidateQueries({ queryKey: partiesKey }),
  })
}
