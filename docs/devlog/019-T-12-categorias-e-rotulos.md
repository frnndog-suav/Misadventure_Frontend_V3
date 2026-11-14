# 019 — T-12: Categorias e rótulos

- **ID:** T-12 · **FEAT:** FEAT-04 · **REQ:** REQ-04 · **Decisões:** D-28 · **Contrato:** §2, §2.7 (v0.11) · **Spec:** v0.19 → v0.20 · **Data:** 2026-11-14

## Objetivo

Preencher o catálogo de produção de categorias com os 8 `slot` e as 8 `itemCategory` (arte pendente) e criar os rótulos pt-BR dos demais identificadores do catálogo, para as cartas da T-13 e T-14.

## Decisões

- Rótulos em `src/ui/labels.ts`, um mapa por união, com `satisfies Record<União, string>`: valor sem rótulo ou rótulo sobrando vira erro de tipo.
- Os mapas cobrem exatamente o que a T-12 lista: tipo de carta, raridade, tipo de zona, classe, elemento, tipo/categoria/comportamento de inimigo. `attributeKind` e `polarity` ficam para as tarefas das cartas (T-13/T-14), que já têm os textos na spec.
- Categorias de `slot` e `itemCategory` no mesmo `categoryCatalog` (D-28); os ids não se repetem entre as duas uniões, conferido pelo `satisfies Record<EquipmentSlot | ItemCategory, …>`.

## Arquivos

- `src/ui/categories.ts` (16 categorias, arte pendente)
- `src/ui/labels.ts` (novo) e `src/ui/labels.test.ts` (novo)
- `src/ui/CardCategory.test.tsx` (teste D-28)

## Como verificar

`npx vitest run src/ui/` · `npm run typecheck` (apagar um rótulo de `labels.ts` gera erro de tipo).

## Checks

format, typecheck, lint, guarda, testes de `src/ui/` e `src/lab/` (54), `test:build`: verdes.

## Backend

Nenhuma dependência nova.

## Commit sugerido

`feat/catalog categories and labels`
