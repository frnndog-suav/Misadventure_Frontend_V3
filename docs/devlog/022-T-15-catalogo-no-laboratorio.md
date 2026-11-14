# 022 — T-15: Seção "Catálogo" no laboratório

- **ID:** T-15 · **FEAT:** FEAT-04 · **REQ:** REQ-08 · **Decisões:** D-26, D-33 · **Contrato:** §3 FEAT-04 (v0.11, `implementado (BE)` na v0.12) · **Spec:** v0.23 → v0.24 · **Roadmap:** v0.16 → v0.17 · **Data:** 2026-11-14

## Objetivo

Mostrar o catálogo de cartas em `/lab`: coleções, filtro por tipo (pedido ao backend com `?type=`), lista na ordem recebida e a carta escolhida no componente do seu `type` (T-13, T-14). Fecha o lado FE da FEAT-04 com MSW.

## Decisões

- **D-33 (autor):** rádios "Coleção" (primeira já escolhida) e "Tipo de carta" ("Todos" de início, contagem no rótulo: "Zona (1)", "Todos (6)" com a soma de `cardCounts`); cartas como lista "Cartas" de botões "{nome} · {tipo}" com `aria-pressed`; carta completa ao lado. Descartadas: `<select>` (esconde as contagens) e nenhuma coleção pré-escolhida.
- Trocar coleção ou tipo remonta a lista (`key`) e limpa a carta escolhida.
- O Catálogo tem a própria área de status (`role="status"`). Como agora há duas na página, os testes do REQ-06 (unitários e e2e) passaram a buscar a área de status **dentro da região "Configuração"** — mesmas expectativas, só o escopo da busca mudou.
- Nome da carta e componente por `switch` exaustivo no `type` (`never`).

## Arquivos

- Novos: `src/lab/CatalogSection.tsx`, `src/lab/CatalogSection.test.tsx`.
- Alterados: `src/lab/LabPage.tsx` (inclui a seção), `src/lab/LabPage.css` (layout da lista ao lado da carta), `src/lab/LabPage.test.tsx` e `tests/e2e/lab/lab.spec.ts` (escopo da área de status; e2e do REQ-08), `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md` (FEAT-04 FE `pronto`).

## Como verificar

`npm run dev` com mocks ligados, abrir `http://localhost:5173/lab`: seção "Catálogo" com "Coleção de Teste" marcada, 7 opções de tipo com contagem, 6 botões de carta; escolher "Zona (1)" deixa só "Bosque Sussurrante · Zona"; clicar mostra a carta ao lado.

Comandos: `npx vitest run src/lab` · `VITE_USE_MOCKS=true npx playwright test tests/e2e/lab`.

## Problemas

- O e2e da área `lab` falhou até no código anterior (REQ-06 com "Servidor indisponível"): o `.env.development.local` do autor (não lido) parece desligar os mocks, e o Playwright sobe `npm run dev` com ele. Rodando com `VITE_USE_MOCKS=true` no ambiente (que tem prioridade sobre os `.env`), os 5 e2e passam.

## Checks

format, guarda (`client-guard --all`), typecheck, lint, format:check, `vitest related` de `src/lab` (35 passaram, 16 novos do REQ-08), `test:build` (REQ-05 ok), e2e `lab` com mocks (5 passaram): verdes.

## Backend

FEAT-04 já `implementado (BE)`. Aviso de backend dado: validar a FEAT-04 contra o backend real (`/retorno-backend`) e levar o ROADMAP v0.17.

## Commit sugerido

`feat/catalog section in lab`
