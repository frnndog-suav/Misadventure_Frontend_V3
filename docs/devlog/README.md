# Devlog

Registro de cada etapa do frontend, escrito para que **outra IA consiga replicar o projeto** lendo as entradas em ordem.

## Formato de uma entrada (`NNN-<ID>-<slug>.md`)
- **Cabeçalho:** ID (`FUND`, `T-xx`, `UX-nn`…), FEAT do roadmap, data (AAAA-MM-DD), status (`aguardando revisão` | `concluída`), versão da spec e do contrato.
- **Objetivo**
- **Decisões** (e onde estão: `D-xx`, `REQ-xx`, seção do contrato)
- **Passos e comandos** (comandos completos, instalações com versão)
- **Arquivos** (criados / alterados)
- **Como verificar** (o que o autor vê no produto e os comandos)
- **Problemas** (e como foram resolvidos)
- **Checks** (resultado real, com números)
- **Backend** (dependência do outro lado e o Aviso de backend dado, ou "nenhuma dependência")
- **Commit sugerido**

## Registro de tempo

O tempo gasto no desenvolvimento fica em [`tempo.html`](tempo.html): um arquivo só, com os dados (array `SESSOES` no topo) e a visualização (abrir no navegador — totais, dias, período e horas por etapa). Uma linha por sessão de trabalho: `{ data, horas, etapa, nota }`; `horas: null` enquanto não souber. Desde 2026-11-14, os hooks `UserPromptSubmit`/`Stop` (`.claude/hooks/time-log.mjs`) gravam a hora do sistema em `tempo-eventos.log`; `node .claude/hooks/time-log.mjs --resumo [AAAA-MM-DD]` soma o tempo ativo por dia (intervalos ≥ 30 min contam como pausa). A `/registrar-etapa` acrescenta a sessão de cada etapa; sessões fora das etapas (estudo, documentação), o autor acrescenta à mão.

## Índice
| Nº | ID | Título | Status |
|---|---|---|---|
| 000 | FUND | [Fundação: agentes, skills, specs, roadmap e contrato](000-FUND-fundacao.md) | concluída |
| 001 | T-01 | [Ferramentas de qualidade](001-T-01-ferramentas-de-qualidade.md) | concluída |
| 002 | AUDIT | [Vulnerabilidades do npm audit](002-AUDIT-vulnerabilidades-npm.md) | concluída |
| 003 | T-02 | [Guarda de `src/`](003-T-02-guarda-de-src.md) | concluída |
| 004 | T-03 | [Esqueleto do app](004-T-03-esqueleto-do-app.md) | concluída |
| 005 | CONTRATO | [FEAT-01, endpoint mínimo proposto](005-CONTRATO-feat-01-endpoint-minimo.md) | concluída |
| 006 | TEMPO | [Registro de tempo de desenvolvimento](006-TEMPO-registro-de-tempo.md) | concluída |
| 007 | T-04 | [Consumo do GET /health na rota inicial](007-T-04-consumo-do-health.md) | concluída |
| 008 | T-05 | [Tokens, tema escuro e tipografia](008-T-05-tokens-tema-e-tipografia.md) | concluída |
| 009 | T-06 | [Termo do jogo com destaque e tooltip](009-T-06-termo-com-tooltip.md) | concluída |
| 010 | T-07 | [Carta com categoria e convenção de imagens](010-T-07-carta-com-categoria.md) | concluída |
| 011 | CONTRATO | [FEAT-03 acordado](011-CONTRATO-feat-03-acordado.md) | concluída |
| 012 | SPEC | [FEAT-03 planejada](012-SPEC-feat-03-planejada.md) | concluída |
| 013 | T-08 | [Cliente da configuração do laboratório](013-T-08-cliente-lab-config.md) | concluída |
| 014 | T-09 | [Rota do laboratório só no dev](014-T-09-rota-lab-so-dev.md) | concluída |
| 015 | T-10 | [Tela de configuração do laboratório](015-T-10-tela-config-lab.md) | concluída |
| 016 | RETORNO | [FEAT-03 validada contra o backend real](016-RETORNO-feat-03-validada.md) | concluída |
| 017 | RETORNO | [FEAT-04 planejada e contrato acordado](017-RETORNO-feat-04-contrato-acordado.md) | aguardando revisão |

## Como replicar
O que um projeto novo precisa para ter o mesmo sistema:
1. Seguir `docs/PROMPT-AGENTES-E-SKILLS.md` (fases 1 a 4), adaptando o "núcleo" ao papel do projeto. Neste frontend, o núcleo é a **camada de cliente** (`src/api/`, `src/mocks/`), porque o backend é autoritativo e não existe motor de regras aqui.
2. Acrescentar o módulo **Ponte FE↔BE**: o contrato compartilhado (`docs/CONTRATO.md`), o roadmap compartilhado (`docs/ROADMAP.md`), as skills `/contrato` e `/retorno-backend` e o **Aviso de backend** no `CLAUDE.md`.
3. Incluir literalmente as quatro instruções obrigatórias de README III.1 no `CLAUDE.md` e em todos os agentes de desenvolvimento.
4. Hook de guarda e regras de lint entram na primeira tarefa de código (aqui, T-02), quando já existe `src/` a proteger.
5. Registro de tempo: copiar `docs/devlog/tempo.html` com o array `SESSOES` zerado e acrescentar o passo correspondente na skill de registrar etapa. Fica em `docs/`, nunca dentro do app (nenhum painel de desenvolvimento fora do laboratório).
