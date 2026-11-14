# 009 — T-06: Termo do jogo com destaque e tooltip

- **ID:** T-06 · **FEAT:** FEAT-02 (Base visual) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.9 → **v0.10** · **Contrato:** não alterado (o backend avisou da v0.5; a cópia ainda não foi trazida)

## Objetivo

Componente de termo do jogo com destaque e tooltip (REQ-03, D-20) e catálogo tipado pelos ids do glossário (CONTRATO §2), começando pelos 9 atributos (README 4.1).

## Decisões

- **Catálogo** em `src/ui/terms.ts` (`as const satisfies`): `TermId` é derivado das chaves, então id fora do catálogo não compila (`@ts-expect-error` no teste).
- **Textos** resumidos das colunas "Representa / Relacionado a" do README 4.1; **aprovados pelo autor** (opção alternativa — texto integral — recusada).
- **"Não cobre o termo":** tooltip `position: absolute; top: 100%` (abaixo). O jsdom não mede layout, então o teste confere a regra no `Term.css?raw`; o `vitest.config.ts` passou a incluir `Term.css` no CSS processado. Vantagem: sem lib de posicionamento. Desvantagem: perto da borda inferior da tela o tooltip pode sair da área visível; tratar quando houver tela que use termos.
- **Tempo automático (fora da tarefa, pedido do autor):** hooks `UserPromptSubmit` e `Stop` em `.claude/settings.json` chamam `.claude/hooks/time-log.mjs`, que grava a hora do sistema em `docs/devlog/tempo-eventos.log`; `--resumo` soma o tempo ativo (pausa ≥ 30 min não conta). A `/registrar-etapa` passou a usar o resumo em vez de perguntar.

## Passos e comandos

1. Red: `src/ui/Term.test.tsx` (falhou: `Term`/`terms` ausentes).
2. Green: `src/ui/terms.ts`, `src/ui/Term.tsx`, `src/ui/Term.css`; ajuste do `css.include` no `vitest.config.ts`.
3. `npm run format`, `typecheck`, `lint`, `client-guard --all`, `format:check`, `build`: verdes.

## Arquivos

- **Criados:** `src/ui/Term.tsx`, `src/ui/Term.css`, `src/ui/terms.ts`, `src/ui/Term.test.tsx`, `.claude/hooks/time-log.mjs`, `docs/devlog/tempo-eventos.log`, esta entrada.
- **Alterados:** `vitest.config.ts`, `.claude/settings.json`, `.claude/skills/registrar-etapa/SKILL.md`, `docs/SPEC-FRONTEND.md`, `docs/devlog/README.md`, `docs/devlog/tempo.html`.

## Como verificar

`npx vitest run src/ui` → 20 testes passando (9 do REQ-03). Ainda não há tela que use termos (sem e2e).

## Problemas

O Vitest esvazia CSS importado com `?raw` fora do `css.include` (o teste de posição recebia `''`).

## Dependência do backend

Nenhuma. A validação da FEAT-01 contra o backend real (CONTRATO v0.5) segue pendente via `/retorno-backend`.

## Commit sugerido

`feat/game term with tooltip and attribute catalog`
