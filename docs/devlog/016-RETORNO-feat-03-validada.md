# 016 — RETORNO: FEAT-03 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-03 · **Contrato:** §3 FEAT-03, v0.8 (`implementado (BE)`) → v0.9 (`validado`) · **Roadmap:** v0.10 → v0.11 · **Data:** 2026-11-14

## Objetivo

Rodar os cenários de validação da FEAT-03 contra o backend real e fechar a FEAT.

## O que chegou do backend

CONTRATO v0.8 e ROADMAP v0.10, trazidos pelo autor. A FEAT-03 está `implementado (BE)`, sem mudança de formato. As rotas existem só com `LAB_ENABLED=true`. JSON malformado no PATCH devolve `invalidBody`. Os ajustes persistem no banco. `/health` informa `0.8`. Conferido no diff: só mudaram o cabeçalho, o status da seção e o histórico.

**Atenção:** a cópia do roadmap que veio do backend substituiu a linha 0.10 do FE (FE `aguardando outro lado`) e voltou a coluna FE da FEAT-03 para `a fazer`. Na v0.11 isso foi recomposto: as duas colunas estão `validado`, e o histórico do FE foi registrado na linha nova.

## Passos e comandos

1. Backend no ar em `http://localhost:3333`, com `/health` respondendo `{"status":"ok","contractVersion":"0.8"}`.
2. Cenários do contrato com o script `feat03.mjs` (Node + `fetch`, no scratchpad da sessão; não fica no repositório). Ele zera o estado com `POST /lab/config/reset`, roda cada cenário e compara com o JSON esperado do contrato.
3. E2E no navegador com o MSW desligado. As variáveis vão pelo ambiente do processo, que no Vite vence os `.env*`:
   `VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173 --strictPort` em segundo plano, depois `npx playwright test tests/e2e` (o Playwright reaproveita o servidor).

## Resultado

| Cenário (CONTRATO §3 FEAT-03) | Resultado |
|---|---|
| GET: values/defaults = Padrão, limits = Mínimo–máximo | OK |
| PATCH `{actionPointsPerTurn:4}` → 200; GET seguinte igual (persistência) | OK |
| PATCH `{actionPointsPerTurn:0, foo:1}` → 400 outOfRange + unknownKey; GET mostra padrões | OK |
| PATCH minPlayers 5 / maxPlayers 3 → minAboveMax nos dois | OK |
| PATCH `{initialGold:2.5}` → notInteger | OK |
| reset após ajuste → values = defaults | OK |
| extra: JSON malformado → `invalidBody` com `field: null` | OK |
| extra: `/health` → `0.8` | OK |
| extra: CORS para `http://localhost:5173` | OK |
| e2e da área `lab` (4) com MSW desligado | 4/4 |

Não foi rodado o cenário "laboratório desligado → 404", que exigiria reiniciar o backend com `LAB_ENABLED=false`. Ele está coberto pelos e2e do backend e, no frontend, pelo unitário de 404 do REQ-06.

Na mesma rodada, 2 e2e da área `app` falham **por desenho** com o MSW desligado: um espera a fixture `contrato v0.4` e o outro espera o log do MSW no console. Não são da FEAT-03, e o backend real respondeu `v0.8`, que é o correto.

## Dependência do backend

Nenhuma pendente. Levar para o backend: `docs/CONTRATO.md` v0.9 e `docs/ROADMAP.md` v0.11.

## Commit sugerido

`docs/feat-03 validated against real backend`
