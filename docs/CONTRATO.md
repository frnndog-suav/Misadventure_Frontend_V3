# Misadventures — Contrato frontend ↔ backend

> **Versão do contrato:** 0.37 · **Data:** 2026-11-17
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

### 2.7 Catálogo (README 3, 4.3, 5, 8.6, 14, 16, 18, 27) — FEAT-04

| Termo | Identificador |
|---|---|
| Catálogo / tipo de carta / texto de regra | `catalog` / `cardType` / `ruleText` |
| Flavor text / raridade | `flavorText` / `rarity` |
| Polaridade do efeito de zona (positivo/negativo) | `polarity` (`positive`, `negative`) |
| Tipo de carta de atributo | `attributeKind` |
| Categoria de equipamento (slot) / de item | `slot` / `itemCategory` |
| Requisito de Pico / restrição de classe / bloqueia escudo | `peakRequirement` / `classRestriction` / `blocksShield` |
| Refino / encantamento / ajuste de preço | `refinement` / `enchantment` / `priceMultiplier` |
| Requisitos de resolução / Sem fuga | `requirements` / `noEscape` |
| Tipo / criatura / categoria / comportamento do inimigo | `enemyTypes` / `creature` / `enemyCategory` / `behavior` |

**Tipos de zona** (`zoneType`, README 3.3): Montanhosa `mountainous`, Florestal `forest`, Costeira `coastal`, Lacustre `lacustrine`, Pantanosa `swamp`, Campestre `grassland`, Desértica `desert`, Vulcânica `volcanic`, Fluvial `fluvial`, Subterrânea `underground`, Urbana `urban`, Rural `rural`, Habitada `inhabited`, Fortificada `fortified`, Religiosa `religious`, Industrial `industrial`.

**Categorias de equipamento** (`slot`, README 5.1): Cabeça `head`, Tronco `torso`, Inferior `legs`, Calçado `feet`, Capa `cape`, Arma `weapon`, Escudo `shield`, Acessório `accessory`.

**Categorias de item** (`itemCategory`, README 5.2): Consumíveis `consumable`, Materiais `material`, Relíquias `relic`, Ferramentas `tool`, Tesouros `treasure`, Documentos `document`, Boosters `booster`, Objetos especiais `special`.

**Classes** (`playerClass`, README 8.6): Guerreiro `warrior`, Mago `mage`, Ladino `rogue`, Clérigo `cleric`, Patrulheiro `ranger`, Druida `druid`, Monge `monk`, Bardo `bard`, Alquimista `alchemist`, Artífice `artificer`, Bruxo `warlock`, Feiticeiro `sorcerer`.

**Elementos** (`element`, README 16.2): Terra `earth`, Água `water`, Fogo `fire`, Ar `air`, Gélido `frost`, Elétrico `electric`, Orgânico `organic`, Tóxico `toxic`, Arcano `arcane`, Obscuro `dark`, Celestial `celestial`, Dracônico `draconic`, Cósmico `cosmic`, Sônico `sonic`, Psíquico `psychic`, Sanguíneo `blood`, Espiritual `spiritual`.

**Tipos de inimigo** (`enemyTypes`, README 18.2): Fera `beast`, Humanoide `humanoid`, Morto-vivo `undead`, Espírito `spirit`, Demônio `demon`, Celestial `celestial`, Elemental `elemental`, Constructo `construct`, Dracônico `draconic`, Aberração `aberration`, Planta `plant`.

**Categorias de inimigo** (`enemyCategory`, README 18.3): Comum `common`, Elite `elite`, Chefe `boss`.

**Comportamento** (`behavior`, README 18.1): Agressivo `aggressive`, Defensivo `defensive`, Suporte `support`, Caçador `hunter`.

### 2.8 Campanha (README 28.1) — FEAT-05

| Termo | Identificador |
|---|---|
| Membro do grupo / nome do personagem | `member` / `characterName` |
| Situação do grupo: sem sessão / em sessão | `status` (`idle`, `inSession`) |
| Continuar / Encerrar sessão / Abandonar a partida | `startSession` / `endSession` / `abandonParty` |
| Última gravação do save | `savedAt` |

*(Grupo, save, sessão, host e jogo solo já estão em §2.2.)*

### 2.9 Editor de conteúdo (README 27, II.6) — FEAT-31

| Termo | Identificador |
|---|---|
| Editor de conteúdo | `contentEditor` (rotas `/lab/content`) |
| Rascunho / publicada / situação | `draft` / `published` / `status` (`ContentStatus`) |
| Identificador (slug) da carta | `slug` |
| Publicar / duplicar | `publish` / `duplicate` |
| Validar como dimensão / problemas | `validateDimension` / `problems` |
| Exportar / importar / substituir | `export` / `import` / `replace` |

### 2.10 Preparação da partida (README 3.2, 3.5, 4.4, 8, 9, 10.1, 11.2) — FEAT-06

| Termo | Identificador |
|---|---|
| Ordem de lançamento / zona de chegada | `releaseOrder` / `arrivalZoneTitle` |
| Forma das 2 setas: opostas / vizinhas | `arrowLayout` (`straight`, `corner`) |
| Direção na mesa (norte, leste, sul, oeste) | `direction` (`north`, `east`, `south`, `west`) |
| Definição de classe / deck pré-pronto | `classDefinition` / `starterDeck` |
| Atributos essenciais / modificadores base | `essentialAttributes` / `baseModifiers` |
| Trava cumprida | `deckLockMet` |
| Ordem dos jogadores | `turnOrder` |
| Vida base / vida atual | `baseHealth` / `health` |
| Tamanho mínimo da build | `minDeckSize` |
| Trava de classe com 1 / 2 essenciais | `lockOneEssential` / `lockTwoEssentials` |
| Tentativas máximas do gerador de mapa | `mapMaxAttempts` |

*(Dimensão, Carta de Dimensão, travessia, mapa, cidade inicial, classe, trava, build, mão, Pico, Vigor e vida máxima já estão em §2.2 e §2.3.)*

### 2.11 Mapa e Movimentar (README 3.5, 12.2) — FEAT-07

| Termo | Identificador |
|---|---|
| Ação do jogador (intenção) | `PartyAction` (rota `/parties/:partyId/actions`) |
| Destinos do Movimentar | `moveTargets` |

*(Movimentar = `move`, §2.5; travessia = `crossing`, §2.2.)*

### 2.12 A vez (README 11.1, 12.1) — FEAT-08

| Termo | Identificador |
|---|---|
| Pontos de ação (restantes na vez) | `actionPoints` |
| Pontos de ação por vez | `actionPointsPerTurn` (já na FEAT-03) |
| Encerrar a vez | `endTurn` |
| Ações disponíveis agora | `availableActions` |
| Sem pontos de ação | `noActionPoints` |

*(Vez = `turn` e rodada = `round`, §2.1.)*

### 2.13 Deck de atributos (README 4.3, 4.4, 6.3, 8.2, 12.5) — FEAT-09

| Termo | Identificador |
|---|---|
| Build (lista de cartas do deck salva) | `build` |
| Tamanho da build (cartas em jogo) | `buildSize` |
| Pasta de TCG / capacidade | `tcgFolder` / `tcgFolderCapacity` |
| Recuperar | `recover` |
| Opções do Recuperar: (a) comprar até N na mão / (b) mão no deck / (c) descarte no deck | `drawToHand` / `shuffleHand` / `shuffleDiscard` |
| Ajustar deck | `adjustDeck` |
| Cópias máx. de sinérgicas/aprimoradas no deck | `maxCopiesPerCard` |
| Build irregular (abaixo do mínimo) | `buildBelowMinimum` |

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
  // FEAT-06
  minDeckSize: number // README 4.4
  lockOneEssential: number // README 8.2 (classe com 1 essencial)
  lockTwoEssentials: number // README 8.2 (classe com 2 essenciais, de cada)
  mapMaxAttempts: number // README 3.5
  defaultAttack: number // README 8.7, linha Padrão
  defaultDefense: number
  defaultAccuracy: number
  defaultEvasion: number
  defaultCelerity: number
  defaultPiercing: number
  defaultReflection: number
  // FEAT-09
  maxCopiesPerCard: number // README 4.3
  tcgFolderCapacity: number // README 6.3
  recoverHealthPercent: number // README 12.5
  recoverVigorPercent: number // README 7.3
  recoverHandSize: number // README 12.2, opção (a)
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
| `minDeckSize` (FEAT-06) | 60 | 1–200 |
| `lockOneEssential` (FEAT-06) | 18 | 0–200 |
| `lockTwoEssentials` (FEAT-06) | 10 | 0–200 |
| `mapMaxAttempts` (FEAT-06) | 1000 | 1–100000 |
| `defaultAttack` / `defaultDefense` (FEAT-06) | 5 / 3 | 0–1000 cada |
| `defaultAccuracy` / `defaultEvasion` (FEAT-06) | 50 / 20 | 0–1000 cada |
| `defaultCelerity` / `defaultPiercing` / `defaultReflection` (FEAT-06) | 10 / 0 / 0 | 0–1000 cada |
| `maxCopiesPerCard` (FEAT-09) | 4 | 1–200 |
| `tcgFolderCapacity` (FEAT-09) | 30 | 0–1000 |
| `recoverHealthPercent` / `recoverVigorPercent` (FEAT-09) | 15 / 5 | 0–100 cada |
| `recoverHandSize` (FEAT-09) | 7 | 0–200 |

#### Cenários de validação

Todos partem do laboratório ligado e, salvo indicação, de nenhum ajuste salvo.

- Quando `GET /lab/config`, então `200` com `values` e `defaults` iguais à coluna Padrão e `limits` iguais à coluna Mínimo–máximo.
- Quando `PATCH /lab/config` com `{ "actionPointsPerTurn": 4 }`, então `200` com `values.actionPointsPerTurn = 4` e as demais chaves no padrão; um `GET /lab/config` seguinte devolve o mesmo `values`.
- Quando `PATCH /lab/config` com `{ "actionPointsPerTurn": 0, "foo": 1 }`, então `400` com `{ "error": { "code": "LAB_CONFIG_INVALID", "message": "Configuração do laboratório inválida.", "details": { "fields": [{ "field": "actionPointsPerTurn", "reason": "outOfRange" }, { "field": "foo", "reason": "unknownKey" }] } } }`; um `GET` seguinte mostra os padrões.
- Quando `PATCH /lab/config` com `{ "minPlayers": 5, "maxPlayers": 3 }`, então `400` `LAB_CONFIG_INVALID` com `details.fields = [{ "field": "minPlayers", "reason": "minAboveMax" }, { "field": "maxPlayers", "reason": "minAboveMax" }]`.
- Quando `PATCH /lab/config` com `{ "initialGold": 2.5 }`, então `400` `LAB_CONFIG_INVALID` com `details.fields = [{ "field": "initialGold", "reason": "notInteger" }]`.
- Dado o ajuste `{ "actionPointsPerTurn": 4 }` salvo, quando `POST /lab/config/reset`, então `200` com `values` igual a `defaults`.
- Dado o laboratório desligado, quando `GET /lab/config`, então `404` com `{ "error": { "code": "NOT_FOUND", "message": "Recurso não encontrado." } }`.

### FEAT-04 — Catálogo de cartas e coleções — `validado`

Regras: README 3.3, 3.4, 4.3, 5.1, 5.2, 8.6, 14.1, 16.2, 18.1 a 18.3, 24.3 (raridade) e 27. Só leitura: o catálogo é o conteúdo publicado (cartas como dados) e não muda durante a partida.

**Fora desta FEAT** (entram nas FEATs que os usam): Carta de Dimensão, missões, montarias, conteúdo de boosters, ofertas de serviço das zonas (estoque do mercado, montarias do estábulo, encantamentos do ferreiro), limite de cópias e trava do deck, e o estado da carta na partida (quebrado, "Reparado ×N", refino atual).

**Textos de regra:** efeitos, habilidades, requisitos de evento, coisa boa e coisa ruim chegam nesta FEAT como `RuleText` (texto em pt-BR, só para exibir). A estrutura deles vem na FEAT-11 e troca só o tipo desses campos.

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| GET | `/catalog/collections` | — | `200` `CollectionSummary[]` | — |
| GET | `/catalog/collections/:collectionId/cards` | query opcional `type` = um `CardType` | `200` `Card[]` | `400` `CATALOG_QUERY_INVALID`, `404` `COLLECTION_NOT_FOUND` |
| GET | `/catalog/cards/:cardId` | — | `200` `Card` | `404` `CARD_NOT_FOUND` |

