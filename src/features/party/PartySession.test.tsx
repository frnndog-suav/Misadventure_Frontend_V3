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
import { partyEffectsReadyFixture } from '../../mocks/effectFixtures'
import { internalErrorFixture } from '../../mocks/fixtures'
import { resetCombatScenarios } from '../../mocks/combatFixtures'
import { handlers } from '../../mocks/handlers'
import {
  eventMinimumNotMetFixture,
  eventScenarios,
  partyEncounterFixture,
  partyPartialEventFixture,
  partyScavengePendingFixture,
  partyScavengeLeftFixture,
} from '../../mocks/randomEventFixtures'
import {
  actionNoActionPointsFixture,
  actionPrepareNotAllowedFixture,
  partyBladeEquippedFixture,
  partyBladeUnequippedFixture,
  partyCreatedFixture,
  partyFishingRodInSessionFixture,
  partyGearInSessionFixture,
  partyInSessionFixture,
  partyMovedToStoneBendFixture,
  partyNextRoundFixture,
  partyScavengedFixture,
  partySessionNotActiveFixture,
  partyVaultUsedFixture,
} from '../../mocks/partyFixtures'

const server = setupServer(...handlers)

beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  vi.stubEnv('TZ', 'America/Sao_Paulo')
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetCombatScenarios()
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

function renderParty(id: string = partyId) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/grupo/${id}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const status = () => screen.getAllByRole('status')[0]
const endButton = () => screen.getByRole('button', { name: 'Encerrar sessão' })

it('REQ-59: abre a recompensa de Vasculhar com 0 PA e mostra a devolução ao deck', async () => {
  renderParty('party-vasculhar-sem-espaco')
  fireEvent.click(
    await screen.findByRole('button', { name: 'Vasculhar Peixe Prateado' }),
  )
  const reward = await screen.findByRole('region', {
    name: 'Recompensa pendente',
  })
  expect(within(reward).getByText(/Peixe Prateado/)).toBeInTheDocument()
  expect(status()).toHaveTextContent('aguarda uma escolha')
  fireEvent.click(within(reward).getByRole('button', { name: 'Deixar' }))
  expect(
    await screen.findByText('Peixe Prateado voltou ao deck de recompensas.'),
  ).toBeInTheDocument()
  expect(status()).toHaveTextContent('Você deixou Peixe Prateado.')
})

it.each([
  ['party-vasculhar-pilha', 'Você achou Minério de Ferro.'],
  [
    'party-vasculhar-vazio',
    'Minério de Ferro não estava no deck de recompensas.',
  ],
])(
  'REQ-59: %s apresenta a entrega retornada pelo Vasculhar',
  async (id, result) => {
    renderParty(id)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Vasculhar Minério de Ferro' }),
    )
    await waitFor(() => expect(status()).toHaveTextContent(result))
    expect(
      screen.queryByRole('region', { name: 'Recompensa pendente' }),
    ).not.toBeInTheDocument()
  },
)

it('REQ-59: restaura a pendência pelo GET e envia o lote escolhido sem perder a seleção após recusa', async () => {
  const id = partyScavengePendingFixture.id
  const requests: unknown[] = []
  server.use(
    http.post(`*/parties/${id}/session`, () =>
      HttpResponse.json(partyScavengePendingFixture),
    ),
    http.get(`*/parties/${id}`, () =>
      HttpResponse.json({
        ...partyScavengePendingFixture,
        pendingRewards: [
          { ...partyScavengePendingFixture.pendingRewards[0], id: 'restored' },
        ],
      }),
    ),
    http.post(`*/parties/${id}/actions`, async ({ request }) => {
      requests.push(await request.json())
      return HttpResponse.json(
        {
          error: {
            code: 'ACTION_NOT_ALLOWED',
            message: 'O lote não libera espaço.',
            details: { reason: 'rewardDoesNotFit' },
          },
        },
        { status: 409 },
      )
    }),
  )
  renderParty(id)
  const discard = await screen.findByLabelText('Descartar Minério de Ferro')
  fireEvent.change(discard, { target: { value: '1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Manter' }))
  expect(
    await screen.findByText('O lote não libera espaço.'),
  ).toBeInTheDocument()
  expect(discard).toHaveValue('1')
  expect(requests).toEqual([
    {
      type: 'resolveReward',
      rewardId: 'restored',
      choice: 'keep',
      discard: [{ cardId: 'fixture.iron-ore', copies: 1 }],
    },
  ])
})

it('REQ-59: ao vencer o prazo busca a transição no GET sem enviar Deixar', async () => {
  const id = partyScavengePendingFixture.id
  const decisionDeadlineAt = new Date(Date.now() + 1000).toISOString()
  const pending = {
    ...partyScavengePendingFixture,
    pendingRewards: [
      { ...partyScavengePendingFixture.pendingRewards[0], decisionDeadlineAt },
    ],
  }
  const action = vi.fn()
  let reads = 0
  server.use(
    http.post(`*/parties/${id}/session`, () => HttpResponse.json(pending)),
    http.get(`*/parties/${id}`, () =>
      HttpResponse.json(++reads === 1 ? pending : partyScavengeLeftFixture),
    ),
    http.post(`*/parties/${id}/actions`, () => {
      action()
      return HttpResponse.json(partyScavengeLeftFixture)
    }),
  )
  renderParty(id)
  expect(await screen.findByText(/Prazo da escolha/)).toBeInTheDocument()
  expect(
    await screen.findByText('Peixe Prateado voltou ao deck de recompensas.'),
  ).toBeInTheDocument()
  expect(action).not.toHaveBeenCalled()
})

it('REQ-57: inicia em antecipação e revela a carta', async () => {
  renderParty('party-evento-aleatorio')
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar evento' }))
  const reveal = await screen.findByRole('button', { name: 'Revelar carta' })
  expect(screen.queryByText('Carroça na estrada')).not.toBeInTheDocument()
  fireEvent.click(reveal)
  expect(await screen.findByText('Carroça na estrada')).toBeInTheDocument()
})

