import { expect, test } from '@playwright/test'

test.describe('REQ-16: grupo em sessão (MSW)', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' })

  test('REQ-16: "Continuar" abre o grupo; "Encerrar sessão" volta a / com "Sessão encerrada."', async ({
    page,
  }) => {
    await page.goto('/')
    const games = page.getByRole('region', { name: 'Seus jogos' })
    await games.getByRole('button', { name: 'Continuar' }).click()
    await expect(page).toHaveURL(/\/grupo\/party-os-teimosos$/)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Os Teimosos' }),
    ).toBeVisible()
    await expect(page.getByRole('list', { name: 'Membros' })).toHaveText(
      'Lia (host)',
    )
    await expect(page.getByText('Em sessão')).toBeVisible()
    await expect(page.getByText('Salvo em 14/11/2026 18:30')).toBeVisible()

    await page.getByRole('button', { name: 'Encerrar sessão' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(games.getByRole('status')).toHaveText('Sessão encerrada.')
  })

  test('REQ-30: a tela do grupo mostra a partida preparada', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    await expect(page.getByText('Dimensão: Dimensão de Teste')).toBeVisible()
    await expect(page.getByText('Cidade inicial: Porto Cinzento')).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Ordem dos jogadores' }),
    ).toHaveText('Lia')
    const lia = page.getByRole('region', { name: 'Lia' })
    await expect(
      lia.getByText('Classe: Guerreiro (trava cumprida)'),
    ).toBeVisible()
    await expect(lia.getByText('Vida 22/22')).toBeVisible()
    const hand = lia.getByRole('region', { name: 'Mão (7)' })
    await expect(hand.getByRole('article')).toHaveCount(7)
    await expect(
      lia
        .getByRole('list', { name: 'Build (60 cartas)' })
        .getByRole('listitem'),
    ).toHaveText(['30× Resistência', '30× Força'])
    await expect(
      lia.getByRole('heading', { name: 'Pasta de TCG (capacidade 30)' }),
    ).toBeVisible()
    await expect(lia.getByText('Pasta vazia.')).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('')
  })

  test('REQ-44: ouro com a bolsa, modificadores, equipamentos e inventário', async ({
    page,
  }) => {
    await page.goto('/grupo/party-com-equipamento')
    const lia = page.getByRole('region', { name: 'Lia' })
    await expect(lia.getByText('Ouro 10 (bolsa para 300)')).toBeVisible()
    await expect(
      lia
        .getByRole('list', { name: 'Modificadores', exact: true })
        .getByRole('listitem'),
    ).toHaveText([
      '6 Ataque',
      '5 Defesa',
      '49 Precisão',
      '16 Esquiva',
      '8 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    await expect(
      lia
        .getByRole('list', { name: 'Modificadores da classe' })
        .getByRole('listitem'),
    ).toHaveText([
      '6 Ataque',
      '5 Defesa',
      '45 Precisão',
      '15 Esquiva',
      '8 Celeridade',
      '0 Perfuração',
      '0 Reflexão',
    ])
    await expect(
      lia.getByRole('list', { name: 'Equipamentos' }).getByRole('listitem'),
    ).toHaveText([
      'Cabeça: vazio',
      'Tronco: vazio',
      'Inferior: vazio',
      'Calçado: vazio',
      'Capa: vazio',
      'Arma: vazio',
      'Escudo: vazio',
      'Acessório: vazio',
    ])
    await expect(
      lia
        .getByRole('list', { name: 'Inventário (5 de 10 slots)' })
        .getByRole('listitem'),
      // `toContainText`: os itens também têm os botões do REQ-45.
    ).toContainText([
      '1× Lâmina do Crepúsculo',
      '1× Escudo de Carvalho',
      '1× Elmo de Ferro',
      '1× Varinha Arcana',
      '2× Poção de Cura',
    ])
  })

  test('REQ-44: inventário vazio mostra "Inventário vazio."', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const lia = page.getByRole('region', { name: 'Lia' })
    await expect(
      lia.getByRole('heading', { name: 'Inventário (0 de 10 slots)' }),
    ).toBeVisible()
    await expect(lia.getByText('Inventário vazio.')).toBeVisible()
  })

  test('REQ-16: grupo inexistente mostra a message e "Voltar ao início"', async ({
    page,
  }) => {
    await page.goto('/grupo/nope')
    await expect(page.getByRole('status')).toHaveText('Grupo não encontrado.')
    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('REQ-34: mapa da partida (MSW)', () => {
  test('REQ-34: mapa em grade, escolha de zona com a carta e "Travessias com"', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const map = page.getByRole('region', { name: 'Mapa' })
    const harbor = map.getByRole('button', { name: /Porto Cinzento/ })
    await expect(harbor).toContainText('Lia está aqui')
    await expect(harbor).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('region', { name: 'Zona escolhida' }),
    ).toHaveCount(0)

    await harbor.click()
    await expect(harbor).toHaveAttribute('aria-pressed', 'true')
    const chosen = page.getByRole('region', { name: 'Zona escolhida' })
    await expect(chosen.getByRole('article')).toBeVisible()
    await expect(chosen).toContainText(
      'Travessias com: Curva de Pedra, Bosque Sussurrante',
    )

    await map.getByRole('button', { name: /Mina Velha/ }).click()
    await expect(harbor).toHaveAttribute('aria-pressed', 'false')
    await expect(chosen).toContainText('Travessias com: Curva de Pedra')
  })
})

