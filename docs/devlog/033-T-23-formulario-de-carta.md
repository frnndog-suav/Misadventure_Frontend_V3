# 033 — T-23: Formulário de carta (base, zona e atributo)

- **ID:** T-23 · **FEAT:** FEAT-31 · **REQ:** REQ-21, REQ-22, REQ-24 · **Decisões:** D-38, D-39, D-41, D-42, D-43 · **Contrato:** §3 FEAT-31 e FEAT-04 (`Card`), sem mudança · **Spec:** v0.32 → v0.33 · **Data:** 2026-11-16

## Objetivo

Ligar a escolha da seção "Cartas" (D-42) a um formulário de carta. A tarefa entrega a estrutura comum (identificador, situação, listas com Adicionar/Remover/Subir/Descer, erros por caminho de campo, "Salvar rascunho", guarda de alterações não salvas), os campos de zona e de atributo e a seção "Pré-visualização", que monta a carta com os componentes do catálogo.

## Decisões (D-43)

- **Modelo separado da tela.** `src/lab/editor/cardFormValues.ts` guarda os valores no formato do formulário: números como texto e seleções com `''` enquanto nada foi escolhido. `toInput` monta o `CardInput` ou devolve `null` quando falta formato (texto obrigatório em branco, seleção vazia ou número inválido). Com `null`, "Salvar rascunho" fica desabilitado. Nenhuma regra entra aqui: limites e combinações são do backend.
- **Pré-visualização = formato do contrato.** A carta montada (`<collectionId>.<slug>`) passa pelo `cardSchema` (D-39). Se falhar, aparece "Preencha os campos obrigatórios para ver a carta.". Exemplo: setas fora de 1 a 4.
- **Caminhos de erro = caminhos do corpo enviado** (`effects.1.text`, `attributes.0`). O texto aparece abaixo do campo ou do grupo, ligado por `aria-describedby` (D-38).
- **Estado próprio do formulário.** Depois de salvar, o formulário mostra a carta devolvida sem recarregar. `CardsSection` guarda a escolha aberta (`opened` + `formKey`) separada da marcação da lista (`selection`). Por isso renomear um rascunho não remonta o formulário.
- **Uma guarda só.** O `useBlocker` do React Router aceita um bloqueio por roteador. O único `useUnsavedGuard` fica em `CollectionsSection`, com sujo = coleção **ou** carta. A seção "Cartas" recebe `guard` (usado em "Nova carta" e na troca de carta) e `onDirtyChange`.
- `FullCard` saiu de `src/lab/CatalogSection.tsx` para `src/ui/cards/FullCard.tsx`, porque agora o catálogo e a pré-visualização usam o mesmo componente.
- Equipamento, item e eventos continuam só com a escolha até a T-24/T-25.

## Arquivos

- Novos: `src/lab/editor/CardForm.tsx`, `src/lab/editor/cardFormValues.ts`, `src/lab/editor/CardForm.test.tsx` (18 testes), `src/ui/cards/FullCard.tsx`, `tests/e2e/editor/card-form.spec.ts` (3 testes).
- Alterados: `src/lab/editor/CardsSection.tsx`, `src/lab/editor/CollectionsSection.tsx`, `src/lab/CatalogSection.tsx`, `docs/SPEC-FRONTEND.md`.

## Como verificar

Rode `npm run dev` com mocks ligados e abra `/lab/editor`. Clique em "Coleção de Teste" e depois em "Força · Atributo · Publicada": abre a seção "Carta", com "Identificador" somente leitura, e ao lado a "Pré-visualização" com a carta.

```
npx vitest run src/lab/editor src/lab/CatalogSection.test.tsx
npx playwright test tests/e2e/editor tests/e2e/lab
```

## Checks

`node .claude/hooks/client-guard.mjs --all`, `npm run typecheck`, `npm run lint` e `npm run format:check` passaram limpos. `npx vitest run src/lab src/ui/cards` deu 106/106 (10 arquivos). No e2e, `tests/e2e/editor` deu 7/7 e `tests/e2e/lab` deu 5/5. `npm run test:build` deu REQ-05 ok.

## Problemas

- No Windows, `CardForm.tsx` e `cardForm.ts` diferem só na caixa, e o `tsc` confundiu os dois (TS1261). Solução: o modelo passou a se chamar `cardFormValues.ts`.
- Nos testes, `within(form())` guardava a seção "Carregando carta…", que depois é trocada pelo formulário. A busca ficava presa no elemento já desmontado. Solução: esperar com `screen.findByLabelText`.
- O teste do erro em lista usava o caminho `effects.1`. O campo é `effects.1.text`, como no corpo enviado (o contrato usa o mesmo padrão, ex.: `modifiers.1.value`). O caminho do teste foi corrigido.
- No Playwright, o nome acessível casa por substring: "Carta" também pegava "Cartas", e "Nome" pegava "Buscar por nome". Solução: `exact: true`.

## Revisão

Revisão do agente `spec-reviewer`: aprovado, sem bloqueantes. Um ajuste foi aplicado: depois de "Descartar", "Nova carta" fecha o formulário aberto, com teste no REQ-24 e frase na D-43. Os demais pontos não bloqueantes ficaram como estão. São eles: o teste de "outra coleção" com a carta suja (a `fixture` é a única coleção do MSW), a opção "Escolha…" na polaridade, `key={index}` nas listas e o cast do mapa de atributos. Depois do ajuste: tipos e lint limpos, unitários do editor 51/51, e2e do editor 7/7.

## Backend

Nenhuma dependência nova. A FEAT-31 continua com MSW; a validação contra o backend real vem depois da T-27.

## Commit sugerido

`feat/content editor card form`
