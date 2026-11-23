# 092 — Pico de conclusão de missão da FEAT-15

- Data — 2026-11-22
- Status — alinhamento do frontend com MSW. Validação integrada pendente.
- Contrato — v0.76, seção FEAT-15, recorte solo
- Spec — REQ-66 a REQ-70, retomada do devlog 091
- Horas — null

## Entrega

- `src/api/labConfig.ts` e `src/lab/LabPage.tsx` expõem `zoneQuestPeakGain` (3) e `genericQuestPeakGain` (5), ambos de 0 a 1000, no fluxo de consulta, edição, erro e reset do laboratório.
- `src/mocks/handlers.ts` e `src/mocks/questFixtures.ts` capturam os dois ganhos na inicialização do cenário de grupo e aplicam a recompensa de conclusão no POST de `finishQuest`. O quadro usa o ganho de zona do snapshot, a sequência usa dois ganhos explícitos de 3 e 4, e provação e mentor usam o ganho genérico. O encontro da sequência concede 2 de Pico em seu próprio desfecho.
- `src/api/quests.test.ts` e `src/lab/LabPage.test.tsx` cobrem os campos exibidos, limites, alteração atômica, reset, substituição do padrão, preservação do Vigor e persistência antes e depois da entrega de carta. O caso de borda usa ganho de zona zero capturado antes de restaurar os padrões.

## Verificação com MSW

- Os testes da API falharam inicialmente pela ausência dos campos e dos ganhos de Pico. Após o ajuste, a suíte completa passou com 885 testes em 40 arquivos. A checagem de tipos, o lint e `git diff --check` passaram.

## Validação integrada pendente

- O backend confirmou que a entrega final de zona passou na suíte unitária e que a implementação solo segue em andamento. A URL da API, os IDs das campanhas e o ID da coleção de teste serão entregues na T-60 do backend, após as verificações e a preparação das campanhas. A rodada integrada dos REQ-66 a REQ-70 aguarda esses dados e segue os roteiros dos devlogs 091 e 092.
- Em Google Chrome, abrir o frontend com MSW desligado. Entregar uma missão de zona sem ganho explícito e conferir o incremento do snapshot, com Vigor igual. Entregar outra com passos explícitos e verificar a soma em lugar do padrão, depois de conferir separadamente o Pico do encontro.
- Com recompensa de carta pendente, conferir o Pico e a missão removida já no POST de conclusão, no GET, ao reabrir a sessão e ao resolver a recompensa. Repetir a intenção de conclusão com PA disponível e conferir a recusa sem ganho adicional.
- Finalizar provação e mentor e conferir o ganho genérico e o Vigor. No laboratório, salvar os dois ajustes, verificar a recusa de um lote com valor fora da faixa e restaurar os padrões. Conferir que um grupo anterior ao reset preserva os valores capturados, inclusive quando o ganho de zona é zero.
