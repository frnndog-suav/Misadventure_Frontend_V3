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
    page.getByRole('list', { name: 'Por tipo' }).getByText('Zona: 1'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Nova coleção' }).click()
  await page.getByLabel('Identificador').fill('Bosque X')
  await page.getByRole('button', { name: 'Criar coleção' }).click()
  await expect(status).toHaveText('Conteúdo inválido.')
  await expect(page.getByLabel('Identificador')).toHaveAccessibleDescription(
    'Use só letras minúsculas, números e hífens.',
  )

  await page.getByLabel('Identificador').fill('bosque')
  await page.getByLabel('Nome').fill('Bosque Sombrio')
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
  await page.getByLabel('Nome').fill('Mudou')

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