it('REQ-57: ao reabrir usa a escolha carregada pelo GET', async () => {
  const { party } = eventScenarios['party-evento-revelado']!
  const encounter = party.randomEventEncounter!
  server.use(
    http.get('*/parties/party-evento-revelado', () =>
      HttpResponse.json({
        ...party,
        randomEventEncounter: {
          ...encounter,
          card: { ...encounter.card!, title: 'Carroça recuperada' },
        },
      }),
    ),
  )
  renderParty('party-evento-revelado')
  expect(await screen.findByText('Carroça recuperada')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Revelar carta' }),
  ).not.toBeInTheDocument()
})

it('REQ-58: envia o ID da cópia escolhida e mantém a seleção após recusa de mínimo', async () => {
  const requests: unknown[] = []
  server.use(
    http.post(
      '*/parties/party-evento-copia-recusada/actions',
      async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json(eventMinimumNotMetFixture, { status: 409 })
      },
    ),
  )
  renderParty('party-evento-copia-recusada')
  const copy = await screen.findByRole('checkbox', { name: /h2/ })
  fireEvent.click(copy)
  fireEvent.click(screen.getByRole('button', { name: 'Pagar requisito' }))
  expect(
    await screen.findByText('Vigor — mínimo 5, atual 4'),
  ).toBeInTheDocument()
  expect(requests).toEqual([
    {
      type: 'payEventRequirement',
      encounterId: 'e1',
      requirementId: 'attrs',
      payment: { handCards: ['h2'] },
    },
  ])
  expect(copy).toBeChecked()
})

it('REQ-57: ativa consumível com 0 PA e oculta a ativação e a fuga após pagamento', async () => {
  const requests: unknown[] = []
  server.use(
    http.post(
      '*/parties/party-evento-consumivel/actions',
      async ({ request }) => {
        const body = await request.clone().json()
        requests.push(body)
        if (
          body &&
          typeof body === 'object' &&
          'type' in body &&
          body.type === 'payEventRequirement'
        )
          return HttpResponse.json(partyPartialEventFixture)
      },
    ),
  )
  renderParty('party-evento-consumivel')
  const activate = await screen.findByRole('button', { name: /Ativar Poção/ })
  await waitFor(() => expect(activate).toBeEnabled())
  fireEvent.click(activate)
  expect(await screen.findByText(/^Vida 15\//)).toBeInTheDocument()
  expect(requests[0]).toEqual({
    type: 'prepare',
    operation: 'activate',
    cardId: 'fixture.healing-potion',
    effectIndex: 0,
  })

  fireEvent.click(screen.getByRole('checkbox', { name: /h2/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Pagar requisito' }))
  const receipts = await screen.findByRole('list', {
    name: 'Recibos de pagamento',
  })
  expect(receipts).toHaveTextContent('h2')
  expect(
    screen.queryByRole('button', { name: /Ativar Poção/ }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Fugir' }),
  ).not.toBeInTheDocument()
})

it('REQ-58: sorteia sem payment, atualiza o saldo e guarda o recibo', async () => {
  renderParty('party-evento-descarte-aleatorio')
  const pay = await screen.findByRole('button', { name: 'Pagar requisito' })
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  fireEvent.click(pay)
  expect(await screen.findByText('Cópias restantes: 1')).toBeInTheDocument()
  expect(
    screen.getByRole('list', { name: 'Recibos de pagamento' }),
  ).toHaveTextContent('h2')
})

it('REQ-58: envia todas as cópias da manipulação em uma parte', async () => {
  const encounter = partyEncounterFixture.randomEventEncounter!
  const party: Party = {
    ...partyEncounterFixture,
    randomEventEncounter: {
      ...encounter,
      card: {
        ...encounter.card!,
        requirements: [
          {
            id: 'move-hand',
            kind: 'manipulateAttributeCards',
            mode: 'handToTop',
            count: 2,
            minimum: null,
            text: 'Mova duas cartas ao topo.',
          },
        ],
      },
      requirements: [
        {
          ...encounter.requirements[0]!,
          requirementId: 'move-hand',
          remaining: { copies: 2 },
        },
      ],
    },
  }
  const requests: unknown[] = []
  server.use(
    http.get('*/parties/party-evento-revelado', () => HttpResponse.json(party)),
    http.post(
      '*/parties/party-evento-revelado/actions',
      async ({ request }) => {
        requests.push(await request.json())
        return HttpResponse.json(party)
      },
    ),
  )
  renderParty('party-evento-revelado')
  fireEvent.click(await screen.findByRole('checkbox', { name: /h1/ }))
  const pay = screen.getByRole('button', { name: 'Pagar requisito' })
  expect(pay).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: /h2/ }))
  fireEvent.click(pay)
  await waitFor(() =>
    expect(requests).toEqual([
      {
        type: 'payEventRequirement',
        encounterId: 'e1',
        requirementId: 'move-hand',
        payment: { handCards: ['h1', 'h2'] },
      },
    ]),
  )
})

it.each([
  [
    'party-evento-minimo-ok',
    'Resolver evento',
    null,
    'Êxito',
    'Reposição: 0 de 0 cartas.',
  ],
  [
    'party-evento-minimo',
    'Desistir',
    'Confirmar desistência',
    'Revés por desistência',
    'Reposição: 1 de 1 cartas.',
  ],
  [
    'party-evento-fuga-sem-pa',
    'Fugir',
    'Confirmar fuga',
    'Revés por falha na fuga',
    'Dívida de PA na próxima vez: 1',
  ],
])(
  'REQ-58: %s apresenta o resultado confirmado pelo backend',
  async (id, action, confirm, title, detail) => {
    renderParty(id)
    fireEvent.click(await screen.findByRole('button', { name: action }))
    if (confirm) {
      expect(
        screen.queryByRole('region', { name: 'Resultado do último evento' }),
      ).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: confirm }))
    }
    const result = await screen.findByRole('region', {
      name: 'Resultado do último evento',
    })
    expect(
      within(result).getByRole('heading', { name: title }),
    ).toBeInTheDocument()
    expect(result).toHaveTextContent(detail)
  },
)

