# AGENTS.md — instruções para o Codex

Este arquivo ensina o Codex a trabalhar no projeto. `docs/` contém o conhecimento técnico compartilhado e o progresso do desenvolvimento. Não duplique esse conteúdo aqui nem transforme este arquivo em diário.

## Gestão de contexto

- Leia somente a documentação relevante à tarefa atual. Não carregue toda a documentação por padrão.
- Não releia arquivos ou trechos já disponíveis no contexto, salvo mudança, lacuna concreta ou perda do contexto necessário.
- Prefira buscas direcionadas e seções relevantes à leitura integral de arquivos.
- Use este arquivo como orientação operacional. Trabalhe com um único agente por padrão e delegue somente quando solicitado.
- Busque por IDs (`T-xx`, `REQ-xx`, `D-xx`) ou pelo nome da área. Limite a saída de buscas, diffs e logs ao que ajuda a resolver a tarefa.
- Use `docs/PROMPT-AGENTES-E-SKILLS.md` como referência de desenho do fluxo. Consulte somente as seções pertinentes quando for revisar ou adaptar esse fluxo.

## Mapa de consultas pontuais

| Fonte | Quando consultar |
| --- | --- |
| `docs/SPEC-FRONTEND.md` | REQ, decisão e tarefa envolvidos no comportamento solicitado. |
| `docs/README.md` | Seções das regras afetadas; Apêndice B ao investigar decisões fechadas. |
| `docs/CONTRATO.md` | Seção e situação do contrato usado na comunicação com o backend. |
| `docs/ROADMAP.md` | Planejamento da feature ou protocolo da ponte entre repositórios (§2). |
| `docs/devlog/README.md` e entrada da área | Histórico e ponto de retomada antes de alterar funcionalidade ou visual. |

O mapa é uma referência, não uma lista de leituras obrigatórias. Não copie regras, contratos, requisitos ou registros de `docs/` para cá.

## Exploração do repositório

- Identifique primeiro o módulo relevante e o conjunto mínimo de arquivos.
- Inspecione implementação e testes relacionados antes de editar.
- Prefira buscas direcionadas com `rg` e o histórico dos arquivos envolvidos (`git log --oneline -- <arquivos>`).
- Amplie a exploração somente quando uma dependência ou dúvida concreta exigir.
- Não explore módulos sem relação nem faça varreduras completas para tarefas isoladas.
- Ao retomar, use o contexto disponível e as alterações locais; consulte o registro pertinente se necessário. Não suponha que toda alteração local foi feita pelo Codex.

## Convenções de implementação

- Siga a arquitetura e as convenções de nomes existentes.
- Reutilize serviços, componentes e utilitários existentes quando aplicável.
- Preserve as responsabilidades do frontend e do backend e consulte o contrato antes de alterar a comunicação.
- Siga requisitos e fluxo de testes da tarefa sem reinventar decisões documentadas.

## Controle de escopo

- Modifique apenas o necessário para concluir a tarefa solicitada.
- Não refatore código sem relação com ela.
- Não altere regras de negócio sem autorização.
- Não crie documentação adicional sem necessidade; use os registros existentes quando o fluxo exigir rastreabilidade.
- Preserve alterações locais do usuário. Commits são feitos pelo autor.
- Trabalhe em uma tarefa por vez; não avance para outra sem autorização.
- Pergunte apenas quando uma ambiguidade real impedir a execução correta.

## Execução

1. Entenda a tarefa solicitada e seus critérios de conclusão.
2. Identifique os arquivos mínimos necessários.
3. Inspecione implementações relacionadas e consulte somente os trechos de documentação ainda necessários.
4. Se a mudança alterar comportamento, confirme os critérios Dado / Quando / Então na spec. Se a spec precisar mudar, obtenha aprovação da mudança antes de escrever testes e código.
5. Para critérios novos ou alterados, escreva primeiro os testes com o ID do requisito e confirme a falha esperada. Implemente a menor solução completa e execute os testes afetados e as validações pertinentes.
6. Registre a etapa de desenvolvimento no devlog. Relate arquivos alterados, verificações executadas, pendências e, quando aplicável, roteiro de testes com resultados esperados e um caso de borda.
7. Ao final de cada implementação, inclua na resposta uma sugestão de commit em inglês, curta e em minúsculas, no formato `tipo/descrição`, sem dois-pontos. Para tarefas de feature com IDs definidos, siga o padrão do histórico, como `feat/t-55 feat-11 structured effects in cards and editor`. Use o prefixo que descreve a mudança. O autor faz o commit.

## Coordenação

- O usuário faz a ponte com o backend e com outras IAs.
- Consulte o protocolo em `docs/ROADMAP.md` §2 e inclua na resposta final um **Aviso de backend** pronto para o autor copiar e enviar quando houver proposta ou alteração de contrato, mudança em documento compartilhado, dependência que o contrato ainda não cobre, frontend da FEAT pronto com MSW e validação real pendente, ou divergência atribuível ao backend durante a validação.
- No aviso, identifique a FEAT e explique o motivo. Indique quais arquivos, versões e seções levar, a revisão ou os cenários a executar no backend, o retorno esperado e o que pode seguir com MSW ou fica bloqueado no frontend. Para divergências, inclua o cenário e as respostas esperada e recebida.
- Quando faltar suporte no contrato, pause a parte que depende dele. Quando a FEAT estiver pronta com MSW, peça ao autor a URL do backend com os dados de teste necessários. Com o backend disponível, execute os cenários previstos com MSW desligado e registre os resultados. Marque a FEAT como validada somente após todos os cenários passarem.
- No fluxo `/registrar-etapa`, horas da sessão ficam `null` quando não houver medição; o autor fecha o registro de tempo.

## Retomada e chamada de tarefas

- Use um chat por etapa. Mantenha nele a implementação, os testes e os ajustes da mesma tarefa. Abra um novo chat para uma etapa independente.
- Quando o autor indicar que está começando a programar no dia, quando uma etapa for concluída ou quando ele perguntar em que ponto o projeto está, inclua ao fim da resposta um prompt curto e copiável para a retomada. Sugira a próxima tarefa identificada no roadmap, na spec ou no devlog, sem iniciá-la sem autorização.
- Use os IDs e o ponto de retomada confirmados. Omita decisões que não se aplicam e deixe campos a preencher quando a informação ainda não estiver definida.

> Implemente a `T-xx`. Consulte os critérios de `REQ-xx` e a decisão `D-yy`. Retome de `<entrada do devlog ou ponto atual>`. Rode os testes afetados, registre a etapa e entregue o roteiro de verificação.
