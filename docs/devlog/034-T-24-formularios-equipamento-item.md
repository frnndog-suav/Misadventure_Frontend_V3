# 034 — T-24: Formulários de equipamento e item

- **ID:** T-24 · **FEAT:** FEAT-31 · **REQ:** REQ-21 · **Decisões:** D-44 (molde da D-43) · **Contrato:** §3 FEAT-31 e FEAT-04 (`EquipmentCard`, `ItemCard`), sem mudança · **Spec:** v0.33 → v0.34 · **Data:** 2026-11-16

## Objetivo

Ligar os tipos equipamento e item ao formulário de carta do editor (T-23), com todos os campos do REQ-21, a sugestão de etiquetas da coleção e a pré-visualização já existente.

## Decisões (D-44)

- **Mesmo molde da D-43.** `cardFormValues.ts` ganhou `EquipmentForm` e `ItemForm` (números como texto, seleções `''`), `emptyForm`, `formFromCard` e `toInput` para os dois tipos; `hasForm` passou a aceitar `equipment` e `item`. Só os eventos continuam sem formulário (T-25).
- **Refino e Encantamento são caixas.** Ligadas, mostram os campos; desligadas, o corpo leva `null` e o que foi digitado fica guardado no estado.
- **"Principal"** marca o primeiro modificador (README 5.1, CONTRATO: o primeiro é o principal).
- **Formato, nunca regra.** Salvar fica desabilitado por número inválido, seleção vazia ou texto obrigatório em branco. Limites (nível 1 a 10, preço 0,8 a 1,5, escudo só em arma) são do backend (D-38).
- **Sugestão de etiquetas:** `useEditorCollection(collectionId).data?.tags` (mesma consulta da seção "Coleções", vem do cache) alimenta um `datalist` por campo de etiqueta.
- **Ajuste de preço** é campo de texto com ponto decimal, iniciado em "1".
- Rótulos de slot e categoria vêm de `src/ui/categories.ts`; os de modificador, do catálogo de termos; os de classe, de `playerClassLabels`.

## Passos e comandos

```
npx vitest run src/lab/editor/CardForm.test.tsx   # vermelho: formulário ausente (15 falhas)
# implementação
npx prettier --write src/lab/editor tests/e2e/editor
npx vitest run src/lab/editor
npx playwright test tests/e2e/editor
```

## Arquivos

- Alterados: `src/lab/editor/cardFormValues.ts`, `src/lab/editor/CardForm.tsx`, `src/lab/editor/CardForm.test.tsx` (+15 testes), `tests/e2e/editor/card-form.spec.ts` (+2), `docs/SPEC-FRONTEND.md`.
- Nenhum arquivo novo de código.

## Como verificar

`npm run dev` com mocks, abra `/lab/editor`, escolha "Coleção de Teste":
- clique em "Lâmina do Crepúsculo · Equipamento · Publicada": o formulário mostra os 2 modificadores (o primeiro "Principal"), "Refino" e "Encantamento" ligados, "Bloqueia escudo" marcado; as etiquetas sugerem "duas mãos", "espada" e "poção";
- "Nova carta" › "Item": "Salvar rascunho" só habilita com identificador, nome, raridade e categoria.

```
npx vitest run src/lab/editor
npx playwright test tests/e2e/editor
```

## Checks

Guarda de `src/`, `npm run typecheck`, `npm run lint` e `npm run format:check` limpos. `npx vitest run src/lab src/ui/cards`: 121/121 (10 arquivos); editor 66/66. E2E `tests/e2e/editor`: 9/9. `npm run test:build`: REQ-05 ok.

## Problemas

- O heredoc do Bash recusou blocos com aspas e `''`; os arquivos grandes foram escritos com a ferramenta Write, ou por arquivo temporário anexado com `cat >>`.
- `TextListField` deriva o caminho do erro de `path` (`effects` → `effects.{n}.text`; `tags` → `tags.{n}`), conforme o corpo enviado. É um atalho local; se aparecerem mais listas de texto, vale passar o caminho do item como parâmetro.

## Revisão

Revisão própria do diff contra a D-44 e o REQ-21 (tarefa só de tela): cada critério tem teste; sem regra do jogo no frontend; sem alteração de testes existentes.

## Backend

Nenhuma dependência nova. A FEAT-31 segue com MSW; a validação contra o backend real vem depois da T-27.

## Commit sugerido

`feat/content editor equipment item forms`
