# 081 — T-62, FEAT-12 validada contra o backend real

**2026-11-20 · concluída · REQ-56 a REQ-59 · D-61**

A rodada completou a verificação de interface com Chrome e MSW desligado do [devlog 080](080-T-62-validacao-parcial-feat-12.md). Os cenários determinísticos foram exercitados por HTTP contra a API real v0.58, através do proxy do Vite com `VITE_USE_MOCKS=false`. O restaurador documentado no devlog 052 do backend repôs os 23 grupos antes da repetição e depois da rodada final.

| Sufixo do ID | Resultado observado, conforme esperado |
| --- | --- |
| 01 | Antecipação ocultou a carta. Duas revelações compraram o Viajante Ferido, inclusive após reciclar. |
| 02 | `startEvent` indisponível. Pedido direto retornou `409 eventDeckEmpty`. |
| 03 | `409 eventMinimumNotMet`, Vigor projetado 4. O save conservou Vigor 7, ouro 10 e três recibos. Desistir repôs duas cartas. |
| 04 | Última parte aceita. Êxito com Vigor 5, Pico +1 e duas cartas repostas. |
| 05 | Pagamento de `h2` deixou apenas `h1` e progresso parcial. |
| 06 | `409 eventMinimumNotMet` com Vigor 4. Ambas as cópias permaneceram na mão, sem recibo. |
| 07 | Poção com 0 PA elevou Vida de 10 a 15. Após pagar `h2`, nova ativação retornou `409 eventPaymentStarted`. |
| 08 | Primeira parte sorteou `h2`. Duas novas tentativas retornaram `409 eventMinimumNotMet` com Vigor 4 e preservaram o save. |
| 09 | Primeira parte sorteou `h2`, segunda sorteou `h3`. Êxito e reposição solicitada de duas cópias. |
| 10 | `409 eventMinimumNotMet` com Esquiva 79. |
| 11 | Êxito com Esquiva 80. |
| 12 | Rolagem 10 falhou, gastou 2 de Vigor e criou dívida de 1 PA. Turno seguinte começou com 2 PA e dívida zerada. |
| 13 | Rolagem 10 falhou, gastou 2 de Vigor e tirou 1 PA corrente, sem dívida. |
| 14 | Rolagem 11 teve êxito, gastou 2 de Vigor e deixou PA e dívida intactos. |
| 15 | `409 escapeForbidden`. |
| 16 | `409 notEnoughVigor`. |
| 17 | Minério urbano abriu escolha. Descartar um peixe retornou `409 rewardDoesNotFit`. Descartar dois permitiu manter e abriu poção da reserva. Deixá-la registrou `removed`. |
| 18 | Deixar a recompensa urbana registrou `returnedToDeck`. |
| 19 | Deixar a recompensa fixa registrou `sentToLimbo`. |
| 20 | Busca específica retornou `found: false`, sem escolha pendente. |
| 21 | Vasculhar gastou 1 PA e retornou `pending`. Novo GET conservou a escolha. Deixar retornou `left` e repetir retornou `409 staleReward`. |
| 22 | Vasculhar gastou 1 PA e entregou por empilhamento com `delivery: inventory`. |
| 23 | Vasculhar gastou 1 PA e retornou `found: false`, `delivery: none` e nenhuma escolha. |

No grupo `fe120000-0000-4000-8000-000000000008`, a leitura do save antes da primeira recusa e depois de cada uma das duas recusas retornou `rngState: [0, 0, 10, 11]` e `savedAt: "2026-11-20T18:40:22.059Z"`. O GET também preservou `savedAt`, as cópias `h1` e `h3` e o único recibo de `h2`.

A primeira rodada aprovou 22 IDs. A asserção do grupo 07 leu `life` em vez de `health`. Com o campo correto e os grupos restaurados, a segunda rodada aprovou 23 de 23. Nenhuma divergência funcional ficou pendente. A cobertura dos prazos multiplayer segue a FEAT-26.

A spec v0.75 marca a T-62 concluída. O CONTRATO v0.59 e o ROADMAP v0.60 registram a FEAT-12 como validada e devem ser levados integralmente ao backend. O índice e o registro de tempo receberam a etapa com horas `null`.

