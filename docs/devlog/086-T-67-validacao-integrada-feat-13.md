# 086 — T-67, preparação da validação integrada da FEAT-13

- Data — 2026-11-21
- Status — validação parcial contra a API real
- Contrato — v0.65, implementado (BE)
- Roadmap — v0.63
- Horas — null

Retomada do registro 085. As cópias completas de `docs/CONTRATO.md` e `docs/ROADMAP.md` vieram do backend. Os hashes conferem com os originais. O ambiente local de desenvolvimento desliga o MSW e aponta para `http://localhost:3333`, URL confirmada pelo autor.

A validação usa os cenários determinísticos da FEAT-13 no contrato e o roteiro HTTP do devlog 058 do backend. A recarga deve preservar o turno e a escolha disparada sem repetir as transições do POST. O ataque com turno obsoleto deve retornar 409 com `staleCombatTurn` e preservar snapshot, RNG e `savedAt`, inclusive quando o alvo também já caiu. Após vitória com Reflexão fatal e inventário cheio, a reabertura deve conservar a escolha de recompensa e permitir a entrega apesar da queda.

`git diff --check` passou.

## Rodada integrada

Chrome via Playwright, com o frontend Vite em localhost:5173. As interações passaram pela tela de grupo e foram conferidas com as respostas da API real.

| Cenário | Resultado observado |
| --- | --- |
| Efeito disparado | Iniciar e revelar abriu escolha no turno inimigo. Recarregar preservou os IDs da escolha, do efeito e do turno. Pagar descontou 1 ouro e retornou, em ordem, ativação, dano inimigo e início do turno da jogadora. |
| Combate ativo e recusa | O primeiro lobo caiu e a recarga preservou o combate e projetou somente o segundo como alvo. O reenvio do primeiro ataque devolveu HTTP 409 com motivo `staleCombatTurn`. O GET inteiro, incluindo `savedAt`, permaneceu igual. O ataque com o turno atual foi aceito. |
| Reflexão fatal e recompensa | A vitória deixou a jogadora com 0 PV e somente `resolveReward` disponível. A recompensa de minério manteve seu ID após recarregar, encerrar e reabrir a sessão. Manter descartou uma cópia de peixe e entregou uma de minério. O GET final confirmou a queda, a ausência de recompensa pendente e a lista de ações vazia. |

Sem divergências funcionais nos cenários executados. Os dois lobos apareciam com o mesmo rótulo; a ordem dos controles e os IDs enviados permitiram conferir o alvo. Nesta primeira rodada, a verificação direta do RNG após recusa ficou pendente. A T-67 permanece aberta.

## Evidência do backend e próxima rodada

O devlog 058 registra a aprovação do e2e REQ-123. O teste lê a linha inteira de `parties` antes e depois do HTTP 409 `staleCombatTurn` e exige igualdade, incluindo `state.rngState` e `savedAt`. Na campanha integrada, o GET confirmou a igualdade do snapshot público e de `savedAt`. Como a matriz do contrato também exige preservar o RNG, falta repetir a recusa em um save reconstituído e coordenar com o autor uma leitura da linha no PostgreSQL imediatamente antes e depois do POST, sem ações aceitas entre as leituras. Espera-se igualdade dos valores capturados.

| Dados para a próxima rodada | Cenários pendentes do CONTRATO v0.65 |
| --- | --- |
| Saves legados v8 com encontro aberto, descarte e ocorrências de combate repetidas | Revelação em deck misto e com pilha de compra vazia, aprovada nas duas variantes (ver abaixo). |
| Campanhas com configuração de combate determinística | Empate e mudança de Celeridade, habilidade paga com 0 PA e recarga, habilitação de Preparar com 0 PA e bloqueio após pagamento, custos automáticos e seleção de mão, slot e recursos. |
| Conteúdo e campanhas com casos de borda | Variantes de catálogo e restrição de classe, vitória e derrota imediatas, Área e Precisão zero com elemento e Reflexão, suporte e Canalizada, fuga falha e limite em Sem fuga, derrota com desfecho aplicado uma vez. |
| Saves equivalentes para escolhas de efeitos | Pagar e recusar na antecipação, ordem entre automático e opcional, pagamento inválido e reenvio de escolha consumida. |


