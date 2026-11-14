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
  labConfigMinAboveMaxFixture,
  labConfigNotIntegerFixture,
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
      <LabPage />
    </QueryClientProvider>,
  )
}

const labels = [
  ['minPlayers', 'Jogadores (mínimo)'],
  ['maxPlayers', 'Jogadores (máximo)'],
  ['actionPointsPerTurn', 'Pontos de ação por vez'],
  ['initialPeak', 'Pico inicial'],
  ['initialVigor', 'Vigor inicial'],
  ['baseHealth', 'Vida base'],
  ['initialGold', 'Ouro inicial'],
  ['initialHandSize', 'Mão inicial'],
] as const

async function loaded(): Promise<void> {
  await screen.findByRole('spinbutton', { name: 'Pontos de ação por vez' })
}

const field = (name: string) => screen.getByRole('spinbutton', { name })
const saveButton = () => screen.getByRole('button', { name: 'Salvar' })

function setField(name: string, value: string): void {
  fireEvent.change(field(name), { target: { value } })
}

describe('REQ-06: configuração ajustável do jogo', () => {
  it('REQ-06: com o GET em andamento, a área de status mostra "Carregando configuração…"', async () => {
    renderLab()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Carregando configuração…',
    )
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
    expect(screen.getByRole('status')).toHaveTextContent('Configuração salva.')
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
      expect(screen.getByRole('status')).toHaveTextContent(
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
      expect(screen.getByRole('status')).toHaveTextContent(
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
      expect(screen.getByRole('status')).toHaveTextContent(
        'Recurso não encontrado.',
      ),
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Laboratório' }),
    ).toBeVisible()
  })

  it('REQ-06: falha de rede no GET mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.error()))
    renderLab()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-06: resposta fora do contrato no GET mostra "Servidor indisponível. Tente novamente."', async () => {
    server.use(http.get('*/lab/config', () => HttpResponse.json({})))
    renderLab()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
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
      expect(screen.getByRole('status')).toHaveTextContent(
        'Erro inesperado no servidor. Tente novamente.',
      ),
    )

    server.use(http.patch('*/lab/config', () => HttpResponse.error()))
    fireEvent.click(saveButton())
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
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
      expect(screen.getByRole('status')).toHaveTextContent(
        'Recurso não encontrado.',
      ),
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