Listas ordenadas por `id`. O `id` de uma carta tem a forma `<collectionId>.<slug>` e nunca muda depois de publicado (saves vão referenciá-lo).

#### Tipos

```ts
type CardType = 'zone' | 'attribute' | 'equipment' | 'item' | 'randomEvent' | 'combatEvent' | 'dimension' // dimension: FEAT-06

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' // README 24.3

/** README 3.3 */
type ZoneType =
  | 'mountainous' | 'forest' | 'coastal' | 'lacustrine' | 'swamp' | 'grassland'
  | 'desert' | 'volcanic' | 'fluvial' | 'underground' | 'urban' | 'rural'
  | 'inhabited' | 'fortified' | 'religious' | 'industrial'

/** README 5.1 */
type EquipmentSlot =
  | 'head' | 'torso' | 'legs' | 'feet' | 'cape' | 'weapon' | 'shield' | 'accessory'

/** README 5.2 */
type ItemCategory =
  | 'consumable' | 'material' | 'relic' | 'tool' | 'treasure' | 'document' | 'booster' | 'special'

/** README 16.2 */
type Element =
  | 'earth' | 'water' | 'fire' | 'air' | 'frost' | 'electric' | 'organic' | 'toxic' | 'arcane'
  | 'dark' | 'celestial' | 'draconic' | 'cosmic' | 'sonic' | 'psychic' | 'blood' | 'spiritual'

/** README 18.2 */
type EnemyType =
  | 'beast' | 'humanoid' | 'undead' | 'spirit' | 'demon' | 'celestial'
  | 'elemental' | 'construct' | 'draconic' | 'aberration' | 'plant'

/** README 18.3 (o chefe final fica na Carta de Dimensão, fora desta FEAT) */
type EnemyCategory = 'common' | 'elite' | 'boss'

/** README 18.1 / 19.6 */
type EnemyBehavior = 'aggressive' | 'defensive' | 'support' | 'hunter'

/** README 8.6 */
type PlayerClass =
  | 'warrior' | 'mage' | 'rogue' | 'cleric' | 'ranger' | 'druid'
  | 'monk' | 'bard' | 'alchemist' | 'artificer' | 'warlock' | 'sorcerer'

// Attribute, Modifier e ZoneAction: glossário §2.3 e §2.5.

/** Texto de regra para exibir (pt-BR). Estruturado na FEAT-11. */
interface RuleText {
  text: string
}

interface Ability {
  name: string
  text: string
}

interface CollectionSummary {
  id: string
  name: string
  /** Total de cartas da coleção por tipo (0 quando não há). */
  cardCounts: Record<CardType, number>
}

type Card = ZoneCard | AttributeCard | EquipmentCard | ItemCard | RandomEventCard | CombatEventCard | DimensionCard

/** README 3.4 */
interface ZoneCard {
  type: 'zone'
  id: string
  collectionId: string
  /** Nome próprio, único na coleção. */
  title: string
  zoneType: ZoneType
  /** Local (texto livre, pt-BR), ex.: "Bosque". */
  location: string
  /** 1 a 4; zona `urban` sempre 4. */
  connectionArrows: number
  /** FEAT-06. Só com 2 setas: `straight` = lados opostos, `corner` = lados vizinhos. `null` com 1, 3 ou 4 setas (só há uma forma; a carta gira). */
  arrowLayout: 'straight' | 'corner' | null
  /** Sempre tem `startEvent`; `urban` sempre tem `useVault` e `saveRespawnPoint`, e só `urban` tem `saveRespawnPoint`. */
  zoneActions: ZoneAction[]
  effects: (RuleText & { polarity: 'positive' | 'negative' })[]
}

/** README 4.3 */
interface AttributeCard {
  type: 'attribute'
  id: string
  collectionId: string
  name: string
  flavorText: string | null
  rarity: Rarity
  /** `basic`/`enhanced`: 1 atributo. `synergy`: 2 a 4 atributos diferentes. Cada um vale 1. */
  attributeKind: 'basic' | 'synergy' | 'enhanced'
  attributes: Attribute[]
  /** Vazio em `basic` e `synergy`; pelo menos 1 em `enhanced`. */
  effects: RuleText[]
}

/** README 5.1 */
interface EquipmentCard {
  type: 'equipment'
  id: string
  collectionId: string
  name: string
  flavorText: string | null
  rarity: Rarity
  slot: EquipmentSlot
  tags: string[]
  /** O primeiro é o modificador principal (usado pelo refino). */
  modifiers: { modifier: Modifier; value: number }[]
  peakRequirement: number | null
  /** Vazio = sem restrição. */
  classRestriction: PlayerClass[]
  /** Sempre `false` fora de `weapon`. */
  blocksShield: boolean
  abilities: Ability[]
  effects: RuleText[]
  /** `null` = não refinável. `maxLevel` de 1 a 10. */
  refinement: { maxLevel: number; materials: RuleText } | null
  /** `null` = não encantável. */
  enchantment: RuleText | null
  /** ×0,8 a ×1,5. */
  priceMultiplier: number
}

/** README 5.2 */
interface ItemCard {
  type: 'item'
  id: string
  collectionId: string
  name: string
  flavorText: string | null
  rarity: Rarity
  itemCategory: ItemCategory
  tags: string[]
  effects: RuleText[]
}

/** README 14.1 */
interface RandomEventCard {
  type: 'randomEvent'
  id: string
  collectionId: string
  title: string
  flavorText: string | null
  /** Pelo menos 1. */
  requirements: RuleText[]
  goodOutcome: RuleText
  badOutcome: RuleText
  noEscape: boolean
}

/** README 14.1, 18.1 — o requisito é vencer o combate. */
interface CombatEventCard {
  type: 'combatEvent'
  id: string
  collectionId: string
  title: string
  flavorText: string | null
  /** Pelo menos 1. */
  enemies: Enemy[]
  goodOutcome: RuleText
  badOutcome: RuleText
  noEscape: boolean
}

/** README 18.1 — impresso dentro da carta, não é carta à parte. */
interface Enemy {
  name: string
  flavorText: string | null
  /** Quantos iguais a este no combate (ex.: "2× Lobo Cinzento"); ≥ 1. */
  count: number
  /** 1 ou mais, sem repetição. */
  enemyTypes: EnemyType[]
  /** Texto livre, ex.: "Goblin". */
  creature: string
  enemyCategory: EnemyCategory
  element: Element | null
  /** ≥ 1. */
  health: number
  /** Valores finais (o Pico não se aplica), inteiros ≥ 0. */
  modifiers: Record<Modifier, number>
  /** `null` = sem Vigor. */
  vigor: number | null
  abilities: Ability[]
  behavior: EnemyBehavior
}

/** FEAT-06 — README 3.2. No máximo 1 por coleção; as zonas da dimensão são as zonas da coleção (README 27). Conclusão, itens de conclusão, chefe final e prêmio entram na FEAT-19. */
interface DimensionCard {
  type: 'dimension'
  id: string
  collectionId: string
  name: string
  flavorText: string | null
  /** Ordem de lançamento (≥ 1, única). Todo grupo novo começa pela menor (README 28.1). */
  releaseOrder: number
  /** Título da zona `urban` de chegada (cidade inicial); `null` = sorteada entre as `urban` sem efeito `negative`. */
  arrivalZoneTitle: string | null
  effects: RuleText[]
}

/** `details` do erro CATALOG_QUERY_INVALID. */
interface CatalogQueryInvalidDetails {
  field: 'type'
  reason: 'unknownCardType'
}
```

#### Cenários de validação

Rodam contra o **conteúdo de teste** do backend (coleção `fixture`, nome "Coleção de Teste", `test/fixtures/content/`, uma carta de cada tipo, ids abaixo). A cópia exata de cada carta vai junto no aviso da `implementado (BE)` para as fixtures do MSW.

- Quando `GET /catalog/collections`, então `200` com `[{ "id": "fixture", "name": "Coleção de Teste", "cardCounts": { "zone": 4, "attribute": 3, "equipment": 1, "item": 1, "randomEvent": 1, "combatEvent": 1, "dimension": 1 } }]` (contagens da FEAT-06).
- Quando `GET /catalog/collections/fixture/cards`, então `200` com 12 cartas, nesta ordem de `id` (lista da FEAT-06): `fixture.blade-of-dusk` (equipment), `fixture.dexterity-basic` (attribute), `fixture.endurance-basic` (attribute), `fixture.gray-harbor` (zone), `fixture.healing-potion` (item), `fixture.howling-wolves` (combatEvent), `fixture.old-mine` (zone), `fixture.stone-bend` (zone), `fixture.strength-basic` (attribute), `fixture.test-dimension` (dimension), `fixture.whispering-grove` (zone), `fixture.wounded-traveler` (randomEvent).
- Quando `GET /catalog/collections/fixture/cards?type=attribute`, então `200` com `[{ "type": "attribute", "id": "fixture.strength-basic", "collectionId": "fixture", "name": "Força", "flavorText": null, "rarity": "common", "attributeKind": "basic", "attributes": ["strength"], "effects": [] }]`.
- Quando `GET /catalog/collections/fixture/cards?type=monster`, então `400` com `{ "error": { "code": "CATALOG_QUERY_INVALID", "message": "Filtro do catálogo inválido.", "details": { "field": "type", "reason": "unknownCardType" } } }`.
- Quando `GET /catalog/collections/nope/cards`, então `404` com `{ "error": { "code": "COLLECTION_NOT_FOUND", "message": "Coleção não encontrada." } }`.
- Quando `GET /catalog/cards/fixture.strength-basic`, então `200` com a mesma carta do 3º cenário.
- Quando `GET /catalog/cards/fixture.nope`, então `404` com `{ "error": { "code": "CARD_NOT_FOUND", "message": "Carta não encontrada." } }`.

### FEAT-05 — Campanha solo (grupo de 1 e saves) — `validado`

Regras: README 28.1 (partida e save, salvamento automático, grupos e saves, host, abandonar, encerrar sessão) e 1.3. O jogador sozinho é um **grupo de 1**; o grupo **é** o save. Até a autenticação (FEAT-25), a lista de saves é a de todo o servidor (não há dono). Classe, deck, mapa e dimensão chegam ao `Party` na FEAT-06; ajudantes de IA, na FEAT-20. O salvamento automático no fim de cada vez fica observável na FEAT-08; aqui, todo pedido que muda o grupo e é aceito já devolve o estado gravado.

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| POST | `/parties` | `CreatePartyRequest` | `201` `Party` | `400` `PARTY_INVALID` |
| GET | `/parties` | — | `200` `PartySummary[]` | — |
| GET | `/parties/:partyId` | — | `200` `Party` | `404` `PARTY_NOT_FOUND` |
| POST | `/parties/:partyId/session` | — | `200` `Party` | `404` `PARTY_NOT_FOUND` |
| POST | `/parties/:partyId/session/end` | — | `200` `Party` | `404` `PARTY_NOT_FOUND`, `409` `PARTY_SESSION_NOT_ACTIVE` |
| DELETE | `/parties/:partyId` | — | `204` (sem corpo) | `404` `PARTY_NOT_FOUND` |

- **Continuar** (`POST …/session`) num grupo que já está `inSession` responde `200` com o grupo sem mudança (ex.: a aba foi fechada sem encerrar a sessão).
- **Encerrar sessão** grava o save e o deixa `idle` ("pausado para todos", README 28.1).
- **Abandonar** (`DELETE`) apaga o save inteiro; depois disso, o grupo responde `404`. No solo, o único membro é o host.
- `GET /parties` ordena do `savedAt` mais recente para o mais antigo (empate: `id` crescente).

#### Tipos

```ts
type PartyStatus = 'idle' | 'inSession'

/** POST /parties. Espaços nas pontas são removidos antes de validar e gravar. */
interface CreatePartyRequest {
  /** Nome do grupo (save), 1–40 caracteres. */
  name: string
  /** Nome do personagem do jogador, 1–24 caracteres. */
  characterName: string
  /** FEAT-06. Classe primária inicial; precisa existir em `GET /catalog/classes`. */
  playerClass: PlayerClass
}

interface PartyMember {
  id: string
  characterName: string
  /** Na FEAT-20 entra `'aiHelper'`. */
  kind: 'human'
  isHost: boolean
  /** FEAT-06. */
  player: PlayerState
}

/** GET /parties/:partyId e respostas das intenções. Cresce a partir da FEAT-06. */
interface Party {
  id: string
  name: string
  status: PartyStatus
  members: PartyMember[]
  /** FEAT-06. */
  dimension: PartyDimension
  /** FEAT-06. Ids de membro, do 1º ao último (D20, README 11.2). */
  turnOrder: string[]
  /** ISO 8601 UTC. */
  createdAt: string
  /** Última gravação do save, ISO 8601 UTC. */
  savedAt: string
}

/** Item de GET /parties (tela de saves). */
interface PartySummary {
  id: string
  name: string
  status: PartyStatus
  /** Na ordem dos membros. */
  characterNames: string[]
  createdAt: string
  savedAt: string
}

/** `details` do erro PARTY_INVALID. */
interface PartyInvalidDetails {
  fields: {
    /** `null` só com `invalidBody`. */
    field: 'name' | 'characterName' | 'playerClass' | 'members' | null // playerClass: FEAT-06
    reason: 'invalidBody' | 'required' | 'notString' | 'blank' | 'tooLong' | 'unknownClass' | 'belowMinPlayers' // unknownClass: FEAT-06
  }[]
}
```

