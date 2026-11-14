// Catálogo de categorias SÓ PARA TESTES (README II.4, spec D-22).
// Importado apenas pelos testes; nunca entra no build de release.
import type { CardCategoryEntry } from '../categories'
import relicIcon from './test-relic-icon.svg'
import relicImage from './test-relic-image.svg'

export const testCategoryCatalog = {
  'test-relic': {
    label: 'Relíquia de teste',
    art: { icon: relicIcon, image: relicImage },
  },
  'test-pending': { label: 'Categoria pendente', art: 'pending' },
} satisfies Record<string, CardCategoryEntry>
