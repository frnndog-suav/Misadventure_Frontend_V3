# 101 — T-74: validação integrada da FEAT-16 (Mercado)

- Data — 2026-11-24
- Status — FEAT-16 `validado`
- Retomada — devlogs 097 a 100; backend T-61 a T-66, devlog BE 081
- Contrato — v0.81 (`implementado (BE)`, sem mudança de formato) → v0.82 `validado`
- Roadmap — v0.73 → v0.74 (FEAT-16 `validado` | `validado`)
- Spec — v0.90: T-74 `[x]`
- Horas — null

## Objetivo

Rodar os cenários da FEAT-16 contra o backend real com o MSW desligado, nas campanhas preparadas pelo backend (skill `/retorno-backend`, passo 4). Nenhum código de `src/` mudou.

## Ambiente

- API em `http://localhost:3333`, `GET /health` → `{"status":"ok","contractVersion":"0.81"}`, catálogo temporário da T-66 (fator 100, vitrine do Porto fixa, zona extra `fixture.t66-outpost` sem singles), `LAB_ENABLED=true`.
- Chamadas HTTP: script Node com `fetch` no scratchpad da sessão (não versionado).
- Tela: `npx vite --port 5173 --strictPort` com `.env.development.local` (`VITE_USE_MOCKS=false`, `VITE_API_URL=http://localhost:3333`), Playwright no Google Chrome.

## Resultados por campanha (todos conforme o esperado)

| Campanha | ID | Resultado |
| --- | --- | --- |
| mercado-singles | `4f728fa8-…` | `buySingle` 0 → 200, ouro 294, 2 PA, Espada no inventário (`gold: -6`), slot 0 reposto com Escudo de Carvalho a 5. Slot 3 → 409 `showcaseSlotEmpty`; slot 4 → 409 `showcaseSlotNotFound` (`operationIndex: 0`). Lote [single 1, Flechas ×2, booster ×1] → 200, ouro 253, 1 PA, resultados −5/−6/−30, slot 1 reposto. |
| mercado-sem-singles | `c0ab868d-…` | GET: `showcase: null`, estoque Poção 6 e Flechas 3 (×10), booster 30. `buySingle` → 409 `singlesUnavailable`; Vara de Pesca → 409 `notInMarketStock` com `cardId`; Poção ×1 → 200, ouro 94. |
| venda | `7e75a9a6-…` | `sellOffers`: Moeda 25, Espada 3, Flechas 1/lote de 10 (owned 20), Força da pasta 2. 15 Flechas → 409 `notLotMultiple` (`fixture.arrows`). Lote de 4 vendas → 200, ouro 33, sobram 10 Flechas, pasta vazia. |
| ouro-perdido | `2bd4677a-…` | Vender Moeda → 200, ouro 300, `goldLost: 15`. |
| expansoes | `afa67591-…` | `vaultGold` → 409 `notEnoughGold`. Lote [purse, vaultSlots, tcgFolder] → 200, ouro 40, bolsa 600, cofre 35, pasta 40, expansões 1/1/1. `deckSlots` → 409 `notEnoughGold`. Encerrar e reabrir a sessão preserva. |
| booster-inventario | `a0d03e40-…` | `prepare` `openBooster` → 200, 3 PA, `via: prepare`, 8 cartas (Tônico, Armadura, Poção, Varinha no inventário; 1 Força e 3 Destreza na pasta). Poção → 409 `notBooster`. |
| booster-pasta-cheia | `932353bb-…` | 409 `tcgFolderFull`. |
| booster-pendente | `49323353-…` | 200; Tônico no inventário, 3 cartas `pending`; `pendingRewards[0]` Armadura, `source: {type: booster}`, `origin: fixed`; só `resolveReward`. De novo → 409 `choicePending`. `leave` ×3 → Poção, Varinha, sem pendência (`sentToLimbo`). |
| booster-cofre | `76e87791-…` | `useVault [openBooster]` → 200, 2 PA, `via: useVault`, 8 cartas em 6 slots do cofre. |
| fora-do-mercado | `b8c20850-…` | Mina Velha: `market: null`, sem `visitMarket`; POST → 409 `zoneActionUnavailable`. |
| legado | `3c17d259-…` | Fator 100, `showcase: null`, estoque 6/3/20; `buySingle` → 409 `singlesUnavailable`. |

## Tela (MSW desligado)

`/grupo/4f728fa8-…` (mercado-singles, depois das compras): "Ir ao Mercado" abre a seção com ouro 253, fator 100%, estoque, boosters, vitrine (Escudo de Carvalho, Resistência, Moeda da Sorte, slot 4 vazio), ofertas de venda (Espada, Flechas por lote de 10, Booster, Força da pasta) e serviços com os preços da API. Todas as chamadas à API 2xx.

## Arquivos

- `docs/CONTRATO.md` — v0.82: seção FEAT-16 `validado`, histórico.
- `docs/ROADMAP.md` — v0.74.
- `docs/SPEC-FRONTEND.md` — v0.90, T-74 `[x]`.
- `docs/devlog/101-…` (esta entrada), `docs/devlog/README.md`.

## Como verificar

```
curl http://localhost:3333/parties/afa67591-a842-4042-a398-1ec1616199c3
```

Deve mostrar `expansions` purse/vaultSlots/tcgFolder = 1 e ouro 40.

## Checks

Nenhum código mudou; testes, lint e tipos não foram rodados nesta etapa.

## Backend

Nada pendente: o resultado volta ao backend pela cópia do CONTRATO v0.82 e do ROADMAP v0.74.

## Commit sugerido

`docs/validate feat-16 against real backend`
