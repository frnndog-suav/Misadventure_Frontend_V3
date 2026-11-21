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
| Saves legados v8 com encontro aberto, descarte e ocorrências de combate repetidas | Revelação em deck misto, incluindo a variante com pilha de compra vazia do devlog 058. |
| Campanhas com configuração de combate determinística | Empate e mudança de Celeridade, habilidade paga com 0 PA e recarga, habilitação de Preparar com 0 PA e bloqueio após pagamento, custos automáticos e seleção de mão, slot e recursos. |
| Conteúdo e campanhas com casos de borda | Variantes de catálogo e restrição de classe, vitória e derrota imediatas, Área e Precisão zero com elemento e Reflexão, suporte e Canalizada, fuga falha e limite em Sem fuga, derrota com desfecho aplicado uma vez. |
| Saves equivalentes para escolhas de efeitos | Pagar e recusar na antecipação, ordem entre automático e opcional, pagamento inválido e reenvio de escolha consumida. |


A API na porta 3333 respondeu HTTP 200 à consulta de disponibilidade. Os dois saves já exercitados não foram alterados nesta etapa. A próxima rodada depende dos dados acima. Nenhum cenário novo foi executado.

## Recusa por turno obsoleto — aprovada

Na campanha `cf2d7906-0fb3-4879-97cb-328f75021de5`, o Chrome com MSW desligado exibiu apenas o segundo lobo como alvo, no turno `turn:2:0`. Após o autor confirmar a leitura inicial do PostgreSQL, o ataque original foi reenviado uma vez com `turn:1:0` e o primeiro lobo como alvo. A API retornou HTTP 409, código `ACTION_NOT_ALLOWED` e motivo `staleCombatTurn`. Nenhuma outra ação ocorreu entre as leituras.

O autor confirmou no devlog 058 do backend que o SHA-256 da linha inteira, `state.rngState` (`[0, 90, 20971531, 12]`) e `savedAt` (`2026-11-21T17:10:01.091Z`) coincidiram antes e depois da recusa. A campanha está liberada para novas ações. A T-67 continua aberta para os demais cenários da matriz.

## Saves legados v8 — confirmação parcial

Chrome via Playwright, frontend em `localhost:5173`, MSW desligado e API v0.65 em `localhost:3333`. Nos dois saves, abrir e recarregar a página manteve Viajante Ferido visível na fase `encounter`, com o mesmo ID de encontro e o mesmo snapshot público completo. Desistir, iniciar evento e revelar retornaram HTTP 200 em ambas as variantes.

| Variante | Save | Primeira revelação após a desistência |
| --- | --- | --- |
| Deck misto | `f739c4d8-18e9-4090-89f1-968623044dd3` | `fixture.t67-traveler-reserve` permaneceu no topo e apareceu na fase `encounter`. |
| Pilha de compra vazia | `6a2e39f1-940a-4631-95a2-1134be32e2a0` | `combat.card.id` retornou `fixture.howling-wolves`, com dois inimigos. A revelação é compatível com a inclusão antes da reciclagem do descarte. |

A asserção automatizada da variante vazia procurou o ID em `combat.cardId` e falhou. Um GET posterior confirmou o valor no campo `combat.card.id`. A API pública não expõe a pilha, o descarte ou o RNG. Para concluir a verificação, falta conferir no PostgreSQL as duas ocorrências restantes no deck misto, uma ocorrência restante na variante vazia, a ordem do descarte e o RNG em relação ao estado inicial. Os saves ficaram nas fases indicadas na tabela. Nenhuma ação adicional foi enviada. Os outros grupos de cenários da T-67 seguem pendentes de fixtures.
