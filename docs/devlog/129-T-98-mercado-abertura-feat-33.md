# 129 — Mercado e abertura com múltiplas coleções

- Data — 2026-11-26
- Status — T-98 concluída com MSW
- Horas — null

## Alterações

- `src/features/party/PartySession.tsx` consulta no catálogo os IDs de `lastBoosterOpening`, incluindo o booster consumido e as cartas recebidas. O comprovante mantém o nome do booster mesmo quando ele já saiu da oferta e não resta cópia no inventário ou no cofre.
- `src/mocks/collectionCirculationFixtures.ts` disponibiliza o início de sessão para os cenários da T-96 e distingue os nomes dos boosters de cada coleção.
- `src/features/party/MarketPanel.test.tsx` cobre REQ-98 a REQ-100 pela tela do grupo com os schemas e handlers existentes. A spec registra a conclusão da T-98.

## Verificação

Os testes novos expuseram a ausência do início de sessão nos cenários MSW. Depois de ligar as sessões, o caso do cofre reproduziu a perda do nome do booster consumido. Com a correção, passaram 327 testes de tela do grupo, mercado e APIs de circulação, mercado e preparação. Typecheck, ESLint dos arquivos alterados e `git diff --check` passaram.

**🖥️ FRONTEND — ABRA O FRONTEND LOCAL NO NAVEGADOR COM MSW ATIVO**

1. Em `/grupo/party-msw-feat-33`, abrir **Ir ao Mercado**. Conferir os boosters reimpresso, próprio e estendido, por 30, 34 e 28 de ouro. Acrescentar um de cada na ordem exibida e confirmar. Esperar três linhas no resultado, 58 de ouro e 2 PA.
2. Recarregar a rota para restaurar o cenário MSW inicial. Acrescentar o single Força exibido no slot 1 e confirmar. Esperar o resultado da compra por 6 de ouro com destino à pasta de TCG. O slot fica vazio.
3. Em `/grupo/party-msw-feat-33-prepare`, abrir o Booster de Teste do inventário. Esperar o comprovante com Força na pasta de TCG e Poção de Cura no inventário.
4. Em `/grupo/party-msw-feat-33-vault`, abrir **Usar cofre**, selecionar o Booster de Teste em **Abrir booster**, acrescentar e confirmar. O comprovante mantém o nome do booster e mostra oito cartas com destino ao cofre. Esse booster pertence à coleção reimpressa e está fora da oferta neste cenário.

O teste automatizado de borda apresenta uma vitrine desatualizada e envia a compra válida do single seguida do booster que saiu da oferta. O `409 ACTION_NOT_ALLOWED` informa `notMarketBooster` e `operationIndex: 1`. A tela marca apenas a segunda operação e preserva PA, ouro, cartas e vitrine. O teste de API da T-96 também compara o retrato integral da campanha antes e depois da recusa no MSW.

## Pendências

A T-99 aguarda a URL da API e os dados preparados no backend conforme a seção FEAT-33 do CONTRATO v1.02. A validação real inclui a atomicidade do lote, a formação e renovação do pool, IDs e raridades originais, as duas aberturas, a transição de dimensão e saves legados.