A API na porta 3333 respondeu HTTP 200 à consulta de disponibilidade. Os dois saves já exercitados não foram alterados nesta etapa. A próxima rodada depende dos dados acima. Nenhum cenário novo foi executado.

## Recusa por turno obsoleto — aprovada

Na campanha `cf2d7906-0fb3-4879-97cb-328f75021de5`, o Chrome com MSW desligado exibiu apenas o segundo lobo como alvo, no turno `turn:2:0`. Após o autor confirmar a leitura inicial do PostgreSQL, o ataque original foi reenviado uma vez com `turn:1:0` e o primeiro lobo como alvo. A API retornou HTTP 409, código `ACTION_NOT_ALLOWED` e motivo `staleCombatTurn`. Nenhuma outra ação ocorreu entre as leituras.

O autor confirmou no devlog 058 do backend que o SHA-256 da linha inteira, `state.rngState` (`[0, 90, 20971531, 12]`) e `savedAt` (`2026-11-21T17:10:01.091Z`) coincidiram antes e depois da recusa. A campanha está liberada para novas ações. A T-67 continua aberta para os demais cenários da matriz.

## Saves legados v8 — aprovados

Chrome via Playwright, frontend em `localhost:5173`, MSW desligado e API v0.65 em `localhost:3333`. Nos dois saves, abrir e recarregar a página manteve Viajante Ferido visível na fase `encounter`, com o mesmo ID de encontro e o mesmo snapshot público completo. Desistir, iniciar evento e revelar retornaram HTTP 200 em ambas as variantes.

| Variante | Save | Primeira revelação após a desistência |
| --- | --- | --- |
| Deck misto | `f739c4d8-18e9-4090-89f1-968623044dd3` | `fixture.t67-traveler-reserve` permaneceu no topo e apareceu na fase `encounter`. |
| Pilha de compra vazia | `6a2e39f1-940a-4631-95a2-1134be32e2a0` | `combat.card.id` retornou `fixture.howling-wolves`, com dois inimigos. A revelação é compatível com a inclusão antes da reciclagem do descarte. |

A asserção automatizada da variante vazia procurou o ID em `combat.cardId` e falhou. Um GET posterior confirmou o valor em `combat.card.id`. A variante abriu o combate na janela `prepare`, antes de qualquer ataque.

O autor confirmou as duas variantes no PostgreSQL e registrou a aprovação no [devlog 058 do backend](../../../Misadventure_Backend_V3/docs/devlog/058-T-49-save-e-http-de-combate.md). No deck misto, restaram dois `fixture.howling-wolves` na pilha urbana, do topo ao fundo. Na variante com pilha vazia, restou um. Nos dois saves, o descarte urbano ficou na ordem `fixture.t67-traveler-reserve`, `fixture.wounded-traveler`, e o estado foi persistido no formato v9. O RNG ficou em `[0, 0, 0, 10]` nos dois saves, desde a preparação até a leitura final. A perda fixa de ouro, a inclusão dos lobos e a retirada da primeira carta elegível ocorreram sem sorteios nem reciclagem.

O cenário v8 está fechado. A T-67 segue aberta e aguarda as fixtures dos demais cenários da matriz, começando por empate e mudança de Celeridade.

## Empate e mudança de Celeridade — aprovados

Chrome via Playwright em `localhost:5173`, com MSW desligado e respostas HTTP 200 da API real em `localhost:3333`. Em ambas as campanhas, a abertura da sessão, o início e a revelação do evento e o encerramento do turno passaram. Os dois lobos vieram com IDs distintos em `combatStarted`. A sequência de `combatTurnStarted` no ciclo 1 seguiu a ordem impressa dos lobos, antes de Lia.

| Campanha | IDs dos lobos na ordem impressa | Ciclo 1 observado | Ciclo 2 observado |
| --- | --- | --- | --- |
| Empate (`d4f56370-404a-4411-80c0-a2c1faf30b81`) | `7d189b6e-fcfe-48c1-99bf-e67edccf6843:enemy:0:0`, `7d189b6e-fcfe-48c1-99bf-e67edccf6843:enemy:0:1` | Lobo 1 → Lobo 2 → Lia | Lobo 1 → Lobo 2 → Lia |
| Mudança de Celeridade (`323dfc31-8eda-4faa-be87-9ce7954e193b`) | `443cf152-ce38-44b7-b106-0cabb1865979:enemy:0:0`, `443cf152-ce38-44b7-b106-0cabb1865979:enemy:0:1` | Lobo 1 → Lobo 2 → Lia | Lia abriu o ciclo. A ordem projetada continuava com Lobo 1 → Lobo 2. |