it('REQ-54: preserva estado e pagamento na recusa e limpa a escolha após sucesso', async () => {
  const member = partyEffectsReadyFixture.members[0]!
  const ready: Party = {
    ...partyEffectsReadyFixture,
    members: [
      {
        ...member,
        player: {
          ...member.player,
          activatableEffects: [
            {
              ...member.player.activatableEffects[0]!,
              handPayment: { count: 1, text: 'Escolha uma carta da mão.' },
            },
          ],
        },
      },
    ],
  }
  const updated = {
    ...ready,
    members: [
      {
        ...ready.members[0]!,
        player: { ...ready.members[0]!.player, health: 22, gold: 10 },
      },
    ],
  }
  let requests = 0
  server.use(
    http.post('*/parties/:partyId/session', () => HttpResponse.json(ready)),
    http.post('*/parties/:partyId/actions', async ({ request }) => {
      expect(await request.json()).toEqual({
        type: 'prepare',
        operation: 'activate',
        cardId: 'fixture.healing-potion',
        effectIndex: 0,
        payment: { handCards: [member.player.hand[0]] },
      })
      requests += 1
      if (requests === 1) {
        return HttpResponse.json(
          {
            error: {
              code: 'ACTION_NOT_ALLOWED',
              message: 'Pagamento recusado.',
              details: { reason: 'paymentInvalid' },
            },
          },
          { status: 409 },
        )
      }
      if (requests === 2) return HttpResponse.json({})
      return HttpResponse.json(updated)
    }),
  )
  renderParty(ready.id)
  const activate = await screen.findByRole('button', {
    name: 'Ativar Poção de Cura — efeito 1',
  })
  const choice = within(
    screen.getByRole('region', { name: 'Ativar efeitos' }),
  ).getAllByRole('checkbox')[0]!
  await waitFor(() => expect(choice).toHaveAccessibleName(/cópia 1/))
  fireEvent.click(choice)
  fireEvent.click(activate)
  await waitFor(() => expect(status()).toHaveTextContent('Pagamento recusado.'))
  expect(screen.getByText('Vida 17/22')).toBeInTheDocument()
  expect(choice).toBeChecked()
  fireEvent.click(activate)
  await waitFor(() =>
    expect(status()).toHaveTextContent(
      'Servidor indisponível. Tente novamente.',
    ),
  )
  expect(choice).toBeChecked()
  fireEvent.click(activate)
  await waitFor(() => expect(status()).toHaveTextContent('Efeito ativado.'))
  expect(screen.getByText('Vida 22/22')).toBeInTheDocument()
  expect(screen.getByText(/Ouro 10/)).toBeInTheDocument()
  expect(choice).not.toBeChecked()
  expect(activate).toBeDisabled()
})

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

describe('REQ-50: cofre na tela do grupo', () => {
  const [base] = partyInSessionFixture.members
  const lia = () => screen.findByRole('region', { name: 'Lia' })
  const follows = (a: Node, b: Node) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
  const texts = (list: HTMLElement) =>
    within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent)

  function sessionWithVault(
    vault: Party['members'][number]['player']['vault'],
  ): void {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: [{ ...base, player: { ...base.player, vault } }],
        }),
      ),
    )
  }

  it('REQ-50: cofre vazio mostra "Cofre vazio.", o ouro com a capacidade e "Nenhum deck guardado.", depois do inventário e antes da build', async () => {
    renderParty()
    const section = await lia()
    const vaultTitle = await within(section).findByRole('heading', {
      name: 'Cofre (0 de 30 slots)',
    })
    const gold = within(section).getByText('Ouro no cofre 0 (capacidade 2000)')
    const decksTitle = within(section).getByRole('heading', {
      name: 'Decks guardados (até 10 slots de deck, contando a build em uso)',
    })
    expect(within(section).getByText('Cofre vazio.')).toBeInTheDocument()
    expect(
      within(section).getByText('Nenhum deck guardado.'),
    ).toBeInTheDocument()
    const inventory = within(section).getByRole('heading', {
      name: 'Inventário (0 de 10 slots)',
    })
    const build = within(section).getByRole('heading', { name: /^Build/ })
    expect(follows(inventory, vaultTitle)).toBeTruthy()
    expect(follows(vaultTitle, gold)).toBeTruthy()
    expect(follows(gold, decksTitle)).toBeTruthy()
    expect(follows(decksTitle, build)).toBeTruthy()
  })

  it('REQ-50: slots e decks na ordem recebida, com "{quantity}× {nome}", "Deck {n}" e "{copies}× {nome}"', async () => {
    sessionWithVault({
      slots: [
        { cardId: 'fixture.silver-fish', quantity: 2 },
        { cardId: 'fixture.healing-potion', quantity: 1 },
      ],
      decks: [
        [
          { cardId: 'fixture.strength-basic', copies: 30 },
          { cardId: 'fixture.endurance-basic', copies: 30 },
        ],
        [{ cardId: 'fixture.endurance-basic', copies: 60 }],
      ],
      gold: 60,
    })
    renderParty()
    const section = await lia()
    const slots = await within(section).findByRole('list', {
      name: 'Cofre (2 de 30 slots)',
    })
    await waitFor(() =>
      expect(texts(slots)).toEqual(['2× Peixe Prateado', '1× Poção de Cura']),
    )
    expect(
      within(section).getByText('Ouro no cofre 60 (capacidade 2000)'),
    ).toBeInTheDocument()
    const decks = within(section).getByRole('list', {
      name: 'Decks guardados (até 10 slots de deck, contando a build em uso)',
    })
    expect(texts(within(decks).getByRole('list', { name: 'Deck 1' }))).toEqual([
      '30× Força',
      '30× Resistência',
    ])
    expect(texts(within(decks).getByRole('list', { name: 'Deck 2' }))).toEqual([
      '60× Resistência',
    ])
    expect(within(section).queryByText('Cofre vazio.')).not.toBeInTheDocument()
    expect(
      within(section).queryByText('Nenhum deck guardado.'),
    ).not.toBeInTheDocument()
  })

  it('REQ-50: o nome mostra "…" até a carta chegar', async () => {
    sessionWithVault({
      slots: [{ cardId: 'fixture.silver-fish', quantity: 1 }],
      decks: [],
      gold: 0,
    })
    server.use(
      http.get('*/catalog/cards/fixture.silver-fish', async () => {
        await new Promise(() => {})
      }),
    )
    renderParty()
    const slots = await within(await lia()).findByRole('list', {
      name: 'Cofre (1 de 30 slots)',
    })
    expect(within(slots).getByRole('listitem')).toHaveTextContent('1× …')
  })
})

