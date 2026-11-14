# 018 — T-11: Cliente do catálogo

- **ID:** T-11 · **FEAT:** FEAT-04 · **REQ:** REQ-08 · **Decisões:** D-14, D-27, D-29 (nova) · **Contrato:** §3 FEAT-04, v0.11 `acordado` · **Spec:** v0.18 → v0.19 · **Data:** 2026-11-14

## Objetivo

Camada de cliente do catálogo: os tipos e schemas Zod do CONTRATO §3 FEAT-04, os hooks `useCollections()` e `useCards(collectionId, type?)` e os handlers do MSW com as fixtures dos cenários. Nenhuma tela; a seção do laboratório é a T-15.

## Decisões

- **Handler por tabela de cenários (D-29, escolha do autor).** Até aqui os handlers devolviam sempre a mesma resposta. O filtro por tipo só funciona no dev se a resposta mudar conforme o pedido. Por isso `GET /catalog/collections/:collectionId/cards` escolhe a fixture pronta assim:
  - coleção `fixture` sem `type` → as 6 cartas;
  - `type` conhecido → a lista daquele tipo, escrita à mão em `fixtureCardsByTypeFixture`;
  - `type` desconhecido → `400 CATALOG_QUERY_INVALID`;
  - outra coleção → `404 COLLECTION_NOT_FOUND`.

  O handler não filtra nem calcula. Alternativa descartada: resposta fixa, que deixaria o filtro inerte no dev.
- **O que o schema confere:** os campos, as uniões do glossário (§2.3, §2.5, §2.7) e as faixas numéricas declaradas no contrato:
  - `connectionArrows` de 1 a 4;
  - `count` ≥ 1 e `health` ≥ 1;
  - modificadores do inimigo inteiros ≥ 0;
  - `maxLevel` de 1 a 10;
  - `priceMultiplier` de 0,8 a 1,5;
  - pelo menos um item em `attributes`, `requirements`, `enemies` e `enemyTypes`.

  As invariantes entre campos ficam com o backend: zona `urban` com 4 setas, `attributeKind` × número de atributos, `startEvent` presente e `enemyTypes` sem repetição.
- **Sem retry** em `useCollections` e `useCards`, como na D-16 e na D-23.
- **`CATALOG_QUERY_INVALID` fica `ApiError` genérico**, sem subclasse, porque a tela só usa a `message`.
- **Fixtures provisórias.** Só a carta de atributo é cópia exata do contrato (3º cenário). As outras 5 usam os ids e tipos do contrato, com conteúdo inventado no formato. Elas serão trocadas pelas cópias exatas que vêm com o `implementado (BE)`.
- **`GET /catalog/cards/:cardId` não tem hook nem handler.** A spec v0.18 tirou o `useCard`.

## Passos

1. Pergunta ao autor sobre o handler: escolheu a tabela de cenários.
2. Red: `src/mocks/catalogFixtures.ts` e `src/api/catalog.test.tsx`. O comando `npx vitest run src/api/catalog.test.tsx` falhou porque o módulo `./catalog` ainda não existia.
3. Green: `src/api/catalog.ts` (schemas, tipos inferidos e hooks). Os handlers novos em `src/mocks/handlers.ts`. Resultado: 16 testes passando.
4. Revisão pelo spec-reviewer: aprovada, sem bloqueantes. Ajustes aplicados:
   - teste do handler padrão sem `type`;
   - testes das faixas (preço, refino, listas mínimas, vida, modificador negativo);
   - `cardTypeSchema.safeParse` no lugar do cast no handler;
   - comentário reformatado.

   Resultado: 18 testes.

## Arquivos

- Novos: `src/api/catalog.ts`, `src/api/catalog.test.tsx` e `src/mocks/catalogFixtures.ts`.
- Alterados: `src/mocks/handlers.ts`, `docs/SPEC-FRONTEND.md` (D-29, T-11 `[x]`, v0.19), este arquivo, `docs/devlog/README.md` e `docs/devlog/tempo.html`.

## Como verificar

```
npx vitest run src/api/catalog.test.tsx
npm run typecheck
npm run lint
node .claude/hooks/client-guard.mjs --all
npm run test:build
```

Ainda não há nada no produto: a tela é a T-15. Com `npm run dev` (mocks ligados), abrir `http://localhost:5173/catalog/collections/fixture/cards?type=item` no navegador não serve de prova, porque o MSW só intercepta pedidos feitos pela página.

## Checks

| Check | Resultado |
|---|---|
| Guarda | src/ limpo |
| Tipos | ok |
| Lint | ok |
| Formatação | ok |
| Testes afetados | 63 de 63 (4 arquivos) |
| Build de release | REQ-05 ok |

## Dependência do backend

Nenhum aviso nesta etapa. No fim da FEAT-04 (T-15), o `/retorno-backend` vai pedir a validação contra o backend real e as cópias exatas das 6 cartas.

## Commit sugerido

`feat/catalog client layer`
