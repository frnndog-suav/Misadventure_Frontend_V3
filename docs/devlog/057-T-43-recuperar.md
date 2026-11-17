# 057 — T-43: Recuperar

- **ID:** T-43 · **FEAT:** FEAT-09 · **REQs:** REQ-41 · **Decisão:** D-57 · **Contrato:** v0.37 (`implementado (BE)`) · **Spec:** 0.56 → 0.57 · **Data:** 2026-11-17

## Objetivo

Grupo "Recuperar" na região "A vez": três botões que enviam `recover` com a opção, sem confirmação.

## Decisões

- Os botões usam o `usePartyAction` existente (T-41); o `pending` da ação desabilita Recuperar, "Encerrar a vez" e "Movimentar" (já ligado ao mesmo estado).
- A mensagem "Recuperou: vida {health}/{maxHealth}, Vigor {vigor}." lê o host do `Party` devolvido; o frontend não calcula nada (D-57).
- Erros seguem o REQ-35 sem código novo. Sem `D-xx` novo.

## Arquivos

- `src/features/party/PartySession.tsx` (grupo, `onRecover`, status).
- Testes: `src/features/party/PartySession.test.tsx` (REQ-41, 8 casos), `tests/e2e/party/party-session.spec.ts` (3 opções).
- `docs/SPEC-FRONTEND.md` (T-43 `[x]`, 0.57).

## Como verificar

```
npx vitest run src/features/party
npx playwright test tests/e2e/party
```

Com `npm run dev` (mocks), em `/grupo/party-os-teimosos`, na região "A vez", clique cada botão do grupo "Recuperar".

## Problemas

Nenhum.

## Checks

- `tsc -b`, `lint`, `format:check`, guarda: verdes. Unitários `party`: 84/84. E2E `party`: 14/14.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-44.

## Commit sugerido

`feat/feat-09 recover buttons on party turn`
