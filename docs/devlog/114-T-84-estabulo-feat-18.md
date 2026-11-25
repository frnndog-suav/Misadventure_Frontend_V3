# 114 — T-84, Estábulo (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-87; spec v1.02
- Horas — a preencher

## Entrega

- `src/features/party/MarketPanel.tsx`: grupo "Estábulo" depois de "Serviços" quando `market.stable` não é `null`. Por oferta, "{nome} — {price} de ouro" e "Comprar {nome}" (`buyMount`); com `currentMount`, "Sua montaria: {nome} — vende por {price} de ouro", com " (esvazie o inventário extra e a pasta extra antes)" se `sellable: false`, e "Vender {nome}" (`sellMount`), sempre habilitado. Descrição na lista, "Total previsto" e linhas do resultado já vinham da T-80.
- `src/features/party/PartySession.tsx`: textos de `mountNotOffered`, `mountAlreadyOwned`, `noMount` e `mountNotEmpty` no mercado; ids das montarias do Estábulo entram nas cartas cujos nomes são buscados.
- Testes: 8 unitários novos em `MarketPanel.test.tsx` (REQ-87) e 1 e2e em `tests/e2e/party/mount.spec.ts`.

## Decisões

- Nenhuma nova: o REQ-87 cobre os casos.

## Verificação

- 7 unitários falharam antes pelo motivo certo (grupo e textos ausentes); no fim, 42/42 no arquivo e 358/358 nos afetados. Tipos, lint, guarda, `format:check` e `test:build` verdes.
- E2E `party` em servidor próprio na porta 5199 (config temporária, apagada) com `VITE_USE_MOCKS=true`, porque o Vite do autor na 5173 está sem mocks: 36/36.

## Problemas

- Os nomes das montarias do Estábulo apareciam como "…" porque os ids não entravam na busca de nomes; corrigido em `marketCardIds`.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-84 feat-18 stable`
