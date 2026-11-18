# 066 — T-50: Laboratório e catálogo da FEAT-32

- **ID:** T-50 · **FEAT:** FEAT-32 · **Contrato:** v0.47 (`implementado (BE)`) · **Spec:** v0.65 → v0.66 · **Data:** 2026-11-18

## Objetivo

REQ-47 (3 campos do cofre na configuração do `/lab`) e REQ-48 (ferramenta, "Vasculha em", "Coletada com" e "Decks de recompensas" nas cartas do catálogo). Os campos do REQ-47 já tinham entrado na T-49 (D-59 item 8); aqui entrou o e2e.

## Decisões

- D-59 item 9: "Coletada com" vem logo depois dos efeitos (no item, depois de "Ferramenta" e "Vasculha em"; no equipamento, antes do refino), porque o REQ-48 não fixa a posição. Os nomes dos decks de recompensas vêm de `useCatalogCard` por carta (mesmo cache, D-48), porque o erro é por carta e `useCatalogCards` só expõe o primeiro erro. Por isso a Carta de Dimensão com decks precisa de `QueryClientProvider`.
- `toolKind` e `scavengeTool` aparecem como o texto recebido (D-59 item 4).

## Passos e arquivos

- `src/ui/cards/parts.tsx`: `ScavengeTool` ("Coletada com: {tool}"; `null`, nada).
- `src/ui/cards/ItemCard.tsx`: "Ferramenta: {toolKind}" e "Vasculha em: {rótulos de `zoneTypeLabels`, separados por vírgula}" quando `toolKind` não é `null`; depois, `ScavengeTool`.
- `src/ui/cards/EquipmentCard.tsx`: `ScavengeTool` depois dos efeitos.
- `src/ui/cards/DimensionCard.tsx`: lista "Decks de recompensas" (um item por tipo de zona, com a sublista "{copies}× {nome}" rotulada pelo tipo); nome "…" até chegar e o id da carta em caso de erro.
- Testes: `ItemCard.test.tsx` (3), `EquipmentCard.test.tsx` (1), `DimensionCard.test.tsx` (3 novos; o arquivo passou a usar MSW e `QueryClientProvider`, os testes antigos têm as mesmas asserções); `tests/e2e/lab/lab.spec.ts` (REQ-47 e REQ-48).

## Como verificar

`npm run dev` com mocks, em `/lab`, seção "Catálogo": filtro "Item (5)" → "Vara de Pesca" mostra "Ferramenta: fishing-rod" e "Vasculha em: Costeira, Fluvial, Lacustre, Urbana"; "Peixe Prateado" mostra "Coletada com: fishing-rod"; filtro "Dimensão (1)" → "Dimensão de Teste" lista "Urbana" com "1× Peixe Prateado", "1× Minério de Ferro", "2× Poção de Cura". Na "Configuração", "Capacidade do cofre" = 30.

`npx vitest run src/ui/cards`; e2e da área `lab`.

## Problemas

- De novo havia Vites de outras sessões em 5173 e 5179; o Playwright reaproveitava o da 5173 (sem MSW) e 9 e2e falharam com "Servidor indisponível". Rodaram com uma config temporária na porta 5199 (`VITE_USE_MOCKS=true`, `reuseExistingServer: false`), apagada depois.

## Checks

Guarda, typecheck, lint e format verdes; `vitest related` nos 4 componentes: 357/357 (17 arquivos); e2e `lab` 11/11; `editor` e `party` 38/38; `test:build` ok (laboratório fora do release). Revisão própria do diff (tarefa só de tela).

## Backend

Nenhuma ação: o contrato já está `implementado (BE)`. A validação contra o backend real fica para depois da T-53.

## Commit sugerido

`feat/t-50 feat-32 lab and catalog`