test.describe('REQ-35: Movimentar (MSW)', () => {
  test('REQ-35: mover para Curva de Pedra e voltar à cidade', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const map = page.getByRole('region', { name: 'Mapa' })
    const status = page.getByRole('status')
    const lia = page.getByRole('region', { name: 'Lia' })
    const zone = (title: string) =>
      map.getByRole('button', { name: new RegExp(`^${title}`) })
    await expect(status).toHaveText('')

    await zone('Mina Velha').click()
    await expect(
      page.getByRole('button', { name: 'Movimentar para Mina Velha' }),
    ).toHaveCount(0)

    await zone('Curva de Pedra').click()
    await page
      .getByRole('button', { name: 'Movimentar para Curva de Pedra' })
      .click()
    await expect(status).toHaveText('Você está em Curva de Pedra.')
    await expect(lia.getByText('Zona atual: Curva de Pedra')).toBeVisible()
    await expect(zone('Curva de Pedra')).toContainText('Lia está aqui')

    await zone('Porto Cinzento').click()
    await page
      .getByRole('button', { name: 'Movimentar para Porto Cinzento' })
      .click()
    await expect(status).toHaveText('Você está em Porto Cinzento.')
    await expect(lia.getByText('Zona atual: Porto Cinzento')).toBeVisible()
  })
})

test.describe('REQ-37: ações disponíveis (MSW)', () => {
  test('REQ-37: com 0 pontos não há "Movimentar" e aparece o aviso', async ({
    page,
  }) => {
    await page.goto('/grupo/party-sem-pontos')
    const map = page.getByRole('region', { name: 'Mapa' })
    const turn = page.getByRole('region', { name: 'A vez' })
    await expect(page.getByRole('status')).toHaveText('')
    await expect(turn).toContainText('0 pontos de ação')
    await expect(
      turn.getByRole('button', { name: 'Encerrar a vez' }),
    ).toBeVisible()

    await map.getByRole('button', { name: /^Porto Cinzento/ }).click()
    const chosen = page.getByRole('region', { name: 'Zona escolhida' })
    await expect(chosen).toContainText('Sem pontos de ação para Movimentar.')
    await expect(
      page.getByRole('button', { name: /^Movimentar para/ }),
    ).toHaveCount(0)
  })
})

test.describe('REQ-36/REQ-38: a vez e Encerrar a vez (MSW)', () => {
  test('REQ-38: encerrar a vez mostra a rodada 2', async ({ page }) => {
    await page.goto('/grupo/party-os-teimosos')
    const turn = page.getByRole('region', { name: 'A vez' })
    const status = page.getByRole('status')
    await expect(status).toHaveText('')
    await expect(turn).toContainText('Rodada 1')
    await expect(turn).toContainText('Vez de Lia')
    await expect(turn).toContainText('3 pontos de ação')

    await turn.getByRole('button', { name: 'Encerrar a vez' }).click()
    await expect(status).toHaveText('Rodada 2: vez de Lia.')
    await expect(turn).toContainText('Rodada 2')
    await expect(turn).toContainText('3 pontos de ação')
  })
})

