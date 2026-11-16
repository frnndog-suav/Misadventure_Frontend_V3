# 043 — T-32: cliente do editor — classes e Carta de Dimensão

- **ID:** T-32 · **FEAT:** FEAT-06 · **REQ:** REQ-31 a REQ-33 · **Spec:** v0.42 → v0.43 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Levar a camada de cliente do editor ao contrato da FEAT-06: classes (tipos, schemas, hooks), `CollectionExport.classes` tipado, erros `CLASS_NOT_FOUND` e `CONTENT_REFERENCED`, cenários das classes no MSW e `validate-dimension` da `fixture` válida (o exemplo inválido vai para o `bosque`).

## Decisões

- **D-52:** reaproveita `classDefinitionSchema`/`playerClassSchema` do catálogo; `CardInput` já cobria `dimension`/`arrowLayout` (é o `Card`); erros de classe como `ApiError` comum; tabela de cenários do MSW sem estado; campos omitidos do `mage`, textos de `fields[].message` das classes e o problema da Carta de Dimensão no `bosque` são provisórios até o `implementado (BE)`.

## Arquivos

- `src/api/editor.ts`: `ClassInput`, `editorClassSchema`, `editorClassSummarySchema`, `classes` do export tipado; `useEditorClasses`, `useEditorClass`, `useCreateClass`, `useSaveClass`, `usePublishClass`, `useDeleteClass`.
- `src/mocks/editorFixtures.ts`: fixtures das classes, `bosqueDimensionFixture`, `fixtureDimensionFixture` válida, export da `fixture` com as 2 classes, `classNotFoundFixture`, `contentReferencedFixture`.
- `src/mocks/handlers.ts`: rotas `/lab/content/.../classes` e `/lab/content/classes/:playerClass`; `CONTENT_REFERENCED` no `DELETE` de `fixture.dexterity-basic`; `validate-dimension` por coleção.
- `src/api/editor.test.tsx`: 12 testes novos (REQ-31, REQ-32, REQ-33) e o do REQ-25 alinhado.
- `src/lab/editor/CollectionTools.test.tsx` e `tests/e2e/editor/collections.spec.ts`: alinhados à `fixture` válida.
- `docs/SPEC-FRONTEND.md`: T-32 `[x]`, D-52, v0.43.

## Como verificar

`npx vitest run src/api/editor.test.tsx`; `npm run dev` (mocks) → `/lab/editor` → "Coleção de Teste" → "Validar como dimensão" mostra "A coleção forma uma dimensão válida.".

## Checks

Guarda, `typecheck`, `lint`, `format:check`: ok. Unitários (`src/api`, `src/lab`, `src/mocks`, `src/features`): 327 passaram (15 arquivos). E2E `editor`: 15 passaram. `test:build`: ok.

## Dependência do backend

A mesma da T-28: validação real na `/retorno-backend` depois da T-34; os provisórios da D-52 trocam pela cópia do `implementado (BE)`.

## Commit sugerido

`feat/editor client with classes`
