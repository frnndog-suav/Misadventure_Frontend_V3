# 074 — T-56, status e ativação na partida

**FEAT-11 · 2026-11-20 · aguardando revisão · Spec v0.71 · Contrato v0.52**

## Implementação

- `EffectsPanel.tsx` apresenta os status na ordem recebida, com texto copiado, marca, origem e contagem quando presente. Também mostra os efeitos ativáveis do host e o texto de pagamento recebido. Cada cópia da mão tem seleção própria, inclusive quando o id se repete.
- `PartySession.tsx` usa a mutação de ações existente para enviar `prepare/activate`. O sucesso aplica o `Party` inteiro e limpa a escolha de pagamento do efeito. A recusa mantém o estado e a escolha. Durante o pedido, os controles de ação ficam desabilitados. `cardNames.ts` compartilha a resolução dos nomes entre a partida e o painel.
- `effectFixtures.ts` e `handlers.ts` disponibilizam o grupo estático `party-com-efeitos` no MSW. `catalogFixtures.ts` conserva o tipo de item da Poção de Cura usado no teste.
- `EffectsPanel.test.tsx`, `PartySession.test.tsx` e `tests/e2e/party/effects.spec.ts` cobrem apresentação, cópias, recusa, resposta inválida e aplicação do estado devolvido.
- A spec marca a T-56 concluída e o roadmap v0.55 marca o frontend da FEAT-11 como pronto com MSW. O contrato v0.52 segue como implementado no backend.

## Como verificar

1. Com `VITE_USE_MOCKS=true`, abra `/grupo/party-com-efeitos`. A partida deve mostrar 0 pontos de ação, 17/22 de Vida, **Nenhum status ativo.** e os efeitos de Poção de Cura e Tônico de Força.
2. Clique em **Ativar Tônico de Força — efeito 1**. Confira no pedido de ação a operação `activate` com `effectIndex: 0` e sem campo `payment`. A resposta deve mostrar **Efeito ativado.**, o status **Buff**, a origem **Tônico de Força**, **Restantes: 2** e **9 Ataque**. O tônico sai da lista de ativações.
3. Abra o mesmo grupo em uma nova navegação e ative a Poção de Cura. A Vida deve voltar a 22/22 e o inventário deve mostrar uma cópia da poção.
4. Para o caso de borda, rode os testes do REQ-54. Duas cópias de Força podem ser escolhidas separadamente e seus ids saem repetidos no pedido. Uma recusa preserva a escolha e a Vida, uma resposta inválida mostra a mensagem genérica, e um sucesso aplica os novos valores e limpa a seleção.

## Verificações

- Antes da implementação, a suíte de `EffectsPanel.test.tsx` falhou ao resolver o componente ausente. O typecheck mostrou quatro diagnósticos, entre o import ausente e o tipo amplo da fixture.
- Vitest nas sete suítes de partida, efeitos, ações, preparação e inventário: 287 testes passaram. A verificação também detectou e confirmou a correção da ordem entre as duas listas de modificadores.
- Playwright em `tests/e2e/party`: 23 cenários passaram com MSW, Chrome instalado e Vite isolado na porta 5175. A configuração temporária reutilizou o Vite para contornar o travamento no encerramento do servidor pelo Playwright.
- Build de release, TypeScript, ESLint, Prettier nos arquivos alterados de código e testes e `git diff --check` passaram. O Vite reportou um chunk acima de 500 kB.

## Pendência e backend

A T-57 deve validar no backend real todos os cenários da seção FEAT-11 do contrato v0.52, com MSW desligado. O autor leva o roadmap v0.55 e fornece a URL e o ambiente de teste com catálogo `fixture`, doações e editor habilitados. Os cenários abrangem ativação com e sem pagamento, recusas, passivos e expiração, além do catálogo e do editor.

Commit sugerido `feat/t-56 feat-11 show and activate party effects`.
