---
name: visual
description: Fluxo de UMA mudança de UX/design (estilo, tipografia, cor, animação, transição, ícones, layout) - consulta o devlog e o git log, separa o que é visual do que é comportamento (spec), delega aos agentes ux-designer e motion-dev, roda os checks e a revisão visual, registra no devlog e PARA com um roteiro de testes. Use quando o autor pedir para deixar algo mais bonito, mudar estilo, cor, fonte, animação, transição, ícone ou layout.
argument-hint: descrição da mudança visual
---

# /visual

Mudança pedida: **$ARGUMENTS**. **Uma mudança por invocação.**

## 1. Contexto (obrigatório)

1. Leia **/guia-visual** (e **/assets**, se envolver imagens ou ícones).
2. Histórico: índice do devlog e as entradas que tocaram os mesmos arquivos/telas; `git log --oneline -- <arquivos>` (e `git show --stat <hash>` se precisar). Anote as decisões que restringem a mudança (foco, área de clique, textos testados…).
3. Leia na spec as decisões que regem as telas afetadas.
4. Se o guia marca o assunto como _a definir_, pergunte ao autor antes (com uma opção recomendada).

## 2. Classificar

| Tipo                            | Exemplo                                                                  | Caminho                                                   |
| ------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| Só visual                       | cor, fonte, borda, espaço, sombra, animação, ícone decorativo            | passo 3                                                   |
| Decisão de design durável       | paleta, fonte, tokens, padrão de animação, convenção de ícones           | segue, e no fim vira `D-xx`, versão sobe, guia atualizado |
| Muda comportamento ou conteúdo  | texto de botão, papel ARIA, controle novo, tela nova, campo novo no dado | **pare**: `/mudar-spec` (e depois `/tarefa`)              |
| Precisa de dado novo do backend | mostrar um valor que a tela ainda não recebe                             | **pare**: `/contrato`                                     |

Nenhuma lib nova sem autorização.

## 3. Implementar

- Estilo, tokens, tipografia, superfícies, ícones → **ux-designer**.
- Animações e transições → **motion-dev**.
- Os dois → ux-designer primeiro (define os tokens), depois motion-dev.

O prompt de cada agente leva: a mudança, os arquivos e telas, as decisões anteriores do passo 1, o que **não** pode mudar (textos e papéis testados) e manda ler a própria definição em `.claude/agents/`.

## 4. Verificar

1. `npm run format` e **/checar**. Testes existentes não podem ser alterados para acomodar estilo; se algum quebrou, a mudança alterou comportamento: volte ao passo 2.
2. **/revisar-visual** sobre o diff. Corrija os bloqueantes.
3. `npm run dev` e confira as telas nas resoluções da faixa suportada (guia §6), com e sem _reduced motion_ (DevTools → Rendering).

## 5. Fechar e PARAR

1. Decisão durável → `D-xx`, versão, histórico, guia atualizado.
2. **/registrar-etapa** com id `UX-nn`.
3. Responda com: o que mudou; **roteiro de testes** (tela/card, nome visível e tipo de cada controle, onde olhar, o que aparece, incluindo _reduced motion_ e a menor resolução suportada; execute antes o que puder); checks; commit sugerido.
4. Pergunte se pode seguir. **Não comece a próxima.**
