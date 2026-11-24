# 100 — T-73, Abrir booster no Preparar e no cofre (FEAT-16)

- Data — 2026-11-24
- Status — aguardando revisão (concluída com MSW)
- Contrato — v0.81, FEAT-16 `implementado (BE)`, sem mudança
- Spec — REQ-75, D-62 item 11; spec v0.89; ROADMAP v0.73
- Horas — null

## Entrega

- `PartySession.tsx`: botão "Abrir {nome}" no slot de booster do inventário (`prepare`, sem confirmação, mesmo bloqueio do "Equipar"); formulário "Abrir booster" (`BoosterForm`) na seção "Usar cofre"; status "Abriu {nome}."; textos de `notBooster`, `boosterEmpty` e `tcgFolderFull` do Preparar de booster; `BoosterResult` depois de um abrir bem-sucedido.
- `BoosterResult.tsx` (novo): lista "Cartas do booster {nome}" com "{nome} → pasta de TCG | inventário | cofre | entrega pendente".
- `RewardChoice.tsx`: "Origem: Booster {nome}" quando `source.type` é `booster`.

## Decisões (D-62 item 11)

- Booster reconhecido por `itemCategory` do catálogo (exibição, D-62 item 4); sem quantidade no formulário do cofre (abre 1).
- `tcgFolderFull` do booster tem texto próprio, escolhido pela operação enviada.

## Verificação

- Testes primeiro: 12 testes `REQ-75` em `PartySession.test.tsx`; 11 falharam antes (o 12º, "sem prepare não há Abrir", passa trivialmente). Teste de origem precisou do GET do grupo (a pendência recarrega o `Party`).
- E2E: um teste novo em `tests/e2e/party/party-session.spec.ts` (grupo `party-com-booster`). `party` 20/20, com config temporária na porta 5174 e `VITE_USE_MOCKS=true`.
- `npm test -- src/features/party src/api` 608/608; tipos, lint, guarda, build e formato verdes.
- Atenção: no Git Bash o Vitest só roda com o cwd em `/D/...` (drive maiúsculo).

## Backend

FEAT-16 pronta no FE com MSW; falta a T-74 (validação integrada). Aviso de backend emitido ao fim da tarefa.
