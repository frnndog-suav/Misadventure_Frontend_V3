# 064 — RETORNO: FEAT-10 validada contra o backend real

- **ID:** RETORNO · **FEAT:** FEAT-10 · **Contrato:** v0.41 → v0.42 (`validado`, sem mudança de formato) · **Roadmap:** v0.49 → v0.50 · **Data:** 2026-11-18

## Objetivo

Rodar os cenários da FEAT-10 e as telas do laboratório e do grupo contra o backend real (`http://localhost:3333`).

## Passos e comandos

1. `/health` → `contractVersion` 0.41.
2. Os cenários rodaram com um script Node temporário, guardado no scratchpad (fora do repositório), num grupo novo "Validação F10", apagado no fim (`204`). As 26 conferências passaram:
   - criação: `inventory: []`, capacidades 10 e 300, 8 slots `null`, `effectiveModifiers` iguais aos do contrato, ações sem `prepare`;
   - `prepare` sem sessão → `PARTY_SESSION_NOT_ACTIVE`, e a doação sem sessão → `200`;
   - empilhamento: erva 2 + 3 → 5;
   - ouro: 10 + 295 → 300;
   - atributo doado vai para a pasta;
   - escudo não empilha;
   - `prepare` na ordem do contrato;
   - equipar: Defesa 5 → 6, gratuita (3 pontos);
   - troca no mesmo slot;
   - recusas `notEquipment`, `notInInventory` e `slotEmpty`;
   - `400`: `unknownOperation` e `unknownSlot`;
   - guardar: Defesa volta a 5;
   - 10 slots: a doação dá `LAB_GRANT_NO_SPACE` `inventoryFull`, e guardar dá `inventoryFull`;
   - com 0 pontos: `prepare` disponível e equipar → `200`;
   - erros da doação: `notGrantable` (zona), `CARD_NOT_FOUND`, `MEMBER_NOT_FOUND` e `notPositiveInteger` (1.5).
3. Tela com o MSW desligado (`VITE_USE_MOCKS=false VITE_API_URL=http://localhost:3333 npx vite --port 5173`) e um roteiro Playwright temporário. Em `/lab`, seção "Doação": Escudo de Madeira → "Doação feita. Lia: ouro 10, 1 slots no inventário, 0 cartas diferentes na pasta."; quantidade 1.5 → "Doação inválida. Use um número inteiro a partir de 1."; ouro 500 → "ouro 300". Em `/grupo/:id`: "Equipar Escudo de Madeira" e depois "Guardar Escudo de Madeira". Nenhuma requisição fora do app e do backend.

## Problemas

- O backend tem só o conteúdo `base`: `base.wooden-shield` substituiu as armas e o escudo, e `base.healing-herb` substituiu a poção e a picareta. Faltam carta que bloqueia escudo, carta com requisito de Pico e carta com restrição de classe. Por isso `shieldBlocked`, `peakRequirementNotMet`, `classRestricted` e os valores da arma (Ataque 9, Precisão 50) ficaram com os e2e do backend (decisão do autor, 2026-11-18). No frontend, essas recusas só viram texto (testes unitários da T-47).
- `CONTENT_IN_USE` não rodou: se o backend falhasse, a chamada apagaria uma carta da `base`.
- O backend só aceita a origem (CORS) `http://localhost:5173`. Com o vite em outra porta, a tela mostra "Servidor indisponível". A primeira execução do roteiro, na porta 5179, deixou um grupo "Tela F10", que foi apagado (`204`).
- No roteiro, o rádio "Lia" precisou de `exact: true`, porque "Tela F10 (Lia)" também casa com "Lia".

## Checks

Cenários: 26/26. Tela contra o backend real: passou. Saves do backend que já existiam não foram tocados.

## Backend

Levar `docs/CONTRATO.md` v0.42 e `docs/ROADMAP.md` v0.50 para o backend.

## Commit sugerido

`chore/feat-10 validated against real backend`
