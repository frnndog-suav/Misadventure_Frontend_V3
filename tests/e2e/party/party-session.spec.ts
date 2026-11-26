import { expect, test } from '@playwright/test'

test('REQ-92: conclusão abaixo da cidade e itens na seção do membro', async ({
  page,
}) => {
  await page.goto('/grupo/party-conclusao')
  const completion = page.getByRole('region', { name: 'Conclusão da dimensão' })
  await expect(completion).toBeVisible()
  await expect(completion.locator('xpath=preceding-sibling::*[1]')).toHaveText(
    'Cidade inicial: Porto Cinzento',
  )
  await expect(completion).toContainText('Zona de conclusão: Mina Velha')
  await expect(completion.getByRole('list', { name: 'Requisito' })).toHaveText(
    '3× Fragmento',
  )
  await expect(completion.getByText('Chefe final:')).toHaveCount(0)

  const lia = page.getByRole('region', { name: 'Lia' })
  await expect(
    lia.getByRole('list', { name: 'Itens de conclusão' }),
  ).toHaveText('3× Fragmento')
  await expect(lia.getByText('3× Fragmento', { exact: true })).toHaveCount(1)
})

test('REQ-92: chefe sem fuga, membro sem itens e dimensão legada', async ({
  page,
}) => {
  await page.goto('/grupo/party-chefe-final')
  await expect(
    page.getByText('Chefe final: Guardião da Mina · Sem fuga'),
  ).toBeVisible()

  await page.goto('/grupo/party-dimensao-concluida')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continuar' })
    .click()
  await expect(page.getByText('Dimensão: Segunda Dimensão')).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Conclusão da dimensão' }),
  ).toHaveCount(0)
  await expect(
    page
      .getByRole('region', { name: 'Lia' })
      .getByText('Nenhum item de conclusão.'),
  ).toBeVisible()
})

test('REQ-93 e REQ-95: concluir dimensão e continuar na próxima', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fetch = window.fetch
    window.fetch = async (input, init) => {
      if (String(input).endsWith('/parties/party-conclusao/actions')) {
        const released = new Promise<void>((resolve) =>
          window.addEventListener('release-completion', () => resolve(), {
            once: true,
          }),
        )
        const [result] = await Promise.all([fetch(input, init), released])
        return result
      }
      return fetch(input, init)
    }
  })
  await page.goto('/grupo/party-conclusao')
  const conclude = page.getByRole('button', {
    name: 'Concluir dimensão (1 PA)',
  })
  const request = page.waitForRequest('**/parties/party-conclusao/actions')
  await conclude.click()
  expect((await request).postDataJSON()).toEqual({ type: 'completeDimension' })
  await expect(conclude).toBeDisabled()
  await expect(
    page.getByRole('status').filter({ hasText: 'Concluindo a dimensão…' }),
  ).toBeVisible()
  await page.evaluate(() =>
    window.dispatchEvent(new Event('release-completion')),
  )
  const dialog = page.getByRole('dialog', { name: /^Dimensão concluída:/ })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('list', { name: 'Prêmio máximo' }),
  ).toContainText('1× Lâmina do Crepúsculo para o inventário')
  await expect(dialog).toContainText('+100 de ouro')
  await expect(dialog).toContainText('Lia: Pico +25')
  await expect(dialog).toContainText('Itens de conclusão saíram do jogo.')
  await expect(dialog).toContainText('Próxima dimensão: Segunda Dimensão')
  const continueButton = dialog.getByRole('button', { name: 'Continuar' })
  await expect(continueButton).toBeFocused()
  await continueButton.click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Dimensão: Segunda Dimensão')).toBeVisible()
  await expect(conclude).toHaveCount(0)
})

