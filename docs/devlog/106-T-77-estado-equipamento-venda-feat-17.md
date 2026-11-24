# 106 — T-77, estado do equipamento e venda por cópia (FEAT-17)

- Data — 2026-11-24
- Status — concluída com MSW
- Contrato — v0.85, FEAT-17 `acordado`, sem mudança
- Spec — REQ-79; spec v0.94
- Horas — a preencher

## Entrega

- `src/features/party/equipmentState.ts`: `equipmentStateSuffix(state)` monta o sufixo do REQ-79 só com o que difere do padrão ("+n", "quebrado", "Reparado ×n", "encantamentos: …", "(desligado)" só com `active: false`). Só exibe o estado recebido.
- `PartySession.tsx`: o sufixo em "Equipamentos" (`equipmentStates[slot]`), "Inventário" e "Cofre" (`equipmentState` do slot).
- `MarketPanel.tsx`: oferta de venda com `equipmentState` mostra o sufixo, não tem campo de unidades e "Acrescentar" envia `{ operation: "sell", source, cardId, quantity: 1, inventorySlotIndex }`. `sellOffer()` acha a oferta pela cópia (inclui `inventorySlotIndex`) para a descrição e o "Total previsto".

## Decisões

Registradas no REQ-79 (spec v0.94): refino com espaço e os demais itens com ", "; a descrição da venda leva o sufixo da cópia; o total usa a oferta da mesma cópia; o resto do texto da oferta segue o REQ-73.

## Verificação

- Testes novos: `equipmentState.test.ts` (3), 1 em `PartySession.test.tsx`, 1 em `MarketPanel.test.tsx`, 1 e2e em `tests/e2e/party/party-session.spec.ts` (Guardar a espada do `party-ferreiro` → inventário com estado → Mercado → venda por cópia). Todos falharam antes pelo motivo certo.
- `vitest related` dos arquivos alterados: 282/282. E2E `party` com `VITE_USE_MOCKS=true`: 28/28. Guarda de `src/`, `typecheck`, `lint`, `format:check` e `test:build` verdes.

## Problemas

- O `.env.development.local` do autor aponta para o backend real (porta 3333, `VITE_USE_MOCKS=false`); o e2e com MSW precisa de `VITE_USE_MOCKS=true` no ambiente.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-79.

## Commit sugerido

`feat/t-77 feat-17 equipment state and per-copy sale`