`invalidBody`: o corpo não é um objeto JSON ou está malformado. `blank`: só espaços. `tooLong`: acima do limite do campo. `unknownClass` (FEAT-06): texto que não é uma classe do catálogo. `belowMinPlayers`: o laboratório exige mais jogadores (`minPlayers`) do que o grupo de 1 tem. Ordem de `fields`: `name`, `characterName`, `playerClass`, `members`.

Mensagens: `PARTY_INVALID` "Dados do grupo inválidos."; `PARTY_NOT_FOUND` "Grupo não encontrado."; `PARTY_SESSION_NOT_ACTIVE` "Não há sessão em andamento neste grupo.".

#### Cenários de validação

Partem de nenhum save e do laboratório nos padrões. Os `id` e as datas são gerados pelo backend: compare a forma (string não vazia, ISO 8601 UTC), não o valor.

- Quando `POST /parties` com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "warrior" }`, então `201` com `name: "Os Teimosos"`, `status: "idle"`, `members` com um único `{ "characterName": "Lia", "kind": "human", "isHost": true }` (e um `id`), e `createdAt` igual a `savedAt`.
- Quando `POST /parties` com `{ "name": "   ", "characterName": "Um nome com mais de vinte e quatro letras", "playerClass": "warrior" }`, então `400` com `{ "error": { "code": "PARTY_INVALID", "message": "Dados do grupo inválidos.", "details": { "fields": [{ "field": "name", "reason": "blank" }, { "field": "characterName", "reason": "tooLong" }] } } }`; um `GET /parties` seguinte devolve `[]`.
- Dado `minPlayers = 2` no laboratório, quando `POST /parties` com `{ "name": "Solo", "characterName": "Lia", "playerClass": "warrior" }`, então `400` `PARTY_INVALID` com `details.fields = [{ "field": "members", "reason": "belowMinPlayers" }]`.
- Dado o grupo "Os Teimosos" criado, quando `GET /parties`, então `200` com um item `{ "name": "Os Teimosos", "status": "idle", "characterNames": ["Lia"], … }`; e `GET /parties/<id>` devolve o mesmo `Party` da criação.
- Dado o grupo `idle`, quando `POST /parties/<id>/session`, então `200` com `status: "inSession"`; repetir o pedido devolve `200` com o mesmo grupo.
- Dado o grupo `inSession`, quando `POST /parties/<id>/session/end`, então `200` com `status: "idle"` e `savedAt` ≥ o anterior; repetir o pedido devolve `409` com `{ "error": { "code": "PARTY_SESSION_NOT_ACTIVE", "message": "Não há sessão em andamento neste grupo." } }`.
- Dado o grupo criado, quando `DELETE /parties/<id>`, então `204`; `GET /parties/<id>` seguinte devolve `404` com `{ "error": { "code": "PARTY_NOT_FOUND", "message": "Grupo não encontrado." } }` e `GET /parties` devolve `[]`.

### FEAT-31 — Editor de conteúdo (coleções e cartas) — `validado`

Regras: README 27, II.6, 3.5 (validação da dimensão; Apêndice B I5 e K7) e Apêndice B **T1** (id imutável depois de publicado; nada usado em saves é excluído). Os formatos das cartas são os da FEAT-04 (`Card` e afins); esta seção só acrescenta o que o editor precisa.

**Acesso:** como na FEAT-03, as rotas `/lab/content/*` só existem com o laboratório ligado; desligado, `404` `NOT_FOUND`. Admin entra na FEAT-25.

**Gravação:** o backend grava o conteúdo em **arquivos JSON** no diretório de conteúdo (`CONTENT_DIR`), versionáveis no git. O formato dos arquivos é do backend; o que trafega é o desta seção.

**Rascunho e publicação:** cada carta tem `status` `draft` ou `published`. **Mudança no catálogo da FEAT-04 (sem mudança de formato):** `GET /catalog/*` passa a devolver só cartas `published`, e `cardCounts` conta só as publicadas. As cartas que já existem nos arquivos (inclusive as 6 da coleção `fixture`) são `published`. Uma coleção aparece no catálogo mesmo sem cartas publicadas (contagens zeradas).

**Validação:** toda conferência de conteúdo (formato, limites, combinações entre campos do README 3.4, 4.3, 5.1, 5.2, 14.1, 18.1) é do backend, ao salvar **e** ao publicar: um rascunho também precisa estar completo e no formato do `Card` (assim o catálogo nunca recebe carta fora do formato). O texto de cada erro vem pronto em pt-BR (spec D-49).

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| GET | `/lab/content/collections` | — | `200` `EditorCollectionSummary[]` | — |
| POST | `/lab/content/collections` | `CollectionInput` | `201` `EditorCollection` | `400` `CONTENT_INVALID`, `409` `CONTENT_ID_TAKEN` |
| GET | `/lab/content/collections/:collectionId` | — | `200` `EditorCollection` | `404` `COLLECTION_NOT_FOUND` |
| PATCH | `/lab/content/collections/:collectionId` | `CollectionPatch` | `200` `EditorCollection` | `400` `CONTENT_INVALID`, `404` `COLLECTION_NOT_FOUND` |
| DELETE | `/lab/content/collections/:collectionId` | — | `204` | `404` `COLLECTION_NOT_FOUND`, `409` `CONTENT_IN_USE` |
| POST | `/lab/content/collections/:collectionId/validate-dimension` | — | `200` `DimensionValidation` | `404` `COLLECTION_NOT_FOUND` |
| GET | `/lab/content/collections/:collectionId/export` | — | `200` `CollectionExport` | `404` `COLLECTION_NOT_FOUND` |
| POST | `/lab/content/import` | query opcional `replace` = `true`/`false` (padrão `false`); corpo `CollectionExport` | `201` `ImportResult` | `400` `CONTENT_INVALID`, `409` `CONTENT_ID_TAKEN`, `409` `CONTENT_IN_USE` |
| GET | `/lab/content/collections/:collectionId/cards` | query opcionais `type` (`CardType`), `status` (`ContentStatus`), `q` (texto; busca no nome/título, sem diferenciar maiúsculas e acentos) | `200` `EditorCardSummary[]` | `400` `CONTENT_INVALID`, `404` `COLLECTION_NOT_FOUND` |
| POST | `/lab/content/collections/:collectionId/cards` | `CardInput` | `201` `EditorCard` (`draft`) | `400` `CONTENT_INVALID`, `404` `COLLECTION_NOT_FOUND`, `409` `CONTENT_ID_TAKEN` |
| GET | `/lab/content/cards/:cardId` | — | `200` `EditorCard` | `404` `CARD_NOT_FOUND` |
| PUT | `/lab/content/cards/:cardId` | `CardInput` (substitui a carta inteira) | `200` `EditorCard` | `400` `CONTENT_INVALID`, `404` `CARD_NOT_FOUND`, `409` `CONTENT_ID_TAKEN`, `409` `CONTENT_LOCKED` |
| POST | `/lab/content/cards/:cardId/publish` | — | `200` `EditorCard` (`published`) | `400` `CONTENT_INVALID`, `404` `CARD_NOT_FOUND` |
| POST | `/lab/content/cards/:cardId/duplicate` | — | `201` `EditorCard` (`draft`, id novo) | `404` `CARD_NOT_FOUND` |
| DELETE | `/lab/content/cards/:cardId` | — | `204` | `404` `CARD_NOT_FOUND`, `409` `CONTENT_IN_USE` |

Listas ordenadas por `id`. `PUT` num rascunho com outro `slug` **renomeia** a carta (o `id` devolvido é o novo; o antigo deixa de existir); numa carta `published`, outro `slug` → `409` `CONTENT_LOCKED`. Publicar uma carta já publicada devolve `200` sem mudança. `duplicate` escolhe o slug `<slug>-copia` (ou `-copia-2`, `-copia-3`… se ocupado). Editar uma carta `published` grava direto e ela continua `published`.

#### Tipos

```ts
type ContentStatus = 'draft' | 'published'

interface CollectionInput {
  /** Slug: letras minúsculas, números e hífens. Imutável (Apêndice B, T1). */
  id: string
  name: string
  description: string
}

/** Só o que muda; o `id` nunca muda. */
interface CollectionPatch {
  name?: string
  description?: string
}

interface EditorCollectionSummary {
  id: string
  name: string
  description: string
  publishedCount: number
  draftCount: number
}

interface EditorCollection extends EditorCollectionSummary {
  /** Todas as cartas (rascunhos e publicadas), por tipo e por raridade; 0 quando não há. Zona e eventos não têm raridade e não entram em `rarityCounts`. */
  cardCounts: Record<CardType, number>
  rarityCounts: Record<Rarity, number>
  /** Etiquetas (`tags`) já usadas em equipamentos e itens da coleção, sem repetição, em ordem alfabética (sugestão do formulário). */
  tags: string[]
}

/** O `Card` da FEAT-04 sem `id` e `collectionId` (o backend monta `<collectionId>.<slug>`), mais o `slug`. */
type CardInput = DistributiveOmit<Card, 'id' | 'collectionId'> & { slug: string }
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

interface EditorCard {
  status: ContentStatus
  card: Card
}

interface EditorCardSummary {
  id: string
  type: CardType
  /** `name`, ou `title` em zona e eventos. */
  name: string
  status: ContentStatus
}

/** Só cartas `published` entram (README 3.5). */
interface DimensionValidation {
  valid: boolean
  /** Textos pt-BR prontos; vazio quando `valid`. */
  problems: string[]
}

interface CollectionExport {
  formatVersion: 1
  collection: CollectionInput
  cards: EditorCard[]
  /** `EditorClass` vem da FEAT-06; até ela, sempre `[]`. Um arquivo sem `classes` é lido como `[]`. */
  classes: EditorClass[]
}

interface ImportResult {
  collectionId: string
  cardCount: number
  /** FEAT-06; até ela, sempre 0. */
  classCount: number
}

