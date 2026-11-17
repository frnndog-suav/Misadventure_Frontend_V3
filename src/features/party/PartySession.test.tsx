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
  partyCreatedFixture,
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
    expect(within(section).getByText('Ouro 10')).toBeInTheDocument()
    expect(
      within(within(section).getByRole('list', { name: 'Modificadores' }))
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
