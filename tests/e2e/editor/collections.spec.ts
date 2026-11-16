import { expect, test } from '@playwright/test'

test('REQ-18: /lab leva ao editor e o editor volta ao laboratório', async ({
  page,
}) => {
  await page.goto('/lab')
  await page.getByRole('link', { name: 'Editor de conteúdo' }).click()
  await expect(page).toHaveURL(/\/lab\/editor$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Editor de conteúdo' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao laboratório' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laboratório' }),
  ).toBeVisible()
})

test('REQ-19: escolhe, cria e exclui coleção (MSW)', async ({ page }) => {
  await page.goto('/lab/editor')
  const status = page
    .getByRole('region', { name: 'Coleções' })
    .getByRole('status')

  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await expect(
    page.getByRole('list', { name: 'Por tipo' }).getByText('Zona: 4'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Nova coleção' }).click()
  await page.getByLabel('Identificador').fill('Bosque X')
  await page.getByRole('button', { name: 'Criar coleção' }).click()
  await expect(status).toHaveText('Conteúdo inválido.')
  await expect(page.getByLabel('Identificador')).toHaveAccessibleDescription(
    'Use só letras minúsculas, números e hífens.',
  )

  await page.getByLabel('Identificador').fill('bosque')
  await page.getByLabel('Nome', { exact: true }).fill('Bosque Sombrio')
  await page.getByRole('button', { name: 'Criar coleção' }).click()
  await expect(status).toHaveText('Coleção criada.')
  await expect(
    page.getByRole('heading', { name: 'Bosque Antigo' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Excluir coleção' }).click()
  const dialog = page.getByRole('dialog', { name: 'Excluir “Bosque Antigo”?' })
  await dialog.getByRole('button', { name: 'Excluir' }).click()
  await expect(status).toHaveText('Coleção excluída.')
})

test('REQ-24: alterações não salvas na coleção pedem confirmação ao sair', async ({
  page,
}) => {
  await page.goto('/lab')
  await page.getByRole('link', { name: 'Editor de conteúdo' }).click()
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page.getByRole('button', { name: 'Editar coleção' }).click()
  await page.getByLabel('Nome', { exact: true }).fill('Mudou')

  await page.goBack()
  const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Continuar editando' }),
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/lab\/editor$/)

  await page.getByRole('link', { name: 'Voltar ao laboratório' }).click()
  await dialog.getByRole('button', { name: 'Descartar' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laboratório' }),
  ).toBeVisible()
})

test('REQ-25 / REQ-31: valida a coleção `fixture` como dimensão válida (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  const section = page.getByRole('region', { name: 'Coleções' })
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page.getByRole('button', { name: 'Validar como dimensão' }).click()
  await expect(section.getByRole('status')).toHaveText(
    'A coleção forma uma dimensão válida.',
  )
  await expect(section.getByRole('list', { name: 'Problemas' })).toHaveCount(0)
})

test('REQ-26: exporta a coleção para {id}.json (MSW)', async ({ page }) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar' }).click()
  expect((await download).suggestedFilename()).toBe('fixture.json')
  await expect(
    page.getByRole('region', { name: 'Coleções' }).getByRole('status'),
  ).toHaveText('Coleção exportada.')
})

test('REQ-26: importa coleção; erros de arquivo e de conteúdo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  const section = page.getByRole('region', { name: 'Coleções' })
  const status = section.getByRole('status')
  const input = page.getByLabel('Importar coleção')

  await input.setInputFiles({
    name: 'ruim.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{isto não é json'),
  })
  await expect(status).toHaveText('O arquivo não é um JSON válido.')

  await input.setInputFiles({
    name: 'vazio.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  })
  await expect(
    section.getByRole('list', { name: 'Problemas' }).getByRole('listitem'),
  ).toHaveText(['formatVersion: Versão do arquivo não suportada.'])

  await input.setInputFiles({
    name: 'bosque.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ collection: { id: 'novo' }, cards: [] }),
    ),
  })
  await expect(status).toHaveText('Coleção importada: 1 cartas e 0 classes.')
  await expect(
    page.getByRole('heading', { name: 'Bosque Antigo' }),
  ).toBeVisible()
})