/** `details` de CONTENT_INVALID e CONTENT_ID_TAKEN. */
interface ContentInvalidDetails {
  fields: {
    /** Caminho do campo no corpo enviado, com pontos e índices: "name", "modifiers.1.value", "enemies.0.health", "cards.3.card.name"; "" = o corpo inteiro (JSON malformado ou não objeto); nos filtros da lista, o nome do parâmetro ("type", "status"). */
    path: string
    /** Texto pt-BR pronto para mostrar ao lado do campo (spec D-49). */
    message: string
  }[]
}
```

Mensagens (`message` do §1.4): `CONTENT_INVALID` "Conteúdo inválido."; `CONTENT_ID_TAKEN` "Este identificador já está em uso."; `CONTENT_IN_USE` "Este conteúdo é usado por algum save e não pode ser apagado."; `CONTENT_LOCKED` "O identificador de uma carta publicada não pode mudar.". Os textos de `fields[].message` são do backend; os dos cenários abaixo são os esperados. Outros textos fixos: JSON malformado → path `""`, "Envie um objeto JSON."; filtro `status` desconhecido → "Situação desconhecida."; parâmetro repetido na lista → "Informe a busca uma vez só."; `replace` diferente de `true`/`false` → "Use true ou false.".

**`CONTENT_IN_USE`:** até a FEAT-06 nenhum save referencia cartas, então o erro existe no formato mas não tem cenário; o cenário entra na FEAT-06.

#### Cenários de validação

Partem do laboratório ligado e de um `CONTENT_DIR` com só a coleção `fixture` da FEAT-04 (6 cartas `published`, `description` `""`).

- Quando `GET /lab/content/collections`, então `200` com `[{ "id": "fixture", "name": "Coleção de Teste", "description": "", "publishedCount": 6, "draftCount": 0 }]`.
- Quando `GET /lab/content/collections/fixture`, então `200` com o resumo acima mais `cardCounts` 1 em cada tipo, `rarityCounts` só com as raridades das 3 cartas de atributo, equipamento e item (as demais 0) e `tags` com as etiquetas de `fixture.blade-of-dusk` e `fixture.healing-potion`, sem repetição e em ordem alfabética.
- Quando `POST /lab/content/collections` com `{ "id": "bosque", "name": "Bosque Sombrio", "description": "Coleção de teste do editor." }`, então `201` com `{ "id": "bosque", "name": "Bosque Sombrio", "description": "Coleção de teste do editor.", "publishedCount": 0, "draftCount": 0, "cardCounts": { todos 0 }, "rarityCounts": { todos 0 }, "tags": [] }`; repetir o pedido → `409` com `{ "error": { "code": "CONTENT_ID_TAKEN", "message": "Este identificador já está em uso.", "details": { "fields": [{ "path": "id", "message": "Já existe uma coleção com este identificador." }] } } }`.
- Quando `POST /lab/content/collections` com `{ "id": "Bosque X", "name": " ", "description": "" }`, então `400` com `{ "error": { "code": "CONTENT_INVALID", "message": "Conteúdo inválido.", "details": { "fields": [{ "path": "id", "message": "Use só letras minúsculas, números e hífens." }, { "path": "name", "message": "Informe o nome." }] } } }`.
- Dado `bosque`, quando `PATCH /lab/content/collections/bosque` com `{ "name": "Bosque Antigo" }`, então `200` com `name: "Bosque Antigo"` e o mesmo `id`.
- Dado `bosque`, quando `POST /lab/content/collections/bosque/cards` com `{ "slug": "forca", "type": "attribute", "name": "Força", "flavorText": null, "rarity": "common", "attributeKind": "basic", "attributes": ["strength"], "effects": [] }`, então `201` com `{ "status": "draft", "card": { "type": "attribute", "id": "bosque.forca", "collectionId": "bosque", "name": "Força", "flavorText": null, "rarity": "common", "attributeKind": "basic", "attributes": ["strength"], "effects": [] } }`; `GET /catalog/collections/bosque/cards` devolve `[]` (rascunho fora do catálogo).
- Dado `bosque`, quando `POST /lab/content/collections/bosque/cards` com o corpo anterior trocando `slug` por `"forca-sorte"` e `attributes` por `["strength", "luck"]`, então `400` `CONTENT_INVALID` com `details.fields = [{ "path": "attributes", "message": "Carta básica tem exatamente 1 atributo." }]`.
- Dado `bosque.forca` em rascunho, quando `PUT /lab/content/cards/bosque.forca` com o mesmo corpo e `"slug": "forca-bruta"`, então `200` com `card.id = "bosque.forca-bruta"`; `GET /lab/content/cards/bosque.forca` seguinte → `404` `CARD_NOT_FOUND`.
- Dado `bosque.forca-bruta` em rascunho, quando `POST /lab/content/cards/bosque.forca-bruta/publish`, então `200` com `status: "published"`; `GET /catalog/cards/bosque.forca-bruta` → `200` com a carta; `PUT` com `"slug": "outra"` → `409` com `{ "error": { "code": "CONTENT_LOCKED", "message": "O identificador de uma carta publicada não pode mudar." } }`; `PUT` com o mesmo slug e `"name": "Força Bruta"` → `200`, continua `published`.
- Dado `bosque.forca-bruta`, quando `POST /lab/content/cards/bosque.forca-bruta/duplicate`, então `201` com `status: "draft"` e `card.id = "bosque.forca-bruta-copia"` (demais campos iguais).
- Dado a cópia, quando `GET /lab/content/collections/bosque/cards?status=draft`, então `200` com `[{ "id": "bosque.forca-bruta-copia", "type": "attribute", "name": "Força Bruta", "status": "draft" }]`; com `?q=bruta` → as duas cartas; com `?type=monster` → `400` `CONTENT_INVALID` com `details.fields = [{ "path": "type", "message": "Tipo de carta desconhecido." }]`.
- Dado a cópia, quando `DELETE /lab/content/cards/bosque.forca-bruta-copia`, então `204`; um `GET` seguinte → `404` `CARD_NOT_FOUND`.
- Quando `POST /lab/content/collections/fixture/validate-dimension`, então `200` com `{ "valid": false, "problems": ["A coleção precisa de pelo menos 1 zona Urbana publicada."] }` (a única zona da `fixture` não é Urbana). Textos exatos, nesta ordem: "A coleção precisa de pelo menos 1 zona Urbana publicada."; "As zonas publicadas têm N setas; são precisas pelo menos M (2 × (zonas − 1))." (N e M calculados).
- Dado `bosque` com `bosque.forca-bruta` publicada, quando `GET /lab/content/collections/bosque/export`, então `200` com `{ "formatVersion": 1, "collection": { "id": "bosque", "name": "Bosque Antigo", "description": "Coleção de teste do editor." }, "cards": [{ "status": "published", "card": { … } }] }`.
- Dado esse export guardado, quando `POST /lab/content/import` com ele, então `409` `CONTENT_ID_TAKEN` com `details.fields = [{ "path": "collection.id", "message": "Já existe uma coleção com este identificador." }]`; com `?replace=true` → `201` com `{ "collectionId": "bosque", "cardCount": 1 }`; depois de `DELETE /lab/content/collections/bosque` (`204`), o import sem `replace` → `201` com o mesmo resultado.
- Quando `POST /lab/content/import` com `{}`, então `400` `CONTENT_INVALID` com `details.fields` contendo `{ "path": "formatVersion", "message": "Versão do arquivo não suportada." }`; nada é gravado.
- Quando `GET /lab/content/collections/nope`, então `404` com `{ "error": { "code": "COLLECTION_NOT_FOUND", "message": "Coleção não encontrada." } }`.
- Dado o laboratório desligado, quando `GET /lab/content/collections`, então `404` `NOT_FOUND`.

### FEAT-06 — Preparação da partida — `validado`

Regras: README 10.1, 3.2 (zona de chegada), 3.5 (montagem do mapa e validação da composição), 4.4 (deck pré-pronto), 7.4 (vida máxima), 8.2 (trava), 8.6/8.7 (classes e modificadores base), 9.1 (valores iniciais), 11.2 (ordem por D20), 20.1 (spawn e respawn), 27, 28.1 (todo grupo novo começa pela primeira dimensão lançada) e Apêndice B T1.

A preparação acontece **dentro** do `POST /parties`: o grupo já nasce na primeira dimensão (a Carta de Dimensão `published` de menor `releaseOrder`), com o mapa montado, a ordem decidida e cada jogador na cidade inicial, com o deck pré-pronto da classe escolhida embaralhado e 7 cartas na mão. Não existe grupo sem preparação.

**Conteúdo novo e editor (FEAT-31):** a FEAT-06 traz a **Carta de Dimensão**, a **forma das setas** das zonas e as **classes com deck pré-pronto**. Os três entram no editor de conteúdo nesta FEAT (decisão do autor): a Carta de Dimensão e o `arrowLayout` pelo próprio `CardInput` (que é o `Card`), e as classes por rotas novas em `/lab/content`. Como as cartas, uma classe é `draft` ou `published`, e só as publicadas aparecem em `GET /catalog/classes` e podem ser escolhidas. O `playerClass` de uma classe publicada nunca muda (T1).

**Validação da dimensão:** a composição (README 3.5, gerador item 2) é conferida ao **criar o grupo**, com só o conteúdo `published`, e pelo `validate-dimension` da FEAT-31, com os mesmos textos. Se ela falhar, ou se o gerador passar de `mapMaxAttempts` tentativas, ou se não houver Carta de Dimensão publicada, o `POST /parties` responde `409` `DIMENSION_INVALID` com os problemas (erro de conteúdo, para o designer).

**Mudanças em outras seções** (o frontend precisa ajustar e revalidar as telas afetadas):
- **FEAT-03 (`validado`):** `GameConfigValues` ganha 11 chaves (tabela de padrões e limites).
- **FEAT-04 (`validado`):** `ZoneCard.arrowLayout`; `CardType` e `Card` ganham `dimension`/`DimensionCard` (e `cardCounts` ganha `dimension`); a coleção `fixture` cresce (cenários 1 e 2 atualizados).
- **FEAT-05 (`validado`):** `CreatePartyRequest.playerClass` (obrigatório); `Party.dimension`, `Party.turnOrder`, `PartyMember.player`; `PartyInvalidDetails` com `playerClass` e `unknownClass`. Os cenários passam a mandar `"playerClass": "warrior"`. Saves criados antes desta versão são **apagados** pela migração do backend (não têm classe).
- **FEAT-31 (`proposto (FE)`):** o editor aceita o tipo `dimension` e o `arrowLayout`; `CollectionExport.classes` e `ImportResult.classCount` (definidos na seção FEAT-31) passam a ser preenchidos; `DimensionValidation` passa a considerar a Carta de Dimensão; `CONTENT_IN_USE` ganha cenário. Com a `fixture` maior, os cenários dela mudam: `publishedCount` 12; `cardCounts` com `zone: 4`, `attribute: 3`, `dimension: 1` e os demais 1; `validate-dimension` da `fixture` → `{ "valid": true, "problems": [] }` (o exemplo inválido passa para `bosque`, abaixo).

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| GET | `/catalog/classes` | — | `200` `ClassDefinition[]` (só `published`) | — |
| POST | `/parties` | `CreatePartyRequest` (com `playerClass`) | `201` `Party` | `400` `PARTY_INVALID`, `409` `DIMENSION_INVALID` |
| GET | `/lab/content/collections/:collectionId/classes` | — | `200` `EditorClassSummary[]` | `404` `COLLECTION_NOT_FOUND` |
| POST | `/lab/content/collections/:collectionId/classes` | `ClassInput` | `201` `EditorClass` (`draft`) | `400` `CONTENT_INVALID`, `404` `COLLECTION_NOT_FOUND`, `409` `CONTENT_ID_TAKEN` |
| GET | `/lab/content/classes/:playerClass` | — | `200` `EditorClass` | `404` `CLASS_NOT_FOUND` |
| PUT | `/lab/content/classes/:playerClass` | `ClassInput` (substitui a classe inteira) | `200` `EditorClass` | `400` `CONTENT_INVALID`, `404` `CLASS_NOT_FOUND`, `409` `CONTENT_ID_TAKEN`, `409` `CONTENT_LOCKED` |
| POST | `/lab/content/classes/:playerClass/publish` | — | `200` `EditorClass` (`published`) | `400` `CONTENT_INVALID`, `404` `CLASS_NOT_FOUND` |
| DELETE | `/lab/content/classes/:playerClass` | — | `204` | `404` `CLASS_NOT_FOUND`, `409` `CONTENT_IN_USE` |

- Listas de classes ordenadas por `playerClass`. Cada `PlayerClass` existe no máximo uma vez em todo o conteúdo (rascunho ou publicada); repetir → `409` `CONTENT_ID_TAKEN`.
- `PUT` numa classe `draft` com outro `playerClass` a renomeia; numa `published`, → `409` `CONTENT_LOCKED`. Publicar uma já publicada → `200` sem mudança.
- **Ao salvar** (rascunho ou publicada): formato, 1 ou 2 essenciais diferentes, 7 modificadores inteiros ≥ 0, `starterDeck` sem `cardId` repetido, cada um uma carta `attribute` existente (rascunho ou publicada) e `copies` inteiro ≥ 1. **Ao publicar**, também: toda carta do deck `published`, total de cópias = `minDeckSize` e trava cumprida (ambos pelos padrões do laboratório), e nenhuma outra classe publicada com os mesmos essenciais (README 8.5).
- **Conteúdo usado por um save** (`CONTENT_IN_USE`, T1): a Carta de Dimensão e as zonas do mapa de um grupo, as cartas de atributo dos decks dos jogadores e as classes deles. Excluí-los (ou a coleção deles, ou substituí-la no import) → `409` `CONTENT_IN_USE`.
- **Carta usada por uma classe** (`CONTENT_REFERENCED`): uma carta de atributo que está no `starterDeck` de alguma classe não pode ser excluída nem renomeada → `409` `CONTENT_REFERENCED`.
- `GET /parties/:partyId` e as demais respostas de `Party` (FEAT-05) trazem os campos novos.

#### Tipos

```ts
/** GET /catalog/classes — README 8.6, 8.7, 4.4. */
interface ClassDefinition {
  playerClass: PlayerClass
  collectionId: string
  /** pt-BR, ex.: "Guerreiro". */
  name: string
  /** 1 ou 2 atributos diferentes. */
  essentialAttributes: Attribute[]
  /** Modificadores base da classe (README 8.7). */
  baseModifiers: Record<Modifier, number>
  /** Deck pré-pronto: cartas de atributo e cópias; total = minDeckSize padrão, trava cumprida. */
  starterDeck: StarterDeckEntry[]
}

