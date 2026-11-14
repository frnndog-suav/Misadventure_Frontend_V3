---
name: mudar-spec
description: Altera um comportamento do frontend começando pela spec (docs/SPEC-FRONTEND.md) - edita ou cria REQ/D/T, incrementa a versão, confere a consistência com o README (regras) e o CONTRATO (backend) - e só depois alinha código e testes. Também planeja uma FEAT do roadmap em REQs e tarefas. Use quando o autor quiser mudar um comportamento, adicionar uma tela ou funcionalidade, ou disser "planejar FEAT-nn".
argument-hint: descrição da mudança, ou "planejar FEAT-nn"
---

# /mudar-spec

Mudança pedida: **$ARGUMENTS**

A ordem é sempre **spec → aprovação → testes → código**. Não toque no código antes da aprovação.

## 1. Classificar a mudança

| A mudança é…                                                                     | Onde começa                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Regra do jogo (o que acontece na partida, valores, custos, condições)            | **README**, não aqui. Proponha a mudança, peça aprovação, aplique numa nova revisão `B.N` do Apêndice B (próxima letra de IDs) e mostre o **Aviso de backend** para o README novo chegar ao backend. Depois volte aqui só se a tela mudar. |
| Formato do que trafega com o backend (endpoint, campo, evento, código de erro)   | **`/contrato`**. Volte aqui para os REQs da tela.                                                                                                                                                                                          |
| Comportamento do frontend (tela, texto, fluxo, controle, o que aparece e quando) | Aqui.                                                                                                                                                                                                                                      |
| Planejar uma FEAT do roadmap                                                     | Aqui (passo 3).                                                                                                                                                                                                                            |

## 2. Entender e localizar

1. Leia as partes afetadas da spec (Grep pelos IDs; não leia tudo).
2. Leia as seções do README que a mudança envolve, e o Apêndice B quando houver decisões sobre elas. Não reabra decisões do Apêndice B.
3. Identifique o que a mudança afeta: REQs, Ds, telas (3.5), camada de cliente (3.4), seção do contrato, fixtures do MSW, tarefas.
4. Se a mudança vier de um caso específico, **generalize** a regra.
5. Se faltar informação para escrever critérios testáveis, pergunte (com uma opção recomendada).

## 3. Planejar uma FEAT (quando pedido)

1. Leia a linha da FEAT no `docs/ROADMAP.md` e as seções do README que ela cita (só elas, por partes).
2. Liste o que o jogador **vê** e **faz** nessa FEAT, tela por tela. Nada de regra calculada no frontend: o que depende de regra vem pronto do backend.
3. Escreva os REQs (Dado/Quando/Então), as telas em 3.5 (com a área de e2e) e as tarefas T em ordem, cada uma pequena o bastante para uma `/tarefa`.
4. Liste o que o contrato precisa ter para essa FEAT e chame **`/contrato FEAT-nn`** depois da aprovação.
5. Liste os valores do Apêndice A que a FEAT usa, para a tarefa do laboratório (README II.6).

## 4. Editar a spec

- Requisitos novos ou alterados em **Dado / Quando / Então**, com textos e valores exatos do que aparece na tela.
- Próximo `REQ-xx`, `D-xx` ou `T-xx` livre; **nunca renumere**.
- Tarefas: afeta `[x]` → crie uma tarefa nova de alinhamento (`T-nn — Alinhar <comportamento> (REQ-xx)`); afeta só `[ ]` → ajuste o texto.
- Incremente a versão; uma linha no histórico.

## 5. Mostrar e aguardar aprovação

Mostre o diff da spec e um resumo de impacto: telas, camada de cliente, contrato, fixtures do MSW, testes existentes. Diga se haverá **Aviso de backend**. Espere.

## 6. Alinhar o código

Depois de aprovado:

- contrato precisa mudar → **/contrato**;
- tarefa nova → **/tarefa T-xx**;
- só ajustou tarefas não feitas → pare.
