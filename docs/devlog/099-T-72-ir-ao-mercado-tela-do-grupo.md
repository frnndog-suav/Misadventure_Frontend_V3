# 099 — T-72, Ir ao Mercado na tela do grupo (FEAT-16)

- Data — 2026-11-24
- Status — aguardando revisão (concluída com MSW)
- Contrato — v0.81, FEAT-16 `implementado (BE)`, sem mudança
- Spec — REQ-73, REQ-74, REQ-76, D-62 item 10; spec v0.88
- Horas — 0.07 (4 min ativos registrados)

## Entrega

- `src/features/party/MarketPanel.tsx` (novo): seção "Mercado" com ouro, fator, lista "Operações" (Remover/Subir/Descer, "Total previsto", Confirmar, Cancelar) e os grupos Estoque, Boosters, Singles, Vender e Serviços; `MarketResult` mostra "Resultado do mercado" e o aviso de ouro perdido.
- `PartySession.tsx`: botão "Ir ao Mercado" depois de "Usar cofre"; `marketReasonText`/`marketFailureText` (REQ-74); status "Mercado: n operações feitas."; erros do mercado ficam na seção; nomes das cartas do mercado e do resultado entram em `cardIdsOf`; linha "Expansões: …" na seção do membro (REQ-76).
- `fields.tsx` e `fieldRules.ts` (novos): `NumberField`, `isIntFrom`, `invalidQuantity` e `byCardId` saíram do `PartySession.tsx` para serem compartilhados; o lint (`react-refresh/only-export-components`) obrigou a separar componente de funções.

## Decisões (D-62 item 10)

- "Total previsto" da venda = preço exibido × (quantidade ÷ `lotSize`, para baixo); compras = preço × quantidade.
- "Resultado do mercado" só depois de um `visitMarket` bem-sucedido.
- `tcgFolderFull` no mercado: "Não há espaço na pasta de TCG."; `notInInventory`/`notInTcgFolder` reaproveitam o REQ-52.

## Verificação

- Testes primeiro: `MarketPanel.test.tsx` (33 testes, REQ-73/74/76); 30 de 31 falharam por falta do botão antes da implementação (o outro era o caso sem `visitMarket`). Um seletor do meu teste (`/^Booster/`) precisou de correção; o REQ-76 falhou antes só pela linha ausente.
- E2E: um teste novo em `tests/e2e/party/party-session.spec.ts` (lote recusado por ouro, remoção, compra de Flechas, resultado).
- Resultados: `vitest run src/features/party src/api` 596/596 (antes do ajuste do lint) e `src/features/party` 251/251 depois; tipos, lint, guarda e formato verdes; e2e `party` 26/26.
- Atenção: o `.env.development.local` do autor tem `VITE_USE_MOCKS=false` e há dev server na 5173, então os e2e com MSW falham nesse ambiente (inclusive os antigos). Rodei com uma config temporária (porta 5174, `VITE_USE_MOCKS=true`), removida depois. No Git Bash o Vitest falha no setup; no PowerShell roda.

## Backend

Nenhuma dependência nova. A FEAT-16 só fecha o lado frontend nas T-73 e T-74; o Aviso de backend sai então.

## Commit sugerido

`feat/t-72 feat-16 market screen on party view`