describe('REQ-51: Vasculhar', () => {
  const fish = 'fixture.silver-fish'
  const fishName = 'Peixe Prateado'
  const [rod] = partyFishingRodInSessionFixture.members
  const scavengeButton = (name = fishName) =>
    screen.getByRole('button', { name: `Vasculhar ${name}` })

  function sessionWithTargets(scavengeTargets: string[]): void {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyFishingRodInSessionFixture,
          members: [{ ...rod, player: { ...rod.player, scavengeTargets } }],
        }),
      ),
    )
  }

  async function openRod(): Promise<void> {
    renderParty(partyFishingRodInSessionFixture.id)
    await screen.findByRole('button', { name: `Vasculhar ${fishName}` })
  }

  it('REQ-51: com scavenge, o grupo "Vasculhar" fica em "A vez", depois de "Ajustar deck", com um botão por carta de scavengeTargets, na ordem recebida', async () => {
    sessionWithTargets([fish, 'fixture.healing-potion'])
    renderParty(partyFishingRodInSessionFixture.id)
    const group = await screen.findByRole('group', { name: 'Vasculhar' })
    await waitFor(() =>
      expect(
        within(group)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual([`Vasculhar ${fishName}`, 'Vasculhar Poção de Cura']),
    )
    const adjust = screen.getByRole('button', { name: 'Ajustar deck' })
    expect(
      adjust.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'A vez' })).getByRole('group', {
        name: 'Vasculhar',
      }),
    ).toBe(group)
  })

  it('REQ-51: sem scavenge não há o grupo', async () => {
    renderParty()
    await screen.findByRole('button', { name: 'Ajustar deck' })
    expect(
      screen.queryByRole('group', { name: 'Vasculhar' }),
    ).not.toBeInTheDocument()
  })

  it('REQ-51: envia { scavenge, cardId } sem confirmação, desabilita os botões de ação e, com 200, mostra o Party e "Você achou {nome}."', async () => {
    let body: unknown
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyScavengedFixture)
      }),
    )
    await openRod()
    fireEvent.click(scavengeButton())
    await waitFor(() => expect(scavengeButton()).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Ajustar deck' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    expect(body).toEqual({ type: 'scavenge', cardId: fish })
    release()
    await waitFor(() =>
      expect(status()).toHaveTextContent(`Você achou ${fishName}.`),
    )
    expect(
      within(screen.getByRole('list', { name: /^Inventário/ }))
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['1× Vara de Pesca', `1× ${fishName}`])
    expect(screen.getByRole('region', { name: 'A vez' })).toHaveTextContent(
      '2 pontos de ação',
    )
  })

  it('REQ-51: com found false, "{nome} não estava no deck de recompensas."', async () => {
    const [scavenged] = partyScavengedFixture.members
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json({
          ...partyScavengedFixture,
          members: [
            {
              ...scavenged,
              player: {
                ...scavenged.player,
                inventory: [{ cardId: 'fixture.fishing-rod', quantity: 1 }],
                lastScavenge: { cardId: fish, found: false, delivery: 'none' },
              },
            },
          ],
        }),
      ),
    )
    await openRod()
    fireEvent.click(scavengeButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        `${fishName} não estava no deck de recompensas.`,
      ),
    )
  })

  it('REQ-51: 409 inventoryFull mostra a message e "Não há espaço no inventário."; nada muda', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(actionPrepareNotAllowedFixture('inventoryFull'), {
          status: 409,
        }),
      ),
    )
    await openRod()
    fireEvent.click(scavengeButton())
    await waitFor(() =>
      expect(status().textContent).toBe(
        'Esta ação não é permitida agora. Não há espaço no inventário.',
      ),
    )
    expect(scavengeButton()).toBeEnabled()
    expect(screen.getByRole('region', { name: 'A vez' })).toHaveTextContent(
      '3 pontos de ação',
    )
  })

  it('REQ-51: 409 com outro motivo (notScavengeable, pelo MSW) mostra só a message', async () => {
    sessionWithTargets(['fixture.healing-potion'])
    renderParty(partyFishingRodInSessionFixture.id)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Vasculhar Poção de Cura' }),
    )
    await waitFor(() =>
      expect(status().textContent).toBe('Esta ação não é permitida agora.'),
    )
  })

  it('REQ-51: outro erro §1.4 mostra a message e falha de rede o texto genérico (REQ-35)', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    await openRod()
    fireEvent.click(scavengeButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    fireEvent.click(scavengeButton())
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })
})

