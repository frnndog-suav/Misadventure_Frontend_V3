import { expect, test } from '@playwright/test'

test('REQ-84: a seção do membro mostra a montaria com o inventário extra e a pasta extra', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  await expect(
    page.getByRole('heading', { name: 'Montaria: Pônei de Guerra' }),
  ).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Inventário extra (1 de 4 slots)' }),
  ).toContainText('2× Poção de Cura')
  await expect(
    page.getByRole('list', { name: 'Pasta extra (capacidade 10)' }),
  ).toContainText('1× Força')
})

test('REQ-85: "Levar" da pasta envia transferMount e mostra o status devolvido', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  const folder = page.getByRole('list', {
    name: 'Pasta de TCG (capacidade 30)',
  })
  await folder.getByLabel('Quantidade de Força').fill('2')
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/actions'),
  )
  await folder
    .getByRole('button', { name: 'Levar Força para a montaria' })
    .click()
  expect((await request).postDataJSON()).toEqual({
    type: 'prepare',
    operation: 'transferMount',
    direction: 'toMount',
    space: 'tcgFolder',
    cardId: 'fixture.strength-basic',
    quantity: 2,
  })
  await expect(page.getByRole('status').first()).toHaveText(
    'Levou 2× Força para a montaria.',
  )
  await expect(
    page.getByRole('list', { name: 'Pasta extra (capacidade 10)' }),
  ).toContainText('2× Força')
})

test('REQ-85: quantidade inválida não envia nada; recusa do backend mostra a message e o motivo', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  const folder = page.getByRole('list', {
    name: 'Pasta de TCG (capacidade 30)',
  })
  const field = folder.getByLabel('Quantidade de Força')
  let sent = 0
  page.on('request', (request) => {
    if (request.url().endsWith('/actions')) sent += 1
  })
  await field.fill('0')
  await folder
    .getByRole('button', { name: 'Levar Força para a montaria' })
    .click()
  await expect(
    page.getByText('Use um número inteiro a partir de 1.'),
  ).toBeVisible()
  expect(sent).toBe(0)
  // O MSW recusa `fromMount` no inventário com `inventoryFull`.
  await page
    .getByRole('button', { name: 'Trazer Poção de Cura da montaria' })
    .click()
  await expect(page.getByRole('status').first()).toContainText(
    'Não há espaço no inventário.',
  )
})

test('REQ-86: "passando por" envia viaZoneId e move o grupo para a zona a 2 travessias', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  const map = page.getByRole('region', { name: 'Mapa' })
  await map.getByRole('button', { name: /^Porto Cinzento/ }).click()
  await expect(
    page.getByRole('button', {
      name: 'Movimentar para Porto Cinzento',
      exact: true,
    }),
  ).toHaveCount(0)
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/actions'),
  )
  await page
    .getByRole('button', {
      name: 'Movimentar para Porto Cinzento passando por Curva de Pedra',
    })
    .click()
  expect((await request).postDataJSON()).toEqual({
    type: 'move',
    zoneId: 'fixture.gray-harbor',
    viaZoneId: 'fixture.stone-bend',
  })
  await expect(
    map.getByRole('button', { name: /^Porto Cinzento.*está aqui/ }),
  ).toBeVisible()
})

test('REQ-87: "Comprar" no Estábulo envia buyMount e mostra o resultado', async ({
  page,
}) => {
  await page.goto('/grupo/party-estabulo')
  await page.getByRole('button', { name: 'Ir ao Mercado' }).click()
  const market = page.getByRole('region', { name: 'Mercado' })
  await expect(market.getByRole('list', { name: 'Estábulo' })).toContainText(
    'Cavalo de Arado — 322 de ouro',
  )
  await market.getByRole('button', { name: 'Comprar Cavalo de Arado' }).click()
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/actions'),
  )
  await market
    .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
    .click()
  expect((await request).postDataJSON()).toEqual({
    type: 'visitMarket',
    operations: [{ operation: 'buyMount', cardId: 'fixture.plow-horse' }],
  })
  await expect(
    page.getByRole('list', { name: 'Resultado do mercado' }),
  ).toContainText('Comprou a montaria Cavalo de Arado por 322 de ouro')
})

test('REQ-88: descarte do inventário extra mantém a recompensa e mostra o destino', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  const reward = page.getByRole('region', { name: 'Recompensa pendente' })
  await expect(reward).toContainText(
    '1× Minério de Ferro para o inventário extra.',
  )
  await reward.getByRole('button', { name: 'Manter' }).click()
  await expect(page.getByRole('status').first()).toContainText(
    'Esta ação não é permitida agora.',
  )
  await reward
    .getByLabel('Descartar Poção de Cura (Inventário extra)')
    .selectOption('1')
  await reward.getByRole('button', { name: 'Manter' }).click()
  await expect(
    page.getByText('Minério de Ferro foi para o inventário extra.'),
  ).toBeVisible()
})

test('REQ-89: efeito e habilidade da montaria no Preparar', async ({
  page,
}) => {
  await page.goto('/grupo/party-montaria')
  const effects = page.getByRole('region', { name: 'Ativar efeitos' })
  await expect(effects).toContainText('Montaria · Pônei de Guerra')
  await expect(
    effects.getByRole('button', {
      name: 'Ativar Pônei de Guerra — efeito 1',
    }),
  ).toBeVisible()
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/actions'),
  )
  await page
    .getByRole('group', { name: /Preparar habilidade · Trote/ })
    .getByRole('button', { name: 'Usar habilidade' })
    .click()
  expect((await request).postDataJSON()).toEqual({
    type: 'prepare',
    operation: 'useAbility',
    mountAbility: true,
    abilityId: 'pony-trot',
  })
})
