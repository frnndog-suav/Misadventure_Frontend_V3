# 010 — T-07: Carta com categoria e convenção de imagens

- **ID:** T-07 · **FEAT:** FEAT-02 (Base visual) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.10 → **v0.11** · **Contrato:** não alterado · **ROADMAP:** FEAT-02 FE `a fazer` → `pronto`

## Objetivo

Componente de categoria de carta (ícone + imagem + rótulo, moldura neutra com arte pendente) e convenção de imagens (REQ-04, README II.4).

## Decisões (autor, 2026-11-14 — spec D-22)

- **Originais** em `assets-src/` na raiz, versionados no Git. Vantagem: rastreável; desvantagem: repo cresce (Git LFS depois, se preciso).
- **Versões do produto** exportadas à mão pelo autor para `src/assets/<categoria>/`. Sem lib nova; passo manual a cada arte.
- **Catálogo injetado:** `CardCategory` recebe a entrada (`{ label, art: { icon, image } | 'pending' }`), não um id. O catálogo de produção `src/ui/categories.ts` começa vazio; os ids `test-…` e seus SVG ficam em `src/ui/test-assets/`, importados só pelo teste. Assim nada de teste entra no release sem checagem extra no build. Desvantagem: catálogo real vazio até a FEAT-04.
- **Arte pendente:** moldura neutra (`.card-category-frame`), sem ícone, rótulo visível.

## Passos e comandos

1. Red: `src/ui/CardCategory.test.tsx` + `src/ui/test-assets/` (falhou: `CardCategory`/`categories` ausentes).
2. Green: `src/ui/categories.ts`, `src/ui/CardCategory.tsx`, `src/ui/CardCategory.css`; `assets-src/README.md`.
3. `npm run format`, `client-guard --all`, `typecheck`, `lint`, `format:check`, `build`: verdes. `grep -rl "test-relic" dist` → nada.
4. `/assets` atualizada (§1, §2, §3, §6).

## Arquivos

- **Criados:** `src/ui/CardCategory.tsx`, `src/ui/CardCategory.css`, `src/ui/categories.ts`, `src/ui/CardCategory.test.tsx`, `src/ui/test-assets/{categories.ts,test-relic-icon.svg,test-relic-image.svg}`, `assets-src/README.md`, esta entrada.
- **Alterados:** `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md`, `.claude/skills/assets/SKILL.md`, `docs/devlog/README.md`, `docs/devlog/tempo.html`.

## Como verificar

`npx vitest run src/ui/CardCategory.test.tsx` → 5 testes. Sem tela que use o componente ainda (sem e2e). `npm run build` e `grep -rl "test-relic" dist` → vazio.

## Problemas

Nenhum.

## Dependência do backend

Nenhuma no código. O ROADMAP mudou (FEAT-02 FE `pronto`): o backend precisa da cópia nova.

## Commit sugerido

`feat/card category component and image convention`
