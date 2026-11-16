# 040 — T-29: laboratório e catálogo alinhados à FEAT-06

- **ID:** T-29 · **FEAT:** FEAT-06 · **REQ:** REQ-27, REQ-28 · **Spec:** v0.39 → v0.40 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Mostrar a Carta de Dimensão e a forma das setas no catálogo, e cobrir com testes os 11 campos novos da configuração e o filtro "Dimensão" (já na tela desde a T-28, D-49).

## Decisões

Nenhuma nova. Os textos são os do REQ-28; a zona de chegada `null` mostra o texto fixo da spec (o sorteio é do backend).

## Arquivos

- Novos: `src/ui/cards/DimensionCard.tsx` e `DimensionCard.test.tsx`.
- `src/ui/cards/FullCard.tsx`: a Carta de Dimensão deixa de devolver `null`.
- `src/ui/cards/ZoneCard.tsx` e `ZoneCard.test.tsx`: "Setas opostas"/"Setas vizinhas" depois de "Setas de conexão".
- `src/lab/LabPage.test.tsx`: os 11 rótulos na lista de campos e o teste de ordem (REQ-27).
- `tests/e2e/lab/lab.spec.ts`: e2e do REQ-27 e do REQ-28.

## Como verificar

`npm run dev` com `VITE_USE_MOCKS=true`, `/lab`: campos novos em "Configuração"; no "Catálogo", filtro "Dimensão (1)" → "Dimensão de Teste · Dimensão"; filtro "Zona (4)" → "Bosque Sussurrante" mostra "Setas opostas".

## Checks

`typecheck`, `lint`, `format:check` e guarda: ok. Unitários afetados: 150 passaram (7 arquivos). E2E `lab`: 7 passaram. `test:build`: ok.

## Dependência do backend

A mesma da T-28: a FEAT-06 do backend ainda está `a fazer`; validação real na `/retorno-backend` depois da T-34.

## Commit sugerido

`feat/dimension card and arrow layout in lab catalog`
