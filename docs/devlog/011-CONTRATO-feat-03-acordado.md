# 011 — CONTRATO: FEAT-03 acordado

- **ID:** CONTRATO (retorno do backend) · **FEAT:** FEAT-03 (Esqueleto do laboratório) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Contrato:** v0.6 (BE) → **v0.7** · **ROADMAP:** v0.7 (BE) → **v0.8** · **Spec:** não alterada

## Objetivo

Receber o Aviso de frontend da FEAT-03 (CONTRATO v0.6 e ROADMAP v0.7, trazidos do backend pelo autor) e confirmar ou pedir mudanças.

## Decisões

- **FEAT-03 `acordado` sem mudanças.** O que foi conferido:
  - os padrões batem com o README Apêndice A: 1–6 jogadores, 3 PA, Pico e Vigor 10/10, vida base, ouro e mão 20/10/7;
  - `LAB_CONFIG_INVALID` segue o formato da §1.4;
  - limites e padrões chegam prontos (princípio 1); o frontend só traduz cada `reason` em texto pt-BR.
- ROADMAP v0.7 (mescla do BE) aceito como veio; a v0.8 só acrescenta a linha do acordo. A coluna BE da FEAT-03 fica para o backend atualizar.

## Passos e comandos

1. `git diff docs/ROADMAP.md` e leitura de `docs/CONTRATO.md` §2.6, FEAT-03 e §4.
2. Comparação com `docs/README.md` Apêndice A.
3. Seção marcada `acordado`, versão 0.7 e histórico (lado FE); ROADMAP 0.8.

## Arquivos

- **Alterados:** `docs/CONTRATO.md`, `docs/ROADMAP.md`, `docs/devlog/README.md`.
- **Criados:** esta entrada.

## Como verificar

`docs/CONTRATO.md` linha do título da FEAT-03 termina em `acordado`; histórico com a linha 0.7 (FE).

## Problemas

Nenhum. Ainda não há tipos em `src/api/` nem fixtures do MSW da FEAT-03; eles entram nas tarefas da FEAT-03 (a planejar).

## Dependência do backend

Sim: o contrato v0.7 e o ROADMAP v0.8 voltam ao backend (Aviso de backend dado).

## Commit sugerido

`docs/feat-03 contract agreed and roadmap merge`
