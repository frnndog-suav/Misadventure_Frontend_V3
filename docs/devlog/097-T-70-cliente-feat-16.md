# 097 — T-70, cliente e fixtures MSW do Mercado (FEAT-16)

- Data — 2026-11-23
- Status — concluída com MSW
- Contrato — v0.81, FEAT-16 `implementado (BE)`, sem mudança
- Spec — REQ-71 a REQ-76, D-62 item 8; spec v0.86
- Horas — null

## Entrega

- `src/api/market.ts` (novo): schemas de `MarketView`, `MarketVisitResult`, `BoosterOpeningResult` e `MarketExpansion`; tipos `VisitMarketAction` e `MarketOperation`; campos do `PlayerState` com `.default()` nos valores legados.
- `src/api/parties.ts`: `visitMarket` na ordem do contrato (entre `takeTrialQuest` e `trainWithMentor`), `VisitMarketAction` na `PartyAction`, `openBooster` no Preparar e no cofre, os 8 motivos novos.
- `catalog.ts`: `priceMultiplier` em atributo e item; `stockPrice`, `stockQuantity` e `boosterCollectionId` no item; `market` na zona. `randomEvents.ts`: fonte `booster`. `labConfig.ts`: 37 chaves com padrões e limites, e `sumMismatch`.
- Exigidos pelo tipo: os 37 rótulos no `LabPage` (a T-71 confirma os textos) e o texto de `sumMismatch`; os 8 motivos novos no `switch` do `PartySession`, só com a `message`; "Abrir {nome}" na lista do cofre; o `cardFormValues` transporta os campos novos sem controles.
- MSW: `marketFixtures.ts` (novo) com os cenários do contrato, `handlers.ts` (formato, tabela do `visitMarket`, `openBooster` e os dois 400 do laboratório) e o grupo `party-com-booster`. A `fixture` ganhou Flechas e Booster de Teste (27 cartas, item 9), o mercado do Porto Cinzento e `visitMarket` nas fixtures da cidade. As fixtures fora do Porto têm `market: null`.

## Verificação

Os 20 testes iniciais de `src/api/market.test.tsx` falharam pelo motivo certo, porque a implementação ainda não existia. Depois da revisão, a tarefa terminou com 22 testes nesse arquivo.

Testes antigos foram alinhados aos cenários que o contrato v0.81 mudou: `visitMarket` na cidade, 27 cartas e item 9, o cenário de criação com os 4 campos novos e Porto Cinzento com `visitMarket`. Nenhuma asserção foi trocada por outro motivo.

- Suíte unitária: 909/909, em duas rodadas completas. O `LabPage.test.tsx` passava dos 5 s na suíte inteira (2 de 3 rodadas). O autor escolheu o prazo de 15 s no arquivo, sem mudar asserção.
- Tipos, lint, guarda de `src/`, `format:check` e `test:build` (laboratório fora do release) verdes.
- E2E com MSW: 66 de 68 passam. As 2 falhas já existiam antes desta tarefa, conferidas com as mudanças guardadas em `git stash`:
  - `editor/card-form.spec.ts:144` — o rótulo "Coisa boa" casa com 2 campos;
  - `editor/cards.spec.ts:3` — o teste espera 7 tipos de carta e há 8.
- `tests/e2e/lab/lab.spec.ts`: as contagens passaram a 27 cartas e "Item (9)". O 24 que estava lá já estava errado antes.
- Revisão do `spec-reviewer`: aprovada, sem bloqueantes. Aplicados: o cenário "Venda", as 2 expansões do cofre, os destinos do booster escritos literalmente, a oferta de venda do booster e o nome do teste. O `tcgFolderFull` do abrir booster fica para a T-73.

## Problemas do ambiente

- O servidor de dev do autor está aberto na porta 5173 com o backend real (`.env.development.local`). O `npm run test:e2e` reaproveita esse servidor e falha contra o backend. Por isso o e2e rodou com uma config temporária, fora do repositório: porta 5174 e `VITE_USE_MOCKS=true`.
- O navegador do Playwright estava ausente; foi reinstalado com `npx playwright install chromium`.
- O Vitest pelo Git Bash (`D:` maiúsculo) carrega o módulo duas vezes e não roda nenhum teste. Pelo PowerShell funciona.
- O `npm run format` também reformatou `AGENTS.md` e `scripts/generate-effects-schema.mjs`, fora do escopo. Separe-os do commit ou descarte essas mudanças.

## Commit sugerido

`feat/t-70 feat-16 market client and msw fixtures`
