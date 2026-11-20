# 078 — T-60, encontro de evento aleatório na tela do grupo

**2026-11-20 · concluída com MSW · FEAT-12 · REQ-57 e REQ-58 · D-61 · SPEC v0.74 · CONTRATO v0.57**

Retomada do registro 077.

## Entrega

- `PartySession.tsx` mantém a abertura da sessão e consulta o GET quando a abertura devolve um encontro. Após uma ação, usa o último estado aceito. O consumível usa o controle da FEAT-11, inclusive com 0 PA. Durante o encontro, `prepare` habilita somente ativação.
- `RandomEventPanel.tsx` mostra antecipação, carta revelada, requisitos, progresso, recibos, mínimos recusados, desistência e fuga. A seleção usa os IDs elegíveis e mantém as escolhas ainda válidas após uma recusa. Equipamentos usam slots e recursos são agregados por carta. O resultado mostra desfecho, reposição efetiva e a penalidade de PA ou dívida recebida.
- `PartySession.test.tsx` cobre a abertura, o GET, a ativação, o pagamento escolhido e aleatório, a manipulação integral, a recusa, a resolução, a desistência e a fuga. `tests/e2e/party/random-event.spec.ts` percorre a antecipação e os dois pagamentos até o êxito no navegador.
- A spec marca a T-60 concluída. O índice e o registro de tempo incluem a etapa, com horas em `null`.

## Como verificar

1. Com `npm.cmd run dev` e MSW, abra `/grupo/party-evento-aleatorio`. Clique em **Iniciar evento** e confira a antecipação com a carta oculta. Clique em **Revelar carta** e confira a Carroça na estrada, os requisitos e os textos dos desfechos.
2. Pague escolhendo `h2`. O recibo deve identificar essa cópia, o requisito deve ficar parcial e a fuga deve sumir. Pague com `h1` e espere **Êxito** com reposição de 2 de 2 cartas. Para verificar a recarga com as fixtures estáticas, recarregue `/grupo/party-evento-revelado` e confirme que a carta continua revelada.
3. Em `/grupo/party-evento-consumivel`, ative o efeito da poção com 0 PA. A vida deve subir de 10 para 15, restar uma poção e o encontro continuar aberto. O estado estático `/grupo/party-evento-consumivel-apos-parte` deve mostrar o recibo sem oferecer ativação ou fuga.
4. Como caso de borda, em `/grupo/party-evento-copia-recusada`, pague com `h2`. Espere mínimo de Vigor 5 e atual 4, seleção ainda marcada e nenhum novo recibo. Em `/grupo/party-evento-descarte-aleatorio`, pague e confira a cópia sorteada `h2` no recibo e o saldo de uma cópia.
5. Em `/grupo/party-evento-minimo`, tente pagar o Vigor. A recusa deve preservar os recibos anteriores. Confirme **Desistir** e confira revés com reposição de 1 de 1 carta. Em `/grupo/party-evento-fuga-sem-pa`, confira o custo de 2 de Vigor e limiar 10. Confirme **Fugir** e espere rolagem 10, revés e dívida de 1 PA.

## Verificações

- Os primeiros testes falharam pela ausência das ações e da seleção por cópia. A execução direcionada de `PartySession.test.tsx`, `EffectsPanel.test.tsx`, `partyActions.test.tsx` e `RandomEventCard.test.tsx` passou com 218 testes.
- `npm.cmd test` teve 807 aprovados e duas falhas já registradas nos devlogs 076 e 077, na importação do REQ-33 e na busca com debounce do REQ-20.
- Os 24 testes de navegador da área `party` passaram. Como o Chromium gerenciado pelo Playwright não estava instalado, usei o Chrome local com uma configuração temporária.
- `npm.cmd run lint` e `npm.cmd run test:build` passaram. O build inclui tipos e a verificação de release da REQ-05. O Vite manteve o aviso de tamanho do bundle.

## Backend e retomada

O CONTRATO v0.57 segue acordado. A T-61 pode seguir com MSW para REQ-59 e D-61. A verificação da FEAT-12 com MSW desligado fica na T-62, quando houver implementação da seção FEAT-12, URL e saves de teste.

Commit sugerido `feat/t-60 feat-12 add party random event encounters`.
