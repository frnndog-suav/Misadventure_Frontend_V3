import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
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
  fixtureCardSummariesFixture,
  forcaSorteInvalidFixture,
} from '../../mocks/editorFixtures'
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

const cardsUrl = '*/lab/content/collections/:collectionId/cards'
const cardUrl = '*/lab/content/cards/:cardId'

const cards = () => screen.getByRole('region', { name: 'Cartas' })
const form = () => screen.getByRole('region', { name: 'Carta' })
const formStatus = () => within(form()).getByRole('status')
const preview = () => screen.getByRole('region', { name: 'Pré-visualização' })
const field = (label: string) => within(form()).getByLabelText(label)
const saveButton = () =>
  within(form()).getByRole('button', { name: 'Salvar rascunho' })

function type(label: string, value: string): void {
  fireEvent.change(field(label), { target: { value } })
}

async function chooseFixture(): Promise<void> {
  fireEvent.click(
    await screen.findByRole('button', { name: /Coleção de Teste/ }),
  )
  await screen.findByRole('region', { name: 'Cartas' })
}

async function openCard(name: string): Promise<void> {
  await chooseFixture()
  fireEvent.click(await within(cards()).findByRole('button', { name }))
  await screen.findByRole('region', { name: 'Carta' })
  // a seção de carregamento é trocada pelo formulário
  await screen.findByLabelText('Identificador')
}

async function newCard(typeLabel: string): Promise<void> {
  await chooseFixture()
  fireEvent.click(within(cards()).getByRole('button', { name: 'Nova carta' }))
  fireEvent.click(
    within(
      within(cards()).getByRole('group', { name: 'Tipo da nova carta' }),
    ).getByRole('button', { name: typeLabel }),
  )
  await screen.findByRole('region', { name: 'Carta' })
}

/** Preenche uma carta de atributo nova com o corpo do cenário "forca". */
function fillForca(slug: string): void {
  type('Identificador', slug)
  type('Nome', 'Força')
  fireEvent.change(field('Raridade'), { target: { value: 'common' } })
  fireEvent.change(field('Tipo'), { target: { value: 'basic' } })
  const attributes = within(form()).getByRole('group', { name: 'Atributos' })
  fireEvent.click(within(attributes).getByRole('button', { name: 'Adicionar' }))
  fireEvent.change(within(attributes).getByLabelText('Atributo 1'), {
    target: { value: 'strength' },
  })
}

/** Guarda o corpo de cada pedido de escrita de carta e deixa o handler responder. */
function recordBodies(): { method: string; url: string; body: unknown }[] {
  const bodies: { method: string; url: string; body: unknown }[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET') return
    void request
      .clone()
      .json()
      .then((body: unknown) =>
        bodies.push({ method: request.method, url: request.url, body }),
      )
  })
  return bodies
}

afterEach(() => server.events.removeAllListeners())

describe('REQ-21: abrir o formulário', () => {
  it('REQ-21: carta da lista abre o formulário com os valores recebidos; publicada tem "Identificador" somente leitura', async () => {
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    expect(field('Identificador')).toHaveValue('strength-basic')
    expect(field('Identificador')).toHaveAttribute('readonly')
    expect(within(form()).getByText('Id: fixture.strength-basic'))
    expect(within(form()).getByText('Situação: Publicada'))
    expect(field('Nome')).toHaveValue('Força')
    expect(field('Texto de ambientação')).toHaveValue('')
    expect(field('Raridade')).toHaveValue('common')
    expect(field('Tipo')).toHaveValue('basic')
    const attributes = within(form()).getByRole('group', { name: 'Atributos' })
    expect(within(attributes).getByLabelText('Atributo 1')).toHaveValue(
      'strength',
    )
  })

  it('REQ-21: zona da lista abre o formulário de zona', async () => {
    renderEditor()
    await openCard('Bosque Sussurrante · Zona · Publicada')
    expect(field('Título')).toHaveValue('Bosque Sussurrante')
    expect(field('Tipo de zona')).toHaveValue('forest')
    expect(field('Local')).toHaveValue('Terras Selvagens')
    expect(field('Setas de conexão')).toHaveValue('2')
    const actions = within(form()).getByRole('group', { name: 'Ações de zona' })
    expect(
      within(actions).getByRole('checkbox', { name: 'Iniciar evento' }),
    ).toBeChecked()
    expect(
      within(actions).getByRole('checkbox', { name: 'Movimentar' }),
    ).not.toBeChecked()
  })

  it('REQ-21: "Nova carta" abre o formulário vazio, em rascunho, com "Identificador" editável', async () => {
    renderEditor()
    await newCard('Zona')
    expect(field('Identificador')).toHaveValue('')
    expect(field('Identificador')).not.toHaveAttribute('readonly')
    expect(within(form()).getByText('Situação: Rascunho'))
    expect(within(form()).getByText('Id: fixture.'))
    expect(field('Título')).toHaveValue('')
    expect(field('Local')).toHaveValue('')
    expect(field('Setas de conexão')).toHaveValue('')
    type('Identificador', 'praca')
    expect(within(form()).getByText('Id: fixture.praca'))
  })
})

describe('REQ-21: conferência de formato', () => {
  it('REQ-21: texto obrigatório vazio ou número inválido desabilitam "Salvar rascunho"', async () => {
    renderEditor()
    await newCard('Zona')
    expect(saveButton()).toBeDisabled()
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
    expect(saveButton()).toBeEnabled()
    type('Setas de conexão', 'quatro')
    expect(saveButton()).toBeDisabled()
    type('Setas de conexão', '4')
    type('Título', '  ')
    expect(saveButton()).toBeDisabled()
  })
})

describe('REQ-55: efeitos estruturados', () => {
  it('envia o consumível sem consumeSelf e mostra a recusa do backend no custo', async () => {
    const bodies = recordBodies()
    const message = 'Consumível precisa ter o custo de usar a própria carta.'
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields: [{ path: 'effects.0.cost', message }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Poção de Cura · Item · Publicada')
    type('Custo do efeito 1 (JSON)', '[]')
    expect(saveButton()).toBeEnabled()
    fireEvent.click(saveButton())
    await within(form()).findByText(message)
    expect(field('Custo do efeito 1 (JSON)')).toHaveAccessibleDescription(
      message,
    )
    expect(bodies).toEqual([
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({
          effects: [
            {
              text: 'Recupera 5 de vida.',
              trigger: null,
              cost: [],
              activation: [{ kind: 'heal', amount: 5 }],
              duration: { kind: 'immediate' },
              mark: null,
            },
          ],
        }),
      }),
    ])
  })

  it('valida o JSON e o formato antes de salvar ou mostrar a carta', async () => {
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    fireEvent.click(within(effects).getByRole('button', { name: 'Adicionar' }))
    type('Texto do efeito 1', 'Texto do autor.')
    expect(
      within(effects).getByLabelText('Gatilho do efeito 1 (JSON)'),
    ).toHaveValue('null')
    expect(
      within(effects).getByLabelText('Custo do efeito 1 (JSON)'),
    ).toHaveValue('[]')
    expect(
      within(effects).getByLabelText('Ativação do efeito 1 (JSON)'),
    ).toHaveValue('[]')
    expect(
      within(effects).getByLabelText('Duração do efeito 1 (JSON)'),
    ).toHaveValue('{"kind":"immediate"}')
    expect(within(effects).getByLabelText('Marcação do efeito 1')).toHaveValue(
      '',
    )
    for (const invalid of [
      '[',
      '[{"kind":"heal","amount":"5"}]',
      '[{"kind":"unknown"}]',
    ]) {
      type('Ativação do efeito 1 (JSON)', invalid)
      expect(saveButton()).toBeDisabled()
      expect(preview()).toHaveTextContent('Formato de efeito inválido.')
      expect(within(preview()).queryByRole('article')).toBeNull()
    }
    type('Ativação do efeito 1 (JSON)', '[{"kind":"heal","amount":5}]')
    expect(saveButton()).toBeEnabled()
    expect(preview()).toHaveTextContent('Texto do autor.')
  })
})

