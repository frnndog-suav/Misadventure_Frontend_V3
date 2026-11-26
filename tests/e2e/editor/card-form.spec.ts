import { expect, test } from '@playwright/test'

test('REQ-21, REQ-22: cria uma carta de atributo com pré-visualização (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Atributo' })
    .click()

  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  await expect(form.getByText('Situação: Rascunho')).toBeVisible()
  await expect(preview).toContainText(
    'Preencha os campos obrigatórios para ver a carta.',
  )
  await expect(save).toBeDisabled()

  await form.getByLabel('Identificador').fill('forca')
  await form.getByLabel('Nome', { exact: true }).fill('Força')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form
    .getByLabel('Tipo', { exact: true })
    .selectOption({ label: 'Básica' })
  const attributes = form.getByRole('group', { name: 'Atributos' })
  await attributes.getByRole('button', { name: 'Adicionar' }).click()
  await attributes.getByLabel('Atributo 1').selectOption({ label: 'Força' })
  await expect(form.getByText('Id: fixture.forca')).toBeVisible()
  await expect(preview.getByRole('article', { name: 'Força' })).toBeVisible()

  await save.click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-21: CONTENT_INVALID liga o texto ao campo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Atributo' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await form.getByLabel('Identificador').fill('forca-sorte')
  await form.getByLabel('Nome', { exact: true }).fill('Força')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form
    .getByLabel('Tipo', { exact: true })
    .selectOption({ label: 'Básica' })
  const attributes = form.getByRole('group', { name: 'Atributos' })
  await attributes.getByRole('button', { name: 'Adicionar' }).click()
  await attributes.getByLabel('Atributo 1').selectOption({ label: 'Força' })
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()

  await expect(form.getByRole('status')).toHaveText('Conteúdo inválido.')
  await expect(attributes).toHaveAccessibleDescription(
    'Carta básica tem exatamente 1 atributo.',
  )
})

test('REQ-24: carta com alterações pergunta antes de trocar (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards
    .getByRole('button', { name: 'Força · Atributo · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Identificador')).toHaveAttribute('readonly', '')
  await form.getByLabel('Nome', { exact: true }).fill('Mudou')

  await cards
    .getByRole('button', { name: 'Bosque Sussurrante · Zona · Publicada' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' })
  await expect(dialog).toContainText(
    'As alterações desta carta ainda não foram salvas.',
  )
  await dialog.getByRole('button', { name: 'Descartar' }).click()
  await expect(form.getByLabel('Título')).toHaveValue('Bosque Sussurrante')
})

test('REQ-21: cria um equipamento com refino e pré-visualização (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Equipamento' })
    .click()

  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  await expect(save).toBeDisabled()

  await form.getByLabel('Identificador').fill('espada')
  await form.getByLabel('Nome', { exact: true }).fill('Espada')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form.getByLabel('Slot').selectOption({ label: 'Arma' })
  await expect(preview.getByRole('article', { name: 'Espada' })).toBeVisible()

  await form.getByLabel('Refino').check()
  await expect(save).toBeDisabled()
  await form.getByLabel('Nível máximo').fill('3')
  await expect(save).toBeEnabled()

  await save.click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-21: abre um item da lista com os valores recebidos (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page
    .getByRole('region', { name: 'Cartas' })
    .getByRole('button', { name: 'Poção de Cura · Item · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Identificador')).toHaveValue('healing-potion')
  await expect(form.getByLabel('Categoria')).toHaveValue('consumable')
  await expect(form.getByLabel('Etiqueta 1')).toHaveValue('poção')
  await expect(form.getByLabel('Texto do efeito 1')).toHaveValue(
    'Recupera 5 de vida.',
  )
})

