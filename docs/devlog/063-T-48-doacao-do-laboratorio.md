# 063 — T-48: Doação do laboratório

- **ID:** T-48 · **FEAT:** FEAT-10 · **REQs:** REQ-46 · **Decisão:** D-58 (item 9 novo) · **Contrato:** v0.41 (`implementado (BE)`) · **Spec:** 0.62 → 0.63 · **Roadmap:** 0.48 → 0.49 · **Data:** 2026-11-18

## Objetivo

Seção "Doação" em `/lab` para doar carta (equipamento, item ou atributo) ou ouro a um membro de um grupo salvo. Fecha o lado FE da FEAT-10 com MSW.

## Decisões

- `useCards(collectionId | null)`: com `null` a consulta fica parada (padrão do `useParty(null)`). Sem isso, o select "Carta" era remontado quando as coleções chegavam (achado pelos unitários).
- `useLabGrant` invalida `partiesKey` no `200`, para que a tela do grupo aberta depois mostre o estado novo.
- Os motivos de `LAB_GRANT_INVALID` que têm texto vêm depois da `message`, separados por espaço.
- "Carregando jogos…" / "Carregando grupo…" e o erro do grupo aparecem no lugar do formulário. O erro de coleções ou cartas só aparece no status com "Carta" escolhido, e "Ouro" continua disponível. Ponto levantado pelo spec-reviewer e registrado na D-58 (9).

## Arquivos

- `src/lab/GrantSection.tsx` (novo) e `src/lab/GrantSection.test.tsx` (novo, 15 testes)
- `src/lab/LabPage.tsx` (inclui a seção)
- `src/api/catalog.ts` (`useCards` aceita `null`) e `src/api/labGrant.ts` (invalidação)
- `tests/e2e/lab/lab.spec.ts` (REQ-46: carta e ouro)
- `docs/SPEC-FRONTEND.md`, `docs/ROADMAP.md`

## Como verificar

`npm run dev` (mocks) → `/lab` → seção "Doação": escolher "Os Teimosos (Lia)", escolher a carta "Poção de Cura · Item" com quantidade 2 e clicar "Doar". Depois "Ouro" 295 → "Doar".

## Problemas

- Com o render-prop da primeira versão, o select "Carta" era remontado. Resolvido com `useCards(null)`.
- Antes da correção, uma falha nas coleções deixava "Carregando cartas…" para sempre. Corrigido, e agora há teste.

## Checks

Guarda, tipos, lint, formatação: ok. Unitários afetados: 532 + 2 novos, todos passando. E2E da área `lab`: 9/9. `test:build` ok, sem lab no release.

## Backend

Falta validar a FEAT-10 contra o backend real (`/retorno-backend`).

## Commit sugerido

`feat/feat-10 lab grant section`
