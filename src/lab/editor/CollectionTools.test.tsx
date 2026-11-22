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
import {
  bosqueExportFixture,
  fixtureExportFixture,
  importIdTakenFixture,
  importInvalidFixture,
  importResultFixture,
} from '../../mocks/editorFixtures'
import { handlers } from '../../mocks/handlers'
import { EditorPage } from './EditorPage'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

beforeEach(() => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
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
})

const validateUrl = '*/lab/content/collections/:collectionId/validate-dimension'
const exportUrl = '*/lab/content/collections/:collectionId/export'
const importUrl = '*/lab/content/import'

const section = () => screen.getByRole('region', { name: 'Coleções' })
const status = () => within(section()).getByRole('status')

async function chooseFixture(): Promise<void> {
  fireEvent.click(
    await screen.findByRole('button', { name: /Coleção de Teste/ }),
  )
  await screen.findByRole('button', { name: 'Editar coleção' })
}

function jsonFile(text: string, name = 'bosque.json'): File {
  return new File([text], name, { type: 'application/json' })
}

function chooseFile(file: File): void {
  fireEvent.change(screen.getByLabelText('Importar coleção'), {
    target: { files: [file] },
  })
}

describe('REQ-25: validar coleção como dimensão', () => {
  it('REQ-25: sem coleção escolhida não há "Validar como dimensão" nem "Exportar"', async () => {
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    expect(
      screen.queryByRole('button', { name: 'Validar como dimensão' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Exportar' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-25: mostra "Validando…" e, com problemas, o título e a lista na ordem recebida', async () => {
    server.use(
      http.post(validateUrl, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
        return HttpResponse.json({
          valid: false,
          problems: ['Falta a Carta de Dimensão.', 'Falta zona Urbana.'],
        })
      }),
    )
    await chooseFixture()
    fireEvent.click(
      screen.getByRole('button', { name: 'Validar como dimensão' }),
    )
    expect(status()).toHaveTextContent('Validando…')
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'A coleção não forma uma dimensão válida.',
      ),
    )
    const list = within(section()).getByRole('list', { name: 'Problemas' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Falta a Carta de Dimensão.', 'Falta zona Urbana.'])
  })

  it('REQ-25: resultado válido mostra "A coleção forma uma dimensão válida." e nenhuma lista', async () => {
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json({ valid: true, problems: [] }),
      ),
    )
    await chooseFixture()
    fireEvent.click(
      screen.getByRole('button', { name: 'Validar como dimensão' }),
    )
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'A coleção forma uma dimensão válida.',
      ),
    )
    expect(
      within(section()).queryByRole('list', { name: 'Problemas' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-25: uma nova validação apaga a lista de problemas anterior', async () => {
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json({ valid: false, problems: ['Falta zona Urbana.'] }),
      ),
    )
    await chooseFixture()
    fireEvent.click(
      screen.getByRole('button', { name: 'Validar como dimensão' }),
    )
    await within(section()).findByRole('list', { name: 'Problemas' })
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json({ valid: true, problems: [] }),
      ),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Validar como dimensão' }),
    )
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'A coleção forma uma dimensão válida.',
      ),
    )
    expect(
      within(section()).queryByRole('list', { name: 'Problemas' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-25: erro §1.4 mostra a message', async () => {
    server.use(
      http.post(validateUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'COLLECTION_NOT_FOUND',
              message: 'Coleção não encontrada.',
            },
          },
          { status: 404 },
        ),
      ),
    )
    await chooseFixture()
    fireEvent.click(
      screen.getByRole('button', { name: 'Validar como dimensão' }),
    )
    await waitFor(() =>
      expect(status()).toHaveTextContent('Coleção não encontrada.'),
    )
  })
})

describe('REQ-26: exportar coleção', () => {
  function stubDownload() {
    const created: Blob[] = []
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        created.push(blob)
        return 'blob:test'
      },
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: () => undefined,
    })
    const downloads: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download)
    })
    return { created, downloads }
  }

  it('REQ-26: baixa {collectionId}.json com o conteúdo recebido e mostra "Coleção exportada."', async () => {
    const { created, downloads } = stubDownload()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Coleção exportada.'),
    )
    expect(downloads).toEqual(['fixture.json'])
    expect(created).toHaveLength(1)
    expect(JSON.parse(await created[0].text())).toEqual(fixtureExportFixture)
  })

  it('REQ-33: o arquivo exportado traz as classes recebidas', async () => {
    const { created } = stubDownload()
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Coleção exportada.'),
    )
    const file: unknown = JSON.parse(await created[0].text())
    expect(file).toMatchObject({ classes: fixtureExportFixture.classes })
    expect(fixtureExportFixture.classes).toHaveLength(2)
  })

  it('REQ-26: erro §1.4 na exportação mostra a message e não baixa', async () => {
    const { downloads } = stubDownload()
    server.use(
      http.get(exportUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'COLLECTION_NOT_FOUND',
              message: 'Coleção não encontrada.',
            },
          },
          { status: 404 },
        ),
      ),
    )
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Coleção não encontrada.'),
    )
    expect(downloads).toEqual([])
  })
})

