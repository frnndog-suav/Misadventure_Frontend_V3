# 044 — T-33: editor — Carta de Dimensão e forma das setas

- **ID:** T-33 · **FEAT:** FEAT-06 · **REQ:** REQ-31 · **Spec:** v0.43 → v0.44 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Encerrar no editor o estado intermediário da D-49: a Carta de Dimensão ganha formulário e entra em "Nova carta"; o formulário de zona ganha a seleção "Forma das setas".

## Decisões

- **D-53:** sai o `hasForm`; "Nova carta" oferece os 7 tipos na ordem do glossário. Dimensão: "Nome" e "Ordem de lançamento" obrigatórios, "Texto de ambientação" e "Zona de chegada" em branco = `null`, "Zona de chegada" em texto livre (o backend confere). "Forma das setas": opção vazia "Não se aplica" (`null`), "Opostas" (`straight`), "Vizinhas" (`corner`), sem conferir o número de setas (D-38).

## Arquivos

- `src/lab/editor/cardFormValues.ts`: `DimensionForm`; `arrowLayout` da zona como `'' | straight | corner`; `emptyForm`, `formFromCard`, `toInput` para `dimension`; sai `hasForm`/`FormCard`.
- `src/lab/editor/CardForm.tsx`: `DimensionFields`; seleção "Forma das setas" depois de "Setas de conexão".
- `src/lab/editor/CardsSection.tsx`: sem filtro de "Nova carta" nem `hasForm`.
- `src/lab/editor/CardForm.test.tsx`: 5 testes REQ-31. `src/lab/editor/EditorPage.test.tsx`: "Nova carta" com 7 tipos.
- `tests/e2e/editor/card-form.spec.ts`: e2e REQ-31. `tests/e2e/editor/cards.spec.ts`: contagem 6 → 7 (alinhamento da D-49).
- `docs/SPEC-FRONTEND.md`: T-33 `[x]`, D-53, v0.44.

## Como verificar

`npm run dev` (mocks) → `/lab/editor` → "Coleção de Teste" → botão "Dimensão de Teste · Dimensão · Publicada" abre o formulário; "Bosque Sussurrante · Zona · Publicada" mostra "Forma das setas" = "Opostas".

## Checks

Guarda, `typecheck`, `lint`, `format:check`: ok. Unitários `src/lab/editor`: 102 passaram (3 arquivos). E2E `editor`: 16 passaram. `test:build`: ok.

## Dependência do backend

A mesma da T-28: validação real na `/retorno-backend` depois da T-34.

## Commit sugerido

`feat/dimension card and arrow layout in editor`
