import { expect, test } from '@playwright/test'

test('REQ-20: lista, filtra, busca e escolhe cartas (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()

  const cards = page.getByRole('region', { name: 'Cartas' })
  const list = cards.getByRole('list', { name: 'Cartas' })
  const forca = list.getByRole('button', {
    name: 'Força · Atributo · Publicada',
  })
  await expect(forca).toBeVisible()

  await cards.getByRole('radio', { name: 'Atributo' }).check()
  await cards.getByRole('radio', { name: 'Publicada' }).check()
  await cards.getByRole('searchbox', { name: 'Buscar por nome' }).fill('for')
  await cards.getByRole('searchbox', { name: 'Buscar por nome' }).press('Enter')
  await expect(forca).toBeVisible()

  await forca.click()
  await expect(forca).toHaveAttribute('aria-pressed', 'true')

  await cards.getByRole('button', { name: 'Nova carta' }).click()
  const picker = cards.getByRole('group', { name: 'Tipo da nova carta' })
  await expect(picker.getByRole('button')).toHaveCount(7)
  await expect(picker.getByRole('button').last()).toHaveText('Dimensão')
  await picker.getByRole('button', { name: 'Zona' }).click()
  await expect(picker).toBeHidden()
  await expect(forca).toHaveAttribute('aria-pressed', 'false')
})
