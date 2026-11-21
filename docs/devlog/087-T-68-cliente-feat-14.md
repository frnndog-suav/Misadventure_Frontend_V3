# 087 — T-68, cliente e fixtures MSW da FEAT-14

- Data — 2026-11-21
- Status — concluída com MSW
- Contrato — v0.69, FEAT-14 acordada
- Spec — REQ-63 a REQ-65
- Horas — null

## Entrega

- `src/api/parties.ts` aceita `saveRespawnPoint` pelo cliente de ações existente e preserva o resumo `lastKnockout` e a marca `skipNextTurn` das respostas. Snapshots sem esses campos recebem `null` e `false`.
- `src/api/labConfig.ts` aceita cinco ajustes de nocaute em valores, padrões e limites. A leitura de respostas antigas preenche as chaves ausentes. `src/lab/LabPage.tsx` mantém a lista de campos da tela até a etapa de interface.
- `src/mocks/knockoutFixtures.ts` e `src/mocks/handlers.ts` projetam snapshots determinísticos de duas Urbanas conectadas, recusas, derrota, doação fatal, vitória por Reflexão, escolha pendente e reabertura. A derrota de save legado usa os saldos com o desfecho já aplicado. `src/mocks/fixtures.ts`, `partyFixtures.ts`, `catalogFixtures.ts` e `combatFixtures.ts` fornecem os dados de apoio.
- `src/api/knockout.test.ts` cobre os três requisitos. As expectativas de projeção em `inventory.test.tsx`, `vault.test.tsx` e `preparation.test.tsx` acompanham os campos e a ação da v0.69.

## Verificação

Os cinco testes iniciais falharam como esperado. Os grupos novos retornavam `PARTY_NOT_FOUND` e os ajustes de laboratório estavam ausentes após a leitura. A ampliação de cobertura também confirmou a ausência inicial do save legado e da variante de duração.

- REQ-63 — o primeiro GET apresenta Porto Cinzento como zona inicial e ponto salvo. Mover para a segunda Urbana deixa 2 PA. Salvar gasta 1 PA, persiste o ponto e repetir gasta o último PA. Em não Urbana, com 0 PA ou com `zoneId` extra, a resposta usa a recusa prevista e o save permanece igual.
- REQ-64 — a doação fatal preserva os recibos e projeta respawn com 2/21 PV, Pico 8, Vigor 4, bolsa 29, cofre 80 e rodada 8 com 3 PA. A cura comum no desfecho mantém o jogador caído enquanto houver escolha. A Reflexão fatal preserva a vitória durante a escolha ou entrega a recompensa junto com o respawn quando há espaço. A variante de passagem de tempo expira o status e projeta a habilidade disponível na rodada 8. Reabrir a derrota legada preserva o ID e os saldos.
- REQ-65 — GET, PATCH e reset percorrem os valores de nocaute. O PATCH com vida percentual zero e espera fracionária retorna os dois erros e preserva a configuração.

A suíte afetada passou com 361 testes. `npm run typecheck`, `npm run lint` e `git diff --check` passaram. A suíte completa teve 853 aprovações e duas falhas, em REQ-20 (busca do editor) e REQ-33 (importação). As mesmas falhas foram reproduzidas em uma cópia limpa de `HEAD`.

As telas de grupo e laboratório e a validação contra a API real ficam para etapas posteriores da FEAT-14. A validação real de nocaute em grupo depende das FEATs 20 e 22.
