# 035 — T-25: Formulários de evento aleatório e de combate

- **ID:** T-25 · **FEAT:** FEAT-31 · **REQ:** REQ-21 (e REQ-22 na pré-visualização) · **Decisões:** D-45 (molde da D-43) · **Contrato:** §3 FEAT-04 (`RandomEventCard`, `CombatEventCard`, `Enemy`) e FEAT-31, sem mudança · **Spec:** v0.34 → v0.35 · **Data:** 2026-11-16

## Objetivo

Ligar os dois tipos de evento ao formulário de carta do editor, com a lista de inimigos do evento de combate. Com isso os seis tipos de carta têm formulário.

## Decisões (D-45)

- **Mesmo molde da D-43/D-44.** `cardFormValues.ts` ganhou `RandomEventForm`, `CombatEventForm` e `EnemyForm` (números como texto, seleções `''`), com `emptyForm`, `formFromCard` e `toInput` para os dois tipos.
- **Limpeza:** como todos os tipos têm formulário, saíram `hasForm`, o tipo `FormCardType` e o retorno `null` de `formFromCard` (e os desvios correspondentes em `CardsSection.tsx` e em `CardForm.tsx`).
- **Rótulos únicos por inimigo:** cada campo leva o sufixo " do inimigo {n}" ("Nome do inimigo 1", "Ataque do inimigo 1", "Nome da habilidade 1 do inimigo 1"), para nomes acessíveis sem repetição quando há vários inimigos.
- **"Elemento"** usa a opção vazia "Sem elemento" (= `null`); por isso o `SelectField` ganhou o parâmetro `emptyLabel` (padrão "Escolha…"). **"Vigor"** vazio = `null`.
- **Inimigo novo** começa com quantidade "1" e os 7 modificadores "0"; o resto vazio. É conveniência de preenchimento, não regra: o backend confere.
- **Formato, nunca regra.** Listas vazias (requisitos, inimigos, tipos do inimigo) não bloqueiam "Salvar rascunho": o mínimo de 1 é do contrato e volta como `CONTENT_INVALID` (D-38); a pré-visualização mostra o aviso enquanto a carta não passa no schema.
- **Caminhos de erro:** `requirements.{n}.text`, `goodOutcome.text`, `badOutcome.text`, `enemies.{n}.<campo>`, `enemies.{n}.modifiers.<modificador>`, `enemies.{n}.abilities.{j}.name|text`. O `TextListField` passou a usar a lista `ruleTextLists` (`effects`, `requirements`) para decidir o sufixo `.text`, em vez da comparação só com `effects`.

## Passos e comandos

```
npx vitest run src/lab/editor/CardForm.test.tsx   # vermelho: 8 falhas (formulário ausente)
# implementação
npx prettier --write src/lab/editor tests/e2e/editor
npm run typecheck
npx vitest run src/lab/editor
npx playwright test tests/e2e/editor
```

## Arquivos

- Alterados: `src/lab/editor/cardFormValues.ts`, `src/lab/editor/CardForm.tsx`, `src/lab/editor/CardsSection.tsx`, `src/lab/editor/CardForm.test.tsx` (+8 testes), `tests/e2e/editor/card-form.spec.ts` (+2), `docs/SPEC-FRONTEND.md`.
- Nenhum arquivo novo de código.

## Como verificar

`npm run dev` com mocks, abra `/lab/editor`, escolha "Coleção de Teste":
- "Lobos Uivantes · Evento de combate · Publicada": o formulário mostra "Nome do inimigo 1" = "Lobo Cinzento", "Quantidade do inimigo 1" = 2, "Fera" marcada em "Tipos do inimigo 1", "Elemento do inimigo 1" = "Sem elemento", "Celeridade do inimigo 1" = 3;
- "Viajante Ferido · Evento aleatório · Publicada": "Requisito 1" = "Possuir uma Poção de Cura.", "Sem fuga" desmarcada;
- "Nova carta" › "Evento de combate": com título, coisa boa e coisa ruim, "Salvar rascunho" habilita; ao "Adicionar" um inimigo, desabilita até nome, criatura, categoria, vida e comportamento.

```
npx vitest run src/lab/editor
npx playwright test tests/e2e/editor
```

## Checks

Guarda de `src/` limpa, `npm run typecheck`, `npm run lint` e `npm run format:check` limpos. `npx vitest run src/lab src/ui/cards`: 129/129 (10 arquivos); editor 74/74. E2E `tests/e2e/editor`: 11/11. `npm run test:build`: REQ-05 ok.

## Problemas

- Como na T-24, o heredoc do Bash recusou blocos com aspas; os testes novos foram escritos em arquivos temporários (scratchpad) e anexados com `cat >>`.
- O `Element` do DOM sombreia o tipo `Element` do contrato se o import faltar; o import explícito de `../../api/catalog` resolve.

## Revisão

Revisão própria do diff contra a D-45 e o REQ-21 (tarefa só de tela): cada critério tem teste; sem regra do jogo no frontend; testes existentes não foram alterados.

## Backend

Nenhuma dependência nova. A FEAT-31 segue com MSW; a validação contra o backend real vem depois da T-27.

## Commit sugerido

`feat/content editor event forms`
