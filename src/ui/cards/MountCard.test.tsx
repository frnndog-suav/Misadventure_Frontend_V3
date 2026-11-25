import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import type { ReactElement } from 'react'
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
import type {
  MountCard as MountCardData,
  ZoneCard as ZoneCardData,
} from '../../api/catalog'
import {
  grayHarborFixture,
  oldMineFixture,
  plowHorseFixture,
  warPonyFixture,
} from '../../mocks/catalogFixtures'
import { handlers } from '../../mocks/handlers'
import { FullCard } from './FullCard'
import { MountCard } from './MountCard'
import { ZoneCard } from './ZoneCard'

if (warPonyFixture.type !== 'mount') throw new Error('fixture')
if (plowHorseFixture.type !== 'mount') throw new Error('fixture')
if (oldMineFixture.type !== 'zone') throw new Error('fixture')
if (grayHarborFixture.type !== 'zone') throw new Error('fixture')
const pony: MountCardData = warPonyFixture
const horse: MountCardData = plowHorseFixture
const mine: ZoneCardData = oldMineFixture
const harbor: ZoneCardData = grayHarborFixture

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

function renderWithClient(ui: ReactElement): void {
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('REQ-83: carta de montaria no catálogo', () => {
  it('REQ-83: no lugar da categoria mostra "Montaria", seguido da raridade, "Tipos" e "Criatura"', () => {
    render(<MountCard card={pony} />)
    const card = screen.getByRole('article', { name: 'Pônei de Guerra' })
    const texts = within(card)
      .getAllByRole('paragraph')
      .map((p) => p.textContent)
    expect(texts.slice(0, 4)).toEqual([
      'Montaria',
      'Comum',
      'Tipos: Fera',
      'Criatura: Pônei',
    ])
  })

  it('REQ-83: "Tipos" lista os rótulos de mountTypes na ordem recebida, separados por vírgula', () => {
    render(<MountCard card={{ ...horse, mountTypes: ['undead', 'beast'] }} />)
    expect(screen.getByText('Tipos: Morto-vivo, Fera')).toBeVisible()
  })

  it('REQ-83: mostra os efeitos (REQ-53) e as habilidades (REQ-60), nessa ordem', () => {
    render(<MountCard card={pony} />)
    const card = screen.getByRole('article', { name: 'Pônei de Guerra' })
    const effects = within(card).getByRole('list', { name: 'Efeitos' })
    const abilities = within(card).getByRole('list', { name: 'Habilidades' })
    expect(effects).toHaveTextContent('Ganha 2 de ouro.')
    expect(abilities).toHaveTextContent('Trote')
    expect(abilities).toHaveTextContent('Remove os debuffs de quem monta.')
    expect(
      effects.compareDocumentPosition(abilities) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('REQ-83: sem efeitos nem habilidades, as listas não aparecem', () => {
    render(<MountCard card={horse} />)
    expect(screen.queryByRole('list', { name: 'Efeitos' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Habilidades' })).toBeNull()
  })

  it('REQ-83: FullCard mostra a carta de montaria no seu componente', () => {
    render(<FullCard card={pony} />)
    const card = screen.getByRole('article', { name: 'Pônei de Guerra' })
    expect(within(card).getByText('Criatura: Pônei')).toBeVisible()
  })
})

describe('REQ-83: Estábulo no bloco "Mercado" da zona', () => {
  it('REQ-83: zona com market.mounts mostra a lista "Estábulo" com os nomes, na ordem recebida', async () => {
    renderWithClient(
      <ZoneCard
        card={{
          ...mine,
          market: {
            stock: [],
            singles: false,
            mounts: ['fixture.war-pony', 'fixture.plow-horse'],
          },
        }}
      />,
    )
    const market = screen.getByRole('region', { name: 'Mercado' })
    const stable = within(market).getByRole('list', { name: 'Estábulo' })
    await waitFor(() =>
      expect(
        within(stable)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Pônei de Guerra', 'Cavalo de Arado']),
    )
  })

  it('REQ-83: zona com mounts vazio não mostra a lista "Estábulo"', async () => {
    renderWithClient(<ZoneCard card={harbor} />)
    await screen.findByRole('list', { name: 'Estoque' })
    expect(screen.queryByRole('list', { name: 'Estábulo' })).toBeNull()
    expect(screen.queryByText('Estábulo')).toBeNull()
  })
})
