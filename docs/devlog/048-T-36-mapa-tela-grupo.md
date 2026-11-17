# 048 — T-36: Mapa na tela do grupo

- **ID:** T-36 · **FEAT:** FEAT-07 · **REQs:** REQ-34 · **Decisão:** D-55 · **Contrato:** v0.28 (`acordado`) · **Spec:** 0.47 → 0.48 · **Data:** 2026-11-17

## Objetivo

Desenhar o mapa recebido em `Party.dimension.map` na tela `/grupo/:partyId`, com escolha de zona (sem o botão Movimentar, que é a T-37).

## Decisões

- Grade CSS com colunas e linhas intercaladas (zona nas posições ímpares, ligação nas pares), a partir de `x`/`y` normalizados pelo menor valor.
- Ligação só quando o `crossing` liga zonas vizinhas na grade; o frontend não deduz travessia (D-55 item 3). Crossing entre zonas não vizinhas não é desenhado (só aparece em "Travessias com").
- A posição também vai em `data-col`/`data-row`: o jsdom descarta `grid-column`/`grid-row` inline, então os testes leem os atributos.
- A escolha da zona é estado local de `PartyMap`; a T-37 acrescenta o botão na seção "Zona escolhida".
- Títulos pelo `useCatalogCards` (ids das zonas do mapa entram em `cardIdsOf`).
- Sem acabamento visual (FEAT-30).

## Arquivos

- `src/features/party/PartyMap.tsx` (novo); `src/features/party/PartySession.tsx` (renderiza o mapa e pede as cartas das zonas).
- `src/features/party/PartySession.test.tsx` (+10 testes REQ-34); `tests/e2e/party/party-session.spec.ts` (+1).

## Como verificar

`npx vitest run src/features/party`; `npx playwright test tests/e2e/party`; `npm run dev` com mocks, `/grupo/party-os-teimosos`.

## Checks

Unitários `party`: 53/53 (related: 76/76). E2E `party`: 8/8. `typecheck`, `lint`, `format:check`, guarda e `test:build`: verdes.

## Backend

Nada novo; validação contra o backend real depois da T-37.

## Commit sugerido

`feat/feat-07 map on party screen`