Acelerar retornou HTTP 200 com `useAbility`, `equipmentSlot: "weapon"` e `abilityId: "fixture.t67-haste"`, sem `targetId`. O `combat.order` permaneceu idêntico durante o ciclo 1. O encerramento do turno retornou Lia como única transição `combatTurnStarted` do ciclo 2, com posição `turn:2:0`.

Sem divergências nos dois cenários. Apenas este devlog foi alterado. A T-67 segue aberta para os demais cenários da matriz.

## Habilidade paga e Preparar com 0 PA — aguardando campanhas

Em 2026-11-21, com `VITE_USE_MOCKS=false` na configuração local, a API real em `localhost:3333` respondeu HTTP 200 a `GET /health` com `contractVersion: "0.65"`. A lista de `GET /parties` continha as campanhas das rodadas anteriores, sem as duas campanhas determinísticas desta rodada. O devlog 058 do backend também não registrava seus IDs.

A execução no Chrome fica pendente até a entrega dos saves. No combate, verificar pagamento único, descarte das cartas usadas, ataque básico disponível e bloqueio durante a recarga. Fora de combate, verificar que a habilidade habilita Preparar como única operação elegível com 0 PA, que o primeiro pagamento do encontro esvazia `usableAbilities`, que a repetição recebe HTTP 409 `eventPaymentStarted` e que entrar em combate zera a recarga anterior. Nenhuma intenção desses cenários foi enviada. Ainda não há respostas das ações nem divergências a avaliar. Horas da sessão permanecem `null`.

## Habilidade paga e Preparar com 0 PA — cenários solicitados aprovados

Validação em 2026-11-21 no Chrome via Playwright, com Vite em `localhost:5173`, MSW desligado e API real `localhost:3333` no CONTRATO v0.65. As duas campanhas começaram com 0 PA e 10 de ouro. Horas da sessão permanecem `null`.

| Campanha | Respostas e estado observado |
| --- | --- |
| Golpe Pago (`6ca3ea6f-682b-4d8b-8230-1ee46f71a54c`) | `useAbility` para `fixture.t67-paid-strike`, slot `weapon`, com `payment.handCards: ["hand-8"]` (Destreza), retornou HTTP 200. Ouro 10 → 8, a cópia saiu da mão e o descarte de atributos passou de 0 para 1. A API projetou `cooldownRemaining: 2` e `combat.abilities: []`. O botão de ataque básico continuou habilitado e `combatAttack` retornou HTTP 200. O GET seguinte confirmou ouro 8, 0 PA, os mesmos sete IDs na mão e uma carta no descarte. A API pública expõe a contagem do descarte. A permanência da cópia foi verificada pela contagem e pelos IDs da mão. |
| Socorro de Campo (`538dec1d-59f2-48cc-ac13-db68cdcd6d74`) | O formulário de Preparar apareceu aberto com uma única opção, `fixture.t67-field-aid` no slot `weapon`. `prepare/useAbility` retornou HTTP 200, ouro 10 → 9, PV 10 → 11 e pagamentos do encontro vazios. A lista `usableAbilities` esvaziou e `prepare` saiu de `availableActions` já após o uso. `payEventRequirement` para `gold` retornou HTTP 200, ouro 7 e recibo `{"requirementId":"gold","gold":2}`. Vigor permaneceu em 10, com a exigência de 3 pendente. `usableAbilities` continuou vazio e `prepare` continuou ausente. O reenvio da mesma intenção pelo Chrome retornou HTTP 409, `error.code: "ACTION_NOT_ALLOWED"` e `error.details.reason: "eventPaymentStarted"`. Os GETs antes e depois do reenvio foram idênticos, inclusive o ouro 7 e `savedAt`. |

A T-67 segue aberta. O reset de recarga ao entrar em combate e os demais cenários da matriz ainda precisam de validação. Apenas este devlog foi alterado.

