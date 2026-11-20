import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/http'
import {
  LabConfigInvalidError,
  useLabConfig,
  useResetLabConfig,
  useUpdateLabConfig,
  type GameConfigKey,
  type LabConfig,
  type LabConfigInvalidDetails,
  type LabConfigPatch,
} from '../api/labConfig'
import { CardCategory } from '../ui/CardCategory'
import { Term } from '../ui/Term'
import { attributeSchema } from '../api/catalog'
import { testCategoryCatalog } from '../ui/test-assets/categories'
import { CatalogSection } from './CatalogSection'
import { GrantSection } from './GrantSection'
import './LabPage.css'

/** Rótulos dos campos (REQ-06, glossário §2.6), na ordem da tela. */
type NumericKey = GameConfigKey | 'escapeVigorPercent'

const fieldLabels: Record<NumericKey, string> = {
  minPlayers: 'Jogadores (mínimo)',
  maxPlayers: 'Jogadores (máximo)',
  actionPointsPerTurn: 'Pontos de ação por vez',
  initialPeak: 'Pico inicial',
  initialVigor: 'Vigor inicial',
  baseHealth: 'Vida base',
  initialGold: 'Ouro inicial',
  initialHandSize: 'Mão inicial',
  // FEAT-06 (REQ-27)
  minDeckSize: 'Tamanho mínimo da build',
  lockOneEssential: 'Trava (classe com 1 essencial)',
  lockTwoEssentials: 'Trava (classe com 2 essenciais)',
  mapMaxAttempts: 'Tentativas do gerador de mapa',
  defaultAttack: 'Ataque padrão',
  defaultDefense: 'Defesa padrão',
  defaultAccuracy: 'Precisão padrão',
  defaultEvasion: 'Esquiva padrão',
  defaultCelerity: 'Celeridade padrão',
  defaultPiercing: 'Perfuração padrão',
  defaultReflection: 'Reflexão padrão',
  // FEAT-09 (REQ-39)
  maxCopiesPerCard: 'Cópias máximas por carta no deck',
  tcgFolderCapacity: 'Capacidade da pasta de TCG',
  recoverHealthPercent: 'Recuperar: % da vida máxima',
  recoverVigorPercent: 'Recuperar: % do Pico em Vigor',
  recoverHandSize: 'Recuperar: comprar até (cartas na mão)',
  // FEAT-10 (REQ-43)
  inventoryCapacity: 'Capacidade do inventário',
  purseCapacity: 'Capacidade da bolsa',
  // FEAT-32 (REQ-47)
  vaultCapacity: 'Capacidade do cofre',
  vaultDeckSlots: 'Slots de decks do cofre (a build em uso ocupa um)',
  vaultGoldCapacity: 'Capacidade de ouro do cofre',
  escapeVigorPercent: 'Custo de fuga (% do Pico em Vigor)',
}

const fieldKeys = Object.keys(fieldLabels) as NumericKey[]
type ReserveEntry = LabConfig['values']['reserveDeck'][number]
type ReserveDraft = {
  type: ReserveEntry['type']
  weight: string
  amount: string
  cardId: string
}

function reserveDraft(entry: ReserveEntry): ReserveDraft {
  return {
    type: entry.type,
    weight: String(entry.weight),
    amount: entry.type === 'gold' ? String(entry.amount) : '1',
    cardId: entry.type === 'card' ? entry.cardId : '',
  }
}

