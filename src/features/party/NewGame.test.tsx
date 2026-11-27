import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
  dimensionInvalidFixture,
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

async function submitParty() {
  await waitFor(() => expect(createButton()).toBeEnabled())
  fireEvent.click(createButton())
}

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

const classGroup = () => screen.getByRole('radiogroup', { name: 'Classe' })

it('REQ-102: atualiza os limites após recusa e preserva os dados para corrigir a quantidade', async () => {
  let maxPlayers = 4
  const bodies: unknown[] = []
  server.use(
    http.get('*/parties/creation-options', () =>
      HttpResponse.json({ minPlayers: 2, maxPlayers }),
    ),
    http.post('*/parties', async ({ request }) => {
      bodies.push(await request.json())
      if (bodies.length === 1) {
        maxPlayers = 3
        return invalid([{ field: 'aiHelperCount', reason: 'aboveMaxPlayers' }])
      }
      return HttpResponse.json(partyCreatedFixture, { status: 201 })
    }),
  )
  renderNewGame()
  fill('Os Teimosos', 'Lia')
  const rogue = await screen.findByRole('radio', { name: /^Ladino/ })
  fireEvent.click(rogue)
  const helpers = await screen.findByRole('combobox', {
    name: 'Ajudantes de IA',
  })
  expect(
    within(helpers)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual(['1', '2', '3'])
  expect(helpers).toHaveValue('1')
  fireEvent.change(helpers, { target: { value: '3' } })
  await submitParty()
  await waitFor(() =>
    expect(within(helpers).getByRole('option', { name: '3' })).toBeDisabled(),
  )
  expect(helpers).toHaveAccessibleDescription(
    'A quantidade ultrapassa o máximo atual de participantes.',
  )
  expect(helpers).toHaveValue('3')
  expect(nameField()).toHaveValue('Os Teimosos')
  expect(characterField()).toHaveValue('Lia')
  expect(rogue).toBeChecked()
  expect(createButton()).toBeDisabled()
  fireEvent.change(helpers, { target: { value: '2' } })
  await submitParty()
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('/grupo/'),
  )
  expect(bodies).toEqual([
    {
      name: 'Os Teimosos',
      characterName: 'Lia',
      playerClass: 'rogue',
      aiHelperCount: 3,
    },
    {
      name: 'Os Teimosos',
      characterName: 'Lia',
      playerClass: 'rogue',
      aiHelperCount: 2,
    },
  ])
})

