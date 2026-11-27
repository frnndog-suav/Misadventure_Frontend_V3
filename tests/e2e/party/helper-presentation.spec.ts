import { expect, test } from '@playwright/test'

const partyUrl = '/grupo/fixture.party-helper-presentation'

test('REQ-107: apresenta abertura e ação na ordem do MSW e restaura o estado final', async ({
  page,
}) => {
  test.setTimeout(45_000)
  await page.goto(partyUrl)
  const sequence = page.getByRole('region', { name: 'Vezes dos ajudantes' })
  await expect(sequence).toContainText('Ajudante 1')
  await expect(sequence).toContainText('Movimento')
  await expect(
    sequence.getByRole('region', { name: 'Mapa' }).getByRole('button', {
      name: /Ajudante 1 está aqui/,
    }),
  ).toBeDisabled()
  await expect(sequence).toContainText('Antecipação')
  await expect(sequence).toContainText('Viajante ferido')
  await expect(sequence).toContainText('Combate iniciado')
  await expect(sequence).toContainText('Turno de')
  await expect(sequence).toContainText('Combate encerrado')
  await expect(sequence).toHaveCount(0)
  await expect(
    page.getByText('Combate iniciado', { exact: false }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Encerrar a vez' }).click()
  await expect(sequence).toBeVisible()
  await expect(sequence).toContainText('Movimento')
  await expect(
    sequence.getByRole('region', { name: 'Mapa' }).getByRole('button', {
      name: /Ajudante 1 está aqui/,
    }),
  ).toBeDisabled()
  await expect(sequence).toContainText('Antecipação')
  await expect(sequence).toContainText('Viajante ferido')
  await expect(sequence).toContainText('Combate iniciado')
  await expect(sequence).toContainText('Turno de')
  await expect(sequence).toContainText('Combate encerrado')
  await expect(sequence).toHaveCount(0)
  await expect(
    page.getByRole('list', { name: 'Transições de combate' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Encerrar a vez' }),
  ).toBeEnabled()
})

test('REQ-108: bloqueia intenções durante o avanço e a apresentação e permite pular', async ({
  page,
}) => {
  let actions = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/actions'))
      actions++
  })
  await page.goto(partyUrl)
  const skip = page.getByRole('button', { name: 'Pular apresentação' })
  await skip.click()
  const pass = page.getByRole('button', { name: 'Encerrar a vez' })
  await pass.click()
  await expect(pass).toBeDisabled()
  await expect(skip).toBeVisible()
  await expect(pass).toBeHidden()
  await page.keyboard.press('Enter')
  await expect(skip).toBeVisible()
  expect(actions).toBe(1)
  await skip.click()
  await expect(pass).toBeEnabled()
})
