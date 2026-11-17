# 058 — T-44: Ajustar deck

- **ID:** T-44 · **FEAT:** FEAT-09 · **REQs:** REQ-42 · **Decisão:** D-57 (item 9 novo) · **Contrato:** v0.37 (`implementado (BE)`) · **Spec:** 0.57 → 0.58 · **Roadmap:** 0.42 → 0.43 · **Data:** 2026-11-17

## Objetivo

Botão "Ajustar deck" na região "A vez" e a seção "Ajustar deck" com o formulário de cópias na build por carta (build ∪ pasta), envio de `adjustDeck` e recusas por motivo.

## Decisões

- D-57 item 9: os erros do "Ajustar deck" aparecem só na seção, não na área de status; o sucesso ("Build salva: {buildSize} cartas.") usa a área de status.
- O rascunho vive no componente da seção: abrir de novo recomeça das cópias da build; cancelar descarta (D-57 item 3).
- Validação só de formato (`/^\d+$/`); mínimo, posse, cópias e pasta são do backend (D-57 item 2).
- Ordem por `cardId` com comparação de código (`<`), determinística.

## Arquivos

- `src/features/party/PartySession.tsx` (`AdjustDeck`, `reasonText` com `switch` exaustivo, `adjustErrorText`, botão, status).
- Testes: `src/features/party/PartySession.test.tsx` (REQ-42, 16 casos), `tests/e2e/party/party-session.spec.ts` (2 casos).
- `docs/SPEC-FRONTEND.md` (T-44 `[x]`, D-57 item 9, 0.58), `docs/ROADMAP.md` (FEAT-09 FE `pronto`, 0.43).

## Como verificar

```
npx vitest run src/features/party
npx playwright test tests/e2e/party
```

Com `npm run dev` (mocks), em `/grupo/party-os-teimosos`, clique "Ajustar deck"; Força 29 → recusa de mínimo; 31 → "Você não tem cópias suficientes de Força."; 30 → "Build salva: 60 cartas.".

## Problemas

- Já existente (não alterado): após um erro de ação, o `useMutation` limpa `data` e a tela volta ao `Party` do Continuar. Só se nota quando uma ação anterior mudou o estado. Fica registrado para decisão do autor.

## Checks

- Guarda, `tsc -b`, `lint`, `format:check`: verdes. Unitários relacionados: 124/124. E2E `party`: 16/16. `test:build`: laboratório fora do release.

## Backend

FEAT-09 com o lado FE pronto com MSW; falta `/retorno-backend` contra o backend real.

## Commit sugerido

`feat/feat-09 adjust deck section on party turn`