interface StarterDeckEntry {
  cardId: string
  copies: number
}

/** Editor (FEAT-31). */
type ClassInput = Omit<ClassDefinition, 'collectionId'>

interface EditorClass {
  status: ContentStatus
  classDefinition: ClassDefinition
}

interface EditorClassSummary {
  playerClass: PlayerClass
  name: string
  status: ContentStatus
}

/** Direções da mesa (não da carta: a carta gira). `y` cresce para o sul. */
type Direction = 'north' | 'east' | 'south' | 'west'

interface PartyDimension {
  dimensionCardId: string
  /** Zona onde todos chegam (spawn); sempre em (0, 0). */
  startingCityZoneId: string
  map: PartyMap
}

/** README 3.5. Todas as zonas publicadas da coleção da dimensão, todas viradas para cima (README 3.6). */
interface PartyMap {
  zones: MapZone[]
  crossings: Crossing[]
}

interface MapZone {
  zoneId: string
  x: number
  y: number
  /** Para onde as setas apontam depois da rotação escolhida pelo gerador. */
  arrows: Direction[]
}

/** Travessia: duas zonas vizinhas com setas que apontam uma para a outra (nos dois sentidos). */
interface Crossing {
  /** Em ordem de `id`. */
  zoneIds: [string, string]
}

/** Estado do jogador na partida. Valores já calculados (§1.3). */
interface PlayerState {
  /** Na ordem em que foram obtidas. `deckLockMet`: a build cumpre a trava (README 8.2). */
  playerClasses: { playerClass: PlayerClass; deckLockMet: boolean }[]
  gold: number
  baseHealth: number
  /** ⌊baseHealth × (1 + peak ÷ 100)⌋ (README 7.4). */
  maxHealth: number
  /** Vida atual. */
  health: number
  peak: number
  vigor: number
  /** Da classe ativa mais antiga; sem classe ativa, os padrões do laboratório (README 8.2, 8.4). */
  modifiers: Record<Modifier, number>
  /** Ids das cartas de atributo na mão, na ordem em que foram compradas. */
  hand: string[]
  attributeDeckCount: number
  attributeDiscardPileCount: number
  /** Zona onde o jogador está. */
  zoneId: string
  respawnZoneId: string
}

/** `details` do erro DIMENSION_INVALID. */
interface DimensionInvalidDetails {
  /** `null` quando não há Carta de Dimensão publicada. */
  dimensionCardId: string | null
  /** Os mesmos textos pt-BR do `validate-dimension` (FEAT-31), mais o do limite de tentativas do gerador. */
  problems: string[]
}
```

Mensagens: `DIMENSION_INVALID` "Não foi possível preparar a dimensão. Avise o designer da coleção."; `CLASS_NOT_FOUND` "Classe não encontrada."; `CONTENT_REFERENCED` "Esta carta está no deck pré-pronto de uma classe e não pode ser apagada nem renomeada.".

#### Cenários de validação

Rodam contra o conteúdo de teste do backend (`CONTENT_DIR=test/fixtures/content`), coleção `fixture`, tudo `published`:
- zonas `fixture.gray-harbor` ("Porto Cinzento", `urban`, 4 setas), `fixture.whispering-grove` (2 setas, `straight`), `fixture.stone-bend` (2 setas, `corner`), `fixture.old-mine` (1 seta);
- dimensão `fixture.test-dimension` ("Dimensão de Teste", `releaseOrder: 1`, `arrivalZoneTitle: "Porto Cinzento"`);
- cartas `basic` `fixture.strength-basic`, `fixture.endurance-basic`, `fixture.dexterity-basic`;
- classes `warrior` (essenciais `strength` e `endurance`; 30 + 30 cópias; modificadores 6/5/45/15/8/0/0) e `rogue` (essencial `dexterity`; 40 `dexterity` + 20 `strength`; 5/2/46/22/12/0/0).

Sorteios usam semente aleatória: mapa, mão e rolagens mudam a cada grupo. Compare as invariantes, não as posições. A cópia exata do conteúdo vai junto no aviso da `implementado (BE)`. Os textos de `problems` e de `fields[].message` também entram nessa hora.

- Quando `GET /catalog/classes`, então `200` com 2 itens, `rogue` e depois `warrior`; `warrior` é `{ "playerClass": "warrior", "collectionId": "fixture", "name": "Guerreiro", "essentialAttributes": ["strength", "endurance"], "baseModifiers": { "attack": 6, "defense": 5, "accuracy": 45, "evasion": 15, "celerity": 8, "piercing": 0, "reflection": 0 }, "starterDeck": [{ "cardId": "fixture.endurance-basic", "copies": 30 }, { "cardId": "fixture.strength-basic", "copies": 30 }] }`.
- Quando `GET /catalog/cards/fixture.test-dimension`, então `200` com `{ "type": "dimension", "id": "fixture.test-dimension", "collectionId": "fixture", "name": "Dimensão de Teste", "flavorText": null, "releaseOrder": 1, "arrivalZoneTitle": "Porto Cinzento", "effects": [] }`.
- Quando `GET /catalog/cards/fixture.stone-bend`, então `200` com `connectionArrows: 2` e `arrowLayout: "corner"`; `fixture.gray-harbor` tem `arrowLayout: null`.
- Quando `POST /parties` com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "warrior" }`, então `201` e:
  - `dimension.dimensionCardId = "fixture.test-dimension"`, `dimension.startingCityZoneId = "fixture.gray-harbor"`;
  - `dimension.map.zones` tem as 4 zonas, cada uma uma vez, em células diferentes; `fixture.gray-harbor` em `(0, 0)` com as 4 direções; `fixture.old-mine` com 1 direção; `fixture.whispering-grove` com 2 opostas; `fixture.stone-bend` com 2 vizinhas;
  - `dimension.map.crossings` tem pelo menos 3 itens, só entre células vizinhas, e liga as 4 zonas;
  - `turnOrder` = `[<id do único membro>]`;
  - `members[0].player` = `{ "playerClasses": [{ "playerClass": "warrior", "deckLockMet": true }], "gold": 10, "baseHealth": 20, "maxHealth": 22, "health": 22, "peak": 10, "vigor": 10, "modifiers": { "attack": 6, "defense": 5, "accuracy": 45, "evasion": 15, "celerity": 8, "piercing": 0, "reflection": 0 }, "attributeDeckCount": 53, "attributeDiscardPileCount": 0, "zoneId": "fixture.gray-harbor", "respawnZoneId": "fixture.gray-harbor", "hand": <7 ids, cada um fixture.strength-basic ou fixture.endurance-basic> }`;
  - `GET /parties/<id>` devolve o mesmo `Party`.
- Dado `lockTwoEssentials = 31` no laboratório, quando `POST /parties` com `playerClass: "warrior"`, então `201` com `playerClasses: [{ "playerClass": "warrior", "deckLockMet": false }]` e `modifiers` = `{ "attack": 5, "defense": 3, "accuracy": 50, "evasion": 20, "celerity": 10, "piercing": 0, "reflection": 0 }`.
- Quando `POST /parties` com `{ "name": "Os Teimosos", "characterName": "Lia" }`, então `400` `PARTY_INVALID` com `details.fields = [{ "field": "playerClass", "reason": "required" }]`.
- Quando `POST /parties` com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "mage" }` (sem classe publicada), então `400` `PARTY_INVALID` com `details.fields = [{ "field": "playerClass", "reason": "unknownClass" }]`; um `GET /parties` seguinte devolve `[]`.
- Dado o grupo "Os Teimosos" criado, quando `DELETE /lab/content/cards/fixture.gray-harbor`, `DELETE /lab/content/cards/fixture.endurance-basic`, `DELETE /lab/content/classes/warrior` ou `DELETE /lab/content/collections/fixture`, então `409` com `{ "error": { "code": "CONTENT_IN_USE", "message": "Este conteúdo é usado por algum save e não pode ser apagado." } }`; depois de `DELETE /parties/<id>`, `DELETE /lab/content/cards/fixture.stone-bend` → `204`.
- Sem grupos, quando `DELETE /lab/content/cards/fixture.dexterity-basic`, então `409` com `{ "error": { "code": "CONTENT_REFERENCED", "message": "Esta carta está no deck pré-pronto de uma classe e não pode ser apagada nem renomeada." } }`.
- Dado `bosque` (FEAT-31) sem zonas nem Carta de Dimensão, quando `POST /lab/content/collections/bosque/validate-dimension`, então `200` com `valid: false` e `problems` com um texto para a falta de Carta de Dimensão publicada e um para a falta de zona Urbana publicada.
- Dado `bosque`, quando `POST /lab/content/collections/bosque/classes` com `{ "playerClass": "warrior", "name": "Guerreiro", "essentialAttributes": ["strength", "endurance"], "baseModifiers": { … }, "starterDeck": [] }`, então `409` `CONTENT_ID_TAKEN` com `details.fields = [{ "path": "playerClass", … }]` (`warrior` já existe na `fixture`); com `"playerClass": "mage"`, `"essentialAttributes": ["intelligence", "spirit"]` e `"starterDeck": [{ "cardId": "fixture.strength-basic", "copies": 60 }]` → `201` com `{ "status": "draft", "classDefinition": { "playerClass": "mage", "collectionId": "bosque", … } }`; `POST /lab/content/classes/mage/publish` → `400` `CONTENT_INVALID` (trava do Mago não cumprida); `GET /catalog/classes` continua com 2 itens.
- Dado `mage` em rascunho, quando `DELETE /lab/content/classes/mage`, então `204`; `GET /lab/content/classes/mage` seguinte → `404` com `{ "error": { "code": "CLASS_NOT_FOUND", "message": "Classe não encontrada." } }`.
- `DIMENSION_INVALID` não tem cenário com a `fixture` (ela é uma dimensão válida). O backend cobre o caso com testes do gerador e da composição.

**Textos (implementado (BE), 2026-11-17):** `problems` de `DimensionValidation` e de `DimensionInvalidDetails`, nesta ordem:
- "A coleção precisa de 1 Carta de Dimensão publicada."
- "A coleção precisa de pelo menos 1 zona Urbana publicada."
- "A zona de chegada "<título>" da Carta de Dimensão não é uma zona Urbana publicada da coleção."
- "Sem zona de chegada na Carta de Dimensão, a coleção precisa de pelo menos 1 zona Urbana publicada sem efeito negativo."
- "As zonas publicadas têm N setas; são precisas pelo menos M (2 × (zonas − 1))."
- só no `POST /parties`: "O gerador não montou o mapa dentro do limite de tentativas (mapMaxAttempts = N)."

Sem Carta de Dimensão publicada, o `problems` também traz o texto da zona Urbana. `fields[].message` novo do editor de classes: carta do deck não publicada (ao publicar) → path `starterDeck.N.cardId`, "Toda carta do deck pré-pronto precisa estar publicada.". `CollectionExport.classes` traz `EditorClass[]` da coleção (por `playerClass`) e `ImportResult.classCount` conta as classes do arquivo; os paths do import seguem `classes.N.classDefinition.*` e `classes.N.status`. Excluir uma coleção cuja carta está no deck pré-pronto de uma classe de **outra** coleção, ou substituí-la no import removendo essa carta → `409` `CONTENT_REFERENCED`.

Testes e2e do backend por cenário: `list-classes`, `get-card`, `create-party/*`, `content-in-use.e2e-spec.ts` (REQ-39, REQ-40), `create-class/index.controller.e2e-spec.ts` (REQ-38), `validate-dimension` (REQ-36), `import-collection`/`export-collection` (REQ-48).

### FEAT-07 — Mapa e Movimentar — `validado`

Regras: README 12.2 (Movimentar: só para zona **conectada**; pode repetir na mesma vez), 3.5 (encaixe: travessia nos dois sentidos; vizinhas sem setas que se apontam e setas mortas não ligam) e 3.6 (todas as zonas viradas para cima).

O mapa já vem em `Party.dimension.map` (FEAT-06) e as zonas no catálogo (FEAT-04). Esta seção acrescenta a lista pronta de destinos (§1.3) e a primeira **intenção** de jogo (§1.6), por uma rota única de ações: as próximas FEATs só acrescentam tipos a `PartyAction`.

**Custo:** a partir da FEAT-08, mover gasta 1 ponto de ação (README 12.2) e quem age é o jogador da vez; veja a seção FEAT-08.

**Mudanças em outras seções:**
- **FEAT-06 (`validado`):** `PlayerState.moveTargets`.
- **FEAT-05 (`validado`):** `PARTY_SESSION_NOT_ACTIVE` passa a valer também para ações num grupo sem sessão (só a descrição em §4 muda; a mensagem é a mesma).

#### Endpoints

| Método | Rota | Pedido | Resposta | Erros |
|---|---|---|---|---|
| POST | `/parties/:partyId/actions` | `PartyAction` | `200` `Party` (já com o efeito da ação) | `404` `PARTY_NOT_FOUND`, `400` `ACTION_INVALID`, `409` `PARTY_SESSION_NOT_ACTIVE`, `409` `ACTION_NOT_ALLOWED` |

Ordem das conferências: grupo inexistente (404) → pedido malformado (400 `ACTION_INVALID`) → grupo sem sessão (409 `PARTY_SESSION_NOT_ACTIVE`) → zona fora do mapa (400 `ACTION_INVALID`, `zoneNotInMap`) → zona sem travessia (409 `ACTION_NOT_ALLOWED`). Em qualquer erro nada é gravado. No sucesso, o save é gravado (`savedAt` avança).

#### Tipos

```ts
/** Intenção de jogo (§1.6). União por `type`; FEAT-08+ acrescentam variantes. */
type PartyAction = MoveAction

