# Misadventures — Contrato frontend ↔ backend

> **Versão do contrato:** 0.9 · **Data:** 2026-11-14
>
> **Arquivo compartilhado:** a mesma cópia vive no repositório do frontend e no do backend. Quem altera incrementa a versão, registra no histórico (§5) e o autor copia o arquivo inteiro para o outro lado. O protocolo completo está em [`ROADMAP.md`](ROADMAP.md) §2.
>
> As regras do jogo estão em [`README.md`](README.md); este arquivo só define **o que trafega** entre os dois lados.

## 0. Situação de cada seção

| Situação | Significado |
|---|---|
| `proposto (FE)` / `proposto (BE)` | Um lado escreveu; o outro ainda não confirmou. |
| `acordado` | Os dois lados confirmaram; pode ser implementado. |
| `implementado (BE)` | O backend entregou e testou. |
| `validado` | O frontend rodou o cenário contra o backend real e passou. Só aqui a FEAT pode fechar. |

## 1. Convenções — `acordado`

### 1.1 Transporte
- Momentos 1 e 2 do roadmap: **HTTP + JSON**.
- Momento 3 (FEAT-26): **Socket.IO** para o tempo real (README II.2). Os formatos de estado e de eventos continuam os mesmos; muda só o transporte.
- O frontend lê o endereço do backend de configuração (`VITE_API_URL`, spec D-10).

### 1.2 Nomes
- Campos, rotas e eventos em **inglês**, `camelCase` nos campos JSON; rotas em `kebab-case`.
- Valores de enumeração são strings em `camelCase` (ex.: `"strength"`, `"startEvent"`).
- Variantes usam o campo discriminante `type`.
- Identificadores de entidades (`id`) são strings.
- A palavra `event` **nunca aparece sozinha**: o termo do jogo é sempre qualificado (`randomEvent`, `combatEvent`, `eventCard`, `eventDeck`, `startEvent`) e o registro técnico do que aconteceu é `domainEvent`.

### 1.3 Valores
- O backend envia os valores **já calculados e arredondados** como o jogador deve vê-los (vida, Pico, Vigor, modificadores, preços, custos). O frontend não refaz contas.
- Quando a tela precisa saber o que o jogador pode fazer (ações de zona disponíveis, custo em pontos de ação, alvos válidos), o backend envia a lista pronta.
- Datas e horários em ISO 8601 UTC (`"2026-11-13T18:00:00Z"`).

### 1.4 Erros
- Status HTTP 4xx/5xx com o corpo:

```json
{ "error": { "code": "UPPER_SNAKE_CASE", "message": "Texto para o jogador, em pt-BR.", "details": {} } }
```

- `code` vem da lista de §4; `details` é opcional.
- O frontend decide o comportamento pelo `code` e mostra `message`.

### 1.5 Versão
O backend informa qual versão deste contrato implementa (o endpoint é definido na seção da FEAT-01).

### 1.6 Estado e intenções
O frontend lê o **estado** e envia **intenções** (o que o jogador quer fazer). O backend valida a intenção, aplica as regras e devolve o novo estado (ou um erro de §1.4). Como os acontecimentos intermediários chegam à tela (a lista ordenada de `domainEvent` da pendência P-02) é decidido antes da FEAT-21.

## 2. Glossário termo → identificador — `acordado`

Base dos nomes no código dos dois lados e dos termos com destaque e tooltip (README II.4). Novos termos entram junto com a seção da FEAT que os usa.

### 2.1 Tempo (README 2.1)

| Termo | Identificador | Observação |
|---|---|---|
| Vez | `turn` | só fora do combate |
| Rodada | `round` | só fora do combate |
| Turno de combate | `combatTurn` | só dentro do combate |
| Ciclo de combate | `combatCycle` | só dentro do combate |

### 2.2 Mundo e partida (README 2.2, 3, 28)

| Termo | Identificador |
|---|---|
| Dimensão / Carta de Dimensão | `dimension` / `dimensionCard` |
| Zona / título / tipo de zona / local | `zone` / `title` / `zoneType` / `location` |
| Setas de conexão / travessia | `connectionArrows` / `crossing` |
| Mapa / cidade inicial | `map` / `startingCity` |
| Ação de zona / ponto de ação | `zoneAction` / `actionPoints` |
| Grupo (de campanha) / save / sessão / partida | `party` / `save` / `session` / `match` |
| Host / ajudante de IA / ajudante (de combate) | `host` / `aiHelper` / `combatHelper` |
| Jogo solo | `solo` |
| Spawn / ponto de respawn / nocaute | `spawn` / `respawnPoint` / `knockout` |
| Item de conclusão / prêmio máximo | `completionItem` / `grandPrize` |
| Coleção | `collection` |
| Deck de eventos / de recompensas / de missões / de reserva | `eventDeck` / `rewardDeck` / `questDeck` / `reserveDeck` |
| Evento aleatório / evento de combate / carta de evento | `randomEvent` / `combatEvent` / `eventCard` |
| Coisa boa / coisa ruim | `goodOutcome` / `badOutcome` |

