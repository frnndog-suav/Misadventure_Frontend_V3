# 029 — FUND: FEAT-30, acabamento visual da interface

- **ID:** FUND · **FEAT:** FEAT-30 · **Roadmap:** v0.21 → v0.22 · **Data:** 2026-11-15

## Objetivo

Registrar a decisão do autor: o visual das telas (layout de jogo para PC, componentes, tratamento PSX, artes) vira uma etapa própria, depois de todas as funcionalidades.

## Decisões

- **Autor:** a prioridade é implementar e testar todas as funcionalidades. Até a FEAT-30, as tarefas usam só a base da FEAT-02 (tokens e fontes), sem passada de layout.
- **Posição:** FEAT-30 depois de todas as FEATs funcionais (até a FEAT-28) e antes do executável Tauri (FEAT-29), para que ele já saia com o visual final. O número 30 evita renumerar a FEAT-29.
- **Sem agente novo:** `ux-designer`, `motion-dev`, `/visual` e `/revisar-visual` já cobrem a execução. O que faltava era referência: a pesquisa de diretrizes, as perguntas ao autor e a lista de artes ficam no `/guia-visual` §8.

## Arquivos

`docs/ROADMAP.md`, `.claude/skills/guia-visual/SKILL.md`.

## Backend

Levar `docs/ROADMAP.md` v0.22 para o backend (a FEAT-30 não tem lado BE).

## Commit sugerido

`docs/visual polish stage as feat-30`
