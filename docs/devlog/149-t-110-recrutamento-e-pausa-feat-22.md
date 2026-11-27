# 149 — Recrutamento e pausa da IA na FEAT-22

- Data — 2026-11-27
- Status — concluída com MSW
- Horas — null

A T-110 retoma a entrada 148 com a D-68, os REQ-110, REQ-111 e REQ-114 e a seção acordada da FEAT-22 no CONTRATO v1.19.

- `src/features/party/CombatRecruitment.tsx` oferece os candidatos projetados, permite confirmar o elenco vazio e mostra o iniciador e o encontro nos convites da IA. O desempate oferece a ordem padrão e as opções aceitas pelo servidor. A tela identifica quem arca com o custo do encontro. O contrato delega a cobrança ao servidor e a decisão pendente não projeta um valor próprio.
- `src/features/party/PartySession.tsx` bloqueia outras ações durante a pausa e reutiliza o fluxo de chave, recibo e revisão para a intenção autorizada. A reabertura mostra a decisão persistida. `src/features/party/CombatPanel.tsx` usa o ator do turno para apresentar as ações de combate. `src/features/party/combatUpdateText.ts` inclui as recusas na confirmação do elenco.
- `src/mocks/groupCombatFixtures.ts` projeta as ações humanas disponíveis no turno e na escolha de recompensa. `src/features/party/PartySession.test.tsx` exercita os saves MSW da T-109 pela abertura normal da sessão.

Os três testes iniciais falharam pela ausência dos controles de recrutamento. O roteiro após a implementação confirma o elenco com Ajudante 1 e Ajudante 2 selecionados. A apresentação informa o aceite do primeiro e a recusa do segundo. O ataque só aparece depois do desempate. No caso de borda, confirmar a lista vazia inicia o combate solo sem desempate. Nos saves de convite, reabrir antes da resposta oferece o mesmo convite e reabrir depois do aceite recupera o turno de combate humano na vez de exploração do Ajudante 1. Recusar mantém o combate com a IA iniciadora.

Passaram os 252 testes do recorte final (sessão, API de combate em grupo e recompensa), a checagem de tipos, o ESLint, o Prettier dos arquivos TypeScript alterados e o `git diff --check`. A suíte completa da primeira rodada passou com 1.230 testes em 53 arquivos, antes dos últimos ajustes de cobertura e da seleção de recompensa por ID.

A apresentação de combate e recompensas em grupo segue na T-111. A validação com a API real fica para a T-112.
