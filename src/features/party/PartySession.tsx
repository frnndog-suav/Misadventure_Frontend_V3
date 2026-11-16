import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/http'
import {
  useEndSession,
  useStartSession,
  type PartyStatus,
} from '../../api/parties'
import { formatSavedAt } from '../../ui/formatSavedAt'

const statusLabel: Record<PartyStatus, string> = {
  idle: 'Pausado',
  inSession: 'Em sessão',
}

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError
    ? error.message
    : 'Servidor indisponível. Tente novamente.'
}

function isNotFound(error: Error | null): boolean {
  return error instanceof ApiError && error.code === 'PARTY_NOT_FOUND'
}

/** Tela do grupo em sessão (REQ-16): Continuar ao abrir, "Encerrar sessão". */
export function PartySession() {
  const { partyId = '' } = useParams()
  const navigate = useNavigate()
  const start = useStartSession(partyId)
  const end = useEndSession(partyId)
  const { mutate: startSession } = start

  // Continuar ao abrir; repetir não muda nada (CONTRATO §3 FEAT-05, D-37).
  useEffect(() => startSession(), [startSession])

  function endSession(): void {
    end.mutate(undefined, {
      onSuccess: () =>
        navigate('/', { state: { message: 'Sessão encerrada.' } }),
    })
  }

  let status = ''
  if (end.isError) status = errorText(end.error)
  else if (start.isError) status = errorText(start.error)
  else if (!start.isSuccess) status = 'Abrindo o grupo…'

  const notFound = isNotFound(start.error) || isNotFound(end.error)
  const party = start.data

  return (
    <main>
      {party && (
        <>
          <h1>{party.name}</h1>
          <h2 id="members-title">Membros</h2>
          <ul aria-labelledby="members-title">
            {party.members.map((member) => (
              <li key={member.id}>
                {member.characterName}
                {member.isHost && ' (host)'}
              </li>
            ))}
          </ul>
          <p>{statusLabel[party.status]}</p>
          <p>Salvo em {formatSavedAt(party.savedAt)}</p>
          <button type="button" onClick={endSession} disabled={end.isPending}>
            Encerrar sessão
          </button>
          <p>A partida começa na próxima etapa do jogo.</p>
        </>
      )}
      <p role="status">{status}</p>
      {notFound && <Link to="/">Voltar ao início</Link>}
    </main>
  )
}
