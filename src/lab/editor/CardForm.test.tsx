import { executableCombatCardFixture } from '../../mocks/combatFixtures'
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
import { circulationDimension } from '../../mocks/collectionCirculationFixtures'
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
          priceMultiplier: 1,
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
      market: null,
      blacksmith: null,
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
    // FEAT-17 (T-76): materiais em lista e Lâmina sem encantamento.
    expect(field('Encantamento')).not.toBeChecked()
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

  it('REQ-21: "Refino" ligado mostra "Nível máximo" e o exige; desligado, não aparece', async () => {
    await newEquipment()
    fillEspada()
    expect(within(form()).queryByLabelText('Nível máximo')).toBeNull()
    fireEvent.click(field('Refino'))
    expect(saveButton()).toBeDisabled()
    type('Nível máximo', '3')
    expect(saveButton()).toBeEnabled()
    type('Nível máximo', 'três')
    expect(saveButton()).toBeDisabled()
    fireEvent.click(field('Refino'))
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
    fireEvent.click(field('Encantamento'))
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
      refinement: { maxLevel: 3, materials: [] },
      enchantment: { slots: [] },
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
      completionItem: false,
      name: 'Poção',
      flavorText: null,
      rarity: 'common',
      itemCategory: 'consumable',
      tags: [],
      effects: [],
      toolKind: null,
      scavengeZoneTypes: [],
      scavengeTool: null,
      priceMultiplier: 1,
      stockPrice: null,
      stockQuantity: 1,
      boosterCollectionId: null,
      recipe: null,
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
  it('REQ-97: edita, reordena e reabre as listas salvas, destacando a referência inválida', async () => {
    let card = {
      ...circulationDimension,
      id: 'fixture.test-dimension',
      collectionId: 'fixture',
    }
    let saved: unknown
    let reject = true
    server.use(
      http.get('*/lab/content/cards/fixture.test-dimension', () =>
        HttpResponse.json({ status: 'published', card }),
      ),
      http.put(
        '*/lab/content/cards/fixture.test-dimension',
        async ({ request }) => {
          saved = await request.json()
          if (reject) {
            return HttpResponse.json(
              {
                error: {
                  code: 'CONTENT_INVALID',
                  message: 'Referência inválida.',
                  details: {
                    fields: [
                      {
                        path: 'reprintCollectionIds.0',
                        message: 'Coleção própria.',
                      },
                    ],
                  },
                },
              },
              { status: 400 },
            )
          }
          card = { ...card, ...(saved as typeof card) }
          return HttpResponse.json({ status: 'published', card })
        },
      ),
    )
    renderEditor()
    const dimensionName = 'Dimensão de Teste · Dimensão · Publicada'
    await openCard(dimensionName)
    const extended = within(
      within(form()).getByRole('group', { name: 'Coleções estendidas' }),
    )
    expect(
      extended.getByRole('textbox', { name: 'ID da coleção 1' }),
    ).toHaveValue(circulationDimension.extendedCollectionIds[0])
    fireEvent.click(extended.getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(
      extended.getByRole('textbox', { name: 'ID da coleção 2' }),
      {
        target: { value: 'older' },
      },
    )
    fireEvent.click(extended.getAllByRole('button', { name: 'Subir' })[1])
    fireEvent.click(saveButton())
    const reprint = within(
      within(form()).getByRole('group', { name: 'Reprints' }),
    )
    await reprint.findByText('Coleção própria.')
    expect(reprint.getByRole('textbox')).toHaveAccessibleDescription(
      'Coleção própria.',
    )
    reject = false
    fireEvent.change(reprint.getByRole('textbox'), {
      target: { value: 'another' },
    })
    fireEvent.click(saveButton())
    await waitFor(() => expect(formStatus()).toHaveTextContent('Carta salva.'))
    expect(saved).toMatchObject({
      extendedCollectionIds: [
        'older',
        ...circulationDimension.extendedCollectionIds,
      ],
      reprintCollectionIds: ['another'],
    })
    fireEvent.click(
      within(cards()).getByRole('button', {
        name: 'Força · Atributo · Publicada',
      }),
    )
    await waitFor(() => expect(field('Nome')).toHaveValue('Força'))
    await openCard(dimensionName)
    expect(
      within(within(form()).getByRole('group', { name: 'Coleções estendidas' }))
        .getAllByRole('textbox')
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(['older', ...circulationDimension.extendedCollectionIds])
    expect(
      within(within(form()).getByRole('group', { name: 'Reprints' })).getByRole(
        'textbox',
      ),
    ).toHaveValue('another')
  })

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
      completion: null,
      name: 'Nova Dimensão',
      flavorText: null,
      releaseOrder: 2,
      arrivalZoneTitle: null,
      extendedCollectionIds: [],
      reprintCollectionIds: [],
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

it('REQ-60: sends executable combat content and links an indexed MSW refusal', async () => {
  const card = { ...executableCombatCardFixture, id: 'fixture.howling-wolves' }
  const sent = vi.fn()
  server.use(
    http.get(cardUrl, () => HttpResponse.json({ card, status: 'published' })),
    http.put(cardUrl, async ({ request }) => {
      sent(await request.json())
      return HttpResponse.json(
        {
          error: {
            code: 'CONTENT_INVALID',
            message: 'Conteúdo inválido.',
            details: {
              fields: [
                {
                  path: 'enemies.0.abilities.0.channel.chargesRequired',
                  message: 'Número de cargas inválido.',
                },
              ],
            },
          },
        },
        { status: 400 },
      )
    }),
  )
  renderEditor()
  await openCard('Lobos Uivantes · Evento de combate · Publicada')
  const label = 'Dados executáveis da habilidade 1 do inimigo 1 (JSON)'
  const original = JSON.parse((field(label) as HTMLTextAreaElement).value)
  const draft = JSON.stringify({
    ...original,
    form: 'channeled',
    channel: { chargesRequired: 0, releaseForm: 'targeted' },
  })
  type(label, draft)
  fireEvent.click(saveButton())
  await waitFor(() =>
    expect(field(label)).toHaveAccessibleDescription(
      'Número de cargas inválido.',
    ),
  )
  expect(field(label)).toHaveValue(draft)
  expect(sent).toHaveBeenCalledWith(
    expect.objectContaining({
      escapeThreshold: 0,
      goodOutcome: card.goodOutcome,
      badOutcome: card.badOutcome,
      enemies: [
        expect.objectContaining({
          abilities: [
            { ...card.enemies[0].abilities[0], ...JSON.parse(draft) },
          ],
        }),
      ],
    }),
  )
})

it('REQ-70 opens a zone quest draft with editable stages', async () => {
  renderEditor()
  await newCard('Missão de zona')
  type('Identificador', 'help-at-the-port-ui')
  type('Título', 'Ajuda no Porto')
  type('Resumo', 'Socorra o viajante')
  const stages = screen.getByRole('group', { name: 'Etapas da missão' })
  fireEvent.click(within(stages).getByRole('button', { name: 'Adicionar' }))
  type('Tipo de etapa', 'randomEvent')
  type('Texto da etapa', 'Ajude o viajante')
  type('Identificar destino por', 'zoneTitle')
  type('Título da zona de destino', 'Porto')
  type('ID do evento da coleção', 'fixture.road-ambush')
  fireEvent.click(saveButton())
  const error = await screen.findByText(
    /deve ser um evento aleatório executável/,
  )
  expect(field('ID do evento da coleção')).toHaveAccessibleDescription(
    error.textContent,
  )
  type('ID do evento da coleção', 'fixture.wounded-traveler')
  fireEvent.click(saveButton())
  await waitFor(() => expect(formStatus()).toHaveTextContent(/salv/i))
})

describe('REQ-72: campos do mercado no editor', () => {
  const group = (name: string) => within(form()).getByRole('group', { name })

  function rejectWith(
    method: 'post' | 'put',
    fields: { path: string; message: string }[],
  ): void {
    server.use(
      http[method](method === 'post' ? cardsUrl : cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields },
            },
          },
          { status: 400 },
        ),
      ),
    )
  }

  function fillPraca(): void {
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
  }

  function fillPocao(): void {
    type('Identificador', 'pocao')
    type('Nome', 'Poção')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.change(field('Categoria'), { target: { value: 'consumable' } })
  }

  it('REQ-72: atributo novo começa com "Ajuste de preço" 1, exige número e envia o corpo', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Atributo')
    expect(field('Ajuste de preço')).toHaveValue('1')
    fillForca('forca')
    expect(saveButton()).toBeEnabled()
    type('Ajuste de preço', 'caro')
    expect(saveButton()).toBeDisabled()
    type('Ajuste de preço', '1.2')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toMatchObject({
      type: 'attribute',
      priceMultiplier: 1.2,
    })
  })

  it('REQ-72: item novo tem preço, "Preço de estoque" vazio, "Lote" 1 e coleção "Nenhuma"', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Item')
    expect(field('Ajuste de preço')).toHaveValue('1')
    expect(field('Preço de estoque')).toHaveValue('')
    expect(field('Lote')).toHaveValue('1')
    expect(field('Coleção do booster')).toHaveValue('')
    await waitFor(() =>
      expect(
        within(field('Coleção do booster'))
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Nenhuma', 'Coleção de Teste']),
    )
    fillPocao()
    expect(saveButton()).toBeEnabled()
    type('Preço de estoque', 'muito')
    expect(saveButton()).toBeDisabled()
    type('Preço de estoque', '6')
    type('Lote', '10')
    type('Ajuste de preço', '0.9')
    fireEvent.change(field('Coleção do booster'), {
      target: { value: 'fixture' },
    })
    expect(saveButton()).toBeEnabled()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toMatchObject({
      type: 'item',
      priceMultiplier: 0.9,
      stockPrice: 6,
      stockQuantity: 10,
      boosterCollectionId: 'fixture',
    })
  })

  it('REQ-72: item sem estoque nem coleção envia stockPrice e boosterCollectionId null', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Item')
    fillPocao()
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toMatchObject({
      priceMultiplier: 1,
      stockPrice: null,
      stockQuantity: 1,
      boosterCollectionId: null,
    })
  })

  it('REQ-72: item existente abre com os valores do mercado e salvar não os apaga', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Flechas · Item · Publicada')
    expect(field('Preço de estoque')).toHaveValue('3')
    expect(field('Lote')).toHaveValue('10')
    type('Nome', 'Flechas longas')
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      stockPrice: 3,
      stockQuantity: 10,
      priceMultiplier: 1,
    })
  })

  it('REQ-72: zona nova não tem mercado; "Tem mercado" mostra "Estoque" e "Vende singles"', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Zona')
    expect(field('Tem mercado')).not.toBeChecked()
    expect(
      within(group('Mercado')).queryByRole('group', { name: 'Estoque' }),
    ).toBeNull()
    expect(
      within(group('Mercado')).queryByLabelText('Vende singles'),
    ).toBeNull()
    fillPraca()
    fireEvent.click(field('Tem mercado'))
    const stock = within(group('Mercado')).getByRole('group', {
      name: 'Estoque',
    })
    fireEvent.click(within(stock).getByRole('button', { name: 'Adicionar' }))
    fireEvent.click(within(stock).getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(within(stock).getByLabelText('Carta 1'), {
      target: { value: 'fixture.healing-potion' },
    })
    fireEvent.change(within(stock).getByLabelText('Carta 2'), {
      target: { value: 'fixture.arrows' },
    })
    fireEvent.click(field('Vende singles'))
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toMatchObject({
      type: 'zone',
      market: {
        stock: ['fixture.healing-potion', 'fixture.arrows'],
        singles: true,
      },
    })
  })

  it('REQ-72: desmarcar "Tem mercado" envia market null', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Porto Cinzento · Zona · Publicada')
    expect(field('Tem mercado')).toBeChecked()
    expect(field('Vende singles')).toBeChecked()
    fireEvent.click(field('Tem mercado'))
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({ market: null })
  })

  it('REQ-72: zona sem mercado envia market null', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Zona')
    fillPraca()
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({ market: null })
  })

  it('REQ-72: erro CONTENT_INVALID em market.stock.1 aparece no segundo item do estoque', async () => {
    rejectWith('put', [
      { path: 'market.stock.1', message: 'Carta fora da coleção.' },
    ])
    renderEditor()
    await openCard('Porto Cinzento · Zona · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Carta 2')).toHaveAccessibleDescription(
        'Carta fora da coleção.',
      ),
    )
  })

  it('REQ-72: erro CONTENT_INVALID em stockQuantity aparece abaixo de "Lote"', async () => {
    rejectWith('put', [
      { path: 'stockQuantity', message: 'O lote deve ser inteiro.' },
    ])
    renderEditor()
    await openCard('Flechas · Item · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(field('Lote')).toHaveAccessibleDescription(
        'O lote deve ser inteiro.',
      ),
    )
  })
})

