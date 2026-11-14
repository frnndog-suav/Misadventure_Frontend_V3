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

## Índice
| Nº | ID | Título | Status |
|---|---|---|---|
| 000 | FUND | [Fundação: agentes, skills, specs, roadmap e contrato](000-FUND-fundacao.md) | concluída |
| 001 | T-01 | [Ferramentas de qualidade](001-T-01-ferramentas-de-qualidade.md) | concluída |
| 002 | AUDIT | [Vulnerabilidades do npm audit](002-AUDIT-vulnerabilidades-npm.md) | concluída |
| 003 | T-02 | [Guarda de `src/`](003-T-02-guarda-de-src.md) | aguardando revisão |

## Como replicar
O que um projeto novo precisa para ter o mesmo sistema:
1. Seguir `docs/PROMPT-AGENTES-E-SKILLS.md` (fases 1 a 4), adaptando o "núcleo" ao papel do projeto. Neste frontend, o núcleo é a **camada de cliente** (`src/api/`, `src/mocks/`), porque o backend é autoritativo e não existe motor de regras aqui.
2. Acrescentar o módulo **Ponte FE↔BE**: o contrato compartilhado (`docs/CONTRATO.md`), o roadmap compartilhado (`docs/ROADMAP.md`), as skills `/contrato` e `/retorno-backend` e o **Aviso de backend** no `CLAUDE.md`.
3. Incluir literalmente as quatro instruções obrigatórias de README III.1 no `CLAUDE.md` e em todos os agentes de desenvolvimento.
4. Hook de guarda e regras de lint entram na primeira tarefa de código (aqui, T-02), quando já existe `src/` a proteger.