describe('REQ-21: listas', () => {
  it('REQ-21: "Adicionar", "Remover", "Subir" e "Descer"', async () => {
    renderEditor()
    await newCard('Atributo')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    const add = within(effects).getByRole('button', { name: 'Adicionar' })
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 1'), {
      target: { value: 'A' },
    })
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 2'), {
      target: { value: 'B' },
    })
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 3'), {
      target: { value: 'C' },
    })
    const values = () =>
      within(effects)
        .getAllByLabelText(/^Texto do efeito /)
        .map((input) => (input as HTMLInputElement).value)
    const items = () => within(effects).getAllByRole('listitem')

    expect(
      within(items()[0]).getByRole('button', { name: 'Subir' }),
    ).toBeDisabled()
    expect(
      within(items()[2]).getByRole('button', { name: 'Descer' }),
    ).toBeDisabled()

    fireEvent.click(within(items()[0]).getByRole('button', { name: 'Descer' }))
    expect(values()).toEqual(['B', 'A', 'C'])
    fireEvent.click(within(items()[2]).getByRole('button', { name: 'Subir' }))
    expect(values()).toEqual(['B', 'C', 'A'])
    fireEvent.click(within(items()[1]).getByRole('button', { name: 'Remover' }))
    expect(values()).toEqual(['B', 'A'])
  })
})

describe('REQ-21: salvar', () => {
  it('REQ-21: carta nova é criada com os valores; status "Rascunho salvo." e a lista é consultada de novo', async () => {
    const bodies = recordBodies()
    let listCalls = 0
    server.use(
      http.get(cardsUrl, () => {
        listCalls += 1
        return HttpResponse.json(fixtureCardSummariesFixture)
      }),
    )
    renderEditor()
    await newCard('Atributo')
    await waitFor(() => expect(listCalls).toBe(1))
    fillForca('forca')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies).toEqual([
      {
        method: 'POST',
        url: 'http://localhost:3000/lab/content/collections/fixture/cards',
        body: {
          slug: 'forca',
          type: 'attribute',
          name: 'Força',
          flavorText: null,
          rarity: 'common',
          attributeKind: 'basic',
          attributes: ['strength'],
          effects: [],
        },
      },
    ])
    await waitFor(() => expect(listCalls).toBe(2))
    // o formulário mostra a carta devolvida, agora salva
    expect(field('Identificador')).toHaveValue('forca')
  })

  it('REQ-21: zona nova vai com as ações na ordem do glossário, número e efeitos com polaridade', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Zona')
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
    const actions = within(form()).getByRole('group', { name: 'Ações de zona' })
    fireEvent.click(
      within(actions).getByRole('checkbox', { name: 'Ir ao Mercado' }),
    )
    fireEvent.click(
      within(actions).getByRole('checkbox', { name: 'Recuperar' }),
    )
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    fireEvent.click(within(effects).getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 1'), {
      target: { value: 'Neblina.' },
    })
    fireEvent.change(within(effects).getByLabelText('Polaridade do efeito 1'), {
      target: { value: 'negative' },
    })
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toEqual({
      slug: 'praca',
      type: 'zone',
      title: 'Praça',
      zoneType: 'urban',
      location: 'Cidade',
      connectionArrows: 4,
      arrowLayout: null,
      zoneActions: ['recover', 'visitMarket'],
      effects: [
        {
          trigger: null,
          cost: [],
          activation: [],
          duration: { kind: 'immediate' },
          text: 'Neblina.',
          polarity: 'negative',
        },
      ],
    })
  })

  it('REQ-21: carta existente é salva por PUT; publicada mostra "Carta salva."', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    type('Nome', 'Força Bruta')
    fireEvent.click(saveButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Carta salva.'))
    expect(bodies[0].method).toBe('PUT')
    expect(bodies[0].url).toBe(
      'http://localhost:3000/lab/content/cards/fixture.strength-basic',
    )
    expect(bodies[0].body).toMatchObject({
      slug: 'strength-basic',
      name: 'Força Bruta',
    })
  })

  it('REQ-21: durante o envio, "Salvar rascunho" fica desabilitado', async () => {
    server.use(
      http.put(cardUrl, async () => {
        await delay('infinite')
        return HttpResponse.json({})
      }),
    )
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() => expect(saveButton()).toBeDisabled())
  })

  it('REQ-21: CONTENT_INVALID mostra a message, liga o texto ao campo e mantém o digitado', async () => {
    renderEditor()
    await newCard('Atributo')
    fillForca('forca-sorte')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Conteúdo inválido.'),
    )
    const attributes = within(form()).getByRole('group', { name: 'Atributos' })
    const text = forcaSorteInvalidFixture.error.details.fields[0].message
    const error = within(form()).getByText(text)
    expect(attributes).toHaveAttribute('aria-describedby', error.id)
    expect(field('Identificador')).toHaveValue('forca-sorte')
    expect(field('Nome')).toHaveValue('Força')
  })

  it('REQ-21: erro dentro de lista vai para o item do caminho', async () => {
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  { path: 'effects.1.text', message: 'Texto vazio.' },
                  {
                    path: 'effects.1.activation.0.amount',
                    message: 'Valor recusado.',
                  },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    const add = within(effects).getByRole('button', { name: 'Adicionar' })
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 1'), {
      target: { value: 'A' },
    })
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 2'), {
      target: { value: 'B' },
    })
    fireEvent.click(saveButton())
    const error = await within(form()).findByText('Texto vazio.')
    expect(field('Ativação do efeito 2 (JSON)')).toHaveAccessibleDescription(
      'Valor recusado.',
    )
    expect(within(effects).getByLabelText('Texto do efeito 2')).toHaveAttribute(
      'aria-describedby',
      error.id,
    )
    expect(
      within(effects).getByLabelText('Texto do efeito 1'),
    ).not.toHaveAttribute('aria-describedby')
  })
})

