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
import type { ServiceView } from '../../api/blacksmith'
import type { Party } from '../../api/parties'
import { handlers } from '../../mocks/handlers'
import {
  blacksmithRefusalFixture,
  partyArtificerFixture,
  partyBlacksmithFixture,
} from '../../mocks/blacksmithFixtures'

vi.setConfig({ testTimeout: 15000 })

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

const [base] = partyBlacksmithFixture.members
const view = base.player.blacksmith!
const sword = view.blacksmith!.equipment[0]!
type Player = typeof base.player

function renderParty(partyId = partyBlacksmithFixture.id) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/grupo/${partyId}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function sessionWith(player: Partial<Player>): void {
  const party: Party = {
    ...partyBlacksmithFixture,
    members: [{ ...base, player: { ...base.player, ...player } }],
  }
  server.use(
    http.post('*/parties/:partyId/session', () => HttpResponse.json(party)),
  )
}

/** Ferreiro com uma lista de equipamentos própria. */
function smithyWith(
  equipment: ServiceView['equipment'],
  extra: Partial<NonNullable<Player['blacksmith']>> = {},
): void {
  sessionWith({
    blacksmith: { ...view, blacksmith: { equipment }, ...extra },
  })
}

const turnRegion = () => screen.getByRole('region', { name: 'A vez' })
const section = (name = 'Ferreiro') => screen.getByRole('region', { name })
const inSection = (name: string | RegExp, region = 'Ferreiro') =>
  within(section(region)).getByRole('button', { name })
const operations = (region = 'Ferreiro') =>
  within(within(section(region)).getByRole('list', { name: 'Operações' }))
    .queryAllByRole('listitem')
    .map((li) => li.querySelector('span')?.textContent)
const equipmentItem = (region = 'Ferreiro') =>
  within(
    within(section(region)).getByRole('list', { name: 'Equipamentos' }),
  ).getAllByRole('listitem')[0]!

async function openSection(
  button = 'Ir ao Ferreiro',
  region = 'Ferreiro',
): Promise<void> {
  fireEvent.click(
    await within(
      await screen.findByRole('region', { name: 'A vez' }),
    ).findByRole('button', { name: button }),
  )
  await screen.findByRole('region', { name: region })
}

function captureActions(respond: () => Response): { sent: unknown[] } {
  const box: { sent: unknown[] } = { sent: [] }
  server.use(
    http.post('*/parties/:partyId/actions', async ({ request }) => {
      box.sent.push(await request.json())
      return respond()
    }),
  )
  return box
}

