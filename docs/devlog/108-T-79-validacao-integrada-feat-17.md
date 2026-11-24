# 108 — T-79: validação integrada da FEAT-17 (Ferreiro e Oficina)

- Data — 2026-11-24
- Status — FEAT-17 `validado`
- Retomada — devlogs 103 a 107; backend T-67 a T-73, devlog BE 089
- Contrato — v0.86 (`implementado (BE)`) → v0.87 `validado`; cenário "Lote com falha e quebra" corrigido (5 operações, nenhuma `skipped`)
- Roadmap — v0.79 → v0.80 (FEAT-17 `validado` | `validado`)
- Spec — v0.96: T-79 `[x]`
- Horas — null

## Objetivo

Rodar os cenários da FEAT-17 contra o backend real com o MSW desligado, nas campanhas preparadas pelo backend (`/retorno-backend`, passo 4). Nenhum código de `src/` mudou.

## Ambiente

- API em `http://localhost:3333`, `GET /health` → `{"status":"ok","contractVersion":"0.86"}`, conteúdo temporário da T-73.
- Tela: `npx vite --port 5173 --strictPort` com `.env.development.local` (`VITE_USE_MOCKS=false`), scripts Playwright no Google Chrome; chamadas HTTP por script Node (scratchpad da sessão, não versionados).

## Resultados na tela (todos conforme o esperado)

| Campanha | Resultado |
| --- | --- |
| ferreiro `345d1d9c-…` | Lote de 5 (2 refinos da Espada, Fio de Brasa, refino e Fio de Gelo na Lâmina Rúnica do inventário) → 200, 140 de ouro, 3 PA; ouro 160; sufixos "+2, encantamentos: Fio de Brasa" e "+1, encantamentos: Fio de Gelo". |
| quebra-mais-6 `c044ac05-…` | Refino +7 → "Falhou … D20 11 contra 12. Espada Curta quebrou.", ouro 230, arma "+6, quebrado". Um lote anterior com encantamento sem Fragmento → 409 `materialsMissing` na operação 2, marcada "Recusada" (nada mudou). |
| substituir `92676001-…` | Seleção "Substituir" → `replaceIndex: 0`; "…D20 11 contra 10. Substituiu Fio de Brasa.", ouro 250. |
| conserto-receita `e442177e-…` | Consertar (13, Reparado ×1) + Criar (15) → ouro 72, Espada Curta nova no inventário. |
| oficina `e92c7324-…` | Oficina: consertar a cópia quebrada por 7, 1 PA; a cópia +6 (teto) sem ações. |
| ferreiro-arcano `91e01620-…` (nova) | Runa da Guarda "encantamento extra" → `extra: true`, 200, "D20 15 contra 13", ouro 200, arma "encantamentos: Runa da Guarda". Na vez seguinte a opção extra some da projeção; POST de outro extra → 409 `enchantSlotUnavailable` (`operationIndex: 0`). A primeira campanha arcano (`5f35a6b8-…`) não tinha Minério; o backend preparou esta. |
| venda `69620f85-…` | `sellOffers` por cópia: +3 encantada 4, quebrada 0, Reparado ×2 2, padrão 3 (iguais à API); vender a +3 → `inventorySlotIndex: 0`, 200, ouro 4. |

## Por HTTP

Formato (4 casos de 400 com os `field`/`reason` do contrato), Oficina sem Artífice (409 `artificerInactive`), Laboratório (`refineGoldPerLevel` 10, `artificerMaxRefineLevel` 6, PATCH `refineThreshold10: 22` → `outOfRange`).

## Pendente

- O MSW e o teste da T-75 seguem o "Lote com falha e quebra" com 6 operações (D-63 item 8). O backend confirmou 5, nenhuma `skipped`. Alinhar a fixture é uma tarefa à parte, a autorizar.

## Arquivos

- `docs/CONTRATO.md` — v0.87; `docs/ROADMAP.md` — v0.80; `docs/SPEC-FRONTEND.md` — v0.96.
- `docs/devlog/108-…` (esta entrada), `docs/devlog/README.md`.

## Checks

Nenhum código mudou; testes, lint e tipos não foram rodados nesta etapa.

## Backend

Levar CONTRATO v0.87 e ROADMAP v0.80.

## Commit sugerido

`docs/validate feat-17 against real backend`
