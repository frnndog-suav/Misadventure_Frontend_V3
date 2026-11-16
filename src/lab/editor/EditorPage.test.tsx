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
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
import { internalErrorFixture } from '../../mocks/fixtures'
import { handlers } from '../../mocks/handlers'
import { EditorPage } from './EditorPage'

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

function renderEditor() {
  const router = createMemoryRouter(
    [
      { path: '/lab/editor', element: <EditorPage /> },
      { path: '/lab', element: <h1>Laboratório</h1> },
    ],
    { initialEntries: ['/lab', '/lab/editor'], initialIndex: 1 },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

const collectionsUrl = '*/lab/content/collections'
const collectionUrl = '*/lab/content/collections/:collectionId'
const unavailable = 'Servidor indisponível. Tente novamente.'

const section = () => screen.getByRole('region', { name: 'Coleções' })
const status = () => within(section()).getByRole('status')
const fixtureButton = () =>
  screen.findByRole('button', { name: /Coleção de Teste/ })

async function chooseFixture(): Promise<void> {
  fireEvent.click(await fixtureButton())
  await screen.findByRole('button', { name: 'Editar coleção' })
}

describe('REQ-18: tela do editor', () => {
  it('REQ-18: título "Editor de conteúdo" e link "Voltar ao laboratório"', async () => {
    const router = renderEditor()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Editor de conteúdo' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })
})

describe('REQ-19: lista de coleções', () => {
  it('REQ-19: mostra "Carregando coleções…" e depois cada coleção com nome, id e contagens', async () => {
    renderEditor()
    expect(status()).toHaveTextContent('Carregando coleções…')
    const button = await fixtureButton()
    expect(button).toHaveTextContent('Coleção de Teste')
    expect(button).toHaveTextContent('fixture')
    expect(button).toHaveTextContent('6 publicadas · 0 rascunhos')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(status()).toHaveTextContent('')
  })

  it('REQ-19: lista vazia mostra "Nenhuma coleção ainda."', async () => {
    server.use(http.get(collectionsUrl, () => HttpResponse.json([])))
    renderEditor()
    expect(
      await screen.findByText('Nenhuma coleção ainda.'),
    ).toBeInTheDocument()
  })

  it('REQ-19: erro §1.4 mostra a message', async () => {
    server.use(
      http.get(collectionsUrl, () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderEditor()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-19: resposta fora do contrato mostra o texto genérico', async () => {
    server.use(http.get(collectionsUrl, () => HttpResponse.json([{ id: 1 }])))
    renderEditor()
    await waitFor(() => expect(status()).toHaveTextContent(unavailable))
  })

  it('REQ-19: nenhuma coleção vem escolhida; ao escolher, o painel mostra contagens por tipo e por raridade', async () => {
    renderEditor()
    const button = await fixtureButton()
    expect(
      screen.queryByRole('button', { name: 'Editar coleção' }),
    ).not.toBeInTheDocument()
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    const byType = await screen.findByRole('list', { name: 'Por tipo' })
    expect(within(byType).getByText('Zona: 1')).toBeInTheDocument()
    expect(within(byType).getByText('Evento de combate: 1')).toBeInTheDocument()
    const byRarity = screen.getByRole('list', { name: 'Por raridade' })
    expect(within(byRarity).getByText('Comum: 2')).toBeInTheDocument()
    expect(within(byRarity).getByText('Rara: 1')).toBeInTheDocument()
    expect(within(byRarity).getByText('Lendária: 0')).toBeInTheDocument()
  })
})

describe('REQ-19: criar coleção', () => {
  function openNew(): void {
    fireEvent.click(screen.getByRole('button', { name: 'Nova coleção' }))
  }

  function fill(id: string, name: string, description = ''): void {
    fireEvent.change(screen.getByLabelText('Identificador'), {
      target: { value: id },
    })
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: name },
    })
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: description },
    })
  }

  it('REQ-19: o formulário tem os campos e botões; "Cancelar" fecha', async () => {
    renderEditor()
    await fixtureButton()
    openNew()
    expect(screen.getByLabelText('Identificador')).not.toHaveAttribute(
      'readonly',
    )
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Criar coleção' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Identificador')).not.toBeInTheDocument()
  })

  it('REQ-19: com sucesso, a coleção nova fica escolhida e o status mostra "Coleção criada."', async () => {
    let body: unknown
    server.use(
      http.post(collectionsUrl, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          {
            id: 'bosque',
            name: 'Bosque Sombrio',
            description: '',
            publishedCount: 0,
            draftCount: 0,
            cardCounts: {
              zone: 0,
              attribute: 0,
              equipment: 0,
              item: 0,
              randomEvent: 0,
              combatEvent: 0,
            },
            rarityCounts: {
              common: 0,
              uncommon: 0,
              rare: 0,
              epic: 0,
              legendary: 0,
            },
            tags: [],
          },
          { status: 201 },
        )
      }),
    )
    renderEditor()
    await fixtureButton()
    openNew()
    fill('bosque', 'Bosque Sombrio', 'Um bosque.')
    fireEvent.click(screen.getByRole('button', { name: 'Criar coleção' }))
    await waitFor(() => expect(status()).toHaveTextContent('Coleção criada.'))
    expect(body).toEqual({
      id: 'bosque',
      name: 'Bosque Sombrio',
      description: 'Um bosque.',
    })
    expect(screen.queryByLabelText('Identificador')).not.toBeInTheDocument()
    // O painel é o da coleção nova (o MSW devolve o "bosque" já renomeado).
    expect(
      await screen.findByRole('heading', { name: 'Bosque Antigo' }),
    ).toBeInTheDocument()
  })

  it('REQ-19: CONTENT_INVALID liga cada texto ao campo e mantém o digitado', async () => {
    renderEditor()
    await fixtureButton()
    openNew()
    fill('Bosque X', '')
    fireEvent.click(screen.getByRole('button', { name: 'Criar coleção' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Conteúdo inválido.'),
    )
    expect(screen.getByLabelText('Identificador')).toHaveValue('Bosque X')
    expect(screen.getByLabelText('Identificador')).toHaveAccessibleDescription(
      'Use só letras minúsculas, números e hífens.',
    )
    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription(
      'Informe o nome.',
    )
    expect(screen.getByLabelText('Descrição')).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  it('REQ-19: CONTENT_ID_TAKEN mostra o texto no "Identificador"', async () => {
    renderEditor()
    await fixtureButton()
    openNew()
    fill('fixture', 'Outra')
    fireEvent.click(screen.getByRole('button', { name: 'Criar coleção' }))
    await waitFor(() =>
      expect(
        screen.getByLabelText('Identificador'),
      ).toHaveAccessibleDescription(/.+/),
    )
    expect(status()).toHaveTextContent('Este identificador já está em uso.')
  })

  it('REQ-18: durante o envio, "Criar coleção" fica desabilitado', async () => {
    server.use(http.post(collectionsUrl, () => new Promise<never>(() => {})))
    renderEditor()
    await fixtureButton()
    openNew()
    fill('bosque', 'Bosque')
    const create = screen.getByRole('button', { name: 'Criar coleção' })
    fireEvent.click(create)
    await waitFor(() => expect(create).toBeDisabled())
  })
})

describe('REQ-19: editar coleção', () => {
  it('REQ-19: o formulário vem com os valores atuais, "Identificador" somente leitura, e salva', async () => {
    let body: unknown
    server.use(
      http.patch(collectionUrl, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          id: 'fixture',
          name: 'Coleção Nova',
          description: '',
          publishedCount: 6,
          draftCount: 0,
          cardCounts: {
            zone: 1,
            attribute: 1,
            equipment: 1,
            item: 1,
            randomEvent: 1,
            combatEvent: 1,
          },
          rarityCounts: {
            common: 2,
            uncommon: 0,
            rare: 1,
            epic: 0,
            legendary: 0,
          },
          tags: [],
        })
      }),
    )
    renderEditor()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Editar coleção' }))
    const id = screen.getByLabelText('Identificador')
    expect(id).toHaveValue('fixture')
    expect(id).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Nome')).toHaveValue('Coleção de Teste')
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Coleção Nova' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar coleção' }))
    await waitFor(() => expect(status()).toHaveTextContent('Coleção salva.'))
    expect(body).toEqual({ name: 'Coleção Nova', description: '' })
    expect(screen.queryByLabelText('Identificador')).not.toBeInTheDocument()
  })
})