describe('REQ-80: Ir ao Ferreiro e Oficina, o que é oferecido', () => {
  it('REQ-80: "Ir ao Ferreiro" fica logo antes de "Ir ao Mercado"; sem Oficina sem a ação', async () => {
    renderParty()
    await openSection()
    const names = within(turnRegion())
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(
      names.indexOf('Ir ao Mercado') - names.indexOf('Ir ao Ferreiro'),
    ).toBe(1)
    expect(names).not.toContain('Oficina do Artífice')
  })

  it('REQ-80: sem visitBlacksmith não há botão', async () => {
    sessionWith({
      availableActions: base.player.availableActions.filter(
        (a) => a !== 'visitBlacksmith',
      ),
    })
    renderParty()
    await within(
      await screen.findByRole('region', { name: 'A vez' }),
    ).findByRole('button', { name: 'Ir ao Mercado' })
    expect(
      within(turnRegion()).queryByRole('button', { name: 'Ir ao Ferreiro' }),
    ).toBeNull()
  })

  it('REQ-80: com Artífice os dois botões seguem a ordem de availableActions e ficam desabilitados com a seção aberta', async () => {
    renderParty(partyArtificerFixture.id)
    await openSection()
    const names = within(turnRegion())
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(names.indexOf('Oficina do Artífice')).toBeLessThan(
      names.indexOf('Ir ao Ferreiro'),
    )
    expect(
      within(turnRegion()).getByRole('button', { name: 'Ir ao Ferreiro' }),
    ).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', {
        name: 'Oficina do Artífice',
      }),
    ).toBeDisabled()
  })

  it('REQ-80: a seção mostra ouro, aviso de PA, equipamento, encantamento e receita', async () => {
    renderParty()
    await openSection()
    const s = section()
    expect(s).toHaveTextContent('Ouro na bolsa 300')
    expect(s).toHaveTextContent('Gasta todos os pontos de ação restantes (3).')
    const item = equipmentItem()
    expect(item).toHaveTextContent('Espada Curta — Em uso: Arma')
    expect(item).toHaveTextContent(
      'Refinar para +1 — 1× Minério de Ferro, 10 de ouro, sem teste',
    )
    expect(item).toHaveTextContent(
      'Fio de Brasa — 1× Fragmento de Brasa, 50 de ouro, sem teste; requer refino +2',
    )
    expect(within(s).getByRole('list', { name: 'Receitas' })).toHaveTextContent(
      'Projeto: Espada Curta: cria Espada Curta — 2× Minério de Ferro, 15 de ouro',
    )
    expect(inSection('Criar Espada Curta')).toBeEnabled()
  })

  it('REQ-80/REQ-81: cada refino do mesmo alvo usa o passo seguinte; o total soma e remover recalcula', async () => {
    renderParty()
    await openSection()
    for (let i = 0; i < 4; i++)
      fireEvent.click(inSection('Refinar Espada Curta'))
    expect(operations()).toEqual([
      '1. Refinar Espada Curta para +1',
      '2. Refinar Espada Curta para +2',
      '3. Refinar Espada Curta para +3',
      '4. Refinar Espada Curta para +4',
    ])
    expect(equipmentItem()).toHaveTextContent(
      'Refinar para +5 — 1× Minério de Ferro, 50 de ouro, D20 ≥ 21; quebra se falhar',
    )
    expect(section()).toHaveTextContent('Total previsto: 100 de ouro')
    fireEvent.click(
      within(
        within(section()).getByRole('list', { name: 'Operações' }),
      ).getAllByRole('button', { name: 'Remover' })[0]!,
    )
    expect(operations()).toEqual([
      '1. Refinar Espada Curta para +1',
      '2. Refinar Espada Curta para +2',
      '3. Refinar Espada Curta para +3',
    ])
    expect(section()).toHaveTextContent('Total previsto: 60 de ouro')
  })

  it('REQ-80: sem mais passos, o botão de refino fica desabilitado e o texto some', async () => {
    smithyWith([{ ...sword, refineSteps: sword.refineSteps.slice(0, 1) }])
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    expect(inSection('Refinar Espada Curta')).toBeDisabled()
    expect(equipmentItem()).not.toHaveTextContent('Refinar para')
  })

  it('REQ-80: conserto, substituição e encantamento extra montam as operações', async () => {
    const state = {
      ...sword.state,
      enchantments: [
        {
          enchantment: view.enchantments[0]!.enchantment,
          zoneId: 'fixture.gray-harbor',
          slotIndex: 0,
          active: true,
        },
      ],
      broken: true,
    }
    smithyWith([
      {
        ...sword,
        state,
        repair: { gold: 11 },
        enchantOptions: [
          {
            enchantmentId: 'ember-edge',
            replaceRequired: true,
            extra: true,
            requiresRefinement: 0,
          },
        ],
      },
    ])
    const box = captureActions(() => HttpResponse.json(partyBlacksmithFixture))
    renderParty()
    await openSection()
    const item = equipmentItem()
    expect(item).toHaveTextContent(
      'Espada Curta, quebrado, encantamentos: Fio de Brasa — Em uso: Arma',
    )
    expect(item).toHaveTextContent('Consertar — 11 de ouro')
    expect(item).toHaveTextContent(
      'Fio de Brasa — 1× Fragmento de Brasa, 50 de ouro, sem teste; encantamento extra',
    )
    const replace = within(item).getByRole('combobox', { name: 'Substituir' })
    expect(
      within(replace)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['1: Fio de Brasa'])
    fireEvent.click(inSection('Consertar Espada Curta'))
    fireEvent.click(inSection('Encantar Espada Curta com Fio de Brasa'))
    expect(operations()).toEqual([
      '1. Consertar Espada Curta',
      '2. Encantar Espada Curta com Fio de Brasa',
    ])
    expect(section()).toHaveTextContent('Total previsto: 61 de ouro')
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await waitFor(() => expect(box.sent).toHaveLength(1))
    expect(box.sent[0]).toEqual({
      type: 'visitBlacksmith',
      operations: [
        { operation: 'repair', target: sword.target },
        {
          operation: 'enchant',
          target: sword.target,
          enchantmentId: 'ember-edge',
          extra: true,
          replaceIndex: 0,
        },
      ],
    })
  })

  it('REQ-80: equipamento no inventário mostra o slot; receita sem recursos e consumida; lista vazia', async () => {
    smithyWith(
      [
        {
          ...sword,
          target: { location: 'inventory', inventorySlotIndex: 1 },
        },
      ],
      {
        recipes: [{ ...view.recipes[0]!, canCraft: false, consumed: true }],
      },
    )
    renderParty()
    await openSection()
    expect(equipmentItem()).toHaveTextContent(
      'Espada Curta — Inventário, slot 2',
    )
    expect(
      within(section()).getByRole('list', { name: 'Receitas' }),
    ).toHaveTextContent('15 de ouro, consumida (faltam materiais ou ouro)')
    expect(inSection('Criar Espada Curta')).toBeEnabled()
  })

  it('REQ-80: sem receitas mostra "Nenhuma receita no inventário."', async () => {
    smithyWith([sword], { recipes: [] })
    renderParty()
    await openSection()
    expect(section()).toHaveTextContent('Nenhuma receita no inventário.')
  })

  it('REQ-80: com a vista null mostra o erro de servidor e nenhum grupo', async () => {
    sessionWith({ blacksmith: null })
    renderParty()
    await openSection()
    expect(section()).toHaveTextContent(
      'Servidor indisponível. Tente novamente.',
    )
    expect(
      within(section()).queryByRole('list', { name: 'Equipamentos' }),
    ).toBeNull()
  })

  it('REQ-80: a Oficina gasta 1 PA e mostra o bônus do teste', async () => {
    renderParty(partyArtificerFixture.id)
    await openSection('Oficina do Artífice', 'Oficina do Artífice')
    const s = section('Oficina do Artífice')
    expect(s).toHaveTextContent('Gasta 1 ponto de ação.')
    for (let i = 0; i < 3; i++)
      fireEvent.click(inSection('Refinar Espada Curta', 'Oficina do Artífice'))
    expect(equipmentItem('Oficina do Artífice')).toHaveTextContent(
      'Refinar para +4 — 1× Minério de Ferro, 40 de ouro, D20 + 2 ≥ 8',
    )
    expect(
      inSection('Confirmar (1 ponto de ação)', 'Oficina do Artífice'),
    ).toBeEnabled()
  })
})

