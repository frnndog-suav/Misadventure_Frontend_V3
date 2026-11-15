# 024 — T-16: Cliente da campanha

- **ID:** T-16 · **FEAT:** FEAT-05 · **REQ:** REQ-14 a REQ-17 · **Decisões:** D-32, D-34 · **Contrato:** §3 FEAT-05 (v0.14, `acordado`) · **Spec:** v0.24 → v0.25 · **Data:** 2026-11-15

## Objetivo

Camada de cliente da campanha solo: schemas Zod, hooks da tabela 3.4, fixtures e handlers do MSW com os cenários do contrato. As telas ficam para as T-17 a T-19.

## Decisões

- **D-34:** `requestJson` aceita `DELETE` e devolve `undefined` no `204`. Datas validadas como ISO 8601 UTC com `Z`. `PARTY_INVALID` com `details` válido vira `PartyInvalidError`; com `details` fora do contrato, vira erro genérico.
- Handlers por tabela de cenários, sem estado. `POST /parties` devolve a fixture de erro só para os corpos exatos dos dois cenários de erro do contrato e o grupo de exemplo para qualquer outro corpo. As rotas de grupo respondem só para `party-os-teimosos`; os outros ids recebem `404`.
- `GET /parties/:partyId` fica sem hook e sem handler, porque não está na tabela 3.4.
- `useEndSession` invalida `useParties` no sucesso; `useAbandonParty` invalida no sucesso e no erro. Nenhum dos dois tem retry.

## Arquivos

- Novos: `src/api/parties.ts`, `src/api/parties.test.tsx`, `src/mocks/partyFixtures.ts`.
- Alterados: `src/api/http.ts`, `src/mocks/handlers.ts`, `docs/SPEC-FRONTEND.md`.

## Como verificar

`npx vitest run src/api/parties.test.tsx` roda os 17 testes, todos verdes. Ainda não existe tela.

## Revisão

O spec-reviewer aprovou sem bloqueantes. Os não bloqueantes são cobertura extra (404 do `session/end` no handler padrão; teste direto do `204` em `requestJson`) e estilo das fixtures. Ficam para quando a área for mexida de novo.

## Checks

format, guarda, typecheck, lint, format:check, vitest de `src/api` e `src/mocks` (61 passaram), `test:build` (REQ-05 ok): todos verdes.

## Backend

Contrato sem mudança. A validação contra o backend real fica para o fim da FEAT-05 (T-19).

## Commit sugerido

`feat/campaign client`
