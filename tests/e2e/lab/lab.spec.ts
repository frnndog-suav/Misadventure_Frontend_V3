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
  await expect(page.getByRole('status')).toHaveText('Configuração salva.')
  await expect(actionPoints).toHaveValue('4')

  await page.getByRole('button', { name: 'Restaurar padrões' }).click()
  await expect(page.getByRole('status')).toHaveText('Padrões restaurados.')
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
