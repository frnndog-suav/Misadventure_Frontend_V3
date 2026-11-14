# 007 — T-04: Consumo do GET /health na rota inicial

- **ID:** T-04 · **FEAT:** FEAT-01 (Esqueleto técnico, fecho do lado FE) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.6 → **v0.7** · **Contrato:** v0.4 (não alterado) · **Roadmap:** v0.4 → **v0.5**

## Objetivo

Implementar o REQ-01 (estado da ponte com o servidor na rota inicial) consumindo o `GET /health` do CONTRATO v0.4 §3 FEAT-01 (`acordado`): tipos + Zod + cliente HTTP em `src/api/`, handler/fixture do MSW, área de status na Home. Fecha o lado FE da FEAT-01.

## Decisões

- **D-16:** `useHealth` com `retry: false` — o erro aparece imediatamente (o padrão do TanStack Query, 3 tentativas com backoff, levaria ~15 s) e os testes ficam determinísticos.
- **REQ-01 explicitado (spec v0.7):** erro HTTP cujo corpo não é o envelope §1.4 válido mostra "Servidor indisponível. Tente novamente." — a UI nunca exibe texto cru do servidor (ambiguidade levantada pelo test-writer, resolvida na leitura literal da D-14).
- **Cliente HTTP mínimo** (`src/api/http.ts`): URL = `VITE_API_URL ?? ''` + path (vazio = mesma origem, onde o MSW intercepta); resposta ok devolvida como `unknown` (o chamador valida, D-14); erro §1.4 vira `ApiError` (classe com `code`/`message`); resto vira `Error` genérico.
- **Handler MSW com path `*/health`:** casa a chamada relativa do dev e a absoluta dos testes Node (que stubam `VITE_API_URL=http://localhost:3000`, porque o fetch do Node exige URL absoluta).
- **Sem `notFoundFixture`:** o cenário `NOT_FOUND` do contrato é de rota desconhecida — o FE não chama rota inexistente; fica para a validação real (`/retorno-backend`). Por isso a cobertura FE dos cenários não é 1:1.
- **E2E só no caminho de sucesso:** o worker do MSW serve a fixture de sucesso; os erros são cobertos nos unitários com `server.use` por teste.

## Passos e comandos

1. Red (agente test-writer): `src/App.test.tsx` (describe REQ-01, 7 testes; MSW node local ao arquivo), `src/api/health.test.ts` (5 testes de schema), 1 e2e. Falharam por módulos de produção ausentes.
2. Green: `src/api/http.ts`, `src/api/health.ts`, `src/mocks/fixtures.ts`, handler em `src/mocks/handlers.ts`, `HealthStatus` em `src/App.tsx`.
3. `npx vitest run src/App.test.tsx src/api/health.test.ts` (sempre com drive maiúsculo, devlog 003).
4. Revisão spec-reviewer → 1 bloqueante corrigido (identificador `texto` → `statusText`, Constituição 9) + comentário obsoleto trocado.
5. `npm run format`; checks da /checar; spec v0.7; ROADMAP v0.5 (FE `pronto`).

## Arquivos

- **Criados:** `src/api/http.ts`, `src/api/health.ts`, `src/api/health.test.ts`, `src/mocks/fixtures.ts`, esta entrada.
- **Alterados:** `src/mocks/handlers.ts`, `src/App.tsx`, `src/App.test.tsx`, `tests/e2e/app/app.spec.ts`, `vitest.setup.ts`, `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md`.

## Como verificar

1. `npm run dev` → http://localhost:5173 mostra, abaixo de "Misadventures", **"Servidor conectado · contrato v0.4"** (fixture do MSW).
2. Com `VITE_USE_MOCKS=false` em `.env.local` (sem backend no ar) → **"Servidor indisponível. Tente novamente."**.
3. `npx vitest run src/App.test.tsx src/api/health.test.ts` → 14 testes; `npx playwright test tests/e2e/app` → 3 testes.

## Problemas

- **Cleanup do Testing Library não era automático** (Vitest sem `globals: true`): o DOM acumulava entre testes do mesmo arquivo e 5 testes falhavam com "multiple elements". Corrigido em `vitest.setup.ts` (`afterEach(cleanup)`). Os testes da T-03 não esbarravam nisso por não re-consultarem o heading após o segundo render.
- **MSW 3 renomeou `onUnhandledRequest` → `onUnhandledFrame`** nas opções do `server.listen` (TS2353 no typecheck). Ajustado no `App.test.tsx`.

## Checks

- guarda `--all` ✅ · typecheck ✅ · lint ✅ · format:check ✅
- unitários: **36/36** (suíte inteira, porque `vitest.setup.ts` mudou) · e2e área `app`: **3/3**
- build ✅ e `dist/` sem `mockserviceworker`/`virtual:msw`/`src/lab`/internals dos mocks (4 greps vazios); `dist/` apagado
- Revisão spec-reviewer: **aprovada após 1 correção** (bloqueante do identificador; ressalvas não bloqueantes registradas nas Decisões)

## Backend

O lado FE da FEAT-01 está `pronto` com MSW. Falta o backend marcar `implementado (BE)` e subir para a validação real dos dois cenários (§3 FEAT-01) — Aviso de backend dado no fechamento desta tarefa. A fixture e o e2e fixam "0.4"; se o contrato subir de versão antes da validação, atualizá-los junto.

## Commit sugerido

`feat/health status on home route`
