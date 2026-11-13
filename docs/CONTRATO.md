# Misadventures — Contrato frontend ↔ backend

> **Versão do contrato:** 0.1 · **Data:** 2026-11-13
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

## 1. Convenções — `proposto (FE)`

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

## 2. Glossário termo → identificador — `proposto (FE)`

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

*(nenhuma ainda)*

## 4. Códigos de erro

| Código | Quando acontece | FEAT |
|---|---|---|
| *(nenhum ainda)* | | |

## 5. Histórico

| Versão | Data | Lado | Mudança |
|---|---|---|---|
| 0.1 | 2026-11-13 | FE | Versão inicial: convenções (§1) e glossário (§2) propostos. Aguarda confirmação do backend. |
