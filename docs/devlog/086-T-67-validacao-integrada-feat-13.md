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
