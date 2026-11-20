# 082 — T-63, cliente e fixtures da FEAT-13

**2026-11-20 · concluída · REQ-60 a REQ-62 · CONTRATO v0.64 · SPEC v0.76**

O autor aprovou os critérios e a sequência T-63 a T-67. A T-63 cobre a leitura do contrato e as ações pelos clientes existentes.

- `src/api/catalog.ts`, `labConfig.ts` e `randomEvents.ts` preservam habilidades e desfechos executáveis, configuração de combate, pagamentos e origem de recompensa de combate. Respostas anteriores à FEAT-13 continuam legíveis.
- `src/api/combat.ts` e `parties.ts` tipam o snapshot, os pedidos, as recusas e o lote transitório do POST. `PartySession.tsx` aceita os novos motivos nos tratamentos existentes.
- `src/mocks/combatFixtures.ts`, `handlers.ts` e as fixtures de catálogo e laboratório fornecem respostas determinísticas. Os cenários de combate guardam em memória o último snapshot aceito para que outro GET na mesma instância do MSW observe a escolha ou o desfecho. O cenário `party-trigger-enemy` também abre diretamente na pausa do inimigo.
- Os testes cobrem o schema, as rotas MSW e a ampliação de `availableActions`. Os primeiros testes falharam porque o cliente descartava campos que ainda não conhecia.

| Verificação em MSW | Resultado esperado e observado |
| --- | --- |
| GET da carta e GET/PATCH/reset de laboratório | Carta executável conserva habilidade, desfecho e limiar zero. Laboratório conserva valores, padrões e limites. |
| Antecipação com passiva de 1 ouro | Recusar mantém ouro e Vida. Pagar em save equivalente cobra 1 ouro e recupera 1 de Vida. |
| Revelação, GET e decisão durante turno inimigo | O GET mantém os IDs da escolha e do turno e omite o lote. O POST retoma com novas transições ordenadas. |
| Seleção entre automático e opcional | A ordem recebida é preservada. Resolver o automático emite outro `choiceId`, conserva o `effectId` pendente e atualiza `canPay`. Reusar o ID anterior recebe `staleTriggeredEffectChoice`. |
| Pagamento manual ausente | `paymentInvalid`, seguido de GET idêntico ao snapshot anterior. |
| Turno antigo e Reflexão fatal | Turno antigo recebe `staleCombatTurn`. Com o turno atual, a vitória mantém a ação de recompensa disponível mesmo com o jogador caído. Deixar a recompensa conclui a escolha. |

Verificações locais incluem os 153 testes afetados, lint, build de release com guarda e `git diff --check`. A suíte completa mantém duas falhas de editor reproduzidas também em cópia do `HEAD` anterior à etapa, na importação de coleção (REQ-33) e na busca com debounce (REQ-20).

Nenhuma divergência de contrato foi encontrada nos fluxos representados. T-64 retoma com catálogo, editor e laboratório. T-65 e T-66 cobrem a interface de combate e escolha. A validação de RNG, persistência real e demais cenários integrados aguarda o backend na T-67.