describe('REQ-78: campos do ferreiro no editor', () => {
  const group = (name: string) => within(form()).getByRole('group', { name })

  function rejectWith(
    method: 'post' | 'put',
    fields: { path: string; message: string }[],
  ): void {
    server.use(
      http[method](method === 'post' ? cardsUrl : cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields },
            },
          },
          { status: 400 },
        ),
      ),
    )
  }

  function fillEspada(): void {
    type('Identificador', 'espada')
    type('Nome', 'Espada')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.change(field('Slot'), { target: { value: 'weapon' } })
  }

  function fillPraca(): void {
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
  }

  function fillPocao(): void {
    type('Identificador', 'pocao')
    type('Nome', 'Poção')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.change(field('Categoria'), { target: { value: 'consumable' } })
  }

  const add = (list: HTMLElement) =>
    fireEvent.click(within(list).getByRole('button', { name: 'Adicionar' }))

  describe('equipamento: "Materiais" do "Refino" e "Slots" do "Encantamento"', () => {
    it('REQ-78: equipamento refinável abre com os materiais e os slots, e salvar não os apaga', async () => {
      const bodies = recordBodies()
      renderEditor()
      await openCard('Espada Curta · Equipamento · Publicada')
      expect(field('Refino')).toBeChecked()
      expect(field('Nível máximo')).toHaveValue('10')
      const materials = group('Materiais')
      expect(within(materials).getByLabelText('Material 1')).toHaveValue(
        'fixture.iron-ore',
      )
      expect(within(materials).getByLabelText('Quantidade 1')).toHaveValue('1')
      expect(field('Encantamento')).toBeChecked()
      const slots = group('Slots')
      expect(within(slots).getByLabelText('Tipo 1')).toHaveValue('element')
      expect(within(slots).getByLabelText('Refino mínimo 1')).toHaveValue('2')
      expect(screen.queryByLabelText('Texto do encantamento')).toBeNull()
      type('Nome', 'Espada Curta Boa')
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({
        refinement: {
          maxLevel: 10,
          materials: [{ cardId: 'fixture.iron-ore', quantity: 1 }],
        },
        enchantment: { slots: [{ kind: 'element', minRefinement: 2 }] },
      })
    })

    it('REQ-78: "Materiais" e "Slots" só aparecem com "Refino" e "Encantamento" ligados; o corpo leva números e a ordem da lista', async () => {
      const bodies = recordBodies()
      renderEditor()
      await newCard('Equipamento')
      fillEspada()
      expect(
        within(form()).queryByRole('group', { name: 'Materiais' }),
      ).toBeNull()
      expect(within(form()).queryByRole('group', { name: 'Slots' })).toBeNull()

      fireEvent.click(field('Refino'))
      type('Nível máximo', '3')
      const materials = group('Materiais')
      add(materials)
      add(materials)
      fireEvent.change(within(materials).getByLabelText('Material 1'), {
        target: { value: 'fixture.iron-ore' },
      })
      fireEvent.change(within(materials).getByLabelText('Quantidade 1'), {
        target: { value: '2' },
      })
      fireEvent.change(within(materials).getByLabelText('Material 2'), {
        target: { value: 'fixture.ember-shard' },
      })
      fireEvent.change(within(materials).getByLabelText('Quantidade 2'), {
        target: { value: '1' },
      })
      fireEvent.click(
        within(within(materials).getAllByRole('listitem')[1]).getByRole(
          'button',
          { name: 'Subir' },
        ),
      )
      expect(within(materials).getByLabelText('Material 1')).toHaveValue(
        'fixture.ember-shard',
      )

      fireEvent.click(field('Encantamento'))
      const slots = group('Slots')
      add(slots)
      add(slots)
      fireEvent.change(within(slots).getByLabelText('Tipo 1'), {
        target: { value: 'element' },
      })
      fireEvent.change(within(slots).getByLabelText('Refino mínimo 1'), {
        target: { value: '2' },
      })
      fireEvent.change(within(slots).getByLabelText('Tipo 2'), {
        target: { value: 'effect' },
      })
      fireEvent.change(within(slots).getByLabelText('Refino mínimo 2'), {
        target: { value: '0' },
      })
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
      )
      expect(bodies[0].body).toMatchObject({
        refinement: {
          maxLevel: 3,
          materials: [
            { cardId: 'fixture.ember-shard', quantity: 1 },
            { cardId: 'fixture.iron-ore', quantity: 2 },
          ],
        },
        enchantment: {
          slots: [
            { kind: 'element', minRefinement: 2 },
            { kind: 'effect', minRefinement: 0 },
          ],
        },
      })
    })

    it('REQ-78: material sem id ou quantidade, slot sem tipo ou refino não numérico desabilitam "Salvar rascunho"', async () => {
      renderEditor()
      await newCard('Equipamento')
      fillEspada()
      expect(saveButton()).toBeEnabled()
      fireEvent.click(field('Refino'))
      type('Nível máximo', '3')
      add(group('Materiais'))
      expect(saveButton()).toBeDisabled()
      const materials = group('Materiais')
      fireEvent.change(within(materials).getByLabelText('Material 1'), {
        target: { value: 'fixture.iron-ore' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(materials).getByLabelText('Quantidade 1'), {
        target: { value: 'duas' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(materials).getByLabelText('Quantidade 1'), {
        target: { value: '2' },
      })
      expect(saveButton()).toBeEnabled()

      fireEvent.click(field('Encantamento'))
      add(group('Slots'))
      expect(saveButton()).toBeDisabled()
      const slots = group('Slots')
      fireEvent.change(within(slots).getByLabelText('Tipo 1'), {
        target: { value: 'element' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(slots).getByLabelText('Refino mínimo 1'), {
        target: { value: '0' },
      })
      expect(saveButton()).toBeEnabled()
    })

    it('REQ-78: erros em refinement.materials e enchantment.slots.0.minRefinement aparecem nos campos', async () => {
      rejectWith('put', [
        { path: 'refinement.materials', message: 'Defina os materiais.' },
        {
          path: 'enchantment.slots.0.minRefinement',
          message: 'O refino mínimo passa do máximo.',
        },
      ])
      renderEditor()
      await openCard('Espada Curta · Equipamento · Publicada')
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(group('Materiais')).toHaveAccessibleDescription(
          'Defina os materiais.',
        ),
      )
      expect(
        within(group('Slots')).getByLabelText('Refino mínimo 1'),
      ).toHaveAccessibleDescription('O refino mínimo passa do máximo.')
    })
  })

  describe('item: "Receita"', () => {
    it('REQ-78: documento com receita abre com os campos preenchidos e salvar não os apaga', async () => {
      const bodies = recordBodies()
      renderEditor()
      await openCard('Projeto: Espada Curta · Item · Publicada')
      expect(field('Receita')).toBeChecked()
      expect(field('Equipamento criado')).toHaveValue('fixture.short-sword')
      const materials = group('Materiais')
      expect(within(materials).getByLabelText('Material 1')).toHaveValue(
        'fixture.iron-ore',
      )
      expect(within(materials).getByLabelText('Quantidade 1')).toHaveValue('2')
      expect(field('Ouro')).toHaveValue('15')
      expect(field('Consumida ao criar')).not.toBeChecked()
      fireEvent.click(field('Consumida ao criar'))
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({
        recipe: {
          equipmentId: 'fixture.short-sword',
          materials: [{ cardId: 'fixture.iron-ore', quantity: 2 }],
          gold: 15,
          consumed: true,
        },
      })
    })

    it('REQ-78: desligar "Receita" envia recipe null e esconde os campos', async () => {
      const bodies = recordBodies()
      renderEditor()
      await openCard('Projeto: Espada Curta · Item · Publicada')
      fireEvent.click(field('Receita'))
      expect(screen.queryByLabelText('Equipamento criado')).toBeNull()
      expect(screen.queryByLabelText('Consumida ao criar')).toBeNull()
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({ recipe: null })
    })

    it('REQ-78: item novo não tem receita; ligada, exige "Equipamento criado" e "Ouro" e envia números', async () => {
      const bodies = recordBodies()
      renderEditor()
      await newCard('Item')
      fillPocao()
      expect(field('Receita')).not.toBeChecked()
      expect(screen.queryByLabelText('Equipamento criado')).toBeNull()
      expect(saveButton()).toBeEnabled()
      fireEvent.click(field('Receita'))
      expect(saveButton()).toBeDisabled()
      type('Equipamento criado', 'fixture.short-sword')
      expect(saveButton()).toBeDisabled()
      type('Ouro', 'muito')
      expect(saveButton()).toBeDisabled()
      type('Ouro', '0')
      expect(saveButton()).toBeEnabled()
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
      )
      expect(bodies[0].body).toMatchObject({
        recipe: {
          equipmentId: 'fixture.short-sword',
          materials: [],
          gold: 0,
          consumed: false,
        },
      })
    })

    it('REQ-78: item sem receita envia recipe null', async () => {
      const bodies = recordBodies()
      renderEditor()
      await newCard('Item')
      fillPocao()
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({ recipe: null })
    })

    it('REQ-78: erros em recipe e recipe.equipmentId aparecem nos campos', async () => {
      rejectWith('put', [
        { path: 'recipe', message: 'Só documentos têm receita.' },
        { path: 'recipe.equipmentId', message: 'Equipamento inexistente.' },
      ])
      renderEditor()
      await openCard('Projeto: Espada Curta · Item · Publicada')
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(field('Equipamento criado')).toHaveAccessibleDescription(
          'Equipamento inexistente.',
        ),
      )
      expect(field('Receita')).toHaveAccessibleDescription(
        'Só documentos têm receita.',
      )
    })
  })

  describe('zona: "Ferreiro"', () => {
    const enchantment = (n: number) =>
      within(group('Encantamentos')).getByRole('group', {
        name: `Encantamento ${n}`,
      })

    it('REQ-78: zona com ferreiro abre com o encantamento de elemento e salvar não o apaga', async () => {
      const bodies = recordBodies()
      renderEditor()
      await openCard('Porto Cinzento · Zona · Publicada')
      expect(field('Tem ferreiro')).toBeChecked()
      const first = enchantment(1)
      expect(
        within(first).getByLabelText('Identificador do encantamento 1'),
      ).toHaveValue('ember-edge')
      expect(within(first).getByLabelText('Nome')).toHaveValue('Fio de Brasa')
      expect(within(first).getByLabelText('Tipo')).toHaveValue('element')
      expect(within(first).getByLabelText('Elemento')).toHaveValue('fire')
      expect(within(first).getByLabelText('Bônus (%)')).toHaveValue('10')
      const materials = within(first).getByRole('group', { name: 'Materiais' })
      expect(within(materials).getByLabelText('Material 1')).toHaveValue(
        'fixture.ember-shard',
      )
      expect(within(materials).getByLabelText('Quantidade 1')).toHaveValue('1')
      expect(within(first).queryByRole('group', { name: 'Efeitos' })).toBeNull()
      expect(
        within(first).queryByRole('group', { name: 'Habilidades' }),
      ).toBeNull()
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({
        blacksmith: {
          enchantments: [
            {
              id: 'ember-edge',
              name: 'Fio de Brasa',
              kind: 'element',
              element: 'fire',
              bonusPercent: 10,
              materials: [{ cardId: 'fixture.ember-shard', quantity: 1 }],
            },
          ],
        },
      })
    })

    it('REQ-78: desmarcar "Tem ferreiro" envia blacksmith null e esconde "Encantamentos"', async () => {
      const bodies = recordBodies()
      renderEditor()
      await openCard('Porto Cinzento · Zona · Publicada')
      fireEvent.click(field('Tem ferreiro'))
      expect(
        within(form()).queryByRole('group', { name: 'Encantamentos' }),
      ).toBeNull()
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({ blacksmith: null })
    })

    it('REQ-78: zona nova sem ferreiro envia blacksmith null', async () => {
      const bodies = recordBodies()
      renderEditor()
      await newCard('Zona')
      expect(field('Tem ferreiro')).not.toBeChecked()
      fillPraca()
      fireEvent.click(saveButton())
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0].body).toMatchObject({ blacksmith: null })
    })

    it('REQ-78: encantamento de efeito mostra "Efeitos", "Habilidades" e "Materiais" no lugar de "Elemento" e "Bônus (%)"', async () => {
      const bodies = recordBodies()
      renderEditor()
      await newCard('Zona')
      fillPraca()
      fireEvent.click(field('Tem ferreiro'))
      add(group('Encantamentos'))
      const first = enchantment(1)
      expect(within(first).getByLabelText('Tipo')).toHaveValue('element')
      expect(within(first).getByLabelText('Elemento')).toBeVisible()
      expect(within(first).getByLabelText('Bônus (%)')).toBeVisible()
      fireEvent.change(within(first).getByLabelText('Tipo'), {
        target: { value: 'effect' },
      })
      expect(within(first).queryByLabelText('Elemento')).toBeNull()
      expect(within(first).queryByLabelText('Bônus (%)')).toBeNull()
      fireEvent.change(
        within(first).getByLabelText('Identificador do encantamento 1'),
        {
          target: { value: 'whisper' },
        },
      )
      fireEvent.change(within(first).getByLabelText('Nome'), {
        target: { value: 'Sussurro' },
      })
      add(within(first).getByRole('group', { name: 'Efeitos' }))
      fireEvent.change(within(first).getByLabelText('Texto do efeito 1'), {
        target: { value: 'Chamas lambem a lâmina.' },
      })
      add(within(first).getByRole('group', { name: 'Habilidades' }))
      fireEvent.change(within(first).getByLabelText('Nome da habilidade 1'), {
        target: { value: 'Brasa' },
      })
      fireEvent.change(within(first).getByLabelText('Texto da habilidade 1'), {
        target: { value: 'Queima o alvo.' },
      })
      const materials = within(first).getByRole('group', { name: 'Materiais' })
      add(materials)
      fireEvent.change(within(materials).getByLabelText('Material 1'), {
        target: { value: 'fixture.ember-shard' },
      })
      fireEvent.change(within(materials).getByLabelText('Quantidade 1'), {
        target: { value: '3' },
      })
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
      )
      expect(bodies[0].body).toMatchObject({
        blacksmith: {
          enchantments: [
            {
              id: 'whisper',
              name: 'Sussurro',
              kind: 'effect',
              effects: [
                {
                  text: 'Chamas lambem a lâmina.',
                  trigger: null,
                  cost: [],
                  activation: [],
                  duration: { kind: 'immediate' },
                  mark: null,
                },
              ],
              abilities: [{ name: 'Brasa', text: 'Queima o alvo.' }],
              materials: [{ cardId: 'fixture.ember-shard', quantity: 3 }],
            },
          ],
        },
      })
      expect(
        (bodies[0].body as { blacksmith: { enchantments: object[] } })
          .blacksmith.enchantments[0],
      ).not.toHaveProperty('element')
    })

    it('REQ-78: identificador, nome, elemento ou bônus faltando desabilitam "Salvar rascunho"', async () => {
      renderEditor()
      await newCard('Zona')
      fillPraca()
      fireEvent.click(field('Tem ferreiro'))
      expect(saveButton()).toBeEnabled()
      add(group('Encantamentos'))
      const first = enchantment(1)
      expect(saveButton()).toBeDisabled()
      fireEvent.change(
        within(first).getByLabelText('Identificador do encantamento 1'),
        {
          target: { value: 'ember-edge' },
        },
      )
      fireEvent.change(within(first).getByLabelText('Nome'), {
        target: { value: 'Fio de Brasa' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(first).getByLabelText('Elemento'), {
        target: { value: 'fire' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(first).getByLabelText('Bônus (%)'), {
        target: { value: 'dez' },
      })
      expect(saveButton()).toBeDisabled()
      fireEvent.change(within(first).getByLabelText('Bônus (%)'), {
        target: { value: '10' },
      })
      expect(saveButton()).toBeEnabled()
    })

    it('REQ-78: erros em blacksmith e blacksmith.enchantments.0.id aparecem nos campos', async () => {
      rejectWith('put', [
        { path: 'blacksmith', message: 'A zona precisa de visitBlacksmith.' },
        {
          path: 'blacksmith.enchantments.0.id',
          message: 'Identificador repetido.',
        },
      ])
      renderEditor()
      await openCard('Porto Cinzento · Zona · Publicada')
      fireEvent.click(saveButton())
      await waitFor(() =>
        expect(
          within(enchantment(1)).getByLabelText(
            'Identificador do encantamento 1',
          ),
        ).toHaveAccessibleDescription('Identificador repetido.'),
      )
      expect(field('Tem ferreiro')).toHaveAccessibleDescription(
        'A zona precisa de visitBlacksmith.',
      )
    })
  })
})

describe('REQ-83: montaria no editor', () => {
  const group = (name: string) => within(form()).getByRole('group', { name })

  function rejectWith(
    method: 'post' | 'put',
    fields: { path: string; message: string }[],
  ): void {
    server.use(
      http[method](method === 'post' ? cardsUrl : cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_INVALID',
              message: 'Conteúdo inválido.',
              details: { fields },
            },
          },
          { status: 400 },
        ),
      ),
    )
  }

  it('REQ-83: "Nova carta" oferece "Montaria", com Raridade, Tipos, Criatura, Efeitos e Habilidades; salvar envia o corpo', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Montaria')
    expect(field('Raridade')).toHaveValue('')
    const types = group('Tipos')
    expect(
      within(types)
        .getAllByRole('checkbox')
        .map((c) => c.closest('label')?.textContent),
    ).toEqual([
      'Fera',
      'Humanoide',
      'Morto-vivo',
      'Espírito',
      'Demônio',
      'Celestial',
      'Elemental',
      'Constructo',
      'Dracônico',
      'Aberração',
      'Planta',
    ])
    expect(field('Criatura')).toHaveValue('')
    expect(group('Efeitos')).toBeInTheDocument()
    expect(group('Habilidades')).toBeInTheDocument()

    type('Identificador', 'ponei')
    type('Nome', 'Pônei')
    fireEvent.change(field('Raridade'), { target: { value: 'common' } })
    fireEvent.click(within(types).getByLabelText('Morto-vivo'))
    fireEvent.click(within(types).getByLabelText('Fera'))
    type('Criatura', 'Pônei')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent('Rascunho salvo.'),
    )
    expect(bodies[0].body).toEqual({
      slug: 'ponei',
      type: 'mount',
      name: 'Pônei',
      flavorText: null,
      rarity: 'common',
      mountTypes: ['beast', 'undead'],
      creature: 'Pônei',
      effects: [],
      abilities: [],
    })
  })

  it('REQ-83: montaria existente abre com os valores, a pré-visualização usa a carta do catálogo e salvar não os apaga', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Pônei de Guerra · Montaria · Publicada')
    expect(field('Nome')).toHaveValue('Pônei de Guerra')
    expect(field('Raridade')).toHaveValue('common')
    expect(within(group('Tipos')).getByLabelText('Fera')).toBeChecked()
    expect(field('Criatura')).toHaveValue('Pônei')
    expect(field('Texto do efeito 1')).toHaveValue('Ganha 2 de ouro.')
    expect(field('Nome da habilidade 1')).toHaveValue('Trote')
    const card = within(preview()).getByRole('article', {
      name: 'Pônei de Guerra',
    })
    expect(within(card).getByText('Montaria')).toBeVisible()
    expect(within(card).getByText('Tipos: Fera')).toBeVisible()
    expect(within(card).getByText('Criatura: Pônei')).toBeVisible()

    type('Criatura', 'Pônei velho')
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      type: 'mount',
      mountTypes: ['beast'],
      creature: 'Pônei velho',
      effects: [{ text: 'Ganha 2 de ouro.' }],
      abilities: [{ id: 'pony-trot', name: 'Trote' }],
    })
  })

  it('REQ-83: erros CONTENT_INVALID em mountTypes e creature aparecem nos campos', async () => {
    rejectWith('put', [
      { path: 'mountTypes', message: 'Escolha ao menos um tipo.' },
      { path: 'creature', message: 'Informe a criatura.' },
    ])
    renderEditor()
    await openCard('Pônei de Guerra · Montaria · Publicada')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(group('Tipos')).toHaveAccessibleDescription(
        'Escolha ao menos um tipo.',
      ),
    )
    expect(field('Criatura')).toHaveAccessibleDescription('Informe a criatura.')
  })

  it('REQ-83: CONTENT_REFERENCED ao excluir mostra a message recebida', async () => {
    server.use(
      http.delete(cardUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'CONTENT_REFERENCED',
              message: 'Esta montaria está no Estábulo de uma zona.',
            },
          },
          { status: 409 },
        ),
      ),
    )
    renderEditor()
    await openCard('Cavalo de Arado · Montaria · Publicada')
    fireEvent.click(
      within(form()).getByRole('button', { name: 'Excluir carta' }),
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Excluir',
      }),
    )
    await waitFor(() =>
      expect(formStatus()).toHaveTextContent(
        'Esta montaria está no Estábulo de uma zona.',
      ),
    )
    expect(field('Nome')).toHaveValue('Cavalo de Arado')
  })

  it('REQ-83: o "Mercado" da zona tem a lista "Estábulo" ("Montaria {n}"); salvar envia market.mounts', async () => {
    const bodies = recordBodies()
    renderEditor()
    await openCard('Mina Velha · Zona · Publicada')
    const stable = within(group('Mercado')).getByRole('group', {
      name: 'Estábulo',
    })
    expect(within(stable).getByLabelText('Montaria 1')).toHaveValue(
      'fixture.plow-horse',
    )
    fireEvent.click(within(stable).getByRole('button', { name: 'Adicionar' }))
    fireEvent.change(within(stable).getByLabelText('Montaria 2'), {
      target: { value: 'fixture.war-pony' },
    })
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      market: {
        stock: [],
        singles: false,
        mounts: ['fixture.plow-horse', 'fixture.war-pony'],
      },
    })
  })

  it('REQ-83: zona nova com "Tem mercado" começa com o "Estábulo" vazio e envia mounts []', async () => {
    const bodies = recordBodies()
    renderEditor()
    await newCard('Zona')
    type('Identificador', 'praca')
    type('Título', 'Praça')
    fireEvent.change(field('Tipo de zona'), { target: { value: 'urban' } })
    type('Local', 'Cidade')
    type('Setas de conexão', '4')
    expect(
      within(group('Mercado')).queryByRole('group', { name: 'Estábulo' }),
    ).toBeNull()
    fireEvent.click(field('Tem mercado'))
    const stable = within(group('Mercado')).getByRole('group', {
      name: 'Estábulo',
    })
    expect(within(stable).queryByRole('listitem')).toBeNull()
    fireEvent.click(saveButton())
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0].body).toMatchObject({
      market: { stock: [], singles: false, mounts: [] },
    })
  })

  it('REQ-83: erros CONTENT_INVALID em market.mounts e market.mounts.0 aparecem na lista e no item', async () => {
    rejectWith('put', [
      { path: 'market.mounts', message: 'Só zona Rural ou Habitada.' },
      { path: 'market.mounts.0', message: 'Não é uma montaria.' },
    ])
    renderEditor()
    await openCard('Mina Velha · Zona · Publicada')
    fireEvent.click(saveButton())
    const stable = within(group('Mercado')).getByRole('group', {
      name: 'Estábulo',
    })
    await waitFor(() =>
      expect(stable).toHaveAccessibleDescription('Só zona Rural ou Habitada.'),
    )
    expect(
      within(stable).getByLabelText('Montaria 1'),
    ).toHaveAccessibleDescription('Não é uma montaria.')
  })
})