function ReserveFields({
  entries,
  limits,
  onChange,
  errors,
}: {
  entries: ReserveDraft[]
  limits: NonNullable<LabConfig['limits']['reserveDeck']>
  onChange: (entries: ReserveDraft[]) => void
  errors: LabConfigInvalidDetails['fields']
}) {
  function message(path: string) {
    const reason = errors.find(({ field }) => field === path)?.reason
    if (reason === 'notInteger') return 'Use um número inteiro.'
    if (reason === 'outOfRange') {
      if (path === 'reserveDeck')
        return `Inclua pelo menos ${limits.minEntries} entrada(s).`
      if (path.endsWith('.weight'))
        return `Use um peso de pelo menos ${limits.minWeight}.`
    }
    if (reason) return 'Valor inválido.'
  }
  return (
    <fieldset aria-describedby="lab-reserveDeck-hint">
      <legend>Deck de reserva</legend>
      <p id="lab-reserveDeck-hint" className="lab-hint">
        Mínimo de entradas: {limits.minEntries}. Peso mínimo: {limits.minWeight}
        .
      </p>
      {message('reserveDeck') && (
        <p className="lab-error">{message('reserveDeck')}</p>
      )}
      {entries.map((entry, index) => {
        const path = `reserveDeck.${index}`
        const update = (next: Partial<ReserveDraft>) =>
          onChange(
            entries.map((old, i) => (i === index ? { ...old, ...next } : old)),
          )
        return (
          <fieldset key={index}>
            <legend>Entrada {index + 1}</legend>
            <label>
              Tipo da entrada {index + 1}
              <select
                value={entry.type}
                onChange={(e) =>
                  update({ type: e.target.value === 'card' ? 'card' : 'gold' })
                }
                aria-describedby={
                  message(path + '.type') ? path + '.type-error' : undefined
                }
              >
                <option value="gold">Ouro</option>
                <option value="card">Carta</option>
              </select>
            </label>
            {message(path + '.type') && (
              <p id={path + '.type-error'} className="lab-error">
                {message(path + '.type')}
              </p>
            )}
            {message(path) && <p className="lab-error">{message(path)}</p>}
            {(
              [
                entry.type === 'gold'
                  ? (['amount', 'Quantidade de ouro da entrada'] as const)
                  : (['cardId', 'Carta da entrada'] as const),
                ['weight', 'Peso da entrada'],
              ] as const
            ).map(([key, label]) => {
              const id = `lab-${path}.${key}`
              const error = message(`${path}.${key}`)
              return (
                <div className="lab-field" key={key}>
                  <label htmlFor={id}>
                    {label} {index + 1}
                  </label>
                  <input
                    id={id}
                    type={key === 'cardId' ? 'text' : 'number'}
                    value={entry[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? id + '-error' : undefined}
                  />
                  {error && (
                    <span id={id + '-error'} className="lab-error">
                      {error}
                    </span>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              onClick={() => onChange(entries.filter((_, i) => i !== index))}
            >
              Remover entrada {index + 1}
            </button>
          </fieldset>
        )
      })}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...entries,
            reserveDraft({ type: 'gold', amount: 1, weight: limits.minWeight }),
          ])
        }
      >
        Adicionar entrada
      </button>
    </fieldset>
  )
}

const unavailable = 'Servidor indisponível. Tente novamente.'

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError ? error.message : unavailable
}

/** Texto por campo, montado de `reason` + `limits` (D-23). Sem texto: só a `message`. */
function fieldErrorText(
  reason: LabConfigInvalidDetails['fields'][number]['reason'],
  limits: { min: number; max: number },
): string | null {
  switch (reason) {
    case 'outOfRange':
      return `Use um valor entre ${limits.min} e ${limits.max}.`
    case 'notInteger':
      return 'Use um número inteiro.'
    case 'minAboveMax':
      return 'O mínimo de jogadores não pode passar do máximo.'
    case 'unknownKey':
    case 'invalidBody':
      return null
    default: {
      const _exhaustive: never = reason
      return _exhaustive
    }
  }
}

function isFieldKey(field: string | null): field is NumericKey {
  return field !== null && Object.hasOwn(fieldLabels, field)
}

function ConfigForm({ config }: { config: LabConfig }) {
  const update = useUpdateLabConfig()
  const reset = useResetLabConfig()
  /** Só o que o jogador digitou e ainda não foi salvo. */
  const [edits, setEdits] = useState<Partial<Record<NumericKey, string>>>({})
  const [reserveEdits, setReserveEdits] = useState<ReserveDraft[] | null>(null)
  const [lastAction, setLastAction] = useState<'save' | 'reset' | null>(null)

  const shown = (key: NumericKey) => edits[key] ?? String(config.values[key])

  const patch: LabConfigPatch = {}
  let hasEmpty = false
  for (const key of fieldKeys) {
    if (!config.limits[key]) continue
    const text = shown(key)
    if (text.trim() === '') hasEmpty = true
    else if (Number(text) !== config.values[key]) patch[key] = Number(text)
  }
  if (reserveEdits) {
    const reserve = reserveEdits.map(
      ({ type, weight, amount, cardId }): ReserveEntry =>
        type === 'gold'
          ? { type, amount: Number(amount), weight: Number(weight) }
          : { type, cardId, weight: Number(weight) },
    )
    hasEmpty ||= reserveEdits.some(
      ({ type, amount, cardId, weight }) =>
        !weight.trim() || !(type === 'gold' ? amount : cardId).trim(),
    )
    if (JSON.stringify(reserve) !== JSON.stringify(config.values.reserveDeck))
      patch.reserveDeck = reserve
  }
  const canSave = !hasEmpty && Object.keys(patch).length > 0

  const backendErrors =
    lastAction === 'save' && update.error instanceof LabConfigInvalidError
      ? update.error.fields
      : []
  const fieldErrors: Partial<Record<NumericKey, string>> = {}
  for (const { field, reason } of backendErrors) {
    if (!isFieldKey(field)) continue
    const limits = config.limits[field]
    const text = limits && fieldErrorText(reason, limits)
    if (text) fieldErrors[field] = text
  }
  const pending = update.isPending || reset.isPending
  function clearEdits() {
    setEdits({})
    setReserveEdits(null)
  }

  let status = ''
  if (lastAction === 'save') {
    if (update.isSuccess) status = 'Configuração salva.'
    else if (update.error) status = errorText(update.error)
  } else if (lastAction === 'reset') {
    if (reset.isSuccess) status = 'Padrões restaurados.'
    else if (reset.error) status = errorText(reset.error)
  }

  return (
    <>
      <p role="status">{status}</p>
      <form
        className="lab-config"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSave || pending) return
          setLastAction('save')
          update.mutate(patch, { onSuccess: clearEdits })
        }}
      >
        {fieldKeys.map((key) => {
          const inputId = `lab-${key}`
          const hintId = `${inputId}-hint`
          const errorId = `${inputId}-error`
          const limits = config.limits[key]
          if (!limits) return null
          const { min, max } = limits
          const error = fieldErrors[key]
          return (
            <div className="lab-field" key={key}>
              <label htmlFor={inputId}>{fieldLabels[key]}</label>
              <input
                id={inputId}
                type="number"
                value={shown(key)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                onChange={(e) =>
                  setEdits((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
              <span id={hintId} className="lab-hint">
                {`Padrão: ${config.defaults[key]} · Mín. ${min} · Máx. ${max}`}
              </span>
              {error && (
                <span id={errorId} className="lab-error">
                  {error}
                </span>
              )}
            </div>
          )
        })}
        {config.limits.reserveDeck && (
          <ReserveFields
            entries={
              reserveEdits ?? config.values.reserveDeck.map(reserveDraft)
            }
            limits={config.limits.reserveDeck}
            errors={backendErrors}
            onChange={setReserveEdits}
          />
        )}
        <div className="lab-actions">
          <button type="submit" disabled={!canSave || pending}>
            Salvar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setLastAction('reset')
              reset.mutate(undefined, { onSuccess: clearEdits })
            }}
          >
            Restaurar padrões
          </button>
        </div>
      </form>
    </>
  )
}

/** Configuração ajustável do jogo (REQ-06). */
function LabConfigSection() {
  const config = useLabConfig()
  return (
    <section aria-labelledby="lab-config-title">
      <h2 id="lab-config-title">Configuração</h2>
      {config.isSuccess ? (
        <ConfigForm config={config.data} />
      ) : (
        <p role="status">
          {config.isPending
            ? 'Carregando configuração…'
            : errorText(config.error)}
        </p>
      )}
    </section>
  )
}

/** Vitrine dos componentes compartilhados (REQ-07). */
function ComponentsSection() {
  return (
    <section aria-labelledby="lab-components-title">
      <h2 id="lab-components-title">Componentes</h2>
      <p className="lab-terms">
        {attributeSchema.options.map((id) => (
          <Term key={id} id={id} />
        ))}
      </p>
      <div className="lab-categories">
        {Object.values(testCategoryCatalog).map((entry) => (
          <CardCategory key={entry.label} entry={entry} />
        ))}
      </div>
    </section>
  )
}

/** Tela do laboratório (REQ-05). Só existe no build de dev (D-07). */
export default function LabPage() {
  return (
    <main>
      <h1>Laboratório</h1>
      <nav aria-label="Ferramentas">
        <Link to="/lab/editor">Editor de conteúdo</Link>
      </nav>
      <LabConfigSection />
      <ComponentsSection />
      <CatalogSection />
      <GrantSection />
    </main>
  )
}
