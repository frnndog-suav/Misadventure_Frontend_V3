import { expect, test } from '@playwright/test'

test('REQ-32: lista as classes e abre uma publicada com "Classe" travada (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const classes = page.getByRole('region', { name: 'Classes' })
  const list = classes.getByRole('list', { name: 'Classes' })
  await expect(list.getByRole('button')).toHaveText([
    'Ladino · Publicada',
    'Guerreiro · Publicada',
  ])
  await list.getByRole('button', { name: 'Ladino · Publicada' }).click()
  const form = page.getByRole('region', { name: 'Classe', exact: true })
  await expect(form.getByRole('combobox', { name: 'Classe' })).toBeDisabled()
  await expect(form.getByLabel('Nome', { exact: true })).toHaveValue('Ladino')
  await expect(form.getByLabel('Carta 1')).toHaveValue(
    'fixture.dexterity-basic',
  )
})

test('REQ-32: cria, publica (erro do deck) e exclui uma classe (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const classes = page.getByRole('region', { name: 'Classes' })
  await classes.getByRole('button', { name: 'Nova classe' }).click()
  const form = page.getByRole('region', { name: 'Classe', exact: true })
  const save = form.getByRole('button', { name: 'Salvar classe' })
  await expect(save).toBeDisabled()

  await form.getByLabel('Classe').selectOption({ label: 'Mago' })
  await form.getByLabel('Nome', { exact: true }).fill('Mago')
  const essentials = form.getByRole('group', { name: 'Atributos essenciais' })
  await essentials.getByRole('button', { name: 'Adicionar' }).click()
  await essentials
    .getByLabel('Atributo essencial 1')
    .selectOption({ label: 'Inteligência' })
  for (const label of [
    'Ataque',
    'Defesa',
    'Precisão',
    'Esquiva',
    'Celeridade',
    'Perfuração',
    'Reflexão',
  ]) {
    await form.getByLabel(label, { exact: true }).fill('1')
  }
  const deck = form.getByRole('group', { name: 'Deck pré-pronto' })
  await deck.getByRole('button', { name: 'Adicionar' }).click()
  await deck.getByLabel('Carta 1').fill('bosque.forca-bruta')
  await deck.getByLabel('Cópias 1').fill('60')
  await save.click()
  await expect(form.getByRole('status')).toHaveText('Classe salva.')

  await form.getByRole('button', { name: 'Publicar classe' }).click()
  await page
    .getByRole('dialog', { name: 'Publicar “Mago”?' })
    .getByRole('button', { name: 'Publicar' })
    .click()
  await expect(
    form.getByText('O deck pré-pronto não cumpre a trava da classe.'),
  ).toBeVisible()

  await form.getByRole('button', { name: 'Excluir classe' }).click()
  await page
    .getByRole('dialog', { name: 'Excluir “Mago”?' })
    .getByRole('button', { name: 'Excluir' })
    .click()
  await expect(
    page.getByRole('region', { name: 'Classes' }).getByRole('status'),
  ).toHaveText('Classe excluída.')
  await expect(form).toHaveCount(0)
})

test('REQ-32: alteração não salva da classe pergunta antes de trocar (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page.getByRole('button', { name: 'Ladino · Publicada' }).click()
  const form = page.getByRole('region', { name: 'Classe', exact: true })
  await form.getByLabel('Nome', { exact: true }).fill('Ladrão')
  await page.getByRole('button', { name: 'Guerreiro · Publicada' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Descartar alterações?' }),
  ).toContainText('As alterações desta classe ainda não foram salvas.')
})
