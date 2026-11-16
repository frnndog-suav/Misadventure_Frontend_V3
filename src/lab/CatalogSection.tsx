import { useState } from 'react'
import {
  cardTypeSchema,
  useCards,
  useCollections,
  type Card,
  type CardType,
  type CollectionSummary,
} from '../api/catalog'
import { ApiError } from '../api/http'
import { FullCard } from '../ui/cards/FullCard'
import { cardTypeLabels } from '../ui/labels'

const unavailable = 'Servidor indisponível. Tente novamente.'
const loading = 'Carregando catálogo…'

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError ? error.message : unavailable
}

/** Nome da carta: `name`, ou `title` em zona e eventos. */
function cardName(card: Card): string {
  switch (card.type) {
    case 'zone':
    case 'randomEvent':
    case 'combatEvent':
      return card.title
    case 'attribute':
    case 'equipment':
    case 'item':
    case 'dimension':
      return card.name
    default: {
      const _exhaustive: never = card
      return _exhaustive
    }
  }
}

type Filter = CardType | 'all'

function CardList({
  collectionId,
  filter,
}: {
  collectionId: string
  filter: Filter
}) {
  const cards = useCards(collectionId, filter === 'all' ? undefined : filter)
  const [chosenId, setChosenId] = useState<string | null>(null)

  if (!cards.isSuccess) {
    return (
      <p role="status">{cards.isPending ? loading : errorText(cards.error)}</p>
    )
  }

  const chosen = cards.data.find((c) => c.id === chosenId)
  return (
    <>
      <p role="status" />
      {cards.data.length === 0 ? (
        <p>Nenhuma carta neste filtro.</p>
      ) : (
        <div className="lab-catalog-body">
          <ul className="lab-catalog-list" aria-label="Cartas">
            {cards.data.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  aria-pressed={card.id === chosenId}
                  onClick={() => setChosenId(card.id)}
                >
                  {`${cardName(card)} · ${cardTypeLabels[card.type]}`}
                </button>
              </li>
            ))}
          </ul>
          {chosen && <FullCard card={chosen} />}
        </div>
      )}
    </>
  )
}

function CatalogBrowser({ collections }: { collections: CollectionSummary[] }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? '')
  const [filter, setFilter] = useState<Filter>('all')
  const collection = collections.find((c) => c.id === collectionId)

  const counts = collection?.cardCounts
  const total = counts
    ? Object.values(counts).reduce((sum, n) => sum + n, 0)
    : 0
  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: `Todos (${total})` },
    ...cardTypeSchema.options.map((type) => ({
      value: type,
      label: `${cardTypeLabels[type]} (${counts?.[type] ?? 0})`,
    })),
  ]

  return (
    <>
      <fieldset role="radiogroup" aria-label="Coleção">
        <legend>Coleção</legend>
        {collections.map((c) => (
          <label key={c.id}>
            <input
              type="radio"
              name="lab-collection"
              checked={c.id === collectionId}
              onChange={() => setCollectionId(c.id)}
            />
            {c.name}
          </label>
        ))}
      </fieldset>
      <fieldset role="radiogroup" aria-label="Tipo de carta">
        <legend>Tipo de carta</legend>
        {filters.map(({ value, label }) => (
          <label key={value}>
            <input
              type="radio"
              name="lab-card-type"
              checked={value === filter}
              onChange={() => setFilter(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      {collection && (
        <CardList
          key={`${collectionId}:${filter}`}
          collectionId={collectionId}
          filter={filter}
        />
      )}
    </>
  )
}

/** Catálogo de cartas (REQ-08, D-26): tudo vem pronto do backend. */
export function CatalogSection() {
  const collections = useCollections()
  return (
    <section aria-labelledby="lab-catalog-title" className="lab-catalog">
      <h2 id="lab-catalog-title">Catálogo</h2>
      {collections.isSuccess ? (
        <CatalogBrowser collections={collections.data} />
      ) : (
        <p role="status">
          {collections.isPending ? loading : errorText(collections.error)}
        </p>
      )}
    </section>
  )
}
