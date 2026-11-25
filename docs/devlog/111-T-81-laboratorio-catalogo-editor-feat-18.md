# 111 — T-81, laboratório, catálogo e editor da montaria (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-82, REQ-83, D-64 item 9; spec v0.99
- Horas — a preencher

## Entrega

- Laboratório (REQ-82): os 7 rótulos da T-80 ficam fixados por testes (ordem, padrão e limites, `outOfRange`/`notInteger`). A "Doação" lista as cartas `mount` ("{nome} · Montaria"); "Já tem montaria." já existia e ganhou teste.
- Catálogo (REQ-83): `src/ui/cards/MountCard.tsx` (novo) com "Montaria", raridade, "Tipos: …", "Criatura: …", efeitos e habilidades; `FullCard` usa o componente. O bloco "Mercado" da zona ganha a lista "Estábulo" (some quando vazia).
- Editor (REQ-83): tipo "Montaria" em "Nova carta" e no filtro (sai o filtro provisório da T-80); `MountFields` em `CardForm.tsx`; lista "Estábulo" ("Montaria {n}", caminho `market.mounts.N`) dentro de "Tem mercado". Comentários provisórios da T-80 limpos.

## Decisões

- D-64 item 9: formato "{nome} · {tipo}" na doação (o "montaria" minúsculo do REQ-82 lido como o mesmo formato do REQ-46), ordem dos campos e posição do Estábulo.

## Verificação

- Testes novos: `MountCard.test.tsx` (7), 3 em `LabPage.test.tsx`, 2 em `GrantSection.test.tsx`, 7 em `CardForm.test.tsx`; mais 2 casos de montaria no `it.each` do `CatalogSection.test.tsx`. Os do REQ-82 nos rótulos e no `mountAlreadyOwned` já passavam (textos da T-80); os demais falharam antes pelo motivo certo.
- Testes alinhados ao REQ-83: `EditorPage.test.tsx` (9 tipos, "Montaria" por último, no filtro e no "Nova carta") e `tests/e2e/editor/cards.spec.ts` (9 tipos; `exact: true` no "Zona", que também casava "Missão de zona" — falha antiga da mesma linha).
- Unitários `src/lab src/ui src/features`: 695/695. Guarda, tipos, lint, `format:check` e `test:build` verdes.
- E2E com MSW (`lab`, `editor`, `party`) em servidor próprio na porta 5174 (config temporária, apagada): 72 de 73. A falha é a antiga `editor/card-form.spec.ts:143` ("Coisa boa" ambíguo).

## Problemas

- `editor/card-form.spec.ts:143` continua fora do escopo.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-81 feat-18 lab catalog and editor mount`
