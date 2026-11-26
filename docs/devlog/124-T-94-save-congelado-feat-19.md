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

T-95, validação integrada da FEAT-19 com MSW desligado. Segundo o aviso do backend, a API ainda não oferece `completeDimension`, chefe final ou `frozen`. O backend entregará a URL e os IDs dos grupos após implementar e testar a FEAT-19. A validação segue pendente e usará os cenários do CONTRATO v0.96, seção FEAT-19, com os dados indicados no aviso.

## Commit sugerido

`feat/t-94 feat-19 handle frozen saves`