test.describe('REQ-41: Recuperar (MSW)', () => {
  for (const [label, option] of [
    ['Comprar cartas', 'drawToHand'],
    ['Mão no deck', 'shuffleHand'],
    ['Descarte no deck', 'shuffleDiscard'],
  ] as const) {
    test(`REQ-41: "${label}" (${option}) mostra o Party devolvido`, async ({
      page,
    }) => {
      await page.goto('/grupo/party-os-teimosos')
      const turn = page.getByRole('region', { name: 'A vez' })
      const status = page.getByRole('status')
      await expect(status).toHaveText('')
      await expect(
        turn.getByRole('group', { name: 'Recuperar' }).getByRole('button'),
      ).toHaveText(['Comprar cartas', 'Mão no deck', 'Descarte no deck'])

      await turn.getByRole('button', { name: label }).click()
      await expect(status).toHaveText('Recuperou: vida 22/22, Vigor 10.')
      await expect(turn).toContainText('2 pontos de ação')
    })
  }
})

test.describe('REQ-42: Ajustar deck (MSW)', () => {
  test('REQ-42: salvar sem mudança fecha a seção; as recusas aparecem na seção', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const turn = page.getByRole('region', { name: 'A vez' })
    const status = page.getByRole('status')
    await expect(status).toHaveText('')
    const adjust = turn.getByRole('button', { name: 'Ajustar deck' })
    const section = page.getByRole('region', { name: 'Ajustar deck' })
    const strength = section.getByRole('spinbutton', {
      name: 'Cópias na build de Força',
    })

    await adjust.click()
    await expect(adjust).toBeDisabled()
    await expect(section.getByRole('listitem')).toHaveCount(2)
    await expect(strength).toHaveValue('30')

    // Abaixo do mínimo (cenário do contrato).
    await strength.fill('29')
    await section.getByRole('button', { name: 'Salvar build' }).click()
    await expect(section).toContainText(
      'Esta ação não é permitida agora. A build ficou abaixo do mínimo de cartas.',
    )
    await expect(strength).toHaveValue('29')

    // Cópias além da build + pasta.
    await strength.fill('31')
    await section.getByRole('button', { name: 'Salvar build' }).click()
    await expect(section).toContainText(
      'Você não tem cópias suficientes de Força.',
    )

    // Campo inválido não envia.
    await strength.fill('')
    await section.getByRole('button', { name: 'Salvar build' }).click()
    await expect(strength).toHaveAccessibleDescription(
      'Use um número inteiro a partir de 0.',
    )

    // Sem mudança: 200.
    await strength.fill('30')
    await section.getByRole('button', { name: 'Salvar build' }).click()
    await expect(status).toHaveText('Build salva: 60 cartas.')
    await expect(section).toHaveCount(0)
    await expect(adjust).toBeEnabled()
  })

  test('REQ-42: Cancelar fecha a seção', async ({ page }) => {
    await page.goto('/grupo/party-os-teimosos')
    const turn = page.getByRole('region', { name: 'A vez' })
    await turn.getByRole('button', { name: 'Ajustar deck' }).click()
    const section = page.getByRole('region', { name: 'Ajustar deck' })
    await section.getByRole('button', { name: 'Cancelar' }).click()
    await expect(section).toHaveCount(0)
    await expect(page.getByRole('status')).toHaveText('')
  })
})

test.describe('REQ-45: Preparar (MSW)', () => {
  test('REQ-45: equipar, recusas por motivo e guardar', async ({ page }) => {
    await page.goto('/grupo/party-com-equipamento')
    const lia = page.getByRole('region', { name: 'Lia' })
    const status = page.getByRole('status')
    await expect(status).toHaveText('')
    await expect(lia.getByRole('button', { name: /^Equipar / })).toHaveText([
      'Equipar Lâmina do Crepúsculo',
      'Equipar Escudo de Carvalho',
      'Equipar Elmo de Ferro',
      'Equipar Varinha Arcana',
    ])

    // Recusas (cenários do contrato no MSW).
    await lia.getByRole('button', { name: 'Equipar Elmo de Ferro' }).click()
    await expect(status).toHaveText(
      'Esta ação não é permitida agora. Seu Pico não alcança o requisito de Elmo de Ferro.',
    )
    await lia.getByRole('button', { name: 'Equipar Varinha Arcana' }).click()
    await expect(status).toHaveText(
      'Esta ação não é permitida agora. Nenhuma das suas classes pode usar Varinha Arcana.',
    )
    await expect(lia.getByText('Arma: vazio')).toBeVisible()

    await lia
      .getByRole('button', { name: 'Equipar Lâmina do Crepúsculo' })
      .click()
    await expect(status).toHaveText('Equipou Lâmina do Crepúsculo.')
    await expect(lia.getByText('Arma: Lâmina do Crepúsculo')).toBeVisible()

    await lia
      .getByRole('button', { name: 'Equipar Escudo de Carvalho' })
      .click()
    await expect(status).toHaveText(
      'Esta ação não é permitida agora. A arma em uso não deixa usar escudo.',
    )

    await lia
      .getByRole('button', { name: 'Guardar Lâmina do Crepúsculo' })
      .click()
    await expect(status).toHaveText('Guardou Lâmina do Crepúsculo.')
    await expect(lia.getByText('Arma: vazio')).toBeVisible()
  })
})

