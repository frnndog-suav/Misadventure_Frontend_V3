# 061 — T-46: Inventário, equipamentos e bolsa

- **ID:** T-46 · **FEAT:** FEAT-10 · **REQs:** REQ-43, REQ-44 · **Decisão:** D-58 (item 7 novo) · **Contrato:** v0.41 (`implementado (BE)`) · **Spec:** 0.60 → 0.61 · **Data:** 2026-11-17

## Objetivo

Mostrar na seção de cada membro de `/grupo/:partyId` o ouro com a bolsa, os modificadores efetivos e os da classe, os equipamentos em uso e o inventário (REQ-44); cobrir com teste os 2 campos novos do laboratório (REQ-43).

## Decisões

- REQ-43: os rótulos "Capacidade do inventário" e "Capacidade da bolsa" já estavam no `LabPage` desde a T-45 (D-58 item 6). A T-46 só acrescentou o teste unitário e o e2e; o teste já nasceu verde (não há implementação a fazer).
- "Equipamentos" e "Inventário ({n} de {cap} slots)" seguem o padrão de "Build" e "Pasta de TCG" (REQ-40): título `h3` e lista ligada por `aria-labelledby`; inventário vazio mostra "Inventário vazio." sem lista (D-58 item 7).
- Rótulos das 8 categorias vêm de `categoryCatalog` (`src/ui/categories.ts`), na ordem de `equipmentSlotSchema.options` (glossário §2.7).
- Os ids do inventário e dos equipamentos em uso entram em `cardIdsOf`, para os nomes virem de `GET /catalog/cards/:cardId` com as regras de carregamento e erro do REQ-30.
- O teste do REQ-30 conferia "Ouro 10" e os modificadores da classe na lista "Modificadores". O REQ-44 muda os dois: o REQ-30 passou a conferir "Ouro 10 (bolsa para 300)" e os modificadores foram para o teste do REQ-44 (alinhamento pedido pela spec, não ajuste para passar).

## Arquivos

- `src/features/party/PartySession.tsx` (seção `MemberState` e `cardIdsOf`).
- Testes: `src/features/party/PartySession.test.tsx` (4 casos REQ-44, REQ-30 alinhado), `src/lab/LabPage.test.tsx` (1 caso REQ-43), `tests/e2e/party/party-session.spec.ts` (2 casos REQ-44), `tests/e2e/lab/lab.spec.ts` (1 caso REQ-43).
- `docs/SPEC-FRONTEND.md` (T-46 `[x]`, D-58 item 7, 0.61).

## Como verificar

```
npx vitest related --run src/features/party/PartySession.tsx src/features/party/PartySession.test.tsx src/lab/LabPage.test.tsx
npx playwright test tests/e2e/lab tests/e2e/party
```

Com `npm run dev` (mocks): em `/grupo/party-com-equipamento`, a seção "Lia" mostra "Ouro 10 (bolsa para 300)", "Modificadores" (49 Precisão, 16 Esquiva), "Modificadores da classe" (45, 15), "Equipamentos" com 8 linhas "…: vazio" e "Inventário (5 de 10 slots)" com 5 itens; em `/grupo/party-os-teimosos`, "Inventário (0 de 10 slots)" e "Inventário vazio.". Em `/lab`, "Configuração" termina com os 2 campos novos.

## Problemas

- `python` não existe no Git Bash desta máquina; a inserção no e2e foi feita com a ferramenta de edição.

## Checks

- Guarda, `tsc -b`, `lint`, `format:check`: verdes. Unitários afetados: 151/151 (5 arquivos). E2E `lab` e `party`: 26/26. `test:build`: laboratório fora do release.

## Backend

Sem pendência nesta tarefa. A validação contra o backend real vem depois da T-48.

## Commit sugerido

`feat/feat-10 inventory equipment and purse on party screen`
