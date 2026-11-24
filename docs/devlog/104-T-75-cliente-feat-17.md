# 104 — T-75, cliente e fixtures MSW do ferreiro (FEAT-17)

- Data — 2026-11-24
- Status — concluída com MSW
- Contrato — v0.85, FEAT-17 `acordado`, sem mudança
- Spec — REQ-77 a REQ-81, D-63 item 8; spec v0.92
- Horas — 1.50 (dia inteiro, com o planejamento)

## Entrega

- `src/api/blacksmith.ts` (novo): `EquipmentState`, `AppliedEnchantment`, `EquipmentTarget`, `ServiceView`, `BlacksmithView`, `BlacksmithVisitResult`, campos do `PlayerState` com `.default()` legados, tipos `VisitBlacksmithAction`, `ArtificerWorkshopAction`, `BlacksmithOperation`.
- `catalog.ts`: `MaterialRequirement`, `BlacksmithEnchantment`; `refinement.materials` em lista, `enchantment` com `slots`, `recipe` no item, `blacksmith` na zona.
- `parties.ts`: `equipmentState?` no slot do inventário e do cofre; `artificerWorkshop` e `visitBlacksmith` na ordem do contrato; 16 motivos novos. `market.ts`: `inventorySlotIndex?`/`equipmentState?` nas ofertas e no `sell`. `labConfig.ts`: 19 chaves.
- Exigidos pelo tipo (padrão D-62 item 8): rótulos do laboratório, motivos no `switch` do `PartySession` só com a `message`, editor transportando os campos novos sem controles (saíram "Materiais" e "Texto do encantamento"), `EquipmentCard` só com "Refinável até +N".
- MSW: `src/mocks/blacksmithFixtures.ts` (novo) com `party-ferreiro` e `party-artifice`; handlers de formato e tabela do lote; a `fixture` ganhou Fragmento de Brasa e Projeto: Espada Curta (29 cartas, item 11), o ferreiro do Porto Cinzento, refino e encantamento da Espada Curta; `visitBlacksmith` nas fixtures da cidade; `equipmentState` padrão no equipamento das fixtures; `blacksmith: null` fora do Porto.

## Verificação

- `src/api/blacksmith.test.tsx`: 19 de 20 falharam pelo motivo certo antes da implementação; o que passava foi corrigido para conferir o schema. Fim: 20/20.
- Testes antigos alinhados aos cenários que o contrato v0.85 muda (cidade com `visitBlacksmith`, 29 cartas, `equipmentState`, materiais em lista). Nenhuma asserção trocada por outro motivo.
- Unitários 979/979 (PowerShell: `npx vitest run src`). Tipos, lint, guarda, `format:check`, `test:build` verdes.
- E2E com MSW (`$env:VITE_USE_MOCKS='true'; npx playwright test tests/e2e/lab tests/e2e/editor tests/e2e/party`): 61 de 63. As 2 falhas já existiam no `HEAD` (conferido com `git stash`): `editor/cards.spec.ts:3` e `editor/card-form.spec.ts:144`.
- `LabPage.test.tsx`: o teste do REQ-65 passou dos 5 s na suíte inteira; o `vi.setConfig` de 15 s foi para o topo do arquivo (só prazo).
- Revisão `spec-reviewer`: sem divergência do contrato. Mantidos, com registro na D-63: a resposta "Venda valorizada" ao `unequip` no `party-ferreiro` (cenário do contrato) e o fallback do lote não reconhecido (padrão do mercado).

## Problemas

- Contrato v0.85, cenário "Lote com falha e quebra": o pedido lista 5 operações, a descrição traz 6 resultados (o último `skipped`). MSW e teste seguem a descrição; conferir com o backend na T-79.
- Vitest pelo Git Bash não roda (mesmo problema do devlog 097); usar PowerShell.

## Backend

Nenhuma dependência nesta tarefa.

## Commit sugerido

`feat/t-75 feat-17 blacksmith client and msw fixtures`
