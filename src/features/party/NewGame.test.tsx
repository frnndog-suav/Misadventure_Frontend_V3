import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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
import App from '../../App'
import { internalErrorFixture } from '../../mocks/fixtures'
import { handlers } from '../../mocks/handlers'
import {
  partyCreatedFixture,
  partyInvalidFieldsFixture,
} from '../../mocks/partyFixtures'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
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

/** Sonda do destino (a tela do grupo é da T-19). */
function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderNewGame(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/novo']}>
        <App />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const nameField = () => screen.getByRole('textbox', { name: 'Nome do grupo' })
const characterField = () =>
  screen.getByRole('textbox', { name: 'Nome do personagem' })
const createButton = () => screen.getByRole('button', { name: 'Criar grupo' })
const status = () => screen.getByRole('status')

function fill(name: string, characterName: string): void {
  fireEvent.change(nameField(), { target: { value: name } })
  fireEvent.change(characterField(), { target: { value: characterName } })
}

function invalid(fields: { field: string | null; reason: string }[]) {
  return HttpResponse.json(
    {
      error: {
        code: 'PARTY_INVALID',
        message: 'Dados do grupo inválidos.',
        details: { fields },
      },
    },
    { status: 400 },
  )
}

describe('REQ-15: novo jogo', () => {
  it('REQ-15: /novo mostra título, campos, botão e "Voltar" para /', () => {
    renderNewGame()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Novo jogo' }),
    ).toBeInTheDocument()
    expect(nameField()).toBeInTheDocument()
    expect(characterField()).toBeInTheDocument()
    expect(createButton()).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('REQ-15: envia os textos como digitados; durante o pedido o botão fica desabilitado com "Criando grupo…"', async () => {
    let body: unknown
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyCreatedFixture, { status: 201 })
      }),
    )
    renderNewGame()
    fill('  Os Teimosos ', ' Lia')
    fireEvent.click(createButton())

    await waitFor(() => expect(status()).toHaveTextContent('Criando grupo…'))
    expect(createButton()).toBeDisabled()
    await waitFor(() =>
      expect(body).toEqual({ name: '  Os Teimosos ', characterName: ' Lia' }),
    )
    release()
  })

  it('REQ-15: com 201 vai para /grupo/:partyId do grupo criado', async () => {
    renderNewGame()
    fill('Os Teimosos', 'Lia')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        `/grupo/${partyCreatedFixture.id}`,
      ),
    )
  })

  it('REQ-15: PARTY_INVALID liga cada erro ao seu campo e mantém o que foi digitado', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(partyInvalidFieldsFixture, { status: 400 }),
      ),
    )
    renderNewGame()
    fill('   ', 'Um nome com mais de vinte e quatro letras')
    fireEvent.click(createButton())

    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription(
        'Informe o nome do grupo.',
      ),
    )
    expect(characterField()).toHaveAccessibleDescription(
      'Use até 24 caracteres.',
    )
    expect(nameField()).toHaveValue('   ')
    expect(characterField()).toHaveValue(
      'Um nome com mais de vinte e quatro letras',
    )
    expect(createButton()).toBeEnabled()
  })

  it.each([
    ['required', 'Informe o nome do grupo.', 'Informe o nome do personagem.'],
    ['notString', 'Informe o nome do grupo.', 'Informe o nome do personagem.'],
    ['blank', 'Informe o nome do grupo.', 'Informe o nome do personagem.'],
    ['tooLong', 'Use até 40 caracteres.', 'Use até 24 caracteres.'],
  ])(
    'REQ-15: reason %s mostra o texto de cada campo',
    async (reason, nameText, characterText) => {
      server.use(
        http.post('*/parties', () =>
          invalid([
            { field: 'name', reason },
            { field: 'characterName', reason },
          ]),
        ),
      )
      renderNewGame()
      fill('a', 'b')
      fireEvent.click(createButton())
      await waitFor(() =>
        expect(nameField()).toHaveAccessibleDescription(nameText),
      )
      expect(characterField()).toHaveAccessibleDescription(characterText)
    },
  )

  it('REQ-15: members belowMinPlayers mostra o aviso na área de status', async () => {
    renderNewGame()
    fill('Solo', 'Lia')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'A configuração atual não permite jogar com um grupo de 1.',
      ),
    )
    expect(nameField()).not.toHaveAccessibleDescription()
  })

  it('REQ-15: invalidBody mostra a message na área de status', async () => {
    server.use(
      http.post('*/parties', () =>
        invalid([{ field: null, reason: 'invalidBody' }]),
      ),
    )
    renderNewGame()
    fill('a', 'b')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent('Dados do grupo inválidos.'),
    )
  })

  it('REQ-15: os erros valem até o próximo envio', async () => {
    let calls = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties', async () => {
        calls += 1
        if (calls === 1)
          return HttpResponse.json(partyInvalidFieldsFixture, { status: 400 })
        await gate
        return HttpResponse.json(partyCreatedFixture, { status: 201 })
      }),
    )
    renderNewGame()
    fill('   ', 'x')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription(
        'Informe o nome do grupo.',
      ),
    )
    fireEvent.click(createButton())
    await waitFor(() => expect(status()).toHaveTextContent('Criando grupo…'))
    expect(nameField()).not.toHaveAccessibleDescription()
    expect(characterField()).not.toHaveAccessibleDescription()
    release()
  })

  it('REQ-15: outro erro §1.4 mostra a message', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderNewGame()
    fill('a', 'b')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-15: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.post('*/parties', () => HttpResponse.error()))
    renderNewGame()
    fill('a', 'b')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-15: resposta fora do contrato mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json({ id: 1 }, { status: 201 }),
      ),
    )
    renderNewGame()
    fill('a', 'b')
    fireEvent.click(createButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})
