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

/** Tela "Novo jogo": cria o grupo de 1 com a classe escolhida (REQ-15, REQ-29). */
export function NewGame() {
  const create = useCreateParty()
  const classes = useClasses()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(null)

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    create.mutate(
      playerClass === null
        ? { name, characterName }
        : { name, characterName, playerClass },
      {
        onSuccess: (party) =>
          navigate(`/grupo/${encodeURIComponent(party.id)}`),
      },
    )
  }

  let feedback: Feedback = { status: '' }
  if (create.isPending) feedback = { status: 'Criando grupo…' }
  else if (create.isError) feedback = feedbackFor(create.error)
  else if (classes.isPending) feedback = { status: 'Carregando classes…' }
  else if (classes.isError) feedback = { status: messageOf(classes.error) }

  const chosen = classes.data?.find((c) => c.playerClass === playerClass)

  return (
    <main>
      <h1>Novo jogo</h1>
      <form onSubmit={submit} noValidate>
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
        {chosen !== undefined && <ClassDetails definition={chosen} />}

        <button type="submit" disabled={create.isPending}>
          Criar grupo
        </button>
      </form>
      <p role="status">{feedback.status}</p>
      {feedback.problems !== undefined && (
        <ul aria-label="Problemas">
          {feedback.problems.map((problem, i) => (
            <li key={i}>{problem}</li>
          ))}
        </ul>
      )}
      <Link to="/">Voltar</Link>
    </main>
  )
}
