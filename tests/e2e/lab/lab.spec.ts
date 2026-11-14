import { expect, test } from '@playwright/test'

test('REQ-05: no build de dev, /lab abre a tela com o título "Laboratório"', async ({
  page,
}) => {
  await page.goto('/lab')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Laboratório' }),
  ).toBeVisible()
})
