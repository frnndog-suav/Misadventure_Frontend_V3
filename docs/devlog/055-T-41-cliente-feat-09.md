# 055 — T-41: Cliente da FEAT-09

- **ID:** T-41 · **FEAT:** FEAT-09 · **REQs:** REQ-39 a REQ-42 · **Decisão:** D-57 · **Contrato:** v0.37 (`implementado (BE)`) · **Spec:** 0.54 → 0.55 · **Data:** 2026-11-17

## Objetivo

Camada de cliente da FEAT-09: 5 chaves novas em `GameConfigValues`, build e pasta de TCG em `PlayerState`, as ações `recover` e `adjustDeck`, o erro `ACTION_NOT_ALLOWED` com motivo e os cenários do MSW.

## Decisões

- `CardCopies` com `copies` inteiro ≥ 1; `buildSize` e `tcgFolderCapacity` inteiros ≥ 0.
- `availableActions` com `z.enum(['move','recover','adjustDeck','endTurn'])`, na ordem fixa do contrato.
- `ACTION_NOT_ALLOWED` vira `ActionNotAllowedError` (subclasse de `ApiError`, com `reason` e `cardId`). Um `details` fora do contrato vira erro de validação, como nos outros erros (D-01). Um `reason` desconhecido cai nesse caso: é o formato estrito que o contrato prevê.
- MSW sem estado (D-29):
  - um `Party` pronto por opção do `recover`;
  - `adjustDeck` por tabela das builds exatas dos cenários do contrato (`S` 29 → `buildBelowMinimum`; `S` 31 → `notOwned` `S`; `dexterity-basic` 1 a mais → `notOwned` `dexterity-basic`);
  - qualquer outra build recebe o `200` sem mudança;
  - `recover` com opção desconhecida recebe `400` `unknownOption` antes do `noActionPoints` (ordem do contrato, apontada pelo spec-reviewer).
  
  Tudo isso está registrado na D-57, item 6.
- O `400` de `adjustDeck` (`notPositiveInteger`, `duplicateCard`) ficou fora do MSW, porque o formulário do REQ-42 não envia esses corpos.
- Os 5 rótulos do REQ-39 entraram no `LabPage` já nesta tarefa, porque o tipo `Record<GameConfigKey, string>` os exige (como na D-49). O teste do REQ-39 veio junto; a T-42 só acrescenta a build e a pasta.

## Arquivos

- `src/api/labConfig.ts`, `src/api/parties.ts`.
- `src/mocks/fixtures.ts`, `src/mocks/partyFixtures.ts` (`partyRecovered*Fixture`, `partyDeckAdjustedFixture`, `actionBuildBelowMinimumFixture`, `actionNotOwnedFixture(cardId)`, `actionInvalidUnknownOptionFixture`), `src/mocks/handlers.ts`.
- `src/lab/LabPage.tsx` (rótulos).
- Testes:
  - `src/api/deck.test.tsx` (novo, 15 testes, REQ-38 a REQ-42);
  - testes antigos alinhados ao contrato v0.37: `src/api/partyActions.test.tsx` e `src/api/preparation.test.tsx` (`availableActions` com 4 ações, `build` e pasta no cenário de criação) e `src/lab/LabPage.test.tsx` (lista de rótulos e teste do REQ-39).
- `docs/SPEC-FRONTEND.md` (T-41 `[x]`, 0.55, D-57 item 6).

## Como verificar

```
npx vitest run src/api src/mocks src/lab src/features/party
npx playwright test tests/e2e/lab tests/e2e/party
```

Com `npm run dev` (mocks), em `/lab`, a seção "Configuração" termina com os 5 campos da FEAT-09.

## Problemas

- O `npm run typecheck` acusou rótulos faltando no `LabPage` (`Record<GameConfigKey>`). Solução: entraram os 5 rótulos do REQ-39.
- Dois testes antigos fixavam o `PlayerState` da FEAT-08. Foram alinhados aos valores do cenário de criação do contrato v0.37.

## Checks

- Guarda, `typecheck`, `lint` e `format:check`: verdes.
- Unitários (api, mocks, lab e party): 407/407.
- E2E `lab` e `party`: 18/18.
- `npm run test:build`: REQ-05 ok.
- spec-reviewer: aprovado, sem bloqueantes.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-44.

## Commit sugerido

`feat/feat-09 client layer for deck actions`
