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
import App from '../../App'
import { handlers } from '../../mocks/handlers'
import {
  partyMarketGoldLostFixture,
  partyMarketArrowsFixture,
  marketRefusalFixture,
} from '../../mocks/marketFixtures'
import { partyInSessionFixture } from '../../mocks/partyFixtures'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  server.events.removeAllListeners()
})
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

const [base] = partyInSessionFixture.members
const market = base.player.market!

function renderParty() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/grupo/${partyInSessionFixture.id}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function sessionWith(player: Partial<typeof base.player>): void {
  server.use(
    http.post('*/parties/:partyId/session', () =>
      HttpResponse.json({
        ...partyInSessionFixture,
        members: [{ ...base, player: { ...base.player, ...player } }],
      }),
    ),
  )
}

const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
const marketButton = () =>
  within(turnRegion()).queryByRole('button', { name: 'Ir ao Mercado' })
const section = () => screen.getByRole('region', { name: 'Mercado' })
const group = (name: string) =>
  within(
    within(section()).getByRole('list', { name }).closest('div') ?? section(),
  ).getByRole('list', { name })
const entry = (list: string, text: RegExp | string) =>
  within(group(list)).getByText(text).closest('li')!
const opTexts = () =>
  within(within(section()).getByRole('list', { name: 'Operações' }))
    .queryAllByRole('listitem')
    .map((li) => li.firstChild?.textContent)
const inSection = (name: string) =>
  within(section()).getByRole('button', { name })

async function openSection(): Promise<void> {
  renderParty()
  await screen.findByRole('region', { name: 'A vez' })
  await waitFor(() =>
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(''),
  )
  fireEvent.click(marketButton()!)
  await screen.findByRole('region', { name: 'Mercado' })
}

function addTo(list: string, text: RegExp | string, quantity?: string): void {
  const li = entry(list, text)
  if (quantity !== undefined)
    fireEvent.change(within(li).getByRole('spinbutton'), {
      target: { value: quantity },
    })
  fireEvent.click(within(li).getByRole('button', { name: 'Acrescentar' }))
}

