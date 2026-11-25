import { expect, test } from '@playwright/test'

test('REQ-05: no build de dev, /lab abre a tela com o título "Laboratório"', async ({
  page,
}) => {
  await page.goto('/lab')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laboratório' }),
  ).toBeVisible()
})

test('REQ-06: carrega, salva e restaura a configuração (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const status = page
    .getByRole('region', { name: 'Configuração' })
    .getByRole('status')
  const actionPoints = page.getByRole('spinbutton', {
    name: 'Pontos de ação por vez',
  })
  const save = page.getByRole('button', { name: 'Salvar' })

  await expect(actionPoints).toHaveValue('3')
  await expect(page.getByText('Padrão: 3 · Mín. 1 · Máx. 10')).toBeVisible()
  await expect(save).toBeDisabled()

  await actionPoints.fill('4')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(status).toHaveText('Configuração salva.')
  await expect(actionPoints).toHaveValue('4')

  await page.getByRole('button', { name: 'Restaurar padrões' }).click()
  await expect(status).toHaveText('Padrões restaurados.')
  await expect(actionPoints).toHaveValue('3')
})

test('REQ-06: campo vazio desabilita "Salvar"', async ({ page }) => {
  await page.goto('/lab')
  const gold = page.getByRole('spinbutton', { name: 'Ouro inicial' })
  await expect(gold).toHaveValue('10')
  await gold.fill('')
  await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled()
})

test('REQ-07: a seção "Componentes" mostra o termo e as categorias de teste', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Componentes' })
  await expect(section.getByText('Força')).toBeVisible()
  await expect(section.getByText('Sorte')).toBeVisible()
  await expect(
    section.getByRole('img', { name: 'Relíquia de teste' }),
  ).toBeVisible()
  await expect(section.getByText('Categoria pendente')).toBeVisible()

  await section.getByText('Força').hover()
  await expect(page.getByRole('tooltip')).toBeVisible()
})

test('REQ-08: o Catálogo filtra por tipo e mostra a carta escolhida (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Catálogo' })
  await expect(
    section.getByRole('radio', { name: 'Coleção de Teste' }),
  ).toBeChecked()
  const list = section.getByRole('list', { name: 'Cartas' })
  // CONTRATO v0.90: a `fixture` ganhou as 2 montarias (31 cartas).
  await expect(list.getByRole('button')).toHaveCount(31)

  await section.getByRole('radio', { name: 'Zona (4)' }).check()
  await expect(list.getByRole('button')).toHaveCount(4)
  await list.getByRole('button', { name: 'Bosque Sussurrante · Zona' }).click()
  await expect(
    section.getByRole('article', { name: 'Bosque Sussurrante' }),
  ).toBeVisible()
})

test('REQ-27: a configuração mostra os campos da FEAT-06 (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const region = page.getByRole('region', { name: 'Configuração' })
  await expect(
    region.getByRole('spinbutton', { name: 'Tamanho mínimo da build' }),
  ).toBeVisible()
  await expect(
    region.getByRole('spinbutton', { name: 'Reflexão padrão' }),
  ).toBeVisible()
})

test('REQ-28: o filtro "Dimensão" mostra a Carta de Dimensão (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Catálogo' })
  await section.getByRole('radio', { name: 'Dimensão (1)' }).check()
  const list = section.getByRole('list', { name: 'Cartas' })
  await expect(list.getByRole('button')).toHaveCount(1)
  await list
    .getByRole('button', { name: 'Dimensão de Teste · Dimensão' })
    .click()
  const card = section.getByRole('article', { name: 'Dimensão de Teste' })
  await expect(card.getByText('Ordem de lançamento 1')).toBeVisible()
  await expect(card.getByText('Zona de chegada: Porto Cinzento')).toBeVisible()
})

test('REQ-43: "Capacidade do inventário" e "Capacidade da bolsa" com padrão e limites (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  await expect(
    page.getByRole('spinbutton', { name: 'Capacidade do inventário' }),
  ).toHaveValue('10')
  await expect(
    page.getByRole('spinbutton', { name: 'Capacidade da bolsa' }),
  ).toHaveAccessibleDescription('Padrão: 300 · Mín. 0 · Máx. 1000000')
})

