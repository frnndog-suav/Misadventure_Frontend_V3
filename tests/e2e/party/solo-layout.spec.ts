import { expect, test, type Locator, type Page } from '@playwright/test'

async function expectNoOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBe(0)
}

async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible()
  for (let index = 0; index < 160; index++) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((element) => element === document.activeElement))
      break
  }
  await expect(target).toBeFocused()
  await expect(target).toHaveCSS('outline-color', 'rgb(127, 184, 255)')
  await expect(target).toHaveCSS('outline-style', 'solid')
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })

    test('REQ-115 e REQ-116 — campanha solo com teclado', async ({ page }) => {
      await page.goto('/')
      const saves = page.getByRole('region', { name: 'Seus jogos' })
      await expect(
        saves.getByText('Os Teimosos', { exact: true }),
      ).toBeVisible()
      await expectNoOverflow(page)
      await tabTo(page, page.getByRole('link', { name: 'Novo jogo' }))
      await page.keyboard.press('Enter')

      const group = page.getByRole('textbox', { name: 'Nome do grupo' })
      await tabTo(page, group)
      await page.keyboard.type('Os Teimosos')
      await tabTo(
        page,
        page.getByRole('textbox', { name: 'Nome do personagem' }),
      )
      await page.keyboard.type('Lia')
      const rogue = page.getByRole('radio', { name: /^Ladino/ })
      await tabTo(page, rogue)
      await page.keyboard.press('Space')
      await expect(rogue).toBeChecked()
      await page.keyboard.press('ArrowRight')
      await expect(
        page.getByRole('radio', { name: /^Guerreiro/ }),
      ).toBeChecked()
      await expect(
        page.getByRole('heading', { name: 'Guerreiro' }),
      ).toBeVisible()
      await expectNoOverflow(page)
      await tabTo(page, page.getByRole('button', { name: 'Criar grupo' }))
      await page.keyboard.press('Enter')

      const endSession = page.getByRole('button', { name: 'Encerrar sessão' })
      await expect(endSession).toBeEnabled()
      await tabTo(page, endSession)
      await page.keyboard.press('Enter')
      await expect(saves.getByRole('status')).toHaveText('Sessão encerrada.')
      await tabTo(
        page,
        saves
          .getByRole('listitem')
          .filter({ hasText: 'Os Teimosos' })
          .getByRole('button', { name: 'Continuar' }),
      )
      await page.keyboard.press('Enter')
      await expect(page.getByText('Rodada 1')).toBeVisible()

      const character = page.getByRole('region', { name: 'Lia', exact: true })
      for (const panel of ['Mão', 'Inventário']) {
        await tabTo(
          page,
          character.getByRole('link', { name: panel, exact: true }),
        )
        await page.keyboard.press('Enter')
        const title = character.getByRole('heading', {
          name: new RegExp(`^${panel} `),
        })
        await expect(title).toBeFocused()
        await expect(title).toHaveCSS('outline-style', 'solid')
      }

      const map = page.getByRole('region', { name: 'Mapa' })
      const destination = map.getByRole('button', { name: /Curva de Pedra/ })
      await expect(destination).toContainText('Destino disponível')
      await tabTo(page, destination)
      await page.keyboard.press('Enter')
      await expect(destination).toHaveAttribute('aria-pressed', 'true')
      const zone = page.getByRole('region', { name: 'Zona escolhida' })
      await expect(zone).toContainText('Travessias com:')
      await expectNoOverflow(page)
      await tabTo(
        page,
        zone.getByRole('button', {
          name: 'Movimentar para Curva de Pedra',
          exact: true,
        }),
      )
      await page.keyboard.press('Enter')
      await expect(destination).toContainText('Lia está aqui')
      await expect(destination).toHaveAttribute('aria-current', 'location')

      await tabTo(page, page.getByRole('button', { name: 'Encerrar a vez' }))
      await page.keyboard.press('Enter')
      await expect(page.getByText('Rodada 2', { exact: true })).toBeVisible()
      await tabTo(page, page.getByRole('button', { name: 'Ir ao Mercado' }))
      await page.keyboard.press('Enter')
      const market = page.getByRole('region', { name: 'Mercado' })
      await tabTo(
        page,
        market.getByRole('button', { name: 'Comprar Expansão do cofre' }),
      )
      await page.keyboard.press('Enter')
      await expect(
        market.getByRole('list', { name: 'Operações' }),
      ).toContainText('Comprar Expansão do cofre')
      await expectNoOverflow(page)
    })
  })
}
