# 112 — T-82, montaria na tela do grupo e Transferir (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-84, REQ-85, D-64 item 10; spec v1.00
- Horas — a preencher

## Entrega

- `src/features/party/PartySession.tsx`: depois do "Inventário" e antes do "Cofre", o título "Montaria: {nome}" com "Inventário extra (n de m slots)" e "Pasta extra (capacidade c)" (ou "Sem montaria."). O componente `TransferControl` dá "Levar {nome} para a montaria" / "Trazer {nome} da montaria" e o campo "Quantidade de {nome}" (começa no total, só com mais de 1 cópia). Slot de equipamento envia `inventorySlotIndex` e `quantity: 1`, sem campo. O "Ajustar deck" inclui a pasta extra e mostra "Na pasta extra: {copies}". Os nomes das cartas da montaria entram na consulta ao catálogo (`cardIdsOf`).
- Status: "Levou {q}× {nome} para a montaria." / "Trouxe {q}× {nome} da montaria."; recusas com `message` + texto do motivo (`transferRefusalText`, próprio do Transferir).
- Testes: 24 unitários novos em `PartySession.test.tsx` (REQ-84 e REQ-85) e `tests/e2e/party/mount.spec.ts` (3).

## Decisões

- D-64 item 10: sem montaria, só "Sem montaria." (sem título); controles de transferir fora do bloqueio de encontro de evento aleatório (o REQ-85 só pede `prepare` e montaria).

## Verificação

- Os 24 unitários novos falharam antes pelo motivo certo (tela sem montaria); no fim, 24/24. Suíte inteira: 1153/1153. Tipos, lint, guarda, `format` e `test:build` verdes.
- E2E `party` em servidor próprio na porta 5174 (config temporária, apagada), com `VITE_USE_MOCKS=true`: todos verdes; as duas falhas da primeira rodada eram timeout da primeira compilação do Vite e passaram na repetição.
- No Windows, rodar o vitest com `D:` maiúsculo (aviso do `vitest.config.ts`); com `d:` nenhum teste roda.

## Problemas

- Nenhum novo.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-82 feat-18 mount in party screen and transfer`