describe('REQ-73: Ir ao Mercado, o que o mercado oferece', () => {
  it('REQ-73: com visitMarket, "Ir ao Mercado" fica em "A vez", depois de "Usar cofre"', async () => {
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    const vault = within(turnRegion()).getByRole('button', {
      name: 'Usar cofre',
    })
    expect(
      vault.compareDocumentPosition(marketButton()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-73: sem visitMarket não há botão', async () => {
    sessionWith({
      availableActions: base.player.availableActions.filter(
        (a) => a !== 'visitMarket',
      ),
    })
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    expect(marketButton()).toBeNull()
  })

  it('REQ-73: abre a seção abaixo de "A vez", desabilita o botão e mostra ouro e fator', async () => {
    await openSection()
    expect(marketButton()).toBeDisabled()
    expect(
      turnRegion().compareDocumentPosition(section()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(section()).toHaveTextContent(
      `Ouro na bolsa ${base.player.gold} (capacidade ${base.player.purseCapacity})`,
    )
    expect(section()).toHaveTextContent('Fator do mercado 115%')
    expect(section()).toHaveTextContent('Nenhuma operação.')
    expect(inSection('Confirmar (1 ponto de ação)')).toBeDisabled()
  })

  it('REQ-73: os grupos vêm na ordem Estoque, Boosters, Singles, Vender, Serviços', async () => {
    await openSection()
    const names = within(section())
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(names).toEqual([
      'Operações',
      'Estoque',
      'Boosters',
      'Singles',
      'Vender',
      'Serviços',
    ])
  })

  it('REQ-73: estoque e boosters mostram nome, preço e unidades por compra', async () => {
    await openSection()
    expect(
      within(group('Estoque'))
        .getAllByRole('listitem')
        .map((li) => li.firstChild?.textContent),
    ).toEqual([
      'Poção de Cura — 7 de ouro',
      'Flechas (10 unidades) — 4 de ouro',
      'Vara de Pesca — 23 de ouro',
    ])
    expect(
      within(group('Boosters'))
        .getAllByRole('listitem')
        .map((li) => li.firstChild?.textContent),
    ).toEqual(['Booster de Teste — 30 de ouro'])
  })

  it('REQ-73: "Acrescentar" no estoque e no booster monta a descrição da operação', async () => {
    await openSection()
    addTo('Estoque', /^Flechas/, '2')
    addTo('Boosters', /^Booster de Teste/)
    expect(opTexts()).toEqual([
      '1. Comprar 2× Flechas',
      '2. Comprar 1× Booster de Teste',
    ])
    expect(
      within(entry('Estoque', /^Flechas/)).getByLabelText('Compras de Flechas'),
    ).toBeInTheDocument()
    expect(
      within(entry('Boosters', /^Booster de Teste/)).getByLabelText(
        'Boosters de Booster de Teste',
      ),
    ).toBeInTheDocument()
  })

  it('REQ-73: campo vazio ou inválido não acrescenta e mostra o erro ligado por aria-describedby', async () => {
    await openSection()
    for (const value of ['', '0', '1.5']) {
      addTo('Estoque', /^Flechas/, value)
      expect(opTexts()).toEqual([])
      const field = within(entry('Estoque', /^Flechas/)).getByRole('spinbutton')
      const message = within(entry('Estoque', /^Flechas/)).getByText(
        'Use um número inteiro a partir de 1.',
      )
      expect(field).toHaveAttribute('aria-describedby', message.id)
    }
  })

  it('REQ-73: singles mostram destino, slot vazio sem botão e um slot só uma vez no lote', async () => {
    await openSection()
    expect(
      within(group('Singles'))
        .getAllByRole('listitem')
        .map((li) => li.firstChild?.textContent),
    ).toEqual([
      'Slot 1: Força — 6 de ouro (vai para a pasta de TCG)',
      'Slot 2: Espada Curta — 7 de ouro (vai para o inventário)',
      'Slot 3: Minério de Ferro — 6 de ouro (vai para o inventário)',
      'Slot 4: vazio',
    ])
    const slot4 = within(group('Singles')).getAllByRole('listitem')[3]!
    expect(within(slot4).queryByRole('button')).toBeNull()
    const buy = within(group('Singles')).getByRole('button', {
      name: 'Comprar Espada Curta',
    })
    fireEvent.click(buy)
    expect(opTexts()).toEqual(['1. Comprar Espada Curta (slot 2)'])
    expect(buy).toBeDisabled()
  })

  it('REQ-73: sem vitrine não há grupo "Singles"', async () => {
    sessionWith({ market: { ...market, showcase: null } })
    await openSection()
    expect(
      within(section()).queryByRole('heading', { name: 'Singles' }),
    ).toBeNull()
  })

  it('REQ-73: "Vender" sem ofertas mostra "Nada para vender."; serviços listam rótulo, preço e capacidade', async () => {
    await openSection()
    expect(section()).toHaveTextContent('Nada para vender.')
    expect(
      within(group('Serviços'))
        .getAllByRole('listitem')
        .map((li) => li.firstChild?.textContent),
    ).toEqual([
      'Expansão do cofre — 50 de ouro (capacidade passa a 35)',
      'Slot de deck — 100 de ouro (capacidade passa a 11)',
      'Expansão da pasta de TCG — 60 de ouro (capacidade passa a 40)',
      'Expansão da bolsa — 150 de ouro (capacidade passa a 600)',
      'Expansão do ouro do cofre — 500 de ouro (capacidade passa a 4000)',
    ])
    fireEvent.click(
      within(group('Serviços')).getByRole('button', {
        name: 'Comprar Expansão da bolsa',
      }),
    )
    expect(opTexts()).toEqual(['1. Comprar Expansão da bolsa'])
  })

  it('REQ-73: ofertas de venda mostram origem, unidades, preço por unidade ou lote', async () => {
    sessionWith({
      market: {
        ...market,
        sellOffers: [
          {
            source: 'inventory',
            cardId: 'fixture.arrows',
            owned: 20,
            lotSize: 10,
            price: 1,
          },
          {
            source: 'tcgFolder',
            cardId: 'fixture.strength-basic',
            owned: 3,
            lotSize: 1,
            price: 2,
          },
        ],
      },
    })
    await openSection()
    expect(
      within(group('Vender'))
        .getAllByRole('listitem')
        .map((li) => li.firstChild?.textContent),
    ).toEqual([
      'Flechas (Inventário, 20 unidades) — 1 de ouro por lote de 10',
      'Força (Pasta de TCG, 3 unidades) — 2 de ouro por unidade',
    ])
    const arrows = within(group('Vender')).getAllByRole('listitem')[0]!
    expect(within(arrows).getByLabelText('Unidades de Flechas')).toHaveValue(10)
    fireEvent.click(within(arrows).getByRole('button', { name: 'Acrescentar' }))
    expect(opTexts()).toEqual(['1. Vender 10× Flechas'])
  })

  it('REQ-73: com player.market null mostra o erro de servidor e nenhum grupo', async () => {
    sessionWith({ market: null })
    await openSection()
    expect(section()).toHaveTextContent(
      'Servidor indisponível. Tente novamente.',
    )
    expect(
      within(section()).queryByRole('heading', { name: 'Estoque' }),
    ).toBeNull()
  })
})

describe('REQ-74: Ir ao Mercado, lote, confirmação e resultado', () => {
  it('REQ-74: "Total previsto" soma pagar e receber dos preços exibidos', async () => {
    sessionWith({
      market: {
        ...market,
        sellOffers: [
          {
            source: 'inventory',
            cardId: 'fixture.arrows',
            owned: 20,
            lotSize: 10,
            price: 1,
          },
        ],
      },
    })
    await openSection()
    expect(section()).toHaveTextContent(
      'Total previsto: 0 de ouro a pagar, 0 de ouro a receber',
    )
    addTo('Estoque', /^Flechas/, '2') // 8
    addTo('Boosters', /^Booster de Teste/) // 30
    fireEvent.click(
      within(group('Singles')).getByRole('button', { name: 'Comprar Força' }),
    ) // 6
    fireEvent.click(
      within(group('Serviços')).getByRole('button', {
        name: 'Comprar Expansão do cofre',
      }),
    ) // 50
    addTo('Vender', /^Flechas/, '20') // 2
    expect(section()).toHaveTextContent(
      'Total previsto: 94 de ouro a pagar, 2 de ouro a receber',
    )
  })

  it('REQ-74: Remover, Subir e Descer reordenam a lista como no REQ-52', async () => {
    await openSection()
    addTo('Estoque', /^Poção/)
    addTo('Estoque', /^Flechas/)
    addTo('Boosters', /^Booster de Teste/)
    const items = () =>
      within(
        within(section()).getByRole('list', { name: 'Operações' }),
      ).getAllByRole('listitem')
    expect(
      within(items()[0]!).getByRole('button', { name: 'Subir' }),
    ).toBeDisabled()
    fireEvent.click(within(items()[2]!).getByRole('button', { name: 'Subir' }))
    expect(opTexts()).toEqual([
      '1. Comprar 1× Poção de Cura',
      '2. Comprar 1× Booster de Teste',
      '3. Comprar 1× Flechas',
    ])
    fireEvent.click(
      within(items()[0]!).getByRole('button', { name: 'Remover' }),
    )
    expect(opTexts()).toEqual([
      '1. Comprar 1× Booster de Teste',
      '2. Comprar 1× Flechas',
    ])
  })

  it('REQ-74: Confirmar envia visitMarket na ordem, fecha a seção e mostra o status e o resultado', async () => {
    let sent: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(partyMarketArrowsFixture)
      }),
    )
    await openSection()
    addTo('Estoque', /^Flechas/, '2')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Mercado' })).toBeNull(),
    )
    expect(sent).toEqual({
      type: 'visitMarket',
      operations: [
        { operation: 'buyStock', cardId: 'fixture.arrows', quantity: 2 },
      ],
    })
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Mercado: 1 operação feita.',
    )
    const results = screen.getByRole('list', { name: 'Resultado do mercado' })
    expect(
      within(results)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Comprou 20× Flechas por 8 de ouro'])
  })

  it('REQ-74: resultado com venda e ouro perdido mostra "{n} de ouro perdidos: a bolsa estava cheia."', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(partyMarketGoldLostFixture),
      ),
    )
    await openSection()
    addTo('Estoque', /^Poção/)
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    const results = await screen.findByRole('list', {
      name: 'Resultado do mercado',
    })
    expect(results).toHaveTextContent('Vendeu 1× Moeda da Sorte por 25 de ouro')
    expect(
      screen.getByText('15 de ouro perdidos: a bolsa estava cheia.'),
    ).toBeVisible()
  })

  it('REQ-74: os botões ficam desabilitados enquanto o pedido está em curso', async () => {
    let release: () => void = () => undefined
    server.use(
      http.post('*/parties/:partyId/actions', async () => {
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return HttpResponse.json(partyMarketArrowsFixture)
      }),
    )
    await openSection()
    addTo('Estoque', /^Flechas/)
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() => expect(inSection('Cancelar')).toBeDisabled())
    expect(inSection('Confirmar (1 ponto de ação)')).toBeDisabled()
    expect(
      within(entry('Estoque', /^Flechas/)).getByRole('button', {
        name: 'Acrescentar',
      }),
    ).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    release()
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Mercado' })).toBeNull(),
    )
  })

  it('REQ-74: "Cancelar" fecha a seção sem enviar', async () => {
    let calls = 0
    server.use(
      http.post('*/parties/:partyId/actions', () => {
        calls += 1
        return HttpResponse.json(partyMarketArrowsFixture)
      }),
    )
    await openSection()
    addTo('Estoque', /^Flechas/)
    fireEvent.click(inSection('Cancelar'))
    expect(screen.queryByRole('region', { name: 'Mercado' })).toBeNull()
    expect(calls).toBe(0)
    expect(marketButton()).toBeEnabled()
  })

  const refusals: [string, string, string][] = [
    [
      'notInMarketStock',
      'Flechas',
      'Flechas não está no estoque deste mercado.',
    ],
    ['notMarketBooster', 'Flechas', 'Flechas não está à venda neste mercado.'],
    ['singlesUnavailable', 'Flechas', 'Este mercado não vende singles.'],
    ['showcaseSlotNotFound', 'Flechas', 'Esse slot não existe na vitrine.'],
    ['showcaseSlotEmpty', 'Flechas', 'Esse slot da vitrine está vazio.'],
    ['notLotMultiple', 'Flechas', 'Flechas só é vendido em lotes inteiros.'],
    ['notEnoughGold', 'Flechas', 'Não há ouro suficiente na bolsa.'],
    ['inventoryFull', 'Flechas', 'Não há espaço no inventário.'],
    ['tcgFolderFull', 'Flechas', 'Não há espaço na pasta de TCG.'],
    [
      'notInInventory',
      'Flechas',
      'Flechas não está no inventário nessa quantidade.',
    ],
    [
      'notInTcgFolder',
      'Flechas',
      'Não há essas cópias de Flechas na pasta de TCG.',
    ],
  ]
  it.each(refusals)(
    'REQ-74: 409 %s mantém a lista, marca a operação e mostra o texto',
    async (reason, _name, text) => {
      server.use(
        http.post('*/parties/:partyId/actions', () =>
          HttpResponse.json(
            marketRefusalFixture({
              reason,
              cardId: 'fixture.arrows',
              operationIndex: 1,
            }),
            { status: 409 },
          ),
        ),
      )
      await openSection()
      addTo('Estoque', /^Poção/)
      addTo('Estoque', /^Flechas/)
      fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
      await within(section()).findByText(
        `Esta ação não é permitida agora. ${text}`,
      )
      const items = within(
        within(section()).getByRole('list', { name: 'Operações' }),
      ).getAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(within(items[0]!).queryByText('Recusada')).toBeNull()
      expect(within(items[1]!).getByText('Recusada')).toBeVisible()
      expect(screen.getAllByRole('status')[0]).toHaveTextContent('')
    },
  )

  it('REQ-74: motivo desconhecido mostra só a message; editar a lista tira a marca', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          marketRefusalFixture({ reason: 'noActionPoints', operationIndex: 0 }),
          { status: 409 },
        ),
      ),
    )
    await openSection()
    addTo('Estoque', /^Flechas/)
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await within(section()).findByText('Esta ação não é permitida agora.')
    expect(within(section()).getByText('Recusada')).toBeVisible()
    addTo('Estoque', /^Poção/)
    expect(within(section()).queryByText('Recusada')).toBeNull()
    expect(
      within(section()).queryByText('Esta ação não é permitida agora.'),
    ).toBeNull()
  })

  it('REQ-74: falha de rede mostra o erro genérico na seção e mantém a lista', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    await openSection()
    addTo('Estoque', /^Flechas/)
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await within(section()).findByText(
      'Servidor indisponível. Tente novamente.',
    )
    expect(opTexts()).toEqual(['1. Comprar 1× Flechas'])
  })
})

describe('REQ-76: capacidades e expansões na tela do grupo', () => {
  const member = () => screen.findByRole('region', { name: base.characterName })

  it('REQ-76: sem expansões não mostra a linha "Expansões"', async () => {
    renderParty()
    expect(await member()).not.toHaveTextContent('Expansões:')
  })

  it('REQ-76: com alguma expansão > 0 mostra todas e as capacidades recebidas', async () => {
    sessionWith({
      purseCapacity: 600,
      expansions: {
        vaultSlots: 0,
        deckSlots: 1,
        tcgFolder: 0,
        purse: 2,
        vaultGold: 0,
      },
    })
    renderParty()
    const region = await member()
    expect(region).toHaveTextContent(
      'Expansões: cofre 0, slots de deck 1, pasta de TCG 0, bolsa 2, ouro do cofre 0',
    )
    expect(region).toHaveTextContent('Ouro 10 (bolsa para 600)')
  })
})
