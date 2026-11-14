import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardCategory } from './CardCategory'
import { categoryCatalog, type CardCategoryEntry } from './categories'
import { testCategoryCatalog } from './test-assets/categories'

describe('CardCategory', () => {
  it('REQ-04: mostra juntos ícone, imagem e rótulo pt-BR da categoria', () => {
    const { container } = render(
      <CardCategory entry={testCategoryCatalog['test-relic']} />,
    )
    expect(screen.getByText('Relíquia de teste')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Relíquia de teste' }),
    ).toBeInTheDocument()
    expect(container.querySelector('.card-category-icon')).not.toBeNull()
  })

  it('REQ-04: o ícone é decorativo e a imagem tem alt com o rótulo', () => {
    const { container } = render(
      <CardCategory entry={testCategoryCatalog['test-relic']} />,
    )
    const icon = container.querySelector('.card-category-icon')
    expect(icon).toHaveAttribute('alt', '')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('REQ-04: arte pendente mostra moldura neutra e mantém o rótulo', () => {
    const { container } = render(
      <CardCategory entry={testCategoryCatalog['test-pending']} />,
    )
    expect(screen.getByText('Categoria pendente')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.card-category-frame')).not.toBeNull()
  })

  it('REQ-04: todo id do catálogo tem ícone e imagem ou está marcado como arte pendente', () => {
    const all: Record<string, CardCategoryEntry> = {
      ...categoryCatalog,
      ...testCategoryCatalog,
    }
    for (const [id, entry] of Object.entries(all)) {
      expect(entry.label, id).not.toBe('')
      if (entry.art !== 'pending') {
        expect(entry.art.icon, id).not.toBe('')
        expect(entry.art.image, id).not.toBe('')
      }
    }
  })

  it('REQ-04: o catálogo de produção não contém ids de teste', () => {
    expect(
      Object.keys(categoryCatalog).filter((id) => id.startsWith('test-')),
    ).toEqual([])
  })
})