test('REQ-47: os 3 campos do cofre com padrão e limites (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const region = page.getByRole('region', { name: 'Configuração' })
  await expect(
    region.getByRole('spinbutton', { name: 'Capacidade do cofre' }),
  ).toHaveValue('30')
  await expect(
    region.getByRole('spinbutton', {
      name: 'Slots de decks do cofre (a build em uso ocupa um)',
    }),
  ).toHaveAccessibleDescription('Padrão: 10 · Mín. 1 · Máx. 100')
  await expect(
    region.getByRole('spinbutton', { name: 'Capacidade de ouro do cofre' }),
  ).toBeVisible()
})

test('REQ-48: ferramenta, "Coletada com" e "Decks de recompensas" no catálogo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Catálogo' })
  const list = section.getByRole('list', { name: 'Cartas' })

  await section.getByRole('radio', { name: 'Item (11)' }).check()
  await list.getByRole('button', { name: 'Vara de Pesca · Item' }).click()
  const rod = section.getByRole('article', { name: 'Vara de Pesca' })
  await expect(rod.getByText('Ferramenta: fishing-rod')).toBeVisible()
  await expect(
    rod.getByText('Vasculha em: Costeira, Fluvial, Lacustre, Urbana'),
  ).toBeVisible()

  await list.getByRole('button', { name: 'Peixe Prateado · Item' }).click()
  await expect(
    section
      .getByRole('article', { name: 'Peixe Prateado' })
      .getByText('Coletada com: fishing-rod'),
  ).toBeVisible()

  await section.getByRole('radio', { name: 'Dimensão (1)' }).check()
  await list
    .getByRole('button', { name: 'Dimensão de Teste · Dimensão' })
    .click()
  const decks = section
    .getByRole('article', { name: 'Dimensão de Teste' })
    .getByRole('list', { name: 'Urbana' })
  await expect(decks.getByRole('listitem')).toHaveText([
    '1× Peixe Prateado',
    '1× Minério de Ferro',
    '2× Poção de Cura',
  ])
})

test('REQ-53: mostra a marca e o texto recebido no catálogo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const catalog = page.getByRole('region', { name: 'Catálogo' })
  await catalog.getByRole('radio', { name: 'Item (11)' }).check()
  await catalog.getByRole('button', { name: 'Tônico de Força · Item' }).click()
  const effects = catalog
    .getByRole('article', { name: 'Tônico de Força' })
    .getByRole('list', { name: 'Efeitos' })
  await expect(effects.getByRole('listitem')).toHaveText(
    'Buff: +3 de Ataque durante 2 vezes suas.',
  )
})

test('REQ-46: doa carta e ouro na seção "Doação" (MSW)', async ({ page }) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Doação' })
  const status = section.getByRole('status')
  const grant = section.getByRole('button', { name: 'Doar' })

  await section.getByRole('radio', { name: 'Os Teimosos (Lia)' }).check()
  await expect(section.getByRole('radio', { name: 'Lia' })).toBeChecked()
  await expect(grant).toBeDisabled()

  const card = section.getByRole('combobox', { name: 'Carta' })
  await expect(
    card.getByRole('option', { name: 'Poção de Cura · Item' }),
  ).toBeAttached()
  await card.selectOption({ label: 'Poção de Cura · Item' })
  await section.getByRole('spinbutton', { name: 'Quantidade' }).fill('2')
  await grant.click()
  await expect(status).toHaveText(
    'Doação feita. Lia: ouro 10, 1 slots no inventário, 0 cartas diferentes na pasta.',
  )

  await section.getByRole('radio', { name: 'Ouro' }).check()
  const amount = section.getByRole('spinbutton', { name: 'Quantidade de ouro' })
  await expect(grant).toBeDisabled()
  await amount.fill('295')
  await grant.click()
  await expect(status).toHaveText(
    'Doação feita. Lia: ouro 300, 0 slots no inventário, 0 cartas diferentes na pasta.',
  )
})

