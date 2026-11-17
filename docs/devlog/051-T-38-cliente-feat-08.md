# 051 — T-38: Cliente da FEAT-08

- **ID:** T-38 · **FEAT:** FEAT-08 · **REQs:** REQ-36, REQ-37, REQ-38 · **Decisão:** D-56 · **Contrato:** v0.33 (`implementado (BE)`) · **Spec:** 0.50 → 0.51 · **Data:** 2026-11-17

## Objetivo

Camada de cliente da FEAT-08: `Party.turn`, `PlayerState.availableActions`, `EndTurnAction` e cenários do MSW.

## Decisões

- `availableActions` validado com `z.enum(['move','endTurn'])`: ação desconhecida é fora do contrato (o backend acrescenta tipos por FEAT; o schema acompanha).
- `turn.round` ≥ 1 e `actionPoints` ≥ 0, inteiros.
- Fixtures: 1 movimento = 2 pontos; `partyNextRoundFixture` (rodada 2, 3 pontos) para `endTurn`; `partyNoPointsFixture` (0 pontos, só `endTurn`).
- Cenário "0 pontos" escolhido pelo `id` do grupo (`party-sem-pontos`), pois o handler não tem estado (D-29); registrado como D-56 item 5.
- Voltar à cidade (`gray-harbor`) segue devolvendo `partyInSessionFixture` (3 pontos): tabela sem estado, sem simular o custo.

## Arquivos

- `src/api/parties.ts`; `src/mocks/partyFixtures.ts`, `src/mocks/handlers.ts`.
- `src/api/partyActions.test.tsx` (+7 testes REQ-36/37/38); `src/api/preparation.test.tsx` (`availableActions` no `player` esperado).
- `docs/SPEC-FRONTEND.md` (T-38 `[x]`, 0.51, D-56 item 5).

## Como verificar

`npx vitest run src/api src/mocks src/features/party`; `npx playwright test tests/e2e/party`.

## Problemas

- Nenhum.

## Checks

Unitários api+mocks+party: 207/207. E2E `party`: 9/9. Guarda, `typecheck`, `lint`, `format:check`: verdes.

## Backend

Sem pendência nesta tarefa; a validação contra o backend real vem depois da T-40.

## Commit sugerido

`feat/feat-08 client layer for turn and end turn`
