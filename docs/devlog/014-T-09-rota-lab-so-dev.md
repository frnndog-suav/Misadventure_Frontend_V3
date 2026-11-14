# 014 — T-09: Rota do laboratório só no dev

- **ID:** T-09 · **FEAT:** FEAT-03 · **REQ:** REQ-05 · **D:** D-07, D-08, D-24 · **Data:** 2026-11-14

## Objetivo

Rota `/lab` com a tela vazia titulada "Laboratório", existente só no build de dev, e um teste de build que prova que o `dist/` de release não contém o laboratório.

## Decisões

- **D-24:** só `src/main.tsx` importa `src/lab/` (a guarda D-08 já permitia só ele). O main carrega `src/lab/labRoute.tsx` por `import()` dinâmico atrás de `import.meta.env.DEV` (em paralelo com `enableMocks`) e passa o elemento `<Route>` ao `App` pela prop `devRoutes`. Alternativa descartada: liberar `src/App.tsx` na guarda — afrouxaria a D-08.
- Teste de build como script Node (`scripts/check-release-build.mjs`), não Vitest: precisa de um build real e é lento demais para a suíte unitária. Marcas procuradas no `dist/` (`.js`, `.html`, `.css`): `Laboratório` (também escapado `ó`), `"/lab"`, `'/lab'`, `src/lab/`.
- `/checar` passa a rodar `npm run test:build` no lugar de `npm run build`.
- Mensagem da guarda (hook e ESLint) atualizada: "importar src/lab/ só no ponto de entrada de dev (src/main.tsx)" (tirado o "até a T-03").

## Passos e comandos

1. Red: `tests/e2e/lab/lab.spec.ts` → `npx playwright test tests/e2e/lab` falhou (sem rota).
2. `npm pkg set scripts.test:build="npm run build && node scripts/check-release-build.mjs"`.
3. Green: `src/lab/LabPage.tsx`, `src/lab/labRoute.tsx`, prop `devRoutes` em `src/App.tsx`, `loadDevRoutes` em `src/main.tsx`.
4. Prova negativa: trocar `import.meta.env.DEV` por `true` em `loadDevRoutes` → `npm run test:build` falha apontando `dist/assets/labRoute-*.js: Laboratório`; revertido.

## Arquivos

- `src/lab/LabPage.tsx`, `src/lab/labRoute.tsx` (novos); `src/App.tsx`, `src/main.tsx`
- `scripts/check-release-build.mjs` (novo), `package.json` (script `test:build`)
- `tests/e2e/lab/lab.spec.ts` (novo)
- `.claude/hooks/client-guard.mjs`, `eslint.config.js` (só a mensagem), `.claude/skills/checar/SKILL.md`, `CLAUDE.md` (comando)
- `docs/SPEC-FRONTEND.md` (v0.14)

## Como verificar

- `npm run dev` → `http://localhost:5173/lab` mostra o título "Laboratório".
- `npm run test:build` → `REQ-05 ok: o build de release não contém o laboratório.`
- `npx playwright test tests/e2e` → 9 passam.

## Checks

`typecheck`, `lint`, `format:check`, guarda (`src/ limpo (D-08)`), Vitest (78/78), e2e (9/9) e `test:build` verdes.

## Dependência do backend

Nenhuma. O Aviso de backend da FEAT-03 vem ao fechar a T-10.

## Commit sugerido

`feat/lab route only in dev build`