describe('REQ-22: pré-visualização', () => {
  it('REQ-22: mostra a carta montada dos valores atuais e acompanha as mudanças', async () => {
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    expect(
      within(preview()).getByRole('article', { name: 'Força' }),
    ).toBeInTheDocument()
    type('Nome', 'Força Bruta')
    expect(
      within(preview()).getByRole('article', { name: 'Força Bruta' }),
    ).toBeInTheDocument()
  })

  it('REQ-22: valores incompletos mostram o aviso', async () => {
    renderEditor()
    await newCard('Zona')
    expect(preview()).toHaveTextContent(
      'Preencha os campos obrigatórios para ver a carta.',
    )
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
    expect(
      within(preview()).getByRole('article', { name: 'Praça' }),
    ).toBeInTheDocument()
    // fora do formato do contrato (setas de 1 a 4)
    type('Setas de conexão', '9')
    expect(preview()).toHaveTextContent(
      'Preencha os campos obrigatórios para ver a carta.',
    )
  })
})

describe('REQ-24: alterações não salvas na carta', () => {
  const discardDialog = () =>
    screen.getByRole('dialog', { name: 'Descartar alterações?' })

  async function dirtyCard(): Promise<ReturnType<typeof renderEditor>> {
    const router = renderEditor()
    await openCard('Força · Atributo · Publicada')
    type('Nome', 'Mudou')
    return router
  }

  it('REQ-24: escolher outra carta pergunta; "Continuar editando" fica, "Descartar" troca', async () => {
    await dirtyCard()
    fireEvent.click(
      within(cards()).getByRole('button', {
        name: 'Bosque Sussurrante · Zona · Publicada',
      }),
    )
    expect(discardDialog()).toHaveTextContent(
      'As alterações desta carta ainda não foram salvas.',
    )
    expect(
      within(discardDialog()).getByRole('button', {
        name: 'Continuar editando',
      }),
    ).toHaveFocus()
    fireEvent.click(
      within(discardDialog()).getByRole('button', {
        name: 'Continuar editando',
      }),
    )
    expect(field('Nome')).toHaveValue('Mudou')

    fireEvent.click(
      within(cards()).getByRole('button', {
        name: 'Bosque Sussurrante · Zona · Publicada',
      }),
    )
    fireEvent.click(
      within(discardDialog()).getByRole('button', { name: 'Descartar' }),
    )
    expect(await screen.findByLabelText('Título')).toHaveValue(
      'Bosque Sussurrante',
    )
  })

  it('REQ-24: "Nova carta" pergunta', async () => {
    await dirtyCard()
    fireEvent.click(within(cards()).getByRole('button', { name: 'Nova carta' }))
    expect(discardDialog()).toBeInTheDocument()
    fireEvent.click(
      within(discardDialog()).getByRole('button', { name: 'Descartar' }),
    )
    expect(
      within(cards()).getByRole('group', { name: 'Tipo da nova carta' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Carta' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-24: "Voltar ao laboratório" pergunta; "Descartar" sai', async () => {
    const router = await dirtyCard()
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    expect(discardDialog()).toHaveTextContent('desta carta')
    fireEvent.click(
      within(discardDialog()).getByRole('button', { name: 'Descartar' }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })

  it('REQ-24: depois de salvar, sair não pergunta', async () => {
    const router = await dirtyCard()
    fireEvent.click(saveButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Carta salva.'))
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao laboratório' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/lab'))
  })

  it('REQ-24: com alterações na carta, fechar a aba pede confirmação', async () => {
    await dirtyCard()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})

describe('REQ-21: equipamento', () => {
  const group = (name: string) => within(form()).getByRole('group', { name })

  async function newEquipment(): Promise<void> {
    renderEditor()
    await newCard('Equipamento')
  }

  /** Preenche o mínimo de formato de um equipamento novo. */
  function fillEspada(): void {
    type('Identificador', 'espada')
    type('Nome', 'Espada')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.change(field('Slot'), { target: { value: 'weapon' } })
  }

  it('REQ-21: equipamento da lista abre o formulário com os valores recebidos', async () => {
    renderEditor()
    await openCard('Lâmina do Crepúsculo · Equipamento · Publicada')
    expect(field('Identificador')).toHaveValue('blade-of-dusk')
    expect(field('Nome')).toHaveValue('Lâmina do Crepúsculo')
    expect(field('Texto de ambientação')).toHaveValue(
      'Forjada na hora em que o dia cede à noite.',
    )
    expect(field('Raridade')).toHaveValue('rare')
    expect(field('Slot')).toHaveValue('weapon')
    expect(field('Etiqueta 1')).toHaveValue('espada')
    expect(field('Etiqueta 2')).toHaveValue('duas mãos')
    expect(field('Modificador 1')).toHaveValue('attack')
    expect(field('Valor do modificador 1')).toHaveValue('3')
    expect(field('Modificador 2')).toHaveValue('accuracy')
    expect(field('Valor do modificador 2')).toHaveValue('1')
    expect(field('Pico mínimo')).toHaveValue('')
    expect(field('Bloqueia escudo')).toBeChecked()
    expect(field('Refino')).toBeChecked()
    expect(field('Nível máximo')).toHaveValue('3')
    expect(field('Materiais')).toHaveValue('1 Minério de Ferro por nível.')
    expect(field('Encantamento')).toBeChecked()
    expect(field('Texto do encantamento')).toHaveValue(
      'Encantamento: causa dano sombrio extra.',
    )
    expect(field('Ajuste de preço')).toHaveValue('1')
  })

  it('REQ-21: o primeiro modificador é o principal e "Descer" troca a ordem', async () => {
    renderEditor()
    await openCard('Lâmina do Crepúsculo · Equipamento · Publicada')
    const modifiers = group('Modificadores')
    const items = within(modifiers).getAllByRole('listitem')
    expect(within(items[0]).getByText('Principal')).toBeInTheDocument()
    expect(within(items[1]).queryByText('Principal')).not.toBeInTheDocument()
    fireEvent.click(within(items[0]).getByRole('button', { name: 'Descer' }))
    expect(field('Modificador 1')).toHaveValue('accuracy')
    expect(field('Modificador 2')).toHaveValue('attack')
    expect(
      within(within(modifiers).getAllByRole('listitem')[0]).getByText(
        'Principal',
      ),
    ).toBeInTheDocument()
  })

  it('REQ-21: "Etiquetas" sugere as etiquetas já usadas na coleção (do backend)', async () => {
    renderEditor()
    await openCard('Lâmina do Crepúsculo · Equipamento · Publicada')
    await waitFor(() => {
      const listId = field('Etiqueta 1').getAttribute('list')
      expect(listId).toBeTruthy()
      const options = Array.from(
        document.querySelectorAll(`datalist[id="${listId}"] option`),
      ).map((option) => option.getAttribute('value'))
      expect(options).toEqual(['duas mãos', 'espada', 'poção'])
    })
  })

  it('REQ-21: "Restrição de classe" são caixas de marcar com os rótulos das classes', async () => {
    await newEquipment()
    const classes = group('Restrição de classe')
    expect(within(classes).getAllByRole('checkbox')).toHaveLength(12)
    expect(
      within(classes).getByRole('checkbox', { name: 'Guerreiro' }),
    ).not.toBeChecked()
    fireEvent.click(within(classes).getByRole('checkbox', { name: 'Mago' }))
    expect(
      within(classes).getByRole('checkbox', { name: 'Mago' }),
    ).toBeChecked()
  })

  it('REQ-21: "Nova carta" de equipamento abre o formulário vazio e só salva com o formato completo', async () => {
    await newEquipment()
    expect(within(form()).getByText('Situação: Rascunho')).toBeInTheDocument()
    expect(field('Ajuste de preço')).toHaveValue('1')
    expect(field('Refino')).not.toBeChecked()
    expect(field('Encantamento')).not.toBeChecked()
    expect(saveButton()).toBeDisabled()
    fillEspada()
    expect(saveButton()).toBeEnabled()
    type('Ajuste de preço', 'caro')
    expect(saveButton()).toBeDisabled()
    type('Ajuste de preço', '1.2')
    expect(saveButton()).toBeEnabled()
    type('Pico mínimo', 'alto')
    expect(saveButton()).toBeDisabled()
    type('Pico mínimo', '')
    expect(saveButton()).toBeEnabled()
  })

  it('REQ-21: "Refino" ligado mostra "Nível máximo" e "Materiais" e exige os dois; desligado, não aparecem', async () => {
    await newEquipment()
    fillEspada()
    expect(within(form()).queryByLabelText('Nível máximo')).toBeNull()
    expect(within(form()).queryByLabelText('Materiais')).toBeNull()
    fireEvent.click(field('Refino'))
    expect(saveButton()).toBeDisabled()
    type('Nível máximo', '3')
    expect(saveButton()).toBeDisabled()
    type('Materiais', 'Minério')
    expect(saveButton()).toBeEnabled()
    type('Nível máximo', 'três')
    expect(saveButton()).toBeDisabled()
    fireEvent.click(field('Refino'))
    expect(saveButton()).toBeEnabled()
  })

  it('REQ-21: "Encantamento" ligado mostra o texto e o exige', async () => {
    await newEquipment()
    fillEspada()
    expect(within(form()).queryByLabelText('Texto do encantamento')).toBeNull()
    fireEvent.click(field('Encantamento'))
    expect(saveButton()).toBeDisabled()
    type('Texto do encantamento', 'Brilha.')
    expect(saveButton()).toBeEnabled()
  })

  it('REQ-21: listas de equipamento exigem texto e valor em formato', async () => {
    await newEquipment()
    fillEspada()
    fireEvent.click(
      within(group('Modificadores')).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    fireEvent.change(field('Modificador 1'), { target: { value: 'attack' } })
    type('Valor do modificador 1', 'x')
    expect(saveButton()).toBeDisabled()
    type('Valor do modificador 1', '2')
    expect(saveButton()).toBeEnabled()
    fireEvent.click(
      within(group('Habilidades')).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    type('Nome da habilidade 1', 'Golpe')
    type('Texto da habilidade 1', 'Bate forte.')
    expect(saveButton()).toBeEnabled()
    fireEvent.click(
      within(group('Etiquetas')).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    type('Etiqueta 1', 'espada')
    fireEvent.click(
      within(group('Efeitos')).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    type('Texto do efeito 1', 'Sangra.')
    expect(saveButton()).toBeEnabled()
  })

  it('REQ-21: "Salvar rascunho" envia o corpo do equipamento (vazios e desligados viram null)', async () => {
    const bodies = recordBodies()
    await newEquipment()
    fillEspada()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies).toHaveLength(1)
    expect(bodies[0].method).toBe('POST')
    expect(bodies[0].body).toEqual({
      slug: 'espada',
      type: 'equipment',
      name: 'Espada',
      flavorText: null,
      rarity: 'common',
      slot: 'weapon',
      tags: [],
      modifiers: [],
      peakRequirement: null,
      classRestriction: [],
      blocksShield: false,
      abilities: [],
      effects: [],
      refinement: null,
      enchantment: null,
      priceMultiplier: 1,
      scavengeTool: null,
    })
  })

  it('REQ-21: o corpo leva refino, encantamento, pico, classes e listas', async () => {
    const bodies = recordBodies()
    await newEquipment()
    fillEspada()
    type('Pico mínimo', '2')
    fireEvent.click(
      within(group('Restrição de classe')).getByRole('checkbox', {
        name: 'Mago',
      }),
    )
    fireEvent.click(
      within(group('Restrição de classe')).getByRole('checkbox', {
        name: 'Guerreiro',
      }),
    )
    fireEvent.click(field('Bloqueia escudo'))
    fireEvent.click(field('Refino'))
    type('Nível máximo', '3')
    type('Materiais', 'Minério')
    fireEvent.click(field('Encantamento'))
    type('Texto do encantamento', 'Brilha.')
    type('Ajuste de preço', '1.5')
    fireEvent.click(
      within(group('Modificadores')).getByRole('button', { name: 'Adicionar' }),
    )
    fireEvent.change(field('Modificador 1'), { target: { value: 'defense' } })
    type('Valor do modificador 1', '2')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toMatchObject({
      peakRequirement: 2,
      classRestriction: ['warrior', 'mage'],
      blocksShield: true,
      refinement: { maxLevel: 3, materials: { text: 'Minério' } },
      enchantment: { text: 'Brilha.' },
      priceMultiplier: 1.5,
      modifiers: [{ modifier: 'defense', value: 2 }],
    })
  })

  it('REQ-22: a pré-visualização mostra o equipamento quando o formato fecha', async () => {
    await newEquipment()
    expect(preview()).toHaveTextContent(
      'Preencha os campos obrigatórios para ver a carta.',
    )
    fillEspada()
    expect(
      within(preview()).getByRole('article', { name: 'Espada' }),
    ).toBeInTheDocument()
  })

  it('REQ-21: erro em item de lista aparece no campo certo (2º modificador)', async () => {
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  {
                    path: 'modifiers.1.value',
                    message: 'O valor do modificador deve ser inteiro.',
                  },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Lâmina do Crepúsculo · Equipamento · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Conteúdo inválido.'),
    )
    expect(field('Valor do modificador 2')).toHaveAccessibleDescription(
      'O valor do modificador deve ser inteiro.',
    )
    expect(field('Valor do modificador 1')).not.toHaveAccessibleDescription()
    expect(field('Valor do modificador 2')).toHaveValue('1')
  })
})

describe('REQ-21: item', () => {
  async function newItem(): Promise<void> {
    renderEditor()
    await newCard('Item')
  }

  it('REQ-21: item da lista abre o formulário com os valores recebidos', async () => {
    renderEditor()
    await openCard('Poção de Cura · Item · Publicada')
    expect(field('Identificador')).toHaveValue('healing-potion')
    expect(field('Nome')).toHaveValue('Poção de Cura')
    expect(field('Raridade')).toHaveValue('common')
    expect(field('Categoria')).toHaveValue('consumable')
    expect(field('Etiqueta 1')).toHaveValue('poção')
    expect(field('Texto do efeito 1')).toHaveValue('Recupera 5 de vida.')
  })

  it('REQ-21: "Nova carta" de item só salva com o formato completo e envia o corpo', async () => {
    const bodies = recordBodies()
    await newItem()
    expect(saveButton()).toBeDisabled()
    type('Identificador', 'pocao')
    type('Nome', 'Poção')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    expect(saveButton()).toBeDisabled()
    fireEvent.change(field('Categoria'), { target: { value: 'consumable' } })
    expect(saveButton()).toBeEnabled()
    expect(
      within(preview()).getByRole('article', { name: 'Poção' }),
    ).toBeInTheDocument()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toEqual({
      slug: 'pocao',
      type: 'item',
      name: 'Poção',
      flavorText: null,
      rarity: 'common',
      itemCategory: 'consumable',
      tags: [],
      effects: [],
      toolKind: null,
      scavengeZoneTypes: [],
      scavengeTool: null,
    })
  })

  it('REQ-21: erro de campo do item aparece abaixo do campo', async () => {
    server.use(
      http.post(cardsUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  { path: 'itemCategory', message: 'Categoria inválida.' },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    await newItem()
    type('Identificador', 'pocao')
    type('Nome', 'Poção')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.change(field('Categoria'), { target: { value: 'booster' } })
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Categoria')).toHaveAccessibleDescription(
        'Categoria inválida.',
      ),
    )
  })
})

describe('REQ-21: evento aleatório', () => {
  it('REQ-21: evento aleatório da lista abre o formulário com os valores recebidos', async () => {
    renderEditor()
    await openCard('Viajante Ferido · Evento aleatório · Publicada')
    expect(field('Identificador')).toHaveValue('wounded-traveler')
    expect(field('Título')).toHaveValue('Viajante Ferido')
    expect(field('Texto de ambientação')).toHaveValue(
      'Um estranho jaz à beira da trilha.',
    )
    expect(field('Requisito 1')).toHaveValue('Possuir uma Poção de Cura.')
    expect(field('Coisa boa')).toHaveValue(
      'O viajante agradece e revela um atalho.',
    )
    expect(field('Coisa ruim')).toHaveValue(
      'Era uma emboscada; o grupo perde suprimentos.',
    )
    expect(field('Sem fuga')).not.toBeChecked()
  })

  it('REQ-21: "Nova carta" de evento aleatório só salva com o formato completo e envia o corpo', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Evento aleatório')
    expect(saveButton()).toBeDisabled()
    type('Identificador', 'ponte')
    type('Título', 'Ponte Quebrada')
    type('Coisa boa', 'O grupo atravessa.')
    expect(saveButton()).toBeDisabled()
    type('Coisa ruim', 'Alguém cai no rio.')
    expect(saveButton()).toBeEnabled()
    const requirements = within(form()).getByRole('group', {
      name: 'Requisitos',
    })
    fireEvent.click(
      within(requirements).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    type('Requisito 1', 'Ter uma corda.')
    fireEvent.click(field('Sem fuga'))
    expect(saveButton()).toBeEnabled()
    expect(
      within(preview()).getByRole('article', { name: 'Ponte Quebrada' }),
    ).toBeInTheDocument()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toEqual({
      slug: 'ponte',
      type: 'randomEvent',
      title: 'Ponte Quebrada',
      flavorText: null,
      requirements: [{ text: 'Ter uma corda.' }],
      goodOutcome: { text: 'O grupo atravessa.' },
      badOutcome: { text: 'Alguém cai no rio.' },
      noEscape: true,
    })
  })

  it('REQ-21: erro em requisito e em resultado aparece no campo do caminho', async () => {
    server.use(
      http.post(cardsUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  { path: 'requirements.0.text', message: 'Texto vazio.' },
                  { path: 'goodOutcome.text', message: 'Muito longo.' },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await newCard('Evento aleatório')
    type('Identificador', 'ponte')
    type('Título', 'Ponte')
    type('Coisa boa', 'Bom.')
    type('Coisa ruim', 'Ruim.')
    fireEvent.click(
      within(
        within(form()).getByRole('group', { name: 'Requisitos' }),
      ).getByRole('button', { name: 'Adicionar' }),
    )
    type('Requisito 1', 'Algo.')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Requisito 1')).toHaveAccessibleDescription('Texto vazio.'),
    )
    expect(field('Coisa boa')).toHaveAccessibleDescription('Muito longo.')
    expect(field('Requisito 1')).toHaveValue('Algo.')
  })
})

describe('REQ-21: evento de combate', () => {
  async function newCombat(): Promise<void> {
    renderEditor()
    await newCard('Evento de combate')
    type('Identificador', 'emboscada')
    type('Título', 'Emboscada')
    type('Coisa boa', 'Vitória.')
    type('Coisa ruim', 'Derrota.')
  }

  function addEnemy(): void {
    const enemies = within(form()).getByRole('group', { name: 'Inimigos' })
    const add = within(enemies).getAllByRole('button', { name: 'Adicionar' })
    // o último "Adicionar" do grupo é o da lista de inimigos
    fireEvent.click(add[add.length - 1])
  }

  it('REQ-21: evento de combate da lista abre o formulário com os inimigos recebidos', async () => {
    renderEditor()
    await openCard('Lobos Uivantes · Evento de combate · Publicada')
    expect(field('Identificador')).toHaveValue('howling-wolves')
    expect(field('Título')).toHaveValue('Lobos Uivantes')
    expect(field('Nome do inimigo 1')).toHaveValue('Lobo Cinzento')
    expect(field('Texto de ambientação do inimigo 1')).toHaveValue('')
    expect(field('Quantidade do inimigo 1')).toHaveValue('2')
    const types = within(form()).getByRole('group', {
      name: 'Tipos do inimigo 1',
    })
    expect(within(types).getByLabelText('Fera')).toBeChecked()
    expect(within(types).getByLabelText('Planta')).not.toBeChecked()
    expect(field('Criatura do inimigo 1')).toHaveValue('Lobo')
    expect(field('Categoria do inimigo 1')).toHaveValue('common')
    expect(field('Elemento do inimigo 1')).toHaveValue('')
    expect(
      within(field('Elemento do inimigo 1')).getByRole('option', {
        name: 'Sem elemento',
      }),
    ).toBeInTheDocument()
    expect(field('Vida do inimigo 1')).toHaveValue('6')
    expect(field('Ataque do inimigo 1')).toHaveValue('2')
    expect(field('Celeridade do inimigo 1')).toHaveValue('3')
    expect(field('Reflexão do inimigo 1')).toHaveValue('0')
    expect(field('Vigor do inimigo 1')).toHaveValue('')
    expect(field('Comportamento do inimigo 1')).toHaveValue('aggressive')
    expect(field('Coisa boa')).toHaveValue(
      'Os lobos fogem e deixam peles para trás.',
    )
    expect(field('Sem fuga')).not.toBeChecked()
  })

  it('REQ-21: inimigo novo exige nome, criatura, categoria, comportamento e números em formato', async () => {
    await newCombat()
    expect(saveButton()).toBeEnabled()
    addEnemy()
    expect(saveButton()).toBeDisabled()
    type('Nome do inimigo 1', 'Bandido')
    type('Criatura do inimigo 1', 'Humano')
    fireEvent.change(field('Categoria do inimigo 1'), {
      target: { value: 'common' },
    })
    fireEvent.change(field('Comportamento do inimigo 1'), {
      target: { value: 'hunter' },
    })
    type('Vida do inimigo 1', '5')
    expect(saveButton()).toBeEnabled()
    type('Ataque do inimigo 1', 'x')
    expect(saveButton()).toBeDisabled()
    type('Ataque do inimigo 1', '1')
    type('Vigor do inimigo 1', 'dois')
    expect(saveButton()).toBeDisabled()
    type('Vigor do inimigo 1', '')
    expect(saveButton()).toBeEnabled()
    const abilities = within(form()).getByRole('group', {
      name: 'Habilidades do inimigo 1',
    })
    fireEvent.click(
      within(abilities).getByRole('button', { name: 'Adicionar' }),
    )
    expect(saveButton()).toBeDisabled()
    type('Nome da habilidade 1 do inimigo 1', 'Golpe')
    type('Texto da habilidade 1 do inimigo 1', 'Causa 2 de dano.')
    expect(saveButton()).toBeEnabled()
  })

  it('REQ-21: "Salvar rascunho" envia os inimigos (vazios viram null, tipos na ordem do glossário)', async () => {
    const bodies = recordBodies()
    await newCombat()
    addEnemy()
    type('Nome do inimigo 1', 'Bandido')
    type('Quantidade do inimigo 1', '3')
    const types = within(form()).getByRole('group', {
      name: 'Tipos do inimigo 1',
    })
    fireEvent.click(within(types).getByLabelText('Morto-vivo'))
    fireEvent.click(within(types).getByLabelText('Humanoide'))
    type('Criatura do inimigo 1', 'Humano')
    fireEvent.change(field('Categoria do inimigo 1'), {
      target: { value: 'elite' },
    })
    fireEvent.change(field('Elemento do inimigo 1'), {
      target: { value: 'fire' },
    })
    type('Vida do inimigo 1', '8')
    type('Defesa do inimigo 1', '2')
    type('Vigor do inimigo 1', '4')
    fireEvent.change(field('Comportamento do inimigo 1'), {
      target: { value: 'defensive' },
    })
    expect(
      within(preview()).getByRole('article', { name: 'Emboscada' }),
    ).toBeInTheDocument()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toEqual({
      slug: 'emboscada',
      type: 'combatEvent',
      title: 'Emboscada',
      flavorText: null,
      enemies: [
        {
          name: 'Bandido',
          flavorText: null,
          count: 3,
          enemyTypes: ['humanoid', 'undead'],
          creature: 'Humano',
          enemyCategory: 'elite',
          element: 'fire',
          health: 8,
          modifiers: {
            attack: 0,
            defense: 2,
            accuracy: 0,
            evasion: 0,
            celerity: 0,
            piercing: 0,
            reflection: 0,
          },
          vigor: 4,
          abilities: [],
          behavior: 'defensive',
        },
      ],
      goodOutcome: { text: 'Vitória.' },
      badOutcome: { text: 'Derrota.' },
      noEscape: false,
    })
  })

  it('REQ-21: lista de inimigos tem "Subir" e "Remover"', async () => {
    renderEditor()
    await openCard('Lobos Uivantes · Evento de combate · Publicada')
    addEnemy()
    type('Nome do inimigo 2', 'Alfa')
    const enemyItems = () =>
      within(
        within(form()).getByRole('group', { name: 'Inimigos' }),
      ).getAllByRole('listitem')
    const ownButton = (item: HTMLElement, name: string) => {
      const buttons = within(item).getAllByRole('button', { name })
      return buttons[buttons.length - 1]
    }
    fireEvent.click(ownButton(enemyItems()[1], 'Subir'))
    expect(field('Nome do inimigo 1')).toHaveValue('Alfa')
    expect(field('Nome do inimigo 2')).toHaveValue('Lobo Cinzento')
    fireEvent.click(ownButton(enemyItems()[0], 'Remover'))
    expect(field('Nome do inimigo 1')).toHaveValue('Lobo Cinzento')
    expect(within(form()).queryByLabelText('Nome do inimigo 2')).toBeNull()
  })

  it('REQ-21: erro dentro de um inimigo aparece no campo do caminho', async () => {
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  {
                    path: 'enemies.0.modifiers.attack',
                    message: 'Use um número inteiro.',
                  },
                  { path: 'enemies.0.enemyTypes', message: 'Escolha um tipo.' },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Lobos Uivantes · Evento de combate · Publicada')
    type('Ataque do inimigo 1', '2.5')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Conteúdo inválido.'),
    )
    expect(field('Ataque do inimigo 1')).toHaveAccessibleDescription(
      'Use um número inteiro.',
    )
    expect(
      within(form()).getByRole('group', { name: 'Tipos do inimigo 1' }),
    ).toHaveAccessibleDescription('Escolha um tipo.')
    expect(field('Ataque do inimigo 1')).toHaveValue('2.5')
  })
})

describe('REQ-23: publicar, duplicar e excluir', () => {
  const publishButton = () =>
    within(form()).getByRole('button', { name: 'Publicar' })
  const duplicateButton = () =>
    within(form()).getByRole('button', { name: 'Duplicar' })
  const deleteButton = () =>
    within(form()).getByRole('button', { name: 'Excluir carta' })

  async function savedDraft(): Promise<void> {
    renderEditor()
    await newCard('Atributo')
    fillForca('forca')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
  }

  it('REQ-23: "Publicar" só fica habilitado num rascunho salvo e sem alterações pendentes', async () => {
    renderEditor()
    await newCard('Atributo')
    expect(publishButton()).toBeDisabled()
    expect(duplicateButton()).toBeDisabled()
    expect(deleteButton()).toBeDisabled()
    fillForca('forca')
    fireEvent.click(saveButton())
    await waitFor(() => expect(publishButton()).toBeEnabled())
    expect(duplicateButton()).toBeEnabled()
    expect(deleteButton()).toBeEnabled()
    type('Nome', 'Mudou')
    expect(publishButton()).toBeDisabled()
  })

  it('REQ-23: carta publicada não tem "Publicar" habilitado', async () => {
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    expect(publishButton()).toBeDisabled()
    expect(duplicateButton()).toBeEnabled()
  })

  it('REQ-23: "Publicar" pede confirmação; "Cancelar" fecha sem publicar', async () => {
    const bodies = recordBodies()
    await savedDraft()
    fireEvent.click(publishButton())
    const dialog = screen.getByRole('dialog', { name: 'Publicar “Força”?' })
    expect(dialog).toHaveTextContent(
      'Depois de publicada, a carta entra no catálogo e nas partidas, e o identificador não pode mais mudar.',
    )
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(bodies.filter((b) => b.url.endsWith('/publish'))).toEqual([])
  })

  it('REQ-23: publicar confirmado passa a "Publicada" e mostra "Carta publicada."', async () => {
    const urls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') urls.push(request.url)
    })
    await savedDraft()
    fireEvent.click(publishButton())
    const dialog = screen.getByRole('dialog', { name: 'Publicar “Força”?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }))
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Carta publicada.'),
    )
    expect(urls).toContain(
      'http://localhost:3000/lab/content/cards/bosque.forca/publish',
    )
    expect(within(form()).getByText('Situação: Publicada'))
    expect(field('Identificador')).toHaveAttribute('readonly')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('REQ-23: CONTENT_INVALID ao publicar mostra os erros e a carta continua em rascunho', async () => {
    server.use(
      http.post(`${cardUrl}/publish`, () =>
        HttpResponse.json(forcaSorteInvalidFixture, { status: 400 }),
      ),
    )
    await savedDraft()
    fireEvent.click(publishButton())
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: 'Publicar “Força”?' }),
      ).getByRole('button', { name: 'Publicar' }),
    )
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Conteúdo inválido.'),
    )
    const attributes = within(form()).getByRole('group', { name: 'Atributos' })
    const text = forcaSorteInvalidFixture.error.details.fields[0].message
    expect(attributes).toHaveAttribute(
      'aria-describedby',
      within(form()).getByText(text).id,
    )
    expect(within(form()).getByText('Situação: Rascunho'))
  })

  it('REQ-23: "Duplicar" abre o rascunho criado pelo backend e mostra "Cópia criada."', async () => {
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    fireEvent.click(duplicateButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Cópia criada.'))
    expect(field('Identificador')).toHaveValue('forca-bruta-copia')
    expect(field('Identificador')).not.toHaveAttribute('readonly')
    expect(field('Nome')).toHaveValue('Força Bruta')
    expect(within(form()).getByText('Situação: Rascunho'))
  })

  it('REQ-23: "Excluir carta" pede confirmação; confirmado, fecha o formulário, consulta a lista e mostra "Carta excluída."', async () => {
    let listCalls = 0
    server.use(
      http.get(cardsUrl, () => {
        listCalls += 1
        return HttpResponse.json(fixtureCardSummariesFixture)
      }),
    )
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    const before = listCalls
    fireEvent.click(deleteButton())
    const dialog = screen.getByRole('dialog', { name: 'Excluir “Força”?' })
    expect(dialog).toHaveTextContent(
      'A carta será apagada. Não dá para desfazer.',
    )
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }),
    ).toHaveFocus()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))
    await waitFor(() =>
      expect(within(cards()).getAllByRole('status')[0]).toHaveTextContent(
        'Carta excluída.',
      ),
    )
    expect(screen.queryByRole('region', { name: 'Carta' })).toBeNull()
    await waitFor(() => expect(listCalls).toBeGreaterThan(before))
  })

  it('REQ-23: "Cancelar" na exclusão não apaga', async () => {
    let deletes = 0
    server.use(
      http.delete(cardUrl, () => {
        deletes += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    fireEvent.click(deleteButton())
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(deletes).toBe(0)
    expect(form()).toBeInTheDocument()
  })

  it('REQ-23: 409 CONTENT_IN_USE mostra a message e nada é apagado', async () => {
    server.use(
      http.delete(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_IN_USE',
              message:
                'Este conteúdo é usado por algum save e não pode ser apagado.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    renderEditor()
    await openCard('Força · Atributo · Publicada')
    fireEvent.click(deleteButton())
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent(
        'Este conteúdo é usado por algum save e não pode ser apagado.',
      ),
    )
    expect(field('Nome')).toHaveValue('Força')
  })
})

describe('REQ-31: Carta de Dimensão e forma das setas', () => {
  it('REQ-31: Carta de Dimensão da lista abre o formulário dela, com a pré-visualização', async () => {
    renderEditor()
    await openCard('Dimensão de Teste · Dimensão · Publicada')
    expect(field('Identificador')).toHaveValue('test-dimension')
    expect(field('Nome')).toHaveValue('Dimensão de Teste')
    expect(field('Texto de ambientação')).toHaveValue('')
    expect(field('Ordem de lançamento')).toHaveValue('1')
    expect(field('Zona de chegada')).toHaveValue('Porto Cinzento')
    expect(
      within(form()).getByRole('group', { name: 'Efeitos' }),
    ).toBeInTheDocument()
    expect(
      within(preview()).getByRole('article', { name: 'Dimensão de Teste' }),
    ).toBeInTheDocument()
  })

  it('REQ-31: Carta de Dimensão nova vai com o número, a zona vazia como null e os efeitos', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Dimensão')
    type('Identificador', 'nova')
    type('Nome', 'Nova Dimensão')
    type('Ordem de lançamento', 'dois')
    expect(saveButton()).toBeDisabled()
    type('Ordem de lançamento', '2')
    expect(saveButton()).toBeEnabled()
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    fireEvent.click(within(effects).getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(within(effects).getByLabelText('Texto do efeito 1'), {
      target: { value: 'Chove sempre.' },
    })
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toEqual({
      slug: 'nova',
      type: 'dimension',
      name: 'Nova Dimensão',
      flavorText: null,
      releaseOrder: 2,
      arrivalZoneTitle: null,
      effects: [
        {
          trigger: null,
          cost: [],
          activation: [],
          duration: { kind: 'immediate' },
          text: 'Chove sempre.',
          polarity: 'positive',
        },
      ],
      rewardDecks: [],
    })
  })

  it('REQ-31: "Forma das setas" vem depois de "Setas de conexão" com as 3 opções e o valor recebido', async () => {
    renderEditor()
    await openCard('Bosque Sussurrante · Zona · Publicada')
    const layout = field('Forma das setas')
    expect(
      field('Setas de conexão').compareDocumentPosition(layout) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      within(layout)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Não se aplica', 'Opostas', 'Vizinhas'])
    expect(layout).toHaveValue('straight')
  })

  it('REQ-31: a forma escolhida vai no corpo; "Não se aplica" vai como null, sem conferir as setas', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Zona')
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
    fireEvent.change(field('Forma das setas'), { target: { value: 'corner' } })
    // 4 setas com "Vizinhas": quem confere é o backend (D-38)
    expect(saveButton()).toBeEnabled()
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({ arrowLayout: 'corner' })
  })

  it('REQ-31: voltar para "Não se aplica" envia arrowLayout null', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Bosque Sussurrante · Zona · Publicada')
    fireEvent.change(field('Forma das setas'), { target: { value: '' } })
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({ arrowLayout: null })
  })
})

describe('REQ-49: ferramentas e decks de recompensas no editor', () => {
  const zoneLabels = [
    'Montanhosa',
    'Florestal',
    'Costeira',
    'Lacustre',
    'Pantanosa',
    'Campestre',
    'Desértica',
    'Vulcânica',
    'Fluvial',
    'Subterrânea',
    'Urbana',
    'Rural',
    'Habitada',
    'Fortificada',
    'Religiosa',
    'Industrial',
  ]
  const follows = (a: Element, b: Element): boolean =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

  it('REQ-49: item mostra, depois de "Efeitos", "Tipo de ferramenta", "Vasculha em" (16 tipos) e "Coletada com" com os valores recebidos', async () => {
    renderEditor()
    await openCard('Vara de Pesca · Item · Publicada')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    const tool = field('Tipo de ferramenta')
    const zones = within(form()).getByRole('group', { name: 'Vasculha em' })
    const collected = field('Coletada com')
    expect(follows(effects, tool)).toBe(true)
    expect(follows(tool, zones)).toBe(true)
    expect(follows(zones, collected)).toBe(true)
    expect(tool).toHaveValue('fishing-rod')
    expect(collected).toHaveValue('')
    const boxes = within(zones).getAllByRole('checkbox')
    expect(boxes.map((b) => b.closest('label')?.textContent)).toEqual(
      zoneLabels,
    )
    expect(
      boxes
        .filter((b) => (b as HTMLInputElement).checked)
        .map((b) => b.closest('label')?.textContent),
    ).toEqual(['Costeira', 'Lacustre', 'Fluvial', 'Urbana'])
  })

  it('REQ-49: item envia ferramenta, tipos na ordem do glossário e "Coletada com"; vazios vão como null', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Peixe Prateado · Item · Publicada')
    expect(field('Coletada com')).toHaveValue('fishing-rod')
    type('Tipo de ferramenta', 'net')
    const zones = within(form()).getByRole('group', { name: 'Vasculha em' })
    fireEvent.click(within(zones).getByLabelText('Urbana'))
    fireEvent.click(within(zones).getByLabelText('Costeira'))
    type('Coletada com', '')
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      toolKind: 'net',
      scavengeZoneTypes: ['coastal', 'urban'],
      scavengeTool: null,
    })
  })

  it('REQ-49: equipamento tem "Coletada com" depois de "Ajuste de preço" e o envia', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Elmo de Ferro · Equipamento · Publicada')
    const collected = field('Coletada com')
    expect(follows(field('Ajuste de preço'), collected)).toBe(true)
    expect(collected).toHaveValue('')
    type('Coletada com', 'pickaxe')
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({ scavengeTool: 'pickaxe' })
  })

  it('REQ-49: Carta de Dimensão mostra "Decks de recompensas" depois de "Efeitos" com os decks recebidos', async () => {
    renderEditor()
    await openCard('Dimensão de Teste · Dimensão · Publicada')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    const decks = within(form()).getByRole('group', {
      name: 'Decks de recompensas',
    })
    expect(follows(effects, decks)).toBe(true)
    expect(within(decks).getByLabelText('Tipo de zona do deck 1')).toHaveValue(
      'urban',
    )
    const cardsGroup = within(decks).getByRole('group', {
      name: 'Cartas do deck 1',
    })
    expect(within(cardsGroup).getByLabelText('Carta 1 do deck 1')).toHaveValue(
      'fixture.silver-fish',
    )
    expect(
      within(cardsGroup).getByLabelText('Cópias da carta 3 do deck 1'),
    ).toHaveValue('2')
  })

  it('REQ-49: decks e cartas novos exigem tipo, id e cópias em formato e vão no corpo', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Dimensão')
    type('Identificador', 'nova')
    type('Nome', 'Nova Dimensão')
    type('Ordem de lançamento', '2')
    const decks = within(form()).getByRole('group', {
      name: 'Decks de recompensas',
    })
    fireEvent.click(
      within(decks).getAllByRole('button', { name: 'Adicionar' }).at(-1)!,
    )
    expect(saveButton()).toBeDisabled()
    fireEvent.change(within(decks).getByLabelText('Tipo de zona do deck 1'), {
      target: { value: 'coastal' },
    })
    const cardsGroup = within(decks).getByRole('group', {
      name: 'Cartas do deck 1',
    })
    fireEvent.click(
      within(cardsGroup).getByRole('button', { name: 'Adicionar' }),
    )
    fireEvent.change(within(cardsGroup).getByLabelText('Carta 1 do deck 1'), {
      target: { value: 'fixture.silver-fish' },
    })
    fireEvent.change(
      within(cardsGroup).getByLabelText('Cópias da carta 1 do deck 1'),
      { target: { value: 'três' } },
    )
    expect(saveButton()).toBeDisabled()
    fireEvent.change(
      within(cardsGroup).getByLabelText('Cópias da carta 1 do deck 1'),
      { target: { value: '3' } },
    )
    expect(saveButton()).toBeEnabled()
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      rewardDecks: [
        {
          zoneType: 'coastal',
          cards: [{ cardId: 'fixture.silver-fish', copies: 3 }],
        },
      ],
    })
  })

  it('REQ-49: erros pelo caminho vão para o tipo do deck e as cópias da carta', async () => {
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  {
                    path: 'rewardDecks.0.cards.1.copies',
                    message: 'Cópias inválidas.',
                  },
                  {
                    path: 'rewardDecks.0.zoneType',
                    message: 'Tipo repetido.',
                  },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Dimensão de Teste · Dimensão · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Cópias da carta 2 do deck 1')).toHaveAccessibleDescription(
        'Cópias inválidas.',
      ),
    )
    expect(field('Tipo de zona do deck 1')).toHaveAccessibleDescription(
      'Tipo repetido.',
    )
  })

  it('REQ-49: erros de "toolKind" e "scavengeZoneTypes" aparecem nos campos do item', async () => {
    server.use(
      http.put(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: {
                fields: [
                  { path: 'toolKind', message: 'Use kebab-case.' },
                  {
                    path: 'scavengeZoneTypes',
                    message: 'Ferramenta sem tipo de zona.',
                  },
                ],
              },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderEditor()
    await openCard('Vara de Pesca · Item · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Tipo de ferramenta')).toHaveAccessibleDescription(
        'Use kebab-case.',
      ),
    )
    expect(
      within(form()).getByRole('group', { name: 'Vasculha em' }),
    ).toHaveAccessibleDescription('Ferramenta sem tipo de zona.')
  })

  it('REQ-49: a pré-visualização acompanha a ferramenta (REQ-48)', async () => {
    renderEditor()
    await openCard('Vara de Pesca · Item · Publicada')
    expect(
      within(preview()).getByText('Ferramenta: fishing-rod'),
    ).toBeInTheDocument()
    type('Tipo de ferramenta', 'net')
    expect(within(preview()).getByText('Ferramenta: net')).toBeInTheDocument()
  })
})

it('REQ-56: links MSW publication rejection to the legacy card reference in the zone deck', async () => {
  renderEditor()
  await openCard('Dimensão com evento legado · Dimensão · Rascunho')
  fireEvent.click(within(form()).getByRole('button', { name: 'Publicar' }))
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Publicar',
    }),
  )
  const reference = within(
    within(form()).getByRole('group', { name: 'Decks de eventos' }),
  ).getByLabelText('Carta 1 do deck 1 de eventos')
  await waitFor(() =>
    expect(reference).toHaveAccessibleDescription(
      'Use um evento aleatório com regras executáveis.',
    ),
  )
  expect(reference).toHaveValue('fixture.wounded-traveler')
  expect(within(form()).getByText('Situação: Rascunho')).toBeVisible()
})
