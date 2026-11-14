# 002 — AUDIT — Vulnerabilidades do npm audit

- **FEAT:** FEAT-01 (lado frontend), fora das tarefas T
- **Data:** 2026-11-13
- **Status:** aguardando revisão
- **Versões:** spec 0.3 · contrato 0.2

## Objetivo
Resolver os 9 alertas moderados do `npm audit` que apareceram na T-01, sem rebaixar libs.

## Decisões
- **D-13.** Os 9 alertas eram uma falha só: GHSA-g3hv-75wg-m249 (negação de serviço no `minimatch` 7.0.0–11.0.0), puxada pelo ESLint e pelo typescript-eslint. Só ferramentas de dev: `npm audit --omit=dev` já dava 0.
- O `npm audit fix --force` foi recusado: ele rebaixaria o typescript-eslint para 8.36.0 (mudança incompatível).
- O typescript-eslint mais novo (8.72.2) ainda depende do `minimatch` vulnerável, por isso o override.

## Passos e comandos
```
npm audit
npm audit --omit=dev            # found 0 vulnerabilities
npm install -D eslint@^10.15.0  # 9 → 7 alertas
npm pkg set overrides.minimatch="^11.0.8"
npm install                     # found 0 vulnerabilities
```

## Arquivos
Alterados: `package.json` (eslint ^10.15.0; `overrides.minimatch`), `package-lock.json`, `.prettierignore` (`.claude/settings.local.json`, arquivo local de permissões fora do Git), `docs/SPEC-FRONTEND.md` (v0.3).

## Como verificar
`npm audit` → "found 0 vulnerabilities". `npm run lint` continua acusando `any` (prova de que o typescript-eslint roda com o `minimatch` 11).

## Problemas
- `format:check` falhou por causa do `.claude/settings.local.json` (alterado pelo Claude Code) → ignorado no Prettier.

## Checks
audit 0 · lint ✅ (e acusou `no-explicit-any`, `prefer-const` e `no-unused-vars` num arquivo de prova, depois apagado) · typecheck ✅ · test ✅ · format:check ✅ · build ✅.

## Backend
Nenhuma dependência.

## Commit sugerido
`chore/fixing npm audit vulnerabilities`
