# 123 — T-93, resultado do combate do chefe final (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-93, REQ-94 e D-65
- Horas — `null`

## Entrega

- `src/features/party/PartySession.tsx` e `src/features/party/CombatPanel.tsx` mantêm o resumo de combate da FEAT-13. Se a vitória do chefe final corresponde à dimensão concluída, “Ver conclusão da dimensão” abre o modal persistido e o foco passa para “Continuar”. A sequência também vale na reabertura quando o GET traz os dois resumos.
- Em fuga, derrota ou limite de ciclos, o relatório inclui “A dimensão não foi concluída. Você pode tentar de novo.”. A tela segue exibindo os itens e as ações recebidos do backend. Ao entrar em outro combate, o resultado anterior do chefe deixa de ocupar a área do relatório.
- `src/mocks/dimensionCompletionFixtures.ts` e `src/mocks/handlers.ts` fornecem os desfechos e a vitória persistida em cenários sem estado. `tests/e2e/party/party-session.spec.ts` cobre os quatro desfechos e a sequência na reabertura.

## Verificação

- Antes da implementação, os quatro testes de desfecho falharam como esperado. O modal já estava aberto junto com a vitória, e a mensagem faltava após os demais resultados.
- No Chromium com MSW, abra `/grupo/party-chefe-final`, use “Concluir dimensão (1 PA)” e ataque. A vitória mostra Pico +15. “Ver conclusão da dimensão” abre o painel com Pico +40 para Lia. “Continuar” deixa a Segunda Dimensão acessível.
- Caso de borda — abra `/grupo/party-chefe-final-fuga` e fuja, ou use “Encerrar turno de combate” em `/grupo/party-chefe-final-derrota` ou `/grupo/party-chefe-final-limite`. Confira o motivo, a mensagem de nova tentativa e os 3 Fragmentos. Use “Concluir dimensão” novamente e confira a abertura do combate.
- Em `/grupo/party-chefe-final-concluida`, a partida reaberta mostra primeiro a vitória. Ao abrir o painel de conclusão, “Continuar” recebe o foco.
- Passaram 50 cenários Playwright da área `party` em Chromium com MSW, em servidor Vite isolado, e 427 testes Vitest em nove arquivos (área `party` e clientes de ações e conclusão). Uma rodada anterior retornou erro de rede no cenário de ajuste de deck, que passou na repetição da suíte.
- Prettier e ESLint passaram nos arquivos TypeScript alterados. O build de release passou com o aviso de tamanho de chunk do Vite. `git diff --check` passou.

## Retomada

T-94, save congelado (REQ-95 e REQ-96), com E2E nas áreas `app` e `party`. A validação da FEAT-19 com a API real segue na T-95.

## Commit sugerido

`feat/t-93 feat-19 sequence final boss and dimension summaries`
