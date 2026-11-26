# 119 — T-89, cliente e fixtures MSW da conclusão da dimensão (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-90 a REQ-96, D-65 item 6
- Horas — `null`

## Entrega

- `docs/CONTRATO.md` e `docs/ROADMAP.md` sincronizados com as versões v0.96 e v0.87 do backend. O hash confirmou que `docs/README.md` já estava idêntico, incluindo B.20 e B.21.
- `src/api/catalog.ts`, `parties.ts`, `combat.ts`, `randomEvents.ts` e `labConfig.ts` leem os dados de conclusão, preservam os padrões do legado, aceitam `completeDimension`, os novos motivos de recusa e `grandPrize`. A abertura de save congelado usa o envelope de erro existente e mantém o código `PARTY_FROZEN`.
- `src/mocks/dimensionCompletionFixtures.ts`, `catalogFixtures.ts`, `fixtures.ts` e `handlers.ts` fornecem o Fragmento, a Carta de Dimensão com e sem chefe e saves estáticos para o limiar de conclusão, a passagem e o congelamento. A segunda dimensão reutiliza o mapa de teste. O resultado persistido é exercitado em um save próprio, conforme o MSW sem estado da D-65.
- Ajustes de tipagem nos consumidores e nas fixtures anteriores. O editor transporta os campos de conclusão ao editar uma carta e mantém o contrato existente de erros `{ path, message }`. Os controles do editor e o restante da interface da FEAT-19 seguem nas tarefas previstas.

## Verificação

- A suíte de `src/` passou com 1.172 testes em 50 arquivos. A execução inicial pelo comando padrão incluiu automaticamente um arquivo de testes da pasta `.claude/`. A verificação final usou o filtro explícito `src/`.
- Os 23 cenários E2E de app e laboratório passaram em Chromium com MSW. Tipos, lint, formatação dos arquivos TypeScript alterados e build de release passaram.
- Os três testes iniciais falharam antes das mudanças. `src/api/dimensionCompletion.test.ts` passou com nove testes após a implementação.
- Cenários com MSW exercitados pelo cliente: doar três Fragmentos preserva o inventário, concluir projeta a próxima dimensão e o resumo, abrir o cenário do chefe produz combate com `finalBoss: true` e abrir o save congelado devolve 409 `PARTY_FROZEN`.
- Caso de borda: a cópia de prêmio pendente preserva `grandPrize` com o ID da dimensão de origem. O editor preserva o caminho do campo e o texto retornado.

## Retomada

T-90, laboratório, catálogo e editor da conclusão (REQ-90 e REQ-91). A validação com o backend real segue na T-95 após a implementação do backend.

## Commit sugerido

`feat/t-89 feat-19 dimension completion client and msw fixtures`

