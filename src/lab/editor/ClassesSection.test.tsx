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
import type { EditorClass } from '../../api/editor'
import {
  bosqueRenamedFixture,
  editorCollectionsFixture,
  mageDraftFixture,
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
  // A lista padrão só traz a `fixture`; o `bosque` tem a classe em rascunho.
  server.use(
    http.get('*/lab/content/collections', () =>
      HttpResponse.json([...editorCollectionsFixture, bosqueRenamedFixture]),
    ),
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/lab/editor', element: <EditorPage /> }],
    { initialEntries: ['/lab/editor'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
})

const classesUrl = '*/lab/content/collections/:collectionId/classes'
const classUrl = '*/lab/content/classes/:playerClass'

const classes = () => screen.getByRole('region', { name: 'Classes' })
const classesStatus = () => within(classes()).getByRole('status')
const form = () => screen.getByRole('region', { name: 'Classe' })
const formStatus = () => within(form()).getByRole('status')
const saveButton = () => screen.getByRole('button', { name: 'Salvar classe' })

async function chooseCollection(name: RegExp): Promise<void> {
  fireEvent.click(await screen.findByRole('button', { name }))
  await screen.findByRole('button', { name: 'Editar coleção' })
}

async function openClass(name: string): Promise<void> {
  fireEvent.click(await screen.findByRole('button', { name }))
  await screen.findByRole('button', { name: 'Salvar classe' })
}

function type(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

/** Preenche uma classe nova completa e válida no formato. */
function fillNewClass(playerClass: string): void {
  fireEvent.change(screen.getByRole('combobox', { name: 'Classe' }), {
    target: { value: playerClass },
  })
  type('Nome', 'Mago')
  fireEvent.click(
    within(
      screen.getByRole('group', { name: 'Atributos essenciais' }),
    ).getByRole('button', { name: 'Adicionar' }),
  )
  fireEvent.change(screen.getByLabelText('Atributo essencial 1'), {
    target: { value: 'intelligence' },
  })
  for (const label of [
    'Ataque',
    'Defesa',
    'Precisão',
    'Esquiva',
    'Celeridade',
    'Perfuração',
    'Reflexão',
  ]) {
    type(label, '1')
  }
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Deck pré-pronto' })).getByRole(
      'button',
      { name: 'Adicionar' },
    ),
  )
  type('Carta 1', 'fixture.strength-basic')
  type('Cópias 1', '60')
}

describe('REQ-32: lista de classes', () => {
  it('REQ-32: sem coleção escolhida não há seção "Classes"', async () => {
    await screen.findByRole('button', { name: /Coleção de Teste/ })
    expect(screen.queryByRole('region', { name: 'Classes' })).toBeNull()
  })

  it('REQ-32: mostra "Carregando classes…" e depois cada classe como "{name} · {situação}", e "Nova classe"', async () => {
    await chooseCollection(/Coleção de Teste/)
    expect(classesStatus()).toHaveTextContent('Carregando classes…')
    const list = await within(classes()).findByRole('list', {
      name: 'Classes',
    })
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Ladino · Publicada', 'Guerreiro · Publicada'])
    expect(
      within(classes()).getByRole('button', { name: 'Nova classe' }),
    ).toBeInTheDocument()
  })

  it('REQ-32: rascunho aparece como "Rascunho"', async () => {
    await chooseCollection(/Bosque Antigo/)
    expect(
      await screen.findByRole('button', { name: 'Mago · Rascunho' }),
    ).toBeInTheDocument()
  })

  it('REQ-32: lista vazia mostra "Nenhuma classe nesta coleção."', async () => {
    server.use(http.get(classesUrl, () => HttpResponse.json([])))
    await chooseCollection(/Coleção de Teste/)
    expect(
      await within(classes()).findByText('Nenhuma classe nesta coleção.'),
    ).toBeInTheDocument()
  })

  it('REQ-32: erro na consulta mostra a message', async () => {
    server.use(
      http.get(classesUrl, () =>
        HttpResponse.json(
          { error: { code: 'X', message: 'Falhou a lista.' } },
          { status: 500 },
        ),
      ),
    )
    await chooseCollection(/Coleção de Teste/)
    await waitFor(() =>
      expect(classesStatus()).toHaveTextContent('Falhou a lista.'),
    )
  })
})

describe('REQ-32: formulário de classe', () => {
  it('REQ-32: classe publicada abre com os valores recebidos e "Classe" somente leitura', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    const select = screen.getByRole('combobox', { name: 'Classe' })
    expect(select).toHaveValue('rogue')
    expect(select).toBeDisabled()
    expect(screen.getByLabelText('Nome')).toHaveValue('Ladino')
    expect(screen.getByLabelText('Atributo essencial 1')).toHaveValue(
      'dexterity',
    )
    expect(screen.getByLabelText('Ataque')).toHaveValue('5')
    expect(screen.getByLabelText('Precisão')).toHaveValue('46')
    expect(screen.getByLabelText('Carta 1')).toHaveValue(
      'fixture.dexterity-basic',
    )
    expect(screen.getByLabelText('Cópias 1')).toHaveValue('40')
    expect(screen.getByLabelText('Carta 2')).toHaveValue(
      'fixture.strength-basic',
    )
    expect(
      screen.getByRole('button', { name: 'Ladino · Publicada' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('REQ-32: rascunho deixa mudar a "Classe"', async () => {
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    expect(screen.getByRole('combobox', { name: 'Classe' })).toBeEnabled()
  })

  it('REQ-32: "Carta {n}" sugere as cartas de atributo da coleção', async () => {
    const seen: string[] = []
    server.use(
      http.get(
        '*/lab/content/collections/:collectionId/cards',
        ({ request }) => {
          const url = new URL(request.url)
          seen.push(url.searchParams.get('type') ?? '')
          return HttpResponse.json([
            {
              id: 'fixture.strength-basic',
              type: 'attribute',
              name: 'Força Básica',
              status: 'published',
            },
          ])
        },
      ),
    )
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    const input = screen.getByLabelText('Carta 1')
    const listId = input.getAttribute('list')
    expect(listId).not.toBeNull()
    await waitFor(() => {
      const options = document.querySelectorAll(
        `#${CSS.escape(listId ?? '')} option`,
      )
      expect([...options].map((o) => o.getAttribute('value'))).toEqual([
        'fixture.strength-basic',
      ])
    })
    expect(seen).toContain('attribute')
  })

  it('REQ-32: "Nova classe" abre o formulário vazio com "Salvar classe" desabilitado', async () => {
    await chooseCollection(/Coleção de Teste/)
    fireEvent.click(
      await within(classes()).findByRole('button', { name: 'Nova classe' }),
    )
    expect(screen.getByRole('combobox', { name: 'Classe' })).toHaveValue('')
    expect(screen.getByLabelText('Nome')).toHaveValue('')
    expect(saveButton()).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Publicar classe' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Excluir classe' }),
    ).toBeDisabled()
  })

  it('REQ-32: com tudo preenchido "Salvar classe" habilita; número inválido ou seleção vazia desabilita', async () => {
    await chooseCollection(/Coleção de Teste/)
    fireEvent.click(
      await within(classes()).findByRole('button', { name: 'Nova classe' }),
    )
    fillNewClass('mage')
    expect(saveButton()).toBeEnabled()
    type('Cópias 1', 'muitas')
    expect(saveButton()).toBeDisabled()
    type('Cópias 1', '60')
    fireEvent.change(screen.getByLabelText('Atributo essencial 1'), {
      target: { value: '' },
    })
    expect(saveButton()).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Atributo essencial 1'), {
      target: { value: 'intelligence' },
    })
    type('Nome', '  ')
    expect(saveButton()).toBeDisabled()
  })

  it('REQ-32: listas têm "Adicionar", "Remover", "Subir" e "Descer"', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    const deck = screen.getByRole('group', { name: 'Deck pré-pronto' })
    fireEvent.click(within(deck).getAllByRole('button', { name: 'Subir' })[1])
    expect(screen.getByLabelText('Carta 1')).toHaveValue(
      'fixture.strength-basic',
    )
    expect(screen.getByLabelText('Cópias 1')).toHaveValue('20')
    fireEvent.click(within(deck).getAllByRole('button', { name: 'Descer' })[0])
    expect(screen.getByLabelText('Carta 1')).toHaveValue(
      'fixture.dexterity-basic',
    )
    fireEvent.click(within(deck).getAllByRole('button', { name: 'Remover' })[1])
    expect(screen.queryByLabelText('Carta 2')).toBeNull()
  })
})