test('REQ-21: cria um evento de combate com um inimigo (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Evento de combate' })
    .click()

  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  await form.getByLabel('Identificador').fill('emboscada')
  await form.getByLabel('Título').fill('Emboscada')
  await form.getByLabel('Coisa boa', { exact: true }).fill('Vitória.')
  await form.getByLabel('Coisa ruim', { exact: true }).fill('Derrota.')
  await form
    .getByRole('group', { name: 'Inimigos' })
    .getByRole('button', { name: 'Adicionar' })
    .last()
    .click()
  await expect(save).toBeDisabled()
  await form.getByLabel('Nome do inimigo 1').fill('Bandido')
  await form
    .getByRole('group', { name: 'Tipos do inimigo 1' })
    .getByLabel('Humanoide')
    .check()
  await form.getByLabel('Criatura do inimigo 1').fill('Humano')
  await form
    .getByLabel('Categoria do inimigo 1')
    .selectOption({ label: 'Comum' })
  await form.getByLabel('Vida do inimigo 1').fill('5')
  await form
    .getByLabel('Comportamento do inimigo 1')
    .selectOption({ label: 'Caçador' })
  await expect(save).toBeEnabled()
  await expect(
    preview.getByRole('article', { name: 'Emboscada' }),
  ).toBeVisible()
  await save.click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-21: abre um evento aleatório da lista com os valores recebidos (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page
    .getByRole('region', { name: 'Cartas' })
    .getByRole('button', {
      name: 'Viajante Ferido · Evento aleatório · Publicada',
    })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Identificador')).toHaveValue('wounded-traveler')
  await expect(form.getByLabel('Requisito 1')).toHaveValue(
    'Possuir uma Poção de Cura.',
  )
  await expect(form.getByLabel('Sem fuga')).not.toBeChecked()
})

test('REQ-23: publica, duplica e exclui uma carta (MSW)', async ({ page }) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Atributo' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const publish = form.getByRole('button', { name: 'Publicar' })
  await expect(publish).toBeDisabled()
  await form.getByLabel('Identificador').fill('forca')
  await form.getByLabel('Nome', { exact: true }).fill('Força')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form
    .getByLabel('Tipo', { exact: true })
    .selectOption({ label: 'Básica' })
  const attributes = form.getByRole('group', { name: 'Atributos' })
  await attributes.getByRole('button', { name: 'Adicionar' }).click()
  await attributes.getByLabel('Atributo 1').selectOption({ label: 'Força' })
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')

  await publish.click()
  const publishDialog = page.getByRole('dialog', { name: 'Publicar “Força”?' })
  await expect(
    publishDialog.getByRole('button', { name: 'Cancelar' }),
  ).toBeFocused()
  await publishDialog.getByRole('button', { name: 'Publicar' }).click()
  await expect(form.getByRole('status')).toHaveText('Carta publicada.')
  await expect(form.getByText('Situação: Publicada')).toBeVisible()
  await expect(form.getByLabel('Identificador')).toHaveAttribute('readonly', '')

  await form.getByRole('button', { name: 'Duplicar' }).click()
  await expect(form.getByRole('status')).toHaveText('Cópia criada.')
  await expect(form.getByLabel('Identificador')).toHaveValue(
    'forca-bruta-copia',
  )
  await expect(form.getByText('Situação: Rascunho')).toBeVisible()

  await form.getByRole('button', { name: 'Excluir carta' }).click()
  const deleteDialog = page.getByRole('dialog', {
    name: 'Excluir “Força Bruta”?',
  })
  await expect(deleteDialog).toContainText(
    'A carta será apagada. Não dá para desfazer.',
  )
  await deleteDialog.getByRole('button', { name: 'Excluir' }).click()
  await expect(form).toHaveCount(0)
  await expect(cards.getByRole('status').first()).toHaveText('Carta excluída.')
})

test('REQ-31: abre a Carta de Dimensão e escolhe a forma das setas da zona (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })

  await cards
    .getByRole('button', { name: 'Dimensão de Teste · Dimensão · Publicada' })
    .click()
  await expect(form.getByLabel('Ordem de lançamento')).toHaveValue('1')
  await expect(form.getByLabel('Zona de chegada')).toHaveValue('Porto Cinzento')
  await expect(
    preview.getByRole('article', { name: 'Dimensão de Teste' }),
  ).toBeVisible()

  await cards
    .getByRole('button', { name: 'Bosque Sussurrante · Zona · Publicada' })
    .click()
  const layout = form.getByLabel('Forma das setas')
  await expect(layout).toHaveValue('straight')
  await layout.selectOption({ label: 'Vizinhas' })
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(form.getByRole('status')).toHaveText('Carta salva.')
})

