# 150 — Combate e recompensas em grupo na FEAT-22

- Data — 2026-11-27
- Status — concluída com MSW
- Horas — null

A T-111 retoma a entrada 149 com a D-68, os REQ-112 a REQ-114 e a seção acordada da FEAT-22 no CONTRATO v1.19.

- `src/features/party/CombatPanel.tsx` apresenta ordem, ator, alvos, PV e estado por combatente. O relatório exibe o resultado coletivo e detalha os deltas, ouro, cartas, nocaute, ressurreição, respawn e perda da próxima vez por participante. A projeção solo histórica mantém o resumo anterior.
- `src/features/party/PartySession.tsx`, `RewardChoice.tsx` e `QuestPanel.tsx` mostram o destinatário e a posição da recompensa corrente, além do progresso atual das missões projetadas para os combatentes. O fluxo usa o recibo de conclusão da dimensão já exibido pela sessão para o chefe final.
- `src/mocks/groupCombatFixtures.ts` projeta uma missão concluída para o iniciador caído, escolha pendente antes do respawn e uma entrega automática antes da escolha humana na segunda posição. `src/features/party/PartySession.test.tsx` cobre esses estados e confirma que o reenvio pela chave persistida mantém a recompensa corrente quando o MSW devolve o recibo original de um turno anterior.

Na verificação com MSW, aceitar o convite em `fixture.group-combat-invite` e atacar apresenta a vitória, a missão concluída de Ajudante 1 e Lia na primeira posição. Resolver a escolha apresenta o respawn e a perda da próxima vez de Ajudante 1. Em `fixture.group-combat-rotation`, atacar apresenta a carta entregue a Ajudante 2 e a escolha pendente para Lia na segunda posição. No caso de borda `fixture.group-combat-recovery`, o reenvio da resposta ao convite preserva a chave e o corpo. Reenviar o recibo antigo depois da vitória mantém a escolha de recompensa e evita a reapresentação do turno.

Os testes iniciais detectaram a ausência da lista completa de combatentes e do cenário de segunda posição. Passaram os 250 testes finais de sessão e cliente MSW de combate em grupo, a checagem de tipos, o ESLint, o Prettier dos arquivos TypeScript alterados e o `git diff --check`. A suíte completa passou com 1.234 testes em 53 arquivos antes do ajuste final que inicia a fixture de rodízio diretamente no turno humano.

A validação integrada com MSW desligado segue na T-112 com os cenários da seção FEAT-22 do CONTRATO v1.19.
