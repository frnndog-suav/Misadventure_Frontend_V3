# 080 — T-62, primeira rodada contra o backend real

**2026-11-20 · validação parcial · FEAT-12 · REQ-56 a REQ-59 · D-61**

## Ambiente e arquivos

Cópia integral do CONTRATO v0.58 e do ROADMAP v0.59, com SHA-256 conferido nos dois repositórios. `GET /health` em `http://localhost:3333` retornou `status: "ok"` e `contractVersion: "0.58"`. O catálogo serviu as quatro cartas indicadas. Playwright com Chrome, `VITE_USE_MOCKS=false`, service workers bloqueados e proxy temporário do Vite para a API real. Foram usados grupos temporários, removidos ao final de cada tentativa.

## Cenários aprovados

| Cenário | Resultado esperado e observado |
| --- | --- |
| Antecipação e revelação | Iniciar gasta 1 PA e retorna `card: null`. Encerrar a vez recebe `409 choicePending`. Após recarga, Revelar carta abre o Viajante Ferido. A segunda recarga conserva o encontro revelado. |
| Pagamento | Entregar uma Poção de Cura pelo formulário conclui o encontro com êxito, registra uma cópia no recibo e persiste o resultado após recarga. |
| Desistência | Desistir e confirmar encerra o encontro com causa `gaveUp`. |
| Fuga | Confirmar fuga custa 2 de Vigor. A rolagem observada de 7 ficou abaixo do limiar 10, aplicou revés e perdeu 1 PA corrente, com dívida zero. |
| Vasculhar com inventário cheio | Com dez Varas de Pesca, Vasculhar Peixe Prateado gasta 1 PA, retorna `delivery: pending` e abre recompensa do deck da zona. A escolha reaparece após recarga. Manter sem descarte recebe `409 rewardDoesNotFit`. Deixar devolve ao deck e muda a entrega para `left`. Repetir a escolha recebe `409 staleReward`. |

A primeira tentativa do roteiro precisou incluir as confirmações de fuga e desistência e ler a origem da ação em `source.type`. A segunda execução passou nos quatro roteiros. Nenhuma divergência funcional foi constatada nesses fluxos.

## Pendências

Os dados do catálogo permitem os fluxos acima. Para concluir a T-62, faltam os estados iniciais determinísticos da seção FEAT-12 que não são fornecidos pela API de jogo, incluindo pagamentos parciais e reversão com RNG preservado, cópias duplicadas, fuga no limiar e dívida, decks controlados e recompensas de outras origens. Os casos de relógio multiplayer seguem a FEAT-26. A FEAT-12 continua pendente de validação integral.

