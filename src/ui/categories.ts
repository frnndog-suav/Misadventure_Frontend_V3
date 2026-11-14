// Catálogo de categorias de carta (REQ-04, spec D-22, D-28). Ids e rótulos do
// glossário do docs/CONTRATO.md §2.7 (`slot` e `itemCategory`). Arte pendente
// até o autor entregar as imagens. Imagens: versões do produto em src/assets/
// (/assets).
import type { EquipmentSlot, ItemCategory } from '../api/catalog'

export type CardCategoryEntry = {
  /** Rótulo em pt-BR. */
  label: string
  /** URLs do ícone e da imagem, ou 'pending' enquanto a arte não foi entregue. */
  art: { icon: string; image: string } | 'pending'
}

export const categoryCatalog = {
  // Equipamento (slot, README 5.1)
  head: { label: 'Cabeça', art: 'pending' },
  torso: { label: 'Tronco', art: 'pending' },
  legs: { label: 'Inferior', art: 'pending' },
  feet: { label: 'Calçado', art: 'pending' },
  cape: { label: 'Capa', art: 'pending' },
  weapon: { label: 'Arma', art: 'pending' },
  shield: { label: 'Escudo', art: 'pending' },
  accessory: { label: 'Acessório', art: 'pending' },
  // Item (itemCategory, README 5.2)
  consumable: { label: 'Consumíveis', art: 'pending' },
  material: { label: 'Materiais', art: 'pending' },
  relic: { label: 'Relíquias', art: 'pending' },
  tool: { label: 'Ferramentas', art: 'pending' },
  treasure: { label: 'Tesouros', art: 'pending' },
  document: { label: 'Documentos', art: 'pending' },
  booster: { label: 'Boosters', art: 'pending' },
  special: { label: 'Objetos especiais', art: 'pending' },
} satisfies Record<EquipmentSlot | ItemCategory, CardCategoryEntry>

export type CardCategoryId = keyof typeof categoryCatalog