describe('REQ-19: excluir coleção', () => {
  async function openDelete(): Promise<HTMLElement> {
    renderEditor()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir coleção' }))
    return screen.getByRole('dialog', { name: 'Excluir “Coleção de Teste”?' })
  }

  it('REQ-19: diálogo com texto, foco em "Cancelar"; Esc fecha', async () => {
    const dialog = await openDelete()
    expect(dialog).toHaveAccessibleDescription(
      'A coleção e todas as cartas dela serão apagadas. Não dá para desfazer.',
    )
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('REQ-19: confirmado com sucesso, consulta a lista de novo e mostra "Coleção excluída."', async () => {
    let listCalls = 0
    server.use(
      http.get(collectionsUrl, () => {
        listCalls += 1
        return HttpResponse.json([
          {
            id: 'fixture',
            name: 'Coleção de Teste',
            description: '',
            publishedCount: 6,
            draftCount: 0,
          },
        ])
      }),
    )
    const dialog = await openDelete()
    const before = listCalls
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(status()).toHaveTextContent('Coleção excluída.'))
    await waitFor(() => expect(listCalls).toBeGreaterThan(before))
    expect(
      screen.queryByRole('button', { name: 'Editar coleção' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-19: 409 CONTENT_IN_USE mostra a message e a coleção continua escolhida', async () => {
    server.use(
      http.delete(collectionUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_IN_USE',
              message: 'A coleção é usada por um save.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    const dialog = await openDelete()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent('A coleção é usada por um save.'),
    )
    expect(
      screen.getByRole('button', { name: 'Editar coleção' }),
    ).toBeInTheDocument()
  })
})

describe('REQ-24: alterações não salvas na coleção', () => {
  async function dirtyEdit() {
    const router = renderEditor()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Editar coleção' }))
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Mudou' },
    })
    return router
  }

  const discardDialog = () =>
    screen.getByRole('dialog', { name: 'Descartar alterações?' })

  it('REQ-24: sem alterações, sair não pergunta', async () => {
    const router = renderEditor()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Editar coleção' }))
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })

  it('REQ-24: "Voltar ao laboratório" abre o diálogo; "Continuar editando" (foco inicial) fica', async () => {
    const router = await dirtyEdit()
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Descartar alterações?',
    })
    expect(dialog).toHaveAccessibleDescription(
      'As alterações desta coleção ainda não foram salvas.',
    )
    const keep = within(dialog).getByRole('button', {
      name: 'Continuar editando',
    })
    expect(keep).toHaveFocus()
    fireEvent.click(keep)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lab/editor')
    expect(screen.getByLabelText('Nome')).toHaveValue('Mudou')
  })

  it('REQ-24: "Descartar" sai para a rota pedida', async () => {
    const router = await dirtyEdit()
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Descartar',
      }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })

  it('REQ-24: o Voltar do navegador (outra rota) também pergunta; Esc fecha sem sair', async () => {
    const router = await dirtyEdit()
    await router.navigate(-1)
    const dialog = await screen.findByRole('dialog', {
      name: 'Descartar alterações?',
    })
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/lab/editor')
  })

  it('REQ-24: escolher outra coleção pergunta; "Descartar" troca e fecha o formulário', async () => {
    server.use(
      http.get(collectionsUrl, () =>
        HttpResponse.json([
          {
            id: 'fixture',
            name: 'Coleção de Teste',
            description: '',
            publishedCount: 6,
            draftCount: 0,
          },
          {
            id: 'bosque',
            name: 'Bosque Antigo',
            description: '',
            publishedCount: 0,
            draftCount: 0,
          },
        ]),
      ),
    )
    await dirtyEdit()
    const bosque = screen.getByRole('button', { name: /Bosque Antigo/ })
    fireEvent.click(bosque)
    expect(bosque).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(
      within(discardDialog()).getByRole('button', { name: 'Descartar' }),
    )
    expect(bosque).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
  })

  it('REQ-24: "Nova coleção" com alterações pergunta; "Descartar" abre o formulário vazio', async () => {
    await dirtyEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Nova coleção' }))
    fireEvent.click(
      within(discardDialog()).getByRole('button', { name: 'Descartar' }),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Criar coleção' }),
    ).toBeInTheDocument()
  })

  it('REQ-24: "Editar coleção" e "Excluir coleção" com alterações perguntam', async () => {
    await dirtyEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Editar coleção' }))
    fireEvent.click(
      within(discardDialog()).getByRole('button', {
        name: 'Continuar editando',
      }),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Mudou')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir coleção' }))
    expect(discardDialog()).toBeInTheDocument()
  })

  it('REQ-24: com alterações, fechar ou recarregar a aba pede confirmação', async () => {
    await dirtyEdit()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('REQ-24: sem alterações, fechar a aba não pede confirmação', async () => {
    renderEditor()
    await chooseFixture()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
