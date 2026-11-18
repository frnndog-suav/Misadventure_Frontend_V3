# 062 — T-47: Preparar

- **ID:** T-47 · **FEAT:** FEAT-10 · **REQs:** REQ-45 · **Decisão:** D-58 (item 8 novo) · **Contrato:** v0.41 (`implementado (BE)`) · **Spec:** 0.61 → 0.62 · **Data:** 2026-11-17

## Objetivo

Botões "Equipar {nome}" (slot do inventário com carta de equipamento) e "Guardar {nome}" (categoria ocupada) na seção do host em `/grupo/:partyId` quando `availableActions` tem `prepare`; envio de `{ type: 'prepare', operation: 'equip', cardId }` / `{ ..., operation: 'unequip', slot }`; mensagens "Equipou {nome}." / "Guardou {nome}." e recusas por motivo na área de status (REQ-45).

## Decisões

- Botões dentro do item da lista (`li`) de "Inventário" e "Equipamentos". Isso muda o texto do item, então os testes do REQ-44 foram alinhados: no unitário, o grupo do caso passa sem `prepare`; no e2e, `toHaveText` → `toContainText`. Pergunta feita ao autor (2026-11-17), que escolheu alinhar o teste; alternativa descartada: botões num grupo fora da lista (D-58 item 8).
- "Equipar" só aparece se a carta do catálogo é `type === 'equipment'` (dado de exibição, D-58 item 1). Os pontos de ação não desabilitam nada; só o pedido em curso (`action.isPending`) desabilita todos os botões de ação.
- {nome} das mensagens: id da carta guardado no clique (`preparedCardId`), pois no "Guardar" a carta sai do slot e o pedido só leva `slot`.
- Textos dos 4 motivos do Preparar entraram no `reasonText` (antes vazios desde a T-45); `adjustErrorText` virou `refusalText(error, name)`, usado pelo "Ajustar deck" (nome de `details.cardId`) e pelo Preparar (nome da carta do pedido).
- **Defeito achado pelo e2e:** `party = action.data ?? start.data`; um novo `mutate` zera `action.data`, então uma recusa depois de um sucesso fazia a tela voltar ao `Party` da abertura (violava "nada muda"; também valia para o REQ-35). Correção: a tela guarda o último `Party` devolvido com sucesso (`lastActionParty`, atualizado durante a renderização) e usa `action.data ?? lastActionParty ?? start.data`. Teste unitário novo cobre o caso.

## Arquivos

- `src/features/party/PartySession.tsx` (`PrepareControls`, botões em `MemberState`, `reasonText`/`refusalText`, `preparedCardId`, `lastActionParty`, status do `prepare`).
- Testes: `src/features/party/PartySession.test.tsx` (14 casos REQ-45; REQ-44 alinhado), `tests/e2e/party/party-session.spec.ts` (1 caso REQ-45; REQ-44 alinhado).
- `docs/SPEC-FRONTEND.md` (T-47 `[x]`, D-58 item 8, 0.62; cabeçalho que ficara em 0.60 na T-46 corrigido).

## Como verificar

```
npx vitest related --run src/features/party/PartySession.tsx
npx playwright test tests/e2e/party
```

Com `npm run dev` (mocks), em `/grupo/party-com-equipamento`, seção "Lia": botões "Equipar" para Lâmina do Crepúsculo, Escudo de Carvalho, Elmo de Ferro e Varinha Arcana (não para a Poção de Cura). "Equipar Elmo de Ferro" → status "Esta ação não é permitida agora. Seu Pico não alcança o requisito de Elmo de Ferro."; "Equipar Lâmina do Crepúsculo" → "Equipou Lâmina do Crepúsculo." e "Arma: Lâmina do Crepúsculo" com "Guardar Lâmina do Crepúsculo"; depois "Equipar Escudo de Carvalho" → "… A arma em uso não deixa usar escudo." e a arma continua; "Guardar …" → "Guardou Lâmina do Crepúsculo." e "Arma: vazio".

## Problemas

- Heredoc grande no Git Bash falhou (`unexpected EOF`) e `python` não existe; testes e spec foram editados com a ferramenta de edição.
- O e2e revelou o defeito do `action.data` zerado (acima).

## Checks

- Guarda, `tsc -b`, `lint`, `format:check`: verdes. Unitários afetados: 142/142 (4 arquivos). E2E `party`: 19/19. `test:build`: laboratório fora do release.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-48.

## Commit sugerido

`feat/feat-10 prepare equip and unequip on party screen`
