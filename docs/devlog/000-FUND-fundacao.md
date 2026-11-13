# 000 — FUND — Fundação: agentes, skills, specs, roadmap e contrato

- **FEAT:** FEAT-00 (lado frontend)
- **Data:** 2026-11-13
- **Status:** aguardando revisão
- **Versões:** spec 0.1 · contrato 0.1 · roadmap 0.1

## Objetivo
Montar a base do desenvolvimento do frontend sem nenhum código de aplicação: o sistema de agentes e skills spec-anchored (README III.1, seguindo `docs/PROMPT-AGENTES-E-SKILLS.md`), a ponte com o backend (README III.2) e o planejamento em fases (README III.4, Etapa 1). A análise das regras e a entrevista com o autor da Etapa 1 já estavam fechadas no Apêndice B (B.1 a B.18).

## Decisões
Tomadas com o autor em 2026-11-13 (Fase 1 do PROMPT):
- A spec do frontend **cita** o README por seção e não copia regras (spec D-03).
- `docs/ROADMAP.md` e `docs/CONTRATO.md` são **compartilhados**: nascem aqui e o autor copia para o repositório do backend, que fica em outro lugar. A spec e os agentes do backend são criados numa sessão lá.
- Identificadores e contrato em **inglês**; telas em pt-BR; glossário no contrato §2 (spec D-02).
- O frontend avança antes do backend com **MSW** respondendo fixtures do contrato; a FEAT só fecha validada contra o backend real (spec D-04).
- Formatador: **Prettier** (spec D-05).
- O autor pediu para ser **avisado sempre que precisar rodar algo no backend** → formato **Aviso de backend** no `CLAUDE.md`, usado por `/tarefa`, `/contrato` e `/retorno-backend`.

Adaptações do PROMPT ao projeto (Fase 2, aprovadas):
- O "núcleo" puro do PROMPT não existe aqui (o backend é autoritativo, README II.1). O núcleo do frontend é a **camada de cliente** (`src/api/`, `src/mocks/`); o agente `core-dev` virou `client-dev`; o princípio central virou "nenhuma regra do jogo no frontend".
- Módulo **Conteúdo** não entra (cartas são dados do backend). Módulo novo **Ponte FE↔BE** (`/contrato`, `/retorno-backend`).
- "360 px, mobile primeiro" virou **PC primeiro** (spec D-09).
- Roadmap: o laboratório começa cedo (FEAT-03) e cresce a cada FEAT; recrutar, combate em grupo e negociação foram para o momento 2.
- Decisões novas na spec: D-01 (formato de erro, contrato §1.4), D-06 (vez/rodada/turno/ciclo no código), D-07 (laboratório só no dev), D-08 (regras da guarda), D-10 (variáveis de ambiente, a confirmar na T-03). Pendências P-01 (validação dos dados recebidos) e P-02 (como ver as vezes dos outros jogadores).

## Passos e comandos
Só leitura do projeto e criação de arquivos Markdown. Nenhuma instalação, nenhum comando de build.
```
git log --oneline -20
node --version   # v22.15.0
npm --version    # 11.14.1
```

## Arquivos
Criados:
- `CLAUDE.md`
- `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md`, `docs/CONTRATO.md`
- `docs/devlog/README.md`, `docs/devlog/000-FUND-fundacao.md`
- `.claude/skills/`: `tarefa`, `mudar-spec`, `checar`, `testar`, `registrar-etapa`, `contrato`, `retorno-backend`, `guia-visual`, `assets`, `visual`, `revisar-visual`
- `.claude/agents/`: `test-writer`, `client-dev`, `ui-dev`, `spec-reviewer`, `ux-designer`, `motion-dev`

Alterados: nenhum. Ficam para a T-02 (são código): `.claude/hooks/client-guard.mjs`, o hook em `.claude/settings.json` e as regras de lint.

## Como verificar
1. Reinicie a sessão do Claude Code (agentes e skills carregam no início).
2. Digite `/` e confira que aparecem as 11 skills da lista acima.
3. Peça `/checar`: a tabela sai com guarda, tipos, formatação e testes como "não configurado (T-01/T-02)" e lint/build rodando.
4. Peça `/tarefa próxima`: ela deve localizar a **T-01** e parar antes de instalar qualquer coisa para perguntar sobre os utilitários de teste de componentes.

## Problemas
- Na primeira versão do roadmap havia uma FEAT inventada ("ordem de vários jogadores e rodadas com IAs"), que já faz parte da FEAT-20. Foi removida e as FEATs seguintes renumeradas (FEAT-21 a FEAT-29), com as referências da spec, do contrato e do `CLAUDE.md` alinhadas.

## Checks
- Marcadores `{{` sobrando: **0**.
- Frontmatter: **11/11** skills e **6/6** agentes com `name` igual à pasta/arquivo e com `description`.
- Referências cruzadas: só citam skills e agentes que existem (além do `/clear`, comando nativo).
- Instruções obrigatórias da III.1: presentes no `CLAUDE.md`, na `/tarefa` e nos 5 agentes de desenvolvimento (o `spec-reviewer` só lê).

## Backend
FEAT-00 do backend está `a fazer`. Aviso dado ao autor: levar `docs/PROMPT-AGENTES-E-SKILLS.md`, `docs/README.md`, `docs/ROADMAP.md` e `docs/CONTRATO.md` para o repositório do backend e montar lá a fundação equivalente, confirmando ou ajustando o contrato v0.1 (§1 e §2).

## Commit sugerido
`chore/creating foundation docs, agents and skills`
