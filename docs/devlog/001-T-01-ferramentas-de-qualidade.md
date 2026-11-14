# 001 — T-01 — Ferramentas de qualidade

- **FEAT:** FEAT-01 (lado frontend)
- **Data:** 2026-11-13
- **Status:** aguardando revisão
- **Versões:** spec 0.2 · contrato 0.2

## Objetivo
Deixar prontas as ferramentas da definição de pronto: formatação (Prettier), testes unitários e de componentes (Vitest) e e2e (Playwright), com os scripts que as skills usam.

## Decisões
- **D-11:** TypeScript voltou de ~7.0.2 para ~6.0.3. O `npm run lint` já falhava antes da tarefa ("typescript-eslint does not support TS 7.0") e o npm recusava qualquer instalação por conflito de peer (`typescript-eslint` pede `typescript <6.1`). Alternativas recusadas: TS 7 + TS 6 lado a lado (duas versões para manter) e `--legacy-peer-deps` (lint continuaria quebrado).
- **D-12:** autorizados `@testing-library/react`, `@testing-library/jest-dom` e `jsdom`. Prettier com `semi: false` e `singleQuote: true` (estilo do template). `docs/` fica fora do Prettier; os Markdown de `.claude/` e o `CLAUDE.md` entram (a primeira formatação só mudou espaçamento e `*itálico*` → `_itálico_`). `test:e2e` com `--pass-with-no-tests`.

## Passos e comandos
```
npm install -D typescript@~6.0.3 prettier vitest @playwright/test @testing-library/react @testing-library/jest-dom jsdom
npm pkg set scripts.typecheck="tsc -b" scripts.test="vitest run" scripts.test:e2e="playwright test --pass-with-no-tests" scripts.format="prettier --write ." scripts.format:check="prettier --check ."
npx playwright install chromium
npm run format
```
Versões instaladas: typescript 6.0.3, prettier ^3.10.1, vitest ^5.1.0, @playwright/test ^1.65.1 (Chromium headless shell 159), @testing-library/react ^16.3.3, @testing-library/jest-dom ^7.0.1, jsdom ^29.1.1.

## Arquivos
Criados: `vitest.config.ts` (herda o `vite.config.ts`; ambiente jsdom; testes em `src/**/*.test.{ts,tsx}`; `passWithNoTests`), `vitest.setup.ts` (matchers do jest-dom), `playwright.config.ts` (testes em `tests/e2e`, Chromium, sobe `npm run dev` em 5173), `.prettierrc.json`, `.prettierignore`.
Alterados: `package.json` / `package-lock.json` (libs e scripts), `tsconfig.node.json` (inclui as configs novas), `.gitignore` (`playwright-report`, `test-results`), `docs/SPEC-FRONTEND.md` (v0.2), `CLAUDE.md` (stack). Só formatação: `vite.config.ts`, `README.md` da raiz, `CLAUDE.md` e os Markdown de `.claude/`.

## Como verificar
Na raiz: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run format:check` e `npm run build` terminam sem erro.

## Problemas
- Conflito TS 7 × typescript-eslint (resolvido pela D-11).
- `playwright test` sem nenhum teste sai com erro → `--pass-with-no-tests`.
- O `npm install` informa vulnerabilidades no `npm audit`; não foi rodado `npm audit fix` (mudaria versões fora do escopo).

## Checks
typecheck ✅ · lint ✅ · test ✅ (0 testes, passWithNoTests) · test:e2e ✅ (0 testes) · format:check ✅ · build ✅ (223,90 kB JS). Guarda: não configurada (T-02).

## Backend
Nenhuma dependência.

## Commit sugerido
`chore/adding prettier, vitest and playwright`
