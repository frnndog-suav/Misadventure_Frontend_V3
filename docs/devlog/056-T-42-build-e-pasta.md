# 056 — T-42: Laboratório, build e pasta

- **ID:** T-42 · **FEAT:** FEAT-09 · **REQs:** REQ-39, REQ-40 · **Decisão:** D-57 · **Contrato:** v0.37 (`implementado (BE)`) · **Spec:** 0.55 → 0.56 · **Data:** 2026-11-17

## Objetivo

Mostrar a build e a pasta de TCG na seção de cada membro (REQ-40) e fechar o REQ-39 no laboratório.

## Decisões

- A parte do laboratório (REQ-39: 5 rótulos e o teste) já tinha entrado na T-41 (registrado no devlog 055). A T-42 não mexeu no `LabPage`.
- Pasta vazia: título "Pasta de TCG (capacidade N)" seguido de "Pasta vazia." (sem lista); com entradas, a lista é nomeada pelo título.
- Os ids de `build` e `tcgFolder` entram na consulta de nomes (`cardIdsOf`); até a carta chegar, o nome é "…" (regra do REQ-30).
- Nada decidido de novo: sem `D-xx` novo.

## Arquivos

- `src/features/party/PartySession.tsx` (listas "Build" e "Pasta de TCG", ids na consulta).
- Testes: `src/features/party/PartySession.test.tsx` (2 testes REQ-40), `tests/e2e/party/party-session.spec.ts` (REQ-30 ampliado).
- `docs/SPEC-FRONTEND.md` (T-42 `[x]`, 0.56).

## Como verificar

```
npx vitest run src/features/party src/lab
npx playwright test tests/e2e/lab tests/e2e/party
```

Com `npm run dev` (mocks), em `/grupo/party-os-teimosos`, a seção "Lia" mostra "Build (60 cartas)" e "Pasta de TCG (capacidade 30)" antes de "Mão (7)".

## Problemas

Nenhum.

## Checks

- `typecheck` e `lint`: verdes. Unitários (api, lab, party): 405/405. E2E `lab` e `party`: 18/18.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-44.

## Commit sugerido

`feat/feat-09 build and tcg folder on party screen`
