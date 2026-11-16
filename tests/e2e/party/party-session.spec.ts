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
