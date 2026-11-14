# 021 — T-14: Cartas de zona e de evento

- **ID:** T-14 · **FEAT:** FEAT-04 · **REQ:** REQ-12, REQ-13 · **Decisões:** D-31 · **Contrato:** §2.5, §2.7, §3 FEAT-04 (v0.11) · **Spec:** v0.21 → v0.22 · **Data:** 2026-11-14

## Objetivo

Componentes que exibem as cartas `zone`, `randomEvent` e `combatEvent` como o backend as manda, para o catálogo do laboratório (T-15) e as telas seguintes.

## Decisões

- `zoneActionLabels` em `src/ui/labels.ts` com os rótulos do CONTRATO §2.5 (`satisfies Record<ZoneAction, string>` + teste de completude). A linha "Pegar / Continuar / Finalizar missão" do glossário virou "Pegar missão", "Continuar missão", "Finalizar missão".
- `CardFrame` aceita `rarity` e `flavorText` opcionais: zona não tem nenhum dos dois, eventos não têm raridade.
- Efeito de zona: "Positivo: texto" / "Negativo: texto" (polaridade com texto, não só cor).
- Eventos: blocos "Coisa boa" e "Coisa ruim" (`RuleBlock`, também usado agora pelo "Encantamento" do equipamento) e "Sem fuga" só quando `noEscape`.
- Inimigo: `section` com título "{count}× {name}" (só o nome quando 1); "Tipos", "Modificadores" (os 7, ordem do §2.3, com `Term`) e "Habilidades" como listas rotuladas; "Criatura:", "Categoria:", "Elemento:" (se houver), "Vida n", "Vigor n" (se houver), "Comportamento:". Números só formatados (`formatNumber`).
- `Abilities` extraído para `parts.tsx` e reaproveitado pelo equipamento (mesmo markup).

## Arquivos

- Novos: `src/ui/cards/ZoneCard.tsx`, `RandomEventCard.tsx`, `CombatEventCard.tsx` e seus testes.
- Alterados: `src/ui/cards/parts.tsx`, `src/ui/cards/EquipmentCard.tsx`, `src/ui/labels.ts`, `src/ui/labels.test.ts`, `docs/SPEC-FRONTEND.md`.

## Como verificar

Sem tela ainda (entra no laboratório na T-15): `npx vitest run src/ui src/lab`.

## Problemas

Nenhum.

## Checks

format, guarda (`client-guard --all`), typecheck, lint, format:check, `test:build` (REQ-05 ok), Vitest `src/ui` + `src/lab` (73 passaram): verdes.

## Backend

Nenhuma dependência nova (CONTRATO v0.11 `acordado`).

## Commit sugerido

`feat/zone and event cards`