test('REQ-93: concluir com chefe abre o combate com o título e as ações recebidas', async ({
  page,
}) => {
  await page.goto('/grupo/party-chefe-final')
  await page.getByRole('button', { name: 'Concluir dimensão (1 PA)' }).click()
  const combat = page.getByRole('region', {
    name: 'Chefe final · Guardião da Mina',
  })
  await expect(combat).toBeVisible()
  await expect(combat.getByRole('button', { name: /^Fugir/ })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('REQ-94: lê a vitória antes do resumo da dimensão', async ({ page }) => {
  await page.goto('/grupo/party-chefe-final')
  await page.getByRole('button', { name: 'Concluir dimensão (1 PA)' }).click()
  await page.getByRole('button', { name: /^Atacar / }).click()

  const result = page.getByText('Vitória · inimigos derrotados · Pico +15', {
    exact: true,
  })
  const dialog = page.getByRole('dialog', { name: /^Dimensão concluída:/ })
  await expect(result).toBeVisible()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver conclusão da dimensão' }).click()
  await expect(dialog).toContainText('Lia: Pico +40')
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Dimensão: Segunda Dimensão')).toBeVisible()
})

test('REQ-94: reabertura preserva a sequência dos resumos', async ({
  page,
}) => {
  await page.goto('/grupo/party-chefe-final-concluida')
  const result = page.getByText('Vitória · inimigos derrotados · Pico +15', {
    exact: true,
  })
  const dialog = page.getByRole('dialog', { name: /^Dimensão concluída:/ })
  await expect(result).toBeVisible()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver conclusão da dimensão' }).click()
  await expect(dialog.getByRole('button', { name: 'Continuar' })).toBeFocused()
})

for (const [scenario, action, result] of [
  ['fuga', /^Fugir/, 'Fuga · fuga bem-sucedida'],
  ['derrota', 'Encerrar turno de combate', 'Derrota · jogador derrotado'],
  ['limite', 'Encerrar turno de combate', 'Derrota · limite de ciclos'],
] as const) {
  test(`REQ-94: ${scenario} preserva os itens e permite tentar de novo`, async ({
    page,
  }) => {
    await page.goto(`/grupo/party-chefe-final-${scenario}`)
    const conclude = page.getByRole('button', {
      name: 'Concluir dimensão (1 PA)',
    })
    await conclude.click()
    await page.getByRole('button', { name: action }).click()

    const report = page.getByText(result, { exact: false })
    await expect(report).toBeVisible()
    await expect(report.locator('xpath=following-sibling::*[1]')).toHaveText(
      'A dimensão não foi concluída. Você pode tentar de novo.',
    )
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByRole('list', { name: 'Itens de conclusão' }),
    ).toHaveText('3× Fragmento')
    await conclude.click()
    await expect(
      page.getByRole('region', { name: /^Chefe final ·/ }),
    ).toBeVisible()
    await expect(
      page.getByText('A dimensão não foi concluída.', { exact: false }),
    ).toHaveCount(0)
  })
}

test('REQ-93: recusa, resposta inválida e falha de rede preservam a partida', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fetch = window.fetch
    let attempts = 0
    window.fetch = async (input, init) => {
      if (String(input).endsWith('/parties/party-conclusao/actions')) {
        attempts++
        if (attempts === 1)
          return Response.json(
            {
              error: {
                code: 'ACTION_NOT_ALLOWED',
                message: 'Você precisa estar na zona de conclusão.',
                details: { reason: 'notCompletionZone' },
              },
            },
            { status: 409 },
          )
        if (attempts === 2) return Response.json({})
        throw new TypeError('Falha de rede de teste')
      }
      return fetch(input, init)
    }
  })
  await page.goto('/grupo/party-conclusao')
  const conclude = page.getByRole('button', {
    name: 'Concluir dimensão (1 PA)',
  })
  const status = page.getByRole('status')
  for (const message of [
    'Você precisa estar na zona de conclusão.',
    'Servidor indisponível. Tente novamente.',
    'Servidor indisponível. Tente novamente.',
  ]) {
    await conclude.click()
    await expect(status.filter({ hasText: message })).toBeVisible()
    await expect(conclude).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(
      page.getByRole('list', { name: 'Itens de conclusão' }),
    ).toHaveText('3× Fragmento')
  }
})

