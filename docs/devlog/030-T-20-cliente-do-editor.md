# 030 — T-20: Cliente do editor

- **ID:** T-20 · **FEAT:** FEAT-31 · **REQ:** REQ-19 a REQ-26 · **Decisões:** D-29, D-38, D-39, D-40 · **Contrato:** §3 FEAT-31 (v0.22, `acordado`) · **Spec:** v0.29 → v0.30 · **Data:** 2026-11-15

## Objetivo

Camada de cliente do editor de conteúdo: schemas Zod dos tipos da FEAT-31, os 15 hooks (4 consultas e 11 mutações) listados na tabela 3.4, o erro `ContentInvalidError` e as fixtures e handlers do MSW com os cenários do contrato. As telas ficam para as T-21 a T-27.

## Decisões (D-40)

- `requestJson` aceita `PUT`, usado para salvar a carta inteira.
- Um helper (`contentRequest`) faz todo pedido do editor. Ele converte `CONTENT_INVALID` e `CONTENT_ID_TAKEN` com `details` válido em `ContentInvalidError`, que guarda o `code` e os `fields` (`path` + `message` pronto, D-38). Com `details` fora do contrato, vira erro genérico. Os outros códigos continuam `ApiError`.
- As consultas ficam sob a chave `['editor']`. Toda mutação que grava invalida essa chave no sucesso. Motivo: contagens, listas e coleção mudam juntas, e uma chave só evita esquecer alguma.
- Exportar é mutação, porque é disparado por clique e não precisa de cache.
- Filtros vazios não vão na URL; `q` vazio também não.
- `classes` do export fica `unknown[]` (com `[]` quando o campo falta) e `classCount` tem padrão 0. Os dois esperam a FEAT-06 tipar `EditorClass`.
- MSW: tabela de cenários sem estado (D-29). Os casos que só funcionariam com estado viraram entradas fixas. Criar uma coleção com o id `fixture` devolve `409` (no contrato, o cenário é repetir o pedido). O `bosque` aparece já renomeado. A validação de dimensão devolve o resultado da `fixture`. Publicar uma carta do `bosque` devolve a `forca-bruta` publicada. Duplicar qualquer carta devolve a cópia do cenário.

## Arquivos

- Novos: `src/api/editor.ts`, `src/api/editor.test.tsx`, `src/mocks/editorFixtures.ts`.
- Alterados: `src/api/http.ts` (`PUT`), `src/mocks/handlers.ts` (handlers do editor), `docs/SPEC-FRONTEND.md` (3.4, D-40, T-20 `[x]`, v0.30).

## Como verificar

```
npx vitest run src/api/editor.test.tsx
```

São 35 testes, todos verdes. A etapa não tem tela; o editor aparece a partir da T-21.

## Checks

`npm run format`, `node .claude/hooks/client-guard.mjs --all` (limpo), `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` (23 arquivos, 251 testes), `npm run build` e `npm run test:build` (REQ-05 ok): todos verdes.

## Problemas

- O primeiro handler de publicar devolvia a carta conhecida com `status` trocado e conferia o slug para responder `CONTENT_LOCKED`. As duas coisas simulavam regra, o que vai contra o princípio 3. Foram trocadas por respostas fixas por id.
- Um teste de publicar falhou porque o mapa de cartas guarda a `forca-bruta` já renomeada ("Força Bruta"). Agora, publicar uma carta do `bosque` devolve a fixture do cenário de publicação.

## Revisão

O spec-reviewer apontou 2 bloqueantes no MSW, ambos corrigidos e cobertos por teste:

1. O import recusava todo corpo sem `formatVersion: 1`. Isso era validação feita no MSW. Agora só o corpo `{}` do cenário recebe `400`.
2. `id in mapa` aceitava chaves herdadas como `constructor`. Agora a conferência usa `Object.hasOwn`.

Também entraram 4 testes extras: os 2 dos bloqueantes, o `404` ao validar e ao exportar uma coleção desconhecida, e o `classCount` ausente lido como 0. Ficaram registrados na D-40 dois avisos: o schema descarta campos desconhecidos (o que afeta o export de FEATs futuras), e os handlers valem só para os ids e corpos dos cenários.

Ficaram de fora, por serem não bloqueantes, os testes de `CONTENT_IN_USE` no import, de `CONTENT_ID_TAKEN` ao criar carta e de `CONTENT_LOCKED` ao publicar. Os três já passam pelo mesmo caminho testado do helper.

## Backend

O contrato não mudou. A validação contra o backend real fica para o fim da FEAT-31 (T-27).

## Commit sugerido

`feat/content editor client`
