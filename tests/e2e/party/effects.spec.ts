import { expect, test } from '@playwright/test'

test('REQ-54: ativa efeito com zero pontos e exibe o status devolvido', async ({
  page,
}) => {
  await page.goto('/grupo/party-com-efeitos')
  await expect(page.getByRole('region', { name: 'A vez' })).toContainText(
    '0 pontos de ação',
  )
  const statuses = page.getByRole('region', { name: 'Status' })
  await expect(statuses.getByText('Nenhum status ativo.')).toBeVisible()
  const effects = page.getByRole('region', { name: 'Ativar efeitos' })
  const activate = effects.getByRole('button', {
    name: 'Ativar Tônico de Força — efeito 1',
  })
  const request = page.waitForRequest((request) =>
    request.url().endsWith('/actions'),
  )
  await activate.click()
  expect((await request).postDataJSON()).toEqual({
    type: 'prepare',
    operation: 'activate',
    cardId: 'fixture.strength-tonic',
    effectIndex: 0,
  })
  await expect(page.getByRole('status')).toHaveText('Efeito ativado.')
  await expect(statuses.getByText('Buff')).toBeVisible()
  await expect(statuses.getByText('Origem: Tônico de Força')).toBeVisible()
  await expect(statuses.getByText('Restantes: 2')).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Modificadores', exact: true }),
  ).toContainText('9 Ataque')
  await expect(activate).toHaveCount(0)
})
