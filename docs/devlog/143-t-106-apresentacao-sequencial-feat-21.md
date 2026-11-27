# 143 — Apresentação sequencial das vezes dos ajudantes

- Data — 2026-11-27
- Status — T-106 concluída com MSW
- Horas — null

A T-106 implementa REQ-107 e REQ-108 conforme D-67 e o CONTRATO v1.13, a partir do registro 142.

- `PartySession.tsx` usa o lote da abertura, retomada ou ação e libera as ações após concluir ou pular, de acordo com o estado confirmado e a vez humana. Respostas sem acontecimentos entram direto na partida. As transições já apresentadas pelo lote automático são retiradas do relatório de combate por índice, preservando as demais.
- `HelperPresentation.tsx` apresenta um acontecimento a cada 1,5 s na ordem recebida, com ajudante e rodada. `PartyMap.tsx` mostra o percurso e a posição de chegada durante o movimento na dimensão atual. `combatUpdateText.ts` compartilha a descrição das transições com `CombatPanel.tsx`.
- `helperPresentationFixtures.ts` e `handlers.ts` fornecem lotes mistos na abertura e no fim de vez. `helper-presentation.spec.ts` verifica o fluxo no Chromium com MSW.

## Verificações

- REQ-107 — na abertura e após encerrar a vez, a sequência mostra o movimento no mapa, a antecipação e a carta revelada, seguidos pelo início, turno e encerramento do combate. Ao terminar, o relatório não repete as transições automáticas e a ação da vez humana fica disponível.
- REQ-108 — o fim de vez fica desabilitado enquanto o POST está em curso. Durante a apresentação, pressionar Enter não dispara outro POST. Pular exibe a partida confirmada e libera o fim da vez.
- E2E de `party` — 55 passaram, incluindo os dois novos cenários. O frontend de teste foi iniciado em porta separada com MSW habilitado por variável de ambiente. A primeira execução reutilizou a configuração local, que desabilita MSW, e falhou por indisponibilidade da API antes de exercitar os critérios.
- Vitest da área de grupo e da API de partidas — 451 passaram. Checagem de tipos, ESLint dos arquivos TypeScript alterados e `git diff --check` passaram.

A T-107 cobre recuperação, deduplicação e descarte de recibos antigos. A T-108 cobre os cenários do contrato com a API real.