test('REQ-71: a configuração mostra as chaves do mercado com padrão e limites (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const region = page.getByRole('region', { name: 'Configuração' })
  const boosterPrice = region.getByRole('spinbutton', {
    name: 'Preço do booster',
  })
  await expect(boosterPrice).toBeVisible()
  await expect(boosterPrice).toHaveAccessibleDescription(/Padrão: .* Mín\. .*/)
  await expect(
    region.getByRole('spinbutton', {
      name: 'Chance Lendária no booster (milésimos)',
    }),
  ).toBeVisible()
  await expect(
    region.getByRole('spinbutton', { name: 'Fator do mercado mínimo (%)' }),
  ).toBeVisible()
})

test('REQ-72: o Catálogo mostra o preço da carta e o mercado da zona (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Catálogo' })
  const list = section.getByRole('list', { name: 'Cartas' })
  await list.getByRole('button', { name: 'Flechas · Item' }).click()
  const arrows = section.getByRole('article', { name: 'Flechas' })
  await expect(arrows.getByText('Preço ×1')).toBeVisible()
  await expect(arrows.getByText('Preço de estoque 3')).toBeVisible()

  await list.getByRole('button', { name: 'Porto Cinzento · Zona' }).click()
  const harbor = section.getByRole('article', { name: 'Porto Cinzento' })
  await expect(harbor.getByRole('list', { name: 'Estoque' })).toBeVisible()
  await expect(harbor.getByText('Vende singles')).toBeVisible()
})

test('REQ-77: a configuração mostra as chaves do ferreiro com padrão e limites (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const region = page.getByRole('region', { name: 'Configuração' })
  const breakFrom = region.getByRole('spinbutton', {
    name: 'Refino quebra a partir do nível',
  })
  await expect(breakFrom).toBeVisible()
  await expect(breakFrom).toHaveAccessibleDescription(
    'Padrão: 7 · Mín. 1 · Máx. 11',
  )
  await expect(
    region.getByRole('spinbutton', { name: 'Bônus do Artífice no D20' }),
  ).toBeVisible()
  await expect(
    region.getByRole('spinbutton', {
      name: 'Desconto do conserto na Oficina (%)',
    }),
  ).toBeVisible()
})

test('REQ-78: o Catálogo mostra Refino, Encantamento, Receita e Ferreiro (MSW)', async ({
  page,
}) => {
  await page.goto('/lab')
  const section = page.getByRole('region', { name: 'Catálogo' })
  const list = section.getByRole('list', { name: 'Cartas' })

  await list.getByRole('button', { name: 'Espada Curta · Equipamento' }).click()
  const sword = section.getByRole('article', { name: 'Espada Curta' })
  const refine = sword.getByRole('region', { name: 'Refino' })
  await expect(refine.getByText('Até +10')).toBeVisible()
  await expect(
    refine.getByRole('list', { name: 'Materiais por tentativa' }),
  ).toContainText('1× Minério de Ferro')
  await expect(
    sword
      .getByRole('region', { name: 'Encantamento' })
      .getByText('Slot 1: elemento, a partir do refino +2'),
  ).toBeVisible()

  await list
    .getByRole('button', { name: 'Projeto: Espada Curta · Item' })
    .click()
  const blueprint = section.getByRole('article', {
    name: 'Projeto: Espada Curta',
  })
  const recipe = blueprint.getByRole('region', { name: 'Receita' })
  await expect(recipe.getByText('Cria Espada Curta')).toBeVisible()
  await expect(recipe.getByText('15 de ouro')).toBeVisible()

  await list.getByRole('button', { name: 'Porto Cinzento · Zona' }).click()
  const harbor = section.getByRole('article', { name: 'Porto Cinzento' })
  await expect(
    harbor
      .getByRole('region', { name: 'Ferreiro' })
      .getByText('Fio de Brasa — elemento Fogo (+10%)'),
  ).toBeVisible()
})
