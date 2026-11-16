import { useEffect, useId, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  text: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Diálogo de confirmação do editor, no molde do REQ-17 (D-35): modal, foco
 * inicial no botão de cancelar, Esc cancela.
 */
export function ConfirmDialog({
  title,
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => cancelRef.current?.focus(), [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <h3 id={`${id}-title`}>{title}</h3>
      <p id={`${id}-text`}>{text}</p>
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" ref={cancelRef} onClick={onCancel}>
        {cancelLabel}
      </button>
    </div>
  )
}
