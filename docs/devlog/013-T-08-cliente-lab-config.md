# 013 — T-08: Cliente da configuração do laboratório

- **ID:** T-08 · **FEAT:** FEAT-03 · **REQ:** REQ-06 · **D:** D-01, D-14, D-23 · **Data:** 2026-11-14

## Objetivo

Camada de cliente de `GET`/`PATCH /lab/config` e `POST /lab/config/reset` (CONTRATO §3 FEAT-03 v0.7), com MSW respondendo fixtures dos cenários.

## Decisões

- `getJson` passa a delegar a `requestJson(method, path, body?)`; `Content-Type: application/json` só quando há corpo.
- `ApiError` ganhou `details: unknown`; `LAB_CONFIG_INVALID` com `details` válido vira `LabConfigInvalidError` (com `fields`); `details` fora do contrato vira erro genérico (a tela mostrará "Servidor indisponível. Tente novamente.").
- Mutações atualizam o cache de `useLabConfig` com o `LabConfig` devolvido (`setQueryData`); falha não toca no cache.
- Handlers do MSW com resposta fixa (PATCH sempre devolve o cenário `actionPointsPerTurn = 4`); os testes trocam o handler por cenário.

## Arquivos

- `src/api/http.ts`, `src/api/labConfig.ts` (novo), `src/api/labConfig.test.tsx` (novo, 17 testes)
- `src/mocks/fixtures.ts`, `src/mocks/handlers.ts`
- `docs/SPEC-FRONTEND.md` (v0.13)

## Como verificar

`npx vitest run src/api src/mocks src/App.test.tsx` → 35 testes passam. Sem tela nesta tarefa (a tela vem na T-10).

## Checks

Testes afetados, `typecheck`, `lint`, `format:check`, guarda de `src/` e `build` verdes; `dist/` sem a string `lab/config` (o cliente ainda não é importado por nenhuma tela). Revisão do spec-reviewer: aprovado; não bloqueantes de teste resolvidos (headers do pedido, `invalidBody` com `field: null`).

## Dependência do backend

Nenhuma agora; o Aviso de backend vem ao fechar a T-10.

## Commit sugerido

`feat/lab config client layer`
