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

Sem divergências funcionais nos cenários executados. Os dois lobos apareciam com o mesmo rótulo; a ordem dos controles e os IDs enviados permitiram conferir o alvo. Faltam os demais cenários determinísticos do contrato e a verificação direta do RNG após recusa, que o GET não expõe. A T-67 permanece aberta.
