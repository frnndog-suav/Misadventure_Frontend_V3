# 045 — T-34: classes no editor

- **ID:** T-34 · **FEAT:** FEAT-06 · **REQ:** REQ-32, REQ-33 · **Spec:** v0.44 → v0.45 · **Roadmap:** v0.28 → v0.29 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Dar ao editor a seção "Classes" (lista, formulário, salvar, publicar, excluir, guarda de alterações), testar o `CONTENT_REFERENCED` no formulário de carta e alinhar a mensagem de importação às classes. Fecha o lado FE da FEAT-06 com MSW.

## Decisões

- **D-54** (spec): seção "Classes" depois de "Cartas", recomeça ao trocar de coleção; formulário no molde da D-43/D-46; seleção "Classe" **desabilitada** numa classe publicada (o `select` não tem `readOnly`); modificadores com o nome do glossário; sugestão de "Carta {n}" por `datalist` com `useEditorCards(coleção, { type: 'attribute' })`; "Classe excluída." na área da seção; guarda única com "desta classe" (precedência: coleção, carta, classe); limites ficam com o backend (D-38).
- `CONTENT_REFERENCED` já aparecia no formulário de carta pela `message` (D-46): só ganhou testes.
- `useFieldErrors`, `options` e `attributeOptions` saíram de `CardForm.tsx` para `formHelpers.tsx`, porque exportá-los de um arquivo de componentes quebra a regra `react-refresh/only-export-components` do ESLint.
- MSW: a lista de coleções só traz a `fixture`. Os unitários acrescentam o `bosque` (classe `mage` em rascunho) com `server.use`; o e2e cria a classe na `fixture` (o handler devolve o `mage` em rascunho) e segue com publicar/excluir.

## Arquivos

- Novos: `src/lab/editor/ClassesSection.tsx`, `ClassForm.tsx`, `classFormValues.ts`, `formHelpers.tsx`, `ClassesSection.test.tsx` (26 testes), `tests/e2e/editor/classes.spec.ts` (3 testes).
- `src/lab/editor/CollectionsSection.tsx`: monta `ClassesSection` (chave `classes-<id>`, para não repetir a da `CardsSection`), `classDirty` na guarda, "Coleção importada: {cardCount} cartas e {classCount} classes.".
- `src/lab/editor/useUnsavedGuard.tsx`: assunto `'desta classe'`.
- `src/lab/editor/CardForm.tsx`: exporta `TextField`, `SelectField` (nova prop `disabled`), `ListField`; importa os auxiliares de `formHelpers.tsx`.
- `src/lab/editor/cardFormValues.ts`: exporta `filled` e `parseNumber`.
- `src/lab/editor/CollectionTools.test.tsx` e `tests/e2e/editor/collections.spec.ts`: mensagem de importação alinhada ao REQ-33; teste REQ-33 do export com `classes`.
- `docs/SPEC-FRONTEND.md`: T-34 `[x]`, D-54, v0.45. `docs/ROADMAP.md`: FEAT-06 FE `aguardando outro lado`, v0.29.

## Como verificar

`npm run dev` (mocks) → `/lab/editor` → "Coleção de Teste": a seção "Classes" lista "Ladino · Publicada" e "Guerreiro · Publicada"; abrir "Ladino" mostra "Classe" desabilitada e o deck; "Nova classe" → preencher → "Salvar classe" → "Classe salva.".

```
npx vitest related --run src/lab/editor/*.tsx src/lab/editor/*.ts
npx playwright test tests/e2e/editor
npm run test:build
```

## Problemas

- Aviso do React "two children with the same key, `fixture`" no e2e: `CardsSection` e `ClassesSection` eram irmãs com `key={selectedId}`. Corrigido com `key={\`classes-${selectedId}\`}`.
- Lint `react-refresh/only-export-components` ao exportar funções de `CardForm.tsx`: resolvido com `formHelpers.tsx`.

## Checks

Guarda (`client-guard --all`), `typecheck`, `lint`, `format:check`: ok. Unitários afetados: 129 passaram (4 arquivos). E2E `editor`: 19 passaram. `test:build`: ok (laboratório fora do release).

## Dependência do backend

Sim: FEAT-06 inteira precisa ser validada contra o backend real (`/retorno-backend`) quando o BE estiver `pronto`. Aviso de backend dado (ROADMAP v0.29).

## Commit sugerido

`feat/classes in editor`
