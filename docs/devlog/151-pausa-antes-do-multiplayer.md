# 151 — Pausa antes do multiplayer online

**ID** DOC · **FEAT** FEAT-30, FEAT-29 e Momento 3 (FEAT-25 a FEAT-28) · **Data** 2026-11-27 · **Status** concluída · **Horas** `null`

O [roadmap v1.07](../ROADMAP.md) e o [manual de desenvolvimento](../README.md) determinam a pausa nos dois repositórios. O `AGENTS.md` aplica a pausa à escolha da próxima tarefa no frontend. O Momento 2 termina com o acabamento visual (FEAT-30) seguido do executável Tauri (FEAT-29), conectado ao servidor remoto. Após a validação, o autor recebe a versão para um humano com IA e o roteiro de teste da campanha, da criação do save à conclusão da dimensão. A implementação e o trabalho preparatório do Momento 3 ficam bloqueados até a autorização explícita do autor, após o teste e eventuais ajustes.

O [painel de progresso](tempo.html#titulo-estimativas) inclui o acabamento e o executável na estimativa até o teste e identifica o multiplayer como trabalho posterior à autorização.

**Verificação** Comparação SHA-256 das cópias integrais do roadmap e revisão da ordem das FEATs, da regra de retomada e das referências do painel. `git diff --check` sem erros. Sem alterações na aplicação ou no contrato.

**Ponte com o backend** O frontend recebeu a cópia integral do `docs/ROADMAP.md` v1.07 do backend. O autor leva a revisão de 2026-11-27 do `docs/README.md` para alinhar a seção III.4 e o fluxo de retomada do backend.
