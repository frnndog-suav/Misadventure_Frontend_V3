# 003 — T-02 — Guarda de `src/`

- **FEAT:** FEAT-01 (lado frontend)
- **Data:** 2026-11-13
- **Status:** aguardando revisão
- **Versões:** spec 0.4 · contrato 0.2

## Objetivo

Aplicar a D-08: guarda automática de `src/` como hook do Claude Code (resposta imediata após cada edição) e como regras do ESLint (verificação precisa), sem plugin novo. Proibidos em `src/`: `Math.random`; `any`; `fetch`/`XMLHttpRequest`/`WebSocket`/`io(` fora de `src/api/`; importar `src/mocks/` fora do ponto de entrada de dev e dos testes; importar `src/lab/` fora da rota de dev.

## Decisões

- **D-08 detalhada (spec 0.4):** ponto de entrada de dev = `src/main.tsx` (vira a rota de dev na T-03); testes podem importar `src/mocks/`, não `src/lab/`; dentro de `src/mocks/` e `src/lab/` (ambos só de dev) os imports entre si são livres.
- **Hook com função exportada:** `checkSource(relPath, content)` é exportada de `client-guard.mjs` para os testes unitários; o bloco executável só roda quando `process.argv[1]` termina em `client-guard.mjs`.
- **Detecção textual no hook, precisa no ESLint:** o hook procura padrões (`: any`, `as any`, `<any…>`, `any[]`, `\bio\s*\(` etc.) com comentários apagados; o `any` exato fica com `@typescript-eslint/no-explicit-any` (já vinha do `tseslint.configs.recommended`).
- **ESLint por camadas (flat config, última regra vence por regra):** bloco `src/**` com `no-restricted-properties` (Math.random), `no-restricted-globals` (fetch, XMLHttpRequest, WebSocket), `no-restricted-syntax` (`io(`) e `no-restricted-imports` (mocks, lab, socket.io-client); sobrescritas para `src/api/**` (rede liberada), `src/main.tsx` (mocks e lab liberados), testes (mocks liberados) e `src/mocks/**`+`src/lab/**`.
- **Vitest inclui `.claude/hooks/**/*.test.ts`** para o guard ter teste ao lado do código (spec 0.4). Os nomes dos testes citam a D-08 (não há REQ).
- **Saídas do hook:** modo hook → exit 2 com as violações no stderr (volta para o agente); `--all` → exit 1 com a lista no stdout; `src/` limpo → exit 0 e `client-guard: src/ limpo (D-08)`.

## Passos e comandos

1. Testes primeiro (`.claude/hooks/client-guard.test.ts`, 18 testes): regras, exceções, escopo (fora de `src/` ignorado) e os três modos de execução via `execFileSync` (incluindo a verificação da spec: arquivo com `Math.random()` em `src/` bloqueado e apagado depois).
2. `npx vitest run .claude/hooks/client-guard.test.ts` → vermelho pelo motivo certo (módulo ausente).
3. Implementar `.claude/hooks/client-guard.mjs` (sem dependências, só `node:fs`/`node:path`).
4. Registrar o hook em `.claude/settings.json`: `PostToolUse`, matcher `Edit|Write`, comando `node .claude/hooks/client-guard.mjs`.
5. Reproduzir as regras no `eslint.config.js` (blocos acima, mensagens idênticas às do hook).
6. Prova cruzada: arquivo `src/__guard_tmp__/bad.ts` com as 5 violações → ESLint 5 erros e `--all` 5 linhas, mesmas mensagens; arquivo apagado.

```
npx vitest run .claude/hooks/client-guard.test.ts
node .claude/hooks/client-guard.mjs --all
npm run lint && npm run typecheck && npm test && npm run format:check && npm run build
```

## Arquivos

Criados: `.claude/hooks/client-guard.mjs`, `.claude/hooks/client-guard.test.ts`, `.claude/settings.json`.
Alterados: `eslint.config.js` (blocos D-08), `vitest.config.ts` (include + aviso do drive), `docs/SPEC-FRONTEND.md` (v0.4, T-02 `[x]`).

## Como verificar

- `node .claude/hooks/client-guard.mjs --all` → `client-guard: src/ limpo (D-08)`, exit 0.
- Criar `src/qualquer.ts` com `Math.random()` → a próxima edição via agente é bloqueada (exit 2) com a mensagem do Princípio 1; `npm run lint` acusa `no-restricted-properties`; apagar o arquivo depois.
- `npm test` → 18 testes do guard passam.

## Problemas

- **Nenhum teste rodava com a config da T-01** (latente, escondido pelo `passWithNoTests`): no Windows, com a letra do drive minúscula no cwd (`d:\…`, como o git bash entrega com `cd /d/...`), os módulos ESM do vitest 5.1.0 carregam em duplicata (`d:/` vs `D:/`) e toda coleta falha com `TypeError: Cannot read properties of undefined (reading 'config')`. Normalizar via `process.chdir`/`root` no `vitest.config.ts` **não** resolve (o processo principal já carregou módulos com a grafia errada). Solução: rodar com a letra maiúscula — PowerShell já normaliza sozinho; no git bash usar `cd /D/...`. Aviso em comentário no `vitest.config.ts` e na memória do agente.
- `import.meta.url` não é URL `file:` dentro do vitest → o teste usa `process.cwd()` para achar o hook.
- Teste como `.test.mjs` era externalizado pelo runner → renomeado para `.test.ts`.

## Checks

guard --all ✅ (exit 0) · lint ✅ (0 erros; 5 erros no arquivo de prova, apagado) · typecheck ✅ · test ✅ (18/18) · format:check ✅ · build ✅ (1.36s).

## Backend

Nenhuma dependência.

## Commit sugerido

`chore/adding src guard hook and eslint rules`
