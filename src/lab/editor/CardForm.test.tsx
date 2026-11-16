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

describe('REQ-21: listas', () => {
  it('REQ-21: "Adicionar", "Remover", "Subir" e "Descer"', async () => {
    renderEditor()
    await newCard('Atributo')
    const effects = within(form()).getByRole('group', { name: 'Efeitos' })
    const add = within(effects).getByRole('button', { name: 'Adicionar' })
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.click(add)
    fireEvent.change(within(effects).getByLabelText('Efeito 1'), {
      target: { value: 'A' },
    })
    fireEvent.change(within(effects).getByLabelText('Efeito 2'), {
      target: { value: 'B' },
    })
    fireEvent.change(within(effects).getByLabelText('Efeito 3'), {
      target: { value: 'C' },
    })
    const values = () =>
      within(effects)
        .getAllByRole('textbox')
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
    fireEvent.change(within(effects).getByLabelText('Efeito 1'), {
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
      zoneActions: ['recover', 'visitMarket'],
      effects: [{ text: 'Neblina.', polarity: 'negative' }],
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
                fields: [{ path: 'effects.1.text', message: 'Texto vazio.' }],
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
    fireEvent.change(within(effects).getByLabelText('Efeito 1'), {
      target: { value: 'A' },
    })
    fireEvent.change(within(effects).getByLabelText('Efeito 2'), {
      target: { value: 'B' },
    })
    fireEvent.click(saveButton())
    const error = await within(form()).findByText('Texto vazio.')
    expect(within(effects).getByLabelText('Efeito 2')).toHaveAttribute(
      'aria-describedby',
      error.id,
    )
    expect(within(effects).getByLabelText('Efeito 1')).not.toHaveAttribute(
      'aria-describedby',
    )
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
