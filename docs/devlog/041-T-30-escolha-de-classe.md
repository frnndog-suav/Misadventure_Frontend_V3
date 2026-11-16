# 041 — T-30: escolha de classe no "Novo jogo"

- **ID:** T-30 · **FEAT:** FEAT-06 · **REQ:** REQ-29 · **Spec:** v0.40 → v0.41 · **Contrato:** v0.21 (`acordado`) · **Data:** 2026-11-16

## Objetivo

Deixar o jogador escolher a classe no "Novo jogo", mostrar os modificadores base e o deck pré-pronto da escolhida, enviar `playerClass` e tratar `required`, `unknownClass` e `DIMENSION_INVALID`. Acrescentar ao handler padrão o cenário `required` adiado na T-28 (D-49).

## Decisões

- **D-50:** rótulo do rádio "{name} ({atributos})" com os atributos como termo; "{copies}× …" enquanto o nome da carta não chega; `radiogroup` rotulado "Classe"; `required` no handler padrão.
- No e2e, os rádios são localizados pelo início do nome (`/^Ladino/`): no Chromium o termo (bloco inline) ganha espaços no nome acessível ("Ladino ( Destreza )"); no jsdom o nome é exato.

## Arquivos

- `src/features/party/NewGame.tsx`: grupo "Classe", detalhes da classe, `playerClass` no corpo, erros do REQ-29, lista "Problemas".
- `src/features/party/NewGame.test.tsx`: 11 testes do REQ-29; o teste de 201 do REQ-15 passa a escolher a classe.
- `src/mocks/handlers.ts`: cenário `required` ("Os Teimosos"/"Lia" sem `playerClass`).
- `tests/e2e/party/new-game.spec.ts`: e2e do REQ-29; o fluxo de criação escolhe "Guerreiro".

## Como verificar

`npm run dev` com `VITE_USE_MOCKS=true`, `/novo`: rádios "Ladino (Destreza)" e "Guerreiro (Força, Resistência)"; "Os Teimosos"/"Lia" sem classe → "Escolha uma classe."; com "Guerreiro" → `/grupo/party-os-teimosos`.

## Checks

Guarda, `typecheck`, `lint`, `format:check`: ok. Unitários afetados: 307 passaram (14 arquivos). E2E `party`: 6 passaram. `test:build`: ok.

## Dependência do backend

A mesma da T-28: validação real na `/retorno-backend` depois da T-34.

## Commit sugerido

`feat/class choice in new game`
