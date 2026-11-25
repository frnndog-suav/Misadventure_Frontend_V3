import { expect, test } from '@playwright/test'

test('REQ-59: reabre a escolha e troca a recompensa após um lote aceito', async ({
  page,
}) => {
  await page.goto('/grupo/party-evento-premio-urbano')
  await page.reload()
  const reward = page.getByRole('region', { name: 'Recompensa pendente' })
  await expect(reward).toContainText('Minério de Ferro')
  await reward.getByRole('button', { name: 'Manter' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'O lote não libera espaço para a recompensa.',
  )
  await reward
    .getByLabel('Descartar Peixe Prateado (Inventário)')
    .selectOption('1')
  await reward.getByRole('button', { name: 'Manter' }).click()
  await expect(
    page.getByText('Minério de Ferro foi para o inventário.'),
  ).toBeVisible()
  await expect(reward).toContainText('Poção de Cura')
  await reward.getByRole('button', { name: 'Deixar' }).click()
  await expect(page.getByText('Poção de Cura saiu da reserva.')).toBeVisible()
  await expect(reward).toHaveCount(0)
})

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
