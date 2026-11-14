import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter } from 'react-router-dom'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import App from './App'
import { internalErrorFixture } from './mocks/fixtures'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  // MSW 3 renomeou onUnhandledRequest → onUnhandledFrame
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => server.resetHandlers())
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

let queryClient: QueryClient

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
})

function renderApp(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('T-03: rota inicial do app', () => {
  it('T-03: a rota "/" mostra o título "Misadventures"', () => {
    renderApp()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Misadventures' }),
    ).toBeVisible()
  })

  it('T-03: o conteúdo do template do Vite foi removido', () => {
    renderApp()
    expect(screen.queryByText(/Get started/i)).not.toBeInTheDocument()
  })
})

describe('REQ-01: estado da ponte com o servidor na rota inicial', () => {
  it('REQ-01: com a consulta em andamento, a área de status mostra "Conectando ao servidor…"', async () => {
    renderApp()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Conectando ao servidor…',
    )
    // deixa a consulta terminar para não vazar entre testes
    await screen.findByText(/Servidor conectado/)
  })

  it('REQ-01: com 200 e contractVersion "0.4", mostra "Servidor conectado · contrato v0.4"', async () => {
    renderApp()
    expect(
      await screen.findByText('Servidor conectado · contrato v0.4'),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Servidor conectado · contrato v0.4',
    )
  })

  it('REQ-01: a versão do contrato vem de contractVersion, nunca fixa no frontend', async () => {
    server.use(
      http.get('*/health', () =>
        HttpResponse.json({ status: 'ok', contractVersion: '9.9' }),
      ),
    )
    renderApp()
    expect(
      await screen.findByText('Servidor conectado · contrato v9.9'),
    ).toBeVisible()
  })

  it('REQ-01: com erro 500 no formato §1.4, mostra exatamente a message recebida', async () => {
    server.use(
      http.get('*/health', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderApp()
    expect(
      await screen.findByText(internalErrorFixture.error.message),
    ).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Erro inesperado no servidor. Tente novamente.',
    )
  })

  it('REQ-01: com falha de rede, mostra "Servidor indisponível. Tente novamente." sem exceção', async () => {
    server.use(http.get('*/health', () => HttpResponse.error()))
    renderApp()
    expect(
      await screen.findByText('Servidor indisponível. Tente novamente.'),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Misadventures' }),
    ).toBeVisible()
  })

  it('REQ-01: com resposta 200 fora do schema, mostra "Servidor indisponível. Tente novamente." sem exceção', async () => {
    server.use(http.get('*/health', () => HttpResponse.json({})))
    renderApp()
    expect(
      await screen.findByText('Servidor indisponível. Tente novamente.'),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Misadventures' }),
    ).toBeVisible()
  })

  it('REQ-01: com erro cujo corpo não é o envelope §1.4, mostra "Servidor indisponível. Tente novamente."', async () => {
    // REQ-01 (4º critério, spec v0.7): erro HTTP cujo corpo não é o
    // envelope §1.4 válido cai em "Servidor indisponível. Tente novamente.".
    server.use(
      http.get('*/health', () =>
        HttpResponse.json({ qualquer: 'coisa' }, { status: 500 }),
      ),
    )
    renderApp()
    expect(
      await screen.findByText('Servidor indisponível. Tente novamente.'),
    ).toBeVisible()
  })
})
