import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/http'
import {
  useAbandonParty,
  useParties,
  type PartyStatus,
  type PartySummary,
} from '../../api/parties'
import { formatSavedAt } from '../../ui/formatSavedAt'

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error | null): string {
  return error instanceof ApiError
    ? error.message
    : 'Servidor indisponível. Tente novamente.'
}

const statusLabel: Record<PartyStatus, string> = {
  idle: 'Pausado',
  inSession: 'Em sessão',
  frozen: 'Congelado · aguardando a próxima dimensão',
}

/** Mensagem deixada por outra tela ao voltar a `/` (D-37). */
function messageFrom(state: unknown): string {
  return typeof state === 'object' &&
    state !== null &&
    'message' in state &&
    typeof state.message === 'string'
    ? state.message
    : ''
}

interface AbandonDialogProps {
  party: PartySummary
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmação do abandono (REQ-17): modal, foco inicial em "Cancelar". */
function AbandonDialog({ party, onCancel, onConfirm }: AbandonDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => cancelRef.current?.focus(), [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandon-title"
      aria-describedby="abandon-text"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <h3 id="abandon-title">Abandonar “{party.name}”?</h3>
      <p id="abandon-text">
        O save será apagado para sempre. Não dá para desfazer.
      </p>
      <button type="button" onClick={onConfirm}>
        Abandonar
      </button>
      <button type="button" ref={cancelRef} onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}

/** Seção "Seus jogos" do menu inicial (REQ-14, REQ-17). */
export function SavedGames() {
  const parties = useParties()
  const abandon = useAbandonParty()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirming, setConfirming] = useState<PartySummary | null>(null)
  const [message, setMessage] = useState(() => messageFrom(location.state))
  const abandonButtons = useRef(new Map<string, HTMLButtonElement>())

  function closeDialog(): void {
    const id = confirming?.id
    setConfirming(null)
    if (id) abandonButtons.current.get(id)?.focus()
  }

  function confirmAbandon(): void {
    if (!confirming) return
    const id = confirming.id
    setConfirming(null)
    abandon.mutate(id, {
      onSuccess: () => setMessage('Grupo abandonado.'),
      onError: (error) => setMessage(errorText(error)),
    })
  }

  let status = message
  if (!status) {
    if (parties.isPending) status = 'Carregando jogos…'
    else if (parties.isError) status = errorText(parties.error)
  }

  return (
    <section className="campaign-panel" aria-labelledby="saved-games-title">
      <h2 id="saved-games-title">Seus jogos</h2>
      <p role="status">{status}</p>
      {parties.isSuccess &&
        (parties.data.length === 0 ? (
          <p>Nenhum jogo salvo.</p>
        ) : (
          <ul className="campaign-saves">
            {parties.data.map((party) => (
              <li key={party.id}>
                <div>
                  <strong>{party.name}</strong>
                  <span>{party.characterNames.join(', ')}</span>
                </div>
                <div>
                  <span>{statusLabel[party.status]}</span>
                  <span>Salvo em {formatSavedAt(party.savedAt)}</span>
                </div>
                <div className="campaign-controls">
                  {party.status !== 'frozen' && (
                    <button
                      className="campaign-primary"
                      type="button"
                      onClick={() =>
                        navigate(`/grupo/${encodeURIComponent(party.id)}`)
                      }
                    >
                      Continuar
                    </button>
                  )}
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) abandonButtons.current.set(party.id, el)
                      else abandonButtons.current.delete(party.id)
                    }}
                    onClick={() => {
                      setMessage('')
                      setConfirming(party)
                    }}
                  >
                    Abandonar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      {confirming && (
        <AbandonDialog
          party={confirming}
          onCancel={closeDialog}
          onConfirm={confirmAbandon}
        />
      )}
    </section>
  )
}
