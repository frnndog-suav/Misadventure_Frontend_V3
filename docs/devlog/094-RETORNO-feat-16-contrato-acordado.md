# 094 — RETORNO: FEAT-16 contrato acordado

- **ID:** RETORNO · **FEAT:** FEAT-16 · **Contrato:** §3 FEAT-16, v0.79 (`proposto (BE)`) → v0.80 (`acordado`) · **Roadmap:** v0.69 → v0.70 · **Data:** 2026-11-23

Só documentos. Nenhum código, teste nem spec mudou.

## Objetivo

Responder à proposta de contrato do backend para a FEAT-16 (Mercado).

## Passos

1. O backend propôs a seção (CONTRATO v0.79, ROADMAP v0.69) e o autor trouxe os dois arquivos inteiros.
2. `/retorno-backend`. A cópia local (v0.78) recebeu o que a v0.79 acrescenta: o cabeçalho, o glossário §2.17, a seção §3 FEAT-16 e a linha 0.79 do histórico.
3. Conferência:
   - **Princípio 1:** preços, fator, escassez, capacidades efetivas, ofertas de venda, o destino de cada single e os resultados (`lastMarketVisit`, `lastBoosterOpening`) vêm prontos;
   - **Cálculos dos cenários:** batem (fator 115, estoque, lote de flechas, venda, tesouro, ouro perdido, singles com escassez, serviços e expansões);
   - **Laboratório:** as 37 chaves batem.
4. Uma dúvida foi levada ao autor. Dentro de um lote, comprar um single repõe o slot e pode subir o preço de outra cópia da mesma carta na vitrine.
   - **Opções:** aceitar com uma regra de tela, ou pedir `buySingle` com o preço esperado e um motivo `priceChanged`.
   - **Escolha do autor:** aceitar (opção recomendada).
   - **Regra de tela, que a spec registra no planejamento:** cada slot entra no máximo uma vez por lote. O preço exibido é o da projeção, e o cobrado vem de `lastMarketVisit`.
5. Resultado: CONTRATO v0.80 `acordado`. No ROADMAP v0.70, a FEAT-16 fica `a fazer` nas duas colunas.

## Impacto no frontend (para o planejamento)

- **`src/api/labConfig.ts`:** 37 chaves e o motivo `sumMismatch`.
- **Catálogo e editor:**
  - `priceMultiplier` em atributo e item;
  - `stockPrice`, `stockQuantity` e `boosterCollectionId` no item;
  - `ZoneCard.market`.
- **`PlayerState`:**
  - `expansions`, `market`, `lastMarketVisit` e `lastBoosterOpening`;
  - `visitMarket` em `availableActions`.
- **Ações:**
  - `VisitMarketAction`;
  - `openBooster` no Preparar e no Usar cofre;
  - `PendingReward.source` `booster`;
  - 8 motivos novos de recusa.
- **Fixtures do MSW:** Porto Cinzento com mercado, `fixture.arrows` e `fixture.booster`. O `availableActions` esperado na cidade ganha `visitMarket`.

## Arquivos

`docs/CONTRATO.md`, `docs/ROADMAP.md`, este arquivo e `docs/devlog/README.md`.

## Como verificar

No CONTRATO, ler o §2.17, a seção §3 FEAT-16 (`acordado`) e as linhas 0.79 e 0.80 do histórico. No ROADMAP, ler a linha 0.70.

## Dependência do backend

Levar para o backend o `docs/CONTRATO.md` v0.80 e o `docs/ROADMAP.md` v0.70. A T-61 do backend fica liberada.

## Commit sugerido

`docs/feat-16 contract agreed`
