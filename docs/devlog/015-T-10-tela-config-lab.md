# 015 — T-10: Tela de configuração do laboratório

- **ID:** T-10 · **FEAT:** FEAT-03 · **REQ:** REQ-06, REQ-07 · **D:** D-08, D-22, D-23, D-25 · **Contrato:** §3 FEAT-03 (v0.7, acordado) · **Data:** 2026-11-14

## Objetivo

Em `/lab` (só dev): formulário com os 8 valores ajustáveis (valor, padrão e limites vindos do backend), "Salvar", "Restaurar padrões", erros por campo e área de status (REQ-06); seção "Componentes" com os 9 termos de atributo e as categorias de teste, inclusive a pendente (REQ-07). Fecha o lado FE da FEAT-03 com MSW.

## Decisões

- **D-25:** os campos guardam só o digitado (`edits`), e o valor mostrado é `edits[key] ?? values[key]`, sem efeitos de sincronização. "Salvar" envia só as chaves cujo `Number(texto)` difere de `values`. Fica desabilitado sem diferença ou com campo vazio (D-23). Um não inteiro, como 2.5, vai ao backend, que responde `notInteger`. Quando salvar ou restaurar dá certo, o digitado é descartado. Os erros por campo valem até a próxima ação. O status mostra o resultado da última ação. As seções se chamam "Configuração" e "Componentes".
- Erro por campo ligado ao input por `aria-describedby` (`hint` + `error`); o texto de padrão/limites também é descrição do campo. `switch` exaustivo em `reason`; `unknownKey`/`invalidBody` e `field` fora das 8 chaves ficam só com a `message`.
- **D-08 / D-22 ajustadas (só texto):** os testes da tela ficam em `src/lab/LabPage.test.tsx`. A regra "dentro de `src/lab/` os imports são livres" já cobria esse caso no hook e no ESLint, e nenhuma guarda mudou. `src/lab/` importa `src/ui/test-assets/categories`. Esses arquivos continuam fora do release (conferido no `dist/`).
- `@testing-library/user-event` não está autorizada → testes com `fireEvent`.
- Estilo mínimo (`LabPage.css`): só layout com tokens; inputs e botões nativos (ferramenta de dev; sem contorno informativo novo, D-21).

## Passos e comandos

1. Red: `src/lab/LabPage.test.tsx` (19 testes) e `tests/e2e/lab/lab.spec.ts` (+3) → `npx vitest run src/lab` 19 falhando (tela ausente).
2. Green: `src/lab/LabPage.tsx` + `src/lab/LabPage.css`.
3. Revisão `spec-reviewer`: aprovado, sem bloqueantes. Sugestão acatada: o teste deixou de usar o seletor `data-field` e passou a conferir a descrição acessível do campo.
4. `npm run format`; `/checar`.

## Arquivos

- `src/lab/LabPage.tsx` (alterado), `src/lab/LabPage.css`, `src/lab/LabPage.test.tsx` (novos)
- `tests/e2e/lab/lab.spec.ts`
- `docs/SPEC-FRONTEND.md` (v0.15), `docs/ROADMAP.md` (v0.10: FEAT-03 FE `aguardando outro lado`)

## Como verificar

- `npm run dev` (com `VITE_USE_MOCKS=true`, padrão) → `http://localhost:5173/lab`: 8 campos, "Padrão: 3 · Mín. 1 · Máx. 10" sob "Pontos de ação por vez"; mudar para 4 → "Salvar" → "Configuração salva."; "Restaurar padrões" → "Padrões restaurados." e 3.
- `npx vitest run src/lab` → 19 passam; `npx playwright test tests/e2e/lab` → 4 passam.

## Checks

Guarda (`src/ limpo (D-08)`), `typecheck`, `lint` e `format:check` verdes. Vitest afetados 19/19 e e2e da área `lab` 4/4. `test:build` mostrou "REQ-05 ok". O `dist/` não tem `test-relic`, "Relíquia de teste", "Carregando configuração" nem `msw`.

## Dependência do backend

Sim: a FEAT-03 só fecha quando for validada contra o backend real. O AVISO DE BACKEND da FEAT-03 já foi dado: pede `/retorno-backend` com o backend no ar.

## Revisão 2026-11-14 (roteiro do autor)

- **Recarregar mostra 3 depois de salvar 4:** esperado com MSW. As fixtures são fixas (Princípio 3), e a persistência só vai ser conferida no `/retorno-backend FEAT-03`.
- **`VITE_USE_MOCKS=false` em `.env.local` não desligou o MSW:** no Vite, `.env.development` tem prioridade sobre `.env.local`. A sobrescrita certa é `.env.development.local`. A D-10 foi corrigida (spec v0.16). As entradas 004 (T-03) e 007 (T-04) citam `.env.local`; vale o que diz a D-10.

## Commit sugerido

`feat/lab config screen and component showcase`
