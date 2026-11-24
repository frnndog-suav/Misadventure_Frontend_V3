# 098 — T-71, laboratório, catálogo e editor do Mercado (FEAT-16)

- Data — 2026-11-23
- Status — concluída com MSW
- Contrato — v0.81, FEAT-16 `implementado (BE)`, sem mudança
- Spec — REQ-71, REQ-72, D-62 item 9; spec v0.87
- Horas — null

## Entrega

- `LabPage.tsx`: `fieldErrorText` recebe a chave; `minAboveMax` de `marketFactorMinPercent`/`marketFactorMaxPercent` mostra "O fator mínimo do mercado não pode passar do máximo.". Os 37 rótulos e o texto de `sumMismatch` já vinham da T-70.
- Catálogo (`src/ui/cards/`): "Preço ×{n}" em atributo e item; "Preço de estoque", "Lote de" e "Coleção:" no item; bloco "Mercado" na zona. `CardName` foi para `parts.tsx` (com `PriceAdjust` e `CollectionName`) e a Carta de Dimensão passou a importá-lo.
- Editor (`CardForm.tsx`, `cardFormValues.ts`): "Ajuste de preço" no atributo e no item; "Preço de estoque", "Lote" e "Coleção do booster" no item; "Tem mercado", "Estoque" ("Carta {n}") e "Vende singles" na zona. Os campos "transportados" da T-70 viraram valores de formulário em texto.

## Verificação

- Testes novos: 3 em `LabPage.test.tsx`, `MarketFields.test.tsx` (10) e 9 em `CardForm.test.tsx`; 3 e2e (`lab.spec.ts` ×2, `card-form.spec.ts` ×1). Os de catálogo e editor falharam antes pelo motivo certo (campos ausentes). Os de laboratório foram escritos depois do ajuste de uma linha no `LabPage.tsx`: não vi o vermelho do texto do fator.
- Três testes antigos do editor comparavam o corpo exato e ganharam os campos novos (`priceMultiplier`, `market: null`, os 4 do item), porque o REQ-72 os envia sempre.
- Unitários de `src/lab`, `src/ui` e `src/features`: 555/555. Tipos, lint, guarda de `src/` e formato verdes.
- E2E com MSW em servidor próprio (porta 5174, `VITE_USE_MOCKS=true`): 34/36 nas áreas `lab` e `editor`. As 2 falhas já existiam: `card-form.spec.ts:144` e `cards.spec.ts:3` (mesmas da T-70).
- Atenção: o `playwright.config.ts` reaproveita qualquer servidor na 5173. Com o `.env.local` do autor (backend real em 3333), 16 testes de `lab`/`editor` falham, com e sem estas mudanças; com o MSW limpo, não.
