# 020 — T-13: Cartas de atributo, equipamento e item

- **ID:** T-13 · **FEAT:** FEAT-04 · **REQ:** REQ-09, REQ-10, REQ-11 (e REQ-03 ampliado) · **Decisões:** D-30 · **Contrato:** §2, §3 FEAT-04 (v0.11) · **Spec:** v0.20 → v0.21 · **Data:** 2026-11-14

## Objetivo

Componentes que exibem as cartas `attribute`, `equipment` e `item` como o backend as manda, para a seção "Catálogo" do laboratório (T-15) e as telas das FEATs seguintes.

## Decisões

- **Modificadores como termo do jogo:** a regra comum dos REQ-09 a 13 pede atributos e modificadores com tooltip (REQ-03), mas o catálogo de termos só tinha os 9 atributos. O autor escolheu acrescentar os 7 modificadores com textos resumidos do README 7.1 (alternativas: o autor escrever os textos; texto simples sem tooltip). `termCatalog` agora tem `satisfies Record<Attribute | Modifier, TermEntry>`.
- O teste do REQ-03 que conferia "só os 9 atributos" foi atualizado para 9 + 7 (mudança de spec aprovada, não ajuste para passar). A vitrine do laboratório (REQ-07 pede os 9 atributos) passou a iterar `attributeSchema.options` em vez de todas as chaves de `termCatalog`.
- Cada carta é um `article` com o nome em `h3`; listas rotuladas por `aria-label` ("Atributos", "Modificadores", "Etiquetas", "Classes", "Habilidades", "Efeitos") somem quando vazias — nada de "—" ou "Nenhum".
- Números: só formatação pt-BR em `src/ui/cards/format.ts` (`Intl.NumberFormat('pt-BR')`, sinal "+"/"−" tipográfico). "Preço ×1" aparece mesmo com multiplicador 1 (o REQ-10 lista o ajuste de preço como sempre presente). Separado de `parts.tsx` porque o ESLint (`react-refresh/only-export-components`) não aceita funções e componentes no mesmo arquivo.
- `attributeKindLabels` entrou em `src/ui/labels.ts` (anunciado na T-12).
- CSS mínimo só com tokens (`cards.css`); o acabamento visual fica para a `/visual`.

## Arquivos

- Novos: `src/ui/cards/AttributeCard.tsx`, `EquipmentCard.tsx`, `ItemCard.tsx`, `parts.tsx`, `format.ts`, `cards.css` e os testes `AttributeCard.test.tsx`, `EquipmentCard.test.tsx`, `ItemCard.test.tsx` (fixtures do MSW + fixtures extras só nos testes: sinérgica, aprimorada, equipamento completo).
- Alterados: `src/ui/terms.ts` (+7 modificadores), `src/ui/Term.test.tsx`, `src/ui/labels.ts`, `src/lab/LabPage.tsx`, `docs/SPEC-FRONTEND.md` (D-30, T-13 [x], v0.21).

## Como verificar

Ainda não há tela com as cartas (entram no laboratório na T-15). Comandos:

```
npx vitest run src/ui src/lab
npm run typecheck
npm run lint
npx playwright test tests/e2e/lab
```

## Problemas

- Lint `react-refresh/only-export-components` em `parts.tsx` → formatação movida para `format.ts`.

## Checks

format, typecheck, lint, guarda (`client-guard --all`), Vitest `src/ui` + `src/lab` (64 passaram), e2e `lab` (2 passaram), `test:build` (REQ-05 ok): verdes.

## Backend

Nenhuma dependência nova (usa os tipos do CONTRATO v0.11 `acordado`).

## Commit sugerido

`feat/attribute equipment and item cards`
