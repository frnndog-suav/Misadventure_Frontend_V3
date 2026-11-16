import { useEffect, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * Alterações não salvas (REQ-24). Com `dirty`: sair para outra rota (link,
 * Voltar do navegador) ou rodar uma ação passada a `guard` abre o diálogo
 * "Descartar alterações?"; fechar ou recarregar a aba usa o aviso do
 * navegador. Precisa do roteador de dados (D-41), por causa do `useBlocker`.
 */
export function useUnsavedGuard(
  dirty: boolean,
  subject: 'desta carta' | 'desta coleção',
): { guard: (action: () => void) => void; dialog: ReactNode } {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  )
  const [pending, setPending] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: Event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function guard(action: () => void): void {
    if (dirty) setPending(() => action)
    else action()
  }

  const blocked = blocker.state === 'blocked'

  function discard(): void {
    if (blocked) {
      blocker.proceed()
    } else if (pending) {
      pending()
    }
    setPending(null)
  }

  function keepEditing(): void {
    if (blocked) blocker.reset()
    setPending(null)
  }

  const dialog =
    blocked || pending ? (
      <ConfirmDialog
        title="Descartar alterações?"
        text={`As alterações ${subject} ainda não foram salvas.`}
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={discard}
        onCancel={keepEditing}
      />
    ) : null

  return { guard, dialog }
}
