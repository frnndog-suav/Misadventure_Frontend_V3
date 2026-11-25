import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
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
import { internalErrorFixture } from '../mocks/fixtures'
import { handlers } from '../mocks/handlers'
import { GrantSection } from './GrantSection'

const server = setupServer(...handlers)
const grantsUrl = '*/lab/parties/:partyId/members/:memberId/grants'

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

function renderGrant(): void {
  render(
    <QueryClientProvider client={queryClient}>
      <GrantSection />
    </QueryClientProvider>,
  )
}

function status(): HTMLElement {
  return screen.getByRole('status')
}

async function choosePartyAndMember(): Promise<void> {
  fireEvent.click(
    await screen.findByRole('radio', { name: 'Os Teimosos (Lia)' }),
  )
  expect(await screen.findByRole('radio', { name: 'Lia' })).toBeChecked()
}

async function chooseCard(name: string): Promise<void> {
  const select = screen.getByRole('combobox', { name: 'Carta' })
  await screen.findByRole('option', { name })
  fireEvent.change(select, {
    target: {
      value: screen.getByRole<HTMLOptionElement>('option', { name }).value,
    },
  })
}

function captureBody(): { body: unknown } {
  const captured: { body: unknown } = { body: undefined }
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'POST' && request.url.includes('/grants')) {
      captured.body = await request.clone().json()
    }
  })
  return captured
}

