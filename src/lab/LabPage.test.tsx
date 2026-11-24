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
import {
  internalErrorFixture,
  labConfigDefaultsFixture,
  labConfigInvalidFixture,
  labConfigMarketFactorFixture,
  labConfigMinAboveMaxFixture,
  labConfigNotIntegerFixture,
  labConfigSumMismatchFixture,
  labConfigUpdatedFixture,
  notFoundFixture,
} from '../mocks/fixtures'
import { handlers } from '../mocks/handlers'
import LabPage from './LabPage'

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

function renderLab(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/lab']}>
        <LabPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('REQ-65: exibe os ajustes de nocaute, salva, associa erros e restaura os padrões', async () => {
  renderLab()
  const fields = [
    ['Vida no respawn (% da vida máxima)', 10, '1', '100'],
    ['Perda de Pico no nocaute (%)', 10, '0', '100'],
    ['Teto de Vigor no respawn (% do Pico)', 50, '0', '100'],
    ['Perda de ouro da bolsa no nocaute solo (%)', 10, '0', '100'],
    ['Rodadas de espera no nocaute solo', 1, '0', '10'],
  ] as const
  const inputs = []
  for (const [name, value, min, max] of fields) {
    const input = await screen.findByRole('spinbutton', { name })
    expect(input).toHaveValue(value)
    expect(input).toHaveAttribute('min', min)
    expect(input).toHaveAttribute('max', max)
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining(String(value)),
    )
    inputs.push(input)
  }
  const health = inputs[0]!
  const wait = inputs[4]!
  fireEvent.change(health, { target: { value: '0' } })
  fireEvent.change(wait, { target: { value: '1.5' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => {
    expect(health).toHaveAttribute('aria-invalid', 'true')
    expect(wait).toHaveAccessibleDescription(
      expect.stringContaining('Use um número inteiro.'),
    )
  })
  fireEvent.change(health, { target: { value: '10' } })
  fireEvent.change(wait, { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Configuração salva.')).toBeVisible()
  expect(wait).toHaveValue(0)
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))
  await waitFor(() => expect(wait).toHaveValue(1))
})

describe('REQ-18: link do editor', () => {
  it('REQ-18: /lab tem o link "Editor de conteúdo" para /lab/editor', () => {
    renderLab()
    expect(
      screen.getByRole('link', { name: 'Editor de conteúdo' }),
    ).toHaveAttribute('href', '/lab/editor')
  })
})

const labels = [
  ['minPlayers', 'Jogadores (mínimo)'],
  ['maxPlayers', 'Jogadores (máximo)'],
  ['actionPointsPerTurn', 'Pontos de ação por vez'],
  ['initialPeak', 'Pico inicial'],
  ['initialVigor', 'Vigor inicial'],
  ['baseHealth', 'Vida base'],
  ['initialGold', 'Ouro inicial'],
  ['initialHandSize', 'Mão inicial'],
  // FEAT-06 (REQ-27)
  ['minDeckSize', 'Tamanho mínimo da build'],
  ['lockOneEssential', 'Trava (classe com 1 essencial)'],
  ['lockTwoEssentials', 'Trava (classe com 2 essenciais)'],
  ['mapMaxAttempts', 'Tentativas do gerador de mapa'],
  ['defaultAttack', 'Ataque padrão'],
  ['defaultDefense', 'Defesa padrão'],
  ['defaultAccuracy', 'Precisão padrão'],
  ['defaultEvasion', 'Esquiva padrão'],
  ['defaultCelerity', 'Celeridade padrão'],
  ['defaultPiercing', 'Perfuração padrão'],
  ['defaultReflection', 'Reflexão padrão'],
  // FEAT-09 (REQ-39)
  ['maxCopiesPerCard', 'Cópias máximas por carta no deck'],
  ['tcgFolderCapacity', 'Capacidade da pasta de TCG'],
  ['recoverHealthPercent', 'Recuperar: % da vida máxima'],
  ['recoverVigorPercent', 'Recuperar: % do Pico em Vigor'],
  ['recoverHandSize', 'Recuperar: comprar até (cartas na mão)'],
  // FEAT-10 (REQ-43)
  ['inventoryCapacity', 'Capacidade do inventário'],
  ['purseCapacity', 'Capacidade da bolsa'],
  // FEAT-32 (REQ-47)
  ['vaultCapacity', 'Capacidade do cofre'],
  ['vaultDeckSlots', 'Slots de decks do cofre (a build em uso ocupa um)'],
  ['vaultGoldCapacity', 'Capacidade de ouro do cofre'],
] as const

/** FEAT-16 (REQ-71): as 37 chaves, na ordem da tela, depois das anteriores. */
const marketLabels = [
  ['singlesShowcaseSlots', 'Slots da vitrine de singles'],
  ['singlesDecayMax', 'Decaimento dos singles (D20 até)'],
  ['singlesPoolSize', 'Tamanho do pool de singles'],
  ['marketFactorMinPercent', 'Fator do mercado mínimo (%)'],
  ['marketFactorMaxPercent', 'Fator do mercado máximo (%)'],
  ['singlesStockCommon', 'Estoque de single Comum'],
  ['singlesStockUncommon', 'Estoque de single Incomum'],
  ['singlesStockRare', 'Estoque de single Rara'],
  ['singlesStockEpic', 'Estoque de single Épica'],
  ['singlesStockLegendary', 'Estoque de single Lendária'],
  ['singlesPriceCommon', 'Preço base Comum'],
  ['singlesPriceUncommon', 'Preço base Incomum'],
  ['singlesPriceRare', 'Preço base Rara'],
  ['singlesPriceEpic', 'Preço base Épica'],
  ['singlesPriceLegendary', 'Preço base Lendária'],
  ['scarcityStepPercent', 'Escassez por cópia vendida (%)'],
  ['treasureValueCommon', 'Valor de tesouro Comum'],
  ['treasureValueUncommon', 'Valor de tesouro Incomum'],
  ['treasureValueRare', 'Valor de tesouro Rara'],
  ['treasureValueEpic', 'Valor de tesouro Épica'],
  ['treasureValueLegendary', 'Valor de tesouro Lendária'],
  ['boosterPrice', 'Preço do booster'],
  ['boosterCardCount', 'Cartas por booster'],
  ['boosterSalePrice', 'Venda do booster fechado'],
  ['boosterChanceCommon', 'Chance Comum no booster (milésimos)'],
  ['boosterChanceUncommon', 'Chance Incomum no booster (milésimos)'],
  ['boosterChanceRare', 'Chance Rara no booster (milésimos)'],
  ['boosterChanceEpic', 'Chance Épica no booster (milésimos)'],
  ['boosterChanceLegendary', 'Chance Lendária no booster (milésimos)'],
  ['vaultExpansionSlots', 'Slots por expansão do cofre'],
  ['vaultExpansionBasePrice', 'Preço base da expansão do cofre'],
  ['deckSlotExpansionSlots', 'Slots por expansão de deck'],
  ['deckSlotExpansionBasePrice', 'Preço base do slot de deck'],
  ['tcgFolderExpansionSlots', 'Cartas por expansão da pasta de TCG'],
  ['tcgFolderExpansionBasePrice', 'Preço base da expansão da pasta de TCG'],
  [
    'purseExpansionPricePercent',
    'Preço da expansão da bolsa (% da capacidade)',
  ],
  [
    'vaultGoldExpansionPricePercent',
    'Preço da expansão do ouro do cofre (% da capacidade)',
  ],
] as const

// T-70 (autor, 2026-11-23): com as 37 chaves da FEAT-16 a página tem cerca de
// 100 campos e cada consulta por papel fica lenta no jsdom; na suíte inteira
// um teste passava dos 5 s. Só o prazo muda, nenhuma asserção.
vi.setConfig({ testTimeout: 15_000 })

async function loaded(): Promise<void> {
  await screen.findByRole('spinbutton', { name: 'Pontos de ação por vez' })
}

const field = (name: string) => screen.getByRole('spinbutton', { name })
const saveButton = () => screen.getByRole('button', { name: 'Salvar' })
/** Área de status da seção "Configuração" (o Catálogo tem a sua, T-15). */
const configStatus = () =>
  within(screen.getByRole('region', { name: 'Configuração' })).getByRole(
    'status',
  )

function setField(name: string, value: string): void {
  fireEvent.change(field(name), { target: { value } })
}

describe('REQ-06: configuração ajustável do jogo', () => {
  it('REQ-06: com o GET em andamento, a área de status mostra "Carregando configuração…"', async () => {
    renderLab()
    expect(configStatus()).toHaveTextContent('Carregando configuração…')
    await loaded()
  })

  it('REQ-06: cada chave tem campo numérico rotulado com o valor de values e o texto de padrão e limites', async () => {
    renderLab()
    await loaded()
    for (const [key, label] of labels) {
      const input = field(label)
      expect(input).toHaveValue(labConfigDefaultsFixture.values[key])
      const { min, max } = labConfigDefaultsFixture.limits[key]
      const def = labConfigDefaultsFixture.defaults[key]
      expect(input).toHaveAccessibleDescription(
        `Padrão: ${def} · Mín. ${min} · Máx. ${max}`,
      )
    }
    expect(field('Pontos de ação por vez')).toHaveAccessibleDescription(
      'Padrão: 3 · Mín. 1 · Máx. 10',
    )
    expect(screen.getByText('Padrão: 3 · Mín. 1 · Máx. 10')).toBeVisible()
  })

  it('REQ-27: os 11 campos da FEAT-06 vêm depois dos 8 do REQ-06, nesta ordem, com padrão e limites', async () => {
    renderLab()
    await loaded()
    const region = screen.getByRole('region', { name: 'Configuração' })
    const names = within(region)
      .getAllByRole('spinbutton')
      .slice(0, labels.length)
      .map((input) => (input as HTMLInputElement).labels?.[0]?.textContent)
    expect(names).toEqual(labels.map(([, label]) => label))
  })

  it('REQ-39: os 5 campos da FEAT-09 vêm depois dos do REQ-27, nesta ordem, com padrão e limites', async () => {
    renderLab()
    await loaded()
    const region = screen.getByRole('region', { name: 'Configuração' })
    const names = within(region)
      .getAllByRole('spinbutton')
      .slice(0, labels.length)
      .map((input) => (input as HTMLInputElement).labels?.[0]?.textContent)
    expect(names.slice(-10, -5)).toEqual([
      'Cópias máximas por carta no deck',
      'Capacidade da pasta de TCG',
      'Recuperar: % da vida máxima',
      'Recuperar: % do Pico em Vigor',
      'Recuperar: comprar até (cartas na mão)',
    ])
    expect(field('Recuperar: % da vida máxima')).toHaveAccessibleDescription(
      'Padrão: 15 · Mín. 0 · Máx. 100',
    )
  })

  it('REQ-43: os 2 campos da FEAT-10 vêm depois dos do REQ-39, nesta ordem, com padrão e limites', async () => {
    renderLab()
    await loaded()
    const region = screen.getByRole('region', { name: 'Configuração' })
    const names = within(region)
      .getAllByRole('spinbutton')
      .slice(0, labels.length)
      .map((input) => (input as HTMLInputElement).labels?.[0]?.textContent)
    expect(names.slice(-6, -3)).toEqual([
      'Recuperar: comprar até (cartas na mão)',
      'Capacidade do inventário',
      'Capacidade da bolsa',
    ])
    expect(field('Capacidade da bolsa')).toHaveAccessibleDescription(
      'Padrão: 300 · Mín. 0 · Máx. 1000000',
    )
  })

  it('REQ-47: os 3 campos da FEAT-32 vêm depois dos do REQ-43, nesta ordem, com padrão e limites', async () => {
    renderLab()
    await loaded()
    const region = screen.getByRole('region', { name: 'Configuração' })
    const names = within(region)
      .getAllByRole('spinbutton')
      .slice(0, labels.length)
      .map((input) => (input as HTMLInputElement).labels?.[0]?.textContent)
    expect(names.slice(-4)).toEqual([
      'Capacidade da bolsa',
      'Capacidade do cofre',
      'Slots de decks do cofre (a build em uso ocupa um)',
      'Capacidade de ouro do cofre',
    ])
    expect(field('Capacidade do cofre')).toHaveAccessibleDescription(
      'Padrão: 30 · Mín. 0 · Máx. 1000',
    )
    expect(
      field('Slots de decks do cofre (a build em uso ocupa um)'),
    ).toHaveAccessibleDescription('Padrão: 10 · Mín. 1 · Máx. 100')
    expect(field('Capacidade de ouro do cofre')).toHaveAccessibleDescription(
      'Padrão: 2000 · Mín. 0 · Máx. 10000000',
    )
  })

  it('REQ-06: "Salvar" fica desabilitado sem campo alterado e com campo vazio', async () => {
    renderLab()
    await loaded()
    expect(saveButton()).toBeDisabled()
    setField('Pontos de ação por vez', '4')
    expect(saveButton()).toBeEnabled()
    setField('Ouro inicial', '')
    expect(saveButton()).toBeDisabled()
  })

  it('REQ-06: voltar ao valor original desabilita "Salvar" de novo', async () => {
    renderLab()
    await loaded()
    setField('Pontos de ação por vez', '4')
    setField('Pontos de ação por vez', '3')
    expect(saveButton()).toBeDisabled()
  })

  it('REQ-06: salvar envia só as chaves alteradas; com 200 mostra o values devolvido e "Configuração salva."', async () => {
    let sentBody: unknown
    server.use(
      http.patch('*/lab/config', async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(labConfigUpdatedFixture)
      }),
    )
    renderLab()
    await loaded()
    setField('Pontos de ação por vez', '4')
    fireEvent.click(saveButton())

    expect(await screen.findByText('Configuração salva.')).toBeVisible()
    expect(configStatus()).toHaveTextContent('Configuração salva.')
    expect(sentBody).toEqual({ actionPointsPerTurn: 4 })
    expect(field('Pontos de ação por vez')).toHaveValue(4)
    expect(saveButton()).toBeDisabled()
  })

  it('REQ-06: os campos mostram o values devolvido pelo backend, não o digitado', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json({
          ...labConfigDefaultsFixture,
          values: { ...labConfigDefaultsFixture.values, initialGold: 99 },
        }),
      ),
    )
    renderLab()
    await loaded()
    setField('Ouro inicial', '50')
    fireEvent.click(saveButton())
    await screen.findByText('Configuração salva.')
    expect(field('Ouro inicial')).toHaveValue(99)
  })

  it('REQ-06: 400 outOfRange mostra a message, mantém o digitado e liga "Use um valor entre {min} e {max}." ao campo; unknownKey fica só com a message', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigInvalidFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Pontos de ação por vez', '0')
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Configuração do laboratório inválida.',
      ),
    )
    const input = field('Pontos de ação por vez')
    expect(input).toHaveValue(0)
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Use um valor entre 1 e 10.'),
    )
    expect(screen.getAllByText(/^Use /)).toHaveLength(1)
  })

  it('REQ-06: 400 notInteger liga "Use um número inteiro." ao campo', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigNotIntegerFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Ouro inicial', '2.5')
    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(field('Ouro inicial')).toHaveAccessibleDescription(
        expect.stringContaining('Use um número inteiro.'),
      ),
    )
    expect(field('Ouro inicial')).toHaveValue(2.5)
  })

  it('REQ-06: 400 minAboveMax liga o texto aos dois campos de jogadores', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigMinAboveMaxFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Jogadores (mínimo)', '5')
    setField('Jogadores (máximo)', '3')
    fireEvent.click(saveButton())

    const text = 'O mínimo de jogadores não pode passar do máximo.'
    await waitFor(() =>
      expect(field('Jogadores (mínimo)')).toHaveAccessibleDescription(
        expect.stringContaining(text),
      ),
    )
    expect(field('Jogadores (máximo)')).toHaveAccessibleDescription(
      expect.stringContaining(text),
    )
  })

  it('REQ-71: as 37 chaves do mercado têm rótulo pt-BR, na ordem da tela', async () => {
    renderLab()
    await loaded()
    const wanted = marketLabels.map(([, label]) => label as string)
    const names = screen
      .getAllByRole('spinbutton')
      .map(
        (input) => (input as HTMLInputElement).labels?.[0]?.textContent ?? '',
      )
      .filter((name) => wanted.includes(name))
    expect(names).toEqual(wanted)
    expect(marketLabels).toHaveLength(37)
  })

  it('REQ-71: 400 sumMismatch liga o texto às cinco chances do booster', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigSumMismatchFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Chance Comum no booster (milésimos)', '700')
    fireEvent.click(saveButton())

    const text = 'As cinco chances do booster precisam somar 1000 milésimos.'
    for (const name of [
      'Chance Comum no booster (milésimos)',
      'Chance Incomum no booster (milésimos)',
      'Chance Rara no booster (milésimos)',
      'Chance Épica no booster (milésimos)',
      'Chance Lendária no booster (milésimos)',
    ]) {
      await waitFor(() =>
        expect(field(name)).toHaveAccessibleDescription(
          expect.stringContaining(text),
        ),
      )
    }
  })

  it('REQ-71: 400 minAboveMax do fator do mercado usa o texto do mercado', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigMarketFactorFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Fator do mercado mínimo (%)', '130')
    fireEvent.click(saveButton())

    const text = 'O fator mínimo do mercado não pode passar do máximo.'
    for (const name of [
      'Fator do mercado mínimo (%)',
      'Fator do mercado máximo (%)',
    ]) {
      await waitFor(() =>
        expect(field(name)).toHaveAccessibleDescription(
          expect.stringContaining(text),
        ),
      )
      expect(field(name)).not.toHaveAccessibleDescription(
        expect.stringContaining('jogadores'),
      )
    }
  })

  it('REQ-06: 400 invalidBody (field null) fica só com a message', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(
          {
            error: {
              code: 'LAB_CONFIG_INVALID',
              message: 'Configuração do laboratório inválida.',
              details: { fields: [{ field: null, reason: 'invalidBody' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderLab()
    await loaded()
    setField('Vida base', '30')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Configuração do laboratório inválida.',
      ),
    )
    expect(screen.queryByText(/^Use /)).not.toBeInTheDocument()
  })

  it('REQ-06: um novo salvamento com sucesso tira os erros por campo', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigInvalidFixture, { status: 400 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Pontos de ação por vez', '0')
    fireEvent.click(saveButton())
    await screen.findByText('Use um valor entre 1 e 10.')

    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(labConfigUpdatedFixture),
      ),
    )
    setField('Pontos de ação por vez', '4')
    fireEvent.click(saveButton())
    await screen.findByText('Configuração salva.')
    expect(
      screen.queryByText('Use um valor entre 1 e 10.'),
    ).not.toBeInTheDocument()
  })

  it('REQ-06: "Restaurar padrões" envia POST /lab/config/reset; com 200 mostra o values devolvido e "Padrões restaurados."', async () => {
    let resetCalled = false
    server.use(
      http.get('*/lab/config', () =>
        HttpResponse.json(labConfigUpdatedFixture),
      ),
      http.post('*/lab/config/reset', () => {
        resetCalled = true
        return HttpResponse.json(labConfigDefaultsFixture)
      }),
    )
    renderLab()
    await loaded()
    expect(field('Pontos de ação por vez')).toHaveValue(4)
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))

    expect(await screen.findByText('Padrões restaurados.')).toBeVisible()
    expect(resetCalled).toBe(true)
    expect(field('Pontos de ação por vez')).toHaveValue(3)
  })

  it('REQ-06: restaurar padrões descarta o que estava digitado', async () => {
    renderLab()
    await loaded()
    setField('Ouro inicial', '50')
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))
    await screen.findByText('Padrões restaurados.')
    expect(field('Ouro inicial')).toHaveValue(10)
    expect(saveButton()).toBeDisabled()
  })

  it('REQ-06: 404 NOT_FOUND no GET mostra a message recebida sem exceção', async () => {
    server.use(
      http.get('*/lab/config', () =>
        HttpResponse.json(notFoundFixture, { status: 404 }),
      ),
    )
    renderLab()
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent('Recurso não encontrado.'),
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Laboratório' }),
    ).toBeVisible()
  })

  it('REQ-06: falha de rede no GET mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.error()))
    renderLab()
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-06: resposta fora do contrato no GET mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.json({})))
    renderLab()
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-06: erro §1.4 no salvar mostra a message; falha de rede mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(
      http.patch('*/lab/config', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderLab()
    await loaded()
    setField('Vida base', '30')
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Erro inesperado no servidor. Tente novamente.',
      ),
    )

    server.use(http.patch('*/lab/config', () => HttpResponse.error()))
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
    expect(field('Vida base')).toHaveValue(30)
  })

  it('REQ-06: erro no restaurar mostra a message recebida', async () => {
    server.use(
      http.post('*/lab/config/reset', () =>
        HttpResponse.json(notFoundFixture, { status: 404 }),
      ),
    )
    renderLab()
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))
    await waitFor(() =>
      expect(configStatus()).toHaveTextContent('Recurso não encontrado.'),
    )
  })
})

