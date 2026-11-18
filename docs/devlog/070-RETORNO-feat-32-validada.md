# 070 — RETORNO: FEAT-32 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-32 · **Contrato:** v0.47 → v0.48 (`validado`, sem mudança de formato) · **Roadmap:** v0.52 → v0.53 · **Data:** 2026-11-18

## Objetivo

Rodar os cenários da FEAT-32 e as telas do Vasculhar e do Usar cofre contra o backend real (`http://localhost:3333`).

## Decisão

O backend tem só o conteúdo `base`, sem ferramenta, sem `scavenge` na Vila do Porto e com `rewardDecks: []`. Decisão do autor (2026-11-18): criar conteúdo temporário pelo editor do laboratório (rotas da FEAT-31) e desfazê-lo no fim.

## Passos e comandos

1. `/health` → `contractVersion` 0.47. Cópia de `base.harbor-town` e `base.old-coast` guardada no scratchpad.
2. Conteúdo temporário: `base.val32-fishing-rod` (tool, `fishing-rod`, inclui `urban`), `base.val32-silver-fish` e `base.val32-iron-ore` (material); `scavenge` na Vila do Porto; deck de recompensas `urban` na Costa Velha (peixe 1, minério 1, `base.healing-herb` 2).
3. Cenários com um script Node temporário (scratchpad), em 3 grupos novos, apagados no fim (`204`). 22/22 passaram: criação (cofre, capacidades, `scavengeTargets`, `lastScavenge`, ações); `scavenge` aparece com a vara; Vasculhar achou / não achou / `notScavengeable`; `inventoryFull`; lote store/storeGold/discard; `notInVault` (índice 1); `purseFull`; store + editBuild (62); saveDeck; `buildBelowMinimum`; `deckNotFound`; os 3 `400`; `zoneActionUnavailable` fora do Porto; `CONTENT_IN_USE` com grupo vivo.
4. Sem grupo que use o peixe, `DELETE` dele → `409` `CONTENT_REFERENCED`.
5. Tela com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173`) e um roteiro Playwright temporário: cofre vazio; "Vasculhar Peixe Prateado" → "Você achou Peixe Prateado.", inventário "1× Vara de Pesca", "1× Peixe Prateado"; de novo → "Peixe Prateado não estava no deck de recompensas."; lote com "Retirar ouro" 50 → "Esta ação não é permitida agora. Não há ouro suficiente no cofre." e a operação marcada "Recusada"; sem ela → "Cofre: 1 operação feita.", "Ouro no cofre 6". Nenhuma requisição fora do app e do backend. Grupo "Tela F32" apagado (`204`).
6. Conteúdo restaurado: zona e dimensão iguais à cópia; as 3 cartas `val32` apagadas (`204`); `cardCounts` da `base` como antes.

## Problemas

- Adaptações à `base`: Erva Medicinal no lugar da poção; o warrior da `base` tem Força 10 (não 30), então o editBuild somou +2 da mesma forma (62); a picareta não existe, então a conferência "com `K`, `scavengeTargets` vazio" ficou com os e2e do backend; o inventário cheio usou Escudos de Madeira.
- Um primeiro grupo criado com `curl` no bash saiu com o nome com acentos corrompidos; foi apagado (`204`).
- Saves que já existiam ("Tela F08", "Os Teimosos") não foram tocados.

## Checks

Cenários: 22/22 + `CONTENT_REFERENCED`. Tela contra o backend real: passou. Conteúdo do backend restaurado.

## Backend

Levar `docs/CONTRATO.md` v0.48 e `docs/ROADMAP.md` v0.53 para o backend.

## Commit sugerido

`chore/feat-32 validated against real backend`