test('REQ-55: corrige o formato e salva o efeito estruturado (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page
    .getByRole('button', { name: 'Tônico de Força · Item · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })
  const save = form.getByRole('button', { name: 'Salvar rascunho' })
  const activation = form.getByLabel('Ativação do efeito 1 (JSON)')
  await expect(form.getByLabel('Gatilho do efeito 1 (JSON)')).toHaveValue(
    'null',
  )
  await expect(form.getByLabel('Custo do efeito 1 (JSON)')).toHaveValue(
    '[{"kind":"consumeSelf"}]',
  )
  await expect(
    preview.getByText('Buff: +3 de Ataque durante 2 vezes suas.'),
  ).toBeVisible()

  await activation.fill(
    '[{"kind":"modifierFlat","changes":[{"modifier":"attack","amount":"4"}]}]',
  )
  await expect(preview.getByText('Formato de efeito inválido.')).toBeVisible()
  await expect(preview.getByRole('article')).toHaveCount(0)
  await expect(save).toBeDisabled()

  const updated =
    '[{"kind":"modifierFlat","changes":[{"modifier":"attack","amount":4}]}]'
  await activation.fill(updated)
  await form
    .getByLabel('Texto do efeito 1')
    .fill('+4 de Ataque durante 2 vezes suas.')
  await expect(
    preview.getByText('Buff: +4 de Ataque durante 2 vezes suas.'),
  ).toBeVisible()
  const request = page.waitForRequest(
    (request) =>
      request.method() === 'PUT' &&
      new URL(request.url()).pathname ===
        '/lab/content/cards/fixture.strength-tonic',
  )
  await save.click()
  await expect(form.getByRole('status')).toHaveText('Carta salva.')
  expect((await request).postDataJSON()).toMatchObject({
    effects: [
      {
        text: '+4 de Ataque durante 2 vezes suas.',
        trigger: null,
        cost: [{ kind: 'consumeSelf' }],
        activation: [
          {
            kind: 'modifierFlat',
            changes: [{ modifier: 'attack', amount: 4 }],
          },
        ],
        duration: { kind: 'forOwnTurns', turns: 2 },
        mark: 'buff',
      },
    ],
  })
})

test('REQ-49: ferramenta do item e decks de recompensas da dimensão (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })

  await cards
    .getByRole('button', { name: 'Vara de Pesca · Item · Publicada' })
    .click()
  await expect(form.getByLabel('Tipo de ferramenta')).toHaveValue('fishing-rod')
  const zones = form.getByRole('group', { name: 'Vasculha em' })
  await expect(zones.getByLabel('Costeira')).toBeChecked()
  await expect(zones.getByLabel('Montanhosa')).not.toBeChecked()
  await expect(form.getByLabel('Coletada com')).toHaveValue('')
  await expect(preview.getByText('Ferramenta: fishing-rod')).toBeVisible()

  await cards
    .getByRole('button', { name: 'Dimensão de Teste · Dimensão · Publicada' })
    .click()
  const decks = form.getByRole('group', { name: 'Decks de recompensas' })
  await expect(decks.getByLabel('Tipo de zona do deck 1')).toHaveValue('urban')
  const deckCards = decks.getByRole('group', { name: 'Cartas do deck 1' })
  await expect(
    deckCards.getByLabel('Carta 1 do deck 1', { exact: true }),
  ).toHaveValue('fixture.silver-fish')
  await deckCards.getByLabel('Cópias da carta 1 do deck 1').fill('2')
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(form.getByRole('status')).toHaveText('Carta salva.')
})

test('REQ-72: item e zona têm os campos do mercado (MSW)', async ({ page }) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  await cards
    .getByRole('button', { name: 'Flechas · Item · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Preço de estoque')).toHaveValue('3')
  await expect(form.getByLabel('Lote')).toHaveValue('10')
  await expect(form.getByLabel('Coleção do booster')).toBeVisible()

  await cards
    .getByRole('button', { name: 'Porto Cinzento · Zona · Publicada' })
    .click()
  await expect(form.getByLabel('Tem mercado')).toBeChecked()
  await expect(form.getByLabel('Vende singles')).toBeChecked()
  await expect(form.getByLabel('Carta 1')).toHaveValue('fixture.healing-potion')
  await form.getByLabel('Tem mercado').uncheck()
  await expect(form.getByLabel('Vende singles')).toHaveCount(0)
})

