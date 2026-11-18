# 065 — T-49: Cliente da FEAT-32

- **ID:** T-49 · **FEAT:** FEAT-32 · **Contrato:** v0.47 (`implementado (BE)`) · **Spec:** v0.64 → v0.65 · **Data:** 2026-11-18

## Objetivo

Levar a FEAT-32 (cofre, deck de recompensas e Vasculhar) para a camada de cliente e o MSW (REQ-47 a REQ-52, D-59 item 6).

## Decisões

- D-59 item 8: `ACTION_INVALID` continua sem schema próprio; por exigência de tipo, já entram os rótulos do REQ-47, os motivos novos no `switch` de recusas (só a `message`) e o transporte dos campos novos no formulário do editor, sem controles; o MSW responde à doação da vara de pesca.

## Passos e arquivos

- `src/api/labConfig.ts`: `vaultCapacity`, `vaultDeckSlots`, `vaultGoldCapacity`.
- `src/api/catalog.ts`: `toolKind`, `scavengeZoneTypes`, `scavengeTool` (item), `scavengeTool` (equipamento), `rewardDecks` (dimensão).
- `src/api/parties.ts`: `vaultSchema`, campos novos do `PlayerState`, `scavenge`/`useVault` em `partyActionTypeSchema`, `UseVaultAction`/`VaultOperation`/`ScavengeAction`, 13 motivos novos e `operationIndex` em `ActionNotAllowedError`.
- `src/mocks/`: 3 cartas novas (20 no total), Porto Cinzento com `scavenge`, `useVault` nas fixtures da cidade, fixtures de Vasculhar, de lote e de erro, e os cenários nos handlers.
- `src/lab/LabPage.tsx`, `src/features/party/PartySession.tsx`, `src/lab/editor/cardFormValues.ts`: o mínimo exigido pelos tipos.
- Testes: novos `src/api/vault.test.tsx` e `src/lab/editor/cardFormValues.test.ts`; expectativas antigas alinhadas ao contrato (17 → 20 cartas, `useVault` na cidade, corpos do editor), incluindo `tests/e2e/lab/lab.spec.ts`.

## Como verificar

`npx vitest run src/api/vault.test.tsx src/lab/editor/cardFormValues.test.ts`; `/lab` mostra os 3 campos do cofre e 20 cartas no catálogo.

## Problemas

- Um Vite de outra sessão (porta 5173, `--strictPort`, provavelmente apontado para o backend real) era reaproveitado pelo Playwright e fazia os e2e falharem com "Servidor indisponível". Os e2e rodaram numa config temporária na porta 5174 (já apagada): 47 passaram.

## Checks

Guarda, typecheck, lint e format verdes; 635 testes unitários; `test:build` ok; e2e `lab`, `party` e `editor`: 47/47. O spec-reviewer aprovou.

## Backend

Nenhuma ação: o contrato já está `implementado (BE)`. A validação contra o backend real fica para depois da T-53.

## Commit sugerido

`feat/t-49 feat-32 client layer and msw`