describe('REQ-46: seção "Doação" do laboratório', () => {
  it('REQ-46: mostra os grupos sem nenhum escolhido; depois, o membro, "Carta" e as cartas doáveis', async () => {
    renderGrant()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Doação' }),
    ).toBeInTheDocument()
    const party = await screen.findByRole('radio', {
      name: 'Os Teimosos (Lia)',
    })
    expect(party).not.toBeChecked()
    expect(screen.queryByRole('radiogroup', { name: 'Membro' })).toBeNull()

    await choosePartyAndMember()
    expect(screen.getByRole('radio', { name: 'Carta' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ouro' })).not.toBeChecked()
    expect(
      await screen.findByRole('option', { name: 'Coleção de Teste' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Quantidade' })).toHaveValue(
      1,
    )
    await screen.findByRole('option', { name: 'Poção de Cura · Item' })
    const cardOptions = Array.from(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Carta' })
        .options,
    ).map((o) => o.textContent)
    expect(cardOptions[0]).toBe('Escolha…')
    expect(cardOptions).toContain('Varinha Arcana · Equipamento')
    expect(cardOptions.some((t) => t?.endsWith('· Atributo'))).toBe(true)
    expect(cardOptions.some((t) => t?.endsWith('· Zona'))).toBe(false)
    expect(cardOptions.some((t) => t?.endsWith('· Dimensão'))).toBe(false)
    expect(screen.getByRole('button', { name: 'Doar' })).toBeDisabled()
  })

  it('REQ-82: a seleção "Carta" também lista as cartas de montaria ("{nome} · Montaria")', async () => {
    const captured = captureBody()
    renderGrant()
    await choosePartyAndMember()
    await chooseCard('Pônei de Guerra · Montaria')
    expect(
      screen.getByRole('option', { name: 'Cavalo de Arado · Montaria' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Doar' }))
    await waitFor(() =>
      expect(captured.body).toEqual({
        type: 'card',
        cardId: 'fixture.war-pony',
        quantity: 1,
      }),
    )
  })

  it('REQ-46: sem grupos, mostra "Nenhum jogo salvo."', async () => {
    server.use(http.get('*/parties', () => HttpResponse.json([])))
    renderGrant()
    expect(await screen.findByText('Nenhum jogo salvo.')).toBeInTheDocument()
  })

  it('REQ-46: enquanto as cartas não chegam, a seleção mostra "Carregando cartas…"; erro vai para o status', async () => {
    server.use(
      http.get('*/catalog/collections/:collectionId/cards', async () => {
        await delay(50)
        return HttpResponse.json(internalErrorFixture, { status: 500 })
      }),
    )
    renderGrant()
    await choosePartyAndMember()
    expect(
      await screen.findByRole('option', { name: 'Carregando cartas…' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
  })

  it('REQ-46: erro nas coleções vai para o status; "Ouro" segue disponível', async () => {
    server.use(
      http.get('*/catalog/collections', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderGrant()
    await choosePartyAndMember()
    await waitFor(() =>
      expect(status()).toHaveTextContent(internalErrorFixture.error.message),
    )
    expect(screen.getByRole('option', { name: 'Escolha…' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Ouro' }))
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Quantidade de ouro' }),
      { target: { value: '5' } },
    )
    expect(screen.getByRole('button', { name: 'Doar' })).toBeEnabled()
  })

  it('REQ-46: erro ao abrir o grupo mostra a message no lugar do formulário', async () => {
    server.use(
      http.get('*/parties/:partyId', () =>
        HttpResponse.json(internalErrorFixture, { status: 500 }),
      ),
    )
    renderGrant()
    fireEvent.click(
      await screen.findByRole('radio', { name: 'Os Teimosos (Lia)' }),
    )
    expect(
      await screen.findByText(internalErrorFixture.error.message),
    ).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Membro' })).toBeNull()
  })

  it('REQ-46: doa a carta com a quantidade digitada e mostra o resumo do membro', async () => {
    const captured = captureBody()
    renderGrant()
    await choosePartyAndMember()
    await chooseCard('Poção de Cura · Item')
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '2' },
    })
    const grant = screen.getByRole('button', { name: 'Doar' })
    expect(grant).toBeEnabled()
    fireEvent.click(grant)
    expect(grant).toBeDisabled()
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Doação feita. Lia: ouro 10, 1 slots no inventário, 0 cartas diferentes na pasta.',
      ),
    )
    expect(captured.body).toEqual({
      type: 'card',
      cardId: 'fixture.healing-potion',
      quantity: 2,
    })
  })

  it('REQ-46: doa ouro com o número como digitado (inclusive não inteiro)', async () => {
    const captured = captureBody()
    renderGrant()
    await choosePartyAndMember()
    fireEvent.click(screen.getByRole('radio', { name: 'Ouro' }))
    expect(screen.queryByRole('combobox', { name: 'Carta' })).toBeNull()
    const amount = screen.getByRole('spinbutton', {
      name: 'Quantidade de ouro',
    })
    const grant = screen.getByRole('button', { name: 'Doar' })
    expect(grant).toBeDisabled()
    fireEvent.change(amount, { target: { value: '295' } })
    fireEvent.click(grant)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Doação feita. Lia: ouro 300, 0 slots no inventário, 0 cartas diferentes na pasta.',
      ),
    )
    expect(captured.body).toEqual({ type: 'gold', amount: 295 })

    fireEvent.change(amount, { target: { value: '1.5' } })
    fireEvent.click(grant)
    await waitFor(() =>
      expect(captured.body).toEqual({ type: 'gold', amount: 1.5 }),
    )
  })

  it('REQ-46: campo numérico vazio desabilita "Doar"', async () => {
    renderGrant()
    await choosePartyAndMember()
    await chooseCard('Poção de Cura · Item')
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantidade' }), {
      target: { value: '' },
    })
    expect(screen.getByRole('button', { name: 'Doar' })).toBeDisabled()
  })

  it.each([
    [
      'notGrantable',
      'Essa carta não pode ser doada (só equipamento, item ou atributo).',
    ],
    ['notPositiveInteger', 'Use um número inteiro a partir de 1.'],
  ])(
    'REQ-46: LAB_GRANT_INVALID %s mostra a message e o texto do campo',
    async (reason, text) => {
      server.use(
        http.post(grantsUrl, () =>
          HttpResponse.json(
            {
              error: {
                code: 'LAB_GRANT_INVALID',
                message: 'Doação inválida.',
                details: { fields: [{ field: 'quantity', reason }] },
              },
            },
            { status: 400 },
          ),
        ),
      )
      renderGrant()
      await choosePartyAndMember()
      await chooseCard('Poção de Cura · Item')
      fireEvent.click(screen.getByRole('button', { name: 'Doar' }))
      await waitFor(() =>
        expect(status()).toHaveTextContent(`Doação inválida. ${text}`),
      )
    },
  )

  it('REQ-46: LAB_GRANT_INVALID com outro motivo mostra só a message', async () => {
    server.use(
      http.post(grantsUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'LAB_GRANT_INVALID',
              message: 'Doação inválida.',
              details: { fields: [{ field: 'type', reason: 'required' }] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    renderGrant()
    await choosePartyAndMember()
    await chooseCard('Poção de Cura · Item')
    fireEvent.click(screen.getByRole('button', { name: 'Doar' }))
    await waitFor(() =>
      expect(status()).toHaveTextContent(/^Doação inválida\.$/),
    )
  })

  it.each([
    ['inventoryFull', 'Inventário cheio.'],
    ['tcgFolderFull', 'Pasta de TCG cheia.'],
    ['mountAlreadyOwned', 'Já tem montaria.'],
  ])(
    'REQ-46: LAB_GRANT_NO_SPACE %s mostra a message e o motivo',
    async (reason, text) => {
      server.use(
        http.post(grantsUrl, () =>
          HttpResponse.json(
            {
              error: {
                code: 'LAB_GRANT_NO_SPACE',
                message: 'Sem espaço.',
                details: { reason },
              },
            },
            { status: 409 },
          ),
        ),
      )
      renderGrant()
      await choosePartyAndMember()
      await chooseCard('Poção de Cura · Item')
      fireEvent.click(screen.getByRole('button', { name: 'Doar' }))
      await waitFor(() =>
        expect(status()).toHaveTextContent(`Sem espaço. ${text}`),
      )
    },
  )

  it('REQ-46: outro erro §1.4 mostra a message; falha de rede, o texto genérico', async () => {
    server.use(
      http.post(grantsUrl, () =>
        HttpResponse.json(
          {
            error: {
              code: 'MEMBER_NOT_FOUND',
              message: 'Membro não encontrado neste grupo.',
            },
          },
          { status: 404 },
        ),
      ),
    )
    renderGrant()
    await choosePartyAndMember()
    await chooseCard('Poção de Cura · Item')
    const grant = screen.getByRole('button', { name: 'Doar' })
    fireEvent.click(grant)
    await waitFor(() =>
      expect(status()).toHaveTextContent('Membro não encontrado neste grupo.'),
    )

    server.use(http.post(grantsUrl, () => HttpResponse.error()))
    fireEvent.click(grant)
    await waitFor(() =>
      expect(status()).toHaveTextContent(
        'Servidor indisponível. Tente novamente.',
      ),
    )
  })

  it('REQ-46: o 200 invalida as consultas de grupos (a tela do grupo aberta depois busca o estado novo)', async () => {
    renderGrant()
    await choosePartyAndMember()
    queryClient.setQueryData(['parties', 'outro'], { stale: false })
    fireEvent.click(screen.getByRole('radio', { name: 'Ouro' }))
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Quantidade de ouro' }),
      { target: { value: '295' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Doar' }))
    await waitFor(() => expect(status()).toHaveTextContent('Doação feita.'))
    expect(queryClient.getQueryState(['parties', 'outro'])?.isInvalidated).toBe(
      true,
    )
  })
})
