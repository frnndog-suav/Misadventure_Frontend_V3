# 067 — T-51: Editor — ferramentas e decks de recompensas

- **ID:** T-51 · **FEAT:** FEAT-32 · **Contrato:** v0.47 (`implementado (BE)`) · **Spec:** v0.66 → v0.67 · **Data:** 2026-11-18

## Objetivo

REQ-49: os campos da FEAT-32 nos formulários do editor (`/lab/editor`). Os valores do formulário (`cardFormValues.ts`) já tinham entrado na T-49; faltavam os campos na tela.

## Decisões

- D-59 item 10: dentro de "Decks de recompensas" os rótulos levam o número do deck, como os do inimigo (D-45): "Tipo de zona do deck {n}", lista "Cartas do deck {n}", "Carta {j} do deck {n}", "Cópias da carta {j} do deck {n}". Sem isso, dois decks teriam campos com o mesmo nome acessível.
- Deck novo: sem tipo e sem cartas. Carta nova: id e cópias vazios (o formato exige os dois para salvar). Alternativa descartada: cópias começando em 1 (mais prático, mas é suposição; o REQ não pede).
- "Vasculha em" segue a ordem do glossário (`zoneTypeSchema.options`), e o corpo também.

## Passos e arquivos

- `src/lab/editor/CardForm.tsx`: item ganha "Tipo de ferramenta", "Vasculha em" (16 caixas) e "Coletada com" depois de "Efeitos"; equipamento ganha "Coletada com" depois de "Ajuste de preço"; Carta de Dimensão ganha a lista "Decks de recompensas" com a sublista "Cartas do deck {n}" (o `ListField` existente, com "Adicionar", "Remover", "Subir", "Descer").
- `src/lab/editor/CardForm.test.tsx`: 8 testes REQ-49 (ordem, valores recebidos, corpo enviado, formato, erros pelo caminho, pré-visualização).
- `tests/e2e/editor/card-form.spec.ts`: 1 e2e REQ-49.

## Como verificar

`npm run dev` com mocks, `/lab/editor`, "Coleção de Teste": "Vara de Pesca" mostra "Tipo de ferramenta" = `fishing-rod` e Costeira, Lacustre, Fluvial, Urbana marcadas; a pré-visualização mostra "Ferramenta: fishing-rod". "Dimensão de Teste" mostra "Decks de recompensas" com o deck 1 (Urbana) e 3 cartas.

## Problemas

- Outra vez um Vite na 5173 sem MSW: o Playwright o reaproveitou e 19 e2e caíram por timeout. Rodaram com uma config temporária na porta 5174 (`VITE_USE_MOCKS=true`, `reuseExistingServer: false`), apagada depois.
- O `getByLabel` do Playwright casa por substring: "Carta 1 do deck 1" achava também "Cópias da carta 1 do deck 1". O e2e usa `exact: true`.

## Checks

Guarda, typecheck, lint e format verdes; `vitest related` em `CardForm.tsx`: 137/137 (4 arquivos); e2e `editor` 20/20; `test:build` ok. Revisão própria do diff (tarefa só de tela).

## Backend

Nenhuma ação: contrato `implementado (BE)`. Validação contra o backend real depois da T-53.

## Commit sugerido

`feat/t-51 feat-32 editor tools and reward decks`
