# 025 — T-17: Menu inicial e abandonar

- **ID:** T-17 · **FEAT:** FEAT-05 · **REQ:** REQ-14, REQ-17 · **Decisões:** D-32, D-35 · **Contrato:** §3 FEAT-05 (v0.14, `acordado`) · **Spec:** v0.25 → v0.26 · **Data:** 2026-11-15

## Objetivo

A rota `/` deixa de ser placeholder: link "Novo jogo", seção "Seus jogos" com a lista de saves, "Continuar" e "Abandonar" com diálogo de confirmação.

## Decisões

- **D-35:** seção própria com sua área de status; mensagem da ação tem precedência sobre o estado da consulta; diálogo próprio (`role="dialog"`, `aria-modal`), sem prender o Tab; data como "14/11/2026 18:30".
- Testes com `fireEvent` (a `@testing-library/user-event` não é dependência autorizada).
- Os testes do REQ-01 (unitários e e2e) passaram a localizar a área de status da ponte entre as duas que existem agora em `/`. O que eles verificam não mudou.

## Arquivos

- Novos: `src/features/home/SavedGames.tsx`, `src/features/home/SavedGames.test.tsx`.
- Alterados: `src/App.tsx`, `src/App.test.tsx`, `tests/e2e/app/app.spec.ts`, `tests/e2e/app/visual.spec.ts`, `docs/SPEC-FRONTEND.md`.

## Como verificar

`npm run dev` (mocks) e abrir `/`. `npx vitest run src/features/home src/App.test.tsx` (23 testes) e `npx playwright test tests/e2e/app` (10 testes).

## Problemas

- `/novo` e `/grupo/:partyId` ainda não têm tela (T-18, T-19): a navegação funciona, mas a página fica vazia.
- O MSW não guarda estado (D-32): depois de abandonar, o save de exemplo continua na lista.

## Checks

guarda, typecheck, lint, format:check, vitest relacionados (23 passaram), e2e da área `app` (10 passaram), `test:build` (REQ-05 ok): todos verdes.

## Backend

Contrato sem mudança. A validação contra o backend real fica para o fim da FEAT-05 (T-19).

## Commit sugerido

`feat/home menu and abandon`
