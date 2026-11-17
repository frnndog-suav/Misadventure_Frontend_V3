# 054 — RETORNO: FEAT-08 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-08 · **Contrato:** v0.33 → v0.34 (`validado`, sem mudança de formato) · **Roadmap:** v0.38 → v0.39 · **Data:** 2026-11-17

## Objetivo

Rodar os cenários da FEAT-08 e a tela do grupo contra o backend real (`http://localhost:3333`).

## Passos e comandos

1. `/health` → `contractVersion` 0.33.
2. Cenários com um script Node temporário (no scratchpad, fora do repositório). Os 8 passaram: criação com `turn = { round: 1, memberId: M, actionPoints: 3 }` e `["move", "endTurn"]`; três `move` → 2, 1, 0 pontos e `["endTurn"]`; `move` com 0 pontos → `409 ACTION_NOT_ALLOWED` `noActionPoints`, `savedAt` e zona sem mudança; `endTurn` com 0 pontos → rodada 2, 3 pontos, `GET` igual; `endTurn` de novo → rodada 3, 3 pontos; `now` → `400 ACTION_INVALID` `unknownKey`; sessão encerrada → `409 PARTY_SESSION_NOT_ACTIVE` e `turn` mantido ao continuar; `actionPointsPerTurn: 5` → grupo novo com 5, `G` continua com 3 (config resetada). Grupos apagados.
3. Tela com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173`) e roteiro Playwright temporário (removido): "Rodada 1 · Vez de Lia · 3 pontos de ação"; três Movimentar → 2, 1, 0; com 0 pontos, "Sem pontos de ação para Movimentar." e nenhum botão "Movimentar para"; "Encerrar a vez" → "Rodada 2", 3 pontos; Movimentar volta a funcionar. Nenhuma requisição ao MSW.

## Problemas

- Backend com o conteúdo `base` (não a `fixture`): `H` = `base.harbor-town`, `A` = `base.misty-forest`. As invariantes conferidas são as mesmas.

## Checks

Cenários: 8/8. Tela contra o backend real: passou.

## Backend

Levar `docs/CONTRATO.md` v0.34 e `docs/ROADMAP.md` v0.39 para o backend.

## Commit sugerido

`chore/feat-08 validated against real backend`
