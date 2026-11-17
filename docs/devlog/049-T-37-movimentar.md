# 049 — T-37: Movimentar

- **ID:** T-37 · **FEAT:** FEAT-07 · **REQs:** REQ-35 · **Decisão:** D-55 · **Contrato:** v0.28 (`acordado`) · **Spec:** 0.48 → 0.49 · **Data:** 2026-11-17

## Objetivo

Botão "Movimentar para {title}" na seção "Zona escolhida", envio de `POST /parties/:partyId/actions` com `{ type: "move", zoneId }`, a tela passando a mostrar o `Party` devolvido e as mensagens na área de status. Fecha o lado FE da FEAT-07 com MSW.

## Decisões

- O botão aparece só se a zona escolhida está em `moveTargets` do membro `isHost` (D-55 item 3; jogo solo até a FEAT-08).
- `PartySession` mostra `action.data ?? start.data`: o `200` substitui o `Party` sem novo `GET` (D-55 item 4); um erro mantém o último `Party` recebido.
- "Você está em {title}." usa a `zoneId` do host no `Party` devolvido (valor do backend), não a zona clicada.
- Prioridade na área de status: erro de encerrar → erro/sucesso da ação → demais (REQ-16/30).
- A escolha de zona continua estado local do `PartyMap`; como o componente não é remontado, ela persiste após mover.

## Arquivos

- `src/features/party/PartyMap.tsx` (botão; props `onMove`, `moving`); `src/features/party/PartySession.tsx` (`usePartyAction`, `Party` exibido, status).
- `src/features/party/PartySession.test.tsx` (+8 testes REQ-35); `tests/e2e/party/party-session.spec.ts` (+1).
- `docs/SPEC-FRONTEND.md` (T-37 `[x]`, 0.49), `docs/ROADMAP.md` (FEAT-07 FE `aguardando outro lado`).

## Como verificar

`npx vitest run src/features/party`; `npx playwright test tests/e2e/party`; `npm run dev` com mocks, `/grupo/party-os-teimosos`, escolher "Curva de Pedra", "Movimentar para Curva de Pedra", depois "Porto Cinzento" e mover de volta.

## Problemas

- O helper `zoneButton` dos testes novos usa `^título` porque "Movimentar para Mina Velha" também está dentro da região "Mapa".

## Checks

Unitários related: 84/84. E2E `party`: 9/9. Guarda, `typecheck`, `lint`, `format:check` e `test:build` (REQ-05): verdes.

## Backend

Falta validar a FEAT-07 contra o backend real (`/retorno-backend`).

## Commit sugerido

`feat/feat-07 move action on party screen`
