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
  EquipmentCard as EquipmentCardData,
  ItemCard as ItemCardData,
  ZoneCard as ZoneCardData,
} from '../../api/catalog'
import {
  grayHarborFixture,
  shortSwordFixture,
  swordBlueprintFixture,
  whisperingGroveFixture,
} from '../../mocks/catalogFixtures'
import { handlers } from '../../mocks/handlers'
import { EquipmentCard } from './EquipmentCard'
import { ItemCard } from './ItemCard'
import { ZoneCard } from './ZoneCard'

if (shortSwordFixture.type !== 'equipment') throw new Error('fixture')
if (swordBlueprintFixture.type !== 'item') throw new Error('fixture')
if (grayHarborFixture.type !== 'zone') throw new Error('fixture')
if (whisperingGroveFixture.type !== 'zone') throw new Error('fixture')
const sword: EquipmentCardData = shortSwordFixture
const blueprint: ItemCardData = swordBlueprintFixture
const harbor: ZoneCardData = grayHarborFixture
const grove: ZoneCardData = whisperingGroveFixture

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

const texts = (list: HTMLElement) =>
  within(list)
    .getAllByRole('listitem')
    .map((li) => li.textContent)

describe('REQ-78: Refino e Encantamento no equipamento', () => {
  it('REQ-78: equipamento refinável mostra o bloco "Refino" com "Até +{maxLevel}" e "Materiais por tentativa"', async () => {
    renderWithClient(
      <EquipmentCard
        card={{
          ...sword,
          refinement: {
            maxLevel: 10,
            materials: [
              { cardId: 'fixture.iron-ore', quantity: 2 },
              { cardId: 'fixture.ember-shard', quantity: 1 },
            ],
          },
        }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Refino' })
    expect(within(block).getByText('Até +10')).toBeVisible()
    const materials = within(block).getByRole('list', {
      name: 'Materiais por tentativa',
    })
    await waitFor(() =>
      expect(texts(materials)).toEqual([
        '2× Minério de Ferro',
        '1× Fragmento de Brasa',
      ]),
    )
  })

  it('REQ-78: refino sem materiais mostra "Sem materiais definidos."', () => {
    renderWithClient(
      <EquipmentCard
        card={{ ...sword, refinement: { maxLevel: 3, materials: [] } }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Refino' })
    expect(within(block).getByText('Até +3')).toBeVisible()
    expect(within(block).getByText('Sem materiais definidos.')).toBeVisible()
    expect(
      within(block).queryByRole('list', { name: 'Materiais por tentativa' }),
    ).toBeNull()
  })

  it('REQ-78: equipamento encantável lista os slots; refino mínimo 0 omite "a partir do refino"', () => {
    renderWithClient(
      <EquipmentCard
        card={{
          ...sword,
          enchantment: {
            slots: [
              { kind: 'element', minRefinement: 2 },
              { kind: 'effect', minRefinement: 0 },
              { kind: 'effect', minRefinement: 5 },
            ],
          },
        }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Encantamento' })
    expect(texts(within(block).getByRole('list', { name: 'Slots' }))).toEqual([
      'Slot 1: elemento, a partir do refino +2',
      'Slot 2: efeito',
      'Slot 3: efeito, a partir do refino +5',
    ])
  })

  it('REQ-78: equipamento sem refino nem encantamento não mostra os blocos', () => {
    renderWithClient(
      <EquipmentCard
        card={{ ...sword, refinement: null, enchantment: null }}
      />,
    )
    expect(screen.queryByRole('region', { name: 'Refino' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Encantamento' })).toBeNull()
  })
})

describe('REQ-78: Receita no documento', () => {
  it('REQ-78: documento com receita mostra "Cria", "Materiais", ouro e, consumida, "A receita é consumida."', async () => {
    renderWithClient(
      <ItemCard
        card={{
          ...blueprint,
          recipe: {
            equipmentId: 'fixture.short-sword',
            materials: [{ cardId: 'fixture.iron-ore', quantity: 2 }],
            gold: 15,
            consumed: true,
          },
        }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Receita' })
    expect(await within(block).findByText('Cria Espada Curta')).toBeVisible()
    await waitFor(() =>
      expect(
        texts(within(block).getByRole('list', { name: 'Materiais' })),
      ).toEqual(['2× Minério de Ferro']),
    )
    expect(within(block).getByText('15 de ouro')).toBeVisible()
    expect(within(block).getByText('A receita é consumida.')).toBeVisible()
  })

  it('REQ-78: receita não consumida e sem materiais mostra "Sem materiais." e não mostra "A receita é consumida."', async () => {
    renderWithClient(
      <ItemCard
        card={{
          ...blueprint,
          recipe: {
            equipmentId: 'fixture.short-sword',
            materials: [],
            gold: 0,
            consumed: false,
          },
        }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Receita' })
    expect(await within(block).findByText('Cria Espada Curta')).toBeVisible()
    expect(within(block).getByText('Sem materiais.')).toBeVisible()
    expect(within(block).getByText('0 de ouro')).toBeVisible()
    expect(within(block).queryByText('A receita é consumida.')).toBeNull()
    expect(within(block).queryByRole('list', { name: 'Materiais' })).toBeNull()
  })

  it('REQ-78: item sem receita não mostra o bloco', () => {
    renderWithClient(<ItemCard card={{ ...blueprint, recipe: null }} />)
    expect(screen.queryByRole('region', { name: 'Receita' })).toBeNull()
  })
})

describe('REQ-78: Ferreiro na zona', () => {
  it('REQ-78: zona com ferreiro lista "Encantamentos" de elemento e de efeito, com os materiais', async () => {
    renderWithClient(
      <ZoneCard
        card={{
          ...harbor,
          blacksmith: {
            enchantments: [
              {
                id: 'ember-edge',
                name: 'Fio de Brasa',
                kind: 'element',
                element: 'fire',
                bonusPercent: 10,
                materials: [{ cardId: 'fixture.ember-shard', quantity: 1 }],
              },
              {
                id: 'whisper',
                name: 'Sussurro',
                kind: 'effect',
                effects: [],
                abilities: [],
                materials: [],
              },
            ],
          },
        }}
      />,
    )
    const block = screen.getByRole('region', { name: 'Ferreiro' })
    const list = within(block).getByRole('list', { name: 'Encantamentos' })
    const [first, second] = Array.from(list.children) as HTMLElement[]
    expect(first).toHaveTextContent('Fio de Brasa — elemento Fogo (+10%)')
    const materials = within(first).getByRole('list', { name: 'Materiais' })
    await waitFor(() =>
      expect(texts(materials)).toEqual(['1× Fragmento de Brasa']),
    )
    expect(second).toHaveTextContent('Sussurro — efeito')
    expect(second).not.toHaveTextContent('elemento')
    expect(within(second).queryByRole('list')).toBeNull()
  })

  it('REQ-78: ferreiro sem encantamentos mostra "Sem encantamentos."', () => {
    renderWithClient(
      <ZoneCard card={{ ...harbor, blacksmith: { enchantments: [] } }} />,
    )
    const block = screen.getByRole('region', { name: 'Ferreiro' })
    expect(within(block).getByText('Sem encantamentos.')).toBeVisible()
    expect(
      within(block).queryByRole('list', { name: 'Encantamentos' }),
    ).toBeNull()
  })

  it('REQ-78: zona sem ferreiro não mostra o bloco', () => {
    renderWithClient(<ZoneCard card={grove} />)
    expect(screen.queryByRole('region', { name: 'Ferreiro' })).toBeNull()
  })
})