test.describe('REQ-50/REQ-51: cofre e Vasculhar (MSW)', () => {
  test('REQ-50: cofre vazio na seção do membro; REQ-51: sem scavenge não há "Vasculhar"', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const lia = page.getByRole('region', { name: 'Lia' })
    await expect(
      lia.getByRole('heading', { name: 'Cofre (0 de 30 slots)' }),
    ).toBeVisible()
    await expect(lia.getByText('Cofre vazio.')).toBeVisible()
    await expect(
      lia.getByText('Ouro no cofre 0 (capacidade 2000)'),
    ).toBeVisible()
    await expect(
      lia.getByRole('heading', {
        name: 'Decks guardados (até 10 slots de deck, contando a build em uso)',
      }),
    ).toBeVisible()
    await expect(lia.getByText('Nenhum deck guardado.')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Ajustar deck' }),
    ).toBeVisible()
    await expect(page.getByRole('group', { name: 'Vasculhar' })).toHaveCount(0)
  })

  test('REQ-51: vasculhar o Peixe Prateado com a vara de pesca', async ({
    page,
  }) => {
    await page.goto('/grupo/party-com-vara')
    const turn = page.getByRole('region', { name: 'A vez' })
    const group = turn.getByRole('group', { name: 'Vasculhar' })
    await expect(group.getByRole('button')).toHaveText([
      'Vasculhar Peixe Prateado',
    ])
    await group
      .getByRole('button', { name: 'Vasculhar Peixe Prateado' })
      .click()
    await expect(page.getByRole('status')).toHaveText(
      'Você achou Peixe Prateado.',
    )
    await expect(turn).toContainText('2 pontos de ação')
    await expect(
      page
        .getByRole('region', { name: 'Lia' })
        .getByRole('list', { name: /^Inventário/ })
        .getByRole('listitem'),
    ).toHaveText(['1× Vara de Pesca', '1× Peixe Prateado'])
  })
})

test.describe('REQ-52: Usar cofre (MSW)', () => {
  test('REQ-52: confirmar um lote e, com o cofre devolvido, ver a recusa do take de 5', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const turn = page.getByRole('region', { name: 'A vez' })
    await turn.getByRole('button', { name: 'Usar cofre' }).click()
    const vault = page.getByRole('region', { name: 'Usar cofre' })
    await expect(vault).toContainText('Nenhuma operação.')

    const gold = vault.getByRole('group', { name: 'Ouro' })
    await gold
      .getByRole('spinbutton', { name: 'Quantidade de ouro' })
      .fill('60')
    await gold.getByRole('button', { name: 'Guardar ouro' }).click()
    await expect(
      vault.getByRole('list', { name: 'Operações' }).getByRole('listitem'),
    ).toContainText(['1. Guardar 60 de ouro'])
    await vault
      .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
      .click()
    await expect(page.getByRole('status')).toHaveText(
      'Cofre: 1 operação feita.',
    )
    await expect(vault).toHaveCount(0)
    await expect(turn).toContainText('2 pontos de ação')

    await turn.getByRole('button', { name: 'Usar cofre' }).click()
    await gold
      .getByRole('spinbutton', { name: 'Quantidade de ouro' })
      .fill('10')
    await gold.getByRole('button', { name: 'Retirar ouro' }).click()
    const take = vault.getByRole('group', { name: 'Retirar do cofre' })
    await take
      .getByRole('combobox', { name: 'Carta' })
      .selectOption({ label: 'Poção de Cura' })
    await take.getByRole('spinbutton', { name: 'Quantidade' }).fill('5')
    await take.getByRole('button', { name: 'Acrescentar' }).click()
    await vault
      .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
      .click()
    await expect(vault).toContainText(
      'Esta ação não é permitida agora. Não há essa quantidade de Poção de Cura no cofre.',
    )
    const items = vault
      .getByRole('list', { name: 'Operações' })
      .getByRole('listitem')
    await expect(items.nth(0)).not.toContainText('Recusada')
    await expect(items.nth(1)).toContainText('2. Retirar 5× Poção de Cura')
    await expect(items.nth(1)).toContainText('Recusada')
  })
})
