---
name: contrato
description: Cria ou altera a seção de uma FEAT em docs/CONTRATO.md (endpoints, tipos, eventos, códigos de erro, cenários de validação), alinha o glossário, incrementa a versão e gera o Aviso de backend com o que o autor leva ao repositório do backend. Use quando uma FEAT for planejada, quando uma tarefa precisar de algo que o contrato não oferece, ou quando o autor pedir para mudar o que se troca com o backend.
argument-hint: FEAT-nn ou descrição da mudança no contrato
---

# /contrato — o que trafega entre frontend e backend

Pedido: **$ARGUMENTS**

O contrato é **compartilhado**: a mesma cópia vive nos dois repositórios, e o autor a leva de um lado para o outro (protocolo em `docs/ROADMAP.md` §2). Esta skill escreve a proposta do frontend; quem confirma é o backend.

## 1. Contexto

1. Leia `docs/CONTRATO.md` §0, §1 e §2 inteiros e a seção da FEAT (se existir).
2. Leia os REQs e as telas da FEAT na spec (Grep) e as seções do README que ela cita.
3. Se a seção já está `acordado` ou adiante, a mudança é uma **alteração de contrato acordado**: diga isso ao autor, porque o backend pode ter código pronto.

## 2. Escrever a proposta

Siga as convenções de §1, sem exceção:

- **O backend manda pronto** o que depende de regra (valores calculados, ações disponíveis, custos, alvos válidos). Se a tela precisa decidir algo, o campo que falta vai no contrato; a regra nunca vai para o frontend.
- **Tipos** em TypeScript, como vão para o código, com uniões discriminadas por `type`.
- **Endpoints** na tabela: método, rota, pedido, resposta, erros.
- **Códigos de erro** novos em §4.
- **Termos novos** no glossário §2 (pt-BR → identificador em inglês, com a seção do README).
- **Cenários de validação** (Dado/Quando/Então) com valores exatos. Eles viram as fixtures do MSW, os testes do backend e o roteiro da validação real (`/retorno-backend`). Cubra pelo menos um erro por endpoint.
- Situação da seção: `proposto (FE)`.
- Incremente a versão do contrato e acrescente uma linha no histórico (§5) com a data, o lado `FE` e o resumo.

Ambiguidade real (o formato muda conforme a resposta) → pergunte com uma opção recomendada. Não invente regra para preencher o formato: se o README não diz, consulte o Apêndice B e, se ainda faltar, pergunte.

## 3. Mostrar e aguardar aprovação do autor

Mostre o diff do contrato. Diga o que muda para o frontend (tipos em `src/api/`, fixtures em `src/mocks/`, tarefas) e o que o backend vai precisar fazer. Espere.

## 4. Depois de aprovado

1. Atualize a coluna FE da FEAT no `docs/ROADMAP.md` para `aguardando outro lado`, se o frontend não puder seguir sem a confirmação.
2. Termine com o **Aviso de backend**:

```
AVISO DE BACKEND — FEAT-nn
Por quê: o contrato da FEAT-nn foi proposto pelo frontend (v<versão>) e precisa ser confirmado e implementado no backend.
Leve para o backend: docs/CONTRATO.md v<versão> (arquivo inteiro; seção FEAT-nn e o que mudou em §2/§4).
Rode lá: peça à sessão do backend para revisar a seção FEAT-nn e responder "acordado" ou com as mudanças que precisa.
Traga de volta: a resposta do backend (ou o docs/CONTRATO.md alterado por ele) → use /retorno-backend aqui.
Enquanto isso, aqui: <o que pode seguir com MSW / o que fica bloqueado até "acordado">.
```

## Regras

- Nunca marque `acordado`, `implementado (BE)` ou `validado` por conta própria: isso só acontece em `/retorno-backend`, com a resposta do backend.
- Não implemente código nesta skill; o código vem na `/tarefa`.
