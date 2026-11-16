# 042 — T-31: partida preparada na tela do grupo

- **ID:** T-31 · **FEAT:** FEAT-06 · **REQ:** REQ-30 (alinha o REQ-16) · **Spec:** v0.41 → v0.42 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Trocar o texto "A partida começa na próxima etapa do jogo." pelo estado da partida: dimensão, cidade inicial, ordem dos jogadores e, por membro, classe com trava, números, modificadores, zonas, contagens e a mão com cartas completas.

## Decisões

- **D-51:** nomes de `useClasses` e do hook novo `useCatalogCards` (uma consulta por id distinto, mesmo cache do `useCatalogCard`); "Carregando a partida…" enquanto qualquer consulta não chega; primeiro erro na área de status; "…" até o nome chegar; membro = `section` h2, mão = `section` h3; "Modificadores" como "{valor} {termo}".

## Arquivos

- `src/api/catalog.ts`: `useCatalogCards` (com `useQueries`); `useCatalogCard` passa a usar a mesma definição de consulta.
- `src/features/party/PartySession.tsx`: `PreparedMatch` e `MemberState`.
- `src/features/party/PartySession.test.tsx`: 8 testes do REQ-30; o teste de 200 do REQ-16 confere que o texto antigo sumiu.
- `tests/e2e/party/party-session.spec.ts`: e2e do REQ-30.
- `docs/SPEC-FRONTEND.md`: T-31 `[x]`, D-51, hook em 3.4, v0.42.

## Como verificar

`npm run dev` com `VITE_USE_MOCKS=true`, `/novo` → "Os Teimosos"/"Lia"/"Guerreiro" → `/grupo/party-os-teimosos`: "Dimensão: Dimensão de Teste", "Cidade inicial: Porto Cinzento", "Ordem dos jogadores" com "Lia", seção "Lia" com "Classe: Guerreiro (trava cumprida)", "Vida 22/22" e "Mão (7)" com 7 cartas.

## Revisão

spec-reviewer: aprovado, sem bloqueantes. Ajustes feitos: limpeza do listener do MSW no `afterEach`; teste de espera pelas cartas; D-51 descreve a "Ordem dos jogadores" e a contagem da mão.

## Checks

Guarda, `typecheck`, `lint`, `format:check`: ok. Unitários afetados: 331 passaram (16 arquivos). E2E `party`: 7 passaram. `test:build`: ok.

## Dependência do backend

A mesma da T-28: validação real na `/retorno-backend` depois da T-34.

## Commit sugerido

`feat/prepared match in party screen`
