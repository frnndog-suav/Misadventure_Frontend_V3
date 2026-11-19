# AGENTS.md — instruções para o Codex

Este arquivo ensina o Codex a trabalhar no projeto. `docs/` contém o conhecimento técnico compartilhado e o progresso do desenvolvimento. Não duplique esse conteúdo aqui nem transforme este arquivo em diário.

## Gestão de contexto

- Leia somente a documentação relevante à tarefa atual. Não carregue toda a documentação por padrão.
- Não releia arquivos ou trechos já disponíveis no contexto, salvo mudança, lacuna concreta ou perda do contexto necessário.
- Prefira buscas direcionadas e seções relevantes à leitura integral de arquivos.
- Consulte `CLAUDE.md` e os arquivos pertinentes de `.claude/` para conhecer convenções, diretrizes e estrutura. Não os recarregue a cada etapa nem percorra todos os agentes e skills como preparação obrigatória.
- Quando o usuário invocar um fluxo pelo nome, consulte `.claude/skills/<fluxo>/SKILL.md` se ainda não estiver no contexto.
- Estas instruções de consulta pontual prevalecem sobre rotinas de leitura repetitiva. Preserve as convenções de implementação já conhecidas.

## Mapa de consultas pontuais

| Fonte | Quando consultar |
| --- | --- |
| `docs/SPEC-FRONTEND.md` | REQ, decisão e tarefa envolvidos no comportamento solicitado. |
| `docs/README.md` | Seções das regras afetadas; Apêndice B ao investigar decisões fechadas. |
| `docs/CONTRATO.md` | Seção e situação do contrato usado na comunicação com o backend. |
| `docs/ROADMAP.md` | Planejamento da feature ou protocolo da ponte entre repositórios (§2). |
| `docs/devlog/README.md` e entrada da área | Histórico e ponto de retomada antes de alterar funcionalidade ou visual. |
| `CLAUDE.md` e `.claude/` | Convenção ou procedimento específico ainda desconhecido. |

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
4. Implemente a menor solução completa, seguindo o fluxo de testes da tarefa.
5. Execute testes e validações pertinentes às alterações.
6. Relate arquivos alterados, resultados das verificações e roteiro de testes quando aplicável. Informe pendências sem declarar concluído o que falta validar.

## Coordenação

- O usuário faz a ponte com o backend e com outras IAs.
- Ao alterar documentos compartilhados ou encontrar dependência do backend, consulte o protocolo em `docs/ROADMAP.md` §2 e o formato de Aviso de backend em `CLAUDE.md`, sem copiá-los para cá.
- No fluxo `/registrar-etapa`, horas da sessão ficam `null` quando não houver medição; o autor fecha o registro de tempo.
