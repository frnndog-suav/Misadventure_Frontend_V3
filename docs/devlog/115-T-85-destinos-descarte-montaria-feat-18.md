# 115 — T-85, Destinos prontos e descarte com montaria (FEAT-18)

- Data — 2026-11-25
- Status — concluída com MSW
- Contrato — v0.90, FEAT-18 `acordado`, sem mudança
- Spec — REQ-88; spec v1.03
- Horas — a preencher

## Entrega

- `src/features/party/receiveSpace.ts` (novo): texto de cada `ReceiveSpace` ("o inventário", "a pasta de TCG", "o inventário extra", "a pasta extra"), usado pela vitrine/`buySingle` (`MarketPanel.tsx`, que tinha a própria cópia), pela "Recompensa pendente" e pelo `lastRewardDelivery`.
- `src/features/party/RewardChoice.tsx`: "1× {nome} para {destino}." com os quatro destinos; uma seleção por carta **e espaço**, "Descartar {nome} ({Inventário | Pasta de TCG | Inventário extra | Pasta extra})"; o estado das seleções passa a ser chaveado por espaço + carta (antes, a mesma carta em dois espaços dividia o valor).
- `src/features/party/MarketPanel.tsx`: `buyStock`/`buyBooster` com `mountInventory` em `received` ganham " ({q} no inventário, {q} no inventário extra)", só das entradas presentes.
- `src/features/party/PartySession.tsx`: `kept` com `space` → "{nome} foi para {destino}.".
- `src/mocks/mountFixtures.ts`: `resolveReward` em `availableActions` do `party-montaria`, que já trazia a recompensa do cenário "Descarte com montaria" mas a deixava desabilitada.
- As "Cartas do booster" e o status do Vasculhar com `mountInventory` já vinham da T-80.

## Decisões

- Nenhuma nova: o REQ-88 cobre os casos.

## Verificação

- Testes novos falharam antes pelo motivo certo (textos e rótulos antigos). Unitários de `src/features/party` e `src/mocks`: 358/358. Tipos, lint, guarda, `format:check` e build verdes.
- Testes antigos alinhados ao REQ-88: rótulo "Descartar … (Inventário)" (unitário REQ-59 e e2e `random-event`) e "Minério de Ferro foi para o inventário." no e2e REQ-59 (a fixture tem `space: "inventory"`).
- E2E `party` em servidor próprio na porta 5174 (config temporária, apagada) com `VITE_USE_MOCKS=true`, porque o `.env.development.local` desliga os mocks: 37/37.

## Problemas

- No jsdom, `fireEvent.click` dispara em botão dentro de `<fieldset disabled>`; o unitário passava com a recompensa desabilitada. Acrescentado `toBeEnabled()` antes do clique (falha sem a correção da fixture).

## Backend

Nenhuma dependência nesta tarefa; a validação integrada é a T-87.

## Commit sugerido

`feat/t-85 feat-18 mount destinations and discard`