### 2.3 Personagem (README 4 a 9)

| Termo | Identificador |
|---|---|
| Classe (primária) / especialização / trava | `playerClass` / `specialization` / `deckLock` |
| Carta de atributo / atributo | `attributeCard` / `attribute` |
| Básica / Sinérgica / Aprimorada | `basic` / `synergy` / `enhanced` |
| Deck de atributos / mão / pilha de descarte de atributos | `attributeDeck` / `hand` / `attributeDiscardPile` |
| Build / cartas em jogo | `build` / `cardsInPlay` |
| Recurso / equipamento / item / etiqueta (Tipos) | `resource` / `equipment` / `item` / `tags` |
| Inventário / pasta de TCG / cofre / bolsa / ouro | `inventory` / `binder` / `vault` / `purse` / `gold` |
| Montaria / limbo | `mount` / `limbo` |
| Vida / vida máxima | `health` / `maxHealth` |
| Modificador | `modifier` |
| Energia / Pico / Vigor / Exaustão | `energy` / `peak` / `vigor` / `exhaustion` |
| Raridade (Comum, Incomum, Rara, Épica, Lendária) | `rarity` (`common`, `uncommon`, `rare`, `epic`, `legendary`) |
| Booster | `booster` |

**Atributos** (`attribute`, README 4.1): Força `strength`, Destreza `dexterity`, Resistência `endurance`, Inteligência `intelligence`, Sabedoria `wisdom`, Carisma `charisma`, Espírito `spirit`, Sanidade `sanity`, Sorte `luck`. *(Resistência vira `endurance` para não confundir com a resistência a elementos.)*

**Modificadores** (`modifier`, README 7.1): Ataque `attack`, Defesa `defense`, Precisão `accuracy`, Esquiva `evasion`, Celeridade `celerity`, Perfuração `piercing`, Reflexão `reflection`.

### 2.4 Efeitos, combate e serviços (README 13 a 26)

| Termo | Identificador |
|---|---|
| Efeito / gatilho / custo / ativação / duração | `effect` / `trigger` / `cost` / `activation` / `duration` |
| Status / buff / debuff | `status` / `buff` / `debuff` |
| Habilidade / inimigo / elemento | `ability` / `enemy` / `element` |
| Missão de zona / de provação / do mentor | `zoneQuest` / `trialQuest` / `mentorQuest` |
| Mercado / Ferreiro / Estábulo | `market` / `blacksmith` / `stable` |

### 2.5 Ações de zona padrão (`zoneAction`, README 12.2)

| Ação | Identificador |
|---|---|
| Movimentar | `move` |
| Recuperar | `recover` |
| Preparar | `prepare` |
| Ajustar deck | `adjustDeck` |
| Negociar | `negotiate` |
| Abandonar missão | `abandonQuest` |
| Oficina do Artífice | `artificerWorkshop` |
| Iniciar evento | `startEvent` |
| Vasculhar | `scavenge` |
| Usar cofre | `useVault` |
| Pegar / Continuar / Finalizar missão | `takeQuest` / `continueQuest` / `finishQuest` |
| Pegar missão de provação | `takeTrialQuest` |
| Concluir dimensão | `completeDimension` |
| Ir ao Ferreiro | `visitBlacksmith` |
| Ir ao Mercado | `visitMarket` |
| Treinar com mentor | `trainWithMentor` |
| Salvar ponto de respawn | `saveRespawnPoint` |

### 2.6 Laboratório (README II.6, Apêndice A) — FEAT-03

| Termo | Identificador |
|---|---|
| Laboratório / configuração do jogo | `lab` / `gameConfig` |
| Jogadores mínimo / máximo (README 1.3) | `minPlayers` / `maxPlayers` |
| Pontos de ação por vez (README 11.1) | `actionPointsPerTurn` |
| Pico inicial / Vigor inicial (README 7.4) | `initialPeak` / `initialVigor` |
| Vida base / ouro inicial / mão inicial (README 9.1) | `baseHealth` / `initialGold` / `initialHandSize` |

## 3. Features

Uma seção por FEAT do roadmap, criada com `/contrato` (no frontend) ou pelo equivalente no backend. Modelo:

```
### FEAT-nn — <título> — `proposto (FE)`
Regras: README <seções>
#### Endpoints
| Método | Rota | Pedido | Resposta | Erros |
#### Tipos
(TypeScript, como vão para o código; uniões discriminadas por `type`)
#### Cenários de validação
- Dado <estado no backend>, quando <pedido>, então <resposta exata>.
  (os mesmos cenários alimentam as fixtures do MSW e os testes do backend)
```

