# 107 — T-78, Ir ao Ferreiro e Oficina: seção e lote (FEAT-17)

- Data — 2026-11-24
- Status — concluída com MSW
- Contrato — v0.85, FEAT-17 `acordado`, sem mudança
- Spec — REQ-80, REQ-81, D-63 item 10; spec v0.95; ROADMAP v0.78
- Horas — a preencher

## Entrega

- `src/features/party/BlacksmithPanel.tsx` (novo): seção "Ferreiro" / "Oficina do Artífice" montada de `player.blacksmith` (equipamentos com conserto, refino pelo passo k e encantamentos com "Substituir"; receitas), lista "Operações" (Remover, Subir, Descer, até 50), "Total previsto" pela soma dos preços exibidos, "Confirmar"/"Cancelar"; `BlacksmithResult` com a lista "Resultado do ferreiro".
- `PartySession.tsx`: botões "Ir ao Ferreiro" e "Oficina do Artífice" em "A vez" (antes de "Ir ao Mercado", na ordem de `availableActions`); envio de `visitBlacksmith`/`artificerWorkshop`; status do `200`; textos dos motivos em `blacksmithReasonText`; recusa sem `operationIndex` vai para a área de status; nomes das cartas do ferreiro entram na consulta do catálogo (`blacksmithCardIds`).

## Decisões

D-63 item 10 (spec v0.95): formato de {materiais}, posição dos botões, Oficina sem encantamentos, "Substituir" começa no 1, status sem `lastBlacksmithVisit`, origem de {nome} na recusa, título "Resultado do ferreiro" também na Oficina.

## Verificação

- Testes novos: `BlacksmithPanel.test.tsx` (40, todos falharam antes por falta da seção) e 3 e2e em `tests/e2e/party/party-session.spec.ts`.
- `src/features/party`: 308/308. E2E `party` com `VITE_USE_MOCKS=true`: 31/31. Guarda de `src/`, `typecheck`, `lint`, `format:check` e `test:build` verdes.

## Problemas

- `blacksmithCardIds` saiu do componente para o `PartySession.tsx` (regra `react-refresh/only-export-components`).
- O e2e com MSW continua precisando de `VITE_USE_MOCKS=true` (o `.env.development.local` aponta para o backend real).

## Backend

Lado FE da FEAT-17 pronto com MSW; falta o BE (T-67 a T-73) e a validação integrada (T-79).

## Commit sugerido

`feat/t-78 feat-17 blacksmith and workshop section`
