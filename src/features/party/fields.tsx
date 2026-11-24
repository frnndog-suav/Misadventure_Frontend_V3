import { useId } from 'react'

/** Campo numérico com o erro ligado por `aria-describedby` (REQ-52, REQ-73). */
export function NumberField({
  label,
  value,
  onChange,
  min,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  error: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error !== ''}
        aria-describedby={error !== '' ? errorId : undefined}
      />
      {error !== '' && <p id={errorId}>{error}</p>}
    </>
  )
}
