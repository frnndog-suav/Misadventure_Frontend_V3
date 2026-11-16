import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/http'
import {
  PartyInvalidError,
  useCreateParty,
  type PartyInvalidDetails,
} from '../../api/parties'

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

interface Feedback {
  status: string
  name?: string
  characterName?: string
}

/** Erro do envio → textos da área de status e dos campos (D-01). */
function feedbackFor(error: Error): Feedback {
  if (!(error instanceof ApiError)) {
    return { status: 'Servidor indisponível. Tente novamente.' }
  }
  if (!(error instanceof PartyInvalidError)) return { status: error.message }

  const feedback: Feedback = { status: '' }
  for (const { field, reason } of error.fields) {
    if (field === 'name' || field === 'characterName') {
      feedback[field] = fieldText[field][reason]
    } else if (reason === 'belowMinPlayers') {
      feedback.status = belowMinPlayersText
    } else {
      feedback.status = error.message
    }
  }
  return feedback
}

/** Tela "Novo jogo": cria o grupo de 1 (REQ-15). */
export function NewGame() {
  const create = useCreateParty()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [characterName, setCharacterName] = useState('')

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    create.mutate(
      { name, characterName },
      {
        onSuccess: (party) =>
          navigate(`/grupo/${encodeURIComponent(party.id)}`),
      },
    )
  }

  let feedback: Feedback = { status: '' }
  if (create.isPending) feedback = { status: 'Criando grupo…' }
  else if (create.isError) feedback = feedbackFor(create.error)

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

        <button type="submit" disabled={create.isPending}>
          Criar grupo
        </button>
      </form>
      <p role="status">{feedback.status}</p>
      <Link to="/">Voltar</Link>
    </main>
  )
}