test('REQ-78: equipamento, item e zona têm os campos do ferreiro (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  const form = page.getByRole('region', { name: 'Carta', exact: true })

  await cards
    .getByRole('button', { name: 'Espada Curta · Equipamento · Publicada' })
    .click()
  const materials = form.getByRole('group', { name: 'Materiais' })
  await expect(materials.getByLabel('Material 1')).toHaveValue(
    'fixture.iron-ore',
  )
  await expect(materials.getByLabel('Quantidade 1')).toHaveValue('1')
  const slots = form.getByRole('group', { name: 'Slots' })
  await expect(slots.getByLabel('Tipo 1')).toHaveValue('element')
  await expect(slots.getByLabel('Refino mínimo 1')).toHaveValue('2')

  await cards
    .getByRole('button', { name: 'Projeto: Espada Curta · Item · Publicada' })
    .click()
  await expect(form.getByLabel('Receita')).toBeChecked()
  await expect(form.getByLabel('Equipamento criado')).toHaveValue(
    'fixture.short-sword',
  )
  await expect(form.getByLabel('Ouro')).toHaveValue('15')

  await cards
    .getByRole('button', { name: 'Porto Cinzento · Zona · Publicada' })
    .click()
  await expect(form.getByLabel('Tem ferreiro')).toBeChecked()
  const first = form.getByRole('group', { name: 'Encantamento 1' })
  await expect(first.getByLabel('Identificador do encantamento 1')).toHaveValue(
    'ember-edge',
  )
  await expect(first.getByLabel('Elemento')).toHaveValue('fire')
  await expect(first.getByLabel('Bônus (%)')).toHaveValue('10')
  await form.getByLabel('Tem ferreiro').uncheck()
  await expect(form.getByRole('group', { name: 'Encantamentos' })).toHaveCount(
    0,
  )
})

test('REQ-83: cria uma montaria e edita o Estábulo da zona (MSW)', async ({
  page,
}) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  const cards = page.getByRole('region', { name: 'Cartas' })
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  const preview = page.getByRole('region', { name: 'Pré-visualização' })

  await cards
    .getByRole('button', { name: 'Mina Velha · Zona · Publicada' })
    .click()
  const stable = form
    .getByRole('group', { name: 'Mercado' })
    .getByRole('group', { name: 'Estábulo' })
  await expect(stable.getByLabel('Montaria 1')).toHaveValue(
    'fixture.plow-horse',
  )

  await cards.getByRole('button', { name: 'Nova carta' }).click()
  await cards
    .getByRole('group', { name: 'Tipo da nova carta' })
    .getByRole('button', { name: 'Montaria' })
    .click()
  await form.getByLabel('Identificador').fill('ponei')
  await form.getByLabel('Nome', { exact: true }).fill('Pônei')
  await form.getByLabel('Raridade').selectOption({ label: 'Comum' })
  await form.getByRole('group', { name: 'Tipos' }).getByLabel('Fera').check()
  await form.getByLabel('Criatura').fill('Pônei')
  const card = preview.getByRole('article', { name: 'Pônei' })
  await expect(card.getByText('Tipos: Fera')).toBeVisible()
  await expect(card.getByText('Criatura: Pônei')).toBeVisible()

  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(form.getByRole('status')).toHaveText('Rascunho salvo.')
})

test('REQ-91: edita a conclusão e o chefe final', async ({ page }) => {
  await page.goto('/lab/editor')
  await page.getByRole('button', { name: /Coleção de Teste/ }).click()
  await page
    .getByRole('button', { name: 'Dimensão de Teste · Dimensão · Publicada' })
    .click()
  const form = page.getByRole('region', { name: 'Carta', exact: true })
  await expect(form.getByLabel('Zona de conclusão')).toHaveValue('Mina Velha')
  await expect(form.getByLabel('Item de conclusão 1')).toHaveValue(
    'fixture.shard',
  )
  await form.getByLabel('Tem chefe final').check()
  await expect(form.getByLabel('Título do chefe final')).toBeVisible()
  const enemies = form.getByRole('group', { name: 'Inimigos do chefe final' })
  await enemies.getByRole('button', { name: 'Adicionar', exact: true }).click()
  await expect(
    form.getByLabel('Vida do inimigo 1 do chefe final'),
  ).toBeVisible()
  await form.getByLabel('Tem chefe final').uncheck()
  const zone = form.getByLabel('Zona de conclusão')
  await zone.fill('Nenhuma')
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(zone).toHaveAccessibleDescription(
    'O título da zona de conclusão não existe na coleção.',
  )
  await zone.fill('Mina Velha')
  await form.getByLabel('Ouro do prêmio máximo').fill('125')
  const request = page.waitForRequest(
    (req) =>
      req.method() === 'PUT' && req.url().endsWith('/fixture.test-dimension'),
  )
  await form.getByRole('button', { name: 'Salvar rascunho' }).click()
  expect((await request).postDataJSON().completion.grandPrize.gold).toBe(125)
  await expect(form.getByRole('status')).toHaveText('Carta salva.')
  await page
    .getByRole('button', { name: 'Fragmento · Item · Publicada' })
    .click()
  await expect(
    form.getByLabel('Item de conclusão', { exact: true }),
  ).toBeChecked()
})