describe('REQ-07: vitrine de componentes', () => {
  it('REQ-07: a seção "Componentes" mostra os 9 atributos e as categorias de teste, inclusive a pendente', async () => {
    renderLab()
    const section = screen.getByRole('region', { name: 'Componentes' })
    for (const name of [
      'Força',
      'Destreza',
      'Resistência',
      'Inteligência',
      'Sabedoria',
      'Carisma',
      'Espírito',
      'Sanidade',
      'Sorte',
    ]) {
      expect(within(section).getByText(name)).toBeVisible()
    }
    expect(
      within(section).getByRole('img', { name: 'Relíquia de teste' }),
    ).toBeVisible()
    expect(within(section).getByText('Categoria pendente')).toBeVisible()
    await loaded()
  })
})

it('REQ-56: shows escape configuration and links the indexed MSW error to the reserve weight', async () => {
  renderLab()
  expect(
    await screen.findByLabelText('Custo de fuga (% do Pico em Vigor)'),
  ).toHaveValue(20)
  const weight = screen.getByLabelText('Peso da entrada 1')
  fireEvent.change(weight, { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(weight).toHaveAccessibleDescription('Use um peso de pelo menos 1.'),
  )
  expect(weight).toHaveValue(0)
})

it('REQ-56: saves a weighted gold and card reserve with MSW and restores defaults', async () => {
  renderLab()
  const escape = await screen.findByLabelText(
    'Custo de fuga (% do Pico em Vigor)',
  )
  fireEvent.change(escape, { target: { value: '25' } })
  fireEvent.change(screen.getByLabelText('Peso da entrada 1'), {
    target: { value: '2' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar entrada' }))
  fireEvent.change(screen.getByLabelText('Tipo da entrada 2'), {
    target: { value: 'card' },
  })
  fireEvent.change(screen.getByLabelText('Carta da entrada 2'), {
    target: { value: 'fixture.healing-potion' },
  })
  fireEvent.change(screen.getByLabelText('Peso da entrada 2'), {
    target: { value: '3' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByText('Configuração salva.')
  expect(escape).toHaveValue(25)
  expect(screen.getByLabelText('Peso da entrada 2')).toHaveValue(3)
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))
  await screen.findByText('Padrões restaurados.')
  expect(escape).toHaveValue(20)
  expect(screen.queryByLabelText('Peso da entrada 2')).not.toBeInTheDocument()
})
it('REQ-60: saves zero escape threshold and restores MSW defaults', async () => {
  renderLab()
  await loaded()
  const threshold = screen.getByRole('spinbutton', {
    name: 'Limiar de fuga em combate',
  })
  expect(threshold).toHaveValue(10)
  setField('Limiar de fuga em combate', '0')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByText('Configuração salva.')
  expect(threshold).toHaveValue(0)
  fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrões' }))
  await screen.findByText('Padrões restaurados.')
  expect(threshold).toHaveValue(10)
})

it('REQ-60: submits priorities in order and binds a refusal to the behavior', async () => {
  const sent = vi.fn()
  server.use(
    http.patch('*/lab/config', async ({ request }) => {
      sent(await request.json())
      return HttpResponse.json(
        {
          error: {
            code: 'LAB_CONFIG_INVALID',
            message: 'Prioridades inválidas.',
            details: {
              fields: [
                {
                  field: 'enemyAbilityPriorities.defensive.1',
                  reason: 'invalidBody',
                },
              ],
            },
          },
        },
        { status: 400 },
      )
    }),
  )
  renderLab()
  await loaded()
  const defense = screen.getByRole('textbox', { name: 'Defensivo' })
  const draft = 'highestPower, highestPower, selfBuff'
  fireEvent.change(defense, { target: { value: draft } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(defense).toHaveAccessibleDescription(/Prioridades inválidas/),
  )
  expect(defense).toHaveValue(draft)
  expect(sent).toHaveBeenCalledWith({
    enemyAbilityPriorities: {
      ...labConfigDefaultsFixture.values.enemyAbilityPriorities,
      defensive: ['highestPower', 'highestPower', 'selfBuff'],
    },
  })
})
it('REQ-70 shows the quest board setting from MSW', async () => {
  renderLab()
  expect(
    await screen.findByLabelText('Vagas no quadro de missões'),
  ).toHaveValue(3)
})

it('REQ-70 shows the two quest completion Peak settings from MSW', async () => {
  renderLab()
  expect(await screen.findByLabelText('Pico por missão de zona')).toHaveValue(3)
  expect(screen.getByLabelText('Pico por missão genérica')).toHaveValue(5)
})