## Reset de recarga ao entrar em combate — aguardando save

Em 2026-11-21, `GET /health` confirmou o CONTRATO v0.65 na API real em `localhost:3333`. A configuração local mantém `VITE_USE_MOCKS=false`. Os GETs das 33 campanhas mostraram que Socorro de Campo é a única campanha fora de combate com equipamento de habilidade nessa rodada. Ela está no encontro Pagamento em Duas Partes, com a primeira exigência paga e 0 PA. Os dois desfechos do encontro aplicam efeitos sem iniciar combate. O preparo original no backend semeou o deck urbano apenas com esse evento. Golpe Pago já está em combate, com recarga criada dentro dele.

Pendente um save determinístico com uma habilidade `both` de recarga positiva, custo pagável e um evento de combate no topo. Usar a habilidade durante a antecipação, confirmar a recarga ativa imediatamente antes de revelar, revelar na mesma vez e conferir `cooldownRemaining: 0` e a habilidade disponível no primeiro turno elegível. Se o estado prévio não estiver exposto no GET público, confirmar a recarga no estado persistido com o autor. Apenas consultas GET foram executadas nesta etapa. Nenhuma campanha foi alterada e o reset continua pendente. Horas — null.

### Socorro de Campo usado antes da revelação

Em 2026-11-21, no save `db73046c-05bb-4cbe-a09b-7e822e9a47c9`, Chrome via Playwright em `localhost:5173`, com MSW desligado e API real v0.65 em `localhost:3333`. Em Preparar, `prepare/useAbility` no slot `weapon` para `fixture.t67-field-aid` retornou HTTP 200. O ouro passou de 10 para 9, `usableAbilities` ficou vazio e Lia permaneceu em antecipação na rodada 1 com 0 PA. O snapshot público retornou `savedAt: 2026-11-21T19:26:57.446Z` e omite o contador de recarga fora de combate. A revelação aguarda a leitura da recarga persistida neste estado. Horas — null.

### Reset ao entrar em combate — aprovado

O autor confirmou recarga persistida de 3 e `uses: 1` para Socorro de Campo, em antecipação, com 9 de ouro e o mesmo `savedAt`. Um GET imediatamente antes da revelação confirmou esse `savedAt`, a antecipação e o saldo. No Chrome, com MSW desligado, Revelar carta retornou HTTP 200 e iniciou Lobos Uivantes na mesma vez, ainda na rodada 1 com 0 PA.

No primeiro turno de Lia, em `prepare` (`turn:1:0`), a resposta incluiu Socorro de Campo em `combat.abilities` com `canPay: true`, e o botão Usar habilidade ficou habilitado. O GET seguinte confirmou `cooldownRemaining: 0` e `usesRemaining: 1` em `combat.abilityStates`. Lia permaneceu com 9 de ouro. Nenhum segundo uso foi enviado. Sem divergências neste cenário. A T-67 segue aberta para os demais cenários da matriz. Horas — null.

## Repetição em quatro saves novos — aprovada

Em 2026-11-21, Chrome via Playwright em `localhost:5173`, com `VITE_USE_MOCKS=false` e POSTs para a API real v0.65 em `localhost:3333`. Horas — null.

