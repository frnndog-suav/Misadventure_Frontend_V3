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
import type { Party } from '../../api/parties'
import App from '../../App'
import { internalErrorFixture } from '../../mocks/fixtures'
import { handlers } from '../../mocks/handlers'
import {
  actionNoActionPointsFixture,
  actionPrepareNotAllowedFixture,
  partyBladeEquippedFixture,
  partyBladeUnequippedFixture,
  partyCreatedFixture,
  partyGearInSessionFixture,
  partyInSessionFixture,
  partyMovedToStoneBendFixture,
  partyNextRoundFixture,
  partySessionNotActiveFixture,
} from '../../mocks/partyFixtures'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  vi.stubEnv('TZ', 'America/Sao_Paulo')
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

const partyId = partyCreatedFixture.id

function renderParty(id: string = partyId): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/grupo/${id}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const status = () => screen.getAllByRole('status')[0]
const endButton = () => screen.getByRole('button', { name: 'Encerrar sessão' })

describe('REQ-16: grupo em sessão', () => {
  it('REQ-16: ao abrir envia POST …/session e mostra "Abrindo o grupo…"', async () => {
    let calls = 0
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/session', async ({ params }) => {
        expect(params.partyId).toBe(partyId)
        calls += 1
        await gate
        return HttpResponse.json(partyInSessionFixture)
      }),
    )
    renderParty()
    await waitFor(() => expect(calls).toBeGreaterThan(0))
    expect(status()).toHaveTextContent('Abrindo o grupo…')
    release()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
  })

  it('REQ-16: com 200 mostra nome, membros com host, situação, data, botão e placeholder', async () => {
    renderParty()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' }),
    ).toBeInTheDocument()
    const members = screen.getByRole('list', { name: 'Membros' })
    expect(within(members).getAllByRole('listitem')).toHaveLength(1)
    expect(within(members).getByRole('listitem')).toHaveTextContent(
      'Lia (host)',
    )
    expect(screen.getByText('Em sessão')).toBeInTheDocument()
    expect(screen.getByText('Salvo em 14/11/2026 18:30')).toBeInTheDocument()
    expect(endButton()).toBeEnabled()
    expect(
      screen.queryByText('A partida começa na próxima etapa do jogo.'),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(status()).toHaveTextContent(''))
  })

  it('REQ-16: situação "Pausado" vem do status recebido', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(partyCreatedFixture),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    expect(screen.getByText('Pausado')).toBeInTheDocument()
  })

  it('REQ-16: "Encerrar sessão" envia o pedido com o botão desabilitado e, com 200, volta a / com "Sessão encerrada."', async () => {
    let ended = false
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/session/end', async () => {
        ended = true
        await gate
        return HttpResponse.json({ ...partyInSessionFixture, status: 'idle' })
      }),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() => expect(ended).toBe(true))
    expect(endButton()).toBeDisabled()
    release()

    const games = await screen.findByRole('region', { name: 'Seus jogos' })
    expect(within(games).getByRole('status')).toHaveTextContent(
      'Sessão encerrada.',
    )
  })

  it('REQ-16: 404 ao abrir mostra a message e "Voltar ao início"', async () => {
    renderParty('nope')
    await waitFor(() =>
      expect(status()).toHaveTextContent('Grupo não encontrado.'),
    )
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.queryByRole('button', { name: 'Encerrar sessão' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-16: 404 ao encerrar mostra a message e "Voltar ao início"', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json(
          {
            error: {
              code: 'PARTY_NOT_FOUND',
              message: 'Grupo não encontrado.',
            },
          },
          { status: 404 },
        ),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent('Grupo não encontrado.'),
    )
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toBeInTheDocument()
  })

  it('REQ-16: 409 ao encerrar mostra a message, sem "Voltar ao início"', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    expect(
      screen.queryByRole('link', { name: 'Voltar ao início' }),
    ).not.toBeInTheDocument()
    expect(endButton()).toBeEnabled()
  })

  it('REQ-16: outro erro §1.4 ao abrir mostra a message', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-16: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () => HttpResponse.error()),
    )
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-16: resposta fora do contrato mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/session/end', () =>
        HttpResponse.json({ id: 1 }),
      ),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    fireEvent.click(endButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

describe('REQ-44: inventário, equipamentos e bolsa na tela do grupo', () => {
  const items = (list: HTMLElement) =>
    within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent)

  it('REQ-44: "Ouro {gold} (bolsa para {purseCapacity})"', async () => {
    renderParty()
    const section = await screen.findByRole('region', { name: 'Lia' })
    expect(
      within(section).getByText('Ouro 10 (bolsa para 300)'),
    ).toBeInTheDocument()
  })

  it('REQ-44: "Modificadores" mostra effectiveModifiers e, logo depois, "Modificadores da classe" mostra modifiers', async () => {
    renderParty()
    const section = await screen.findByRole('region', { name: 'Lia' })
    const effective = within(section).getByRole('list', {
      name: 'Modificadores',
    })
    const own = within(section).getByRole('list', {
      name: 'Modificadores da classe',
    })
    expect(items(effective)).toEqual([
      '6 Ataque',
      '5 Defesa',
      '49 Precisão',
      '16 Esquiva',
      '8 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    expect(items(own)).toEqual([
      '6 Ataque',
      '5 Defesa',
      '45 Precisão',
      '15 Esquiva',
      '8 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    expect(effective.nextElementSibling).toBe(own)
  })

  it('REQ-44: "Equipamentos" com as 8 categorias e "Inventário (0 de 10 slots)" com "Inventário vazio." vêm antes de "Build"', async () => {
    renderParty()
    const section = await screen.findByRole('region', { name: 'Lia' })
    const equipment = within(section).getByRole('list', {
      name: 'Equipamentos',
    })
    expect(items(equipment)).toEqual([
      'Cabeça: vazio',
      'Tronco: vazio',
      'Inferior: vazio',
      'Calçado: vazio',
      'Capa: vazio',
      'Arma: vazio',
      'Escudo: vazio',
      'Acessório: vazio',
    ])
    const inventoryTitle = within(section).getByRole('heading', {
      name: 'Inventário (0 de 10 slots)',
    })
    expect(within(section).getByText('Inventário vazio.')).toBeInTheDocument()
    expect(
      within(section).queryByRole('list', {
        name: 'Inventário (0 de 10 slots)',
      }),
    ).not.toBeInTheDocument()
    const buildTitle = within(section).getByRole('heading', {
      name: 'Build (60 cartas)',
    })
    expect(
      equipment.compareDocumentPosition(inventoryTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      inventoryTitle.compareDocumentPosition(buildTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-44: o inventário lista "{quantity}× {nome}" por slot na ordem recebida; slot ocupado mostra o nome da carta', async () => {
    const [gear] = partyGearInSessionFixture.members
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyGearInSessionFixture,
          members: [
            {
              ...gear,
              player: {
                ...gear.player,
                // Sem `prepare`: o texto do item sem os botões do REQ-45.
                availableActions: ['move', 'endTurn'],
                equipment: {
                  ...gear.player.equipment,
                  shield: 'fixture.oak-shield',
                },
              },
            },
          ],
        } satisfies Party),
      ),
    )
    renderParty(partyGearInSessionFixture.id)
    const inventory = await screen.findByRole('list', {
      name: 'Inventário (5 de 10 slots)',
    })
    await waitFor(() =>
      expect(items(inventory)).toEqual([
        '1× Lâmina do Crepúsculo',
        '1× Escudo de Carvalho',
        '1× Elmo de Ferro',
        '1× Varinha Arcana',
        '2× Poção de Cura',
      ]),
    )
    expect(screen.queryByText('Inventário vazio.')).not.toBeInTheDocument()
    expect(items(screen.getByRole('list', { name: 'Equipamentos' }))).toContain(
      'Escudo: Escudo de Carvalho',
    )
  })
})

describe('REQ-30: partida preparada na tela do grupo', () => {
  const lia = partyInSessionFixture.members[0]

  it('REQ-30: mostra dimensão, cidade inicial e "Ordem dos jogadores" na ordem recebida; "Membros" continua', async () => {
    const second = {
      ...lia,
      id: 'member-bo',
      characterName: 'Bo',
      isHost: false,
    }
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: [lia, second],
          turnOrder: [second.id, lia.id],
        }),
      ),
    )
    renderParty()
    expect(
      await screen.findByText('Dimensão: Dimensão de Teste'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Cidade inicial: Porto Cinzento'),
    ).toBeInTheDocument()
    const order = screen.getByRole('list', { name: 'Ordem dos jogadores' })
    expect(
      within(order)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Bo', 'Lia'])
    expect(
      within(screen.getByRole('list', { name: 'Membros' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(2)
  })

  it('REQ-30: a seção do membro mostra classe com trava, números recebidos, modificadores, zonas e contagens', async () => {
    renderParty()
    const section = await screen.findByRole('region', { name: 'Lia' })
    await within(section).findByText('Zona atual: Porto Cinzento')
    expect(
      within(section).getByText('Classe: Guerreiro (trava cumprida)'),
    ).toBeInTheDocument()
    expect(within(section).getByText('Vida 22/22')).toBeInTheDocument()
    expect(within(section).getByText('Vida base 20')).toBeInTheDocument()
    expect(within(section).getByText('Pico 10')).toBeInTheDocument()
    expect(within(section).getByText('Vigor 10')).toBeInTheDocument()
    // REQ-44 alinha o ouro e os modificadores (testados no describe do REQ-44).
    expect(
      within(section).getByText('Ouro 10 (bolsa para 300)'),
    ).toBeInTheDocument()
    expect(
      within(section).getByText('Ponto de respawn: Porto Cinzento'),
    ).toBeInTheDocument()
    expect(
      within(section).getByText('Deck de atributos: 53 cartas'),
    ).toBeInTheDocument()
    expect(
      within(section).getByText('Descarte de atributos: 0 cartas'),
    ).toBeInTheDocument()
  })

  it('REQ-30: "(trava não cumprida)" conforme deckLockMet', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: [
            {
              ...lia,
              player: {
                ...lia.player,
                playerClasses: [{ playerClass: 'warrior', deckLockMet: false }],
              },
            },
          ],
        }),
      ),
    )
    renderParty()
    expect(
      await screen.findByText('Classe: Guerreiro (trava não cumprida)'),
    ).toBeInTheDocument()
  })

  it('REQ-30: "Mão (7)" mostra cada carta completa na ordem recebida, repetidas repetidas, uma consulta por id distinto', async () => {
    const asked: string[] = []
    server.events.on('request:start', ({ request }) => {
      const match = /\/catalog\/cards\/([^/?]+)$/.exec(
        new URL(request.url).pathname,
      )
      if (match) asked.push(decodeURIComponent(match[1]))
    })
    renderParty()
    const hand = await screen.findByRole('region', { name: 'Mão (7)' })
    await waitFor(() =>
      expect(within(hand).getAllByRole('article')).toHaveLength(7),
    )
    expect(
      within(hand)
        .getAllByRole('article')
        .map((card) => within(card).getByRole('heading').textContent),
    ).toEqual([
      'Força',
      'Resistência',
      'Força',
      'Força',
      'Resistência',
      'Resistência',
      'Força',
    ])
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('REQ-40: "Build (60 cartas)" e "Pasta de TCG (capacidade 30)" vêm antes da mão, na ordem recebida; pasta vazia mostra "Pasta vazia."', async () => {
    renderParty()
    const build = await screen.findByRole('list', { name: 'Build (60 cartas)' })
    await waitFor(() =>
      expect(
        within(build)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['30× Resistência', '30× Força']),
    )
    const folderTitle = screen.getByRole('heading', {
      name: 'Pasta de TCG (capacidade 30)',
    })
    expect(folderTitle).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: 'Pasta de TCG (capacidade 30)' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Pasta vazia.')).toBeInTheDocument()
    const hand = screen.getByRole('region', { name: 'Mão (7)' })
    expect(
      folderTitle.compareDocumentPosition(hand) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      build.compareDocumentPosition(folderTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-40: a pasta com entradas lista "{copies}× {nome}" na ordem recebida e o nome mostra "…" até a carta chegar', async () => {
    const [lia] = partyInSessionFixture.members
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: [
            {
              ...lia,
              player: {
                ...lia.player,
                tcgFolder: [
                  { cardId: 'fixture.strength-basic', copies: 2 },
                  { cardId: 'fixture.endurance-basic', copies: 1 },
                ],
              },
            },
          ],
        } satisfies Party),
      ),
    )
    renderParty()
    const folder = await screen.findByRole('list', {
      name: 'Pasta de TCG (capacidade 30)',
    })
    await waitFor(() =>
      expect(
        within(folder)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['2× Força', '1× Resistência']),
    )
    expect(screen.queryByText('Pasta vazia.')).not.toBeInTheDocument()
  })

  it('REQ-30: com os nomes ainda não recebidos, mostra "Carregando a partida…"', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('*/catalog/classes', async () => {
        await gate
        return HttpResponse.json([])
      }),
    )
    renderParty()
    await screen.findByRole('heading', { level: 1, name: 'Os Teimosos' })
    expect(status()).toHaveTextContent('Carregando a partida…')
    release()
    await waitFor(() => expect(status()).toHaveTextContent(''))
  })

  it('REQ-30: com as cartas ainda não recebidas, mostra "Carregando a partida…" e "Mão (7)" com a contagem recebida', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('*/catalog/cards/:cardId', async () => {
        await gate
        return HttpResponse.json(internalErrorFixture, { status: 500 })
      }),
    )
    renderParty()
    expect(
      await screen.findByRole('region', { name: 'Mão (7)' }),
    ).toBeInTheDocument()
    expect(status()).toHaveTextContent('Carregando a partida…')
    expect(screen.getByText('Dimensão: …')).toBeInTheDocument()
    release()
  })

  it('REQ-30: erro na consulta de uma carta mostra a message', async () => {
    server.use(
      http.get('*/catalog/cards/:cardId', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-30: falha de rede nas classes mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/catalog/classes', () => HttpResponse.error()))
    renderParty()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

describe('REQ-34: mapa da partida', () => {
  const mapRegion = () => screen.getByRole('region', { name: 'Mapa' })
  const zoneButton = (title: string) =>
    within(mapRegion()).getByRole('button', { name: new RegExp(title) })

  async function renderMap(): Promise<void> {
    renderParty()
    await screen.findByRole('region', { name: 'Mapa' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
  }

  it('REQ-34: a região "Mapa" vem depois de "Cidade inicial" e antes da ordem dos jogadores', async () => {
    await renderMap()
    const city = screen.getByText('Cidade inicial: Porto Cinzento')
    const order = screen.getByRole('heading', { name: 'Ordem dos jogadores' })
    expect(
      city.compareDocumentPosition(mapRegion()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      mapRegion().compareDocumentPosition(order) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-34: cada zona ocupa a posição (x, y) recebida: x para a direita, y para baixo', async () => {
    await renderMap()
    const place = (title: string) => {
      const el = zoneButton(title)
      return { col: el.dataset.col, row: el.dataset.row }
    }
    expect(place('Porto Cinzento')).toEqual({ col: '1', row: '1' })
    expect(place('Bosque Sussurrante')).toEqual({ col: '3', row: '1' })
    expect(place('Curva de Pedra')).toEqual({ col: '1', row: '3' })
    expect(place('Mina Velha')).toEqual({ col: '3', row: '3' })
  })

  it('REQ-34: o menor x fica na primeira coluna e o menor y na primeira linha', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () => {
        const zones = partyInSessionFixture.dimension.map.zones.map((z) => ({
          ...z,
          x: z.x + 5,
          y: z.y - 2,
        }))
        return HttpResponse.json({
          ...partyInSessionFixture,
          dimension: {
            ...partyInSessionFixture.dimension,
            map: { ...partyInSessionFixture.dimension.map, zones },
          },
        })
      }),
    )
    await renderMap()
    const el = zoneButton('Porto Cinzento')
    expect([el.dataset.col, el.dataset.row]).toEqual(['1', '1'])
  })

  it('REQ-34: cada zona é um botão com título, setas com texto alternativo e "{characterName} está aqui"', async () => {
    await renderMap()
    const harbor = zoneButton('Porto Cinzento')
    expect(harbor).toHaveAttribute('aria-pressed', 'false')
    expect(harbor).toHaveTextContent('↑→↓←')
    expect(
      within(harbor).getByRole('img', {
        name: 'Setas: norte, leste, sul, oeste',
      }),
    ).toBeInTheDocument()
    expect(harbor).toHaveTextContent('Lia está aqui')
    const bend = zoneButton('Curva de Pedra')
    expect(
      within(bend).getByRole('img', { name: 'Setas: norte, leste' }),
    ).toBeInTheDocument()
    expect(bend).not.toHaveTextContent('está aqui')
  })

  it('REQ-34: ligações só entre zonas vizinhas com crossing, decorativas', async () => {
    await renderMap()
    const links = Array.from(
      mapRegion().querySelectorAll<HTMLElement>('[data-link]'),
    )
    expect(links.map((l) => l.textContent).sort()).toEqual(['|', '—', '—'])
    for (const l of links) expect(l).toHaveAttribute('aria-hidden', 'true')
    const at = (col: string, row: string) =>
      links.find((l) => l.dataset.col === col && l.dataset.row === row)
    expect(at('2', '1')?.textContent).toBe('—') // porto–bosque
    expect(at('1', '2')?.textContent).toBe('|') // porto–curva
    expect(at('2', '3')?.textContent).toBe('—') // curva–mina
    expect(at('3', '2')).toBeUndefined() // bosque–mina: vizinhas sem crossing
  })

  it('REQ-34: nenhuma zona vem escolhida e não há seção "Zona escolhida"', async () => {
    await renderMap()
    expect(zoneButton('Porto Cinzento')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.queryByRole('region', { name: 'Zona escolhida' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-34: clicar numa zona a marca e mostra a carta completa e "Travessias com" na ordem recebida', async () => {
    await renderMap()
    fireEvent.click(zoneButton('Porto Cinzento'))
    expect(zoneButton('Porto Cinzento')).toHaveAttribute('aria-pressed', 'true')
    const chosen = await screen.findByRole('region', { name: 'Zona escolhida' })
    expect(within(chosen).getByRole('article')).toBeInTheDocument()
    expect(chosen).toHaveTextContent(
      'Travessias com: Curva de Pedra, Bosque Sussurrante',
    )
  })

  it('REQ-34: clicar na zona marcada não desmarca; clicar em outra troca a escolha', async () => {
    await renderMap()
    fireEvent.click(zoneButton('Porto Cinzento'))
    fireEvent.click(zoneButton('Porto Cinzento'))
    expect(zoneButton('Porto Cinzento')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(zoneButton('Mina Velha'))
    expect(zoneButton('Porto Cinzento')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(zoneButton('Mina Velha')).toHaveAttribute('aria-pressed', 'true')
    const chosen = await screen.findByRole('region', { name: 'Zona escolhida' })
    expect(chosen).toHaveTextContent('Travessias com: Curva de Pedra')
  })

  it('REQ-34: zona sem crossings mostra "Travessias com: nenhuma"', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          dimension: {
            ...partyInSessionFixture.dimension,
            map: { ...partyInSessionFixture.dimension.map, crossings: [] },
          },
        }),
      ),
    )
    await renderMap()
    fireEvent.click(zoneButton('Porto Cinzento'))
    const chosen = await screen.findByRole('region', { name: 'Zona escolhida' })
    expect(chosen).toHaveTextContent('Travessias com: nenhuma')
  })

  it('REQ-34: com os títulos ainda não recebidos, mostra "Carregando a partida…" e "…" no lugar do título', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('*/catalog/cards/:cardId', async () => {
        await gate
        return HttpResponse.json(internalErrorFixture, { status: 500 })
      }),
    )
    renderParty()
    const map = await screen.findByRole('region', { name: 'Mapa' })
    expect(status()).toHaveTextContent('Carregando a partida…')
    expect(within(map).getAllByRole('button')[0]).toHaveTextContent('…')
    release()
  })
})

describe('REQ-35: Movimentar', () => {
  const mapRegion = () => screen.getByRole('region', { name: 'Mapa' })
  const zoneButton = (title: string) =>
    within(mapRegion()).getByRole('button', { name: new RegExp(`^${title}`) })
  const moveButton = (title: string) =>
    screen.queryByRole('button', { name: `Movimentar para ${title}` })
  const lia = () => screen.getByRole('region', { name: 'Lia' })

  async function renderMap(): Promise<void> {
    renderParty()
    await screen.findByRole('region', { name: 'Mapa' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
  }

  it('REQ-35: zona em moveTargets mostra "Movimentar para {title}"; fora (inclusive a atual) não há botão', async () => {
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    expect(moveButton('Curva de Pedra')).toBeInTheDocument()
    fireEvent.click(zoneButton('Mina Velha'))
    expect(moveButton('Mina Velha')).toBeNull()
    fireEvent.click(zoneButton('Porto Cinzento'))
    expect(moveButton('Porto Cinzento')).toBeNull()
  })

  it('REQ-35: envia { type: "move", zoneId } com o botão desabilitado durante o pedido', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyMovedToStoneBendFixture)
      }),
    )
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() => expect(moveButton('Curva de Pedra')).toBeDisabled())
    expect(body).toEqual({ type: 'move', zoneId: 'fixture.stone-bend' })
    release()
    await waitFor(() =>
      expect(status()).toHaveTextContent('Você está em Curva de Pedra.'),
    )
  })

  it('REQ-35: com 200 mostra o Party devolvido, mantém a zona escolhida e "Você está em {title}."', async () => {
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Você está em Curva de Pedra.'),
    )
    expect(lia()).toHaveTextContent('Zona atual: Curva de Pedra')
    expect(screen.getByText('Salvo em 14/11/2026 18:40')).toBeInTheDocument()
    expect(zoneButton('Curva de Pedra')).toHaveTextContent('Lia está aqui')
    expect(zoneButton('Porto Cinzento')).not.toHaveTextContent('Lia está aqui')
    expect(zoneButton('Curva de Pedra')).toHaveAttribute('aria-pressed', 'true')
    expect(moveButton('Curva de Pedra')).toBeNull()
    fireEvent.click(zoneButton('Mina Velha'))
    expect(moveButton('Mina Velha')).toBeInTheDocument()
  })

  it('REQ-35: move mais de uma vez (ida e volta à cidade)', async () => {
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Você está em Curva de Pedra.'),
    )
    fireEvent.click(zoneButton('Porto Cinzento'))
    fireEvent.click(moveButton('Porto Cinzento')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Você está em Porto Cinzento.'),
    )
    expect(lia()).toHaveTextContent('Zona atual: Porto Cinzento')
  })

  it('REQ-35: erro §1.4 mostra a message e nada muda na tela', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: {
              ...m.player,
              moveTargets: [...m.player.moveTargets, 'fixture.old-mine'],
            },
          })),
        }),
      ),
    )
    await renderMap()
    fireEvent.click(zoneButton('Mina Velha'))
    fireEvent.click(moveButton('Mina Velha')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Esta ação não é permitida agora.'),
    )
    expect(lia()).toHaveTextContent('Zona atual: Porto Cinzento')
    expect(zoneButton('Mina Velha')).toHaveAttribute('aria-pressed', 'true')
    expect(moveButton('Mina Velha')).toBeEnabled()
  })

  it('REQ-35: PARTY_SESSION_NOT_ACTIVE mostra a message', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    expect(lia()).toHaveTextContent('Zona atual: Porto Cinzento')
  })

  it('REQ-35: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-35: resposta fora do contrato mostra "Servidor indisponível. Tente novamente." e nada muda', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json({ nope: true }),
      ),
    )
    await renderMap()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(lia()).toHaveTextContent('Zona atual: Porto Cinzento')
  })
})

