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
| 017 | RETORNO | [FEAT-04 planejada e contrato acordado](017-RETORNO-feat-04-contrato-acordado.md) | concluída |
| 018 | T-11 | [Cliente do catálogo](018-T-11-cliente-do-catalogo.md) | concluída |

## Como replicar
O que um projeto novo precisa para ter o mesmo sistema:
1. Seguir `docs/PROMPT-AGENTES-E-SKILLS.md` (fases 1 a 4), adaptando o "núcleo" ao papel do projeto. Neste frontend, o núcleo é a **camada de cliente** (`src/api/`, `src/mocks/`), porque o backend é autoritativo e não existe motor de regras aqui.
2. Acrescentar o módulo **Ponte FE↔BE**: o contrato compartilhado (`docs/CONTRATO.md`), o roadmap compartilhado (`docs/ROADMAP.md`), as skills `/contrato` e `/retorno-backend` e o **Aviso de backend** no `CLAUDE.md`.
3. Incluir literalmente as quatro instruções obrigatórias de README III.1 no `CLAUDE.md` e em todos os agentes de desenvolvimento.
4. Hook de guarda e regras de lint entram na primeira tarefa de código (aqui, T-02), quando já existe `src/` a proteger.
5. Registro de tempo: copiar `docs/devlog/tempo.html` com o array `SESSOES` zerado e acrescentar o passo correspondente na skill de registrar etapa. Fica em `docs/`, nunca dentro do app (nenhum painel de desenvolvimento fora do laboratório).
| 019 | T-12 | [Categorias e rótulos](019-T-12-categorias-e-rotulos.md) | concluída |
| 020 | T-13 | [Cartas de atributo, equipamento e item](020-T-13-cartas-atributo-equipamento-item.md) | concluída |
| 021 | T-14 | [Cartas de zona e de evento](021-T-14-cartas-zona-evento.md) | concluída |
| 022 | T-15 | [Seção Catálogo no laboratório](022-T-15-catalogo-no-laboratorio.md) | concluída |
| 023 | RETORNO | [FEAT-04 validada contra o backend real](023-RETORNO-feat-04-validada.md) | concluída |
| 024 | T-16 | [Cliente da campanha](024-T-16-cliente-da-campanha.md) | concluída |
| 025 | T-17 | [Menu inicial e abandonar](025-T-17-menu-inicial-e-abandonar.md) | concluída |
| 026 | T-18 | [Novo jogo](026-T-18-novo-jogo.md) | concluída |
| 027 | T-19 | [Grupo em sessão](027-T-19-grupo-em-sessao.md) | concluída |
| 028 | RETORNO | [FEAT-05 validada contra o backend real](028-RETORNO-feat-05-validada.md) | concluída |
| 029 | FUND | [FEAT-30: acabamento visual](029-FUND-feat-30-acabamento-visual.md) | concluída |
| 030 | T-20 | [Cliente do editor](030-T-20-cliente-do-editor.md) | concluída |
| 031 | T-21 | [Rota do editor e coleções](031-T-21-editor-colecoes.md) | concluída |
| 032 | T-22 | [Lista de cartas](032-T-22-lista-de-cartas.md) | concluída |
| 033 | T-23 | [Formulário de carta: base, zona e atributo](033-T-23-formulario-de-carta.md) | concluída |
| 034 | T-24 | [Formulários de equipamento e item](034-T-24-formularios-equipamento-item.md) | concluída |
| 035 | T-25 | [Formulários de evento aleatório e de combate](035-T-25-formularios-de-evento.md) | concluída |
| 036 | T-26 | [Publicar, duplicar e excluir carta](036-T-26-publicar-duplicar-excluir.md) | concluída |
| 037 | T-27 | [Validar como dimensão, exportar e importar](037-T-27-validar-exportar-importar.md) | aguardando revisão |
| 038 | RETORNO | [FEAT-31 validada contra o backend real](038-RETORNO-feat-31-validada.md) | aguardando revisão |
| 039 | T-28 | [Cliente alinhado à FEAT-06](039-T-28-cliente-feat-06.md) | aguardando revisão |
| 040 | T-29 | [Laboratório e catálogo alinhados à FEAT-06](040-T-29-laboratorio-catalogo-feat-06.md) | concluída |
| 041 | T-30 | [Escolha de classe no "Novo jogo"](041-T-30-escolha-de-classe.md) | concluída |
| 042 | T-31 | [Partida preparada na tela do grupo](042-T-31-partida-preparada.md) | concluída |
| 043 | T-32 | [Cliente do editor: classes e Carta de Dimensão](043-T-32-cliente-editor-classes.md) | concluída |
| 044 | T-33 | [Editor: Carta de Dimensão e forma das setas](044-T-33-editor-dimensao-setas.md) | concluída |
| 045 | T-34 | [Classes no editor](045-T-34-classes-no-editor.md) | aguardando revisão |
| 046 | RETORNO | [FEAT-06 validada contra o backend real](046-RETORNO-feat-06-validada.md) | aguardando revisão |
| 047 | T-35 | [Cliente da FEAT-07](047-T-35-cliente-feat-07.md) | aguardando revisão |
| 048 | T-36 | [Mapa na tela do grupo](048-T-36-mapa-tela-grupo.md) | aguardando revisão |
| 049 | T-37 | [Movimentar](049-T-37-movimentar.md) | aguardando revisão |
| 050 | RETORNO | [FEAT-07 validada contra o backend real](050-RETORNO-feat-07-validada.md) | aguardando revisão |
| 051 | T-38 | [Cliente da FEAT-08](051-T-38-cliente-feat-08.md) | aguardando revisão |
| 052 | T-39 | [A vez e Encerrar a vez](052-T-39-a-vez-encerrar.md) | aguardando revisão |
