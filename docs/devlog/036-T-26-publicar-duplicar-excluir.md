# 036 — T-26: Publicar, duplicar e excluir carta

- **ID:** T-26 · **FEAT:** FEAT-31 · **REQ:** REQ-23 · **Decisões:** D-46 · **Contrato:** §3 FEAT-31 (`POST …/publish`, `POST …/duplicate`, `DELETE /lab/content/cards/:cardId`), sem mudança · **Spec:** v0.35 → v0.36 · **Data:** 2026-11-16

## Objetivo

Ligar ao formulário de carta do editor as ações de publicar (com confirmação), duplicar e excluir (com confirmação), usando os hooks `usePublishCard`, `useDuplicateCard` e `useDeleteCard` da T-20.

## Decisões (D-46)

- **Botões no formulário**, depois de "Salvar rascunho", sempre visíveis. Carta ainda não salva: os três desabilitados. "Publicar" só habilita em rascunho salvo sem alterações pendentes (critério do REQ-23). Qualquer pedido em curso desabilita todos os botões de envio.
- **Nome nos diálogos:** "Nome" ou "Título" (zona e eventos) da última versão salva, não do que está sendo digitado.
- **Diálogos** reusam o `ConfirmDialog` do editor (foco em "Cancelar", Esc cancela).
- **Duplicar** abre a cópia direto da resposta (novo ramo `copy` em `CardsSection`), sem `GET`, com "Cópia criada." já na área de status. Não pergunta por alterações não salvas: o REQ-24 não lista "Duplicar".
- **Excluir:** com sucesso, o formulário fecha e "Carta excluída." aparece na área de status da seção "Cartas" (o formulário deixou de existir); a lista é consultada de novo pela invalidação do hook.
- **Erros** de publicar/excluir aparecem no status do formulário; `CONTENT_INVALID` liga os textos aos campos, como no salvar.

## Passos e comandos

```
npx vitest run src/lab/editor/CardForm.test.tsx -t "REQ-23"   # vermelho: 9 falhas (botões ausentes)
# implementação
npm run typecheck
npx vitest run src/lab/editor
npm run format
npx playwright test tests/e2e/editor
```

## Arquivos

- Alterados: `src/lab/editor/CardForm.tsx` (botões, diálogos, `onDuplicated`/`onDeleted`, `OpenedCard.message`), `src/lab/editor/CardsSection.tsx` (abre a cópia, fecha após excluir, aviso "Carta excluída."), `src/lab/editor/CardForm.test.tsx` (+9 testes), `tests/e2e/editor/card-form.spec.ts` (+1), `docs/SPEC-FRONTEND.md`.

## Como verificar

`npm run dev` com mocks, `/lab/editor`, "Coleção de Teste" › "Nova carta" › "Atributo", preencha a carta "forca" e salve; "Publicar" › confirme → "Carta publicada."; "Duplicar" → "Cópia criada." com "forca-bruta-copia"; "Excluir carta" › "Excluir" → o formulário fecha e "Carta excluída." aparece na seção "Cartas".

## Checks

Guarda de `src/` limpa; `typecheck`, `lint`, `format:check` limpos. Unitários afetados: 83/83 (2 arquivos). E2E `tests/e2e/editor`: 12/12. `npm run test:build`: REQ-05 ok.

## Problemas

Nenhum. `CONTENT_IN_USE` não tem cenário no MSW (contrato: só na FEAT-06); é coberto só no unitário, com handler do próprio teste.

## Revisão

Revisão própria do diff contra a D-46 e o REQ-23 (tarefa só de tela, sem mudar a camada de cliente): cada critério tem teste; testes existentes não foram alterados.

## Backend

Nenhuma dependência nova. A validação contra o backend real vem depois da T-27.

## Commit sugerido

`feat/content editor publish duplicate delete`
