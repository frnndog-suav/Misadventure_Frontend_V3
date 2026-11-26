# 127 — Cliente e fixtures MSW da FEAT-33

- Data — 2026-11-26
- Status — T-96 concluída
- Horas — null

## Alterações

- `docs/CONTRATO.md` v1.02 e `docs/ROADMAP.md` v0.90 foram copiados integralmente do backend. Cada cópia foi conferida por SHA-256.
- `src/api/catalog.ts` aceita as duas listas da Carta de Dimensão, preserva sua ordem e lê a ausência de cada lista como `[]`. O editor, o tipo `CardInput` e o schema de `CollectionExport` derivam do schema compartilhado.
- `src/mocks/catalogFixtures.ts`, `src/mocks/editorFixtures.ts`, `src/mocks/handlers.ts` e `src/mocks/collectionCirculationFixtures.ts` oferecem respostas para cartas de dimensão e mercados com vigência legada ou múltipla. Os cenários usam IDs de exemplo locais.
- `src/api/catalog.test.tsx`, `src/api/collectionCirculation.test.ts` e `src/api/preparation.test.tsx` verificam os campos, as ofertas e os resultados nos formatos existentes.

## Verificação

- Suíte do frontend com 1.197 testes aprovados. Typecheck, ESLint nos arquivos alterados e `git diff --check` passaram. O build terminou com aviso de bundle acima de 500 kB.
- Carta legada recebe listas vazias. Carta configurada preserva os IDs e a ordem no catálogo, no editor e na leitura de exportação.
- Mercado vigente retorna boosters das três origens. Mercado legado oferta só o booster da coleção própria. A compra por slot retorna o ID original do single e seu destino.
- Caso de borda com single válido seguido de booster fora da oferta retorna `409 ACTION_NOT_ALLOWED`, `reason: notMarketBooster` e `operationIndex: 1`. O GET subsequente preserva o retrato inicial da campanha.
- Abertura de booster reimpresso em `prepare` e de booster fora da oferta em `useVault` retorna IDs originais e os destinos contratados.

## Pendências

As telas do catálogo e do editor seguem na T-97. O fluxo de mercado e abertura segue na T-98. A T-99 aguarda URL, campanhas, IDs e resultados esperados do backend para validar a API real, incluindo transição e vigência persistida.

A seção da FEAT-33 prevê `409 CONTENT_REFERENCED` na exclusão ou substituição que invalide uma referência de outra dimensão. A tabela de erros do §4 ainda omite esse caso.
