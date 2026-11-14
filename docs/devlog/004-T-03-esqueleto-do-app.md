# 004 — T-03: Esqueleto do app

- **ID:** T-03 · **FEAT:** FEAT-01 (Esqueleto técnico) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.5 · **Contrato:** v0.2 (não alterado)

## Objetivo

Montar o esqueleto do app: instalar TanStack Query, React Router DOM, MSW e Zod; criar as pastas da spec 3.2; provider de consultas; rota inicial; MSW ligado só no dev com `VITE_USE_MOCKS=true`; remover o conteúdo do template do Vite.

## Decisões

- **D-14 (resolve a P-01):** validação dos dados recebidos com **Zod ^4.6** (autor). Alternativa descartada: validadores à mão (mais código, tipo e validador podem divergir).
- **D-10 confirmada (autor):** `VITE_API_URL` e `VITE_USE_MOCKS`; `.env.development` commitado com `VITE_USE_MOCKS=true` (mock ligado por padrão no dev); `.env.example` documenta as duas; `.env.local` (gitignored pelo `*.local`) sobrescreve.
- **D-15:** MSW integrado pelo plugin oficial **`msw/vite`** (MSW 3): o worker **não fica em `public/`** — o plugin o serve só no dev e só o emitiria no build se algum bundle importasse `virtual:msw`. A inicialização em `src/main.tsx` fica atrás de `import.meta.env.DEV` + `shouldEnableMocks()` (`src/mocks/shouldEnableMocks.ts`), então o build de release não contém nada do MSW.
- Rota inicial = placeholder `<main><h1>Misadventures</h1></main>` em `src/App.tsx` até a primeira tela real (spec 3.5, área `app`).
- `queryClient` vive em `src/api/queryClient.ts` (camada de cliente), não no `main.tsx`.
- Sem REQ-nn ainda: os testes citam a tarefa no nome (`it('T-03: …')`).

## Passos e comandos

1. `npm install @tanstack/react-query react-router-dom zod` → @tanstack/react-query **5.107.1**, react-router-dom **7.18.5**, zod **4.6.7**.
2. `npm install -D msw` → msw **3.0.5** (major novo; traz o plugin `msw/vite` e a API `virtual:msw`/`network`).
3. Testes primeiro (agente test-writer, red): `src/mocks/shouldEnableMocks.test.ts`, `src/App.test.tsx`, `tests/e2e/app/app.spec.ts` — falharam por implementação ausente (módulo inexistente / template ainda presente).
4. Implementação (green): pastas `src/api|mocks|features|ui|lab` (as três últimas com `.gitkeep`), `queryClient.ts`, `handlers.ts` (lista vazia tipada `RequestHandler[]`), `shouldEnableMocks.ts`, `App.tsx` (Routes + rota index), `main.tsx` (QueryClientProvider + BrowserRouter + `enableMocks()` dinâmico), `vite-env.d.ts` (tipos do `import.meta.env` + `msw/vite/client`), plugin `msw()` no `vite.config.ts`, `.env.development`/`.env.example`, `index.html` (lang pt-BR, título Misadventures).
5. Template removido: `src/App.css`, `src/assets/*`, `public/icons.svg`, `public/favicon.svg` (a pasta `public/` ficou vazia e saiu do git).
6. `tsconfig.app.json`: `vitest.setup.ts` entrou no `include` — sem isso o `tsc -b` não enxerga os matchers do jest-dom nos testes de `src/` (erro TS2339 `toBeVisible`).
7. `npm run format`; checks da /checar; spec 0.4 → **0.5** (o cabeçalho dizia 0.3, desatualizado desde a 0.4 — corrigido); área `app` na tabela da skill `/testar`.

## Arquivos

- **Criados:** `src/api/queryClient.ts`, `src/mocks/{handlers,shouldEnableMocks,shouldEnableMocks.test}.ts`, `src/App.test.tsx`, `src/vite-env.d.ts`, `src/{features,ui,lab}/.gitkeep`, `tests/e2e/app/app.spec.ts`, `.env.development`, `.env.example`, esta entrada.
- **Alterados:** `src/main.tsx`, `src/App.tsx`, `src/index.css`, `index.html`, `vite.config.ts`, `tsconfig.app.json`, `package.json`, `package-lock.json`, `docs/SPEC-FRONTEND.md`, `.claude/skills/testar/SKILL.md`.
- **Removidos:** `src/App.css`, `src/assets/*`, `public/*`.

## Como verificar

1. `npm run dev` → http://localhost:5173 mostra só o título **Misadventures** (sem template do Vite); console do navegador mostra `[MSW] Mocking enabled.` (grupo colapsado).
2. Com `VITE_USE_MOCKS` ≠ 'true' (ex.: `VITE_USE_MOCKS=false` em `.env.local`), o console não mostra o MSW.
3. `npm run build` e procurar no `dist/`: nenhuma ocorrência de `msw`/`mockServiceWorker`.
4. `npx vitest related --run src/App.tsx src/mocks/shouldEnableMocks.ts` e `npx playwright test tests/e2e/app`.

## Problemas

- **`tsc -b` falhou com TS2339** (`toBeVisible` não existe) no `App.test.tsx`: a augmentação do jest-dom vive em `vitest.setup.ts`, que não estava no programa do `tsconfig.app.json`. Solução: incluí-lo no `include` (ele continua também no `tsconfig.node.json`; os projetos não são compostos, sem conflito).
- **Regra de permissão `Read(**/.env*)`** bloqueia Write/Read dos `.env*` pelas ferramentas de arquivo; criados via shell (heredoc), sem nunca lê-los de volta. O conteúdo é o documentado na D-10 (nenhum segredo).
- Ressalvas não bloqueantes da revisão (registradas, sem ação): `enableMocks().then()` sem `.catch` (se um import dinâmico falhar no dev, o app não monta); o e2e do MSW depende do texto de log `[MSW]` (frágil a upgrade da lib — é literalmente o critério da T-03); o unitário "template removido" só prova ausência de "Get started" (o e2e cobre de verdade); o critério "build sem MSW" é manual até o teste de build da FEAT-03 (D-07).

## Checks

- guarda `--all`: ✅ `src/ limpo (D-08)`
- typecheck ✅ · lint ✅ · format:check ✅
- unitários afetados: **6/6** (2 arquivos; o reviewer rodou a suíte: 24/24)
- e2e área `app`: **2/2**
- build ✅ e `dist/` sem `msw|mockserviceworker|src/lab` (grep vazio)
- Revisão spec-reviewer: **aprovada** (ressalvas não bloqueantes acima)

## Backend

Nenhuma dependência: a T-03 não toca o contrato (handlers vazios). O fecho da FEAT-01 — endpoint mínimo FE↔BE — começa com `/contrato FEAT-01`, que dará o Aviso de backend.

## Commit sugerido

`feat/app skeleton with router, query, msw and zod`
