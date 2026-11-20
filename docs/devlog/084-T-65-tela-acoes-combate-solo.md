# 084 — T-65, tela e ações de combate solo

**2026-11-20 · concluída com MSW · REQ-61 · CONTRATO v0.64 · SPEC v0.78**

Retomada do registro 083.

- `src/features/party/CombatPanel.tsx` apresenta participantes, ordem, ciclo, fase, ataques restantes e ações projetadas. Monta o pagamento por custo, agrega recursos do mesmo ID e envia cada cópia da mão e cada slot uma vez. Custos automáticos aparecem como instruções. A confirmação do gasto e do estado vem da API.
- `src/features/party/PartySession.tsx` conecta o painel e as habilidades de Preparar ao POST de ações, exibe o lote na ordem recebida e restaura o snapshot sem repetir transições. Reutiliza a escolha de recompensa da sessão mesmo quando a vitória derruba o jogador.
- `src/mocks/combatFixtures.ts`, `src/mocks/handlers.ts` e `src/features/party/PartySession.test.tsx` fornecem cenários solo e verificações de tela e payload.

| Roteiro com MSW | Resultado observado |
| --- | --- |
| Abra `/grupo/party-combat-solo`, revele a carta e ataque o lobo. | A tela mostra turno, ordem, participantes e ações. Dano e Reflexão vêm antes do encerramento. A vitória mantém a recompensa pendente após recarregar com o jogador caído. Deixar conclui a escolha. |
| Abra `/grupo/party-combat-active` e use a habilidade ou ative o efeito em saves equivalentes. | O POST leva IDs do combate, turno e opção. A habilidade inclui o alvo projetado. O efeito de alvo fixo omite esse campo. Recarregar preserva as opções restantes e o turno, sem repetir o lote do POST. |
| Em saves novos de `/grupo/party-combat-active`, fuja ou encerre o turno. | A fuga confirma gasto de Vigor e perda de Pico. O fim do turno permite a resposta inimiga e confirma derrota. |
| Abra `/grupo/party-combat-prepare` com 0 PA e selecione a cópia da mão, o slot e uma unidade de minério em cada custo de recurso. | O formulário só habilita o envio com a seleção completa. O POST leva duas unidades agregadas e o snapshot confirma o gasto. |
| Revele em `/grupo/party-combat-immediate`. Simule também uma recusa de ataque após uma revelação normal. | O lote de vitória imediata identifica os participantes com os dados do início, mesmo com `combat: null`. A recusa conserva o turno, o botão de ataque e o lote confirmado. |

A primeira execução dos testes novos mostrou a ausência dos cenários solo. A execução final direcionada passou com 227 testes em três arquivos. Lint, build de release com a guarda REQ-05 e `git diff --check` passaram. A suíte completa teve 835 testes aprovados e repetiu as duas falhas preexistentes do devlog 083, importação de coleção (REQ-33) e busca com debounce (REQ-20). O Vite manteve o aviso de tamanho do bundle.

A T-66 retoma as escolhas de efeitos disparados (REQ-62). A T-67 cobre a integração com a API real, incluindo persistência, RNG e demais cenários determinísticos do contrato.

Commit sugerido `feat/t-65 feat-13 play solo combat`.