/** Movimentar (README 12.2). `zoneId` precisa estar em `moveTargets` do jogador. */
interface MoveAction {
  type: 'move'
  zoneId: string
}

interface PlayerState {
  // … campos da FEAT-06 …
  /** Zonas com travessia com `zoneId` (destinos válidos do Movimentar), sem repetição, em ordem de id. */
  moveTargets: string[]
}

/** `details` do erro ACTION_INVALID. */
interface ActionInvalidDetails {
  fields: {
    /** `null` só com `invalidBody`; nome do campo a mais com `unknownKey`. */
    field: 'type' | 'zoneId' | string | null
    reason: 'invalidBody' | 'required' | 'notString' | 'unknownAction' | 'unknownKey' | 'zoneNotInMap'
  }[]
}

/** `details` do erro ACTION_NOT_ALLOWED. FEAT-08+ acrescentam motivos. */
interface ActionNotAllowedDetails {
  reason: 'notConnected'
}
```

`invalidBody`: o corpo não é um objeto JSON ou está malformado. `unknownAction`: `type` que não é uma ação conhecida. `unknownKey`: campo que a ação não tem. `zoneNotInMap`: `zoneId` que não é zona do mapa do grupo. `notConnected`: zona do mapa sem travessia com a zona atual (inclusive a própria zona atual). Ordem de `fields`: `type`, `zoneId`, campos a mais na ordem do pedido.

Mensagens: `ACTION_INVALID` "Ação inválida."; `ACTION_NOT_ALLOWED` "Esta ação não é permitida agora.".

#### Cenários de validação

Contra a `fixture` (FEAT-06). O mapa é sorteado: compare as invariantes. Seja `G` um grupo criado com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "warrior" }` e posto em sessão (`POST /parties/<id>/session`).

- Quando `GET /parties/<G>`, então `members[0].player.moveTargets` é exatamente o conjunto das zonas que formam um `crossing` com `fixture.gray-harbor`, em ordem de id, com pelo menos 1 item.
- Quando `POST /parties/<G>/actions` com `{ "type": "move", "zoneId": <primeiro de moveTargets> }`, então `200` com `player.zoneId` = essa zona, `respawnZoneId: "fixture.gray-harbor"`, o resto de `player` igual, `moveTargets` = as zonas com travessia com a nova zona (inclui `fixture.gray-harbor`) e `savedAt` ≥ o anterior; `GET /parties/<G>` devolve o mesmo. Repetir com `{ "type": "move", "zoneId": "fixture.gray-harbor" }` → `200` de volta à cidade.
- Com o jogador em `fixture.gray-harbor`, quando `{ "type": "move", "zoneId": "fixture.gray-harbor" }`, então `409` com `{ "error": { "code": "ACTION_NOT_ALLOWED", "message": "Esta ação não é permitida agora.", "details": { "reason": "notConnected" } } }`; `GET` seguinte mostra o mesmo `savedAt`.
- Quando `{ "type": "move", "zoneId": "fixture.nowhere" }`, então `400` `ACTION_INVALID` com `details.fields = [{ "field": "zoneId", "reason": "zoneNotInMap" }]`.
- Quando `{ "type": "fly", "zoneId": 3 }`, então `400` `ACTION_INVALID` com `details.fields = [{ "field": "type", "reason": "unknownAction" }]`; com `{ "type": "move", "zoneId": 3, "speed": 2 }` → `fields = [{ "field": "zoneId", "reason": "notString" }, { "field": "speed", "reason": "unknownKey" }]`; com `{}` → `fields = [{ "field": "type", "reason": "required" }]`; com corpo `[1]` ou JSON malformado → `fields = [{ "field": null, "reason": "invalidBody" }]`.
- Depois de `POST /parties/<G>/session/end`, quando `{ "type": "move", "zoneId": <qualquer de moveTargets> }`, então `409` com `{ "error": { "code": "PARTY_SESSION_NOT_ACTIVE", "message": "Não há sessão em andamento neste grupo." } }`.
- Quando `POST /parties/00000000-0000-0000-0000-000000000000/actions` com um `move`, então `404` `PARTY_NOT_FOUND`.

### FEAT-08 — A vez — `validado`

Regras: README 11.1 (3 pontos de ação por vez; Movimentar gasta 1; encerrar a vez quando quiser; com 0 pontos a vez **não** termina sozinha, Apêndice B K2), 11.2 (ordem fixa), 2.1 (vez e rodada), 12.1/12.2 (custo do Movimentar), 11.4 (fora da vez ninguém inicia ação) e 28.1 (salvamento no fim de cada vez). No jogo solo os relógios da vez estão desligados (11.3 item 6, B J2): não há tempo nesta seção.

Os pontos por vez vêm de `actionPointsPerTurn` (FEAT-03), **copiado para o grupo na criação**: mudar o laboratório depois não muda grupos já criados. Quem age é o jogador da vez (`turn.memberId`); no solo é o único membro. Cada ação aceita continua gravando o save (`savedAt` avança), e `endTurn` também grava.

**Mudanças em outras seções:**
- **FEAT-05/06 (`validado`):** `Party.turn`; `PlayerState.availableActions`. O `POST /parties` já devolve `turn` na rodada 1.
- **FEAT-07 (`validado`):** sai a nota "Até a FEAT-08"; `move` passa a gastar 1 ponto; `PartyAction` ganha `EndTurnAction`; `ActionNotAllowedDetails.reason` ganha `noActionPoints`; `unknownKey` também vale para `endTurn`. Saves de antes desta versão continuam: são lidos na rodada 1, na vez do 1º de `turnOrder`, com pontos cheios.

#### Endpoints

Nenhuma rota nova: `POST /parties/:partyId/actions` (FEAT-07) aceita `{ "type": "endTurn" }`.

Ordem das conferências do `move`: grupo inexistente (404) → pedido malformado (400) → sem sessão (409 `PARTY_SESSION_NOT_ACTIVE`) → zona fora do mapa (400 `zoneNotInMap`) → **sem pontos (409 `noActionPoints`)** → sem travessia (409 `notConnected`). Do `endTurn`: 404 → 400 → 409 sem sessão.

#### Tipos

```ts
interface Party {
  // … campos das FEATs 05 e 06 …
  /** FEAT-08. De quem é a vez agora. */
  turn: PartyTurn
}

interface PartyTurn {
  /** Rodada atual, começa em 1 (README 2.1). */
  round: number
  /** Id do membro da vez (um de `turnOrder`). */
  memberId: string
  /** Pontos de ação que restam nesta vez (0 a `actionPointsPerTurn`). */
  actionPoints: number
}

interface PlayerState {
  // … campos das FEATs 06 e 07 …
  /**
   * FEAT-08. Tipos de `PartyAction` que este jogador pode mandar agora, em ordem fixa
   * (`move`, `endTurn`). Para o membro da vez: `move` se tem ponto e `moveTargets` não
   * está vazio; `endTurn` sempre. Para os demais: `[]`. Só ações já existentes; as FEATs
   * seguintes acrescentam as suas.
   */
  availableActions: PartyActionType[]
}

type PartyAction = MoveAction | EndTurnAction
type PartyActionType = PartyAction['type']

/** Encerrar a vez (README 11.1). Os pontos que sobraram se perdem. */
interface EndTurnAction {
  type: 'endTurn'
}

/** `details` do erro ACTION_NOT_ALLOWED. */
interface ActionNotAllowedDetails {
  reason: 'notConnected' | 'noActionPoints'
}
```

`noActionPoints`: a ação custa ponto e `turn.actionPoints` é 0. `endTurn`: a vez passa ao membro seguinte em `turnOrder` com `actionPoints = actionPointsPerTurn`; passando do último para o primeiro, `round` sobe 1. Com 1 membro: mesmo `memberId`, `round + 1`, pontos cheios.

Mensagens: as de FEAT-07 (`ACTION_NOT_ALLOWED` "Esta ação não é permitida agora.").

#### Cenários de validação

Contra a `fixture`, com o laboratório no padrão (`actionPointsPerTurn: 3`). Seja `G` criado com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "warrior" }` e posto em sessão; `M` = `members[0].id`; `A` = primeiro de `moveTargets`; `H` = `fixture.gray-harbor` (cidade inicial).

- Quando `POST /parties` (criação), então `turn = { "round": 1, "memberId": M, "actionPoints": 3 }` e `members[0].player.availableActions = ["move", "endTurn"]`.
- Quando `move` para `A`, depois para `H`, depois para `A`, então três `200` com `turn.actionPoints` 2, 1 e 0; no terceiro, `availableActions = ["endTurn"]`.
- Com 0 pontos, quando `{ "type": "move", "zoneId": H }`, então `409` com `{ "error": { "code": "ACTION_NOT_ALLOWED", "message": "Esta ação não é permitida agora.", "details": { "reason": "noActionPoints" } } }`; `GET` seguinte mostra o mesmo `savedAt` e o jogador ainda em `A`.
- Com 0 pontos, quando `{ "type": "endTurn" }`, então `200` com `turn = { "round": 2, "memberId": M, "actionPoints": 3 }`, `player.zoneId = A` e `availableActions = ["move", "endTurn"]`; `savedAt` ≥ o anterior; `GET` devolve o mesmo.
- Com 3 pontos, quando `endTurn` logo em seguida, então `200` com `round: 3` e 3 pontos (os pontos não acumulam).
- Quando `{ "type": "endTurn", "now": true }`, então `400` `ACTION_INVALID` com `details.fields = [{ "field": "now", "reason": "unknownKey" }]`.
- Depois de `POST /parties/<G>/session/end`, quando `{ "type": "endTurn" }`, então `409` `PARTY_SESSION_NOT_ACTIVE`; ao continuar a sessão (`POST /parties/<G>/session`), `turn` é o mesmo de antes.
- Com o laboratório em `actionPointsPerTurn: 5` (`PATCH /lab/config`), um grupo criado depois começa com `actionPoints: 5`; `G`, criado antes, continua recebendo 3 a cada `endTurn`. (Volte com `POST /lab/config/reset`.)

### FEAT-09 — Deck de atributos — `implementado (BE)`

Regras: README 4.3 (limite de cópias de sinérgicas e aprimoradas **só dentro do deck**), 4.4 (build e cartas em jogo; "Mexer na build": recolher, salvar, embaralhar, comprar a mesma quantidade), 6.3 (pasta de TCG: só cartas de atributo, 30 cartas, começa vazia; uma carta só sai da build se couber na pasta, B C19), 8.2 (trava checada ao salvar a build; build abaixo do mínimo não é salva; build que não cumpre a trava é aceita e só desliga a classe), 9.2 (deck esgotado não perde o jogo), 12.2/12.5 (Recuperar e Ajustar deck, 1 ponto cada; Recuperar repetível) e 7.3 item 6.

**A pasta nesta FEAT:** ela existe e começa vazia. Nada no jogo a enche ainda (boosters, singles e recompensas vêm nas FEATs 10, 12 e 16); então, contra o backend real, o Ajustar deck só pode ser feito sem mudanças, ou recusado. As trocas com a pasta estão definidas aqui e cobertas pelos e2e do backend com saves montados.

**Mudanças em outras seções:**
- **FEAT-03 (`validado`):** `GameConfigValues` ganha `maxCopiesPerCard`, `tcgFolderCapacity`, `recoverHealthPercent`, `recoverVigorPercent`, `recoverHandSize` (tabela de limites atualizada lá).
- **FEAT-06/FEAT-31 (`validado`):** ao **publicar** uma classe (e na integridade do conteúdo no boot), carta sinérgica ou aprimorada com `copies` acima de `maxCopiesPerCard` (padrão do laboratório) → `400` `CONTENT_INVALID`, path `starterDeck.N.copies`, texto "Carta sinérgica ou aprimorada pode ter no máximo N cópias no deck pré-pronto.". `PlayerState` ganha `build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity`.
- **FEAT-07/08 (`validado`):** `PartyAction` ganha `RecoverAction` e `AdjustDeckAction`; `availableActions` ganha `recover` e `adjustDeck`; motivos novos em `ActionInvalidDetails` e `ActionNotAllowedDetails`. Saves de antes desta versão continuam: são lidos com a pasta vazia e os valores novos nos padrões do laboratório.

#### Endpoints

Nenhuma rota nova: `POST /parties/:partyId/actions` (FEAT-07) aceita `recover` e `adjustDeck`; responde `200` `Party`.

Ordem das conferências do `recover`: 404 → pedido malformado (400) → sem sessão (409 `PARTY_SESSION_NOT_ACTIVE`) → sem pontos (409 `noActionPoints`).
Do `adjustDeck`: 404 → 400 → 409 sem sessão → `noActionPoints` → `notOwned` → `copyLimitExceeded` → `buildBelowMinimum` → `tcgFolderFull`.

#### Tipos

```ts
interface PlayerState {
  // … campos das FEATs 06 a 08 …
  /** FEAT-09. Build salva, agrupada por carta, em ordem de `cardId`. */
  build: CardCopies[]
  /** FEAT-09. Soma das cópias da build = attributeDeckCount + hand.length + attributeDiscardPileCount. */
  buildSize: number
  /** FEAT-09. Cartas de atributo na pasta de TCG, em ordem de `cardId`. Começa `[]`. */
  tcgFolder: CardCopies[]
  /** FEAT-09. Capacidade total da pasta (cartas), da config do grupo. */
  tcgFolderCapacity: number
  /**
   * Ordem fixa: `move`, `recover`, `adjustDeck`, `endTurn`. Para o membro da vez,
   * `recover` e `adjustDeck` entram com `actionPoints ≥ 1`.
   */
  availableActions: PartyActionType[]
}