describe('REQ-81: lote, confirmação e resultado', () => {
  it('REQ-81: lista vazia, Confirmar desabilitado e Cancelar fecha sem enviar', async () => {
    const box = captureActions(() => HttpResponse.json(partyBlacksmithFixture))
    renderParty()
    await openSection()
    expect(section()).toHaveTextContent('Nenhuma operação.')
    expect(inSection('Confirmar (todos os pontos de ação)')).toBeDisabled()
    fireEvent.click(inSection('Cancelar'))
    expect(screen.queryByRole('region', { name: 'Ferreiro' })).toBeNull()
    expect(box.sent).toEqual([])
  })

  it('REQ-81: Subir e Descer reordenam e recalculam os refinos pela posição', async () => {
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    fireEvent.click(inSection('Criar Espada Curta'))
    fireEvent.click(
      within(
        within(section()).getByRole('list', { name: 'Operações' }),
      ).getAllByRole('button', { name: 'Subir' })[1]!,
    )
    expect(operations()).toEqual([
      '1. Criar Espada Curta',
      '2. Refinar Espada Curta para +1',
    ])
    expect(section()).toHaveTextContent('Total previsto: 25 de ouro')
  })

  it('REQ-81: com 50 operações os botões de acrescentar ficam desabilitados', async () => {
    renderParty()
    await openSection()
    for (let i = 0; i < 50; i++)
      fireEvent.click(inSection('Criar Espada Curta'))
    expect(inSection('Criar Espada Curta')).toBeDisabled()
    expect(inSection('Refinar Espada Curta')).toBeDisabled()
    expect(inSection('Encantar Espada Curta com Fio de Brasa')).toBeDisabled()
  })

  it('REQ-81: Confirmar envia o lote, fecha a seção e mostra status e resultado com falha, quebra e pulada', async () => {
    // Handler padrão: lote com `enchant` → "Lote com falha e quebra".
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    fireEvent.click(inSection('Encantar Espada Curta com Fio de Brasa'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Ferreiro' })).toBeNull(),
    )
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Ferreiro: 2 operações, 3 pontos de ação gastos.',
    )
    const results = screen.getByRole('list', { name: 'Resultado do ferreiro' })
    expect(
      within(results)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      'Refinou Espada Curta para +1 por 10 de ouro.',
      'Refinou Espada Curta para +2 por 20 de ouro.',
      'Encantou Espada Curta com Fio de Brasa por 50 de ouro.',
      'Refinou Espada Curta para +3 por 30 de ouro.',
      'Falhou ao refinar Espada Curta para +4: 40 de ouro perdidos, D20 14 contra 21. Espada Curta quebrou.',
      'Refinar Espada Curta para +4: não feito (a operação anterior falhou).',
    ])
  })

  it('REQ-81: conserto mostra o singular e as marcas; criar mostra a carta criada', async () => {
    smithyWith([{ ...sword, repair: { gold: 11 } }])
    renderParty()
    await openSection()
    fireEvent.click(inSection('Consertar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    expect(
      await screen.findByRole('list', { name: 'Resultado do ferreiro' }),
    ).toHaveTextContent('Consertou Espada Curta por 11 de ouro (Reparado ×1).')
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Ferreiro: 1 operação, 3 pontos de ação gastos.',
    )
  })

  it('REQ-81: criar mostra "Criou {equipamento} por {gold} de ouro."', async () => {
    renderParty()
    await openSection()
    fireEvent.click(inSection('Criar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    expect(
      await screen.findByRole('list', { name: 'Resultado do ferreiro' }),
    ).toHaveTextContent('Criou Espada Curta por 15 de ouro.')
  })

  it('REQ-81: a Oficina envia artificerWorkshop e mostra o status no singular', async () => {
    let sent: unknown
    server.events.on('request:start', async ({ request }) => {
      if (request.url.endsWith('/actions')) sent = await request.clone().json()
    })
    renderParty(partyArtificerFixture.id)
    await openSection('Oficina do Artífice', 'Oficina do Artífice')
    fireEvent.click(inSection('Refinar Espada Curta', 'Oficina do Artífice'))
    fireEvent.click(
      inSection('Confirmar (1 ponto de ação)', 'Oficina do Artífice'),
    )
    expect(
      await screen.findByRole('list', { name: 'Resultado do ferreiro' }),
    ).toHaveTextContent('Refinou Espada Curta para +1 por 10 de ouro.')
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Oficina do Artífice: 1 operação, 1 ponto de ação gasto.',
    )
    expect(sent).toEqual({
      type: 'artificerWorkshop',
      operations: [{ operation: 'refine', target: sword.target }],
    })
  })

  it('REQ-81: os botões ficam desabilitados enquanto o pedido está em curso', async () => {
    let release: () => void = () => undefined
    server.use(
      http.post('*/parties/:partyId/actions', async () => {
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return HttpResponse.json(partyBlacksmithFixture)
      }),
    )
    renderParty()
    await openSection()
    fireEvent.click(inSection('Criar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await waitFor(() => expect(inSection('Cancelar')).toBeDisabled())
    expect(inSection('Criar Espada Curta')).toBeDisabled()
    expect(inSection('Remover')).toBeDisabled()
    expect(
      within(turnRegion()).getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeDisabled()
    release()
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Ferreiro' })).toBeNull(),
    )
  })

  it('REQ-81: 409 com operationIndex marca a operação e mostra o texto do motivo', async () => {
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await within(section()).findByText('Recusada')
    expect(section()).toHaveTextContent(
      'Esta ação não é permitida agora. Espada Curta está quebrado: conserte antes.',
    )
    expect(operations()).toEqual(['1. Refinar Espada Curta para +1'])
  })

  it.each([
    ['equipmentNotFound', 'Esse equipamento não está mais lá.'],
    ['notBroken', 'Espada Curta não está quebrado.'],
    ['notRefinable', 'Espada Curta não pode ser refinado.'],
    [
      'refinementMaterialsMissing',
      'Espada Curta não tem materiais de refino definidos.',
    ],
    ['refineLevelMax', 'Espada Curta já está no refino máximo.'],
    ['refineLevelTooHigh', 'A Oficina não refina acima desse nível.'],
    ['enchantNotAvailable', 'A Oficina não encanta.'],
    ['enchantmentNotOffered', 'Este ferreiro não oferece esse encantamento.'],
    ['notEnchantable', 'Espada Curta não pode ser encantado.'],
    [
      'enchantSlotUnavailable',
      'Espada Curta não tem slot para esse encantamento.',
    ],
    ['replaceIndexRequired', 'Escolha o encantamento a substituir.'],
    ['replaceIndexInvalid', 'O encantamento a substituir não existe.'],
    ['recipeMissing', 'Projeto: Espada Curta não é uma receita.'],
    ['materialsMissing', 'Faltam materiais.'],
    ['notEnoughGold', 'Não há ouro suficiente na bolsa.'],
    ['inventoryFull', 'Não há espaço no inventário.'],
    [
      'notInInventory',
      'Projeto: Espada Curta não está no inventário nessa quantidade.',
    ],
  ])('REQ-81: motivo %s mostra o texto', async (reason, text) => {
    const cardId = ['recipeMissing', 'notInInventory'].includes(reason)
      ? 'fixture.sword-blueprint'
      : 'fixture.short-sword'
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          blacksmithRefusalFixture({ reason, operationIndex: 0, cardId }),
          { status: 409 },
        ),
      ),
    )
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await within(section()).findByText('Recusada')
    expect(section()).toHaveTextContent(
      `Esta ação não é permitida agora. ${text}`,
    )
  })

  it('REQ-81: motivo desconhecido mostra só a message', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          blacksmithRefusalFixture({
            reason: 'notConnected',
            operationIndex: 0,
          }),
          { status: 409 },
        ),
      ),
    )
    renderParty()
    await openSection()
    fireEvent.click(inSection('Refinar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await within(section()).findByText('Recusada')
    expect(
      within(section()).getByText('Esta ação não é permitida agora.'),
    ).toBeVisible()
  })

  it('REQ-81: 409 sem operationIndex mostra a message na área de status, sem marcar item', async () => {
    renderParty(partyArtificerFixture.id)
    server.use(
      http.post('*/parties/:partyId/actions', () =>
        HttpResponse.json(
          blacksmithRefusalFixture({ reason: 'artificerInactive' }),
          { status: 409 },
        ),
      ),
    )
    await openSection('Oficina do Artífice', 'Oficina do Artífice')
    fireEvent.click(inSection('Refinar Espada Curta', 'Oficina do Artífice'))
    fireEvent.click(
      inSection('Confirmar (1 ponto de ação)', 'Oficina do Artífice'),
    )
    await waitFor(() =>
      expect(screen.getAllByRole('status')[0]).toHaveTextContent(
        'Esta ação não é permitida agora.',
      ),
    )
    expect(
      within(section('Oficina do Artífice')).queryByText('Recusada'),
    ).toBeNull()
    expect(section('Oficina do Artífice')).not.toHaveTextContent(
      'Esta ação não é permitida agora.',
    )
  })

  it('REQ-81: falha de rede mostra o erro genérico na seção e mantém a lista', async () => {
    server.use(
      http.post('*/parties/:partyId/actions', () => HttpResponse.error()),
    )
    renderParty()
    await openSection()
    fireEvent.click(inSection('Criar Espada Curta'))
    fireEvent.click(inSection('Confirmar (todos os pontos de ação)'))
    await within(section()).findByText(
      'Servidor indisponível. Tente novamente.',
    )
    expect(operations()).toEqual(['1. Criar Espada Curta'])
  })
})