describe('REQ-37: Movimentar e as ações disponíveis', () => {
  const mapRegion = () => screen.getByRole('region', { name: 'Mapa' })
  const zoneButton = (title: string) =>
    within(mapRegion()).getByRole('button', { name: new RegExp(`^${title}`) })
  const moveButton = (title: string) =>
    screen.queryByRole('button', { name: `Movimentar para ${title}` })
  const chosenRegion = () =>
    screen.getByRole('region', { name: 'Zona escolhida' })
  const noPoints = 'Sem pontos de ação para Movimentar.'

  /** Abre a sessão com o `Party` dado (host com os campos trocados). */
  async function renderWith(
    player: Partial<Party['members'][number]['player']>,
    actionPoints: number,
  ): Promise<void> {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: { ...m.player, ...player },
          })),
          turn: { ...partyInSessionFixture.turn, actionPoints },
        }),
      ),
    )
    renderParty()
    await screen.findByRole('region', { name: 'Mapa' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
  }

  it('REQ-37: sem move em availableActions e 0 pontos, não há botão e aparece o aviso', async () => {
    await renderWith({ availableActions: ['endTurn'] }, 0)
    fireEvent.click(zoneButton('Curva de Pedra'))
    expect(moveButton('Curva de Pedra')).toBeNull()
    expect(chosenRegion()).toHaveTextContent(noPoints)
  })

  it('REQ-37: zona fora de moveTargets com 0 pontos não mostra o aviso', async () => {
    await renderWith({ availableActions: ['endTurn'] }, 0)
    fireEvent.click(zoneButton('Mina Velha'))
    expect(moveButton('Mina Velha')).toBeNull()
    expect(chosenRegion()).not.toHaveTextContent(noPoints)
  })

  it('REQ-37: sem move por outro motivo (pontos > 0) não há botão nem aviso', async () => {
    await renderWith({ availableActions: ['endTurn'] }, 2)
    fireEvent.click(zoneButton('Curva de Pedra'))
    expect(moveButton('Curva de Pedra')).toBeNull()
    expect(chosenRegion()).not.toHaveTextContent(noPoints)
  })

  it('REQ-37: com move em availableActions, o botão aparece e não há aviso', async () => {
    await renderWith({}, 3)
    fireEvent.click(zoneButton('Curva de Pedra'))
    expect(moveButton('Curva de Pedra')).toBeInTheDocument()
    expect(chosenRegion()).not.toHaveTextContent(noPoints)
  })

  it('REQ-37: 409 ACTION_NOT_ALLOWED (noActionPoints) mostra a message e nada muda', async () => {
    // A tela ainda oferece `move` (estado antigo); o backend recusa com 409.
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(partyInSessionFixture),
      ),
    )
    renderParty('party-sem-pontos')
    await screen.findByRole('region', { name: 'Mapa' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        actionNoActionPointsFixture.error.message,
      ),
    )
    expect(screen.getByRole('region', { name: 'Lia' })).toHaveTextContent(
      'Zona atual: Porto Cinzento',
    )
  })
})

