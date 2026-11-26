import { expect, test } from '@playwright/test'
// Em `/` a área de status da ponte (REQ-01) vem antes da de "Seus jogos"// (REQ-14): `.first()` escolhe a da ponte.

test('T-03: a rota inicial abre sem o conteúdo do template', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Misadventures' }),
  ).toBeVisible()
  await expect(page.getByText('Get started')).toHaveCount(0)
})

test('REQ-01: a área de status mostra o servidor conectado e a versão do contrato', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('status').first()).toContainText(
    'Servidor conectado · contrato v0.4',
  )
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

test.describe('REQ-14 e REQ-17: menu inicial e abandono (MSW)', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' })

  test('REQ-14: mostra "Novo jogo" e o save de exemplo; "Continuar" vai ao grupo', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Novo jogo' })).toHaveAttribute(
      'href',
      '/novo',
    )
    const games = page.getByRole('region', { name: 'Seus jogos' })
    const save = games.getByRole('listitem').filter({ hasText: 'Os Teimosos' })
    await expect(save).toHaveCount(1)
    await expect(save).toContainText('Os Teimosos')
    await expect(save).toContainText('Lia')
    await expect(save).toContainText('Pausado')
    await expect(save).toContainText('Salvo em 14/11/2026 18:30')

    await save.getByRole('button', { name: 'Continuar' }).click()
    await expect(page).toHaveURL(/\/grupo\/party-os-teimosos$/)
  })

  test('REQ-17: Cancelar devolve o foco; confirmar mostra "Grupo abandonado."', async ({
    page,
  }) => {
    await page.goto('/')
    const games = page.getByRole('region', { name: 'Seus jogos' })
    const abandon = games
      .getByRole('listitem')
      .filter({ hasText: 'Os Teimosos' })
      .getByRole('button', { name: 'Abandonar' })

    await abandon.click()
    const dialog = page.getByRole('dialog', {
      name: 'Abandonar “Os Teimosos”?',
    })
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(abandon).toBeFocused()

    await abandon.click()
    await dialog.getByRole('button', { name: 'Abandonar' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(games.getByRole('status')).toHaveText('Grupo abandonado.')
  })
})
