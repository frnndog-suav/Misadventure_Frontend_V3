# 026 — T-18: Novo jogo

- **ID:** T-18 · **FEAT:** FEAT-05 · **REQ:** REQ-15 · **Decisões:** D-36 · **Contrato:** §3 FEAT-05 (v0.14, `acordado`) · **Spec:** v0.26 → v0.27 · **Data:** 2026-11-15

## Objetivo

Tela `/novo` que cria o grupo de 1 com `POST /parties`, mostra erros por campo (`PARTY_INVALID`) e vai para `/grupo/:partyId` com `201`.

## Decisões

- **D-36:** formulário `noValidate`, erro abaixo de cada campo via `aria-describedby`, status depois do botão, textos derivados do último envio.
- Testes com `fireEvent` (como na T-17).

## Arquivos

- Novos: `src/features/party/NewGame.tsx`, `src/features/party/NewGame.test.tsx`, `tests/e2e/party/new-game.spec.ts`.
- Alterados: `src/App.tsx` (rota `novo`), `docs/SPEC-FRONTEND.md`.

## Como verificar

`npm run dev` (mocks) e abrir `/novo`. `npx vitest run src/features/party` (14 testes) e `npx playwright test tests/e2e/party` (3 testes).

## Problemas

- `/grupo/:partyId` ainda não tem tela (T-19): depois de criar, a página fica vazia e o console avisa "No routes matched".

## Checks

guarda, typecheck, lint, format, vitest de `src/features` e `App` (37 passaram), e2e `party` + `app` (8 passaram), `test:build` (REQ-05 ok): todos verdes.

## Backend

Contrato sem mudança. A validação contra o backend real fica para o fim da FEAT-05 (T-19).

## Commit sugerido

`feat/new game screen`
