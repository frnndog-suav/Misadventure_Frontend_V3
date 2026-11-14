import { expect, test } from '@playwright/test'

test('T-03: a rota inicial abre sem o conteúdo do template', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Misadventures' }),
  ).toBeVisible()
  await expect(page.getByText('Get started')).toHaveCount(0)
})

test('T-03: com VITE_USE_MOCKS=true o console mostra o MSW ativo', async ({
  page,
}) => {
  const mensagens: string[] = []
  page.on('console', (msg) => mensagens.push(msg.text()))

  await page.goto('/')

  await expect
    .poll(() => mensagens.some((m) => /\[MSW\]/i.test(m)), { timeout: 10_000 })
    .toBe(true)
})
