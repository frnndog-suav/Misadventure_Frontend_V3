# 017 — RETORNO: FEAT-04 planejada e contrato acordado

- **ID:** RETORNO · **FEAT:** FEAT-04 · **Contrato:** §3 FEAT-04, v0.10 (`proposto (BE)`) → v0.11 (`acordado`) · **Roadmap:** v0.12 → v0.13 · **Spec:** v0.16 → v0.17 → v0.18 · **Data:** 2026-11-14

Só documentos; nenhum código nem teste mudou.

## Objetivo

Planejar a FEAT-04 (catálogo de cartas e coleções) no frontend e responder à proposta de contrato do backend.

## Passos

1. `/mudar-spec planejar FEAT-04`. Leitura do ROADMAP e do README 3.4, 3.5, 4.3, 5, 14.1, 18.1 e 27. Três perguntas ao autor, todas respondidas com a opção recomendada:
   - onde exibir: **só no laboratório** (D-26);
   - efeitos: **texto pronto do backend** até a FEAT-11 (D-27);
   - tipos: os **5 do ROADMAP** (zona, atributo, equipamento, item, evento).
   Resultado: spec v0.17 com REQ-08 a REQ-13, D-26 a D-28 e T-11 a T-15.
2. O backend propôs a seção antes do `/contrato` daqui (CONTRATO v0.10, ROADMAP v0.12). O autor copiou os dois arquivos inteiros.
3. `/retorno-backend`. A seção foi conferida contra o README e contra a spec v0.17 e foi **aceita sem mudanças**: não empurra regra para o frontend, os valores vêm prontos e os textos de regra chegam como `RuleText`. CONTRATO v0.11 `acordado`. No ROADMAP v0.13, BE passa de `aguardando outro lado` para `a fazer`; FE fica `a fazer`.
4. Spec v0.18, alinhada ao contrato:
   - `type` com 6 variantes, e o evento separado em aleatório e de combate;
   - o filtro mostra as contagens de `cardCounts`;
   - a lista já traz a carta completa, então sai o `useCard`;
   - a zona mostra o **número** de setas (o contrato manda `connectionArrows: number`, e o README 3.5 diz que as cartas não têm orientação);
   - as ofertas de serviço da zona ficam fora da FEAT;
   - regras comuns para campos ausentes;
   - T-11 e T-12 ajustadas.

## Arquivos

`docs/SPEC-FRONTEND.md`, `docs/CONTRATO.md`, `docs/ROADMAP.md`, este arquivo, `docs/devlog/README.md` e `docs/devlog/tempo.html`.

## Como verificar

Ler, no CONTRATO, a seção §3 FEAT-04 `acordado` e a linha 0.11 do histórico. Na spec, ler do REQ-08 ao REQ-13 e as tarefas T-11 a T-15.

## Dependência do backend

Levar para o backend `docs/CONTRATO.md` v0.11 e `docs/ROADMAP.md` v0.13. O backend implementa a seção e, quando estiver `implementado (BE)`, devolve a cópia exata das 6 cartas de `fixture` para as fixtures do MSW.

## Commit sugerido

`docs/feat-04 planned and contract agreed`
