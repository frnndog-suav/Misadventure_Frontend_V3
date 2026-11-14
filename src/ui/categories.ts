// Catálogo de categorias de carta (REQ-04, spec D-22). Ids do glossário do
// docs/CONTRATO.md §2. Começa vazio: as categorias reais chegam com o modelo
// das cartas na FEAT-04. Imagens: versões do produto em src/assets/ (/assets).

export type CardCategoryEntry = {
  /** Rótulo em pt-BR. */
  label: string
  /** URLs do ícone e da imagem, ou 'pending' enquanto a arte não foi entregue. */
  art: { icon: string; image: string } | 'pending'
}

export const categoryCatalog = {} satisfies Record<string, CardCategoryEntry>

export type CardCategoryId = keyof typeof categoryCatalog
