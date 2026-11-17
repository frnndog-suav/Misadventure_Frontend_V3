# 047 — T-35: Cliente da FEAT-07

- **ID:** T-35 · **FEAT:** FEAT-07 · **REQs:** REQ-34, REQ-35 · **Decisão:** D-55 · **Contrato:** v0.28 (`acordado`) · **Spec:** 0.46 → 0.47 · **Data:** 2026-11-17

## Objetivo

Camada de cliente da FEAT-07: `moveTargets` no schema do jogador, a intenção `move` e o hook `usePartyAction`, com o MSW respondendo por tabela de cenários.

## Decisões

- O MSW segue sem estado (D-29, D-55 item 5). Como `gray-harbor` serve tanto de "voltar à cidade" (`200`) quanto do cenário `notConnected` do contrato (que exige estar na cidade), o `409` do MSW usa `fixture.old-mine` (sem travessia com a cidade no mapa de exemplo). `fixture.nowhere` → `400 zoneNotInMap`; `type` desconhecido → `400 unknownAction`.
- `ACTION_INVALID`/`ACTION_NOT_ALLOWED` chegam como `ApiError` genérico (a UI só mostra a `message`, REQ-35); sem classe de erro própria.
- `knownParty` do handler passou a aceitar resposta assíncrona.

## Arquivos

- `src/api/parties.ts`: `moveTargets`, `PartyAction`, `MoveAction`, `usePartyAction`.
- `src/mocks/partyFixtures.ts`, `src/mocks/handlers.ts`: `moveTargets`, `partyMovedToStoneBendFixture`, `partyMovedToGroveFixture`, fixtures de erro, `POST …/actions`.
- `src/api/partyActions.test.tsx` (novo, 8 testes); `src/api/preparation.test.tsx` (`moveTargets` no `toEqual` do jogador).

## Como verificar

`npx vitest run src/api/partyActions.test.tsx src/api/preparation.test.tsx`; `npx playwright test tests/e2e/party` (sem mudança de tela).

## Checks

Unitários `src/api`, `src/mocks`, `src/features/party`: 182/182. E2E `party`: 7/7. `typecheck`, `lint`, `format:check`, guarda e `build`: verdes. Sem e2e novo: a tarefa não toca tela.

## Backend

Nada novo: contrato `acordado`; a validação contra o backend real vem depois da T-37.

## Commit sugerido

`feat/feat-07 client layer and msw action scenarios`
