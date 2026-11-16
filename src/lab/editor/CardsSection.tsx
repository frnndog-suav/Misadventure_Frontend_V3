import { useEffect, useState, type FormEvent } from 'react'
import type { CardType } from '../../api/catalog'
import {
  useEditorCards,
  type ContentStatus,
  type EditorCardFilters,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { cardTypeLabels } from '../../ui/labels'

const unavailable = 'Servidor indisponível. Tente novamente.'

/** Espera da busca depois da última tecla (D-42). */
const searchDelayMs = 300

const statusLabels = {
  draft: 'Rascunho',
  published: 'Publicada',
} satisfies Record<ContentStatus, string>

const cardTypes = Object.keys(cardTypeLabels) as CardType[]
const statuses = Object.keys(statusLabels) as ContentStatus[]

/** Carta escolhida ou tipo da carta nova; o formulário chega na T-23 (D-42). */
type Selection =
  null | { kind: 'card'; cardId: string } | { kind: 'new'; type: CardType }

/** Seção "Cartas" da coleção escolhida (REQ-20); o backend filtra (D-39). */
export function CardsSection({ collectionId }: { collectionId: string }) {
  const [type, setType] = useState<CardType | undefined>(undefined)
  const [status, setStatus] = useState<ContentStatus | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [picking, setPicking] = useState(false)
  const [selection, setSelection] = useState<Selection>(null)

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
      <button type="button" onClick={() => setPicking(true)}>
        Nova carta
      </button>
      {picking && (
        <div role="group" aria-label="Tipo da nova carta">
          {cardTypes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelection({ kind: 'new', type: value })
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
                  onClick={() =>
                    setSelection({ kind: 'card', cardId: card.id })
                  }
                >
                  {`${card.name} · ${cardTypeLabels[card.type]} · ${statusLabels[card.status]}`}
                </button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
