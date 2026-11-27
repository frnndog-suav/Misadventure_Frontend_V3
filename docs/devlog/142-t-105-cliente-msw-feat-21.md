# 142 — Contrato v1.13 e cliente com MSW

- Data — 2026-11-27
- Status — cliente verificado com MSW
- Horas — null

`docs/CONTRATO.md` foi sincronizado integralmente do backend. Os dois arquivos têm o mesmo SHA-256. A FEAT-21 consta como acordada com os seis cenários da v1.12.

`src/api/parties.ts` valida revisões e acontecimentos públicos, preserva a ordem recebida e confere o vínculo entre o acontecimento de combate e o item indexado no lote de ação. A abertura aceita um UUID fornecido pelo chamador. `src/api/http.ts` envia o cabeçalho mesmo quando a requisição não tem corpo. O cliente ainda aceita as projeções anteriores à FEAT-21 usadas pelas fixtures existentes.

`src/api/parties.test.tsx` exercita os seis cenários na camada HTTP com MSW.

1. Abertura solo e com humano em primeiro, com lote vazio e GET sem lotes.
2. Ordem e conteúdo dos acontecimentos em lote misto, incluindo o índice após a atualização humana. O cliente rejeita índice fora do lote.
3. Ajudantes consecutivos cruzando a virada de rodada e resposta final na vez humana.
4. Falha de rede seguida do reenvio da chave e do corpo originais, incluindo respostas equivalentes em aberturas paralelas.
5. Recibo anterior, revisão superior no GET, lote vazio com nova chave e revisão zero no recibo legado.
6. Contextos de origem e sucessora, recibo de abertura congelado e erro 409 para nova abertura.

Os seis testes falharam antes da implementação. Após o ajuste, passaram a suíte geral (1.217 testes), a suíte da API após o refinamento das fixtures (428 testes), a checagem de tipos e o ESLint dos arquivos TypeScript alterados. O `git diff --check` também passou.

A T-106 cobre a apresentação, a opção de pular e o bloqueio de ações. A T-107 cobre a recuperação na interface, incluindo a persistência do UUID da abertura, a deduplicação e o descarte de recibo antigo. A T-108 fica para depois da implementação no backend, com os seis cenários e a medição com cinco ajudantes.
