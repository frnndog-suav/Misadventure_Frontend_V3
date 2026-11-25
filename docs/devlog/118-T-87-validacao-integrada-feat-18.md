# 118 — T-87, Validação integrada da FEAT-18 (Montarias e Estábulo)

- Data — 2026-11-25
- Status — concluída (validado contra o backend real)
- Contrato — v0.94, FEAT-18 `validado`
- Roadmap — v0.85, FEAT-18 `validado` nas duas colunas
- Spec — T-87 [x]; D-64 item 8; spec v1.07
- Horas — a preencher

## Entrega

- Backend real em `http://localhost:3333` (`/health` → 0.93), laboratório ligado, `CONTENT_DIR` com a fixture de 30 cartas, campanhas do preparador `test/prepare-feat-18.cjs` (estabulo, montaria-com-conteudo, inventario-cheio, dois-caminhos, sem-montaria).
- 26 conferências HTTP com um script Node temporário (scratchpad, fora do repositório), todas OK: estado inicial das 5 campanhas (`availableActions`, `moveRoutes`, `market.stable`, origem `mount` e `mountAbility`), Estábulo (`noMount`, `zoneNotInMap` em `viaZoneId`, `buyMount` → ouro 78, `mountAlreadyOwned`), montaria com conteúdo (`mountNotEmpty`, transferências sem gastar PA, vender+comprar → ouro 18 e 2 PA), inventário cheio (doação vai à montaria, `LAB_GRANT_NO_SPACE`, `inventoryFull`, `unknownOption`, 400 do `useAbility`), dois caminhos (`notConnected`, movimento a 2 zonas → 2 PA), sem montaria (`noMount`, `mountNotOffered`) e laboratório (`mountPriceRare` 280, `outOfRange`).
- Os 5 saves reais passaram em `partySchema` (`src/api/parties.ts`) com um teste Vitest temporário, apagado em seguida.
- Telas conferidas pelo autor com o MSW desligado, em campanhas preparadas de novo.
- MSW (`src/mocks/mountFixtures.ts`): o 400 de `useAbility` passa a seguir o backend: os dois campos → `{ field: "mountAbility", reason: "invalidItem" }`; nenhum → `{ field: "equipmentSlot", reason: "required" }` (antes `invalidBody` nos dois casos).

## Decisões

- O detalhe do 400 do `useAbility` não foi fixado no contrato (o backend ofereceu; a tela só mostra a `message`). Registrado na D-64 item 8.

## Verificação

```
npm run typecheck
npx vitest run src/mocks src/api        # 18 arquivos, 409 testes OK
node .claude/hooks/client-guard.mjs --all   # src/ limpo
```

## Backend

Dependeu do backend no ar (retorno da T-80 do BE). Nenhum aviso pendente; o backend e o Postgres podem ser parados.

## Commit sugerido

`docs/t-87 feat-18 validada contra o backend real`