describe('REQ-52: Usar cofre', () => {
  const [base] = partyInSessionFixture.members
  const potion = 'fixture.healing-potion'
  const strength = 'fixture.strength-basic'
  const endurance = 'fixture.endurance-basic'
  const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
  const vaultButton = () =>
    within(turnRegion()).queryByRole('button', { name: 'Usar cofre' })
  const section = () => screen.queryByRole('region', { name: 'Usar cofre' })
  const form = (name: string) => within(section()!).getByRole('group', { name })
  const opsList = () =>
    within(section()!).getByRole('list', { name: 'Operações' })
  const opTexts = () =>
    within(opsList())
      .queryAllByRole('listitem')
      .map((li) => li.firstChild?.textContent)
  const inSection = (name: string) =>
    within(section()!).getByRole('button', { name })

  /** Lia com inventário, pasta, cofre com slots, um deck e ouro. */
  function richSession(): void {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json({
          ...partyInSessionFixture,
          members: [
            {
              ...base,
              player: {
                ...base.player,
                inventory: [{ cardId: potion, quantity: 3 }],
                tcgFolder: [{ cardId: 'fixture.dexterity-basic', copies: 2 }],
                vault: {
                  slots: [
                    { cardId: potion, quantity: 1 },
                    { cardId: strength, quantity: 10 },
                  ],
                  decks: [[{ cardId: endurance, copies: 60 }]],
                  gold: 100,
                },
              },
            },
          ],
        }),
      ),
    )
  }

  async function openSection(): Promise<void> {
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    await waitFor(() => expect(status()).toHaveTextContent(''))
    fireEvent.click(vaultButton()!)
    await screen.findByRole('region', { name: 'Usar cofre' })
  }

  function addGold(button: 'Guardar ouro' | 'Retirar ouro', amount: string) {
    const gold = form('Ouro')
    fireEvent.change(
      within(gold).getByRole('spinbutton', { name: 'Quantidade de ouro' }),
      { target: { value: amount } },
    )
    fireEvent.click(within(gold).getByRole('button', { name: button }))
  }

  async function addCard(
    formName: string,
    cardName: string,
    quantity: string,
  ): Promise<void> {
    const group = form(formName)
    const select = within(group).getByRole('combobox', { name: 'Carta' })
    const option = await within(select).findByRole('option', { name: cardName })
    fireEvent.change(select, {
      target: { value: (option as HTMLOptionElement).value },
    })
    fireEvent.change(
      within(group).getByRole('spinbutton', { name: 'Quantidade' }),
      { target: { value: quantity } },
    )
    fireEvent.click(within(group).getByRole('button', { name: 'Acrescentar' }))
  }

  function rejectWith(details: Record<string, unknown>): void {
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

  it('REQ-52: com useVault, "Usar cofre" fica em "A vez", depois do grupo "Vasculhar"', async () => {
    renderParty(partyFishingRodInSessionFixture.id)
    const group = await screen.findByRole('group', { name: 'Vasculhar' })
    expect(
      group.compareDocumentPosition(vaultButton()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-52: sem useVault não há botão', async () => {
    server.use(
      http.post('*/parties/:partyId/session', () =>
        HttpResponse.json(partyMovedToStoneBendFixture),
      ),
    )
    renderParty()
    await screen.findByRole('region', { name: 'A vez' })
    expect(vaultButton()).toBeNull()
  })

  it('REQ-52: abre a seção abaixo de "A vez" com "Nenhuma operação.", desabilita o botão e o Confirmar', async () => {
    await openSection()
    expect(vaultButton()).toBeDisabled()
    expect(
      turnRegion().compareDocumentPosition(section()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(section()).toHaveTextContent('Nenhuma operação.')
    expect(inSection('Confirmar (1 ponto de ação)')).toBeDisabled()
    for (const name of [
      'Guardar no cofre',
      'Retirar do cofre',
      'Descartar do cofre',
      'Ouro',
      'Guardar deck',
      'Editar build',
    ]) {
      expect(form(name)).toBeInTheDocument()
    }
  })

  it('REQ-52: as seleções mostram o estado recebido; sem carta escolhida, "Acrescentar" fica desabilitado', async () => {
    richSession()
    await openSection()
    const options = (name: string) =>
      within(within(form(name)).getByRole('combobox', { name: 'Carta' }))
        .getAllByRole('option')
        .slice(1)
        .map((o) => o.textContent)
    await waitFor(() =>
      expect(options('Guardar no cofre')).toEqual([
        'Destreza',
        'Poção de Cura',
      ]),
    )
    expect(options('Retirar do cofre')).toEqual(['Poção de Cura', 'Força'])
    expect(options('Descartar do cofre')).toEqual(['Poção de Cura', 'Força'])
    expect(
      within(form('Guardar no cofre')).getByRole('spinbutton', {
        name: 'Quantidade',
      }),
    ).toHaveValue(1)
    expect(
      within(form('Guardar no cofre')).getByRole('button', {
        name: 'Acrescentar',
      }),
    ).toBeDisabled()
    expect(form('Descartar do cofre')).toHaveTextContent(
      'A carta descartada vai para o limbo e não volta.',
    )
  })

  it('REQ-52: cada formulário só acrescenta à lista, com a descrição da operação; nada é enviado', async () => {
    const sent = vi.fn()
    server.use(
      http.post('*/parties/:partyId/actions', () => {
        sent()
        return HttpResponse.json(partyVaultUsedFixture)
      }),
    )
    richSession()
    await openSection()
    await addCard('Guardar no cofre', 'Poção de Cura', '2')
    await addCard('Retirar do cofre', 'Força', '3')
    await addCard('Descartar do cofre', 'Poção de Cura', '1')
    addGold('Guardar ouro', '60')
    addGold('Retirar ouro', '5')
    const deck = form('Guardar deck')
    fireEvent.change(
      within(deck).getByRole('spinbutton', { name: 'Cópias de Força' }),
      { target: { value: '7' } },
    )
    fireEvent.click(within(deck).getByRole('button', { name: 'Acrescentar' }))
    fireEvent.click(inSection('Desmontar deck 1'))
    fireEvent.click(inSection('Usar deck 1 como build'))
    const build = form('Editar build')
    expect(build).toHaveTextContent('Na build: 30')
    expect(build).toHaveTextContent('No cofre: 10')
    fireEvent.change(
      within(build).getByRole('spinbutton', {
        name: 'Cópias na build de Resistência',
      }),
      { target: { value: '0' } },
    )
    fireEvent.click(within(build).getByRole('button', { name: 'Acrescentar' }))
    expect(opTexts()).toEqual([
      '1. Guardar 2× Poção de Cura',
      '2. Retirar 3× Força',
      '3. Descartar 1× Poção de Cura',
      '4. Guardar 60 de ouro',
      '5. Retirar 5 de ouro',
      '6. Guardar deck de 7 cartas',
      '7. Desmontar deck 1',
      '8. Usar deck 1 como build',
      '9. Editar a build (30 cartas)',
    ])
    expect(section()).not.toHaveTextContent('Nenhuma operação.')
    expect(sent).not.toHaveBeenCalled()
  })

  it.each([
    [
      'Guardar no cofre',
      'Quantidade',
      '0',
      'Use um número inteiro a partir de 1.',
    ],
    ['Ouro', 'Quantidade de ouro', '', 'Use um número inteiro a partir de 1.'],
    [
      'Guardar deck',
      'Cópias de Força',
      '-1',
      'Use um número inteiro a partir de 0.',
    ],
    [
      'Editar build',
      'Cópias na build de Força',
      '1.5',
      'Use um número inteiro a partir de 0.',
    ],
  ])(
    'REQ-52: em "%s", "%s" com "%s" não acrescenta e mostra "%s" por aria-describedby',
    async (formName, fieldName, value, message) => {
      richSession()
      await openSection()
      const group = form(formName)
      if (formName === 'Guardar no cofre') {
        const select = within(group).getByRole('combobox', { name: 'Carta' })
        await within(select).findByRole('option', { name: 'Poção de Cura' })
        fireEvent.change(select, { target: { value: potion } })
      }
      const field = await within(group).findByRole('spinbutton', {
        name: fieldName,
      })
      fireEvent.change(field, { target: { value } })
      fireEvent.click(
        within(group).getByRole('button', {
          name: formName === 'Ouro' ? 'Guardar ouro' : 'Acrescentar',
        }),
      )
      expect(field).toHaveAccessibleDescription(message)
      expect(opTexts()).toEqual([])
    },
  )

  it('REQ-52: "Remover", "Subir" e "Descer" mudam a lista; nas pontas, Subir/Descer ficam desabilitados', async () => {
    await openSection()
    addGold('Guardar ouro', '1')
    addGold('Guardar ouro', '2')
    addGold('Guardar ouro', '3')
    const item = (i: number) => within(opsList()).getAllByRole('listitem')[i]
    expect(
      within(item(0)).getByRole('button', { name: 'Subir' }),
    ).toBeDisabled()
    expect(
      within(item(2)).getByRole('button', { name: 'Descer' }),
    ).toBeDisabled()
    fireEvent.click(within(item(0)).getByRole('button', { name: 'Descer' }))
    expect(opTexts()).toEqual([
      '1. Guardar 2 de ouro',
      '2. Guardar 1 de ouro',
      '3. Guardar 3 de ouro',
    ])
    fireEvent.click(within(item(2)).getByRole('button', { name: 'Subir' }))
    expect(opTexts()).toEqual([
      '1. Guardar 2 de ouro',
      '2. Guardar 3 de ouro',
      '3. Guardar 1 de ouro',
    ])
    fireEvent.click(within(item(1)).getByRole('button', { name: 'Remover' }))
    expect(opTexts()).toEqual(['1. Guardar 2 de ouro', '2. Guardar 1 de ouro'])
  })

  it('REQ-52: "Cancelar" fecha a seção sem enviar; ao reabrir, a lista começa vazia', async () => {
    const sent = vi.fn()
    server.use(
      http.post('*/parties/:partyId/actions', () => {
        sent()
        return HttpResponse.json(partyVaultUsedFixture)
      }),
    )
    await openSection()
    addGold('Guardar ouro', '60')
    fireEvent.click(inSection('Cancelar'))
    expect(section()).toBeNull()
    expect(vaultButton()).toBeEnabled()
    fireEvent.click(vaultButton()!)
    expect(section()).toHaveTextContent('Nenhuma operação.')
    expect(sent).not.toHaveBeenCalled()
  })

  it('REQ-52: "Confirmar" envia o lote na ordem da lista, com os botões desabilitados; com 200 fecha e mostra "Cofre: 3 operações feitas."', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        await gate
        return HttpResponse.json(partyVaultUsedFixture)
      }),
    )
    richSession()
    await openSection()
    await addCard('Guardar no cofre', 'Poção de Cura', '2')
    addGold('Guardar ouro', '60')
    await addCard('Descartar do cofre', 'Poção de Cura', '1')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(inSection('Confirmar (1 ponto de ação)')).toBeDisabled(),
    )
    expect(inSection('Cancelar')).toBeDisabled()
    expect(
      within(opsList()).getAllByRole('button', { name: 'Remover' })[0],
    ).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(body).toEqual({
      type: 'useVault',
      operations: [
        { operation: 'store', cardId: potion, quantity: 2 },
        { operation: 'storeGold', amount: 60 },
        { operation: 'discard', cardId: potion, quantity: 1 },
      ],
    })
    release()
    await waitFor(() =>
      expect(status()).toHaveTextContent('Cofre: 3 operações feitas.'),
    )
    expect(section()).toBeNull()
    expect(
      screen.getByText('Ouro no cofre 60 (capacidade 2000)'),
    ).toBeInTheDocument()
  })

  it('REQ-52: as operações de deck e de build vão no formato do contrato', async () => {
    let body: unknown
    server.use(
      http.post('*/parties/:partyId/actions', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(partyVaultUsedFixture)
      }),
    )
    richSession()
    await openSection()
    const deck = form('Guardar deck')
    fireEvent.change(
      await within(deck).findByRole('spinbutton', { name: 'Cópias de Força' }),
      { target: { value: '7' } },
    )
    fireEvent.click(within(deck).getByRole('button', { name: 'Acrescentar' }))
    fireEvent.click(inSection('Desmontar deck 1'))
    fireEvent.click(inSection('Usar deck 1 como build'))
    const build = form('Editar build')
    fireEvent.change(
      within(build).getByRole('spinbutton', {
        name: 'Cópias na build de Força',
      }),
      { target: { value: '40' } },
    )
    fireEvent.click(within(build).getByRole('button', { name: 'Acrescentar' }))
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Cofre: 4 operações feitas.'),
    )
    expect(body).toEqual({
      type: 'useVault',
      operations: [
        { operation: 'saveDeck', cards: [{ cardId: strength, copies: 7 }] },
        { operation: 'unpackDeck', deckIndex: 0 },
        { operation: 'swapBuild', deckIndex: 0 },
        {
          operation: 'editBuild',
          build: [
            { cardId: endurance, copies: 30 },
            { cardId: strength, copies: 40 },
          ],
        },
      ],
    })
  })

  it('REQ-52: "1 operação feita" no singular', async () => {
    await openSection()
    addGold('Guardar ouro', '60')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(status()).toHaveTextContent('Cofre: 1 operação feita.'),
    )
  })

  it('REQ-52: pelo MSW, o take de 5 é recusado: a seção fica aberta, o item 2 marcado "Recusada" e o texto de notInVault', async () => {
    richSession()
    await openSection()
    addGold('Retirar ouro', '10')
    await addCard('Retirar do cofre', 'Poção de Cura', '5')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'Esta ação não é permitida agora. Não há essa quantidade de Poção de Cura no cofre.',
      ),
    )
    const items = within(opsList()).getAllByRole('listitem')
    expect(items[0]).not.toHaveTextContent('Recusada')
    expect(items[1]).toHaveTextContent('Recusada')
    expect(status()).not.toHaveTextContent('Cofre:')
    expect(status()).not.toHaveTextContent('Esta ação')
  })

  it.each([
    [
      'notInInventory',
      'Poção de Cura não está no inventário nessa quantidade.',
    ],
    ['notInTcgFolder', 'Não há essas cópias de Poção de Cura na pasta de TCG.'],
    ['notStorable', 'Poção de Cura não pode ir para o cofre.'],
    ['vaultFull', 'O cofre está cheio.'],
    ['notEnoughGold', 'Não há ouro suficiente na bolsa.'],
    ['vaultGoldFull', 'O ouro passaria da capacidade do cofre.'],
    ['notEnoughVaultGold', 'Não há ouro suficiente no cofre.'],
    ['purseFull', 'O ouro passaria da capacidade da bolsa.'],
    ['notAttribute', 'Poção de Cura não é carta de atributo.'],
    ['deckSlotsFull', 'Não há slot de deck livre.'],
    ['deckNotFound', 'Esse deck guardado não existe.'],
    ['inventoryFull', 'Não há espaço no inventário.'],
    [
      'tcgFolderFull',
      'Não há espaço na pasta de TCG para as cartas que saíram da build.',
    ],
    ['buildBelowMinimum', 'A build ficou abaixo do mínimo de cartas.'],
    ['notOwned', 'Você não tem cópias suficientes de Poção de Cura.'],
    ['copyLimitExceeded', 'Poção de Cura passou do limite de cópias no deck.'],
  ])(
    'REQ-52: 409 %s, sem cardId, usa a carta da operação recusada: "%s"',
    async (reason, text) => {
      rejectWith({ reason, operationIndex: 0 })
      richSession()
      await openSection()
      await addCard('Guardar no cofre', 'Poção de Cura', '1')
      fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
      await waitFor(() =>
        expect(section()).toHaveTextContent(
          `Esta ação não é permitida agora. ${text}`,
        ),
      )
    },
  )

  it('REQ-52: 409 com cardId usa a carta de details.cardId', async () => {
    rejectWith({ reason: 'notStorable', cardId: strength, operationIndex: 0 })
    richSession()
    await openSection()
    await addCard('Guardar no cofre', 'Poção de Cura', '1')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(section()).toHaveTextContent('Força não pode ir para o cofre.'),
    )
  })

  it('REQ-52: 409 com outro motivo (noActionPoints) mostra só a message, sem marca', async () => {
    rejectWith({ reason: 'noActionPoints' })
    await openSection()
    addGold('Guardar ouro', '1')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(section()).toHaveTextContent('Esta ação não é permitida agora.'),
    )
    expect(opsList()).not.toHaveTextContent('Recusada')
    expect(opTexts()).toEqual(['1. Guardar 1 de ouro'])
  })

  it('REQ-52: editar a lista depois da recusa tira a marca e o texto', async () => {
    rejectWith({ reason: 'purseFull', operationIndex: 0 })
    await openSection()
    addGold('Retirar ouro', '1')
    addGold('Retirar ouro', '2')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() => expect(opsList()).toHaveTextContent('Recusada'))
    fireEvent.click(
      within(within(opsList()).getAllByRole('listitem')[1]).getByRole(
        'button',
        { name: 'Remover' },
      ),
    )
    expect(opsList()).not.toHaveTextContent('Recusada')
    expect(section()).not.toHaveTextContent('Esta ação não é permitida agora.')
  })

  it('REQ-52: outro erro §1.4 e falha de rede mantêm a seção com a lista', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(partySessionNotActiveFixture, { status: 409 }),
      ),
    )
    await openSection()
    addGold('Guardar ouro', '1')
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'Não há sessão em andamento neste grupo.',
      ),
    )
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    fireEvent.click(inSection('Confirmar (1 ponto de ação)'))
    await waitFor(() =>
      expect(section()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(opTexts()).toEqual(['1. Guardar 1 de ouro'])
  })
})
describe('REQ-61: combate solo', () => {
  const combatLog = () =>
    screen.getByRole('list', { name: 'Transições de combate' })
  it('revela, exibe o lote em ordem, ataca e restaura a recompensa após Reflexão fatal', async () => {
    const id = 'party-combat-solo'
    const first = renderParty(id)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Revelar carta' }),
    )
    const combat = await screen.findByRole('region', { name: 'Lobo Cinzento' })
    expect(within(combat).getByText(/Preparar/)).toBeInTheDocument()
    expect(endButton()).toBeDisabled()
    const log = screen.getByRole('list', { name: 'Transições de combate' })
    expect(
      within(log)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Combate iniciado'),
      expect.stringContaining('Turno de'),
    ])
    fireEvent.click(within(combat).getByRole('button', { name: /Atacar/ }))
    expect(await screen.findByText(/Vitória.*caído/)).toBeInTheDocument()
    first.unmount()
    renderParty(id)
    expect(await screen.findByText(/Vitória.*caído/)).toBeInTheDocument()
    expect(
      screen.queryByRole('list', { name: 'Transições de combate' }),
    ).not.toBeInTheDocument()
    const reward = await screen.findByRole('region', {
      name: 'Recompensa pendente',
    })
    fireEvent.click(within(reward).getByRole('button', { name: 'Deixar' }))
    await waitFor(() => expect(reward).not.toBeInTheDocument())
  })

  it('identifica os participantes quando o combate termina na própria revelação', async () => {
    renderParty('party-combat-immediate')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Revelar carta' }),
    )
    expect(await screen.findByText(/Vitória.*caído/)).toBeInTheDocument()
    expect(
      within(combatLog())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining('Combate iniciado'),
      expect.stringContaining('Turno de Lia'),
      expect.stringContaining('Lia → Lobo Cinzento'),
      expect.stringContaining('Combate encerrado'),
    ])
  })

  it('restaura um combate em andamento sem repetir o lote anterior', async () => {
    const id = 'party-combat-active'
    const { unmount } = renderParty(id)
    const ability = await screen.findByRole('button', {
      name: 'Usar habilidade',
    })
    fireEvent.click(ability)
    expect(await screen.findByText(/usou strike/)).toBeInTheDocument()
    unmount()
    renderParty(id)
    const combat = await screen.findByRole('region', { name: 'Lobo Cinzento' })
    expect(
      within(combat).getByText(/Turno de Lia.*Preparar/),
    ).toBeInTheDocument()
    expect(
      within(combat).queryByRole('button', { name: 'Usar habilidade' }),
    ).not.toBeInTheDocument()
    expect(within(combat).getByRole('button', { name: /Atacar/ })).toBeEnabled()
    expect(
      screen.queryByRole('list', { name: 'Transições de combate' }),
    ).not.toBeInTheDocument()
  })

  it('envia os custos manuais agregados de uma habilidade em Preparar com 0 PA', async () => {
    renderParty('party-combat-prepare')
    const ability = await screen.findByRole('group', {
      name: /Preparar habilidade/,
    })
    const use = within(ability).getByRole('button', { name: 'Usar habilidade' })
    expect(use).toBeDisabled()
    for (const quantity of within(ability).getAllByRole('spinbutton')) {
      fireEvent.change(quantity, { target: { value: '1' } })
    }
    fireEvent.click(within(ability).getByRole('checkbox', { name: /h1/ }))
    fireEvent.click(within(ability).getByRole('checkbox', { name: /weapon/ }))
    fireEvent.click(use)
    expect(await screen.findByText('Habilidade usada.')).toBeInTheDocument()
  })

  it.each([
    ['Fugir', 'Fuga'],
    ['Encerrar turno de combate', 'Derrota'],
  ])('mostra o desfecho ao escolher %s', async (name, result) => {
    renderParty('party-combat-active')
    fireEvent.click(
      await screen.findByRole('button', {
        name: name === 'Fugir' ? /Fugir/ : name,
      }),
    )
    expect(
      await screen.findByText(new RegExp(result + ' ·')),
    ).toBeInTheDocument()
  })

  it.each([
    ['Usar habilidade', /usou strike/],
    ['Ativar efeito', /ativou focus/],
  ])('envia os IDs projetados ao escolher %s', async (button, message) => {
    renderParty('party-combat-active')
    const action = await screen.findByRole('button', { name: button })
    const combat = screen.getByRole('region', { name: 'Lobo Cinzento' })
    expect(within(combat).getByRole('combobox', { name: 'Alvo' })).toHaveValue(
      'wolf-1',
    )
    fireEvent.click(action)
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(
      within(combat).queryByRole('button', { name: button }),
    ).not.toBeInTheDocument()
  })

  it('preserva o turno e o lote confirmado se o POST recusar a ação', async () => {
    renderParty('party-combat-solo')
    fireEvent.click(
      await screen.findByRole('button', { name: 'Revelar carta' }),
    )
    const attack = await screen.findByRole('button', { name: /Atacar Lobo/ })
    server.use(
      http.post(
        '*/parties/party-combat-solo/actions',
        () =>
          HttpResponse.json(
            {
              error: {
                code: 'ACTION_NOT_ALLOWED',
                message: 'Ação recusada.',
                details: { reason: 'combatTargetUnavailable' },
              },
            },
            { status: 409 },
          ),
        { once: true },
      ),
    )
    fireEvent.click(attack)
    await waitFor(() => expect(status()).toHaveTextContent('Ação recusada.'))
    expect(attack).toBeEnabled()
    expect(combatLog()).toHaveTextContent('Combate iniciado')
    fireEvent.click(attack)
    expect(await screen.findByText(/Vitória.*caído/)).toBeInTheDocument()
  })
})