describe('REQ-32: salvar classe', () => {
  it('REQ-32: cria a classe, mostra a devolvida, consulta a lista de novo e mostra "Classe salva."', async () => {
    let body: unknown
    let listRequests = 0
    server.use(
      http.get(classesUrl, () => {
        listRequests += 1
        return HttpResponse.json([])
      }),
      http.post(classesUrl, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(mageDraftFixture, { status: 201 })
      }),
    )
    await chooseCollection(/Coleção de Teste/)
    fireEvent.click(
      await within(classes()).findByRole('button', { name: 'Nova classe' }),
    )
    await waitFor(() => expect(listRequests).toBe(1))
    fillNewClass('mage')
    fireEvent.click(saveButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Classe salva.'))
    expect(body).toEqual({
      playerClass: 'mage',
      name: 'Mago',
      essentialAttributes: ['intelligence'],
      baseModifiers: {
        attack: 1,
        defense: 1,
        accuracy: 1,
        evasion: 1,
        celerity: 1,
        piercing: 1,
        reflection: 1,
      },
      starterDeck: [{ cardId: 'fixture.strength-basic', copies: 60 }],
    })
    // o formulário mostra a classe devolvida
    expect(screen.getByLabelText('Atributo essencial 2')).toHaveValue('spirit')
    expect(screen.getByLabelText('Ataque')).toHaveValue('3')
    await waitFor(() => expect(listRequests).toBe(2))
    expect(
      screen.getByRole('button', { name: 'Publicar classe' }),
    ).toBeEnabled()
  })

  it('REQ-32: salvar uma classe existente usa PUT', async () => {
    let method = ''
    server.use(
      http.put(classUrl, ({ request }) => {
        method = request.method
        return HttpResponse.json(mageDraftFixture)
      }),
    )
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    type('Nome', 'Mago Velho')
    fireEvent.click(saveButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Classe salva.'))
    expect(method).toBe('PUT')
  })

  it('REQ-32: CONTENT_ID_TAKEN aparece abaixo de "Classe", ligado por aria-describedby', async () => {
    await chooseCollection(/Coleção de Teste/)
    fireEvent.click(
      await within(classes()).findByRole('button', { name: 'Nova classe' }),
    )
    fillNewClass('warrior')
    fireEvent.click(saveButton())
    const select = screen.getByRole('combobox', { name: 'Classe' })
    await waitFor(() =>
      expect(select).toHaveAccessibleDescription(
        'Já existe uma classe com este identificador.',
      ),
    )
  })
})

describe('REQ-32: publicar e excluir classe', () => {
  it('REQ-32: "Publicar classe" só numa classe em rascunho salva e sem alterações', async () => {
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    const publish = screen.getByRole('button', { name: 'Publicar classe' })
    expect(publish).toBeEnabled()
    type('Nome', 'Outro')
    expect(publish).toBeDisabled()
  })

  it('REQ-32: classe publicada não pode ser publicada de novo', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    expect(
      screen.getByRole('button', { name: 'Publicar classe' }),
    ).toBeDisabled()
  })

  it('REQ-32: diálogo de publicar; CONTENT_INVALID aparece no campo e a classe segue em rascunho', async () => {
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    fireEvent.click(screen.getByRole('button', { name: 'Publicar classe' }))
    const dialog = screen.getByRole('dialog', { name: 'Publicar “Mago”?' })
    expect(dialog).toHaveTextContent(
      'Depois de publicada, a classe pode ser escolhida em novos jogos e o identificador não pode mais mudar.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }))
    await waitFor(() =>
      expect(
        screen.getByRole('group', { name: 'Deck pré-pronto' }),
      ).toHaveAccessibleDescription(
        'O deck pré-pronto não cumpre a trava da classe.',
      ),
    )
    expect(screen.getByRole('combobox', { name: 'Classe' })).toBeEnabled()
  })

  it('REQ-32: publicar com sucesso mostra "Classe publicada." e trava a "Classe"', async () => {
    const published: EditorClass = { ...mageDraftFixture, status: 'published' }
    server.use(
      http.post(`${classUrl}/publish`, () => HttpResponse.json(published)),
    )
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    fireEvent.click(screen.getByRole('button', { name: 'Publicar classe' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Publicar',
      }),
    )
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Classe publicada.'),
    )
    expect(screen.getByRole('combobox', { name: 'Classe' })).toBeDisabled()
  })

  it('REQ-32: "Cancelar" no diálogo não envia nada', async () => {
    let calls = 0
    server.use(
      http.delete(classUrl, () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir classe' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Cancelar',
      }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(calls).toBe(0)
  })

  it('REQ-32: excluir pergunta, fecha o formulário e mostra "Classe excluída."', async () => {
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir classe' }))
    const dialog = screen.getByRole('dialog', { name: 'Excluir “Mago”?' })
    expect(dialog).toHaveTextContent(
      'A classe será apagada. Não dá para desfazer.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    await waitFor(() =>
      expect(classesStatus()).toHaveTextContent('Classe excluída.'),
    )
    expect(screen.queryByRole('region', { name: 'Classe' })).toBeNull()
  })

  it('REQ-32: CONTENT_IN_USE mostra a message e o formulário continua', async () => {
    server.use(
      http.delete(classUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_IN_USE',
              message: 'A classe está em uso num save.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    await chooseCollection(/Bosque Antigo/)
    await openClass('Mago · Rascunho')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir classe' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('A classe está em uso num save.'),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Mago')
  })
})

describe('REQ-32: alterações não salvas da classe (REQ-24)', () => {
  it('REQ-32: escolher outra classe com alterações pergunta "As alterações desta classe…"', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    type('Nome', 'Ladrão')
    fireEvent.click(
      screen.getByRole('button', { name: 'Guerreiro · Publicada' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Descartar alterações?' })
    expect(dialog).toHaveTextContent(
      'As alterações desta classe ainda não foram salvas.',
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Continuar editando' }),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Ladrão')
    fireEvent.click(
      screen.getByRole('button', { name: 'Guerreiro · Publicada' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Descartar',
      }),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Nome')).toHaveValue('Guerreiro'),
    )
  })

  it('REQ-32: "Nova classe" com alterações também pergunta', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    type('Nome', 'Ladrão')
    fireEvent.click(
      within(classes()).getByRole('button', { name: 'Nova classe' }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Descartar alterações?' }),
    ).toHaveTextContent('As alterações desta classe ainda não foram salvas.')
  })

  it('REQ-32: trocar de coleção com a classe alterada também pergunta', async () => {
    await chooseCollection(/Coleção de Teste/)
    await openClass('Ladino · Publicada')
    type('Nome', 'Ladrão')
    fireEvent.click(screen.getByRole('button', { name: /Bosque Antigo/ }))
    expect(
      screen.getByRole('dialog', { name: 'Descartar alterações?' }),
    ).toHaveTextContent('As alterações desta classe ainda não foram salvas.')
  })
})

describe('REQ-32: CONTENT_REFERENCED no formulário de carta', () => {
  async function openDexterity(): Promise<void> {
    await chooseCollection(/Coleção de Teste/)
    fireEvent.click(await screen.findByRole('button', { name: /^Destreza · / }))
    await screen.findByRole('button', { name: 'Salvar rascunho' })
  }
  const cardStatus = () =>
    within(screen.getByRole('region', { name: 'Carta' })).getByRole('status')

  it('REQ-32: excluir carta do deck pré-pronto mostra a message e nada muda', async () => {
    await openDexterity()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir carta' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )
    await waitFor(() =>
      expect(cardStatus()).toHaveTextContent(
        'Esta carta está no deck pré-pronto de uma classe e não pode ser apagada nem renomeada.',
      ),
    )
  })

  it('REQ-32: renomear carta do deck pré-pronto mostra a message', async () => {
    server.use(
      http.put('*/lab/content/cards/:cardId', () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_REFERENCED',
              message: 'Carta referenciada por uma classe.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    await openDexterity()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
    await waitFor(() =>
      expect(cardStatus()).toHaveTextContent(
        'Carta referenciada por uma classe.',
      ),
    )
  })
})

it('REQ-70 allows editing class specializations', async () => {
  await chooseCollection(/Coleção de Teste/)
  fireEvent.click(
    await within(classes()).findByRole('button', { name: 'Nova classe' }),
  )
  const list = screen.getByRole('group', { name: 'Especializações' })
  fireEvent.click(within(list).getByRole('button', { name: 'Adicionar' }))
  expect(within(list).getByLabelText('ID da especialização')).toBeVisible()
})
