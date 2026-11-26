# 122 — T-92, ação e painel de conclusão da dimensão (FEAT-19)

- Data — 2026-11-26
- Status — concluída com MSW
- Contrato — v0.96, FEAT-19 `acordado`
- Spec — REQ-93, REQ-95 e D-65
- Horas — `null`

## Entrega

- `src/features/party/PartySession.tsx` mostra “Concluir dimensão (1 PA)” quando a ação está em `availableActions`. Envia `completeDimension`, bloqueia o botão durante o pedido e usa a área de status para o andamento e as recusas.
- O modal usa `lastDimensionCompletion`, resolve os nomes das cartas pelo catálogo e mostra os destinos, o ouro e o Pico recebidos. “Continuar” recebe o foco. O fechamento vale para a abertura atual da tela. Se o resumo indicar congelamento, o botão volta ao início com “Save congelado.”.
- `src/features/party/CombatPanel.tsx` acrescenta “Chefe final” ao título do combate de conclusão e usa a disponibilidade de fuga já recebida para decidir se mostra o botão.
- `tests/e2e/party/party-session.spec.ts` cobre a ação, a espera pelo POST, as recusas, a abertura do combate, a reabertura do modal e os dois destinos de “Continuar”.

## Verificação

- Na versão anterior da tela, os testes da ação e da reabertura falharam pela ausência do botão e do modal, respectivamente.
- Em `/grupo/party-conclusao`, conclua a dimensão. O modal mostra a Lâmina do Crepúsculo para o inventário, +100 de ouro, Pico +25 para Lia e a Segunda Dimensão. “Continuar” fecha o modal e deixa a nova partida acessível.
- Em `/grupo/party-dimensao-concluida`, feche o modal e reabra a tela. O resumo aparece novamente. Em `/grupo/party-ultima-dimensao`, conclua e confirme que “Continuar” volta para “Seus jogos” com “Save congelado.”.
- Caso de borda — em `/grupo/party-chefe-final`, concluir abre o combate “Chefe final · Guardião da Mina” sem “Fugir”. Uma recusa de conclusão mantém a partida e mostra a mensagem recebida.
- Passaram 45 cenários E2E da área `party` em Chromium com MSW em servidor isolado e 418 testes em oito arquivos de Vitest (área `party` e cliente de ações). Tipos, lint e formatação dos arquivos TypeScript alterados e build de release passaram.

## Retomada

T-93, resultado do combate do chefe final e sequência dos resumos (REQ-93, REQ-94 e D-65). O título do combate e a abertura pela ação já estão cobertos. A validação com a API real segue na T-95.

## Commit sugerido

`feat/t-92 feat-19 complete dimension and show summary`
