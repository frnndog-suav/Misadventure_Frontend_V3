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
