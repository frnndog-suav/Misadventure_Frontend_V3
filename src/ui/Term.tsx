import { useId, useState } from 'react'
import { termCatalog, type TermId } from './terms'
import './Term.css'

/** Termo do jogo com destaque e tooltip explicativo (REQ-03). */
export function Term({ id }: { id: TermId }) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const entry = termCatalog[id]

  return (
    <span className="term-wrap">
      <span
        className="term"
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        {entry.name}
      </span>
      {open && (
        <span role="tooltip" id={tooltipId} className="term-tooltip">
          {entry.description}
        </span>
      )}
    </span>
  )
}
