# 027 — T-19: Grupo em sessão

- **ID:** T-19 · **FEAT:** FEAT-05 · **REQ:** REQ-16 · **Decisões:** D-37 · **Contrato:** §3 FEAT-05 (v0.16, `implementado (BE)`) · **Spec:** v0.27 → v0.28 · **Roadmap:** v0.19 → v0.20 · **Data:** 2026-11-15

## Objetivo

Tela `/grupo/:partyId`: envia Continuar (`POST …/session`) ao abrir, mostra o grupo e permite "Encerrar sessão", voltando a `/` com "Sessão encerrada.". Com ela, o lado frontend da FEAT-05 fica pronto.

## Antes da tarefa: cenários contra o backend real

Os 7 cenários do CONTRATO §3 FEAT-05 rodaram com `curl` contra `http://localhost:3333` (`/health` informa contrato `0.16`) e passaram todos, inclusive o CORS para `localhost:5173` e o `minPlayers = 2` via `PATCH /lab/config` (devolvido a 1 no fim). Os e2e `app`/`party` com o MSW desligado só passam em parte, porque dependem das fixtures (ids fixos, save de exemplo, console do MSW). Dois saves criados por eles no banco real foram apagados. A FEAT não foi marcada `validado`.

## Decisões

- **D-37:** efeito ao abrir sem guarda contra o pedido duplo do StrictMode (o contrato garante que é idempotente); ordem da área de status; grupo mantido na tela quando o encerrar falha; "Voltar ao início" só com `PARTY_NOT_FOUND`; mensagem para "Seus jogos" pelo `state` da navegação; `formatSavedAt` compartilhado em `src/ui/`.

## Arquivos

- Novos: `src/features/party/PartySession.tsx`, `src/features/party/PartySession.test.tsx`, `src/ui/formatSavedAt.ts`, `tests/e2e/party/party-session.spec.ts`.
- Alterados: `src/App.tsx` (rota `grupo/:partyId`), `src/features/home/SavedGames.tsx` (mensagem vinda do `state`; `formatSavedAt` importado), `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md`.

## Como verificar

`npm run dev` (mocks), `/` → "Continuar" → "Encerrar sessão" → `/` com "Sessão encerrada.". `/grupo/nope` mostra "Grupo não encontrado." e "Voltar ao início". `npx vitest run src/features` e `npx playwright test tests/e2e/party`.

## Problemas

- O Playwright reaproveita qualquer servidor em `5173` (`reuseExistingServer`). Havia um Vite do autor ali, sem MSW, e os e2e falharam por isso. Rodaram numa porta separada (`5199`) com uma config temporária, removida depois.
- Na primeira execução nessa porta, dois e2e de `app` falharam enquanto o Vite compilava a frio. Na segunda, passaram todos.

## Checks

guarda, typecheck, lint, format:check, `test:build` (REQ-05 ok), Vitest completo (216 passaram), e2e `party` + `app` com MSW (15 passaram): verdes.

## Backend

Contrato sem mudança. Falta conferir as telas da FEAT-05 contra o backend real (`/retorno-backend`).

## Commit sugerido

`feat/party session screen`
