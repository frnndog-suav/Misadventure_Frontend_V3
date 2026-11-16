# 039 — T-28: cliente alinhado ao contrato da FEAT-06

- **ID:** T-28 · **FEAT:** FEAT-06 · **REQ:** REQ-27 a REQ-30 · **Spec:** v0.38 → v0.39 (D-49) · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Levar a camada de cliente (`src/api/`, `src/mocks/`) ao contrato da FEAT-06, com a suíte inteira verde.

## Decisões

- O que fica fora de `src/api/` é só o mínimo para compilar (escolha do autor). Os detalhes e o estado intermediário estão na D-49.
- O cenário `required` do `POST /parties` fica fora do handler padrão até a T-30. Motivo: a tela "Novo jogo" ainda não envia `playerClass`, e sem isso o fluxo de criar grupo quebraria no dev e nos e2e.
- Fixtures provisórias, a trocar pela cópia exata quando o backend chegar a `implementado (BE)`: `grayHarborFixture`, `stoneBendFixture`, `oldMineFixture`, `enduranceBasicFixture`, `dexterityBasicFixture` e `rogueClassFixture`. Já são cópias do contrato: `testDimensionFixture` e `warriorClassFixture`.

## Arquivos

- `src/api/`: `catalog.ts`, `parties.ts`, `labConfig.ts`, `editor.ts` (`dimension` em `cardCounts`) e `preparation.test.tsx` (novo, 22 testes).
- `src/mocks/`: `catalogFixtures.ts`, `classFixtures.ts` (novo), `partyFixtures.ts`, `fixtures.ts`, `editorFixtures.ts` e `handlers.ts` (`GET /catalog/classes`, `GET /catalog/cards/:cardId`, `unknownClass`).
- Mínimo para compilar: `src/ui/labels.ts`, `src/ui/cards/FullCard.tsx`, `src/lab/LabPage.tsx`, `src/lab/CatalogSection.tsx`, `src/lab/editor/cardFormValues.ts`, `CardsSection.tsx` e `CardForm.tsx`.
- Testes alinhados aos dados novos do contrato: `catalog.test.tsx`, `CatalogSection.test.tsx`, `EditorPage.test.tsx`, `CardForm.test.tsx`, `tests/e2e/lab/lab.spec.ts` e `tests/e2e/editor/collections.spec.ts`.

## Checks

`typecheck`, `lint`, `format:check` e guarda: ok. Unitários: 377 passaram. E2E: 35 passaram. `test:build`: ok. Revisão do spec-reviewer: nenhum bloqueante; os pontos importantes estão resolvidos ou repassados às T-29, T-30, T-32 e T-33 (D-49).

## Dependência do backend

O backend ainda está com a FEAT-06 `a fazer`. Até ele implementar, o app só funciona com `VITE_USE_MOCKS=true`, porque os schemas novos rejeitam as respostas antigas.

## Commit sugerido

`feat/client aligned to feat-06 contract`
