# 053 — T-40: Alinhar Movimentar às ações disponíveis

- **ID:** T-40 · **FEAT:** FEAT-08 · **REQs:** REQ-37 (alinha o REQ-35) · **Decisão:** D-56 item 7 · **Contrato:** v0.33 (`implementado (BE)`) · **Spec:** 0.52 → 0.53 · **Roadmap:** 0.37 → 0.38 · **Data:** 2026-11-17

## Objetivo

"Movimentar para {title}" só aparece com `move` em `availableActions` do host; com 0 pontos, a "Zona escolhida" explica por que o botão sumiu. Fecha o lado FE da FEAT-08 com MSW.

## Decisões

- O aviso "Sem pontos de ação para Movimentar." só aparece quando a zona está em `moveTargets`, não há `move` e `turn.actionPoints` é 0 (REQ-37 item 1, literal). Sem `move` por outro motivo, não há botão nem aviso.
- D-56 item 7: o handler de `POST /parties/:partyId/session` devolve o `partyNoPointsFixture` para `party-sem-pontos`. Antes abria com 3 pontos, e o cenário "0 pontos" não aparecia na tela (o MSW não tem estado, então "gastar os pontos" no dev é abrir esse grupo). Continua sendo escolha de fixture por `id`, sem regra.

## Arquivos

- `src/features/party/PartyMap.tsx` (botão condicionado a `move`, aviso).
- `src/mocks/handlers.ts` (sessão do `party-sem-pontos`).
- `src/features/party/PartySession.test.tsx` (+5), `tests/e2e/party/party-session.spec.ts` (+1).
- `docs/SPEC-FRONTEND.md` (T-40 `[x]`, 0.53, D-56 item 7), `docs/ROADMAP.md` (FEAT-08 FE `pronto`, 0.38).

## Como verificar

`npm run dev` (mocks) → `/grupo/party-sem-pontos` → "0 pontos de ação" → clicar "Porto Cinzento" no mapa → "Sem pontos de ação para Movimentar." e nenhum botão "Movimentar". Em `/grupo/party-os-teimosos` o botão continua aparecendo.
`npx vitest related --run src/features/party/PartyMap.tsx src/mocks/handlers.ts`; `npx playwright test tests/e2e/party`.

## Problemas

Nenhum.

## Checks

Unitários afetados: 405/405. E2E `party`: 11/11. Guarda, `typecheck`, `lint`, `format:check`, `test:build`: verdes.

## Backend

Lado FE da FEAT-08 pronto com MSW; falta validar contra o backend real (`/retorno-backend`).

## Commit sugerido

`feat/feat-08 move aligned to available actions`
