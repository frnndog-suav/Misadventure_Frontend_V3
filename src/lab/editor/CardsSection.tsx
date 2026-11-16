import { useEffect, useState, type FormEvent } from 'react'
import type { CardType } from '../../api/catalog'
import {
  useEditorCard,
  useEditorCards,
  type ContentStatus,
  type EditorCardFilters,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { cardTypeLabels } from '../../ui/labels'
import { CardForm } from './CardForm'
import { emptyForm, formFromCard } from './cardFormValues'

const unavailable = 'Servidor indisponível. Tente novamente.'

/** Espera da busca depois da última tecla (D-42). */
const searchDelayMs = 300

const statusLabels = {
  draft: 'Rascunho',
  published: 'Publicada',
} satisfies Record<ContentStatus, string>

const cardTypes = Object.keys(cardTypeLabels) as CardType[]
const statuses = Object.keys(statusLabels) as ContentStatus[]

/** Carta escolhida ou tipo da carta nova (D-42). */
type Selection =
  null | { kind: 'card'; cardId: string } | { kind: 'new'; type: CardType }

interface FormProps {
  collectionId: string
  onSaved: (cardId: string) => void
  onDirtyChange: (dirty: boolean) => void
}

/** Carrega a carta escolhida e abre o formulário com os valores recebidos. */
function SavedCardForm({ cardId, ...props }: FormProps & { cardId: string }) {
  const { data, error } = useEditorCard(cardId)
  if (data === undefined) {
    return (
      <section aria-labelledby="editor-card-title">
        <h2 id="editor-card-title">Carta</h2>
        <p role="status">
          {error === null
            ? 'Carregando carta…'
            : error instanceof ApiError
              ? error.message
              : unavailable}
        </p>
      </section>
    )
  }
  const values = formFromCard(data.card)
  return (
    <CardForm
      {...props}
      opened={{
        cardId: data.card.id,
        status: data.status,
        values,
      }}
    />
  )
}

/** Formulário da escolha aberta. */
function OpenedForm({
  opened,
  ...props
}: FormProps & { opened: NonNullable<Selection> }) {
  if (opened.kind === 'card') {
    return <SavedCardForm {...props} cardId={opened.cardId} />
  }
  return (
    <CardForm
      {...props}
      opened={{ cardId: null, status: 'draft', values: emptyForm(opened.type) }}
    />
  )
}

/** Seção "Cartas" da coleção escolhida (REQ-20); o backend filtra (D-39). */
export function CardsSection({
  collectionId,
  guard,
  onDirtyChange,
}: {
  collectionId: string
  guard: (action: () => void) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [type, setType] = useState<CardType | undefined>(undefined)
  const [status, setStatus] = useState<ContentStatus | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [picking, setPicking] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)
  /** O que o formulário abriu; salvar muda só a `selection` (D-43). */
  const [opened, setOpened] = useState<Selection>(null)
  const [formKey, setFormKey] = useState(0)

  function open(next: NonNullable<Selection>): void {
    setSelection(next)
    setOpened(next)
    setFormKey((key) => key + 1)
  }

  useEffect(() => {
    const timer = setTimeout(() => setQ(search), searchDelayMs)
    return () => clearTimeout(timer)
  }, [search])

  const filters: EditorCardFilters = { type, status, q }
  const cards = useEditorCards(collectionId, filters)

  function onSearch(event: FormEvent): void {
    event.preventDefault()
    setQ(search)
  }

  let statusText = ''
  if (cards.isPending) statusText = 'Carregando cartas…'
  else if (cards.isError)
    statusText =
      cards.error instanceof ApiError ? cards.error.message : unavailable

  return (
    <section aria-labelledby="editor-cards-title">
      <h2 id="editor-cards-title">Cartas</h2>
      <p role="status">{statusText}</p>
      <fieldset role="radiogroup" aria-label="Tipo de carta">
        <legend>Tipo de carta</legend>
        <label>
          <input
            type="radio"
            name="editor-card-type"
            checked={type === undefined}
            onChange={() => setType(undefined)}
          />
          Todos
        </label>
        {cardTypes.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="editor-card-type"
              checked={type === value}
              onChange={() => setType(value)}
            />
            {cardTypeLabels[value]}
          </label>
        ))}
      </fieldset>
      <fieldset role="radiogroup" aria-label="Situação">
        <legend>Situação</legend>
        <label>
          <input
            type="radio"
            name="editor-card-status"
            checked={status === undefined}
            onChange={() => setStatus(undefined)}
          />
          Todas
        </label>
        {statuses.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="editor-card-status"
              checked={status === value}
              onChange={() => setStatus(value)}
            />
            {statusLabels[value]}
          </label>
        ))}
      </fieldset>
      <form role="search" onSubmit={onSearch}>
        <label htmlFor="editor-card-search">Buscar por nome</label>
        <input
          id="editor-card-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>
      <button
        type="button"
        onClick={() =>
          guard(() => {
            setOpened(null)
            setPicking(true)
          })
        }
      >
        Nova carta
      </button>
      {picking && (
        <div role="group" aria-label="Tipo da nova carta">
          {cardTypes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                open({ kind: 'new', type: value })
                setPicking(false)
              }}
            >
              {cardTypeLabels[value]}
            </button>
          ))}
        </div>
      )}
      {cards.isSuccess &&
        (cards.data.length === 0 ? (
          <p>Nenhuma carta neste filtro.</p>
        ) : (
          <ul aria-label="Cartas">
            {cards.data.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  aria-pressed={
                    selection?.kind === 'card' && selection.cardId === card.id
                  }
                  onClick={() => {
                    if (
                      selection?.kind === 'card' &&
                      selection.cardId === card.id
                    )
                      return
                    guard(() => open({ kind: 'card', cardId: card.id }))
                  }}
                >
                  {`${card.name} · ${cardTypeLabels[card.type]} · ${statusLabels[card.status]}`}
                </button>
              </li>
            ))}
          </ul>
        ))}
      {opened !== null && (
        <OpenedForm
          key={formKey}
          opened={opened}
          collectionId={collectionId}
          onDirtyChange={onDirtyChange}
          onSaved={(cardId) => setSelection({ kind: 'card', cardId })}
        />
      )}
    </section>
  )
}
