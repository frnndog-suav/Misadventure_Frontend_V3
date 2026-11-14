# 023 — RETORNO: FEAT-04 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-04 · **REQ:** REQ-08 a REQ-13 · **Contrato:** §3 FEAT-04, v0.14 → v0.15 (`validado`) · **Roadmap:** v0.17 → v0.18 · **Data:** 2026-11-14

## Objetivo

Rodar os cenários da FEAT-04 e os e2e da área `lab` contra o backend real e fechar a FEAT.

## Passos e comandos

1. Primeira tentativa: o backend em `http://localhost:3333` servia a coleção `base` (sem `CONTENT_DIR=test/fixtures/content`). Os cenários com a coleção `fixture` não puderam rodar e foi dado um Aviso de backend. O autor subiu de novo com o conteúdo de teste.
2. Cenários com `curl -s http://localhost:3333/catalog/...`: `collections`, `collections/fixture/cards` (6 cartas na ordem de `id`), `?type=attribute`, `?type=monster` (400), `collections/nope/cards` (404), `cards/fixture.strength-basic`, `cards/fixture.nope` (404). Todos iguais ao contrato (comparação campo a campo, porque a ordem das chaves não é garantida, CONTRATO v0.12).
3. As 6 cartas reais validadas com `z.array(cardSchema)` num teste temporário (removido depois): passam.
4. CORS: `Access-Control-Allow-Origin: http://localhost:5173`.
5. e2e com o MSW desligado: `VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx playwright test tests/e2e/lab` → 5 passaram.

## Decisões

- **Autor:** as 5 fixtures provisórias de `src/mocks/catalogFixtures.ts` (equipamento, item, combate, zona, evento aleatório) viraram cópia exata das cartas do backend. Os 6 testes de componente que fixavam os textos inventados passaram a esperar os textos reais. O comportamento testado não mudou. A cobertura do que a carta real não tem foi mantida com sobrescritas no próprio teste: efeito positivo de zona, equipamento mínimo sem campos opcionais e evento sem flavor. Alternativa descartada: manter as provisórias, com o MSW diferente do backend.

## Arquivos

`src/mocks/catalogFixtures.ts`, `src/ui/cards/{CombatEvent,Equipment,Item,RandomEvent,Zone}Card.test.tsx`, `docs/CONTRATO.md`, `docs/ROADMAP.md`.

## Como verificar

`npx vitest run src/ui src/api src/lab src/mocks` (134 passaram). Com o backend no ar e o conteúdo de teste: o comando do passo 5. Em `/lab`, a carta "Lâmina do Crepúsculo" mostra "Encantamento" e "Refinável até +3".

## Problemas

- O backend subiu sem o conteúdo de teste na primeira vez (passo 1).
- `/health` informa `contractVersion: "0.12"`: a cópia do contrato no backend está atrasada (a daqui é a v0.15).

## Checks

guarda, typecheck, lint, format:check, `test:build` (REQ-05 ok), Vitest (134 passaram), e2e `lab` contra o backend real (5 passaram): verdes.

## Backend

Levar `docs/CONTRATO.md` v0.15 e `docs/ROADMAP.md` v0.18 para o backend.

## Commit sugerido

`docs/feat-04 validated against real backend`
