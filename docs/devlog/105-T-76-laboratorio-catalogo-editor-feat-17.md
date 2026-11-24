# 105 — T-76, laboratório, catálogo e editor do ferreiro (FEAT-17)

- Data — 2026-11-24
- Status — concluída com MSW
- Contrato — v0.85, FEAT-17 `acordado`, sem mudança
- Spec — REQ-77, REQ-78, D-63 item 9; spec v0.93
- Horas — 0.25 (registro automático do dia menos as da T-75)

## Entrega

- Laboratório (REQ-77): os 19 rótulos já existiam em `LabPage.tsx` (T-75); a T-76 os fixa com testes (ordem, "Padrão: … · Mín. … · Máx. …", `outOfRange`/`notInteger`). Sem código novo.
- Catálogo (`src/ui/cards/`): blocos "Refino" ("Até +N", "Materiais por tentativa" ou "Sem materiais definidos.") e "Encantamento" ("Slot n: elemento|efeito[, a partir do refino +m]") em `EquipmentCard.tsx`; "Receita" em `ItemCard.tsx`; "Ferreiro" em `ZoneCard.tsx`. `Materials` ("{qtd}× {nome}") em `parts.tsx`; `enchantmentKindLabels` em `src/ui/labels.ts`.
- Editor: `cardFormValues.ts` (`MaterialForm`, `SlotForm`, `EnchantmentForm`; campos `recipe*` no item e `blacksmith*` na zona; conferência só de formato) e `CardForm.tsx` (`MaterialsField`, `AbilityFields` extraído, `EnchantmentFields`, `EffectFields` com `listPath`; "Slots", "Receita", "Tem ferreiro"). Zona e item agora enviam sempre `blacksmith` e `recipe` (`null` quando desligados).

## Decisões

- D-63 item 9 (spec). Em destaque: o rótulo do id do encantamento é "Identificador do encantamento {n}", porque "Identificador" repetido quebrava o `openCard` dos testes do Porto Cinzento. Os demais rótulos seguem a REQ-78 dentro do grupo "Encantamento {n}".
- Catálogo mostra do encantamento só o que o REQ-78 lista (efeitos e habilidades só no editor).
- REQ-10 e REQ-21 alinhados ao REQ-78.

## Verificação

- Testes novos: `BlacksmithFields.test.tsx` (10), 3 em `LabPage.test.tsx`, 15 em `CardForm.test.tsx`; 2 e2e (`lab.spec.ts`, `card-form.spec.ts`). Os do REQ-77 já passavam (rótulos da T-75): não houve vermelho. Catálogo e editor falharam antes pelo motivo certo.
- Testes antigos ajustados por mudança de spec: `EquipmentCard.test.tsx` ("Refinável até +5" → "Até +5", provider e MSW) e dois corpos exatos do `CardForm.test.tsx` (`blacksmith: null`, `recipe: null`).
- Unitários `src/lab src/ui src/features src/api`: 994/994 (PowerShell: `npx vitest run ...`). `typecheck`, `lint`, guarda de `src/`, `format:check` verdes.
- E2E com MSW em servidor próprio (porta 5174, `VITE_USE_MOCKS=true`, config temporária removida): `lab`, `editor`, `party` 64 de 66. As 2 falhas já existiam: `editor/card-form.spec.ts:143` e `editor/cards.spec.ts:3`.
- O teste e2e do editor não pode alterar o formulário antes de trocar de carta (a guarda de alterações pendentes abre diálogo).

## Problemas

- Um `GET /catalog/cards/` sem id aparece como aviso do MSW nos testes do editor (estoque de mercado vazio na pré-visualização); já ocorria antes e não falha teste.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-79.

## Commit sugerido

`feat/t-76 feat-17 lab catalog and editor blacksmith fields`
