# 124 — T-94, save congelado (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-95, REQ-96 e D-65
- Horas — `null`

## Entrega

- `src/features/home/SavedGames.tsx` mantém “Abandonar” e oculta “Continuar” quando a lista retorna `frozen`.
- `src/features/party/PartySession.tsx` oferece “Voltar ao início” após `PARTY_FROZEN`. A área de status usa a mensagem recebida.
- `src/mocks/dimensionCompletionFixtures.ts` oferece um cenário sem estado para a publicação posterior. O save aparece `idle` e o POST de sessão devolve a Segunda Dimensão já preparada.
- Os testes em `tests/e2e/app/app.spec.ts` e `tests/e2e/party/party-session.spec.ts` cobrem a lista, a retomada após publicação e o acesso direto recusado. O E2E existente do REQ-95 verifica o retorno com “Save congelado.”.

## Verificação

- Antes da implementação, o Chromium com MSW mostrou “Continuar” no save congelado, a recusa sem link de volta e a ausência do cenário descongelado.
- Em `/`, “Save congelado” deve exibir “Congelado · aguardando a próxima dimensão” e permitir abrir a confirmação de abandono. “Save descongelado” deve aparecer como “Pausado” e abrir a Segunda Dimensão ao continuar.
- Caso de borda — abra diretamente `/grupo/party-congelado`. Confira a mensagem de congelamento e use “Voltar ao início”.
- Passaram os 63 E2E de `app` e `party` em Chromium com MSW e Vite isolado, e os 9 testes Vitest do cliente de conclusão. Typecheck, ESLint, Prettier e `git diff --check` passaram.

## Retomada

T-95, validação integrada da FEAT-19 com MSW desligado. O contrato está acordado na v0.96. A próxima etapa do backend é planejar os requisitos e as tarefas na SPEC-BACKEND. A T-95 aguarda a implementação e os testes do backend.

Quando a API estiver pronta para a validação integrada, o backend enviará a URL, os IDs dos grupos preparados para os três cenários e o procedimento para publicar `fixture-next`. No cenário de congelamento, confirme primeiro o `409 PARTY_FROZEN` e só então siga o procedimento de publicação para verificar o descongelamento conforme a seção FEAT-19 do CONTRATO v0.96.

## Sincronização do contrato v0.98

- Horas — `null`
- `docs/CONTRATO.md` foi copiado integralmente do backend. Os hashes SHA-256 coincidem.
- `src/mocks/dimensionCompletionFixtures.ts` e `src/api/dimensionCompletion.test.ts` usam `fixture-next.next-dimension`, o mesmo ID do preparador de campanhas da FEAT-19 no backend.
- A expectativa do REQ-93/REQ-95 falhou com o ID anterior. Após o ajuste, passaram os nove testes do cliente com MSW, o typecheck e `git diff --check`. Os cenários E2E foram conferidos pela leitura das expectativas de nome.
- A verificação local das campanhas da T-86 no backend e a validação integrada da T-95 no frontend seguem pendentes. No cenário de publicação posterior, o save congelado deve recusar a retomada com `409 PARTY_FROZEN` antes da publicação e abrir na Segunda Dimensão após a publicação.

## Commit sugerido

`feat/t-94 feat-19 handle frozen saves`