### FEAT-01 — Esqueleto técnico (endpoint mínimo) — `implementado (BE)`

Regras: README II.2, II.3 (requisitos técnicos; nenhuma regra de jogo envolvida).

Fecho da FEAT-01: um endpoint que prova a ponte FE↔BE de ponta a ponta e informa a versão deste contrato que o backend implementa (§1.5).

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| GET | `/health` | — | `200` `HealthResponse` | `500` `INTERNAL_ERROR` |

Qualquer rota desconhecida (qualquer método) responde `404` com o corpo de §1.4 e código `NOT_FOUND` — valida o formato de erro de ponta a ponta.

Falha inesperada em qualquer endpoint (exceção não tratada, banco fora do ar) responde `500` com o corpo de §1.4, código `INTERNAL_ERROR` e mensagem "Erro inesperado no servidor. Tente novamente.". Sem cenário de validação: provocar um 500 exigiria endpoint de depuração fora do laboratório; o backend cobre o caso com um teste e2e do filtro de erros.

#### Tipos

```ts
/** GET /health — prova a ponte FE↔BE e informa a versão do contrato (§1.5). */
interface HealthResponse {
  status: 'ok'
  /** Versão deste arquivo que o backend implementa (ex.: "0.3"). */
  contractVersion: string
}
```

#### Cenários de validação

- Dado o backend no ar, quando `GET /health`, então `200` com `{ "status": "ok", "contractVersion": <versão do cabeçalho deste arquivo no momento da validação> }`.
- Dado o backend no ar, quando `GET /rota-que-nao-existe`, então `404` com `{ "error": { "code": "NOT_FOUND", "message": "Recurso não encontrado." } }`.

### FEAT-03 — Esqueleto do laboratório (configuração ajustável) — `validado`

Regras: README II.6 e Apêndice A. As rotas só existem com o laboratório ligado; desligado, qualquer `/lab/*` responde `404` `NOT_FOUND`, como uma rota desconhecida (FEAT-01). A checagem de admin (README II.6) entra com a autenticação (FEAT-25).

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| GET | `/lab/config` | — | `200` `LabConfig` | `404` `NOT_FOUND` |
| PATCH | `/lab/config` | `LabConfigPatch` | `200` `LabConfig` | `400` `LAB_CONFIG_INVALID`, `404` `NOT_FOUND` |
| POST | `/lab/config/reset` | — | `200` `LabConfig` | `404` `NOT_FOUND` |

O `PATCH` é parcial e **tudo ou nada**: se qualquer chave for inválida, nada é salvo. `{}` é aceito e não muda nada. Os ajustes ficam salvos e sobrevivem a um reinício do backend.

#### Tipos

```ts
/** Valores ajustáveis (Apêndice A). Cada FEAT seguinte acrescenta as suas chaves. */
interface GameConfigValues {
  minPlayers: number // README 1.3
  maxPlayers: number // README 1.3
  actionPointsPerTurn: number // README 11.1
  initialPeak: number // README 7.4
  initialVigor: number // README 7.4
  baseHealth: number // README 9.1
  initialGold: number // README 9.1
  initialHandSize: number // README 9.1
}

type GameConfigKey = keyof GameConfigValues

/** GET /lab/config, PATCH /lab/config e POST /lab/config/reset. */
interface LabConfig {
  /** Valores em vigor. */
  values: GameConfigValues
  /** Padrões do Apêndice A. */
  defaults: GameConfigValues
  /** Inteiros, inclusivos. */
  limits: Record<GameConfigKey, { min: number; max: number }>
}

/** PATCH /lab/config — só as chaves a alterar. */
type LabConfigPatch = Partial<GameConfigValues>

/** `details` do erro LAB_CONFIG_INVALID. */
interface LabConfigInvalidDetails {
  fields: {
    /** `null` só com `invalidBody`; com `unknownKey`, o nome recebido. */
    field: string | null
    reason: 'invalidBody' | 'unknownKey' | 'notInteger' | 'outOfRange' | 'minAboveMax'
  }[]
}
```

`invalidBody`: o corpo não é um objeto JSON ou está malformado. `minAboveMax`: `minPlayers > maxPlayers` depois de aplicar o pedido; lista as duas chaves. O frontend monta o texto para o jogador a partir de `reason` e de `limits`.

Padrões e limites:

| Chave | Padrão | Mínimo–máximo |
|---|---|---|
| `minPlayers` | 1 | 1–6 (`minPlayers ≤ maxPlayers`) |
| `maxPlayers` | 6 | 1–6 |
| `actionPointsPerTurn` | 3 | 1–10 |
| `initialPeak` | 10 | 1–1000 |
| `initialVigor` | 10 | 0–1000 |
| `baseHealth` | 20 | 1–1000 |
| `initialGold` | 10 | 0–100000 |
| `initialHandSize` | 7 | 0–60 |

