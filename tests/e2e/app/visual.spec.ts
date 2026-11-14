import { expect, test } from '@playwright/test'

const viewports = [
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
]

for (const viewport of viewports) {
  test.describe(`REQ-02: rota inicial em ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport })

    test('REQ-02: não existe rolagem horizontal', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('status')).toBeVisible()
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  })
}

test('REQ-02: fundo e texto usam os tokens do tema escuro', async ({
  page,
}) => {
  await page.goto('/')
  const colors = await page.evaluate(() => {
    const probe = document.createElement('div')
    document.body.append(probe)
    probe.style.color = 'var(--color-bg)'
    const bg = getComputedStyle(probe).color
    probe.style.color = 'var(--color-text)'
    const text = getComputedStyle(probe).color
    probe.remove()
    const body = getComputedStyle(document.body)
    return { bg, text, bodyBg: body.backgroundColor, bodyText: body.color }
  })
  expect(colors.bg).not.toBe('')
  expect(colors.bodyBg).toBe(colors.bg)
  expect(colors.bodyText).toBe(colors.text)
})

test('REQ-02: título com a fonte de títulos (Lora) e status com a fonte do sistema', async ({
  page,
}) => {
  await page.goto('/')
  const title = page.getByRole('heading', { level: 1, name: 'Misadventures' })
  const status = page.getByRole('status')
  await expect(title).toHaveCSS('font-family', /Lora/)
  const statusFont = await status.evaluate(
    (el) => getComputedStyle(el).fontFamily,
  )
  expect(statusFont).not.toMatch(/Lora/)
})

test('REQ-02: o arquivo da fonte de títulos é servido com o app e carrega', async ({
  page,
}) => {
  await page.goto('/')
  const loadedFaces = await page.evaluate(
    async () => (await document.fonts.load('16px "Lora"')).length,
  )
  expect(loadedFaces).toBeGreaterThan(0)
})