| Cenário e save | Evidência |
| --- | --- |
| Empate de Celeridade (`c7a8f174-f5be-492a-afad-925a8793db84`) | Nos ciclos 1 e 2, `combat.order` e `combatTurnStarted` seguiram Lobo 1 → Lobo 2 → Lia. IDs na ordem: `736fd3ea-4ed2-4c01-a5bd-dfe228f90fda:enemy:0:0`, `736fd3ea-4ed2-4c01-a5bd-dfe228f90fda:enemy:0:1`, `a0d6e44d-885b-41d5-b162-decd510055a3`. |
| Mudança de Celeridade (`aa0d4823-461d-4be9-a65a-a0fe06aaed5f`) | Na revelação, `combat.order` e `combatTurnStarted` foram Lobo 1 → Lobo 2 → Lia. IDs na ordem: `68902328-b5e2-4557-948f-212764ab4a51:enemy:0:0`, `68902328-b5e2-4557-948f-212764ab4a51:enemy:0:1`, `7fb47935-1af1-40bd-a3a7-022745d6765f`. Acelerar preservou a ordem no ciclo 1. Após encerrar o turno, `combat.order` passou a Lia → Lobo 1 → Lobo 2, e o primeiro `combatTurnStarted` do ciclo 2 foi de Lia. |
| Golpe Pago com 0 PA (`7b9f5b13-913b-4ef1-b472-e358d6a04c0e`) | Um uso debitou 2 de ouro (10 → 8), retirou Destreza (`hand-8`) da mão e elevou o descarte de 0 para 1. O ataque básico retornou HTTP 200 e abriu o ciclo 2. `cooldownRemaining` foi 2 após o uso, 2 no ciclo 2, 1 no ciclo 3 e 0 no ciclo 4, quando a habilidade voltou a ser oferecida. Saldo 8 e descarte 1 foram preservados. |
| Socorro de Campo com 0 PA (`239fd7d1-3dd7-434a-819e-010cb4bcf226`) | Única habilidade de Preparar. Seu uso baixou o saldo de 10 para 9. Pagar apenas ouro baixou para 7, gerou somente o recibo de 2 de ouro e deixou 3 de Vigor pendentes. A API projetou `usableAbilities: []` e omitiu `prepare`. Um reenvio do mesmo POST via `fetch` no Chrome retornou HTTP 409 `eventPaymentStarted`. Os GETs antes e depois foram idênticos. |

Sem divergências nos quatro saves. O seletor inicial do botão de pagamento expirou antes de enviar uma ação. Um GET confirmou saldo 9 e pagamentos vazios antes da retomada pelo botão do requisito de ouro. Apenas este devlog foi alterado. A T-67 segue aberta para os demais cenários.

## Turno atual, Manter, Deixar e Derrota — aprovados no frontend

Em 2026-11-21, Chrome via Playwright em `http://localhost:5173`, com `VITE_USE_MOCKS=false`, service workers bloqueados e API real v0.65 em `http://localhost:3333`. As ações aceitas passaram pelos controles da sessão. Os dois reenvios de payload foram feitos via `fetch` no Chrome, uma vez cada. Horas — null.

| Cenário e save | Status HTTP e estado observado |
| --- | --- |
| Turno atual — `3ad72beb-b030-4dc7-b210-323525a0845c` | O ataque obsoleto ao primeiro lobo no turno `turn:1:0` retornou **409** `ACTION_NOT_ALLOWED`, motivo `staleCombatTurn`. Os GETs antes e depois da recusa foram idênticos. Após recarregar, o ataque usou `combatId` `51b6eb5b-7fc1-4794-94a0-93adb5a54c2a`, turno `51b6eb5b-7fc1-4794-94a0-93adb5a54c2a:turn:2:0` e único alvo vivo `51b6eb5b-7fc1-4794-94a0-93adb5a54c2a:enemy:1:0`. Retornou **200**, `combat: null`, `resolution: victory` e `playerDown: true`. Lia ficou a 0 PV após Reflexão, com a escolha de minério aberta. |
| Manter — `0123e4f8-3905-4747-bb5f-d25433092a33` | Ataque ao último lobo retornou **200**. Após recarregar, o GET **200** mostrou Lia a 0 PV, `down: true`, minério de ferro pendente com `source.type: combatEvent`, origem `rewardDeck` urbano e `availableActions: ['resolveReward']`. Manter retornou **200**, consumiu uma cópia de `fixture.silver-fish` e entregou uma de `fixture.iron-ore`, com `lastRewardDelivery.disposition: kept`. |
| Deixar — `dbafa5d8-8b1f-4687-891d-3b578f6936d0` | Ataque ao último lobo retornou **200**. Após recarregar, o GET **200** mostrou Lia a 0 PV, `down: true`, minério de ferro pendente com `source.type: combatEvent`, origem `rewardDeck` urbano e `availableActions: ['resolveReward']`. Deixar retornou **200**, preservou a cópia de peixe e registrou `lastRewardDelivery.disposition: returnedToDeck`. |
| Derrota — `1527de24-10fb-4538-8b49-f5808015b665` | Encerrar o primeiro turno retornou **200**, `combat: null`, `resolution: defeat`, Lia a 0 PV, `down: true` e ouro de 10 para 5. Os GETs **200** após recarregar, encerrar e reabrir a sessão confirmaram ouro 5. O reenvio original retornou **409** `ACTION_NOT_ALLOWED`, motivo `staleCombat`. O GET final **200** foi idêntico ao da reabertura e confirmou ouro 5. |

