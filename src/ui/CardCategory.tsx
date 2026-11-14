import type { CardCategoryEntry } from './categories'
import './CardCategory.css'

/** Categoria de carta: ícone, imagem e rótulo juntos (REQ-04, README II.4). */
export function CardCategory({ entry }: { entry: CardCategoryEntry }) {
  const { label, art } = entry
  return (
    <figure className="card-category">
      {art === 'pending' ? (
        <div className="card-category-frame" />
      ) : (
        <img className="card-category-image" src={art.image} alt={label} />
      )}
      <figcaption className="card-category-label">
        {art !== 'pending' && (
          <img
            className="card-category-icon"
            src={art.icon}
            alt=""
            aria-hidden="true"
          />
        )}
        {label}
      </figcaption>
    </figure>
  )
}