describe('REQ-36/REQ-38: a vez e Encerrar a vez', () => {
  const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
  const endTurnButton = () =>
    screen.queryByRole('button', { name: 'Encerrar a vez' })
  const mapRegion = () => screen.getByRole('region', { name: 'Mapa' })
  const zoneButton = (title: string) =>
    within(mapRegion()).getByRole('button', { name: new RegExp(`^${title}`) })
  const moveButton = (title: string) =>
    screen.queryByRole('button', { name: `Movimentar para ${title}` })

  async function renderTurn(id: string = partyId): Promise<void> {
    renderParty(id)
    await screen.findByRole('region', { name: 'A vez' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
  }

  it('REQ-36: a região "A vez" vem antes do "Mapa" com rodada, vez e pontos recebidos', async () => {
    await renderTurn()
    expect(
      turnRegion().compareDocumentPosition(mapRegion()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(turnRegion()).toHaveTextContent('Rodada 1')
    expect(turnRegion()).toHaveTextContent('Vez de Lia')
    expect(turnRegion()).toHaveTextContent('3 pontos de ação')
    expect(within(turnRegion()).getByText('pontos de ação')).toHaveClass('term')
  })

  it('REQ-36: "1 ponto de ação" no singular', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          turn: { ...partyInSessionFixture.turn, actionPoints: 1 },
        }),
      ),
    )
    await renderTurn()
    expect(turnRegion()).toHaveTextContent('1 ponto de ação')
    expect(turnRegion()).not.toHaveTextContent('pontos de ação')
  })

  it('REQ-36: com 200 de Movimentar, a região mostra o turn devolvido', async () => {
    await renderTurn()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(moveButton('Curva de Pedra')!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Você está em Curva de Pedra.'),
    )
    expect(turnRegion()).toHaveTextContent('2 pontos de ação')
  })

  it('REQ-37 (botão): "Encerrar a vez" só com endTurn em availableActions', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: { ...m.player, availableActions: ['move'] },
          })),
        }),
      ),
    )
    await renderTurn()
    expect(endTurnButton()).toBeNull()
  })

  it('REQ-38: envia { type: "endTurn" } sem confirmação, com os botões desabilitados durante o pedido', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyNextRoundFixture)
      }),
    )
    await renderTurn()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(
      within(turnRegion()).getByRole('button', { name: 'Encerrar a vez' }),
    )
    await waitFor(() => expect(endTurnButton()).toBeDisabled())
    expect(moveButton('Curva de Pedra')).toBeDisabled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(body).toEqual({ type: 'endTurn' })
    release()
    await waitFor(() =>
      expect(status()).toHaveTextContent('Rodada 2: vez de Lia.'),
    )
  })

  it('REQ-38: com 200 mostra o Party devolvido, mantém a zona escolhida e "Rodada {round}: vez de {characterName}."', async () => {
    await renderTurn()
    fireEvent.click(zoneButton('Curva de Pedra'))
    fireEvent.click(endTurnButton()!)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Rodada 2: vez de Lia.'),
    )
    expect(turnRegion()).toHaveTextContent('Rodada 2')
    expect(turnRegion()).toHaveTextContent('3 pontos de ação')
    expect(screen.getByText('Salvo em 14/11/2026 18:45')).toBeInTheDocument()
    expect(zoneButton('Curva de Pedra')).toHaveAttribute('aria-pressed', 'true')
    expect(endTurnButton()).toBeEnabled()
  })

  it('REQ-38: erro §1.4 mostra a message e nada muda na tela', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    await renderTurn()
    fireEvent.click(endTurnButton()!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    expect(turnRegion()).toHaveTextContent('Rodada 1')
  })

  it('REQ-38: falha de rede mostra "Servidor indisponível. Tente novamente." e nada muda', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    await renderTurn()
    fireEvent.click(endTurnButton()!)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(turnRegion()).toHaveTextContent('Rodada 1')
  })
})

