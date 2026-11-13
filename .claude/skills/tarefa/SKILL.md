---
name: tarefa
description: Implementa UMA tarefa T-xx de docs/SPEC-FRONTEND.md no fluxo spec-anchored com TDD (testes primeiro a partir dos critérios Dado/Quando/Então, escopo fechado, definição de pronto, devlog, revisão), confere se depende do backend e PARA aguardando autorização. Use quando o autor pedir para implementar, fazer, começar ou continuar uma tarefa T-xx, ou "a próxima tarefa".
argument-hint: T-xx (ou "próxima")
model: sonnet
---

# /tarefa — implementar uma tarefa da spec

Tarefa pedida: **$ARGUMENTS**

Regra de ouro: **uma tarefa por invocação**. Ao terminar, pare. Nunca comece a próxima sem autorização explícita.

Instruções obrigatórias (README III.1):
- "Não disfarce suas dúvidas. Explicite as vantagens e desvantagens de cada escolha."
- "Implemente apenas o necessário para resolver o problema. Não acrescente nada baseado em suposições."
- "Modifique apenas o que for indispensável. Corrija ou limpe tudo aquilo que suas próprias alterações deixarem para trás."
- "Estabeleça critérios claros para considerar a tarefa concluída. Continue iterando até confirmar que eles foram atendidos."

## 1. Localizar a tarefa
1. Leia de `docs/SPEC-FRONTEND.md` **só** o que a tarefa cita: a linha da tarefa, os `REQ-xx` e `D-xx` dela, as partes da arquitetura que ela toca e o fim do histórico (para a próxima versão). Use Grep; **não leia o arquivo inteiro**. A spec é a fonte da verdade: não confie em memória de sessões anteriores. Do índice do devlog, leia só o fim (o próximo número).
2. Argumento "próxima" ou vazio → a primeira `- [ ]`.
3. As tarefas são feitas **em ordem**. Se uma anterior estiver `[ ]`, avise e pergunte se deve seguir.
4. Se a tarefa cita regras, leia **só** as seções do `docs/README.md` citadas, e o Apêndice B quando a seção tiver decisões registradas.
5. Liste para você: REQs e Ds, arquivos que ela toca, tipos do contrato envolvidos e onde a tarefa aparece no produto (como verificar).

## 2. Conferir a dependência do backend
- A tarefa usa endpoints, eventos ou tipos do contrato? Abra a seção da FEAT em `docs/CONTRATO.md`.
  - Seção ausente ou `proposto (FE)` sem confirmação → **pare**: rode `/contrato` ou mostre o **Aviso de backend** (formato no `CLAUDE.md`). Não invente formato de resposta.
  - `acordado` ou adiante → siga com o MSW respondendo as fixtures dos cenários da seção.
- A tarefa precisa de algo que o contrato não oferece → **pare** e mostre o Aviso de backend. Não contorne com regra no frontend (princípio 1).

## 3. Resolver ambiguidades antes do código
Releia os critérios e procure lacunas: bordas não descritas, ordem do que aparece, códigos de erro do contrato, interação com outros REQs.
- Ambiguidade **real** (o comportamento muda conforme a resposta) → AskUserQuestion, com uma opção recomendada. Não invente.
- Lacuna de **regra do jogo** → consulte o Apêndice B do README (ordem de desempate); se ainda faltar, pergunte.
- Lib nova → pergunte antes.
- Anote cada decisão para os passos 8 e 9.

## 4. Testes primeiro (red)
**Quem escreve:** você mesmo, por padrão. O agente **test-writer** só entra quando a tarefa muda a camada de cliente (`src/api/`, `src/mocks/`) ou tem testes em várias áreas ao mesmo tempo. (Cada subagente começa sem contexto e relê o projeto, o que custa caro.) Quando ele entra, o prompt traz o ID da tarefa, os REQs, a seção do contrato, as decisões do passo 3 e manda ler `.claude/agents/test-writer.md`.

Rode os testes novos e confirme que **falham pelo motivo certo** (implementação ausente), não por erro no teste.

**E2E:** se a tarefa mexe numa área da UI (tabela da `/testar`), escreva ou amplie os e2e dessa área, com o MSW. Áreas não tocadas não ganham e2e.

## 5. Implementar (green)
Implemente você mesmo; siga as regras de `.claude/agents/client-dev.md` e `.claude/agents/ui-dev.md` nas partes que a tarefa tocar.
- O mínimo para os testes passarem.
- **Nunca altere um teste para fazê-lo passar.** Se o teste contradiz a spec, pare e pergunte.
- Nenhuma regra do jogo no frontend; nenhuma regra nos handlers do MSW.
- Nada fora do escopo.

## 6. Verificação
Não crie painéis de desenvolvimento fora do laboratório. A tarefa é verificada pelo produto e pelos testes. Sem tela? Diga qual comando ou fluxo a verifica.

## 7. Definição de pronto
`npm run format` e depois **/checar** (que roda só os testes afetados pela **/testar**). Tudo verde.

## 8. Revisão
- Tarefa que muda um REQ, a camada de cliente ou o contrato em código → agente **spec-reviewer** com o ID.
- Tarefa só de tela ou docs → revise você mesmo o `git diff` contra a decisão: o código faz o que ela diz? Cada critério tem teste?
Corrija os bloqueantes; rode `/checar` de novo se algo mudou.

## 9. Fechar e PARAR
1. Marque `[x]` na spec.
2. Decisões tomadas → spec (novo `D-xx` ou critério no REQ), versão incrementada, linha no histórico.
3. Se a tarefa fecha o lado frontend de uma FEAT: atualize a coluna FE do `docs/ROADMAP.md` (`pronto` ou `aguardando outro lado`) e mostre o **Aviso de backend** pedindo a validação contra o backend real (`/retorno-backend`).
4. **/registrar-etapa**.
5. Responda com:
   - o que foi feito (curto);
   - **Roteiro de testes** (obrigatório): passos numerados que o autor executa sozinho. Cada passo diz *o que fazer* (comando, tela, controle, valor a digitar, ou uma alteração proposital no código para ver o erro) e *o que deve acontecer*. Inclua pelo menos um caso de erro/borda. Diga os pré-requisitos (rodar na raiz, `VITE_USE_MOCKS`, backend no ar) e **onde** o resultado aparece (arquivo/linha, tela, texto exato). Para cada controle de UI, diga a **tela/card**, o **nome visível** e o **tipo** (botão, rádio, caixa, campo). **Execute você mesmo cada passo antes** e copie o resultado real;
   - tabela critério → teste;
   - decisões registradas;
   - resultado dos checks;
   - **Aviso de backend**, se houver;
   - mensagem de commit sugerida (`tipo/descrição curta em minúsculas`).
6. Pergunte se pode seguir para a próxima (diga qual). **Não comece.** Recomende ao autor rodar **`/clear`** antes da próxima: tudo o que ela precisa já está na spec, no contrato, no devlog e na memória. (O agente não consegue rodar `/clear`.)

A suíte automatizada não precisa de aprovação. Só peça quando for realmente necessário (ex.: um critério que admite duas leituras e o teste fixa uma).
