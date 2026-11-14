# 006 — TEMPO: Registro de tempo de desenvolvimento

- **ID:** TEMPO · **FEAT:** — (meta, fora das tarefas T) · **Data:** 2026-11-14
- **Status:** aguardando revisão
- **Spec:** v0.6 (não alterada) · **Contrato:** v0.4 (não alterado)

## Objetivo

Registrar o tempo gasto no desenvolvimento (horas por sessão, dias, período), a pedido do autor, com uma visualização simples — sem criar tela dentro do app.

## Decisões

- **Onde:** `docs/devlog/tempo.html`, arquivo único e auto-contido — os dados são o array `SESSOES` no topo do próprio arquivo e a visualização é o HTML aberto direto no navegador (duplo clique, sem servidor). Motivo: `fetch` de arquivo local é bloqueado pelo navegador (um `.json` separado exigiria servidor), e a convenção do projeto proíbe painel de desenvolvimento dentro do app fora do laboratório — e o laboratório (FEAT-03, README II.6) é para valores do jogo, não para meta-informação do projeto.
- **Formato da sessão:** `{ data: 'AAAA-MM-DD', horas: número decimal ou null, etapa: 'T-xx | CONTRATO | FEAT-nn | setup', nota }`. `horas: null` fica fora do total (o rodapé avisa quantas faltam).
- **Manutenção:** a skill `/registrar-etapa` ganhou o passo 8 — toda etapa acrescenta sua sessão; sessões fora das etapas o autor acrescenta à mão.
- **Pré-preenchimento:** sessões de 2026-11-04 a 2026-11-14 estimadas pela janela entre o primeiro e o último commit de cada dia (`git log --pretty='%ad | %s' --date=format:'%Y-%m-%d %H:%M' --reverse`), sem descontar pausas, todas marcadas com "corrija" na nota.

## Passos e comandos

1. `git log --pretty='%ad | %s' --date=format:'%Y-%m-%d %H:%M' --reverse` para as janelas de commit.
2. Criado `docs/devlog/tempo.html` (dados + visualização: total de horas, dias trabalhados, período em dias corridos, horas por etapa, tabela de sessões; pt-BR).
3. `docs/devlog/README.md`: seção "Registro de tempo" e item 5 em "Como replicar".
4. `.claude/skills/registrar-etapa/SKILL.md`: passo 8 (acrescentar a sessão no `tempo.html`).

## Arquivos

- **Criados:** `docs/devlog/tempo.html`, esta entrada.
- **Alterados:** `docs/devlog/README.md`, `.claude/skills/registrar-etapa/SKILL.md`.

## Como verificar

Abrir `docs/devlog/tempo.html` no navegador: cartões com total registrado (~33 h estimadas), 5 dias trabalhados, período 04/11/2026 → 14/11/2026, tabela com 5 sessões (a de 14/11 sem horas, fora do total) e o aviso de estimativa no rodapé.

## Problemas

Nenhum. As horas pré-preenchidas são estimativas de janela de commit (superestimam: não descontam pausas); o autor corrige no array.

## Checks

Etapa só de documentos (nada em `src/`, nada no bundle): sem testes afetados, sem build.

## Backend

Nenhuma dependência de contrato. Para o backend ter o mesmo registro, o autor copia o `tempo.html` (zerando o array) e pede lá a adoção da convenção — passo a passo dado na conversa de 2026-11-14.

## Commit sugerido

`docs/adding development time tracking page`
