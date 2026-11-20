# 085 — T-66, escolha de efeitos disparados

**2026-11-20 · concluída com MSW · REQ-62 · CONTRATO v0.64 · SPEC v0.79**

Retomada do registro 084.

- `CombatPanel.tsx` oferece Resolver para automáticos e Pagar ou Recusar para opcionais. Usa os custos projetados e oferece somente Recusar quando `canPay` é falso.
- `PartySession.tsx` restaura a escolha pelo GET, envia os IDs projetados e usa o snapshot e o lote do POST aceito. Uma recusa mostra a mensagem da API e conserva a última projeção confirmada.
- `combatFixtures.ts` e `handlers.ts` distinguem a recusa do opcional como primeira decisão e como decisão após o automático. `PartySession.test.tsx` exercita os quatro cenários acordados.

| Roteiro com MSW | Resultado observado |
| --- | --- |
| Em `/grupo/party-trigger-anticipation-decline`, recuse. Em `/grupo/party-trigger-anticipation`, pague. | Recusar conservou 1 ouro e a Vida. Pagar consumiu 1 ouro e recuperou 1 de Vida uma vez. Ambos liberaram a continuação. |
| Em `/grupo/party-combat-reveal`, revele, recarregue durante a pausa inimiga e recuse. | O GET preservou `choice-1` e `passive-gold`. A recarga omitiu o lote anterior. O POST mostrou dano e início do turno de Lia nessa ordem. |
| Em saves novos de `/grupo/party-trigger-simultaneous`, resolva o automático primeiro ou pague/recuse o opcional primeiro. | Com o automático primeiro, o novo ID trouxe o opcional com `canPay: false` e apenas Recusar. Com o opcional primeiro, o automático restante foi resolvido na sequência. Ao pagar, o relatório mostrou a passiva antes do automático. |
| Em `/grupo/party-trigger-invalid`, envie a decisão sem o lote e simule a mesma recusa na tela após selecionar a carta. Em `/grupo/party-trigger-simultaneous`, consuma a segunda escolha por outro pedido e tente recusá-la na tela antiga. | O MSW devolveu `paymentInvalid` e `staleTriggeredEffectChoice`. Os GETs após as recusas devolveram o snapshot anterior, incluindo `savedAt`. A tela manteve a escolha confirmada e o lote anterior quando presente. Corrigir o pagamento permitiu continuar. |

Os cinco testes iniciais falharam na ausência do painel. Os oito testes finais do REQ-62 passaram. A suíte em `src` teve 825 aprovações e repetiu as falhas de importação de coleção (REQ-33) e busca com debounce (REQ-20) registradas no devlog 084. ESLint nos arquivos alterados, build de release com a guarda REQ-05 e `git diff --check` passaram. O Vite manteve o aviso de tamanho do bundle.

A T-67 aguarda a API real e os dados de teste. Ela cobre os cenários da FEAT-13, incluindo a persistência de estado, `savedAt` e RNG após recusas. O RNG real permanece pendente de validação.

Commit sugerido `feat/t-66 feat-13 resolve triggered effects`.
