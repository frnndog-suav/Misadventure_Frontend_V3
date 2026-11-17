# 050 — RETORNO: FEAT-07 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-07 · **Contrato:** v0.28 → v0.29 (`implementado (BE)`) → v0.30 (`validado`, sem mudança de formato) · **Roadmap:** v0.31 → v0.33 → v0.34 · **Data:** 2026-11-17

## Objetivo

Aplicar a entrega do backend (Aviso de frontend da FEAT-07: CONTRATO v0.29, ROADMAP v0.33) e rodar os cenários e a tela do grupo contra o backend real.

## Passos e comandos

1. Primeira tentativa: o backend em `http://localhost:3333` era um processo antigo (`/health` → `contractVersion` 0.26; `POST /parties/:id/actions` → `404 NOT_FOUND`). O autor reiniciou o backend; depois disso o `/health` respondeu 0.29.
2. Cenários com `curl` (Git Bash). Os 7 passaram: `moveTargets` igual às travessias da zona atual; mover → `zoneId`, `respawnZoneId` e o resto de `player` iguais, `savedAt` avança, `GET` igual à resposta, voltar à cidade → `200`; mover para a própria zona → `409 ACTION_NOT_ALLOWED` `notConnected`, `savedAt` sem mudança; `fixture.nowhere` → `zoneNotInMap`; `fly`/`notString`+`unknownKey`/`required`/`invalidBody` (`[1]` e JSON malformado); sessão encerrada → `PARTY_SESSION_NOT_ACTIVE`; grupo inexistente → `404 PARTY_NOT_FOUND`. Os grupos criados foram apagados.
3. Tela com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173`) e um roteiro Playwright temporário (`tests/e2e/_tmp/real.spec.ts`, depois removido): a cidade inicial não mostra "Movimentar para"; mover para o 1º destino → "Você está em …", "Zona atual: …", "Lia está aqui"; voltar à cidade; recarregar mantém a posição; com a sessão encerrada, mover mostra "Não há sessão em andamento neste grupo.". Passou (1/1).

## Problemas

- O backend estava com o conteúdo `base` (não `CONTENT_DIR=test/fixtures/content`). Os cenários que citam `fixture.gray-harbor` rodaram com a cidade inicial real (`base.harbor-town`); o `fixture.gray-harbor` literal deu `zoneNotInMap`, o que está certo para esse mapa. As invariantes conferidas são as mesmas.

## Checks

Cenários: 7/7. Tela contra o backend real: 1/1.

## Backend

Levar `docs/CONTRATO.md` v0.30 e `docs/ROADMAP.md` v0.34 para o backend.

## Commit sugerido

`chore/feat-07 validated against real backend`
