import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('T-03: rota inicial do app', () => {
  it('T-03: a rota "/" mostra o título "Misadventures"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Misadventures' }),
    ).toBeVisible()
  })

  it('T-03: o conteúdo do template do Vite foi removido', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/Get started/i)).not.toBeInTheDocument()
  })
})
