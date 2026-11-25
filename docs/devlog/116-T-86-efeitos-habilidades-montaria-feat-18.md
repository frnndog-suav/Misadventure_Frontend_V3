# 116 — T-86, Efeitos e habilidades da montaria (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-89; spec v1.04
- Horas — a preencher

## Entrega

- `src/features/party/EffectsPanel.tsx`: origem do efeito ativável por tabela (`Inventário`, `Equipamento`, `Montaria`); `source: "mount"` mostra "Montaria · {nome}". O "Ativar" já enviava o `cardId`.
- `src/features/party/PartySession.tsx`: no ramo `prepare`, `409 noMount` mostra "{message} Você não tem montaria." (antes, `activate`/`useAbility` mostravam só a `message`); comentários de `noMount` no `reasonText` atualizados.
- Já vinham da T-80/T-82: leitura de `mountAbility` e das origens `mount`/`mountAbility` (combate e disparados), nome da habilidade pela carta de `mount.cardId` e envio com `mountAbility: true` (`CombatPanel.tsx`).

## Decisões

- Nenhuma nova: o REQ-89 cobre os casos.

## Verificação

- Testes novos (unitários REQ-89 em `PartySession.test.tsx`, e2e em `tests/e2e/party/mount.spec.ts`) falharam antes pelo motivo certo. Afetados: 371/371. Tipos, lint, guarda, `format:check` e `test:build` verdes.
- E2E `party` em servidor próprio na porta 5174 (config temporária, apagada) com `VITE_USE_MOCKS=true`, porque o `.env.development.local` desliga os mocks e há um Vite do autor na 5173: 38/38.

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-86 feat-18 mount effects and abilities`