#### Cenários de validação

Todos partem do laboratório ligado e, salvo indicação, de nenhum ajuste salvo.

- Quando `GET /lab/config`, então `200` com `values` e `defaults` iguais à coluna Padrão e `limits` iguais à coluna Mínimo–máximo.
- Quando `PATCH /lab/config` com `{ "actionPointsPerTurn": 4 }`, então `200` com `values.actionPointsPerTurn = 4` e as demais chaves no padrão; um `GET /lab/config` seguinte devolve o mesmo `values`.
- Quando `PATCH /lab/config` com `{ "actionPointsPerTurn": 0, "foo": 1 }`, então `400` com `{ "error": { "code": "LAB_CONFIG_INVALID", "message": "Configuração do laboratório inválida.", "details": { "fields": [{ "field": "actionPointsPerTurn", "reason": "outOfRange" }, { "field": "foo", "reason": "unknownKey" }] } } }`; um `GET` seguinte mostra os padrões.
- Quando `PATCH /lab/config` com `{ "minPlayers": 5, "maxPlayers": 3 }`, então `400` `LAB_CONFIG_INVALID` com `details.fields = [{ "field": "minPlayers", "reason": "minAboveMax" }, { "field": "maxPlayers", "reason": "minAboveMax" }]`.
- Quando `PATCH /lab/config` com `{ "initialGold": 2.5 }`, então `400` `LAB_CONFIG_INVALID` com `details.fields = [{ "field": "initialGold", "reason": "notInteger" }]`.
- Dado o ajuste `{ "actionPointsPerTurn": 4 }` salvo, quando `POST /lab/config/reset`, então `200` com `values` igual a `defaults`.
- Dado o laboratório desligado, quando `GET /lab/config`, então `404` com `{ "error": { "code": "NOT_FOUND", "message": "Recurso não encontrado." } }`.

## 4. Códigos de erro

| Código | Quando acontece | FEAT |
|---|---|---|
| `NOT_FOUND` | Rota ou recurso inexistente. | FEAT-01 |
| `INTERNAL_ERROR` | Falha inesperada no servidor (5xx). | FEAT-01 |
| `LAB_CONFIG_INVALID` | Ajuste do laboratório inválido (400); `details.fields` diz cada chave e o motivo. | FEAT-03 |

## 5. Histórico

| Versão | Data | Lado | Mudança |
|---|---|---|---|
| 0.1 | 2026-11-13 | FE | Versão inicial: convenções (§1) e glossário (§2) propostos. Aguarda confirmação do backend. |
| 0.2 | 2026-11-13 | BE | §1 e §2 confirmados sem mudanças → `acordado` (FEAT-00 do backend). |
| 0.3 | 2026-11-14 | FE | FEAT-01 proposta: `GET /health` (`status` + `contractVersion`, §1.5) e código de erro `NOT_FOUND` (§4). |
| 0.4 | 2026-11-14 | FE | FEAT-01 `acordado` com as mudanças pedidas pelo BE: `INTERNAL_ERROR` para 5xx (§1.4/§4) e cenário do `/health` sem versão fixa. |
| 0.5 | 2026-11-14 | BE | FEAT-01 `implementado (BE)`: `GET /health`, `NOT_FOUND` e `INTERNAL_ERROR` entregues e cobertos por e2e. Sem mudança de formato. CORS libera a origem `http://localhost:5173` por padrão (configurável no backend). |
| 0.6 | 2026-11-14 | BE | FEAT-03 proposta: `GET`/`PATCH /lab/config`, `POST /lab/config/reset`, tipo `LabConfig`, glossário §2.6 e código `LAB_CONFIG_INVALID` (§4). |
| 0.7 | 2026-11-14 | FE | FEAT-03 `acordado` sem mudanças: padrões conferidos com o Apêndice A; erro no formato da §1.4; limites e padrões vêm prontos do backend, o frontend só os exibe e monta o texto a partir de `reason`. |
| 0.8 | 2026-11-14 | BE | FEAT-03 `implementado (BE)`: `GET`/`PATCH /lab/config` e `POST /lab/config/reset` entregues e cobertos por e2e, sem mudança de formato. Rotas existem só com `LAB_ENABLED=true` (ligado no Compose de dev); desligado, `404` `NOT_FOUND`. JSON malformado no `PATCH` → `LAB_CONFIG_INVALID` com `invalidBody`. Ajustes ficam salvos no banco. |
| 0.9 | 2026-11-14 | FE | FEAT-03 `validado`: os 6 cenários rodaram contra o backend real (`http://localhost:3333`) e passaram. Também passaram o JSON malformado (`invalidBody`), o `/health` com `0.8`, o CORS para `http://localhost:5173` e os e2e da área `lab` com o MSW desligado. Sem mudança de formato. |