interface CardCopies {
  cardId: string
  copies: number // ≥ 1
}

type PartyAction = MoveAction | EndTurnAction | RecoverAction | AdjustDeckAction

/** Recuperar (README 12.2, 12.5). 1 ponto de ação. */
interface RecoverAction {
  type: 'recover'
  option: 'drawToHand' | 'shuffleHand' | 'shuffleDiscard'
}

/** Ajustar deck (README 4.4, 6.3). 1 ponto de ação. Envia a build nova INTEIRA. */
interface AdjustDeckAction {
  type: 'adjustDeck'
  build: CardCopies[]
}

/** `details` do erro ACTION_INVALID (FEAT-07), motivos acrescentados. */
interface ActionInvalidDetails {
  fields: {
    field: string | null // ex.: "option", "build", "build.2", "build.2.copies"
    reason:
      | 'invalidBody' | 'required' | 'notString' | 'unknownAction' | 'unknownKey' | 'zoneNotInMap'
      | 'unknownOption'      // FEAT-09: option fora das três
      | 'notArray'           // FEAT-09: build não é lista
      | 'invalidItem'        // FEAT-09: item da build não é objeto
      | 'notPositiveInteger' // FEAT-09: copies não é inteiro ≥ 1
      | 'duplicateCard'      // FEAT-09: cardId repetido (no segundo)
  }[]
}

