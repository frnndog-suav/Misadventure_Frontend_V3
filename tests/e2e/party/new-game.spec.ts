import { expect, test } from '@playwright/test'

test.describe('REQ-15: novo jogo (MSW)', () => {
  test('REQ-102: cria um grupo com o máximo padrão de cinco ajudantes', async ({
    page,
  }) => {
    await page.goto('/novo')
    const helpers = page.getByRole('combobox', { name: 'Ajudantes de IA' })
    await expect(helpers.getByRole('option')).toHaveText([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
    ])
    await expect(helpers).toHaveValue('0')
    await helpers.selectOption('5')
    await page
      .getByRole('textbox', { name: 'Nome do grupo' })
      .fill('Os Teimosos')
    await page.getByRole('textbox', { name: 'Nome do personagem' }).fill('Lia')
    await page.getByRole('radio', { name: /^Guerreiro/ }).check()
    await page.getByRole('button', { name: 'Criar grupo' }).click()
    await expect(page).toHaveURL(/\/grupo\/fixture\.party-with-5-helpers$/)
  })

  test('REQ-15: criar "Os Teimosos" / "Lia" vai para o grupo criado', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Novo jogo' }).click()
    await expect(page).toHaveURL(/\/novo$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Novo jogo' }),
    ).toBeVisible()

    await page
      .getByRole('textbox', { name: 'Nome do grupo' })
      .fill('Os Teimosos')
    await page.getByRole('textbox', { name: 'Nome do personagem' }).fill('Lia')
    await page.getByRole('radio', { name: /^Guerreiro/ }).check()
    await page.getByRole('button', { name: 'Criar grupo' }).click()
    await expect(page).toHaveURL(/\/grupo\/party-os-teimosos$/)
  })

  test('REQ-29: escolha da classe mostra detalhes; sem classe pede uma', async ({
    page,
  }) => {
    await page.goto('/novo')
    const group = page.getByRole('radiogroup', { name: 'Classe' })
    await expect(group.getByRole('radio')).toHaveCount(2)

    await page
      .getByRole('textbox', { name: 'Nome do grupo' })
      .fill('Os Teimosos')
    await page.getByRole('textbox', { name: 'Nome do personagem' }).fill('Lia')
    await page.getByRole('button', { name: 'Criar grupo' }).click()
    await expect(group).toHaveAccessibleDescription('Escolha uma classe.')

    await page.getByRole('radio', { name: /^Ladino/ }).check()
    await expect(
      page
        .getByRole('list', { name: 'Modificadores base' })
        .getByRole('listitem'),
    ).toHaveText([
      '5 Ataque',
      '2 Defesa',
      '46 Precisão',
      '22 Esquiva',
      '12 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    await expect(
      page.getByRole('list', { name: 'Deck pré-pronto' }).getByRole('listitem'),
    ).toHaveText(['40× Destreza', '20× Força'])
  })

  test('REQ-15: erros por campo e aviso de grupo de 1', async ({ page }) => {
    await page.goto('/novo')
    const name = page.getByRole('textbox', { name: 'Nome do grupo' })
    const character = page.getByRole('textbox', { name: 'Nome do personagem' })
    const create = page.getByRole('button', { name: 'Criar grupo' })

    await name.fill('   ')
    await character.fill('Um nome com mais de vinte e quatro letras')
    await create.click()
    await expect(name).toHaveAccessibleDescription('Informe o nome do grupo.')
    await expect(character).toHaveAccessibleDescription(
      'Use até 24 caracteres.',
    )
    await expect(character).toHaveValue(
      'Um nome com mais de vinte e quatro letras',
    )

    await name.fill('Solo')
    await character.fill('Lia')
    await create.click()
    await expect(page.getByRole('status')).toHaveText(
      'A configuração atual não permite jogar com um grupo de 1.',
    )
    await expect(name).not.toHaveAttribute('aria-describedby')
  })

  test('REQ-15: "Voltar" leva a /', async ({ page }) => {
    await page.goto('/novo')
    await page.getByRole('link', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
