import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/http'
import {
  modifierSchema,
  useCatalogCard,
  useClasses,
  type Card,
  type ClassDefinition,
  type PlayerClass,
} from '../../api/catalog'
import {
  DimensionInvalidError,
  PartyInvalidError,
  useCreateParty,
  usePartyCreationOptions,
  type PartyInvalidDetails,
} from '../../api/parties'
import { Term } from '../../ui/Term'

type FieldError = PartyInvalidDetails['fields'][number]
type Reason = FieldError['reason']

/** Texto de cada `reason` por campo (REQ-15). */
const fieldText: Record<
  'name' | 'characterName',
  Partial<Record<Reason, string>>
> = {
  name: {
    required: 'Informe o nome do grupo.',
    notString: 'Informe o nome do grupo.',
    blank: 'Informe o nome do grupo.',
    tooLong: 'Use até 40 caracteres.',
  },
  characterName: {
    required: 'Informe o nome do personagem.',
    notString: 'Informe o nome do personagem.',
    blank: 'Informe o nome do personagem.',
    tooLong: 'Use até 24 caracteres.',
  },
}

const belowMinPlayersText =
  'A configuração atual não permite jogar com um grupo de 1.'

const helperCountText: Partial<Record<Reason, string>> = {
  notInteger: 'Escolha uma quantidade inteira de ajudantes.',
  outOfRange: 'Escolha uma quantidade válida de ajudantes.',
  belowMinPlayers: 'A quantidade fica abaixo do mínimo atual de participantes.',
  aboveMaxPlayers: 'A quantidade ultrapassa o máximo atual de participantes.',
}

/** Texto do grupo "Classe" por `reason` (REQ-29). */
const classText: Partial<Record<Reason, string>> = {
  required: 'Escolha uma classe.',
  unknownClass: 'Esta classe não está mais disponível.',
}

const unavailableText = 'Servidor indisponível. Tente novamente.'

interface Feedback {
  status: string
  name?: string
  characterName?: string
  playerClass?: string
  aiHelperCount?: string
  problems?: string[]
}

/** Erro → `message` do contrato ou o texto de servidor indisponível. */
function messageOf(error: Error): string {
  return error instanceof ApiError ? error.message : unavailableText
}

/** Erro do envio → textos da área de status e dos campos (D-01). */
function feedbackFor(error: Error): Feedback {
  if (!(error instanceof ApiError)) return { status: unavailableText }
  if (error instanceof DimensionInvalidError) {
    return { status: error.message, problems: error.problems }
  }
  if (!(error instanceof PartyInvalidError)) return { status: error.message }

  const feedback: Feedback = { status: '' }
  for (const { field, reason } of error.fields) {
    if (field === 'name' || field === 'characterName') {
      feedback[field] = fieldText[field][reason]
    } else if (field === 'playerClass' && reason in classText) {
      feedback.playerClass = classText[reason]
    } else if (field === 'aiHelperCount') {
      feedback.aiHelperCount = helperCountText[reason] ?? error.message
    } else if (reason === 'belowMinPlayers') {
      feedback.status = belowMinPlayersText
    } else {
      feedback.status = error.message
    }
  }
  return feedback
}

/** Nome exibido de uma carta (zonas e eventos usam `title`). */
function cardName(card: Card): string {
  return 'name' in card ? card.name : card.title
}

/** Item do deck pré-pronto; o nome vem de `GET /catalog/cards/:cardId`. */
function StarterDeckItem({
  cardId,
  copies,
}: {
  cardId: string
  copies: number
}) {
  const card = useCatalogCard(cardId)
  return (
    <li>
      {copies}× {card.data === undefined ? '…' : cardName(card.data)}
    </li>
  )
}

/** Modificadores base e deck pré-pronto da classe escolhida (REQ-29). */
function ClassDetails({ definition }: { definition: ClassDefinition }) {
  return (
    <>
      <ul aria-label="Modificadores base">
        {modifierSchema.options.map((m) => (
          <li key={m}>
            {definition.baseModifiers[m]} <Term id={m} />
          </li>
        ))}
      </ul>
      <ul aria-label="Deck pré-pronto">
        {definition.starterDeck.map((entry, i) => (
          <StarterDeckItem key={i} {...entry} />
        ))}
      </ul>
    </>
  )
}