/** `details` do erro ACTION_NOT_ALLOWED. */
interface ActionNotAllowedDetails {
  reason:
    | 'notConnected' | 'noActionPoints'
    | 'notOwned'          // FEAT-09: cópias acima do que há na build + pasta
    | 'copyLimitExceeded' // FEAT-09: sinérgica/aprimorada acima de maxCopiesPerCard
    | 'buildBelowMinimum' // FEAT-09: build com menos de minDeckSize cartas (irregular)
    | 'tcgFolderFull'     // FEAT-09: o que sai da build não cabe na pasta
  /** Só em `notOwned` e `copyLimitExceeded`: a primeira carta com problema, na ordem da build enviada. */
  cardId?: string
}
```

**Recuperar:** gasta 1 ponto; vida sobe `max(1, ⌊maxHealth × recoverHealthPercent ÷ 100⌋)` e Vigor `max(1, ⌊peak × recoverVigorPercent ÷ 100⌋)`, sem passar de `maxHealth` e `peak`. `drawToHand`: compra do topo até a mão ter `recoverHandSize` cartas ou o deck acabar (mão já cheia não compra). `shuffleHand`: a mão inteira vai para o deck, que é embaralhado; a mão fica vazia. `shuffleDiscard`: a pilha de descarte vai para o deck, que é embaralhado. Aceito mesmo sem efeito.

**Ajustar deck:** o conjunto disponível é build + pasta. A build enviada vira a build salva; o que sobra vai para a pasta. Mão e descarte voltam ao deck, o deck é embaralhado e o jogador compra a **mesma quantidade** de cartas que tinha na mão. `playerClasses[].deckLockMet` e `modifiers` são recalculados. Enviar a build atual (sem mudar nada) é válido e gasta 1 ponto.

Mensagens: as de FEAT-07 (`ACTION_INVALID` / `ACTION_NOT_ALLOWED`).

#### Cenários de validação

Contra a `fixture`, laboratório no padrão. Seja `G` criado com `{ "name": "Os Teimosos", "characterName": "Lia", "playerClass": "warrior" }` e posto em sessão; `S` = `fixture.strength-basic`, `E` = `fixture.endurance-basic`.

- Quando `POST /parties`, então `members[0].player` traz `build = [{ "cardId": E, "copies": 30 }, { "cardId": S, "copies": 30 }]`, `buildSize: 60`, `tcgFolder: []`, `tcgFolderCapacity: 30` e `availableActions = ["move", "recover", "adjustDeck", "endTurn"]`.
- Quando `{ "type": "recover", "option": "drawToHand" }`, então `200` com `turn.actionPoints: 2`, `health: 22`, `vigor: 10` (já no máximo), `hand` com 7 cartas e `attributeDeckCount: 53` (nada comprado).
- Quando `{ "type": "recover", "option": "shuffleHand" }`, então `200` com `hand: []`, `attributeDeckCount: 60`, `actionPoints` − 1; e um `drawToHand` seguinte devolve `hand` com 7 e `attributeDeckCount: 53`.
- Quando `{ "type": "adjustDeck", "build": [{ "cardId": E, "copies": 30 }, { "cardId": S, "copies": 30 }] }` com 7 na mão, então `200` com a mesma `build`, `tcgFolder: []`, `hand` com 7, `attributeDeckCount: 53`, `attributeDiscardPileCount: 0`, `deckLockMet: true` e `actionPoints` − 1.
- Quando `adjustDeck` com `S` em 29 cópias (59 no total), então `409` `ACTION_NOT_ALLOWED` com `details = { "reason": "buildBelowMinimum" }`; nada muda (`GET` com o mesmo `savedAt`).
- Quando `adjustDeck` com `S` em 31 cópias, então `409` com `details = { "reason": "notOwned", "cardId": S }`.
- Quando `adjustDeck` com `fixture.dexterity-basic` em 1 cópia (além da build atual), então `409` com `details = { "reason": "notOwned", "cardId": "fixture.dexterity-basic" }`.
- Quando `{ "type": "recover", "option": "nap" }`, então `400` `ACTION_INVALID` com `fields = [{ "field": "option", "reason": "unknownOption" }]`; com `{ "type": "adjustDeck", "build": [{ "cardId": S, "copies": 0 }, { "cardId": S, "copies": 1 }] }` → `fields = [{ "field": "build.0.copies", "reason": "notPositiveInteger" }, { "field": "build.1.cardId", "reason": "duplicateCard" }]`.
- Com 0 pontos, `recover` e `adjustDeck` → `409` `noActionPoints`; `availableActions = ["endTurn"]` quando também não há como mover.
- Com o laboratório em `recoverHandSize: 10`, um grupo criado depois, com `drawToHand`, fica com 10 cartas na mão e `attributeDeckCount: 50`; `G` continua comprando só até 7.

Só nos e2e do backend (a pasta não enche no jogo ainda): trocar `S` por cartas da pasta, tirar cartas para a pasta, `tcgFolderFull`, `copyLimitExceeded`, `shuffleDiscard` com pilha não vazia e a leitura de saves antigos.

## 4. Códigos de erro

| Código | Quando acontece | FEAT |
|---|---|---|
| `NOT_FOUND` | Rota ou recurso inexistente. | FEAT-01 |
| `INTERNAL_ERROR` | Falha inesperada no servidor (5xx). | FEAT-01 |
| `LAB_CONFIG_INVALID` | Ajuste do laboratório inválido (400); `details.fields` diz cada chave e o motivo. | FEAT-03 |
| `CATALOG_QUERY_INVALID` | Filtro do catálogo inválido (400), ex.: `type` desconhecido. | FEAT-04 |
| `COLLECTION_NOT_FOUND` | Coleção inexistente no catálogo (404). | FEAT-04 |
| `CARD_NOT_FOUND` | Carta inexistente no catálogo (404). | FEAT-04 |
| `PARTY_INVALID` | Dados de criação do grupo inválidos (400); `details.fields` diz cada campo e o motivo. | FEAT-05 |
| `PARTY_NOT_FOUND` | Grupo (save) inexistente ou abandonado (404). | FEAT-05 |
| `PARTY_SESSION_NOT_ACTIVE` | Encerrar sessão ou fazer uma ação (FEAT-07) num grupo sem sessão em andamento (409). | FEAT-05 |
| `CONTENT_INVALID` | Coleção, carta, filtro ou arquivo de importação inválido (400); `details.fields` traz o caminho e o texto pronto de cada problema. | FEAT-31 |
| `CONTENT_ID_TAKEN` | Identificador de coleção ou carta já usado (409); `details.fields` como em `CONTENT_INVALID`. | FEAT-31 |
| `CONTENT_IN_USE` | Excluir ou substituir conteúdo usado por algum save (409). | FEAT-31 |
| `CONTENT_LOCKED` | Mudar o identificador de uma carta publicada (409). | FEAT-31 |
| `DIMENSION_INVALID` | Não há Carta de Dimensão publicada, a composição da dimensão falhou (README 3.5) ou o gerador passou do limite de tentativas, ao criar um grupo (409: o conteúdo publicado no servidor não permite preparar a partida); `details` com `dimensionCardId` e `problems`. Erro de conteúdo, para o designer. | FEAT-06 |
| `CLASS_NOT_FOUND` | Classe inexistente no editor (404). | FEAT-06 |
| `CONTENT_REFERENCED` | Excluir ou renomear uma carta de atributo que está no deck pré-pronto de uma classe (409). | FEAT-06 |
| `ACTION_INVALID` | Intenção malformada (400): corpo, `type` ou campos inválidos, ou zona fora do mapa; `details.fields` diz cada campo e o motivo. | FEAT-07 |
| `ACTION_NOT_ALLOWED` | Intenção bem formada recusada pela regra (409), ex.: zona sem travessia com a atual, sem pontos de ação (FEAT-08), build irregular ou pasta cheia (FEAT-09); `details.reason`. | FEAT-07 |

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
| 0.10 | 2026-11-14 | BE | FEAT-04 proposta: `GET /catalog/collections`, `GET /catalog/collections/:collectionId/cards` (`?type=`), `GET /catalog/cards/:cardId`; tipos `CollectionSummary` e `Card` (6 variantes por `type`); textos de regra como `RuleText` até a FEAT-11; glossário §2.7; códigos `CATALOG_QUERY_INVALID`, `COLLECTION_NOT_FOUND`, `CARD_NOT_FOUND` (§4). |
| 0.11 | 2026-11-14 | FE | FEAT-04 `acordado` sem mudanças: os 6 `type` cobrem os tipos planejados no frontend (evento aleatório e de combate separados); textos de regra como `RuleText` batem com a decisão do frontend de só exibir texto pronto até a FEAT-11; ofertas de serviço das zonas ficam para as FEATs dos serviços. |
| 0.12 | 2026-11-14 | BE | FEAT-04 `implementado (BE)`: `GET /catalog/collections`, `GET /catalog/collections/:collectionId/cards` (`?type=`) e `GET /catalog/cards/:cardId` entregues e cobertos por e2e, sem mudança de formato. `?type=` vazio ou repetido também → `CATALOG_QUERY_INVALID`. A ordem das chaves no JSON da carta não é garantida (compare por campo). Catálogo lido de `CONTENT_DIR` no boot; os cenários usam a coleção `fixture` (`CONTENT_DIR=test/fixtures/content`). |
| 0.13 | 2026-11-14 | BE | FEAT-05 proposta: `POST`/`GET /parties`, `GET`/`DELETE /parties/:partyId`, `POST /parties/:partyId/session` e `/session/end`; tipos `CreatePartyRequest`, `Party`, `PartyMember`, `PartySummary`, `PartyStatus`; glossário §2.8; códigos `PARTY_INVALID`, `PARTY_NOT_FOUND`, `PARTY_SESSION_NOT_ACTIVE` (§4). Lista de saves global até a FEAT-25. |
| 0.14 | 2026-11-14 | FE | FEAT-05 `acordado` sem mudanças. O FE usa os limites de `CreatePartyRequest` (40 e 24 caracteres) como texto de UI dos erros `tooLong`. |
| 0.15 | 2026-11-14 | FE | FEAT-04 `validado`: os 7 cenários rodaram contra o backend real (`http://localhost:3333`, `CONTENT_DIR=test/fixtures/content`) e passaram; as 6 cartas reais passam no schema do frontend. Também passaram o CORS para `http://localhost:5173` e os e2e da área `lab` com o MSW desligado. As fixtures do MSW passaram a ser cópia exata das cartas do backend. Sem mudança de formato. |
| 0.16 | 2026-11-15 | BE | FEAT-05 `implementado (BE)`: `POST`/`GET /parties`, `GET`/`DELETE /parties/:partyId`, `POST /parties/:partyId/session` e `/session/end` entregues e cobertos por e2e (os 7 cenários), sem mudança de formato. Saves gravados no banco; ids são uuid (id que não é uuid → `404` `PARTY_NOT_FOUND`). JSON malformado no `POST /parties` → `PARTY_INVALID` com `invalidBody`. O cenário `minPlayers = 2` usa `PATCH /lab/config` (precisa de `LAB_ENABLED=true`). |
| 0.17 | 2026-11-15 | FE | FEAT-05 `validado`: os 7 cenários passaram com `curl` contra o backend real, e as telas `/`, `/novo` e `/grupo/:partyId` passaram com o MSW desligado (criar, erros por campo, `belowMinPlayers`, sessão, encerrar, continuar, abandonar, `404`). Sem mudança de formato. |
| 0.18 | 2026-11-15 | FE | FEAT-31 proposta (editor de conteúdo, README B.19 T1): rotas `/lab/content/*` (coleções, cartas, publicar, duplicar, validar como dimensão, exportar, importar); tipos `ContentStatus`, `CollectionInput`, `CollectionPatch`, `EditorCollectionSummary`, `EditorCollection`, `CardInput`, `EditorCard`, `EditorCardSummary`, `DimensionValidation`, `CollectionExport`, `ImportResult`, `ContentInvalidDetails`; glossário §2.9; códigos `CONTENT_INVALID`, `CONTENT_ID_TAKEN`, `CONTENT_IN_USE`, `CONTENT_LOCKED` (§4). Muda o comportamento do catálogo da FEAT-04 (só cartas `published`), sem mudar o formato. |
| 0.19 | 2026-11-15 | BE | FEAT-06 proposta: `GET /catalog/classes` (`ClassDefinition`); `POST /parties` com `playerClass` e o grupo já preparado (`Party.dimension`, `Party.turnOrder`, `PartyMember.player`); `DimensionCard`; `ZoneCard.arrowLayout`; 11 chaves novas em `GameConfigValues`; `PartyInvalidDetails` com `playerClass`/`unknownClass`; classes no editor (`/lab/content/.../classes`, `ClassInput`, `EditorClass`, `EditorClassSummary`; classes em `CollectionExport` e `ImportResult`); cenário de `CONTENT_IN_USE`; códigos `DIMENSION_INVALID`, `CLASS_NOT_FOUND`, `CONTENT_REFERENCED` (§4); glossário §2.10. Altera tipos e cenários das FEAT-03, 04 e 05 (`validado`) e da FEAT-31 (`proposto (FE)`). Mescla com a v0.18 do FE (FEAT-31), editada em paralelo. |
| 0.20 | 2026-11-15 | BE | FEAT-06 (`proposto (BE)`) com os dois pedidos do FE aceitos: (1) `CollectionExport.classes` e `ImportResult.classCount` definidos uma vez só, na seção FEAT-31 (a FEAT-06 só os preenche); (2) `DIMENSION_INVALID` responde `409` em vez de `500` (conflito com o conteúdo publicado, não falha do servidor; `422` recusado porque o corpo do pedido está correto). |
| 0.21 | 2026-11-15 | FE | FEAT-06 `acordado` sem mudanças além das da v0.20. O FE vai alinhar as seções `validado` afetadas (FEAT-03, 04, 05) e a FEAT-31 em tarefas próprias, planejadas com `/mudar-spec`. FEAT-31 continua `proposto (FE)`, aguardando o backend. |
| 0.22 | 2026-11-15 | BE | FEAT-31 `acordado` sem mudanças de formato. Esclarecimentos: até a FEAT-06, o export traz `classes: []` e o import `classCount: 0` (os cenários os omitem; compare por campo); o `id` de coleção e o `slug` seguem `kebab-case` (sem hífen no início, no fim ou repetido), com a mesma mensagem do cenário; os cenários da FEAT-31 valem para a `fixture` de 6 cartas, e a seção FEAT-06 diz como mudam depois dela. |
| 0.23 | 2026-11-16 | BE | FEAT-31 `implementado (BE)` (SPEC-BACKEND T-19 a T-21): e2e de cada cenário em `src/infra/http/controllers/*/index.controller.e2e-spec.ts` e conferidos com `curl` contra o backend real. Sem mudança de formato: textos exatos de REQ-47 no cenário de `validate-dimension`; textos fixos novos de `fields[].message` (JSON malformado, `status` desconhecido, parâmetro repetido, `replace` inválido); citação "spec D-38" corrigida para "spec D-49". |
| 0.24 | 2026-11-16 | FE | FEAT-31 `validado` sem mudança de formato: 17 de 18 cenários com chamadas HTTP contra o backend real (29 conferências; o de laboratório desligado não foi rodado, pede reiniciar o backend) e as telas do editor (validar, exportar, importar, coleções e cartas) com o MSW desligado. |
| 0.25 | 2026-11-17 | BE | FEAT-06 `implementado (BE)` (SPEC-BACKEND T-14 a T-18): sem mudança de formato; textos de `problems` e do motivo `starterDeckCardNotPublished` incluídos; esclarecido `CONTENT_REFERENCED` na exclusão e no import com `replace` da coleção (carta referenciada por classe de outra coleção). |
| 0.26 | 2026-11-17 | FE | FEAT-06 `validado` sem mudança de formato: 26 conferências dos 12 cenários com chamadas HTTP contra o backend real (`http://localhost:3333`, `fixture`); só "apagar `fixture.stone-bend` → `204`" ficou de fora, porque um save anterior do autor usa o mapa (o `409` seria o correto). Telas "Novo jogo", grupo preparado e classes do editor com o MSW desligado. As fixtures do MSW passaram a ser cópia exata do conteúdo de teste do backend. |
| 0.27 | 2026-11-17 | BE | FEAT-07 proposta: `POST /parties/:partyId/actions` (rota única de ações) com `PartyAction` = `MoveAction`; `PlayerState.moveTargets` (altera a FEAT-06); `ActionInvalidDetails`, `ActionNotAllowedDetails`; códigos `ACTION_INVALID` (400) e `ACTION_NOT_ALLOWED` (409) (§4); `PARTY_SESSION_NOT_ACTIVE` vale também para ações; glossário §2.11. Até a FEAT-08, mover não gasta ponto de ação. |
| 0.28 | 2026-11-17 | FE | FEAT-07 `acordado` sem mudanças: os destinos vêm prontos em `moveTargets` (o frontend não calcula travessias); a rota única de ações e a união `PartyAction` cobrem as próximas intenções. O FE alinha `PlayerState` (schema e fixtures do MSW) na tarefa da FEAT-07. |
| 0.29 | 2026-11-17 | BE | FEAT-07 `implementado (BE)`: `POST /parties/:partyId/actions` e `PlayerState.moveTargets` implementados; cenários cobertos pelos e2e de `take-party-action`. Sem mudança de tipos ou textos. |
| 0.30 | 2026-11-17 | FE | FEAT-07 `validado` sem mudança de formato: os 7 cenários com chamadas HTTP contra o backend real (`http://localhost:3333`, `contractVersion` 0.29) e a tela do grupo (mapa, Movimentar ida e volta, zona sem travessia sem botão, sessão encerrada) com o MSW desligado. O backend estava com o conteúdo `base`, não a `fixture`: os cenários com `fixture.gray-harbor` rodaram com a cidade inicial real (`base.harbor-town`); as invariantes são as mesmas. |
| 0.31 | 2026-11-17 | BE | FEAT-08 proposta: `Party.turn` (`PartyTurn`: `round`, `memberId`, `actionPoints`) e `PlayerState.availableActions` (alteram FEAT-05/06); `PartyAction` ganha `EndTurnAction` (`{ type: "endTurn" }`) na rota de ações; `move` gasta 1 ponto de ação; `ActionNotAllowedDetails.reason` ganha `noActionPoints` (altera FEAT-07, cuja nota "Até a FEAT-08" sai); glossário §2.12. Saves anteriores continuam (lidos na rodada 1). Sem rota nem código de erro novos. |
| 0.32 | 2026-11-17 | FE | FEAT-08 `acordado` sem mudanças: pontos restantes, vez e ações disponíveis chegam prontos (`turn`, `availableActions`); o frontend só exibe e envia `endTurn`. O FE alinha schemas e fixtures do MSW (`Party.turn`, `availableActions`) nas tarefas da FEAT-08. |
| 0.33 | 2026-11-17 | BE | FEAT-08 `implementado (BE)`: `Party.turn`, `PlayerState.availableActions`, `endTurn` e `noActionPoints` implementados; os 8 cenários cobertos pelos e2e de `take-party-action` (REQ-54 a REQ-59) e `create-party`. Saves anteriores são lidos na rodada 1 e regravados no formato novo. Sem mudança de tipos ou textos. |
| 0.34 | 2026-11-17 | FE | FEAT-08 `validado` sem mudança de formato: os 8 cenários com chamadas HTTP contra o backend real (`http://localhost:3333`, `contractVersion` 0.33) e a tela do grupo (pontos 3→0, aviso sem pontos e botão Movimentar ausente, Encerrar a vez → rodada 2 com 3 pontos) com o MSW desligado. Backend com o conteúdo `base`: `H` = `base.harbor-town`, `A` = `base.misty-forest`; as invariantes são as mesmas. |
| 0.35 | 2026-11-17 | BE | FEAT-09 proposta (`proposto (BE)`): `PlayerState.build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity` (altera FEAT-06); `PartyAction` ganha `RecoverAction` e `AdjustDeckAction` (build nova inteira); `availableActions` ganha `recover`/`adjustDeck`; motivos novos em `ActionInvalidDetails` (`unknownOption`, `notArray`, `invalidItem`, `notPositiveInteger`, `duplicateCard`) e `ActionNotAllowedDetails` (`notOwned`, `copyLimitExceeded`, `buildBelowMinimum`, `tcgFolderFull`, campo `cardId`); 5 chaves novas em `GameConfigValues` (altera FEAT-03); limite de cópias ao publicar classe (altera FEAT-06/31); glossário §2.13. Sem rota nem código de erro novos. |
| 0.36 | 2026-11-17 | FE | FEAT-09 `acordado` sem mudanças: build, pasta, opções do Recuperar, ações disponíveis e os motivos de recusa chegam prontos; o frontend só exibe e envia a build inteira (não confere cópias, trava nem capacidade). O FE alinha os schemas (`PlayerState`, `availableActions`, `GameConfigValues`, motivos de erro) e as fixtures do MSW nas tarefas da FEAT-09. |
| 0.37 | 2026-11-17 | BE | FEAT-09 `implementado (BE)`: `PlayerState.build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity`, `recover`, `adjustDeck`, os motivos novos e as 5 chaves de `GameConfigValues` implementados; os cenários cobertos pelos e2e de `take-party-action` (`index.deck.controller.e2e-spec.ts`, REQ-60 a REQ-68), `create-party` e `get-lab-config`. Saves anteriores são lidos com a pasta vazia e as chaves novas nos padrões, e regravados no formato novo. Sem mudança de tipos ou textos. |
