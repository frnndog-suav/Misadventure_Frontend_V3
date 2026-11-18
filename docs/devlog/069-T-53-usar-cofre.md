# 069 — T-53: Usar cofre

- **ID:** T-53 · **FEAT:** FEAT-32 · **Contrato:** v0.47 (`implementado (BE)`) · **Spec:** v0.68 → v0.69 · **Roadmap:** v0.51 → v0.52 · **Data:** 2026-11-18

## Objetivo

REQ-52: botão "Usar cofre" na região "A vez" (depois do grupo "Vasculhar") e a seção "Usar cofre", que monta uma lista de operações e a envia de uma vez (`{ type: "useVault", operations }`), com a recusa marcada pelo `operationIndex`. Cliente e MSW já existiam desde a T-49; esta tarefa só mexe na tela. Fecha o lado FE da FEAT-32 com MSW.

## Decisões

D-59 item 12 (spec v0.69):

- Cada formulário é um `fieldset` com legenda ("Guardar no cofre", "Retirar do cofre", "Descartar do cofre", "Ouro", "Guardar deck", "Editar build"); os rótulos "Carta" e "Quantidade" se repetem e os testes os acham dentro do grupo.
- A seleção "Carta" começa na opção vazia "Escolha uma carta" (a spec só diz que sem carta o "Acrescentar" fica desabilitado). Não repete carta: no cofre, a mesma carta em dois slots aparece uma vez; "No cofre" do "Editar build" soma as quantidades dos slots (exibição, não regra).
- "Guardar deck": uma linha por carta de atributo do cofre (tipo do catálogo, dado de exibição, D-58), sem repetir, em ordem de `cardId`. Sem a deduplicação, o lote levaria a mesma carta duas vezes.
- "Subir" desabilitado no primeiro item, "Descer" no último.
- Os campos não voltam ao valor inicial depois de "Acrescentar" (a spec não pede; menos suposição).
- A marca "Recusada" e o texto da recusa ficam no estado da seção: somem quando a lista é editada (o índice deixaria de valer) e quando a seção fecha. Os erros do Usar cofre não vão para a área de status (como o "Ajustar deck"). Vantagem: nunca marca o item errado; desvantagem: depois de editar, o jogador não vê mais por que foi recusado.
- Sem grupo novo no MSW: a recusa aparece no dev confirmando um lote (o `200` fixo devolve o cofre com Poção de Cura) e depois retirando 5 Poções (cenário fixo `notInVault`, `operationIndex` 1).

## Passos e arquivos

- `src/features/party/PartySession.tsx`: `vaultReasonText` (textos do REQ-52; os 4 do REQ-42 delegam ao `reasonText`; `switch` exaustivo), `describeOperation` (`switch` exaustivo em `VaultOperation`), `NumberField` (erro por `aria-describedby`, `useId`), `CardOperationForm`, `GoldForm`, `CopiesForm` (cópias ≥ 0, só linhas ≥ 1) e `UseVault`; botão em `TurnState`; estado `vaulting`; `onUseVault` com `onSuccess` (fecha) e `onError` (guarda a recusa na seção); status "Cofre: {n} operações feitas." / "1 operação feita".
- `src/features/party/PartySession.test.tsx`: 34 testes REQ-52 (inclui um por motivo de recusa).
- `tests/e2e/party/party-session.spec.ts`: 1 e2e (lote de ouro confirmado; depois o take de 5 recusado com o item 2 "Recusada").
- `docs/SPEC-FRONTEND.md` (T-53 `[x]`, D-59 item 12, v0.69) e `docs/ROADMAP.md` (FEAT-32 FE `pronto`, v0.52).

## Como verificar

`npm run dev` com mocks, abrir `/grupo/party-os-teimosos`:

1. "A vez" → botão "Usar cofre": abre a seção com "Nenhuma operação." e "Confirmar (1 ponto de ação)" desabilitado.
2. "Ouro" → "Quantidade de ouro" 60 → "Guardar ouro": a lista mostra "1. Guardar 60 de ouro". "Confirmar": status "Cofre: 1 operação feita.", 2 pontos de ação, "Ouro no cofre 60 (capacidade 2000)" e o cofre com "1× Poção de Cura".
3. "Usar cofre" de novo → "Retirar ouro" 10 → "Retirar do cofre": Carta "Poção de Cura", Quantidade 5, "Acrescentar" → "Confirmar": a seção continua aberta, o item 2 ganha "Recusada" e aparece "Esta ação não é permitida agora. Não há essa quantidade de Poção de Cura no cofre.".

Comandos:

```
npx vitest run src/features/party/PartySession.test.tsx -t "REQ-52"
npx playwright test tests/e2e/party
```

## Problemas

- Os testes não puderam ser anexados por heredoc no Bash do agente (erro de aspas no `bash -c`); foram gravados num arquivo no scratchpad e anexados com `cat >>`.
- De novo um Vite na 5173 sem MSW (`vite --port 5173 --strictPort`, PID 13020): o Playwright o reaproveitou e todos os e2e de `party` caíram com "Servidor indisponível". Com autorização do autor, o processo foi encerrado (`Stop-Process -Id 13020`) e os e2e subiram o próprio `npm run dev`.

## Checks

Guarda `src/` limpa; typecheck, lint e `format:check` verdes; `vitest related --run src/features/party/PartySession.tsx`: 187/187 (4 arquivos); e2e `party` 22/22; `test:build` ok (laboratório fora do `dist/`). Revisão própria do diff (tarefa só de tela; cliente e contrato sem mudança).

## Backend

Fecha o lado FE da FEAT-32 com MSW; o BE já está `pronto`. Aviso de backend dado pedindo o backend no ar para o `/retorno-backend` (validação contra o backend real).

## Commit sugerido

`feat/t-53 feat-32 use vault batch on party screen`
