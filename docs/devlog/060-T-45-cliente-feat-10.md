# 060 — T-45: Cliente da FEAT-10

- **ID:** T-45 · **FEAT:** FEAT-10 · **REQs:** REQ-43 a REQ-46 · **Decisão:** D-58 (item 6 novo) · **Contrato:** v0.41 (`implementado (BE)`) · **Spec:** 0.59 → 0.60 · **Data:** 2026-11-17

## Objetivo

Camada de cliente da FEAT-10: 2 chaves novas em `GameConfigValues`, inventário, equipamentos, bolsa e modificadores efetivos em `PlayerState`, a ação `prepare`, os motivos novos de `ACTION_NOT_ALLOWED`, `useParty`, `useLabGrant` e os cenários do MSW.

## Decisões

- As 5 cartas novas da `fixture` não têm cópia do backend no repositório. O autor escolheu montá-las só com o que o contrato fixa, com nomes pt-BR de exemplo (D-58 item 6). Risco: nomes e textos podem diferir do backend real; a validação contra o backend (`/retorno-backend`) pode pedir ajuste.
- `useLabGrant()` sem argumentos, com `{ partyId, memberId, grant }` na mutação (tabela de 3.4 da spec); a frase da tarefa dizia `useLabGrant(partyId, memberId)`, e a tabela venceu.
- `equipment` é um objeto com as 8 chaves obrigatórias (`string | null`), conferido por `satisfies Record<EquipmentSlot, …>`.
- `parseDetails` de `parties.ts` passou a ser exportado e é reutilizado por `labGrant.ts`.
- MSW sem estado (D-29): `Party` fixos por resposta (`partyBladeEquippedFixture`, `partyBladeUnequippedFixture`) e `409` por tabela de `cardId`/`slot`; doação por tabela de `memberId`/`cardId`/`type`. Grupo `party-com-equipamento` com `prepare` disponível.
- Os 2 rótulos do REQ-43 entraram no `LabPage` (o tipo `Record<GameConfigKey, string>` os exige); os 7 motivos do Preparar retornam `''` no `reasonText` do "Ajustar deck" até a T-47.

## Arquivos

- `src/api/labConfig.ts`, `src/api/parties.ts`, `src/api/labGrant.ts` (novo).
- `src/mocks/fixtures.ts`, `src/mocks/catalogFixtures.ts` (5 cartas, 17 na coleção), `src/mocks/partyFixtures.ts`, `src/mocks/handlers.ts`.
- `src/lab/LabPage.tsx` (2 rótulos), `src/features/party/PartySession.tsx` (motivos no `switch` exaustivo).
- Testes: `src/api/inventory.test.tsx` (novo, 31 casos, REQ-43 a REQ-46); alinhados ao contrato v0.41: `src/api/catalog.test.tsx`, `src/api/preparation.test.tsx`, `src/lab/LabPage.test.tsx`, `src/lab/CatalogSection.test.tsx`, `tests/e2e/lab/lab.spec.ts`.
- `docs/SPEC-FRONTEND.md` (T-45 `[x]`, D-58 item 6, 0.60).

## Como verificar

```
npx vitest run src
npx playwright test tests/e2e/lab tests/e2e/party
```

Com `npm run dev` (mocks), em `/lab`, "Catálogo" mostra 17 cartas (Equipamento 5, Item 2) e "Configuração" termina com "Capacidade do inventário" e "Capacidade da bolsa".

## Problemas

- Os testes de contagem da FEAT-04/06 (12 cartas, equipamento 1, item 1, `PlayerState` sem os campos novos, lista de rótulos do `LabPage`) fixavam a `fixture` antiga; foram alinhados ao contrato v0.41, não alterados para "passar".

## Checks

- Guarda, `tsc -b`, `lint`, `format:check`: verdes. Unitários (`src`): 556/556. E2E `lab` e `party`: 23/23. `test:build`: laboratório fora do release.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-48.

## Commit sugerido

`feat/feat-10 client layer for inventory and lab grant`
