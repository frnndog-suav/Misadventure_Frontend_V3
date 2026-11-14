---
name: registrar-etapa
description: Cria ou atualiza a entrada do devlog (docs/devlog/NNN-<id>-<slug>.md) de uma etapa - objetivo, decisões, passos e comandos, arquivos, como verificar, problemas, checks, dependência do backend e commit sugerido - e atualiza o índice. Use ao fim de cada tarefa (a /tarefa chama) e depois de qualquer trabalho fora das tarefas que mude configuração, dependências, contrato ou estrutura.
argument-hint: T-xx ou descrição da etapa
---

# /registrar-etapa

Etapa: **$ARGUMENTS**

O devlog existe para que **outra IA consiga replicar o projeto** lendo as entradas em ordem. Escreva para esse leitor: concreto, com comandos exatos e o porquê de cada decisão. Nada de "melhorias diversas".

## Passos

1. Leia `docs/devlog/README.md` (formato e índice) e a última entrada, para manter o estilo.
2. Junte os fatos, sem inventar: `git status` e `git diff --stat` (inclua não rastreados); comandos executados (instalações com versão); decisões e onde estão na spec (`D-xx`, `REQ-xx`) e no contrato (seção, versão); problemas e soluções; resultado real dos checks, com números.
3. Número: o próximo `NNN`. Se a etapa já tem entrada (re-trabalho), **atualize-a** com uma seção "Revisão AAAA-MM-DD".
4. Crie a entrada no formato do README do devlog. Em **Como verificar**, o que o autor deve ver no produto e os comandos.
5. Em **Backend**, diga se a etapa depende do backend e qual Aviso de backend foi dado (ou "nenhuma dependência").
6. Atualize o índice (status `aguardando revisão`). O commit do autor conta como confirmação: ao criar uma entrada nova, marque como `concluída` as anteriores que já estão em commit (`git log --oneline -- docs/devlog/`).
7. Se a etapa mudou algo que um projeto novo também precisaria (agente, skill, guarda, convenção), atualize **Como replicar**.
8. Acrescente a sessão de trabalho da etapa no array `SESSOES` de `docs/devlog/tempo.html` (`{ data, horas, etapa, nota }`). Se não souber as horas, pergunte ao autor; sem resposta, use `horas: null` com a nota "a preencher".

## Regras

- Datas absolutas (AAAA-MM-DD).
- Não copie código longo; aponte o arquivo. Comandos, sim, por inteiro.
- Só **sugira** o commit (`tipo/descrição curta em minúsculas`).