test('REQ-95: reabre o resumo persistido e volta ao início quando congela', async ({
  page,
}) => {
  await page.goto('/grupo/party-dimensao-concluida')
  const dialog = page.getByRole('dialog', { name: /^Dimensão concluída:/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await page.reload()
  await expect(dialog).toBeVisible()

  await page.goto('/grupo/party-ultima-dimensao')
  await page.getByRole('button', { name: 'Concluir dimensão (1 PA)' }).click()
  await expect(dialog).toContainText(
    'O save ficou congelado até o lançamento da próxima dimensão.',
  )
  await dialog.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('region', { name: 'Seus jogos' }).getByRole('status'),
  ).toHaveText('Save congelado.')
})

test.describe('REQ-16: grupo em sessão (MSW)', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' })

  test('REQ-16: "Continuar" abre o grupo; "Encerrar sessão" volta a / com "Sessão encerrada."', async ({
    page,
  }) => {
    await page.goto('/')
    const games = page.getByRole('region', { name: 'Seus jogos' })
    await games
      .getByRole('listitem')
      .filter({ hasText: 'Os Teimosos' })
      .getByRole('button', { name: 'Continuar' })
      .click()
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

test.describe('REQ-73 e REQ-74: Ir ao Mercado (MSW)', () => {
  test('REQ-74: montar um lote, confirmar e ver o resultado; lote de 2 expansões do cofre é recusado', async ({
    page,
  }) => {
    await page.goto('/grupo/party-os-teimosos')
    const turn = page.getByRole('region', { name: 'A vez' })
    await turn.getByRole('button', { name: 'Ir ao Mercado' }).click()
    const market = page.getByRole('region', { name: 'Mercado' })
    await expect(market).toContainText('Fator do mercado 115%')
    await expect(market).toContainText('Nenhuma operação.')

    const operations = market.getByRole('list', { name: 'Operações' })
    const service = market
      .getByRole('list', { name: 'Serviços' })
      .getByRole('button', { name: 'Comprar Expansão do cofre' })
    await service.click()
    await service.click()
    await expect(operations.getByRole('listitem')).toContainText([
      '1. Comprar Expansão do cofre',
      '2. Comprar Expansão do cofre',
    ])
    await market
      .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
      .click()
    await expect(market).toContainText('Não há ouro suficiente na bolsa.')
    await expect(operations.getByRole('listitem').nth(1)).toContainText(
      'Recusada',
    )

    await operations
      .getByRole('listitem')
      .nth(1)
      .getByRole('button', { name: 'Remover' })
      .click()
    await operations
      .getByRole('listitem')
      .first()
      .getByRole('button', { name: 'Remover' })
      .click()
    const stock = market.getByRole('list', { name: 'Estoque' })
    await stock
      .getByRole('listitem')
      .filter({ hasText: 'Flechas' })
      .getByRole('button', { name: 'Acrescentar' })
      .click()
    await market
      .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
      .click()
    await expect(page.getByRole('status').first()).toHaveText(
      'Mercado: 1 operação feita.',
    )
    await expect(market).toHaveCount(0)
    await expect(
      page.getByRole('list', { name: 'Resultado do mercado' }),
    ).toHaveText('Comprou 20× Flechas por 8 de ouro')
  })
})

test.describe('REQ-75: abrir booster (MSW)', () => {
  test('REQ-75: "Abrir Booster de Teste" no Preparar mostra o status e as 8 cartas com destino', async ({
    page,
  }) => {
    await page.goto('/grupo/party-com-booster')
    await page.getByRole('button', { name: 'Abrir Booster de Teste' }).click()
    await expect(page.getByRole('status').first()).toHaveText(
      'Abriu Booster de Teste.',
    )
    const list = page.getByRole('list', {
      name: 'Cartas do booster Booster de Teste',
    })
    await expect(list.getByRole('listitem')).toHaveCount(8)
    await expect(list.getByRole('listitem').first()).toHaveText(
      'Força → pasta de TCG',
    )
    await expect(
      page.getByRole('button', { name: 'Abrir Booster de Teste' }),
    ).toHaveCount(0)
  })
})

test.describe('REQ-79: estado do equipamento e venda por cópia (MSW)', () => {
  test('REQ-79: a espada guardada mostra o estado no inventário e é vendida por cópia no Mercado', async ({
    page,
  }) => {
    await page.goto('/grupo/party-ferreiro')
    await page.getByRole('button', { name: 'Guardar Espada Curta' }).click()
    await expect(
      page.getByRole('list', { name: /^Inventário/ }).getByRole('listitem'),
    ).toContainText([
      '1× Projeto',
      '1× Espada Curta +3, Reparado ×1, encantamentos: Fio de Brasa',
    ])
    await page
      .getByRole('region', { name: 'A vez' })
      .getByRole('button', { name: 'Ir ao Mercado' })
      .click()
    const market = page.getByRole('region', { name: 'Mercado' })
    const offer = market
      .getByRole('list', { name: 'Vender' })
      .getByRole('listitem')
      .filter({ hasText: 'Espada Curta +3, Reparado ×1' })
    await expect(offer.getByRole('spinbutton')).toHaveCount(0)
    await offer.getByRole('button', { name: 'Acrescentar' }).click()
    await expect(
      market.getByRole('list', { name: 'Operações' }).getByRole('listitem'),
    ).toContainText([
      '1. Vender 1× Espada Curta +3, Reparado ×1, encantamentos: Fio de Brasa',
    ])
    await expect(market).toContainText(
      'Total previsto: 0 de ouro a pagar, 3 de ouro a receber',
    )
  })
})

test.describe('REQ-80, REQ-81: Ir ao Ferreiro e Oficina (MSW)', () => {
  test('REQ-80/REQ-81: monta o lote no ferreiro, confirma e mostra o resultado com falha e quebra', async ({
    page,
  }) => {
    await page.goto('/grupo/party-ferreiro')
    await page
      .getByRole('region', { name: 'A vez' })
      .getByRole('button', { name: 'Ir ao Ferreiro' })
      .click()
    const smithy = page.getByRole('region', { name: 'Ferreiro' })
    await expect(smithy).toContainText(
      'Gasta todos os pontos de ação restantes (3).',
    )
    await smithy.getByRole('button', { name: 'Refinar Espada Curta' }).click()
    await smithy.getByRole('button', { name: 'Refinar Espada Curta' }).click()
    await smithy
      .getByRole('button', { name: 'Encantar Espada Curta com Fio de Brasa' })
      .click()
    await expect(
      smithy.getByRole('list', { name: 'Operações' }).getByRole('listitem'),
    ).toContainText([
      '1. Refinar Espada Curta para +1',
      '2. Refinar Espada Curta para +2',
      '3. Encantar Espada Curta com Fio de Brasa',
    ])
    await expect(smithy).toContainText('Total previsto: 80 de ouro')
    await smithy
      .getByRole('button', { name: 'Confirmar (todos os pontos de ação)' })
      .click()
    await expect(smithy).toHaveCount(0)
    await expect(page.getByRole('status').first()).toContainText(
      'Ferreiro: 3 operações, 3 pontos de ação gastos.',
    )
    await expect(
      page.getByRole('list', { name: 'Resultado do ferreiro' }),
    ).toContainText(
      'Falhou ao refinar Espada Curta para +4: 40 de ouro perdidos, D20 14 contra 21. Espada Curta quebrou.',
    )
  })

  test('REQ-81: recusa com operationIndex marca a operação na seção', async ({
    page,
  }) => {
    await page.goto('/grupo/party-ferreiro')
    await page
      .getByRole('region', { name: 'A vez' })
      .getByRole('button', { name: 'Ir ao Ferreiro' })
      .click()
    const smithy = page.getByRole('region', { name: 'Ferreiro' })
    await smithy.getByRole('button', { name: 'Refinar Espada Curta' }).click()
    await smithy
      .getByRole('button', { name: 'Confirmar (todos os pontos de ação)' })
      .click()
    await expect(smithy.getByText('Recusada')).toBeVisible()
    await expect(smithy).toContainText(
      'Esta ação não é permitida agora. Espada Curta está quebrado: conserte antes.',
    )
  })

  test('REQ-81/REQ-88: criar mostra onde o equipamento entrou', async ({
    page,
  }) => {
    await page.goto('/grupo/party-ferreiro')
    await page
      .getByRole('region', { name: 'A vez' })
      .getByRole('button', { name: 'Ir ao Ferreiro' })
      .click()
    const smithy = page.getByRole('region', { name: 'Ferreiro' })
    await smithy.getByRole('button', { name: 'Criar Espada Curta' }).click()
    await smithy
      .getByRole('button', { name: 'Confirmar (todos os pontos de ação)' })
      .click()
    await expect(
      page.getByRole('list', { name: 'Resultado do ferreiro' }),
    ).toContainText('Criou Espada Curta por 15 de ouro; foi para o inventário.')
  })

  test('REQ-80: com Artífice ativo, a Oficina gasta 1 ponto de ação', async ({
    page,
  }) => {
    await page.goto('/grupo/party-artifice')
    await page
      .getByRole('region', { name: 'A vez' })
      .getByRole('button', { name: 'Oficina do Artífice' })
      .click()
    const workshop = page.getByRole('region', { name: 'Oficina do Artífice' })
    await expect(workshop).toContainText('Gasta 1 ponto de ação.')
    await workshop.getByRole('button', { name: 'Refinar Espada Curta' }).click()
    await workshop
      .getByRole('button', { name: 'Confirmar (1 ponto de ação)' })
      .click()
    await expect(page.getByRole('status').first()).toContainText(
      'Oficina do Artífice: 1 operação, 1 ponto de ação gasto.',
    )
  })
})
