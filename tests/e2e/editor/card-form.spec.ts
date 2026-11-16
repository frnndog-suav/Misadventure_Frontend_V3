import { expect, test } from '@playwright/test'

test('REQ-21, REQ-22: cria uma carta de atributo com pré-visualização (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Atributo' })
    .click()

  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  await expect(form.getByText('Situação: Rascunho')).toBeVisible()
  await expect(preview).toContainText(
    'Preencha os campos obrigatórios para ver a carta.',
  )
  await expect(save).toBeDisabled()

  await form.getByLabel('Identificador').fill('forca')
  await form.getByLabel('Nome', { exact: true }).fill('Força')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form
    .getByLabel('Tipo', { exact: true })
    .selectOption({ label: 'Básica' })
  const attributes = form.getByRole('group', { name: 'Atributos' })
  await attributes.getByRole('button', { name: 'Adicionar' }).click()
  await attributes.getByLabel('Atributo 1').selectOption({ label: 'Força' })
  await expect(form.getByText('Id: fixture.forca')).toBeVisible()
  await expect(preview.getByRole('article', { name: 'Força' })).toBeVisible()

  await save.click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-21: CONTENT_INVALID liga o texto ao campo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Atributo' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await form.getByLabel('Identificador').fill('forca-sorte')
  await form.getByLabel('Nome', { exact: true }).fill('Força')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form
    .getByLabel('Tipo', { exact: true })
    .selectOption({ label: 'Básica' })
  const attributes = form.getByRole('group', { name: 'Atributos' })
  await attributes.getByRole('button', { name: 'Adicionar' }).click()
  await attributes.getByLabel('Atributo 1').selectOption({ label: 'Força' })
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()

  await expect(form.getByRole('status')).toHaveText('Conteúdo inválido.')
  await expect(attributes).toHaveAccessibleDescription(
    'Carta básica tem exatamente 1 atributo.',
  )
})

test('REQ-24: carta com alterações pergunta antes de trocar (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards
    .getByRole('button', { name: 'Força · Atributo · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Identificador')).toHaveAttribute('readonly', '')
  await form.getByLabel('Nome', { exact: true }).fill('Mudou')

  await cards
    .getByRole('button', { name: 'Bosque Sussurrante · Zona · Publicada' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
  await expect(dialog).toContainText(
    'As alterações desta carta ainda não foram salvas.',
  )
  await dialog.getByRole('button', { name: 'Descartar' }).click()
  await expect(form.getByLabel('Título')).toHaveValue('Bosque Sussurrante')
})

test('REQ-21: cria um equipamento com refino e pré-visualização (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Equipamento' })
    .click()

  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  await expect(save).toBeDisabled()

  await form.getByLabel('Identificador').fill('espada')
  await form.getByLabel('Nome', { exact: true }).fill('Espada')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form.getByLabel('Slot').selectOption({ label: 'Arma' })
  await expect(preview.getByRole('article', { name: 'Espada' })).toBeVisible()

  await form.getByLabel('Refino').check()
  await expect(save).toBeDisabled()
  await form.getByLabel('Nível máximo').fill('3')
  await form.getByLabel('Materiais').fill('1 Minério por nível.')
  await expect(save).toBeEnabled()

  await save.click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-21: abre um item da lista com os valores recebidos (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page
    .getByRole('region', { name: 'Cartas' })
    .getByRole('button', { name: 'Poção de Cura · Item · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Identificador')).toHaveValue('healing-potion')
  await expect(form.getByLabel('Categoria')).toHaveValue('consumable')
  await expect(form.getByLabel('Etiqueta 1')).toHaveValue('poção')
  await expect(form.getByLabel('Efeito 1')).toHaveValue('Recupera 5 de vida.')
})
