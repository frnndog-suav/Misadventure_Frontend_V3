# 008 — T-05: Tokens, tema escuro e tipografia

- **ID:** T-05 · **FEAT:** FEAT-02 (Base visual) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.7 → v0.8 (planejamento da FEAT-02) → **v0.9** · **Contrato:** v0.4 (não alterado)

## Objetivo

Criar a base visual: arquivo de tokens (cores do tema escuro, tipografia, espaçamentos, movimento), fonte de títulos servida com o app, aplicação na rota inicial, e testes de contraste e de resolução (REQ-02).

## Decisões

- **Planejamento da FEAT-02 (spec v0.8, aprovado pelo autor):** REQ-02 a REQ-04, T-05 a T-07; escolhas do autor: só tema escuro (D-17), fonte pixelada nos títulos (D-18), 1280×720 a 2560×1440 (D-19), textos de tooltip no frontend (D-20).
- **D-18 revisada:** a Press Start 2P (pixelada, OFL) foi descartada pelo autor ao vê-la ("muito feia"). Ele baixou a **Lora** (serifada, OFL) e pediu para usá-la. Só `src/ui/fonts/Lora/Lora-VariableFont_wght.ttf` é referenciado (arquivo variável, pesos 400–700); os outros 11 arquivos da pasta ficam no Git, mas fora do build. A identidade PSX fica nas imagens, ícones e animações (README II.5).
- **Licença:** o autor perguntou se a fonte exigia licença. Toda fonte tem; OFL é gratuita, permite uso comercial e embutir, e exige manter o `OFL.txt` junto (está em `src/ui/fonts/Lora/`). O autor pediu para **não baixar arquivos automaticamente**: ele mesmo faz os downloads.
- **D-21:** `src/ui/tokens.css` é a fonte única; fonte raiz `clamp(14px, 0.5rem + 0.5vw, 20px)` (tudo em `rem` escala com o monitor, D-09 sem media queries); movimento 120/250/500 ms, easing `cubic-bezier(0.2, 0, 0, 1)`. Paleta e easing propostos pelo agente; o autor pode vetar.
- **Teste de contraste lê todos os `--color-*` do CSS** (sugestão da revisão): um token novo entra no teste sozinho. Exceções explícitas: fundos (`bg`, `surface`), `--color-border` (decorativo) e `--color-focus` (3:1).

## Passos e comandos

1. `/mudar-spec planejar FEAT-02` → 4 perguntas ao autor → spec v0.8.
2. Red: `src/ui/tokens.test.ts` (falhou: `tokens.css` ausente) e `tests/e2e/app/visual.spec.ts` (falharam cor e fonte; rolagem já passava).
3. Green: `src/ui/tokens.css`, `src/index.css`, import em `src/main.tsx`.
4. Teste extra "o arquivo da fonte carrega" (`document.fonts.load`): falhou sem o arquivo, passou com a Lora.
5. Troca para a Lora a pedido do autor: `@font-face`, `--font-pixel` → `--font-title`, e2e, D-18, REQ-02, T-05, guia visual.
6. Revisão spec-reviewer: aprovada sem bloqueantes; sugestões aplicadas (teste derivado do CSS, nota do `--color-border` na D-21, D-21 citada na T-05).

## Arquivos

- **Criados:** `src/ui/tokens.css`, `src/ui/tokens.test.ts`, `tests/e2e/app/visual.spec.ts`, esta entrada. Fonte do autor: `src/ui/fonts/Lora/` (12 arquivos).
- **Alterados:** `src/index.css`, `src/main.tsx`, `vitest.config.ts`, `.claude/skills/guia-visual/SKILL.md`, `docs/SPEC-FRONTEND.md`, `docs/devlog/tempo.html`, `docs/devlog/README.md`.

## Como verificar

1. `npm run dev` → http://localhost:5173: fundo quase preto (`#0e0d14`), texto claro, título "Misadventures" em Lora (serifada), status na fonte do sistema.
2. `npx vitest run src/ui/tokens.test.ts` → 11 testes; `npx playwright test tests/e2e/app` → 8 testes.

## Problemas

- **`node:fs` no teste quebrava o `tsc -b`** (o tsconfig do app não tem tipos do Node). Troquei por `import css from './tokens.css?raw'`.
- **O Vitest esvazia CSS por padrão**, então o `?raw` chegava como string vazia. Resolvido com `test.css.include` só para `tokens.css` em `vitest.config.ts`.
- **Build sem o arquivo da fonte** só avisava ("didn't resolve at build time"), sem falhar. Por isso o e2e de carregamento real é o que garante a fonte.

## Checks

- guarda ✅ · typecheck ✅ · lint ✅ · format:check ✅
- unitários: **46/46** na suíte (depois mais 1 teste no contraste: 11/11 no arquivo) · e2e área `app`: **8/8**
- build ✅: `dist/` com só `Lora-VariableFont_wght-*.ttf` (211 kB), sem mocks/lab
- Revisão spec-reviewer: **aprovada**

## Backend

Nenhuma dependência (FEAT-02 é só frontend, ROADMAP BE `—`).

## Commit sugerido

`feat/visual tokens dark theme and title font`