describe('REQ-26: importar coleção', () => {
  it('REQ-26: há o campo de arquivo "Importar coleção" (.json) e a caixa "Substituir se já existir" desmarcada, sem coleção escolhida', async () => {
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    const input = screen.getByLabelText('Importar coleção')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', expect.stringContaining('.json'))
    expect(
      screen.getByRole('checkbox', { name: 'Substituir se já existir' }),
    ).not.toBeChecked()
  })

  it('REQ-33: envia o conteúdo como está, escolhe a coleção importada e mostra "Coleção importada: {cardCount} cartas e {classCount} classes."', async () => {
    let received: unknown
    let replace: string | null = 'não chamou'
    await screen.findByRole('button', { name: /Cole\u00e7\u00e3o de Teste/ })
    let listCalls = 0
    server.use(
      http.get('*/lab/content/collections', () => {
        listCalls += 1
        return HttpResponse.json([])
      }),
      http.post(importUrl, async ({ request }) => {
        received = await request.json()
        replace = new URL(request.url).searchParams.get('replace')
        return HttpResponse.json(importResultFixture, { status: 201 })
      }),
    )
    // A lista inicial já foi pedida no `beforeEach`; só a nova consulta conta.
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    const before = listCalls
    const raw = { qualquer: 'coisa', formatVersion: 99 }
    chooseFile(jsonFile(JSON.stringify(raw)))
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Coleção importada: 1 cartas e 0 classes.',
      ),
    )
    expect(received).toEqual(raw)
    expect(replace).toBeNull()
    await waitFor(() => expect(listCalls).toBeGreaterThan(before))
    expect(
      await screen.findByRole('heading', { name: 'Bosque Antigo' }),
    ).toBeInTheDocument()
  })

  it('REQ-26: com "Substituir se já existir" marcada envia replace=true', async () => {
    let replace: string | null = null
    server.use(
      http.post(importUrl, ({ request }) => {
        replace = new URL(request.url).searchParams.get('replace')
        return HttpResponse.json(importResultFixture, { status: 201 })
      }),
    )
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Substituir se já existir' }),
    )
    chooseFile(jsonFile(JSON.stringify(bosqueExportFixture)))
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Coleção importada: 1 cartas e 0 classes.',
      ),
    )
    expect(replace).toBe('true')
  })

  it('REQ-26: CONTENT_ID_TAKEN sem substituir mostra a message e nada fica escolhido', async () => {
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    chooseFile(jsonFile(JSON.stringify(bosqueExportFixture)))
    await waitFor(() =>
      expect(status()).toHaveTextContent(importIdTakenFixture.error.message),
    )
    expect(
      screen.queryByRole('button', { name: 'Editar coleção' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-26: arquivo que não é JSON não envia nada e mostra "O arquivo não é um JSON válido."', async () => {
    let calls = 0
    server.use(
      http.post(importUrl, () => {
        calls += 1
        return HttpResponse.json(importResultFixture, { status: 201 })
      }),
    )
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    chooseFile(jsonFile('{isto não é json'))
    await waitFor(() =>
      expect(status()).toHaveTextContent('O arquivo não é um JSON válido.'),
    )
    expect(calls).toBe(0)
  })

  it('REQ-26: CONTENT_INVALID mostra a message e a lista "Problemas" com campo e texto; nada é importado', async () => {
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    chooseFile(jsonFile('{}'))
    await waitFor(() =>
      expect(status()).toHaveTextContent(importInvalidFixture.error.message),
    )
    const list = within(section()).getByRole('list', { name: 'Problemas' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['formatVersion: Versão do arquivo não suportada.'])
    expect(
      screen.queryByRole('button', { name: 'Editar coleção' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-26: com alterações não salvas, importar pergunta antes de trocar a coleção escolhida', async () => {
    await chooseFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Editar coleção' }))
    fireEvent.change(screen.getByLabelText('Nome', { exact: true }), {
      target: { value: 'Mudou' },
    })
    chooseFile(jsonFile(JSON.stringify(bosqueExportFixture)))
    const dialog = await screen.findByRole('dialog', {
      name: 'Descartar alterações?',
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Continuar editando' }),
    )
    expect(status()).not.toHaveTextContent('Coleção importada')
  })
})
