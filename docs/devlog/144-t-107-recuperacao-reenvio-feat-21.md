# 144 — Recuperação e reenvio das vezes dos ajudantes

- Data — 2026-11-27
- Status — T-107 concluída com MSW
- Horas — null

A T-107 continua o registro 143 e implementa o REQ-109 conforme D-67 e o CONTRATO v1.13, seção FEAT-21.

- `PartySession.tsx` guarda o UUID da abertura antes do envio em `sessionStorage`, por API e save, e o reutiliza após perda da resposta. Uma nova abertura intencional usa outro UUID. A ação mantém a chave e o corpo originais no reenvio.
- `parties.ts` reutiliza a leitura de `Party` para conferir a revisão antes de aceitar um recibo recuperado. A tela preserva a revisão mais recente conhecida, descarta os lotes dos recibos antigos e conserva a possibilidade de reenvio se a confirmação falhar.
- A apresentação registra os IDs consumidos enquanto a tela está montada. Concluir ou pular consome o lote apresentado, e o relatório continua a omitir as transições automáticas pelo índice do lote original.

## Verificações

- `PartySession.test.tsx` — cinco cenários MSW para REQ-109. Cobrem abertura recuperada com a mesma chave após remontagem, ação retomada via sessão e reenviada com chave e corpo idênticos, deduplicação após pular a apresentação e descarte de recibos antigos de abertura e ação. O caso de borda com revisão zero usa o estado corrente do GET e descarta as transições históricas.
- Vitest da área de grupo e da API — 798 testes passaram em 26 arquivos.
- Playwright da área de grupo — 55 testes passaram no Chromium com MSW habilitado em porta separada. Checagem de tipos, ESLint dos arquivos alterados e `git diff --check` passaram.

A T-108 aguarda a API real e os dados para os seis cenários do contrato, incluindo a medição do tamanho do lote e da duração da resposta com cinco ajudantes.
