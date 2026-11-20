import { expect, test } from '@playwright/test'

test('REQ-57 e REQ-58: revela, paga por cópia e encerra o evento', async ({
  page,
}) => {
  await page.goto('/grupo/party-evento-aleatorio')
  await page.getByRole('button', { name: 'Iniciar evento' }).click()
  const event = page.getByRole('region', { name: 'Evento aleatório' })
  await expect(
    event.getByRole('heading', { name: 'Antecipação' }),
  ).toBeVisible()
  await expect(event.getByRole('article')).toHaveCount(0)
  await event.getByRole('button', { name: 'Revelar carta' }).click()
  await expect(
    event.getByRole('heading', { name: 'Carroça na estrada' }),
  ).toBeVisible()
  await event.getByRole('checkbox', { name: /\(h2\)/ }).check()
  await event.getByRole('button', { name: 'Pagar requisito' }).click()
  await expect(
    event.getByRole('list', { name: 'Recibos de pagamento' }),
  ).toContainText('h2')
  await expect(event.getByRole('button', { name: 'Fugir' })).toHaveCount(0)
  await event.getByRole('checkbox', { name: /\(h1\)/ }).check()
  await event.getByRole('button', { name: 'Pagar requisito' }).click()
  const result = page.getByRole('region', {
    name: 'Resultado do último evento',
  })
  await expect(result.getByRole('heading', { name: 'Êxito' })).toBeVisible()
  await expect(result.getByText('Reposição: 2 de 2 cartas.')).toBeVisible()
})
