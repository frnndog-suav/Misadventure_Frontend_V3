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
