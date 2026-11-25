# 110 — T-80, cliente e fixtures MSW da montaria (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-82 a REQ-89, D-64 item 8; spec v0.98
- Horas — a preencher

## Entrega

- Schemas nos módulos existentes. `vocabulary.ts`: `mount` em `CardType` e `ReceiveSpace`. `catalog.ts`: `MountCard`, `market.mounts` e `cardCounts.mount`. `effects.ts`: ativação `loseMount` e `source: 'mount'`. `combat.ts`: habilidade com `equipmentSlot` **ou** `mountAbility`, origens `mount`/`mountAbility` e `AbilitySource`. `randomEvents.ts`: destino `ReceiveSpace`, `space` no descarte e no `keep`, `lastRewardDelivery.space`. `market.ts`: `stable`, `buyMount`/`sellMount`, destinos da montaria e `received`. `parties.ts`: `mount`, `moveRoutes`, `viaZoneId`, `transferMount`, `mountInventory` no Vasculhar e 4 motivos novos. `labConfig.ts`: 7 chaves. `labGrant.ts`: `mountAlreadyOwned`.
- Valores legados com `.default()` (D-64 item 8).
- Exigidos pelo tipo (padrão D-62 item 8): textos do REQ-87/88 onde um `switch` pedia, motivos só com a `message`, `mountAbility`/`space` no envio, rótulos do laboratório, a carta de montaria provisória e o editor só transportando os campos (o tipo `mount` fica fora das listas do editor até a T-81).
- MSW: `src/mocks/mountFixtures.ts` (novo) com `party-estabulo` e `party-montaria`, e a tabela de respostas (`mountAction`, `mountGrant`) chamada antes das tabelas antigas. A `fixture` ganhou `fixture.plow-horse` e `fixture.war-pony` (31 cartas, `mount: 2`). A Mina Velha virou Rural com Estábulo e o Porto Cinzento ganhou `mounts: []`. As fixtures existentes ganharam os campos novos (`space`, `received`, `stable`, `mountAbility`, `mount`, `moveRoutes`).

## Verificação

- `src/api/mount.test.tsx`: 38 testes. Os 38 falharam pelo motivo certo antes da implementação; no fim, 38/38.
- Testes antigos alinhados à fixture da v0.90: 31 cartas, `mount: 2`, `received`, `space` no `keep` e `moveRoutes`/`mount` no estado inicial. No catálogo do laboratório, as cartas de montaria saíram do `it.each` até a T-81. O e2e do catálogo passou a contar 31 cartas.
- Unitários 1108/1108. Tipos, lint, guarda, `format:check` e `test:build` verdes.
- E2E com MSW (`lab`, `editor`, `party`): 68 de 70. Rodaram num servidor separado na porta 5174, com uma config temporária, porque havia um servidor de dev do autor na 5173 com `VITE_USE_MOCKS=false`. As 2 falhas já existiam no `HEAD` (conferido com `git stash`): `editor/cards.spec.ts` (o "Nova carta" espera 7 tipos e a tela mostra 8) e `editor/card-form.spec.ts:144` ("Coisa boa" ambíguo). São as mesmas do devlog 104.
- Revisão `spec-reviewer`: aprovado, sem bloqueantes.

## Problemas

- O 400 de `useAbility` com os dois campos ou nenhum: o detalhe (`field`/`reason`) não está no contrato. O MSW usa um exemplo, e o pedido vai ao backend na T-87.
- Os e2e do editor que já falhavam no `HEAD` continuam fora do escopo.

## Backend

Nenhuma dependência nesta tarefa.

## Commit sugerido

`feat/t-80 feat-18 mount client and msw fixtures`
