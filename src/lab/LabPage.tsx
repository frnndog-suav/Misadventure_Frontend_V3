import { useState } from 'react'
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
import './LabPage.css'

/** Rótulos dos campos (REQ-06, glossário §2.6), na ordem da tela. */
const fieldLabels: Record<GameConfigKey, string> = {
  minPlayers: 'Jogadores (mínimo)',
  maxPlayers: 'Jogadores (máximo)',
  actionPointsPerTurn: 'Pontos de ação por vez',
  initialPeak: 'Pico inicial',
  initialVigor: 'Vigor inicial',
  baseHealth: 'Vida base',
  initialGold: 'Ouro inicial',
  initialHandSize: 'Mão inicial',
}

const fieldKeys = Object.keys(fieldLabels) as GameConfigKey[]

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

function isFieldKey(field: string | null): field is GameConfigKey {
  return field !== null && field in fieldLabels
}

function ConfigForm({ config }: { config: LabConfig }) {
  const update = useUpdateLabConfig()
  const reset = useResetLabConfig()
  /** Só o que o jogador digitou e ainda não foi salvo. */
  const [edits, setEdits] = useState<Partial<Record<GameConfigKey, string>>>({})
  const [lastAction, setLastAction] = useState<'save' | 'reset' | null>(null)

  const shown = (key: GameConfigKey) => edits[key] ?? String(config.values[key])

  const patch: LabConfigPatch = {}
  let hasEmpty = false
  for (const key of fieldKeys) {
    const text = shown(key)
    if (text.trim() === '') hasEmpty = true
    else if (Number(text) !== config.values[key]) patch[key] = Number(text)
  }
  const canSave = !hasEmpty && Object.keys(patch).length > 0

  const fieldErrors: Partial<Record<GameConfigKey, string>> = {}
  if (lastAction === 'save' && update.error instanceof LabConfigInvalidError) {
    for (const { field, reason } of update.error.fields) {
      if (!isFieldKey(field)) continue
      const text = fieldErrorText(reason, config.limits[field])
      if (text !== null) fieldErrors[field] = text
    }
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
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSave) return
          setLastAction('save')
          update.mutate(patch, { onSuccess: () => setEdits({}) })
        }}
      >
        {fieldKeys.map((key) => {
          const inputId = `lab-${key}`
          const hintId = `${inputId}-hint`
          const errorId = `${inputId}-error`
          const { min, max } = config.limits[key]
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
        <div className="lab-actions">
          <button type="submit" disabled={!canSave}>
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              setLastAction('reset')
              reset.mutate(undefined, { onSuccess: () => setEdits({}) })
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
      <LabConfigSection />
      <ComponentsSection />
    </main>
  )
}