O GET final de cada escolha de recompensa retornou **200** e confirmou Lia caída, `pendingRewards: []` e `availableActions: []`. Payload original da Derrota, reenviado após reabrir:

```json
{"type":"endCombatTurn","combatId":"b2d8041c-1869-41ad-bc1d-20f40ee1575d","turnId":"b2d8041c-1869-41ad-bc1d-20f40ee1575d:turn:1:0"}
```

### Conferência no PostgreSQL — concluída

O autor informou os resultados da conferência no backend, sem divergências para o CONTRATO v0.65.

| Cenário e save | Estado persistido |
| --- | --- |
| Manter — `0123e4f8-3905-4747-bb5f-d25433092a33` | Uma ocorrência de `fixture.howling-wolves` no descarte urbano. |
| Deixar — `dbafa5d8-8b1f-4687-891d-3b578f6936d0` | Uma ocorrência de `fixture.howling-wolves` no descarte urbano e uma cópia de `fixture.iron-ore` devolvida ao deck urbano. |
| Derrota — `1527de24-10fb-4538-8b49-f5808015b665` | Uma ocorrência de `fixture.t67-defeat` no descarte urbano e saldo de 5 de ouro. |

As linhas de turno obsoleto e Reflexão fatal com inventário cheio estão aprovadas. A execução dos cenários desta rodada está concluída e apenas este devlog foi alterado. Horas — null. A T-67 segue aberta para os demais cenários da matriz e a FEAT-13 permanece `implementado (BE)`.

## Catálogo legado e habilidade restrita — aprovado

Em 2026-11-21, Chrome via Playwright em `http://localhost:5173`, com `VITE_USE_MOCKS=false`, service workers bloqueados e API em `http://localhost:3333`. `GET /health` retornou HTTP 200 com `contractVersion: "0.65"`. Horas — null.

| Cenário | Evidência |
| --- | --- |
| Catálogo legado — `fixture.t67-legacy-combat` | A listagem de cartas da coleção `fixture` retornou HTTP **200**. Ao abrir a carta, o Chrome exibiu o nome **Uivo** e o texto **A matilha uiva.**, presentes como `name` e `text` no JSON. Os dois desfechos apareceram como blocos legíveis: “Os lobos fogem e deixam peles para trás.” e “A matilha fere o grupo antes de recuar.” |
| Cópia com habilidade sem `form` — slug `t67-sem-form-1795291053719` | Base `fixture.t67-catalog-combat`. A habilidade `fixture.fire`, de `fixture.fire-ambush`, foi enviada preservando o `id` e removendo apenas `form`. HTTP **400** `CONTENT_INVALID`, com `details.fields[0].path: enemies.0.abilities.0.form`. |
| Cópia com `badOutcome.steps: null` — slug `t67-steps-nulo-1795291053719` | Mesma base, com a alteração isolada em `badOutcome.steps`. HTTP **400** `CONTENT_INVALID`, com `details.fields[0].path: badOutcome.steps` e mensagem “Campo desconhecido.” |

Os dois POSTs foram enviados via `fetch` no Chrome, na página `/lab/editor`, para `/lab/content/collections/fixture/cards`. O formulário valida localmente o JSON desses campos antes de montar o pedido. Os POSTs confirmaram as rejeições da API. Sem divergência de HTTP, código ou caminho nos cenários executados.

Na primeira consulta, a listagem e os 41 GETs de detalhe retornaram HTTP **200** e os três saves de limiar ainda estavam ausentes. Após a entrega dos IDs pelo autor, as três sessões foram abertas no Chrome com MSW desligado, e `GET /health` confirmou HTTP **200** e contrato v0.65.

| Save | ID | Carta | HTTP | `combat.escape.threshold` |
| --- | --- | --- | --- | --- |
| Limiar ausente | `a53e8f3f-8766-4615-a289-ea37038ffbdb` | `fixture.t67-catalog-combat` | **200** | **13** |
| Limiar nulo | `a85c2df2-c12a-4d73-b021-5de173459580` | `fixture.t67-catalog-combat-null` | **200** | **13** |
| Limiar zero | `2aaa723c-4410-48ce-bb88-c9f1fee66924` | `fixture.t67-catalog-combat-zero` | **200** | **0** |

