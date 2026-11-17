# 052 — T-39: A vez e Encerrar a vez

- **ID:** T-39 · **FEAT:** FEAT-08 · **REQs:** REQ-36, REQ-38 (e REQ-37 item 2) · **Decisão:** D-56 item 6 · **Contrato:** v0.33 (`implementado (BE)`) · **Spec:** 0.51 → 0.52 · **Data:** 2026-11-17

## Objetivo

Tela do grupo mostra a vez (rodada, membro da vez, pontos de ação) e oferece "Encerrar a vez".

## Decisões

- Termo `actionPoints` no catálogo (`src/ui/terms.ts`), tooltip aprovado pelo autor: "O que o jogador pode gastar na vez com ações de zona, como Movimentar. Renovam a cada vez."
- `Term` ganhou `label` opcional para a flexão ("1 ponto de ação"); sem `label`, mostra o nome do catálogo como antes.
- O botão "Encerrar a vez" já depende de `endTurn` em `availableActions` (REQ-37 item 2): a T-39 cria o botão, então nasce alinhado. O resto do REQ-37 (Movimentar e o aviso de 0 pontos) fica na T-40.
- A mensagem de status do `200` usa o tipo da ação enviada (`action.variables.type`): `endTurn` → "Rodada {round}: vez de {characterName}."; `move` → "Você está em {title}." (inalterado).
- "Encerrar a vez" e "Movimentar" compartilham a mesma mutação, então ficam desabilitados juntos durante o pedido.

## Arquivos

- `src/features/party/PartySession.tsx` (região `TurnState`, `onEndTurn`, status).
- `src/ui/Term.tsx`, `src/ui/terms.ts`.
- `src/features/party/PartySession.test.tsx` (+8), `src/ui/Term.test.tsx` (+1, catálogo com `actionPoints`), `tests/e2e/party/party-session.spec.ts` (+1).
- `docs/SPEC-FRONTEND.md` (T-39 `[x]`, 0.52, D-56 item 6; cabeçalho de versão corrigido de 0.50).

## Como verificar

`npm run dev` (mocks) → `/grupo/party-os-teimosos` → região "A vez" com "Rodada 1", "Vez de Lia", "3 pontos de ação" → "Encerrar a vez" → status "Rodada 2: vez de Lia.".
`npx vitest related --run src/features/party/PartySession.tsx src/ui/Term.tsx`; `npx playwright test tests/e2e/party`.

## Problemas

- O cabeçalho da spec estava em 0.50 apesar do histórico em 0.51; corrigido para 0.52.

## Checks

Unitários afetados: 286/286. E2E `party`: 10/10. Guarda, `typecheck`, `lint`, `format:check`, `test:build`: verdes.

## Backend

Sem pendência nesta tarefa; a validação contra o backend real vem depois da T-40.

## Commit sugerido

`feat/feat-08 turn region and end turn`
