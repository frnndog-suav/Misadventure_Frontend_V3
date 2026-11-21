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