Em Limiar ausente, Lia (`293d99f9-57e6-4d5e-ba17-a913f93addf4`) tinha a classe `warrior` ativa e `fixture.t67-class-weapon` no slot `weapon`. `combat.abilities` oferecia apenas Golpe Livre (`fixture.t67-open-ability`), com `canPay: true`. Golpe do Ladino (`fixture.t67-rogue-ability`) estava ausente dessa lista.

O POST via `fetch` no Chrome com `type: useAbility`, `abilityId: fixture.t67-rogue-ability` e `equipmentSlot: weapon` usou o combate `1b844246-482c-4a23-b355-f32869c3d718`, o turno `1b844246-482c-4a23-b355-f32869c3d718:turn:1:0` e o alvo vivo `1b844246-482c-4a23-b355-f32869c3d718:enemy:0:0` (1 PV). A API retornou HTTP **409** `ACTION_NOT_ALLOWED`, com `error.details.reason: combatAbilityUnavailable`. O GET seguinte retornou **200** e confirmou que o turno de combate inteiro, o turno do grupo e `savedAt: 2026-11-21T19:58:47.389Z` coincidiram com os valores de antes da recusa. O turno de combate ficou em `prepare`, com um ataque restante.

O botão **Atacar Lobo Cinzento** enviou `combatAttack` com os mesmos IDs. O desfecho com `goodOutcome.steps: []` retornou HTTP **200**, `combat: null`, `lastCombatResult.resolution: victory`, `lastCombatResult.cause: enemiesDefeated` e `pendingRewards: []`.

Todos os resultados desta linha corresponderam ao esperado. Apenas este devlog foi alterado. Horas — null.

## Revelação com desfecho imediato — vitória divergente

Em 2026-11-21, no Chrome via Playwright, com `VITE_USE_MOCKS=false` e service workers bloqueados, foi usado o botão **Revelar carta** uma vez em cada campanha. Nos dois POSTs, a API retornou HTTP 200, `combat: null` e `combatStarted → combatTurnStarted → combatDamageResolved → combatEnded`. O primeiro item identificou **Lobo da Revelação** (`fixture.t67-immediate-combat`), Lia e Lobo Cinzento. Os eventos seguintes conservaram o ID do combate e referenciaram os mesmos participantes.

| Campanha | Esperado | POST observado | GET após recarga |
| --- | --- | --- | --- |
| Vitória — `c7b58854-f54c-45ab-9aa3-e07505e79294` | `victory`, `enemiesDefeated`, Lia com 1 PV | `defeat`, `playerDown`, Lia a 0 PV no evento de dano. O lobo causou 2 de dano e recebeu 18 de dano refletido, também ficando a 0 PV. | HTTP 200, `combat: null`, mesmo `lastCombatResult`, sem a chave `combatUpdates`. Lia caída com 0 PV. |
| Derrota — `1d52bee7-352b-4522-b875-7dc0dc4195f5` | `defeat`, `playerDown`, Lia caída com 0 PV | Conforme esperado. O lobo causou 20 de dano e ficou com 1 PV. | HTTP 200, `combat: null`, mesmo `lastCombatResult`, sem a chave `combatUpdates`. Lia caída com 0 PV. |

A T-67 permanece aberta. Falta revisar a campanha de vitória no backend e repetir esse cenário com uma campanha em antecipação. Apenas este devlog foi alterado nesta rodada. Horas — null.

### Revalidação da vitória — aprovada

Em 2026-11-21, o backend informou que o Vigor 0 da fixture anterior aplicava a penalidade de exaustão de 10%, reduzindo a Reflexão de 20 para 18. A fixture corrigida usa Pico e Vigor 1, sem alteração na resolução do combate.

