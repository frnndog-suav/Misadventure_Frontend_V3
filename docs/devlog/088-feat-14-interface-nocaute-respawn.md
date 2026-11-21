# 088 — Interface de nocaute e respawn da FEAT-14

- Data — 2026-11-21
- Status — interface concluída com MSW
- Retomada — devlog 087, T-68
- Contrato — v0.69, FEAT-14 acordada
- Spec — REQ-63 a REQ-65
- Horas — null

## Entrega

- `src/features/party/PartySession.tsx` oferece **Salvar ponto de respawn** pela projeção da vez. O pedido leva apenas o tipo da ação. A tela mostra a mensagem de recusa da API e conserva o último estado confirmado.
- A ficha do membro exibe queda, espera por recompensa, perda da próxima vez quando projetada e resumo persistido do último nocaute. Vida, Pico, Vigor, bolsa, cofre e vez jogável continuam vindo do estado da API. A resolução de recompensas usa o fluxo existente.
- `src/lab/LabPage.tsx` exibe os cinco ajustes de nocaute com os valores, limites e padrões retornados pela API. Salvar e restaurar reutilizam o formulário e o tratamento de erros por campo.
- `src/features/party/PartySession.test.tsx` e `src/lab/LabPage.test.tsx` cobrem a interface com as fixtures da T-68. O cenário de recusa intercepta a resposta para simular uma projeção que ficou desatualizada entre a exibição do botão e o envio.

## Verificação

A primeira execução confirmou a ausência do botão, da indicação de queda, do resumo e dos campos do laboratório. Após a implementação, passaram os oito casos novos e os 331 testes dos sete arquivos afetados. Passaram também `npm run typecheck`, `npm run lint`, a checagem de formatação dos arquivos TS/TSX, `git diff --check` e `npm run test:build`. O Vite emitiu um aviso de tamanho do bundle.

| Requisito | Cenário reproduzido pelos testes | Resultado esperado |
| --- | --- | --- |
| REQ-63 | Sair de Porto Cinzento, mover para Vila do Retorno, salvar, receber uma recusa, repetir e reabrir. | A cidade inicial e o ponto original aparecem ao entrar. A primeira gravação deixa 1 PA. A recusa preserva o saldo e o ponto. Repetir deixa 0 PA, oculta a ação e o ponto permanece visível ao reabrir. |
| REQ-64 | Sofrer derrota, doação fatal no evento ou fora de combate e Reflexão fatal. | Mostrar retorno, PV recuperados, perdas e a vez projetada. No exemplo da doação no evento, a bolsa fica em 29, o cofre em 80 e a rodada avança para 8. A doação fora de combate expira o status e libera a habilidade projetada. |
| REQ-64 | Fechar e reabrir a sessão durante a escolha após Reflexão ou após queda seguida de cura comum. | O membro continua caído com 0 PV. Resolver a escolha mostra o respawn e libera a vez jogável. Recarregar após o respawn mantém o resumo e os saldos. |
| REQ-65 | Consultar, salvar e restaurar. Como caso de borda, salvar vida de respawn em 0% e espera de 1,5 rodada. | Cada erro aparece junto ao campo correspondente. Uma edição válida de espera para 0 é aceita e a restauração volta ao padrão 1. |

## Retomada

A interface está pronta com MSW. A validação integrada aguarda a URL do backend com dados compatíveis com os cenários de referência do CONTRATO v0.69. Validar em frontend com MSW desligado e registrar os resultados antes de marcar a FEAT-14 como validada. A validação real do nocaute em grupo depende das FEATs 20 e 22. A spec lista a T-68 como a última tarefa numerada da FEAT-14.
