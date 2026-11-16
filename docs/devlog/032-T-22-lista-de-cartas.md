# 032 — T-22: Lista de cartas

- **ID:** T-22 · **FEAT:** FEAT-31 · **REQ:** REQ-20 · **Decisões:** D-39, D-42 · **Contrato:** §3 FEAT-31 (`acordado`, sem mudança) · **Spec:** v0.31 → v0.32 · **Data:** 2026-11-16

## Objetivo

Seção "Cartas" do editor para a coleção escolhida: filtros "Tipo de carta" e "Situação", busca "Buscar por nome", lista de cartas e "Nova carta" com escolha de tipo. Quem filtra é o backend (D-39). Os pedidos saem por `useEditorCards` (T-20).

## Decisões (D-42)

- **Sem formulário até a T-23 (autor, 2026-11-16).** Escolher uma carta ou um tipo em "Nova carta" só guarda a escolha. A carta fica com `aria-pressed=true`, e o tipo escolhido fecha o grupo "Tipo da nova carta" e desmarca a carta. A T-23 liga o formulário e a guarda do REQ-24 a esse estado (`Selection` em `CardsSection.tsx`). Alternativa descartada: um cabeçalho provisório, que não está na spec.
- **Busca com espera de 300 ms (autor).** O campo fica num `<form role="search">`, e o Enter consulta na hora.
- Os filtros são rádios, como no catálogo (REQ-08): "Todos" + os 6 tipos e "Todas"/"Rascunho"/"Publicada". O rótulo do tipo vem de `cardTypeLabels`.
- A seção aparece fora da região "Coleções", com área de status própria, e só depois que a coleção escolhida carregou. Ela recebe `key={selectedId}`, então filtros, busca e escolha recomeçam ao trocar de coleção.
- O nome do botão da carta usa o `name` do `EditorCardSummary`, que o backend já manda pronto (título em zona e eventos).

## Arquivos

- Novos: `src/lab/editor/CardsSection.tsx` e `tests/e2e/editor/cards.spec.ts`.
- Alterados: `src/lab/editor/CollectionsSection.tsx` (fragmento que monta a `CardsSection`), `src/lab/editor/EditorPage.test.tsx` (9 testes do REQ-20), `tests/e2e/editor/collections.spec.ts` (`getByLabel('Nome', { exact: true })`) e `docs/SPEC-FRONTEND.md`.

## Como verificar

Rode `npm run dev` com mocks ligados, abra `/lab/editor` e clique em "Coleção de Teste": a seção "Cartas" mostra 6 cartas.

```
npx vitest run src/lab/editor
npx playwright test tests/e2e/editor
```

## Checks

`npm run format`, `npm run typecheck`, `npm run lint` e `node .claude/hooks/client-guard.mjs --all` passaram limpos. `npx vitest run src/lab/editor` deu 33/33. `npx playwright test tests/e2e/editor` deu 4/4, e `npm run test:build` deu REQ-05 ok.

## Problemas

- Os e2e de coleção quebraram por strict mode: `getByLabel('Nome')` também casava com "Buscar por nome", que é o rótulo exigido pelo REQ-20. O localizador passou a ser exato. O que o teste confere não mudou.
- O `python` não existe no Git Bash desta máquina. As edições foram feitas com a ferramenta Edit.

## Revisão

Foi uma revisão própria do diff, porque a tarefa mexe só na tela de lab e não na camada de cliente. Cada critério do REQ-20 tem teste. O REQ-20 diz que escolher uma carta ou um tipo "abre o formulário"; essa parte fica para a T-23 (D-42).

## Backend

Nenhuma dependência nova.

## Commit sugerido

`feat/content editor card list`
