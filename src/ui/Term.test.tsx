import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Term } from './Term'
import { termCatalog, type TermId } from './terms'
import css from './Term.css?raw'

const attributeIds: TermId[] = [
  'strength',
  'dexterity',
  'endurance',
  'intelligence',
  'wisdom',
  'charisma',
  'spirit',
  'sanity',
  'luck',
]

const modifierIds: TermId[] = [
  'attack',
  'defense',
  'accuracy',
  'evasion',
  'celerity',
  'piercing',
  'reflection',
]

describe('Term', () => {
  it('REQ-03: exibe o nome pt-BR do catálogo com o estilo de destaque', () => {
    render(<Term id="strength" />)
    const term = screen.getByText('Força')
    expect(term).toHaveClass('term')
  })

  it('REQ-03 (T-13): o catálogo tem os 9 atributos e os 7 modificadores, cada um com nome e texto', () => {
    const ids: TermId[] = [...attributeIds, ...modifierIds]
    expect(Object.keys(termCatalog).sort()).toEqual([...ids].sort())
    expect(termCatalog.attack.name).toBe('Ataque')
    expect(termCatalog.reflection.name).toBe('Reflexão')
    for (const id of ids) {
      expect(termCatalog[id].name.length).toBeGreaterThan(0)
      expect(termCatalog[id].description.length).toBeGreaterThan(0)
    }
  })

  it('REQ-03: tooltip abre ao passar o mouse, ligado por aria-describedby', () => {
    render(<Term id="luck" />)
    const term = screen.getByText('Sorte')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(term)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent(termCatalog.luck.description)
    expect(term).toHaveAttribute('aria-describedby', tooltip.id)
  })

  it('REQ-03: tooltip abre pelo foco do teclado', () => {
    render(<Term id="wisdom" />)
    const term = screen.getByText('Sabedoria')
    expect(term).toHaveAttribute('tabindex', '0')
    fireEvent.focus(term)
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      termCatalog.wisdom.description,
    )
  })

  it('REQ-03: tooltip some quando o mouse sai', () => {
    render(<Term id="strength" />)
    const term = screen.getByText('Força')
    fireEvent.mouseEnter(term)
    fireEvent.mouseLeave(term)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(term).not.toHaveAttribute('aria-describedby')
  })

  it('REQ-03: tooltip some quando o foco sai', () => {
    render(<Term id="strength" />)
    const term = screen.getByText('Força')
    fireEvent.focus(term)
    fireEvent.blur(term)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('REQ-03: tooltip some com Esc', () => {
    render(<Term id="strength" />)
    const term = screen.getByText('Força')
    fireEvent.focus(term)
    fireEvent.keyDown(term, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('REQ-03: tooltip fica abaixo do termo, sem cobri-lo', () => {
    // jsdom não mede layout: confere a regra de posição do CSS.
    const rule = /\.term-tooltip\s*\{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(rule).toMatch(/position:\s*absolute/)
    expect(rule).toMatch(/top:\s*100%/)
  })

  it('REQ-03: id fora do catálogo não compila', () => {
    // @ts-expect-error id inexistente no catálogo
    const bad = <Term id="forca" />
    expect(bad).toBeTruthy()
  })
})
