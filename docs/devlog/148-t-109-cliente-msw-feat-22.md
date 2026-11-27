# 148 — Cliente e fixtures MSW da FEAT-22

- Data — 2026-11-27
- Status — concluída com MSW
- Horas — null

A T-109 segue a D-68, os REQ-110 a REQ-114 e a seção acordada da FEAT-22 no CONTRATO v1.19.

- `src/api/combat.ts` e `src/api/parties.ts` tipam as três novas intenções, validam as cinco variantes de decisão, a projeção do elenco, o desfecho coletivo com os resultados individuais e os acontecimentos dos recibos. Saves e recibos legados continuam aceitos com os campos novos ausentes. Turno e recompensa reutilizam as intenções existentes.
- `src/mocks/groupCombatFixtures.ts` e `src/mocks/handlers.ts` projetam os saves por GET e sessão e respondem às ações com evolução por revisão. Há cenários de seleção de elenco, aceite e recusa de convite da IA, desempate, turno humano durante a exploração da IA, saque pendente com respawn posterior e retomada de ação interrompida.
- `src/features/party/PartySession.tsx` e `src/features/party/combatUpdateText.ts` reconhecem os motivos de recusa e os acontecimentos públicos no tratamento existente.
- `src/api/groupCombat.test.ts` verifica o fluxo HTTP com MSW. Os testes de inventário e cofre passam a esperar os novos tipos no vocabulário compartilhado de ações.

Nos testes iniciais, os saves recém-especificados retornaram grupo não encontrado. Depois da implementação, o roteiro automatizado confirma o elenco e o desempate antes do primeiro ataque, recarrega a pausa na vez da IA, entrega a recompensa ao destinatário e verifica o desfecho individual após o respawn. No caso de borda, uma chave concorrente recebe `ACTION_ADVANCE_PENDING` enquanto há um avanço interrompido. A chave vencedora devolve o recibo completo mesmo após outra decisão, e o GET preserva a revisão atual.

Os saves de teste são `fixture.group-combat-roster`, `fixture.group-combat-invite`, `fixture.group-combat-decline` e `fixture.group-combat-recovery`. A compatibilidade solo usa também o save existente `party-combat-active`.

Passaram os 338 testes do recorte, os 1.227 testes da suíte completa em 53 arquivos, a checagem de tipos, o ESLint e o Prettier dos arquivos TypeScript alterados e o `git diff --check`.

A interface de recrutamento e pausa segue na T-110. A apresentação de combate e recompensas segue na T-111. Os cenários integrados do CONTRATO v1.19 ficam para a T-112 com a API real e MSW desligado.
