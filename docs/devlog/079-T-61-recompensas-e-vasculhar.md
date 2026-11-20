# 079 — T-61, recompensas pendentes e Vasculhar

**2026-11-20 · concluída com MSW · FEAT-12 · REQ-59 · D-61 · SPEC v0.74 · CONTRATO v0.57**

Retomada do registro 078.

## Entrega

- `PartySession.tsx` e `RewardChoice.tsx` apresentam uma cópia, o destino, as quantidades elegíveis e as ações Manter e Deixar. Uma recusa preserva o lote e mostra a mensagem recebida. O estado aceito atualiza a escolha, os saldos e o recibo de disposição.
- Na abertura com escolha pendente, a tela consulta o GET por meio de `useParty`, em `src/api/parties.ts`. Quando a recompensa tem prazo, a tela mostra a data e a hora locais e consulta o GET ao vencer. O backend aplica o desfecho. Com prazo nulo, a escolha aguarda a ação do jogador.
- Vasculhar interpreta `lastScavenge.delivery` para apresentar entrega no inventário, escolha pendente, devolução ou busca vazia.
- Os cenários estáticos em `randomEventFixtures.ts` e `handlers.ts` permitem recarregar uma pendência de Vasculhar e testar duas recompensas consecutivas do evento urbano. Os testes estão em `PartySession.test.tsx` e `tests/e2e/party/random-event.spec.ts`. A spec, o índice e o registro de tempo foram atualizados, com horas em `null`.

## Como verificar

1. Com `npm.cmd run dev` e MSW, abra `/grupo/party-vasculhar-sem-espaco` e vasculhe Peixe Prateado. Confira a escolha com 0 PA. Clique em **Deixar** e confirme a devolução ao deck.
2. Abra e recarregue `/grupo/party-vasculhar-pendente`. A pendência solo permanece aberta. Selecione uma cópia de Minério de Ferro, clique em **Manter** e confira Peixe Prateado no inventário.
3. Em `/grupo/party-evento-premio-urbano`, clique em **Manter** com descarte vazio. A mensagem informa que o lote não libera espaço. Descarte um Peixe Prateado e clique novamente em **Manter**. Confira o recibo do Minério de Ferro e a próxima escolha de Poção de Cura. Clique em **Deixar** e confira a saída da reserva. Em `/grupo/party-evento-premio-fixo`, **Deixar** deve indicar envio ao limbo.
4. Abra `/grupo/party-vasculhar-pilha` e `/grupo/party-vasculhar-vazio`. Vasculhe Minério de Ferro em cada cenário. No primeiro, a pilha aumenta para duas cópias. No segundo, aparece a mensagem de que a carta estava ausente. Em ambos, a busca gasta 1 PA e segue sem escolha.
5. O teste de borda de prazo em `PartySession.test.tsx` controla o retorno do GET e confirma que a expiração aplica o estado recebido sem enviar uma ação Deixar.

## Verificações

- Os três testes iniciais do REQ-59 falharam pela ausência da escolha, da recarga e do prazo na tela. Após a implementação, 230 testes passaram em `PartySession.test.tsx`, `partyActions.test.tsx` e `vault.test.tsx`.
- Os 25 testes de navegador da área `party` passaram com o Chrome local, usando uma configuração temporária.
- `npm.cmd run lint` e `npm.cmd run test:build` passaram. O build confirmou a REQ-05 e manteve o aviso de tamanho do bundle.

## Backend e retomada

A T-62 depende da implementação da seção FEAT-12 do CONTRATO v0.57, da URL do backend e dos saves de teste determinísticos da seção. A FEAT-12 aguarda validação real com MSW desligado. Os cenários de relógio multiplayer seguem a FEAT-26.

Commit sugerido `feat/t-61 feat-12 resolve pending rewards and scavenge results`.