describe('REQ-41: Recuperar', () => {
  const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
  const group = () =>
    within(turnRegion()).queryByRole('group', { name: 'Recuperar' })
  const option = (name: string) =>
    within(turnRegion()).getByRole('button', { name })

  async function renderTurn(): Promise<void> {
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
  }

  function withActions(availableActions: string[]): void {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: { ...m.player, availableActions },
          })),
        }),
      ),
    )
  }

  it('REQ-41: com recover, o grupo "Recuperar" tem os 3 botões em ordem, antes de "Encerrar a vez"', async () => {
    await renderTurn()
    const buttons = within(group()!).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Comprar cartas',
      'Mão no deck',
      'Descarte no deck',
    ])
    const end = within(turnRegion()).getByRole('button', {
      name: 'Encerrar a vez',
    })
    expect(
      group()!.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-41: sem recover não há o grupo', async () => {
    withActions(['move', 'endTurn'])
    await renderTurn()
    expect(group()).toBeNull()
  })

  it.each([
    ['Comprar cartas', 'drawToHand'],
    ['Mão no deck', 'shuffleHand'],
    ['Descarte no deck', 'shuffleDiscard'],
  ])(
    'REQ-41: "%s" envia { type: "recover", option: "%s" } sem confirmação, com os botões desabilitados no pedido',
    async (label, opt) => {
      let release: () => void = () => {}
      const gate = new Promise<void>((resolve) => (release = resolve))
      let body: unknown
      server.use(
        http.post('*/parties/:partyId/actions', async ({ request }) => {
          body = await request.json()
          await gate
          return HttpResponse.json(partyInSessionFixture)
        }),
      )
      await renderTurn()
      fireEvent.click(option(label))
      await waitFor(() => expect(option('Comprar cartas')).toBeDisabled())
      expect(option('Mão no deck')).toBeDisabled()
      expect(option('Descarte no deck')).toBeDisabled()
      expect(option('Encerrar a vez')).toBeDisabled()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(body).toEqual({ type: 'recover', option: opt })
      release()
      await waitFor(() => expect(option('Comprar cartas')).toBeEnabled())
    },
  )

  it('REQ-41: com 200 mostra o Party devolvido e "Recuperou: vida {health}/{maxHealth}, Vigor {vigor}."', async () => {
    await renderTurn()
    fireEvent.click(option('Comprar cartas'))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Recuperou: vida 22/22, Vigor 10.'),
    )
    expect(turnRegion()).toHaveTextContent('2 pontos de ação')
    expect(screen.getByText('Salvo em 14/11/2026 18:41')).toBeInTheDocument()
  })

  it('REQ-41: erro §1.4 mostra a message e nada muda na tela', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(actionNoActionPointsFixture, { status: 409 }),
      ),
    )
    await renderTurn()
    fireEvent.click(option('Mão no deck'))
    await waitFor(() => expect(status()).not.toHaveTextContent(''))
    expect(status()).not.toHaveTextContent('Recuperou')
    expect(turnRegion()).toHaveTextContent('3 pontos de ação')
  })

  it('REQ-41: falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    await renderTurn()
    fireEvent.click(option('Descarte no deck'))
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(turnRegion()).toHaveTextContent('3 pontos de ação')
  })
})

