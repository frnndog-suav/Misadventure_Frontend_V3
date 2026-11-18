# 068 — T-52: Cofre na tela do grupo e Vasculhar

- **ID:** T-52 · **FEAT:** FEAT-32 · **Contrato:** v0.47 (`implementado (BE)`) · **Spec:** v0.67 → v0.68 · **Data:** 2026-11-18

## Objetivo

REQ-50 (cofre, ouro do cofre e decks guardados na seção de cada membro, depois do "Inventário") e REQ-51 (grupo "Vasculhar" na região "A vez", com o resultado vindo de `lastScavenge`). Cliente e MSW já existiam desde a T-49.

## Decisões

- D-59 item 11: o MSW não tem estado (D-29), então doar a vara no `/lab` não muda o grupo que `/grupo/:id` abre (a sessão devolve sempre a fixture). Para o Vasculhar aparecer no dev, o MSW ganhou o grupo `party-com-vara` (o "Com F doado" em sessão, `id` como chave do cenário, como `party-sem-pontos` e `party-com-equipamento`). Alternativa descartada: estado no handler (proibido pela D-29). O "Como verificar" da T-52 na spec foi ajustado.
- "Cofre (…)" e "Decks guardados (…)" são `h3` + lista (como a D-58 item 7); cada deck é um item "Deck {n}" com a lista rotulada "Deck {n}".
- `inventoryFull` do Vasculhar tem texto próprio ("Não há espaço no inventário."), tratado fora do `reasonText` (que continua com o texto do Preparar). `notScavengeable` e outros motivos: só a `message`.
- `lastScavenge` `null` num `200` (fora do contrato): área de status vazia, em vez de inventar texto.

## Passos e arquivos

- `src/features/party/PartySession.tsx`: `cardIdsOf` inclui slots e decks do cofre, `scavengeTargets` e `lastScavenge`; `MemberState` mostra o cofre; `TurnState` ganha o grupo "Vasculhar" (botões desabilitados durante qualquer ação); mensagens de status do Vasculhar.
- `src/mocks/partyFixtures.ts`: `partyFishingRodInSessionFixture` (`party-com-vara`).
- `src/mocks/handlers.ts`: `party-com-vara` em `knownParty`, `GET /parties/:id` e `POST …/session`.
- `src/features/party/PartySession.test.tsx`: 3 testes REQ-50 e 7 REQ-51.
- `tests/e2e/party/party-session.spec.ts`: 2 e2e (cofre vazio e ausência do grupo em `party-os-teimosos`; vasculhar em `party-com-vara`).

## Como verificar

`npm run dev` com mocks, abrir `/grupo/party-com-vara`: na região "A vez", o grupo "Vasculhar" com "Vasculhar Peixe Prateado"; clicar mostra "Você achou Peixe Prateado.", 2 pontos de ação e o peixe no inventário. Na seção "Lia": "Cofre (0 de 30 slots)", "Cofre vazio.", "Ouro no cofre 0 (capacidade 2000)", "Nenhum deck guardado.".

## Problemas

- De novo um Vite na 5173 sem MSW (`vite --port 5173 --strictPort`, não aberto pelo agente): o Playwright o reaproveitou e os e2e caíram com "Servidor indisponível". Rodaram com uma config temporária na raiz (`pw.tmp.config.ts`, porta 5174, `reuseExistingServer: false`), apagada depois:
  `npx playwright test -c pw.tmp.config.ts tests/e2e/party --reporter=line`
- `getByText('2 pontos de ação')` não acha o texto porque o `Term` o divide; o teste confere o texto da região "A vez".

## Checks

Guarda, typecheck, lint e format verdes; `vitest related` em `PartySession.tsx`, `handlers.ts` e `partyFixtures.ts`: 566/566 (21 arquivos); e2e `party` 21/21; `test:build` ok. Revisão própria do diff (tarefa só de tela; o MSW só ganhou uma fixture).

## Backend

Nenhuma ação: contrato `implementado (BE)`. Validação contra o backend real depois da T-53.

## Commit sugerido

`feat/t-52 feat-32 vault and scavenge on party screen`
