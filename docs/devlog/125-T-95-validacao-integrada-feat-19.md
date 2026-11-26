# 125 — T-95, validação integrada da FEAT-19

- Data — 2026-11-26
- Status — concluída
- Contrato — v0.99, seção FEAT-19
- Horas — `null`

`docs/CONTRATO.md` foi copiado integralmente do backend e conferido por SHA-256. A spec e o índice do devlog registram a conclusão da T-95. As requisições foram feitas diretamente à API real em `http://localhost:3333`, sem MSW.

| Cenário | Resultado observado |
| --- | --- |
| congelar | A conclusão retornou `200`, status `frozen` e `next.type: frozen`. A lista mostrou `frozen` e reabrir retornou `409 PARTY_FROZEN`. Só depois foi publicado `fixture-next.next-dimension`, com POST sem corpo e resposta `200 published`. O grupo passou a `idle` com o recibo preservado. Reabriu na Segunda Dimensão com `next.type: nextDimension`, ouro, Pico e cartas do prêmio preservados e sem nova entrega. Um segundo POST de sessão devolveu o mesmo estado. |
| passagem | A conclusão retornou `200` e entrou imediatamente na Segunda Dimensão. O recibo persistiu com +25 de Pico, 100 de ouro e uma Lâmina do Crepúsculo no inventário. Fragmentos e missões abertas ficaram vazios, com sete cartas na mão e posição e respawn na nova cidade inicial. |
| sem-espaco | A conclusão retornou `200` na Segunda Dimensão. O recibo ficou sem cartas entregues, com pendência `grandPrize` da dimensão original e apenas `resolveReward` disponível. `leave` retornou `200`, eliminou a pendência e registrou `lastRewardDelivery.disposition: sentToLimbo` para `fixture.blade-of-dusk`. A entrega e o recibo foram confirmados por GET. |
| porto | `409 ACTION_NOT_ALLOWED` com `notCompletionZone`. O GET foi idêntico antes e depois. |
| dois-fragmentos | `409 ACTION_NOT_ALLOWED` com `completionRequirementNotMet`. O GET foi idêntico antes e depois. |
| zero-pa | `409 ACTION_NOT_ALLOWED` com `noActionPoints`. O GET foi idêntico antes e depois. |

O catálogo real retornou o Fragmento como item de conclusão e a Carta de Dimensão configurada para três Fragmentos na Mina Velha. A doação com inventário cheio, os perfis chefe e montaria e os dois erros do editor foram verificados localmente pelo backend e constam no devlog 103 da T-86. As mensagens adicionais em `goodOutcome` e `badOutcome` do evento de combate da fixture estão registradas ali e no contrato v0.99.

A validação integrada do perfil base passou sem divergências. O retorno segue para o fechamento da T-86 e da FEAT-19 no backend.