describe('REQ-42: Ajustar deck', () => {
  const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
  const adjustButton = () =>
    within(turnRegion()).queryByRole('button', { name: 'Ajustar deck' })
  const section = () => screen.queryByRole('region', { name: 'Ajustar deck' })
  const inSection = (name: string) =>
    within(section()!).getByRole('button', { name })
  const copiesField = (cardName: string) =>
    within(section()!).getByRole('spinbutton', {
      name: `Cópias na build de ${cardName}`,
    })

  async function openSection(): Promise<void> {
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
    fireEvent.click(adjustButton()!)
    await screen.findByRole('region', { name: 'Ajustar deck' })
  }

  function rejectWith(details: Record<string, string>): void {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          {
            error: {
              code: 'ACTION_NOT_ALLOWED',
              message: 'Esta ação não é permitida agora.',
              details,
            },
          },
          { status: 409 },
        ),
      ),
    )
  }

  it('REQ-42: com adjustDeck, "Ajustar deck" vem depois do grupo "Recuperar"', async () => {
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    const group = within(turnRegion()).getByRole('group', { name: 'Recuperar' })
    expect(
      group.compareDocumentPosition(adjustButton()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-42: sem adjustDeck não há botão', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: { ...m.player, availableActions: ['move', 'endTurn'] },
          })),
        }),
      ),
    )
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    expect(adjustButton()).toBeNull()
  })

  it('REQ-42: abre a seção com uma linha por carta da build ∪ pasta, em ordem de cardId, e desabilita o botão', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: partyInSessionFixture.members.map((m) => ({
            ...m,
            player: {
              ...m.player,
              tcgFolder: [
                { cardId: 'fixture.strength-basic', copies: 2 },
                { cardId: 'fixture.dexterity-basic', copies: 3 },
              ],
            },
          })),
        }),
      ),
    )
    await openSection()
    const rows = within(section()!).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    await waitFor(() => expect(rows[0]).toHaveTextContent('Destreza'))
    expect(rows[0]).toHaveTextContent('Na build: 0')
    expect(rows[0]).toHaveTextContent('Na pasta: 3')
    expect(rows[1]).toHaveTextContent('Resistência')
    expect(rows[1]).toHaveTextContent('Na build: 30')
    expect(rows[1]).toHaveTextContent('Na pasta: 0')
    expect(rows[2]).toHaveTextContent('Força')
    expect(rows[2]).toHaveTextContent('Na pasta: 2')
    expect(copiesField('Destreza')).toHaveValue(0)
    expect(copiesField('Resistência')).toHaveValue(30)
    expect(copiesField('Força')).toHaveValue(30)
    expect(adjustButton()).toBeDisabled()
    // A seção fica abaixo da região "A vez".
    expect(
      turnRegion().compareDocumentPosition(section()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-42: "Cancelar" fecha a seção sem enviar nada', async () => {
    const sent = vi.fn()
    server.use(
      http.post('*/parties/:partyId/actions', () => {
        sent()
        return HttpResponse.json(partyInSessionFixture)
      }),
    )
    await openSection()
    fireEvent.click(inSection('Cancelar'))
    expect(section()).toBeNull()
    expect(adjustButton()).toBeEnabled()
    expect(sent).not.toHaveBeenCalled()
  })

  it.each(['', '-1', '1.5'])(
    'REQ-42: campo "%s" não envia e mostra "Use um número inteiro a partir de 0." por aria-describedby',
    async (value) => {
      const sent = vi.fn()
      server.use(
        http.post('*/parties/:partyId/actions', () => {
          sent()
          return HttpResponse.json(partyInSessionFixture)
        }),
      )
      await openSection()
      await waitFor(() => copiesField('Força'))
      fireEvent.change(copiesField('Força'), { target: { value } })
      fireEvent.click(inSection('Salvar build'))
      expect(copiesField('Força')).toHaveAccessibleDescription(
        'Use um número inteiro a partir de 0.',
      )
      expect(copiesField('Resistência')).not.toHaveAccessibleDescription(
        'Use um número inteiro a partir de 0.',
      )
      expect(sent).not.toHaveBeenCalled()
    },
  )

  it('REQ-42: "Salvar build" envia só as linhas ≥ 1 em ordem de cardId, com tudo desabilitado no pedido', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyInSessionFixture)
      }),
    )
    await openSection()
    await waitFor(() => copiesField('Força'))
    fireEvent.change(copiesField('Resistência'), { target: { value: '0' } })
    fireEvent.change(copiesField('Força'), { target: { value: '60' } })
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() => expect(inSection('Salvar build')).toBeDisabled())
    expect(inSection('Cancelar')).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', { name: 'Comprar cartas' }),
    ).toBeDisabled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(body).toEqual({
      type: 'adjustDeck',
      build: [{ cardId: 'fixture.strength-basic', copies: 60 }],
    })
    release()
    await waitFor(() => expect(section()).toBeNull())
  })

  it('REQ-42: com 200 fecha a seção, mostra o Party devolvido e "Build salva: {buildSize} cartas."', async () => {
    await openSection()
    await waitFor(() => copiesField('Força'))
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Build salva: 60 cartas.'),
    )
    expect(section()).toBeNull()
    expect(screen.getByText('Salvo em 14/11/2026 18:44')).toBeInTheDocument()
  })

  it.each([
    [
      { reason: 'buildBelowMinimum' },
      'A build ficou abaixo do mínimo de cartas.',
    ],
    [
      { reason: 'notOwned', cardId: 'fixture.strength-basic' },
      'Você não tem cópias suficientes de Força.',
    ],
    [
      { reason: 'copyLimitExceeded', cardId: 'fixture.strength-basic' },
      'Força passou do limite de cópias no deck.',
    ],
    [
      { reason: 'tcgFolderFull' },
      'Não há espaço na pasta de TCG para as cartas que saíram da build.',
    ],
  ])(
    'REQ-42: 409 %o mantém a seção com o digitado e mostra a message e "%s"',
    async (details, text) => {
      rejectWith(details)
      await openSection()
      await waitFor(() => copiesField('Força'))
      fireEvent.change(copiesField('Força'), { target: { value: '29' } })
      fireEvent.click(inSection('Salvar build'))
      await waitFor(() => expect(section()).toHaveTextContent(text))
      expect(section()).toHaveTextContent(
        `Esta ação não é permitida agora. ${text}`,
      )
      expect(copiesField('Força')).toHaveValue(29)
      expect(status()).not.toHaveTextContent('Build salva')
    },
  )

  it('REQ-42: 409 com outro motivo (noActionPoints) mostra só a message', async () => {
    rejectWith({ reason: 'noActionPoints' })
    await openSection()
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() =>
      expect(section()).toHaveTextContent('Esta ação não é permitida agora.'),
    )
    expect(section()).not.toHaveTextContent('mínimo')
  })

  it('REQ-42: pelo MSW, a build com 29 de Força é recusada com buildBelowMinimum', async () => {
    await openSection()
    await waitFor(() => copiesField('Força'))
    fireEvent.change(copiesField('Força'), { target: { value: '29' } })
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'A build ficou abaixo do mínimo de cartas.',
      ),
    )
  })

  it('REQ-42: outro erro §1.4 mantém a seção e mostra a message', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    await openSection()
    await waitFor(() => copiesField('Força'))
    fireEvent.change(copiesField('Força'), { target: { value: '31' } })
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    expect(copiesField('Força')).toHaveValue(31)
  })

  it('REQ-42: falha de rede mantém a seção e mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    await openSection()
    fireEvent.click(inSection('Salvar build'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

describe('REQ-45: Preparar (equipar e guardar)', () => {
  const blade = 'fixture.blade-of-dusk'
  const bladeName = 'Lâmina do Crepúsculo'
  const [gear] = partyGearInSessionFixture.members
  const lia = () => screen.findByRole('region', { name: 'Lia' })
  const equipButton = (name: string) =>
    screen.getByRole('button', { name: `Equipar ${name}` })

  function sessionWith(party: Party): void {
    server.use(
      http.post('*/parties/:partyId/session', () => HttpResponse.json(party)),
    )
  }

  async function openGear(): Promise<void> {
    renderParty(partyGearInSessionFixture.id)
    await screen.findByRole('button', { name: `Equipar ${bladeName}` })
  }

  it('REQ-45: com prepare, só os slots com carta de equipamento têm "Equipar {nome}"; sem nada equipado, não há "Guardar"', async () => {
    await openGear()
    const section = await lia()
    await waitFor(() =>
      expect(
        within(section)
          .getAllByRole('button', { name: /^Equipar / })
          .map((b) => b.textContent),
      ).toEqual([
        'Equipar Lâmina do Crepúsculo',
        'Equipar Escudo de Carvalho',
        'Equipar Elmo de Ferro',
        'Equipar Varinha Arcana',
      ]),
    )
    expect(
      within(section).queryByRole('button', { name: /^Guardar / }),
    ).not.toBeInTheDocument()
  })

  it('REQ-45: cada categoria ocupada tem "Guardar {nome}"', async () => {
    sessionWith(partyBladeEquippedFixture)
    renderParty(partyGearInSessionFixture.id)
    const button = await screen.findByRole('button', {
      name: `Guardar ${bladeName}`,
    })
    expect(
      within(screen.getByRole('list', { name: 'Equipamentos' })).getAllByRole(
        'button',
      ),
    ).toEqual([button])
  })

  it('REQ-45: sem prepare em availableActions não há "Equipar" nem "Guardar"', async () => {
    const [equipped] = partyBladeEquippedFixture.members
    sessionWith({
      ...partyBladeEquippedFixture,
      members: [
        {
          ...equipped,
          player: { ...equipped.player, availableActions: ['move', 'endTurn'] },
        },
      ],
    })
    renderParty(partyGearInSessionFixture.id)
    await screen.findByText(`Arma: ${bladeName}`)
    await screen.findByText('1× Escudo de Carvalho')
    expect(
      screen.queryByRole('button', { name: /^(Equipar|Guardar) / }),
    ).not.toBeInTheDocument()
  })

  it('REQ-45: outros membros nunca têm os botões', async () => {
    sessionWith({
      ...partyGearInSessionFixture,
      members: [
        gear,
        { ...gear, id: 'member-bo', characterName: 'Bo', isHost: false },
      ],
      turnOrder: ['member-lia', 'member-bo'],
    })
    renderParty(partyGearInSessionFixture.id)
    const bo = await screen.findByRole('region', { name: 'Bo' })
    await within(await lia()).findByRole('button', {
      name: `Equipar ${bladeName}`,
    })
    expect(within(bo).queryByRole('button')).not.toBeInTheDocument()
  })

  it('REQ-45: com 0 pontos de ação e prepare presente, os botões ficam habilitados', async () => {
    sessionWith({
      ...partyGearInSessionFixture,
      turn: { ...partyGearInSessionFixture.turn, actionPoints: 0 },
      members: [
        {
          ...gear,
          player: { ...gear.player, availableActions: ['prepare', 'endTurn'] },
        },
      ],
    })
    renderParty(partyGearInSessionFixture.id)
    expect(
      await screen.findByRole('button', { name: `Equipar ${bladeName}` }),
    ).toBeEnabled()
  })

  it('REQ-45: "Equipar" envia { prepare, equip, cardId } sem confirmação, desabilita todos os botões de ação durante o pedido e, com 200, mostra o Party e "Equipou {nome}."', async () => {
    let body: unknown
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyBladeEquippedFixture)
      }),
    )
    await openGear()
    fireEvent.click(equipButton(bladeName))
    await waitFor(() => expect(equipButton(bladeName)).toBeDisabled())
    expect(equipButton('Escudo de Carvalho')).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Comprar cartas' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ajustar deck' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    expect(body).toEqual({ type: 'prepare', operation: 'equip', cardId: blade })
    release()
    await waitFor(() =>
      expect(status()).toHaveTextContent(`Equipou ${bladeName}.`),
    )
    expect(screen.getByText(`Arma: ${bladeName}`)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Guardar ${bladeName}` }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: `Equipar ${bladeName}` }),
    ).not.toBeInTheDocument()
  })

  it('REQ-45: "Guardar" envia { prepare, unequip, slot } e, com 200, mostra "Guardou {nome}."', async () => {
    let body: unknown
    sessionWith(partyBladeEquippedFixture)
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyBladeUnequippedFixture)
      }),
    )
    renderParty(partyGearInSessionFixture.id)
    fireEvent.click(
      await screen.findByRole('button', { name: `Guardar ${bladeName}` }),
    )
    await waitFor(() =>
      expect(status()).toHaveTextContent(`Guardou ${bladeName}.`),
    )
    expect(body).toEqual({
      type: 'prepare',
      operation: 'unequip',
      slot: 'weapon',
    })
    expect(screen.getByText('Arma: vazio')).toBeInTheDocument()
  })

  for (const [cardName, reason, text] of [
    [
      'Escudo de Carvalho',
      'shieldBlocked',
      'A arma em uso não deixa usar escudo.',
    ],
    [
      'Elmo de Ferro',
      'peakRequirementNotMet',
      'Seu Pico não alcança o requisito de Elmo de Ferro.',
    ],
    [
      'Varinha Arcana',
      'classRestricted',
      'Nenhuma das suas classes pode usar Varinha Arcana.',
    ],
    [
      bladeName,
      'inventoryFull',
      'Não há espaço no inventário para o que sairia do equipamento.',
    ],
  ] as const) {
    it(`REQ-45: 409 ${reason} mostra a message e o texto do motivo; nada muda`, async () => {
      server.use(
        http.post('*/parties/:partyId/actions', () =>
          HttpResponse.json(actionPrepareNotAllowedFixture(reason), {
            status: 409,
          }),
        ),
      )
      await openGear()
      fireEvent.click(equipButton(cardName))
      await waitFor(() =>
        expect(status().textContent).toBe(
          `Esta ação não é permitida agora. ${text}`,
        ),
      )
      expect(equipButton(cardName)).toBeEnabled()
      expect(screen.getByText('Arma: vazio')).toBeInTheDocument()
    })
  }

  it('REQ-45: recusa depois de um equipar com sucesso mantém o Party devolvido pelo sucesso', async () => {
    await openGear()
    fireEvent.click(equipButton(bladeName))
    const guard = await screen.findByRole('button', {
      name: `Guardar ${bladeName}`,
    })
    fireEvent.click(equipButton('Escudo de Carvalho'))
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'A arma em uso não deixa usar escudo.',
      ),
    )
    expect(screen.getByText(`Arma: ${bladeName}`)).toBeInTheDocument()
    expect(guard).toBeInTheDocument()
  })

  it('REQ-45: 409 com outro motivo mostra só a message', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(actionPrepareNotAllowedFixture('slotEmpty'), {
          status: 409,
        }),
      ),
    )
    await openGear()
    fireEvent.click(equipButton(bladeName))
    await waitFor(() =>
      expect(status().textContent).toBe('Esta ação não é permitida agora.'),
    )
  })

  it('REQ-45: outro erro §1.4 mostra a message e falha de rede o texto genérico (REQ-35)', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    await openGear()
    fireEvent.click(equipButton(bladeName))
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    fireEvent.click(equipButton(bladeName))
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(screen.getByText('Arma: vazio')).toBeInTheDocument()
  })
})
