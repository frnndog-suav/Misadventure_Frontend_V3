# 117 — T-88, Alinhar o cliente ao CONTRATO v0.92 (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.93, FEAT-18 `implementado (BE)`, sem mudança nesta tarefa
- Spec — REQ-81, REQ-88; spec v1.06
- Horas — a preencher

## Entrega

- `src/api/blacksmith.ts`: resultado `craft` ganha `destination` (`inventory` | `mountInventory`, padrão `inventory`).
- `src/features/party/BlacksmithPanel.tsx`: "Criou {equipamento} por {gold} de ouro; foi para {destino}." (usa `receiveSpaceText`).
- MSW: `partyBlacksmithCraftedFixture` com `destination`; o `resolveReward` do `party-montaria` responde `rewardDoesNotFit` também para cópias acima do `maxCopies` do espaço.
- `PendingReward.destination` como espaço principal: o REQ-88 e o schema já liam o destino pronto; sem código novo.

## Decisões

- O texto do craft cita o destino sempre (também no inventário), para o jogador saber onde o item está; o contrato não fixa o texto. Alternativa descartada: citar só com `mountInventory` (como o `buyStock`), que deixaria o caso comum mudo.

## Verificação

- Testes novos falharam antes pelo motivo certo. E2E `party` (39) em servidor próprio na porta 5174 com `VITE_USE_MOCKS=true` (config temporária, apagada), porque o `.env.local` desliga os mocks e há um Vite na 5173.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-88 feat-18 align client to contract v0.92`