No Chrome com MSW desligado, um clique em **Revelar carta** no save `49235834-c03f-4eda-8a2f-ed34dd528b9c` retornou HTTP 200, `combat: null`, `victory` e `enemiesDefeated`. Lia ficou com 1 PV e `playerDown: false`. O lote veio na ordem `combatStarted → combatTurnStarted → combatDamageResolved → combatEnded`, com a carta **Lobo da Revelação**, Lia e Lobo Cinzento, e IDs consistentes entre os eventos. O evento de dano registrou 0 de dano a Lia e 20 de dano refletido ao lobo, que ficou com 0 PV.

O GET após recarga retornou HTTP 200, `combat: null`, o mesmo `lastCombatResult` e Lia com 1 PV. A chave `combatUpdates` estava ausente. A linha de revelação com vitória ou derrota imediata está aprovada. A T-67 segue aberta para os demais cenários da matriz. Apenas este devlog foi alterado. Horas — null.

## Área, Precisão zero, elemento e Reflexão — Jato executado

No Chrome via Playwright, com MSW desligado e API real em `http://localhost:3333`, Jato de Água foi usado uma vez contra Lobo de Fogo no save `ca987d8d-d3db-4b87-abba-919384513fd8`. O POST retornou HTTP 200 com `combatAbilityUsed` seguido de `combatDamageResolved`. O evento de dano confirmou `hit: false`, `damage: 0`, `reflectedDamage: 0`, `targetHealth: 20` e `actorHealth: 20`.

A rodada parou após o Jato para o autor comparar o RNG persistido com `[0,0,0,10]`. A Onda de Água aguarda liberação. Horas — null.

### Onda de Água — API conferida, RNG pendente

O autor confirmou que o Jato preservou o RNG em `[0,0,0,10]` e liberou a Onda. No Chrome com MSW desligado, o GET projetou os dois lobos em `combat.abilities[].targetIds` para a Onda de Água. A tela exigiu escolher um alvo para habilitar o botão. Para executar o cenário sem alvo individual, foi enviado um único POST `useAbility` via `fetch` no Chrome, com os IDs do GET e sem `targetId`.

O POST retornou HTTP 200. Após `combatAbilityUsed`, os dois eventos `combatDamageResolved` vieram nesta ordem: Lobo de Fogo com `hit: true`, `damage: 10` e `reflectedDamage: 2`; Lobo de Gelo com `hit: true`, `damage: 4` e `reflectedDamage: 3`. O GET após recarga retornou HTTP 200 e confirmou Lia com 15 PV, Fogo com 10 PV e Gelo com 16 PV.

A execução parou após a recarga para a leitura final do RNG. A projeção de alvo individual para a Onda impediu a execução pelo botão. Horas — null.

### Ajuste do botão de Área — pronto para revalidação

O autor confirmou que o RNG persistido após a Onda permaneceu em `[0,0,0,10]`. Em `CombatPanel.tsx`, o controle usa o tipo de alvo da habilidade equipada para dispensar a seleção e omitir `targetId` em `allOpponents`. `PartySession.tsx` informa o carregamento do catálogo para aguardar a carta equipada antes de habilitar o uso.

Os dois casos de regressão do REQ-61 em `PartySession.test.tsx` falharam antes do ajuste e passaram depois. A suíte da tela passou com 173 testes. ESLint, build e `git diff --check` passaram. O build emitiu aviso de tamanho do bundle.

Na revalidação, abrir um save novo com a Onda disponível no Chrome com MSW desligado, clicar no botão e conferir um POST sem `targetId`, seguido de HTTP 200. A regressão cobre também o caso de um único oponente vivo. O save anterior tem `usesRemaining: 0` para a Onda. Horas — null.

### Botão da Onda de Água — revalidação aprovada

No save `a2d002e9-216c-4a2f-831c-a829292001a3`, o GET da API real em `http://localhost:3333` confirmou os dois lobos vivos com 20 PV cada. No Chrome via Playwright, com MSW desligado, a Onda de Água apareceu sem seletor. Um clique em **Usar habilidade** produziu um único POST `useAbility` para `fixture.t67-water-area`, sem a chave `targetId`, e recebeu HTTP 200. Os eventos vieram na ordem Fogo com 10 de dano e 2 refletidos, depois Gelo com 4 de dano e 3 refletidos.

A linha de Área, Precisão zero, elemento e Reflexão está aprovada. A T-67 segue aberta para as demais linhas da matriz, começando por Suporte com aliado ferido e Canalizada após dano. Horas — null.
