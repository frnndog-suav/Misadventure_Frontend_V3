# 031 — T-21: Rota do editor e coleções

- **ID:** T-21 · **FEAT:** FEAT-31 · **REQ:** REQ-18, REQ-19, REQ-24 (parte de coleção) · **Decisões:** D-24, D-35, D-36, D-41 · **Contrato:** §3 FEAT-31 (`acordado`, sem mudança) · **Spec:** v0.30 → v0.31 · **Data:** 2026-11-16

## Objetivo

Abrir o editor de conteúdo em `/lab/editor`, só no dev, com a seção "Coleções": lista, painel de contagens, criar, editar e excluir coleção, e o diálogo de alterações não salvas no formulário de coleção.

## Decisões (D-41)

- **Roteador de dados (autor).** `src/main.tsx` trocou `BrowserRouter` por `createBrowserRouter`. Uma rota `*` monta o `App`, que segue com as próprias `<Routes>`. Motivo: o `useBlocker` só funciona com o roteador de dados, e o REQ-24 pede o diálogo também no Voltar do navegador. Alternativa descartada: perguntar só nos controles do editor.
- **Nenhuma coleção vem escolhida (autor).** O painel aparece depois do clique.
- `useUnsavedGuard` (`src/lab/editor/useUnsavedGuard.tsx`) junta o bloqueio de rota, o `beforeunload` e as ações da tela (`guard(acao)`). No formulário de coleção, "Nova coleção", outra coleção, "Editar coleção" e "Excluir coleção" passam pelo `guard`. "Cancelar" fecha sem perguntar. A T-23 reaproveita o hook no formulário de carta.
- `ConfirmDialog` (`src/lab/editor/ConfirmDialog.tsx`) segue o molde da D-35: foco no botão de cancelar e Esc para cancelar.
- `useEditorCollection` aceita `null`, o que deixa a consulta parada enquanto nenhuma coleção está escolhida. A 3.4 da spec já foi atualizada.
- O PATCH envia `name` e `description`.
- Área de status: primeiro a mensagem da última ação, depois a consulta da lista e por fim a da coleção escolhida.
- `scripts/check-release-build.mjs` ganhou a marca "Editor de conteúdo".

## Arquivos

- Novos: `src/lab/editor/EditorPage.tsx`, `CollectionsSection.tsx`, `ConfirmDialog.tsx`, `useUnsavedGuard.tsx` e `EditorPage.test.tsx`, além de `tests/e2e/editor/collections.spec.ts`.
- Alterados: `src/main.tsx` (roteador de dados), `src/lab/labRoute.tsx` (fragmento com `/lab` e `/lab/editor`), `src/lab/LabPage.tsx` e `LabPage.test.tsx` (link "Editor de conteúdo"; o teste ganhou `MemoryRouter`), `src/api/editor.ts` e `editor.test.tsx` (`null`), `scripts/check-release-build.mjs`, `docs/SPEC-FRONTEND.md`.

## Como verificar

`npm run dev` com mocks ligados. Abra `/lab` e clique em "Editor de conteúdo". Depois:

```
npx vitest run src/lab src/api/editor.test.tsx
npm run test:build
npx playwright test tests/e2e/editor
```

## Checks

`npm run format`, `npm run format:check`, `node .claude/hooks/client-guard.mjs --all` (limpo), `npm run typecheck`, `npm run lint`, `npx vitest run` (24 arquivos e 276 testes, mais 2 acrescentados depois da revisão; os 24 de `src/lab/editor` estão verdes) e `npm run test:build` (REQ-05 ok). Os e2e passaram todos (23), num servidor à parte com mocks ligados (abaixo).

## Problemas

- Os e2e falharam em todas as áreas, inclusive no código anterior (conferido com `git stash`). Motivo: já havia um `npm run dev` na 5173, que o Playwright reaproveita (`reuseExistingServer`), e existe um `.env.development.local`, provavelmente com mocks desligados desde a validação da FEAT-05. Nenhum dos dois foi mexido. A suíte rodou com uma config temporária (porta 5174, `VITE_USE_MOCKS=true`), apagada depois.
- O `git stash pop` regravou os arquivos com CRLF; o `npm run format` corrigiu.

## Revisão

O spec-reviewer aprovou, sem bloqueantes. Dos não bloqueantes, dois foram corrigidos: "Editar coleção" e "Excluir coleção" com o formulário alterado agora passam pelo `guard`. Os dois ganharam teste, assim como o "Descartar" via "Nova coleção". O resto foi registrado na spec: "Cancelar" sem pergunta, D-41 e REQ-19/REQ-24.

## Backend

Nenhuma dependência nova. A validação contra o backend real fica para o fim da FEAT-31.

## Commit sugerido

`feat/content editor collections`