/** Tela "Novo jogo" (REQ-15, REQ-29, REQ-102). */
export function NewGame() {
  const create = useCreateParty()
  const classes = useClasses()
  const options = usePartyCreationOptions()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(null)
  const [selectedHelpers, setSelectedHelpers] = useState<number | null>(null)
  const minHelpers = (options.data?.minPlayers ?? 1) - 1
  const maxHelpers = (options.data?.maxPlayers ?? 1) - 1
  const aiHelperCount = selectedHelpers ?? minHelpers
  const countInRange =
    aiHelperCount >= minHelpers && aiHelperCount <= maxHelpers
  const canSubmit =
    options.isSuccess &&
    !options.isFetching &&
    countInRange &&
    !create.isPending

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!canSubmit) return
    setSelectedHelpers(aiHelperCount)
    create.mutate(
      playerClass === null
        ? { name, characterName, aiHelperCount }
        : { name, characterName, playerClass, aiHelperCount },
      {
        onSuccess: (party) =>
          navigate(`/grupo/${encodeURIComponent(party.id)}`),
        onError: (error) => {
          if (
            error instanceof PartyInvalidError &&
            error.fields.some(
              ({ field, reason }) =>
                field === 'aiHelperCount' &&
                (reason === 'belowMinPlayers' || reason === 'aboveMaxPlayers'),
            )
          ) {
            void options.refetch()
          }
        },
      },
    )
  }

  let feedback: Feedback = { status: '' }
  if (create.isPending) feedback = { status: 'Criando grupo…' }
  else if (create.isError) feedback = feedbackFor(create.error)
  else if (classes.isPending) feedback = { status: 'Carregando classes…' }
  else if (classes.isError) feedback = { status: messageOf(classes.error) }

  const countError = feedback.aiHelperCount
  const helperChoices = options.data
    ? Array.from(
        { length: maxHelpers - minHelpers + 1 },
        (_, i) => minHelpers + i,
      )
    : []
  const chosen = classes.data?.find((c) => c.playerClass === playerClass)

  return (
    <main className="campaign campaign--entry">
      <h1>Novo jogo</h1>
      <form className="campaign-creation" onSubmit={submit} noValidate>
        <div className="campaign-panel campaign-fields">
          <label htmlFor="party-name">Nome do grupo</label>
          <input
            id="party-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={feedback.name ? 'party-name-error' : undefined}
          />
          {feedback.name && <p id="party-name-error">{feedback.name}</p>}

          <label htmlFor="character-name">Nome do personagem</label>
          <input
            id="character-name"
            type="text"
            value={characterName}
            onChange={(event) => setCharacterName(event.target.value)}
            aria-describedby={
              feedback.characterName ? 'character-name-error' : undefined
            }
          />
          {feedback.characterName && (
            <p id="character-name-error">{feedback.characterName}</p>
          )}

          <div
            role="radiogroup"
            className="campaign-class-options"
            aria-labelledby="player-class-label"
            aria-describedby={
              feedback.playerClass ? 'player-class-error' : undefined
            }
          >
            <p id="player-class-label">Classe</p>
            {classes.data?.length === 0 && <p>Nenhuma classe publicada.</p>}
            {classes.data?.map((c) => (
              <label key={c.playerClass}>
                <input
                  type="radio"
                  name="player-class"
                  value={c.playerClass}
                  checked={playerClass === c.playerClass}
                  onChange={() => setPlayerClass(c.playerClass)}
                />
                {c.name} (
                {c.essentialAttributes.map((a, i) => (
                  <span key={a}>
                    {i > 0 && ', '}
                    <Term id={a} />
                  </span>
                ))}
                )
              </label>
            ))}
          </div>
          {feedback.playerClass && (
            <p id="player-class-error">{feedback.playerClass}</p>
          )}

          <label htmlFor="ai-helper-count">Ajudantes de IA</label>
          <select
            id="ai-helper-count"
            value={options.data ? aiHelperCount : ''}
            disabled={!options.data || options.isFetching || create.isPending}
            aria-invalid={countError ? true : undefined}
            aria-describedby={countError ? 'ai-helper-count-error' : undefined}
            onChange={(event) => setSelectedHelpers(Number(event.target.value))}
          >
            {!options.data && <option value="">—</option>}
            {!countInRange && (
              <option value={aiHelperCount} disabled>
                {aiHelperCount}
              </option>
            )}
            {helperChoices.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          {countError && (
            <p id="ai-helper-count-error" role="alert">
              {countError}
            </p>
          )}
          {options.isPending && <p>Carregando limites de criação…</p>}
          {options.isError && (
            <>
              <p role="alert">{messageOf(options.error)}</p>
              <button type="button" onClick={() => void options.refetch()}>
                Recarregar limites
              </button>
            </>
          )}
        </div>
        <section
          className="campaign-panel campaign-class"
          aria-label="Resumo da classe"
        >
          <h2>{chosen?.name ?? 'Classe do personagem'}</h2>
          {chosen ? (
            <ClassDetails definition={chosen} />
          ) : (
            <p>Escolha uma classe para consultar os atributos e o deck.</p>
          )}
          <button
            className="campaign-primary"
            type="submit"
            disabled={!canSubmit}
          >
            Criar grupo
          </button>
          <p role="status">{feedback.status}</p>
          {feedback.problems !== undefined && (
            <ul aria-label="Problemas">
              {feedback.problems.map((problem, i) => (
                <li key={i}>{problem}</li>
              ))}
            </ul>
          )}
          <Link to="/">Voltar</Link>
        </section>
      </form>
    </main>
  )
}
