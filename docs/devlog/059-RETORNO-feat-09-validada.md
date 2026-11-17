# 059 — RETORNO: FEAT-09 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-09 · **Contrato:** v0.37 → v0.38 (`validado`, sem mudança de formato) · **Roadmap:** v0.43 → v0.44 · **Data:** 2026-11-17

## Objetivo

Rodar os cenários da FEAT-09 e a tela do grupo contra o backend real (`http://localhost:3333`).

## Passos e comandos

1. `/health` → `contractVersion` 0.37.
2. Cenários com um script Node temporário (no scratchpad, fora do repositório). Os 10 cenários (15 conferências) passaram: criação com a build de 60, `tcgFolder: []`, capacidade 30 e `["move", "recover", "adjustDeck", "endTurn"]`; `drawToHand` com a mão cheia (2 pontos, vida 22, Vigor 10, 7 na mão, deck 53); `shuffleHand` (mão vazia, deck 60) e `drawToHand` seguinte (7, 53); `adjustDeck` sem mudança (`200`, mesma build, trava cumprida, − 1 ponto); Força − 1 → `buildBelowMinimum` com o `savedAt` igual; Força + 1 → `notOwned` com o `cardId`; Resistência + 1 → `notOwned`; `nap` → `unknownOption`; `notPositiveInteger` e `duplicateCard`; com 0 pontos → `noActionPoints` e `["endTurn"]`; `recoverHandSize: 10` → grupo novo com 10 na mão e deck 50, `G` continua com 7. Laboratório resetado e grupos apagados.
3. Tela com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173`) e roteiro Playwright temporário (no scratchpad): "Comprar cartas" → "Recuperou: vida 22/22, Vigor 10." e 2 pontos; "Ajustar deck" com 9 linhas e Força 10; Força 9 → "A build ficou abaixo do mínimo de cartas."; 11 → "Você não tem cópias suficientes de Força."; 10 → "Build salva: 60 cartas.", seção fechada, 1 ponto; "Mão no deck" → 0 pontos, sem "Recuperar" nem "Ajustar deck". Nenhuma requisição fora do app e do backend.

## Problemas

- Backend com o conteúdo `base` (não a `fixture`): a build do guerreiro tem 9 cartas (Força 10, Resistência 10, …). Os cenários com `S` 29/31 viraram Força − 1/+ 1; o `notOwned` de carta fora da build virou Resistência + 1, porque todas as cartas básicas já estão na build. As invariantes conferidas são as mesmas.
- A primeira execução do script parou no meio (presumia a build da `fixture`) e deixou um grupo "Os Teimosos"; ele foi apagado (`204`). Os outros saves do backend não foram tocados.

## Checks

Cenários: 15/15. Tela contra o backend real: passou.

## Backend

Levar `docs/CONTRATO.md` v0.38 e `docs/ROADMAP.md` v0.44 para o backend.

## Commit sugerido

`chore/feat-09 validated against real backend`
