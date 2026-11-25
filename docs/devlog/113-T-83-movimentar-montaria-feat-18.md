# 113 — T-83, Movimentar com montaria (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-86; spec v1.01
- Horas — a preencher

## Entrega

- `src/features/party/PartyMap.tsx`: na "Zona escolhida", lê a entrada da zona em `moveRoutes` do host. `direct: true` (ou sem entrada) → "Movimentar para {title}"; por zona de `via`, na ordem recebida, "Movimentar para {title} passando por {título do meio}", que envia `viaZoneId`. Todos desabilitados durante o pedido.
- `src/features/party/PartySession.tsx`: `onMove(zoneId, viaZoneId?)`; recusa do `move` com `noMount` → "{message} Você não tem montaria."; os demais motivos seguem só com a `message`.
- Testes: 7 unitários novos em `PartySession.test.tsx` (REQ-86) e 1 e2e em `tests/e2e/party/mount.spec.ts`.

## Decisões

- Nenhuma nova: o REQ-86 cobre os casos.

## Verificação

- Os 6 unitários de comportamento novo falharam antes pelo motivo certo (botão ausente); no fim, 7/7. Afetados (`vitest related`): 350/350. Tipos, lint, guarda, `format:check` e `test:build` verdes.
- E2E `party` em servidor próprio na porta 5174 (config temporária, apagada) com `VITE_USE_MOCKS=true`, porque havia um Vite do autor na 5173 sem mocks: 33/35 na primeira rodada; as 2 falhas eram o primeiro teste de cada arquivo na compilação fria do Vite e passaram na repetição.

## Problemas

- Nenhum novo.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-83 feat-18 move with mount`