describe('REQ-29: escolha da classe', () => {
  it('REQ-29: grupo "Classe" depois de "Nome do personagem", uma opção por classe na ordem recebida, nenhuma escolhida', async () => {
    renderNewGame()
    const rogue = await screen.findByRole('radio', {
      name: 'Ladino (Destreza)',
    })
    const warrior = screen.getByRole('radio', {
      name: 'Guerreiro (Força, Resistência)',
    })
    const radios = screen.getAllByRole('radio')
    expect(radios).toEqual([rogue, warrior])
    expect(rogue).not.toBeChecked()
    expect(warrior).not.toBeChecked()
    expect(
      characterField().compareDocumentPosition(classGroup()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-29: durante a consulta mostra "Carregando classes…"', () => {
    renderNewGame()
    expect(status()).toHaveTextContent('Carregando classes…')
  })

  it('REQ-29: lista vazia mostra "Nenhuma classe publicada."', async () => {
    server.use(http.get('*/catalog/classes', () => HttpResponse.json([])))
    renderNewGame()
    expect(
      await screen.findByText('Nenhuma classe publicada.'),
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('REQ-29: classe escolhida mostra "Modificadores base" e "Deck pré-pronto"', async () => {
    renderNewGame()
    fireEvent.click(
      await screen.findByRole('radio', {
        name: 'Guerreiro (Força, Resistência)',
      }),
    )
    const modifiers = screen.getByRole('list', { name: 'Modificadores base' })
    expect(
      classGroup().compareDocumentPosition(modifiers) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(classGroup()).not.toContainElement(modifiers)
    expect(
      within(modifiers)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      '6 Ataque',
      '5 Defesa',
      '45 Precisão',
      '15 Esquiva',
      '8 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    const deck = screen.getByRole('list', { name: 'Deck pré-pronto' })
    await waitFor(() =>
      expect(
        within(deck)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['30× Resistência', '30× Força']),
    )
  })

  it('REQ-29: sem classe escolhida não mostra as listas', async () => {
    renderNewGame()
    await screen.findByRole('radio', { name: 'Ladino (Destreza)' })
    expect(
      screen.queryByRole('list', { name: 'Modificadores base' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: 'Deck pré-pronto' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-29: "Criar grupo" leva playerClass da classe escolhida', async () => {
    let body: unknown
    server.use(
      http.post('*/parties', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyCreatedFixture, { status: 201 })
      }),
    )
    renderNewGame()
    fill('Os Teimosos', 'Lia')
    fireEvent.click(
      await screen.findByRole('radio', { name: 'Ladino (Destreza)' }),
    )
    await submitParty()
    await waitFor(() =>
      expect(body).toEqual({
        name: 'Os Teimosos',
        characterName: 'Lia',
        playerClass: 'rogue',
        aiHelperCount: 0,
      }),
    )
  })

  it('REQ-29: sem escolha, o handler padrão responde required e o grupo mostra "Escolha uma classe."', async () => {
    renderNewGame()
    fill('Os Teimosos', 'Lia')
    await screen.findByRole('radio', { name: 'Ladino (Destreza)' })
    await submitParty()
    await waitFor(() =>
      expect(classGroup()).toHaveAccessibleDescription('Escolha uma classe.'),
    )
  })

  it('REQ-29: unknownClass mostra "Esta classe não está mais disponível."', async () => {
    server.use(
      http.post('*/parties', () =>
        invalid([{ field: 'playerClass', reason: 'unknownClass' }]),
      ),
    )
    renderNewGame()
    fill('a', 'b')
    fireEvent.click(
      await screen.findByRole('radio', { name: 'Ladino (Destreza)' }),
    )
    await submitParty()
    await waitFor(() =>
      expect(classGroup()).toHaveAccessibleDescription(
        'Esta classe não está mais disponível.',
      ),
    )
  })

  it('REQ-29: DIMENSION_INVALID mostra a message e a lista "Problemas"; o que foi digitado e escolhido continua', async () => {
    server.use(
      http.post('*/parties', () =>
        HttpResponse.json(dimensionInvalidFixture, { status: 409 }),
      ),
    )
    renderNewGame()
    fill('Os Teimosos', 'Lia')
    const rogue = await screen.findByRole('radio', {
      name: 'Ladino (Destreza)',
    })
    fireEvent.click(rogue)
    await submitParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(dimensionInvalidFixture.error.message),
    )
    const problems = screen.getByRole('list', { name: 'Problemas' })
    expect(
      within(problems)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(dimensionInvalidFixture.error.details.problems)
    expect(nameField()).toHaveValue('Os Teimosos')
    expect(characterField()).toHaveValue('Lia')
    expect(rogue).toBeChecked()
  })

  it('REQ-29: erro na consulta das classes mostra a message', async () => {
    server.use(
      http.get('*/catalog/classes', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderNewGame()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-29: falha de rede nas classes mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/catalog/classes', () => HttpResponse.error()))
    renderNewGame()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

describe('REQ-15: novo jogo', () => {
  it('REQ-15: /novo mostra título, campos, botão e "Voltar" para /', () => {
    renderNewGame()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Novo jogo' }),
    ).toBeInTheDocument()
    expect(nameField()).toBeInTheDocument()
    expect(characterField()).toBeInTheDocument()
    expect(createButton()).toBeDisabled()
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
    await submitParty()

    await waitFor(() => expect(status()).toHaveTextContent('Criando grupo…'))
    expect(createButton()).toBeDisabled()
    await waitFor(() =>
      expect(body).toEqual({
        name: '  Os Teimosos ',
        characterName: ' Lia',
        aiHelperCount: 0,
      }),
    )
    release()
  })

  it('REQ-15: com 201 vai para /grupo/:partyId do grupo criado', async () => {
    renderNewGame()
    fill('Os Teimosos', 'Lia')
    fireEvent.click(await screen.findByRole('radio', { name: /^Guerreiro/ }))
    await submitParty()
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
    await submitParty()

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
      await submitParty()
      await waitFor(() =>
        expect(nameField()).toHaveAccessibleDescription(nameText),
      )
      expect(characterField()).toHaveAccessibleDescription(characterText)
    },
  )

  it('REQ-15: members belowMinPlayers mostra o aviso na área de status', async () => {
    renderNewGame()
    fill('Solo', 'Lia')
    await submitParty()
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
    await submitParty()
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
    await submitParty()
    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription(
        'Informe o nome do grupo.',
      ),
    )
    await submitParty()
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
    await submitParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-15: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.post('*/parties', () => HttpResponse.error()))
    renderNewGame()
    fill('a', 'b')
    await submitParty()
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
    await submitParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})
