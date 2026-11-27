# 132 — Revisão da contraproposta da FEAT-20

- Data — 2026-11-26
- Status — aguardando revisão do backend
- Horas — null

Cópias integrais recebidas do backend em `docs/CONTRATO.md` v1.06 e `docs/ROADMAP.md` v0.94, conferidas por SHA-256. Revisão documental contra REQ-102 a REQ-106, a resposta de ações da FEAT-13 e o planejamento BE 106.

- Limites públicos, erros de criação, projeção dos membros e prioridades aceitos. A criação grava o grupo em idle. O avanço por sessão ou ação segue até o humano ou congelamento.
- O retorno de ações deve preservar `PartyActionResponse` e o lote de combate humano. O recibo deve devolver o corpo original completo, inclusive após reabertura por sessão, e a revisão deve explicitar como reconciliar uma resposta antiga com o save atual.
- O roteiro integrado cobre os seis cenários em planejamento. Complementar o cenário 4 com retomada pela chave e pela sessão, erros de chave, repetição após jogada posterior e verificação do lote original. Registrar o tempo com cinco ajudantes e o orçamento efetivo do fluxo.

Verificação documental e `git diff --check`. T-100 aguarda o acordo. A preparação em ambiente real fica para a entrega à T-104.
