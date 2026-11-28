# Misadventures (frontend) — Especificação

> **Versão da spec:** 1.13 · **Data:** 2026-11-27
>
> Spec-anchored: toda mudança de comportamento do frontend começa aqui, é aprovada pelo autor e só depois vira teste e código. As **regras do jogo** não ficam aqui: estão em [`README.md`](README.md) e são citadas por seção (D-03).

## 1. Visão

**O quê:** o cliente do Misadventures, um TCG/RPG cooperativo jogado em vezes alternadas (README 1). Primeiro roda na web; depois vira executável de PC com Tauri, sempre ligado a um servidor remoto (README II.2, decisão F28).

**Papel do frontend:** mostrar o estado da partida que o backend envia, com destaque para os termos do jogo, cartas legíveis e animações simples no estilo PSX, e enviar as intenções do jogador. O backend é autoritativo desde o início (README II.1).

**Para quem:** o jogador, no PC (README II.1). O autor também usa o laboratório de testes (README II.6) nos builds de dev.

**Fora do escopo do frontend:**
- qualquer regra do jogo: sorteios, cálculos, validação de ações, IA de jogador, IA dos inimigos, gerador de mapa (tudo no backend);
- modos além da Campanha, raides e exploração de zonas (README 1.4, 22, 3.6);
- autenticação até a FEAT-25 (os detalhes são decididos pelo autor na hora, decisão F29);
- a seção "Melhorias para o futuro" do Apêndice B.

**Ordem de entrega:** a do [`ROADMAP.md`](ROADMAP.md): fundação → um jogador → ajudantes de IA → online (README III.4).

## 2. Regras do domínio

- **Fonte única:** [`README.md`](README.md), Parte I (regras) e Parte II (requisitos técnicos). Esta spec cita a seção (`README 14.2`) e nunca copia a regra (D-03).
- **Decisões do autor:** Apêndice B do README. Elas não se reabrem. Em situações não cobertas, vale a ordem de desempate do início do Apêndice B.
- **O que o frontend precisa saber de uma regra:** só o necessário para **exibir** (o que aparece, em que ordem, com que texto) e para **enviar a intenção certa**. Valores, permissões e resultados vêm do backend (CLAUDE.md, princípio 1).
- **Termos do jogo:** o glossário de [`CONTRATO.md`](CONTRATO.md) §2 liga o termo em pt-BR ao identificador. É a lista de partida dos termos com destaque e tooltip (README II.4).
- **Mudança de regra:** começa no README (nova revisão B.N no Apêndice B, com aprovação do autor) e gera um **Aviso de backend** para a cópia do README chegar ao backend.

## 3. Arquitetura

### 3.1 Glossário

Em [`CONTRATO.md`](CONTRATO.md) §2, porque os identificadores são compartilhados com o backend. Termos que só existem na interface (sem identificador no contrato) entram aqui quando surgirem:

| Termo na interface (pt-BR) | Identificador no código | Definição |
|---|---|---|
| *(nenhum ainda)* | | |

### 3.2 Stack, módulos e bibliotecas autorizadas

| Biblioteca | Situação | Uso |
|---|---|---|
| TypeScript ~6.0 (D-11), Vite ^8.3, React ^19.3 (com React Compiler via Babel) | instaladas | base |
| ESLint ^10 + typescript-eslint + react-hooks + react-refresh | instaladas | lint |
| Prettier ^3.10 | instalada (T-01, D-05) | formatação |
| Vitest ^5.1 + jsdom ^29 + @testing-library/react ^16 + @testing-library/jest-dom ^7 | instaladas (T-01, D-12) | testes unitários e de componentes |
| Playwright (@playwright/test ^1.65, Chromium) | instalada (T-01) | testes e2e |
| TanStack Query ^5.107 | instalada (T-03) | estado do servidor e cache |
| React Router DOM ^7.18 | instalada (T-03) | rotas |
| MSW ^3.0 (com o plugin `msw/vite`, D-15) | instalada (T-03) | mocks de rede no dev e nos testes |
| Zod ^4.6 | instalada (T-03, D-14) | validação dos dados recebidos em `src/api/` |
| Tauri | autorizada (README II.2), FEAT-29 | executável de PC |

Qualquer outra **só com autorização**.

**Módulos (pastas criadas na T-03):**

| Pasta | Responsabilidade | Pode importar |
|---|---|---|
| `src/api/` | contrato em código (tipos), cliente HTTP (socket na FEAT-26), validação dos dados recebidos, consultas e mutações | nada de `features`, `ui`, `lab`, `mocks` |
| `src/mocks/` | handlers do MSW e fixtures do contrato (só dev e testes) | `src/api/` (tipos) |
| `src/features/<área>/` | telas e componentes de uma área do jogo | `api`, `ui` |
| `src/ui/` | componentes visuais compartilhados (carta, termo com tooltip, botões) e tokens | nada de `features` |
| `src/lab/` | laboratório de testes (só dev, D-07) | `api`, `ui` |

### 3.3 Modelo de dados

Os tipos são os do contrato ([`CONTRATO.md`](CONTRATO.md)), transcritos em `src/api/` como uniões discriminadas. Primeiro tipo: `HealthResponse` (CONTRATO §3 FEAT-01), com schema Zod correspondente (D-14), na T-04.

### 3.4 Camada de cliente (API pública de `src/api/`)

Funções e hooks que as telas usam para ler o estado e enviar intenções. Regra: a tela nunca monta URL, nunca lê resposta crua e nunca decide uma regra; ela consome o que `src/api/` expõe.

| Função/hook | O que entrega | Tarefa |
|---|---|---|
| `useHealth()` | consulta `GET /health` e entrega o estado da ponte: carregando, `HealthResponse` validado, erro §1.4 (com `code` e `message`) ou falha de rede/validação | T-04 |
| `useLabConfig()` | consulta `GET /lab/config`: carregando, `LabConfig` validado, erro §1.4 ou falha de rede/validação | T-08 |
| `useUpdateLabConfig()` | mutação `PATCH /lab/config` com `LabConfigPatch`; sucesso atualiza o cache de `useLabConfig` com o `LabConfig` devolvido; erro §1.4 com `details` de `LAB_CONFIG_INVALID` validado | T-08 |
| `useResetLabConfig()` | mutação `POST /lab/config/reset`; sucesso atualiza o cache de `useLabConfig` | T-08 |
| `useCollections()` | consulta `GET /catalog/collections`: `CollectionSummary[]` validado (CONTRATO §3 FEAT-04) | T-11 |
| `useCards(collectionId, type?)` | consulta `GET /catalog/collections/:collectionId/cards`: `Card[]` completo (união por `type`), filtrado pelo backend; `null`: consulta parada (T-48) | T-11 |
| `useParties()` | consulta `GET /parties`: `PartySummary[]` validado (CONTRATO §3 FEAT-05) | T-16 |
| `useCreateParty()` | mutação `POST /parties` com `CreatePartyRequest`: `Party` validado; erro `PARTY_INVALID` com `details.fields` validado | T-16 |
| `useStartSession(partyId)` | mutação `POST /parties/:partyId/session`: `Party` validado | T-16 |
| `useEndSession(partyId)` | mutação `POST /parties/:partyId/session/end`: `Party` validado; sucesso invalida `useParties` | T-16 |
| `useAbandonParty()` | mutação `DELETE /parties/:partyId` (`204`); sucesso ou erro invalida `useParties` | T-16 |
| `useClasses()` | consulta `GET /catalog/classes`: `ClassDefinition[]` validado (CONTRATO §3 FEAT-06) | T-28 |
| `useCatalogCard(cardId)` | consulta `GET /catalog/cards/:cardId`: `Card` validado; cache por id (D-48) | T-28 |
| `useCatalogCards(cardIds)` | várias `GET /catalog/cards/:cardId`, uma por id distinto, no mesmo cache do `useCatalogCard`; devolve as cartas recebidas, `isPending` e o primeiro erro (D-51) | T-31 |
| `usePartyAction(partyId)` | mutação `POST /parties/:partyId/actions` com `PartyAction` (`MoveAction` na FEAT-07, `EndTurnAction` na FEAT-08, T-38; `RecoverAction` e `AdjustDeckAction` na FEAT-09, T-41; `PrepareAction` na FEAT-10, T-45; `UseVaultAction` e `ScavengeAction` na FEAT-32, T-49): `Party` validado; erros §1.4 como `ApiError` (CONTRATO §3 FEAT-07) | T-35 |
| `useParty(partyId \| null)` | consulta `GET /parties/:partyId`: `Party` validado (`null`: consulta parada) | T-45 |
| `useLabGrant()` | mutação `POST /lab/parties/:partyId/members/:memberId/grants` com `{ partyId, memberId, grant: LabGrantRequest }`: `Party` validado; `LAB_GRANT_INVALID` → `LabGrantInvalidError` (`fields`), `LAB_GRANT_NO_SPACE` → `LabGrantNoSpaceError` (`reason`) (CONTRATO §3 FEAT-10); o sucesso invalida `partiesKey` (T-48) | T-45 |
| Classes no editor, em `src/api/editor.ts` | `useEditorClasses(collectionId)`, `useEditorClass(playerClass)`, `useCreateClass`, `useSaveClass`, `usePublishClass`, `useDeleteClass`, sob a chave `['editor']` (D-40, D-52) | T-32 |
| Editor de conteúdo (FEAT-31), em `src/api/editor.ts` | consultas `useEditorCollections()`, `useEditorCollection(collectionId | null)` (`null`: consulta parada, T-21), `useEditorCards(collectionId, { type?, status?, q? })`, `useEditorCard(cardId)`; mutações `useCreateCollection`, `useUpdateCollection` (`{ collectionId, patch }`), `useDeleteCollection`, `useValidateDimension`, `useExportCollection`, `useImportCollection` (`{ content, replace }`), `useCreateCard` (`{ collectionId, input }`), `useSaveCard` (`{ cardId, input }`), `usePublishCard`, `useDuplicateCard`, `useDeleteCard`. `CONTENT_INVALID` e `CONTENT_ID_TAKEN` com `details` válido viram `ContentInvalidError` (com `code` e `fields`) (D-40) | T-20 |

Base comum (T-08): `requestJson(method, path, body?)` em `src/api/http.ts` faz todo pedido; `ApiError` traz `code`, `message` e `details` (ainda `unknown`); `LAB_CONFIG_INVALID` com `details` válido vira `LabConfigInvalidError` (subclasse, com `fields`); com `details` fora do contrato vira erro genérico (falha de validação, REQ-06).

### 3.5 Telas e áreas de e2e

| Área | Rota | Telas | FEAT |
|---|---|---|---|
| app | `/` | rota inicial: menu da campanha e "Seus jogos" com o abandono e o save congelado (REQ-14, REQ-17, REQ-96) + área de status da ponte com o servidor (REQ-01); tema e tipografia da base visual (REQ-02) | FEAT-01, FEAT-02, FEAT-19 |
| lab | `/lab` (só dev, D-07) | laboratório: configuração ajustável do jogo e vitrine de componentes (REQ-05 a REQ-07); catálogo de cartas (REQ-08 a REQ-13); valores e cartas da FEAT-06 (REQ-27, REQ-28); valores da FEAT-09 (REQ-39); valores e doação da FEAT-10 (REQ-43, REQ-46); valores e cartas da FEAT-32 (REQ-47, REQ-48); valores e campos do mercado (REQ-71, REQ-72); valores e campos do ferreiro (REQ-77, REQ-78); valores e doação da montaria, carta de montaria (REQ-82, REQ-83); valores da conclusão, doação e carta de item de conclusão, conclusão na Carta de Dimensão (REQ-90, REQ-91) | FEAT-03, FEAT-04, FEAT-06, FEAT-09, FEAT-10, FEAT-32, FEAT-16, FEAT-17, FEAT-18, FEAT-19 |
| party | `/novo`, `/grupo/:partyId` | novo jogo (grupo de 1) com escolha de classe e grupo em sessão com a partida preparada, o mapa, o Movimentar, a vez, o deck de atributos, o inventário com Preparar, o cofre e o Vasculhar, Ir ao Mercado e abrir booster (REQ-15, REQ-16, REQ-29, REQ-30, REQ-34 a REQ-38, REQ-40 a REQ-42, REQ-44, REQ-45, REQ-50 a REQ-52, REQ-73 a REQ-76, REQ-79 a REQ-81), a montaria, Transferir, Movimentar até 2 zonas e o Estábulo (REQ-84 a REQ-89), itens de conclusão, Concluir dimensão, chefe final, painel de conclusão e nova dimensão (REQ-92 a REQ-95), save congelado ao abrir (REQ-96) | FEAT-05, FEAT-06, FEAT-07, FEAT-08, FEAT-09, FEAT-10, FEAT-32, FEAT-16, FEAT-17, FEAT-18, FEAT-19 |
| editor | `/lab/editor` (só dev, D-07) | editor de conteúdo: coleções, cartas e classes (REQ-18 a REQ-26, REQ-31 a REQ-33, REQ-49, REQ-72, REQ-78, REQ-83, REQ-91) | FEAT-31, FEAT-06, FEAT-32, FEAT-16, FEAT-17, FEAT-18, FEAT-19 |

Os componentes compartilhados da FEAT-02 (termo do jogo, categoria de carta) ainda não aparecem em nenhuma tela: são verificados por testes de componente até entrarem no laboratório (FEAT-03) e nas telas da FEAT-04.

### 3.6 Laboratório

Requisitos em README II.6. No frontend: existe só no build de dev (D-07); cada FEAT acrescenta os valores do Apêndice A que ela usa, conforme o ROADMAP. O backend aplica os valores; a tela só os edita e mostra.

## Requisitos

### REQ-01 — Estado da ponte com o servidor na rota inicial

A rota inicial mostra uma **área de status** (elemento com papel acessível `status`), discreta, abaixo do título. Os textos exatos:

- **Dado** o app aberto na rota inicial, **quando** a consulta `GET /health` está em andamento, **então** a área de status mostra "Conectando ao servidor…".
- **Dado** o backend respondendo `200` com `{ "status": "ok", "contractVersion": "0.4" }`, **quando** a rota inicial carrega, **então** a área de status mostra "Servidor conectado · contrato v0.4" (a versão vem de `contractVersion`; nunca fixa no código do frontend).
- **Dado** o backend respondendo erro no formato do CONTRATO §1.4 (ex.: `500` com `{ "error": { "code": "INTERNAL_ERROR", "message": "Erro inesperado no servidor. Tente novamente." } }`), **quando** a rota inicial carrega, **então** a área de status mostra exatamente a `message` recebida (D-01) e nenhuma exceção chega à tela.
- **Dado** o servidor inacessível (falha de rede) ou uma resposta que não passa na validação (D-14) — inclusive um erro HTTP cujo corpo não é o envelope §1.4 válido —, **quando** a rota inicial carrega, **então** a área de status mostra "Servidor indisponível. Tente novamente." e nenhuma exceção chega à tela. *(Texto do frontend: falha de conexão não é regra de jogo e não tem `message` do backend; corpo fora do contrato nunca vira texto cru na tela.)*

### REQ-02 — Base visual: tema escuro, contraste, tipografia e resoluções

- **Dado** qualquer par de tokens de texto e fundo definido no arquivo de tokens, **quando** o contraste é calculado, **então** é de pelo menos 4.5:1 (texto comum) ou 3:1 (texto grande, ícones informativos e contorno de foco) (WCAG AA).
- **Dado** a rota inicial, **quando** ela é exibida, **então** o fundo e o texto usam os tokens do tema escuro, o título "Misadventures" usa a fonte de títulos (Lora) e o texto corrido (área de status) usa a fonte do sistema.
- **Dado** uma janela de 1280×720 ou de 2560×1440, **quando** a rota inicial é exibida, **então** não existe rolagem horizontal.

### REQ-03 — Termo do jogo com destaque e tooltip

- **Dado** um termo do catálogo de termos (ex.: o atributo Força, id `strength`), **quando** ele aparece num texto, **então** é exibido com o estilo de destaque de termo e com o nome em pt-BR do catálogo.
- **Dado** um termo destacado, **quando** o jogador passa o mouse sobre ele **ou** o foca pelo teclado, **então** aparece um tooltip com o texto explicativo do catálogo, ligado ao termo por `aria-describedby`.
- **Dado** o tooltip aberto, **quando** o mouse sai do termo, o foco sai ou o jogador aperta Esc, **então** o tooltip some.
- **Dado** o tooltip aberto, **então** ele não cobre o termo que o abriu.
- Um id fora do catálogo é erro de tipo (não compila).

### REQ-04 — Carta com categoria visível

- **Dado** uma carta com categoria, **quando** ela é exibida, **então** mostra juntos o **ícone**, a **imagem** e o **rótulo** em pt-BR da categoria (README II.4).
- **Dado** uma categoria cuja arte o autor ainda não entregou, **quando** a carta é exibida, **então** no lugar da imagem aparece uma moldura neutra e o rótulo continua visível (a informação nunca depende só da imagem).
- **Dado** o ícone da categoria ao lado do rótulo, **então** o ícone é decorativo (`alt=""`); a imagem tem texto alternativo com o rótulo da categoria.
- **Dado** o catálogo de categorias, **quando** os testes rodam, **então** todo id do catálogo tem ícone e imagem (ou está marcado como "arte pendente").

### REQ-05 — Laboratório só no build de dev

- **Dado** o app no build de dev, **quando** o jogador abre `/lab`, **então** vê a tela com o título "Laboratório".
- **Dado** o build de release (`npm run build`), **quando** o `dist/` é inspecionado, **então** não contém código de `src/lab/` nem a rota `/lab` (teste de build, D-07).

### REQ-06 — Configuração ajustável do jogo

Valores, padrões e limites vêm prontos do backend (CONTRATO §3 FEAT-03); o frontend não valida regra, só exibe e envia. Rótulos dos campos (glossário §2.6): "Jogadores (mínimo)", "Jogadores (máximo)", "Pontos de ação por vez", "Pico inicial", "Vigor inicial", "Vida base", "Ouro inicial", "Mão inicial".

- **Dado** a consulta `GET /lab/config` em andamento, **então** a área de status da tela mostra "Carregando configuração…".
- **Dado** o backend devolvendo o `LabConfig` dos padrões, **quando** a tela carrega, **então** há um campo numérico rotulado por chave com o valor de `values`, e junto dele o texto "Padrão: {defaults} · Mín. {min} · Máx. {max}" (ex.: "Padrão: 3 · Mín. 1 · Máx. 10").
- **Dado** nenhum campo alterado, ou algum campo vazio, **então** o botão "Salvar" fica desabilitado.
- **Dado** o jogador mudou "Pontos de ação por vez" para 4, **quando** clica em "Salvar", **então** o pedido `PATCH /lab/config` leva só as chaves alteradas (`{ "actionPointsPerTurn": 4 }`); com `200`, os campos mostram o `values` devolvido e a área de status mostra "Configuração salva.".
- **Dado** o backend respondendo `400` `LAB_CONFIG_INVALID`, **quando** o jogador salva, **então** a área de status mostra a `message` recebida, os campos mantêm o que o jogador digitou e cada campo listado em `details.fields` mostra, ligado a ele por `aria-describedby`: `outOfRange` → "Use um valor entre {min} e {max}." (de `limits`); `notInteger` → "Use um número inteiro."; `minAboveMax` → "O mínimo de jogadores não pode passar do máximo.". `unknownKey` e `invalidBody` ficam só com a `message`.
- **Dado** a tela carregada, **quando** o jogador clica em "Restaurar padrões", **então** é enviado `POST /lab/config/reset`; com `200`, os campos mostram o `values` devolvido e a área de status mostra "Padrões restaurados.".
- **Dado** qualquer outro erro §1.4 (inclusive `404` `NOT_FOUND` com o laboratório desligado no backend), **então** a área de status mostra a `message` recebida; **dado** falha de rede ou resposta fora do contrato, mostra "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### REQ-07 — Vitrine dos componentes compartilhados no laboratório

- **Dado** a tela do laboratório, **quando** ela é exibida, **então** há uma seção "Componentes" que mostra o termo do jogo (REQ-03) com os 9 atributos do catálogo e a categoria de carta (REQ-04) com os ids de teste, inclusive um com arte pendente; o comportamento de cada um é o do seu REQ.

### REQ-08 — Catálogo de cartas no laboratório

Tudo vem pronto do backend (CONTRATO §3 FEAT-04); o frontend não filtra por regra, só pede e exibe. Todo rótulo pt-BR de identificador vem do glossário (CONTRATO §2.3, §2.5, §2.7).

- **Dado** a tela do laboratório, **quando** ela é exibida, **então** há uma seção "Catálogo" com a lista de coleções (`name` de cada `CollectionSummary`) e um filtro de tipo de carta com as opções "Todos", "Zona", "Atributo", "Equipamento", "Item", "Evento aleatório" e "Evento de combate"; ao lado de cada opção, a quantidade de `cardCounts` da coleção escolhida ("Todos" mostra a soma).
- **Dado** a consulta das coleções ou das cartas em andamento, **então** a área de status da seção mostra "Carregando catálogo…".
- **Dado** uma coleção e um tipo escolhidos, **quando** o backend devolve a lista (`GET /catalog/collections/:collectionId/cards`, com `?type=` exceto em "Todos"), **então** cada carta aparece na ordem recebida como um item com o nome (`name`, ou `title` em zona e eventos) e o rótulo do tipo; com a lista vazia, a seção mostra "Nenhuma carta neste filtro.".
- **Dado** a lista exibida, **quando** o jogador escolhe uma carta, **então** a carta completa aparece ao lado, no formato do REQ-09 a REQ-13 conforme o `type`.
- **Dado** um erro §1.4 (ex.: `404` `COLLECTION_NOT_FOUND` "Coleção não encontrada."), **então** a área de status mostra a `message` recebida; **dado** falha de rede ou resposta fora do contrato (inclusive um `type` desconhecido), mostra "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

Regras comuns às cartas (REQ-09 a REQ-13): o texto de flavor aparece só quando não é `null`; listas vazias e campos `null` não aparecem (nada de "—" ou "Nenhum"); os `RuleText` aparecem como vieram (D-27); atributos e modificadores aparecem como termo do jogo (REQ-03).

### REQ-09 — Carta de atributo

- **Dado** uma carta `attribute` (README 4.3), **quando** exibida, **então** mostra nome, raridade, o tipo ("Básica", "Sinérgica" ou "Aprimorada", de `attributeKind`) e cada atributo de `attributes` (cada um vale 1, ex.: "1 Carisma", "1 Sabedoria").
- **Dado** uma carta aprimorada, **então** mostra também os efeitos.

### REQ-10 — Carta de equipamento

- **Dado** uma carta `equipment` (README 5.1), **quando** exibida, **então** mostra: nome; categoria de `slot` (REQ-04); etiquetas; raridade; modificadores na ordem recebida, com o primeiro marcado "principal" (ex.: "+12 Ataque (principal)"); ajuste de preço ("Preço ×1,2"); e, só quando presentes, "Pico {n}", restrição de classe (rótulos das classes), "Bloqueia escudo" (só quando `true`), habilidades (nome e texto), efeitos, refino e encantamento (blocos "Refino" e "Encantamento", REQ-78).

### REQ-11 — Carta de item

- **Dado** uma carta `item` (README 5.2), **quando** exibida, **então** mostra nome, categoria de `itemCategory` (REQ-04), etiquetas, raridade e efeitos.

### REQ-12 — Carta de zona

- **Dado** uma carta `zone` (README 3.4), **quando** exibida, **então** mostra título, tipo de zona, local, "Setas de conexão: {n}", as ações de zona (rótulos do glossário §2.5) e os efeitos, cada um marcado "Positivo" ou "Negativo" de `polarity` (com texto, não só cor).

### REQ-13 — Cartas de evento

- **Dado** uma carta `randomEvent` (README 14.1), **quando** exibida, **então** mostra título, requisitos de resolução, "Coisa boa", "Coisa ruim" e, só quando `noEscape` é `true`, "Sem fuga" (com rótulo, não só ícone).
- **Dado** uma carta `combatEvent` (README 14.1, 18.1), **quando** exibida, **então** mostra título, "Coisa boa", "Coisa ruim", "Sem fuga" como acima e um bloco por inimigo com: "{count}× {name}" (só o nome quando `count` é 1), flavor text, tipos, criatura, categoria, elemento (se houver), vida, os 7 modificadores, Vigor (se houver), habilidades e comportamento.

### REQ-14 — Menu inicial com os jogos salvos

A rota `/` deixa de ser placeholder: mantém o título "Misadventures" e a área de status da ponte (REQ-01) e ganha o menu da campanha (README 28.1; CONTRATO §3 FEAT-05). A lista é a de todo o servidor até a FEAT-25.

- **Dado** a rota `/`, **quando** ela é exibida, **então** mostra o link "Novo jogo" (leva a `/novo`) e a seção "Seus jogos", com área de status própria (papel `status`).
- **Dado** a consulta `GET /parties` em andamento, **então** a área de status da seção mostra "Carregando jogos…".
- **Dado** a lista recebida, **então** cada save aparece na ordem recebida como um item com: `name`; os `characterNames` separados por ", "; a situação ("Pausado" para `idle`, "Em sessão" para `inSession`); "Salvo em {data e hora de `savedAt` no fuso do jogador, formato pt-BR, ex.: 14/11/2026 18:30}"; e os botões "Continuar" e "Abandonar". Com a lista vazia, a seção mostra "Nenhum jogo salvo.".
- **Dado** "Continuar" num save, **quando** clicado, **então** o app vai para `/grupo/:partyId` (REQ-16).
- **Dado** um erro §1.4, **então** a área de status da seção mostra a `message`; falha de rede ou resposta fora do contrato mostra "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### REQ-15 — Novo jogo (grupo de 1)

- **Dado** a rota `/novo`, **quando** exibida, **então** mostra o título "Novo jogo", os campos "Nome do grupo" e "Nome do personagem", o botão "Criar grupo" e o link "Voltar" (leva a `/`).
- **Dado** os campos, **quando** o jogador clica "Criar grupo", **então** o app envia `POST /parties` com os textos como digitados (o backend remove os espaços das pontas e valida) e, durante o pedido, o botão fica desabilitado e a área de status mostra "Criando grupo…".
- **Dado** `201`, **então** o app vai para `/grupo/:partyId` do grupo criado (REQ-16).
- **Dado** `400` `PARTY_INVALID`, **então** cada campo de `details.fields` mostra o texto do seu `reason`, ligado ao campo por `aria-describedby`: `required`, `notString` ou `blank` → "Informe o nome do grupo." / "Informe o nome do personagem."; `tooLong` → "Use até 40 caracteres." (grupo) / "Use até 24 caracteres." (personagem). `members` com `belowMinPlayers` → a área de status mostra "A configuração atual não permite jogar com um grupo de 1."; `invalidBody` → a `message`. Os erros valem até o próximo envio; o que foi digitado continua nos campos.
- **Dado** outro erro §1.4, falha de rede ou resposta fora do contrato, **então** a área de status mostra a `message` ou "Servidor indisponível. Tente novamente.".

### REQ-16 — Grupo em sessão

- **Dado** a rota `/grupo/:partyId`, **quando** ela abre, **então** o app envia `POST /parties/:partyId/session` (Continuar; repetir num grupo já em sessão não muda nada, CONTRATO §3 FEAT-05) e a área de status mostra "Abrindo o grupo…".
- **Dado** `200`, **então** a tela mostra o `name` como título, a lista "Membros" com cada `characterName` (o host com " (host)" depois do nome), a situação ("Em sessão" ou "Pausado", do `status` recebido), "Salvo em {data e hora}" (como no REQ-14), o botão "Encerrar sessão" e o estado da partida do REQ-30 (FEAT-06; antes dela, o texto "A partida começa na próxima etapa do jogo.").
- **Dado** "Encerrar sessão", **quando** clicado, **então** o app envia `POST /parties/:partyId/session/end` com o botão desabilitado; com `200`, volta a `/` e a área de status de "Seus jogos" mostra "Sessão encerrada.".
- **Dado** `404` `PARTY_NOT_FOUND` (ao abrir ou ao encerrar), **então** a área de status mostra a `message` e o link "Voltar ao início"; **dado** `409` `PARTY_SESSION_NOT_ACTIVE` ou outro erro §1.4, mostra a `message`; falha de rede ou resposta fora do contrato, "Servidor indisponível. Tente novamente.".

### REQ-17 — Abandonar a partida

- **Dado** "Abandonar" num save da lista (REQ-14), **quando** clicado, **então** abre um diálogo modal (papel `dialog`) com o título "Abandonar “{name}”?", o texto "O save será apagado para sempre. Não dá para desfazer." e os botões "Abandonar" e "Cancelar"; o foco vai para "Cancelar".
- **Dado** o diálogo aberto, **quando** o jogador clica "Cancelar" ou aperta Esc, **então** o diálogo fecha sem enviar nada e o foco volta ao botão "Abandonar" do save.
- **Dado** o diálogo aberto, **quando** o jogador confirma "Abandonar", **então** o app envia `DELETE /parties/:partyId`; com `204`, o diálogo fecha, a lista é consultada de novo e a área de status de "Seus jogos" mostra "Grupo abandonado.".
- **Dado** `404` `PARTY_NOT_FOUND` ou outro erro §1.4, **então** o diálogo fecha, a lista é consultada de novo e a área de status mostra a `message`; falha de rede ou resposta fora do contrato mostra "Servidor indisponível. Tente novamente.".

### Editor de conteúdo (FEAT-31)

Ferramenta do autor para criar coleções e cartas (README 27, II.6; Apêndice B, T1). O backend grava, valida e decide tudo (CONTRATO §3 FEAT-31); o frontend só edita, envia e mostra. Regras comuns do REQ-18 ao REQ-26: rótulos pt-BR de identificadores vêm do glossário (CONTRATO §2); cada seção tem a própria área de status (papel `status`); qualquer erro §1.4 sem tratamento próprio mostra a `message`, e falha de rede ou resposta fora do contrato mostra "Servidor indisponível. Tente novamente."; nenhuma exceção chega à tela; durante um envio, o botão que o disparou fica desabilitado.

### REQ-18 — Editor só no dev

- **Dado** o build de dev, **quando** o autor abre `/lab`, **então** há um link "Editor de conteúdo" que leva a `/lab/editor`, onde a tela tem o título "Editor de conteúdo" e um link "Voltar ao laboratório".
- **Dado** o build de release, **quando** o `dist/` é inspecionado, **então** não contém o código nem a rota do editor (teste de build, D-07, D-24).

### REQ-19 — Coleções

- **Dado** a tela do editor, **quando** ela é exibida, **então** há uma seção "Coleções" com a lista recebida do backend; cada coleção aparece com `name`, o identificador e "{p} publicadas · {r} rascunhos" (contagens prontas do backend); com a lista vazia, "Nenhuma coleção ainda.". Durante a consulta, a área de status mostra "Carregando coleções…". Ao abrir a tela, nenhuma coleção vem escolhida (D-41).
- **Dado** a coleção escolhida, **então** um painel mostra as contagens prontas do backend por tipo de carta (rótulos do REQ-08) e por raridade ("Comum", "Incomum", "Rara", "Épica", "Lendária").
- **Dado** "Nova coleção", **quando** clicado, **então** aparece um formulário com "Identificador", "Nome" e "Descrição" e os botões "Criar coleção" e "Cancelar"; com sucesso, a coleção nova aparece escolhida e a área de status mostra "Coleção criada.".
- **Dado** "Editar coleção", **então** o mesmo formulário aparece com os valores atuais e o campo "Identificador" somente leitura (Apêndice B, T1), com o botão "Salvar coleção"; o envio leva `name` e `description`; com sucesso, "Coleção salva.". Criar ou salvar com sucesso fecha o formulário; "Cancelar" fecha sem enviar.
- **Dado** `CONTENT_INVALID` ou `CONTENT_ID_TAKEN`, **então** cada campo listado mostra o texto recebido (D-38), ligado ao campo por `aria-describedby`, e o que foi digitado continua nos campos.
- **Dado** "Excluir coleção", **quando** clicado, **então** abre um diálogo (como o do REQ-17) com o título "Excluir “{name}”?", o texto "A coleção e todas as cartas dela serão apagadas. Não dá para desfazer." e os botões "Excluir" e "Cancelar"; confirmado com sucesso, a lista é consultada de novo e a área de status mostra "Coleção excluída."; com `409` `CONTENT_IN_USE`, mostra a `message` e nada é apagado.

### REQ-20 — Cartas da coleção

- **Dado** uma coleção escolhida, **então** há uma seção "Cartas" com os filtros "Tipo de carta" (opções do REQ-08), "Situação" ("Todas", "Rascunho", "Publicada") e o campo de busca "Buscar por nome"; cada mudança de filtro (a busca, ao parar de digitar ou apertar Enter) consulta o backend, que filtra (D-39).
- **Dado** a lista recebida, **então** cada carta aparece na ordem recebida como um botão "{nome} · {tipo} · {Rascunho|Publicada}" (nome = `name`, ou `title` em zona e eventos); com a lista vazia, "Nenhuma carta neste filtro.". Durante a consulta, "Carregando cartas…".
- **Dado** "Nova carta", **quando** clicado, **então** o autor escolhe o tipo entre os 6 do REQ-08 e abre o formulário vazio daquele tipo (REQ-21), em rascunho e ainda não salvo.
- **Dado** uma carta da lista, **quando** escolhida, **então** abre o formulário dela com os valores recebidos (REQ-21).

### REQ-21 — Formulário de carta

Campos e formatos são os do `Card` do CONTRATO §3 FEAT-04 (mais os da FEAT-31); o formulário não aplica limite nem combinação de regra (o backend confere).

- **Dado** qualquer tipo, **então** o formulário tem "Identificador" (o slug; ao lado, "Id: {collectionId}.{slug}" só montado como texto), a situação ("Rascunho" ou "Publicada") e, conforme o tipo, os campos abaixo, com o rótulo pt-BR de cada valor:
  - **Zona:** "Título", "Tipo de zona" (seleção), "Local", "Setas de conexão" (número), "Ações de zona" (caixas de marcar, rótulos §2.5), "Efeitos" (lista; cada item com texto e "Positivo"/"Negativo").
  - **Atributo:** "Nome", "Texto de ambientação", "Raridade", "Tipo" ("Básica", "Sinérgica", "Aprimorada"), "Atributos" (lista de seleções), "Efeitos" (lista de textos).
  - **Equipamento:** "Nome", "Texto de ambientação", "Raridade", "Slot", "Etiquetas" (lista de textos, com sugestão das etiquetas já usadas na coleção, recebidas do backend), "Modificadores" (lista de modificador + valor; o primeiro marcado "principal"), "Pico mínimo" (vazio = sem requisito), "Restrição de classe" (caixas de marcar), "Bloqueia escudo", "Habilidades" (lista de nome + texto), "Efeitos", "Refino" (desligado = não refinável; ligado: "Nível máximo" e a lista "Materiais", REQ-78), "Encantamento" (desligado = não encantável; ligado: a lista "Slots", REQ-78), "Ajuste de preço" (número decimal).
  - **Item:** "Nome", "Texto de ambientação", "Raridade", "Categoria", "Etiquetas", "Efeitos".
  - **Evento aleatório:** "Título", "Texto de ambientação", "Requisitos" (lista de textos), "Coisa boa", "Coisa ruim", "Sem fuga".
  - **Evento de combate:** "Título", "Texto de ambientação", "Inimigos" (lista; cada um com "Nome", "Texto de ambientação", "Quantidade", "Tipos" (caixas de marcar), "Criatura", "Categoria", "Elemento" (vazio = sem elemento), "Vida", os 7 modificadores, "Vigor" (vazio = sem Vigor), "Habilidades", "Comportamento"), "Coisa boa", "Coisa ruim", "Sem fuga".
- **Dado** uma lista do formulário, **então** há "Adicionar" no fim e, em cada item, "Remover", "Subir" e "Descer" (a ordem é enviada como está; em "Modificadores", o primeiro é o principal).
- **Dado** um campo numérico com texto que não é número, ou um campo de texto obrigatório vazio, **então** "Salvar rascunho" fica desabilitado (formato, não regra, como a D-23).
- **Dado** "Salvar rascunho", **quando** clicado, **então** o app cria (carta nova) ou salva (carta existente) com os valores do formulário; com sucesso, o formulário mostra a carta devolvida, a lista é consultada de novo e a área de status mostra "Rascunho salvo." (ou "Carta salva." numa carta publicada, D-39).
- **Dado** `400` `CONTENT_INVALID` ou `409` `CONTENT_ID_TAKEN`, **então** a área de status mostra a `message`, o que foi digitado continua e cada campo de `details.fields` (inclusive dentro de listas, ex.: o valor do 2º modificador) mostra o texto recebido (D-38), ligado ao campo por `aria-describedby`, até o próximo envio.
- **Dado** uma carta publicada, **então** "Identificador" fica somente leitura (Apêndice B, T1).

### REQ-22 — Pré-visualização

- **Dado** o formulário aberto, **então** ao lado aparece a seção "Pré-visualização" com a carta montada dos valores atuais, pelos mesmos componentes do catálogo (REQ-09 a REQ-13), atualizada a cada mudança.
- **Dado** valores que ainda não formam uma carta no formato do contrato (ex.: campo obrigatório vazio), **então** a seção mostra "Preencha os campos obrigatórios para ver a carta." (conferência de formato, D-39).

### REQ-23 — Publicar, duplicar e excluir carta

- **Dado** uma carta em rascunho, salva e sem alterações pendentes, **então** o botão "Publicar" fica habilitado; **quando** clicado, abre um diálogo "Publicar “{nome}”?" com o texto "Depois de publicada, a carta entra no catálogo e nas partidas, e o identificador não pode mais mudar." e os botões "Publicar" e "Cancelar"; confirmado com sucesso, a situação passa a "Publicada" e a área de status mostra "Carta publicada.".
- **Dado** `CONTENT_INVALID` ao publicar, **então** os erros aparecem como no REQ-21 e a carta continua em rascunho.
- **Dado** uma carta salva, **quando** o autor clica "Duplicar", **então** o backend cria um rascunho com outro identificador (escolhido por ele); o formulário abre nesse rascunho e a área de status mostra "Cópia criada.".
- **Dado** uma carta salva, **quando** o autor clica "Excluir carta", **então** abre um diálogo "Excluir “{nome}”?" com "A carta será apagada. Não dá para desfazer." e os botões "Excluir" e "Cancelar"; confirmado com sucesso, o formulário fecha, a lista é consultada de novo e a área de status mostra "Carta excluída."; com `409` `CONTENT_IN_USE`, mostra a `message` e nada é apagado.

### REQ-24 — Alterações não salvas

- **Dado** o formulário (de carta ou de coleção) com alterações não salvas, **quando** o autor escolhe outra carta, outra coleção, "Nova carta", "Voltar ao laboratório" ou outra rota do app, **então** abre um diálogo "Descartar alterações?" com o texto "As alterações desta carta ainda não foram salvas." (ou "desta coleção") e os botões "Descartar" e "Continuar editando" (foco inicial); "Continuar editando" ou Esc fecham sem sair. No formulário de coleção, também perguntam "Nova coleção", "Editar coleção" e "Excluir coleção"; "Cancelar" do formulário fecha sem perguntar (D-41).
- **Dado** alterações não salvas, **quando** o autor fecha ou recarrega a aba, **então** o navegador pede confirmação (aviso padrão do navegador).

### REQ-25 — Validar coleção como dimensão

- **Dado** uma coleção escolhida, **quando** o autor clica "Validar como dimensão", **então** o app pede a validação ao backend (README 3.5; Apêndice B, I5 e K7) e a área de status mostra "Validando…"; com resultado válido, "A coleção forma uma dimensão válida."; com problemas, "A coleção não forma uma dimensão válida." e a lista "Problemas" com cada texto recebido, na ordem recebida. Só cartas publicadas entram na validação (decidido pelo backend).

### REQ-26 — Exportar e importar coleção

- **Dado** uma coleção escolhida, **quando** o autor clica "Exportar", **então** o app pede a exportação ao backend e o navegador baixa o arquivo `{collectionId}.json` com o conteúdo recebido; a área de status mostra "Coleção exportada.".
- **Dado** "Importar coleção", **quando** o autor escolhe um arquivo `.json`, **então** o app envia o conteúdo ao backend sem conferir o formato (o backend valida); com a caixa "Substituir se já existir" desmarcada e a coleção já existente, o backend responde `409` `CONTENT_ID_TAKEN` e a área de status mostra a `message`; com sucesso, a lista é consultada de novo, a coleção importada fica escolhida e a área de status mostra "Coleção importada: {n} cartas." (`n` recebido).
- **Dado** um arquivo que não é JSON, **então** nada é enviado e a área de status mostra "O arquivo não é um JSON válido.".
- **Dado** `CONTENT_INVALID` na importação, **então** a área de status mostra a `message` e a lista "Problemas" com cada campo e texto recebido (D-38); nada é importado.

### Preparação da partida (FEAT-06)

O backend prepara a partida inteira dentro do `POST /parties` (CONTRATO §3 FEAT-06): dimensão, mapa, ordem, cidade inicial, deck pré-pronto embaralhado, mão e valores iniciais (README 10.1, 9.1). O frontend só deixa escolher a classe e mostra o resultado. Nenhum valor da partida é calculado na tela (D-48).

### REQ-27 — Valores da preparação no laboratório

Alinha o REQ-06 aos 11 valores novos (CONTRATO §3 FEAT-03, chaves "FEAT-06"). O comportamento dos campos é o do REQ-06.

- **Dado** o `LabConfig` com as chaves da FEAT-06, **quando** a seção "Configuração" carrega, **então**, depois dos 8 campos do REQ-06 e nesta ordem, aparecem: "Tamanho mínimo da build", "Trava (classe com 1 essencial)", "Trava (classe com 2 essenciais)", "Tentativas do gerador de mapa", "Ataque padrão", "Defesa padrão", "Precisão padrão", "Esquiva padrão", "Celeridade padrão", "Perfuração padrão" e "Reflexão padrão", cada um com "Padrão: … · Mín. … · Máx. …".

### REQ-28 — Carta de Dimensão e forma das setas no catálogo

- **Dado** a seção "Catálogo" (REQ-08), **então** o filtro de tipo ganha a opção "Dimensão", depois de "Evento de combate", com a quantidade de `cardCounts.dimension`.
- **Dado** uma carta `dimension` (README 3.2), **quando** exibida, **então** mostra nome, flavor (se houver), "Ordem de lançamento {releaseOrder}", "Zona de chegada: {arrivalZoneTitle}" (com `null`: "Zona de chegada: sorteada entre as Urbanas sem efeito negativo") e os efeitos.
- **Dado** uma carta `zone` com `arrowLayout` (REQ-12), **então** depois de "Setas de conexão: {n}" aparece "Setas opostas" (`straight`) ou "Setas vizinhas" (`corner`); com `null`, nada.

### REQ-29 — Escolha da classe no novo jogo

Alinha o REQ-15. Classes vêm de `GET /catalog/classes`, já só as publicadas.

- **Dado** a rota `/novo`, **então**, depois de "Nome do personagem", há o grupo de rádios "Classe" com uma opção por classe, na ordem recebida, rotulada "{name}" seguido dos atributos essenciais como termo do jogo (REQ-03); nenhuma vem escolhida. Durante a consulta, a área de status mostra "Carregando classes…"; com a lista vazia, o grupo mostra "Nenhuma classe publicada.".
- **Dado** uma classe escolhida, **então** abaixo do grupo aparecem a lista "Modificadores base" (os 7, na ordem do glossário §2.3, como termo do jogo com o valor recebido) e a lista "Deck pré-pronto", um item "{copies}× {nome da carta}" por entrada de `starterDeck`, na ordem recebida (nome de `GET /catalog/cards/:cardId`).
- **Dado** "Criar grupo", **então** o `POST /parties` leva `playerClass` da classe escolhida; sem escolha, o corpo vai sem `playerClass` (o backend responde `required`).
- **Dado** `400` `PARTY_INVALID` com `playerClass`, **então** o grupo "Classe" mostra, ligado por `aria-describedby`: `required` → "Escolha uma classe."; `unknownClass` → "Esta classe não está mais disponível.".
- **Dado** `409` `DIMENSION_INVALID`, **então** a área de status mostra a `message` e, abaixo dela, a lista "Problemas" com cada texto de `details.problems`, na ordem recebida; o que foi digitado e escolhido continua.
- **Dado** erro na consulta das classes, **então** a área de status mostra a `message` ou "Servidor indisponível. Tente novamente.".

### REQ-30 — Partida preparada na tela do grupo

Alinha o REQ-16: sai o texto "A partida começa na próxima etapa do jogo." e entra o estado da partida. O desenho do mapa e o movimento são da FEAT-07 (D-48).

- **Dado** o `200` do `POST …/session` (REQ-16), **então**, além do título, da situação, de "Salvo em" e de "Encerrar sessão", a tela mostra "Dimensão: {name da Carta de Dimensão}", "Cidade inicial: {title da zona `startingCityZoneId`}" e a lista "Ordem dos jogadores", com o `characterName` de cada id de `turnOrder`, na ordem recebida. A lista "Membros" do REQ-16 continua.
- **Dado** cada membro, **então** há uma seção com o título "{characterName}" e: "Classe: {name}" para cada item de `playerClasses`, seguido de "(trava cumprida)" ou "(trava não cumprida)" conforme `deckLockMet`; "Vida {health}/{maxHealth}"; "Vida base {baseHealth}"; "Pico {peak}"; "Vigor {vigor}"; "Ouro {gold}"; a lista "Modificadores" (os 7 de `modifiers`, na ordem do glossário, como termo do jogo); "Zona atual: {title}"; "Ponto de respawn: {title}"; "Deck de atributos: {attributeDeckCount} cartas"; "Descarte de atributos: {attributeDiscardPileCount} cartas"; e a seção "Mão ({quantidade})" com cada carta de `hand`, na ordem recebida (repetidas aparecem repetidas), pelo componente do REQ-09. Todos os números são os recebidos.
- **Dado** os nomes ainda não recebidos (classes de `GET /catalog/classes`, cartas de `GET /catalog/cards/:cardId`), **então** a área de status mostra "Carregando a partida…"; **dado** erro nessas consultas, mostra a `message` ou "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### REQ-31 — Carta de Dimensão e forma das setas no editor

Alinha o REQ-20 ao REQ-22. Regras comuns do editor (acima) valem.

- **Dado** os filtros e o "Nova carta" do REQ-20 e as contagens do REQ-19, **então** o tipo "Dimensão" aparece depois de "Evento de combate".
- **Dado** o formulário de uma carta `dimension`, **então** tem "Nome", "Texto de ambientação", "Ordem de lançamento" (número), "Zona de chegada" (título de zona; vazio = `null`, sorteada) e "Efeitos" (lista de textos); a pré-visualização usa o componente do REQ-28.
- **Dado** o formulário de zona, **então** depois de "Setas de conexão" há a seleção "Forma das setas" com "Não se aplica" (`null`), "Opostas" (`straight`) e "Vizinhas" (`corner`); o formulário não confere a combinação com o número de setas (o backend confere, D-38).
- **Dado** "Validar como dimensão" (REQ-25), **então** o comportamento não muda: os problemas da Carta de Dimensão chegam prontos na mesma lista.

### REQ-32 — Classes no editor

- **Dado** uma coleção escolhida, **então** há uma seção "Classes" com a lista recebida, cada classe um botão "{name} · {Rascunho|Publicada}"; com a lista vazia, "Nenhuma classe nesta coleção."; durante a consulta, "Carregando classes…"; e o botão "Nova classe".
- **Dado** "Nova classe" ou uma classe da lista, **então** abre o formulário de classe: "Classe" (seleção com os rótulos de §2.4; somente leitura numa classe publicada, Apêndice B T1), "Nome", "Atributos essenciais" (lista de seleções "Atributo essencial {n}"), "Modificadores base" (os 7, número cada) e "Deck pré-pronto" (lista; cada item com "Carta {n}" — id da carta, com sugestão das cartas de atributo da coleção — e "Cópias {n}"). Listas com "Adicionar", "Remover", "Subir" e "Descer" (REQ-21).
- **Dado** texto obrigatório em branco, seleção não feita ou número inválido, **então** "Salvar classe" fica desabilitado (formato, como a D-43).
- **Dado** "Salvar classe", **então** o app cria ou salva a classe; com sucesso, o formulário mostra a classe devolvida, a lista é consultada de novo e a área de status mostra "Classe salva."; `CONTENT_INVALID` e `CONTENT_ID_TAKEN` aparecem por campo como no REQ-21.
- **Dado** uma classe em rascunho, salva e sem alterações, **quando** o autor clica "Publicar classe", **então** abre o diálogo "Publicar “{name}”?" com "Depois de publicada, a classe pode ser escolhida em novos jogos e o identificador não pode mais mudar." e "Publicar"/"Cancelar"; com sucesso, "Classe publicada."; com `CONTENT_INVALID`, os erros aparecem como no REQ-21 e a classe continua em rascunho.
- **Dado** uma classe salva, **quando** o autor clica "Excluir classe", **então** abre o diálogo "Excluir “{name}”?" com "A classe será apagada. Não dá para desfazer." e "Excluir"/"Cancelar"; com sucesso, o formulário fecha e a área de status mostra "Classe excluída."; com `CONTENT_IN_USE`, a `message` e nada é apagado.
- **Dado** o formulário de classe com alterações não salvas, **então** vale o REQ-24 (texto "As alterações desta classe ainda não foram salvas."), também ao escolher outra classe ou "Nova classe".
- **Dado** excluir ou renomear uma carta de atributo do deck pré-pronto de uma classe (REQ-21, REQ-23), **então** o `409` `CONTENT_REFERENCED` mostra a `message` na área de status do formulário de carta e nada muda.

### REQ-33 — Exportar e importar com classes

Alinha o REQ-26.

- **Dado** "Exportar", **então** o arquivo traz também as `classes` recebidas (o schema não as descarta, D-40).
- **Dado** uma importação com sucesso, **então** a área de status mostra "Coleção importada: {cardCount} cartas e {classCount} classes.".

### Mapa e Movimentar (FEAT-07)

O mapa chega pronto em `Party.dimension.map` (zonas com posição e setas, travessias) e os destinos válidos do Movimentar em `PlayerState.moveTargets` (CONTRATO §3 FEAT-07). O frontend desenha o que recebe e envia a intenção; não calcula travessias nem destinos (D-55). A partir da FEAT-08, mover gasta 1 ponto de ação e o botão depende de `availableActions` (REQ-37); quem age é o host (jogo solo).

### REQ-34 — Mapa da partida

Alinha o REQ-30 (fim do item (1) da D-48).

- **Dado** a partida preparada (REQ-30), **então**, depois de "Cidade inicial", há a região "Mapa" com uma grade em que cada zona de `dimension.map.zones` ocupa a posição (`x`, `y`) recebida: `x` cresce para a direita (leste) e `y` para baixo (sul); a menor `x` fica na primeira coluna e a menor `y` na primeira linha; posições sem zona ficam vazias.
- **Dado** cada zona do mapa, **então** ela é um botão com `aria-pressed`, que mostra "{title}", as setas de `arrows` como "↑" (`north`), "→" (`east`), "↓" (`south`) e "←" (`west`), com o texto alternativo "Setas: {direções}" ("norte", "leste", "sul", "oeste", na ordem recebida), e, para cada membro cuja `zoneId` é essa zona, "{characterName} está aqui".
- **Dado** um `crossing` entre duas zonas, **então** o espaço entre elas na grade mostra uma ligação ("—" na horizontal, "|" na vertical), decorativa (`aria-hidden`); zonas vizinhas sem `crossing` não têm ligação.
- **Dado** a tela recém-aberta, **então** nenhuma zona vem escolhida. **Quando** o jogador clica numa zona, **então** ela fica marcada e, abaixo do mapa, a seção "Zona escolhida" mostra a carta completa da zona (REQ-12; todas viradas para cima, README 3.6) e "Travessias com: {títulos}", com as outras zonas dos `crossings` dessa zona, na ordem recebida ("Travessias com: nenhuma" se não houver). Clicar na zona marcada não desmarca; clicar em outra troca a escolha.
- **Dado** os títulos das zonas ainda não recebidos (`GET /catalog/cards/:cardId`), **então** vale o REQ-30: "Carregando a partida…" na área de status e "…" no lugar do título.

### REQ-35 — Movimentar

- **Dado** uma zona escolhida (REQ-34) que está em `moveTargets` do host, **então** a seção "Zona escolhida" mostra o botão "Movimentar para {title}"; numa zona fora de `moveTargets` (inclusive a zona atual), não há botão.
- **Quando** o jogador clica "Movimentar para {title}", **então** o app envia `POST /parties/:partyId/actions` com `{ "type": "move", "zoneId": <zona escolhida> }`; enquanto o pedido está em curso, o botão fica desabilitado.
- **Dado** o `200`, **então** a tela passa a mostrar o `Party` devolvido (zona atual, "Salvo em", "{characterName} está aqui" no mapa e os botões seguintes vêm dele), a zona escolhida continua escolhida e a área de status mostra "Você está em {title}.".
- **Dado** um erro §1.4 (`ACTION_NOT_ALLOWED`, `ACTION_INVALID`, `PARTY_SESSION_NOT_ACTIVE`, `PARTY_NOT_FOUND` ou outro), **então** a área de status mostra a `message` e nada muda na tela; falha de rede ou de validação mostra "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.
- **Dado** o jogador muda de zona mais de uma vez (README 12.2), **então** cada movimento segue as regras acima, sem limite na tela.

### A vez (FEAT-08)

A vez chega pronta em `Party.turn` (rodada, membro da vez, pontos restantes) e o que o jogador pode fazer em `PlayerState.availableActions` (CONTRATO §3 FEAT-08). O frontend mostra e envia a intenção; não conta pontos nem decide se uma ação cabe (D-56).

### REQ-36 — A vez na tela do grupo

Alinha o REQ-30.

- **Dado** a partida preparada (REQ-30), **então**, antes do "Mapa", há a região "A vez" com "Rodada {round}", "Vez de {characterName do membro `turn.memberId`}" e "{actionPoints} pontos de ação" ("pontos de ação" como termo do jogo, REQ-03; "1 ponto de ação" no singular). Todos os valores são os recebidos.
- **Dado** um `200` de qualquer ação (REQ-35, REQ-38), **então** a região mostra o `turn` do `Party` devolvido.

### REQ-37 — Ações disponíveis

Alinha o REQ-35.

- **Dado** uma zona escolhida que está em `moveTargets` do host, **então** o botão "Movimentar para {title}" só aparece se `availableActions` do host contém `move`; sem `move` (ex.: 0 pontos de ação), não há botão e a seção "Zona escolhida" mostra "Sem pontos de ação para Movimentar." só quando a zona está em `moveTargets` e `turn.actionPoints` é 0.
- **Dado** `availableActions` do host contém `endTurn`, **então** a região "A vez" mostra o botão "Encerrar a vez"; sem `endTurn`, não há botão.
- **Dado** um `409` `ACTION_NOT_ALLOWED` (`noActionPoints` ou outro motivo), **então** vale o REQ-35: a `message` na área de status e nada muda.

### REQ-38 — Encerrar a vez

- **Quando** o jogador clica "Encerrar a vez", **então** o app envia `POST /parties/:partyId/actions` com `{ "type": "endTurn" }`, sem diálogo de confirmação (D-56); enquanto o pedido está em curso, os botões "Encerrar a vez" e "Movimentar para {title}" ficam desabilitados.
- **Dado** o `200`, **então** a tela passa a mostrar o `Party` devolvido (REQ-35, item 3), a zona escolhida continua escolhida e a área de status mostra "Rodada {round}: vez de {characterName}.".
- **Dado** um erro §1.4 ou falha de rede/validação, **então** vale o REQ-35 (mesmas mensagens; nada muda na tela).

### Deck de atributos (FEAT-09)

A build, a pasta de TCG e as ações disponíveis chegam prontas em `PlayerState` (`build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity`, `availableActions`) e os motivos de recusa em `ACTION_NOT_ALLOWED` (CONTRATO §3 FEAT-09). O frontend mostra e envia a intenção; não confere mínimo, cópias, trava nem espaço na pasta, e não calcula vida, Vigor nem compras (D-57).

### REQ-39 — Valores do deck no laboratório

Alinha o REQ-06 aos 5 valores novos (CONTRATO §3 FEAT-03, chaves "FEAT-09"). O comportamento dos campos é o do REQ-06.

- **Dado** o `LabConfig` com as chaves da FEAT-09, **quando** a seção "Configuração" carrega, **então**, depois dos campos do REQ-27 e nesta ordem, aparecem: "Cópias máximas por carta no deck", "Capacidade da pasta de TCG", "Recuperar: % da vida máxima", "Recuperar: % do Pico em Vigor" e "Recuperar: comprar até (cartas na mão)", cada um com "Padrão: … · Mín. … · Máx. …".

### REQ-40 — Build e pasta de TCG na tela do grupo

Alinha o REQ-30.

- **Dado** a seção de cada membro (REQ-30), **então**, antes de "Mão ({quantidade})", há a lista "Build ({buildSize} cartas)", um item "{copies}× {nome da carta}" por entrada de `build`, na ordem recebida, e a lista "Pasta de TCG (capacidade {tcgFolderCapacity})", um item "{copies}× {nome da carta}" por entrada de `tcgFolder`, na ordem recebida; com `tcgFolder` vazio, "Pasta vazia.". Os nomes vêm de `GET /catalog/cards/:cardId` e valem as regras de carregamento e erro do REQ-30.

### REQ-41 — Recuperar

- **Dado** `availableActions` do host contém `recover`, **então** a região "A vez" mostra, antes de "Encerrar a vez", o grupo "Recuperar" com três botões, nesta ordem: "Comprar cartas" (`drawToHand`), "Mão no deck" (`shuffleHand`) e "Descarte no deck" (`shuffleDiscard`); sem `recover`, não há o grupo.
- **Quando** o jogador clica um dos três, **então** o app envia `POST /parties/:partyId/actions` com `{ "type": "recover", "option": <opção do botão> }`, sem confirmação (D-57); enquanto o pedido está em curso, todos os botões de ação (Recuperar, "Ajustar deck", "Encerrar a vez", "Movimentar para {title}") ficam desabilitados.
- **Dado** o `200`, **então** a tela passa a mostrar o `Party` devolvido (REQ-35, item 3) e a área de status mostra "Recuperou: vida {health}/{maxHealth}, Vigor {vigor}." com os valores do host devolvidos.
- **Dado** um erro §1.4 ou falha de rede/validação, **então** vale o REQ-35 (mesmas mensagens; nada muda na tela).

### REQ-42 — Ajustar deck

- **Dado** `availableActions` do host contém `adjustDeck`, **então** a região "A vez" mostra o botão "Ajustar deck", depois do grupo "Recuperar"; sem `adjustDeck`, não há botão.
- **Quando** o jogador clica "Ajustar deck", **então** abre, abaixo da região "A vez", a seção "Ajustar deck" com uma linha por carta presente em `build` ou em `tcgFolder` (sem repetir, em ordem de `cardId`): o nome da carta, "Na build: {copies}" e "Na pasta: {copies}" (0 quando não está ali), e o campo numérico "Cópias na build de {nome}", começando com as cópias da build. A seção tem "Salvar build" e "Cancelar"; enquanto ela está aberta, o botão "Ajustar deck" fica desabilitado. "Cancelar" fecha a seção sem enviar nada.
- **Dado** um campo vazio ou que não é inteiro a partir de 0, **quando** o jogador clica "Salvar build", **então** nada é enviado e o campo mostra, ligado por `aria-describedby`, "Use um número inteiro a partir de 0.".
- **Quando** o jogador clica "Salvar build" com os campos válidos, **então** o app envia `{ "type": "adjustDeck", "build": [...] }` com um item `{ "cardId", "copies" }` por linha com cópias ≥ 1, em ordem de `cardId` (linhas com 0 não vão); sem confirmação; enquanto o pedido está em curso, "Salvar build", "Cancelar" e os botões de ação ficam desabilitados.
- **Dado** o `200`, **então** a seção fecha, a tela passa a mostrar o `Party` devolvido (REQ-35, item 3) e a área de status mostra "Build salva: {buildSize} cartas.".
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** a seção continua aberta com o que foi digitado e mostra, abaixo dos campos, a `message` seguida do texto do motivo: `buildBelowMinimum` → "A build ficou abaixo do mínimo de cartas."; `notOwned` → "Você não tem cópias suficientes de {nome de `details.cardId`}."; `copyLimitExceeded` → "{nome de `details.cardId`} passou do limite de cópias no deck."; `tcgFolderFull` → "Não há espaço na pasta de TCG para as cartas que saíram da build."; outro motivo (ex.: `noActionPoints`) → só a `message`.
- **Dado** outro erro §1.4 ou falha de rede/validação, **então** a seção continua aberta com o que foi digitado e mostra a `message` ou "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### Inventário, equipar e bolsa (FEAT-10)

Inventário, equipamentos em uso, bolsa, modificadores efetivos e ações disponíveis chegam prontos em `PlayerState` (`inventory`, `inventoryCapacity`, `equipment`, `purseCapacity`, `effectiveModifiers`, `availableActions`) e os motivos de recusa em `ACTION_NOT_ALLOWED` (CONTRATO §3 FEAT-10). O frontend mostra e envia a intenção; não confere Pico, classe, escudo nem espaço, e não calcula modificadores (D-58).

### REQ-43 — Valores do inventário no laboratório

Alinha o REQ-06 aos 2 valores novos (CONTRATO §3 FEAT-03, chaves "FEAT-10"). O comportamento dos campos é o do REQ-06.

- **Dado** o `LabConfig` com as chaves da FEAT-10, **quando** a seção "Configuração" carrega, **então**, depois dos campos do REQ-39 e nesta ordem, aparecem "Capacidade do inventário" e "Capacidade da bolsa", cada um com "Padrão: … · Mín. … · Máx. …".

### REQ-44 — Inventário, equipamentos e bolsa na tela do grupo

Alinha o REQ-30 e o REQ-40.

- **Dado** a seção de cada membro (REQ-30), **então** "Ouro {gold}" passa a ser "Ouro {gold} (bolsa para {purseCapacity})".
- **Dado** a seção de cada membro, **então** a lista "Modificadores" mostra os 7 de `effectiveModifiers` (na ordem do glossário, como termo do jogo) e, logo depois, a lista "Modificadores da classe" mostra os 7 de `modifiers`, no mesmo formato. Todos os números são os recebidos.
- **Dado** a seção de cada membro, **então**, antes de "Build" (REQ-40), há a lista "Equipamentos" com as 8 categorias, na ordem do glossário (§2.7, rótulos de `categories.ts`): "{rótulo}: {nome da carta}" ou "{rótulo}: vazio"; e a lista "Inventário ({inventory.length} de {inventoryCapacity} slots)", um item "{quantity}× {nome da carta}" por slot, na ordem recebida; com `inventory` vazio, "Inventário vazio.". Os nomes vêm de `GET /catalog/cards/:cardId` e valem as regras de carregamento e erro do REQ-30.

### REQ-45 — Preparar (equipar e guardar)

- **Dado** `availableActions` do host contém `prepare`, **então** cada slot do inventário do host cuja carta é do tipo `equipment` (tipo da carta do catálogo, dado de exibição) tem o botão "Equipar {nome}", e cada categoria ocupada em "Equipamentos" do host tem o botão "Guardar {nome}"; sem `prepare`, não há esses botões. Outros membros nunca têm os botões.
- **Quando** o jogador clica "Equipar {nome}", **então** o app envia `{ "type": "prepare", "operation": "equip", "cardId" }`; **quando** clica "Guardar {nome}", envia `{ "type": "prepare", "operation": "unequip", "slot" }`; sem confirmação (D-58). Enquanto o pedido está em curso, todos os botões de ação (os deste REQ e os dos REQ-35, REQ-38, REQ-41, REQ-42) ficam desabilitados. Os pontos de ação não desabilitam nada aqui: a ação é gratuita e a presença de `prepare` vem do backend.
- **Dado** o `200`, **então** a tela passa a mostrar o `Party` devolvido (REQ-35, item 3) e a área de status mostra "Equipou {nome}." ou "Guardou {nome}.".
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** nada muda e a área de status mostra a `message` seguida do texto do motivo: `peakRequirementNotMet` → "Seu Pico não alcança o requisito de {nome}."; `classRestricted` → "Nenhuma das suas classes pode usar {nome}."; `shieldBlocked` → "A arma em uso não deixa usar escudo."; `inventoryFull` → "Não há espaço no inventário para o que sairia do equipamento."; outro motivo → só a `message`. ({nome} = a carta do pedido.)
- **Dado** outro erro §1.4 ou falha de rede/validação, **então** vale o REQ-35 (mesmas mensagens; nada muda na tela).

### REQ-46 — Doação do laboratório

Só no laboratório (dev, D-07); não é ação do jogo.

- **Dado** `/lab`, **então** há a seção "Doação" com: o grupo de rádios "Grupo" (um por item de `GET /parties`, "{name} ({characterNames separados por vírgula})", nenhum escolhido); depois de escolher, o grupo de rádios "Membro" (um por membro do `Party` de `GET /parties/:partyId`, o primeiro já escolhido); o grupo de rádios "O que doar" ("Carta" ou "Ouro", "Carta" escolhido); com "Carta", a seleção "Coleção" (itens de `GET /catalog/collections`, a primeira já escolhida), a seleção "Carta" (as cartas de equipamento, item e atributo da coleção, de `GET /catalog/collections/:collectionId/cards`, na ordem recebida, cada uma "{nome} · {tipo}", com a opção vazia "Escolha…") e o campo "Quantidade" (número, começa em 1); "Doar" fica desabilitado sem carta escolhida; enquanto a lista não chega, a seleção mostra "Carregando cartas…", e erro nela vai para a área de status da seção; com "Ouro", o campo "Quantidade de ouro" (número); e o botão "Doar". Sem grupos, "Nenhum jogo salvo.".
- **Quando** o jogador clica "Doar", **então** o app envia `POST /lab/parties/:partyId/members/:memberId/grants` com `{ "type": "card", "cardId", "quantity" }` ou `{ "type": "gold", "amount" }`, com os números como digitados (o backend valida, inclusive não inteiros); enquanto o pedido está em curso, "Doar" fica desabilitado; campo numérico vazio desabilita "Doar" (não há número para enviar, como a D-23).
- **Dado** o `200`, **então** a área de status da seção mostra "Doação feita. {characterName}: ouro {gold}, {inventory.length} slots no inventário, {tcgFolder.length} cartas diferentes na pasta." com os valores do membro devolvidos; uma tela do grupo aberta depois mostra o estado novo.
- **Dado** `400` `LAB_GRANT_INVALID`, **então** a área de status mostra a `message` e, por campo: `notGrantable` → "Essa carta não pode ser doada (só equipamento, item ou atributo)."; `notPositiveInteger` → "Use um número inteiro a partir de 1."; outro motivo → só a `message`. **Dado** `409` `LAB_GRANT_NO_SPACE`, mostra a `message` e "Inventário cheio." ou "Pasta de TCG cheia." pelo `reason`. **Dado** outro erro §1.4 (`CARD_NOT_FOUND`, `MEMBER_NOT_FOUND`, `PARTY_NOT_FOUND`) ou falha de rede/validação, mostra a `message` ou "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### Cofre, limbo, deck de recompensas e Vasculhar (FEAT-32)

Cofre, capacidades, cartas que se pode pedir no Vasculhar, resultado do último Vasculhar e ações disponíveis chegam prontos em `PlayerState` (`vault`, `vaultCapacity`, `vaultDeckSlots`, `vaultGoldCapacity`, `scavengeTargets`, `lastScavenge`, `availableActions`) e os motivos de recusa em `ACTION_NOT_ALLOWED` (com `operationIndex` no Usar cofre) (CONTRATO §3 FEAT-32). O frontend mostra e envia a intenção; não simula o lote, não confere quantidades, capacidades, ferramentas nem tipos de zona, e o limbo não aparece (README 6.5) (D-59).

### REQ-47 — Valores do cofre no laboratório

Alinha o REQ-06 aos 3 valores novos (CONTRATO §3 FEAT-03, chaves "FEAT-32"). O comportamento dos campos é o do REQ-06.

- **Dado** o `LabConfig` com as chaves da FEAT-32, **quando** a seção "Configuração" carrega, **então**, depois dos campos do REQ-43 e nesta ordem, aparecem "Capacidade do cofre", "Slots de decks do cofre (a build em uso ocupa um)" e "Capacidade de ouro do cofre", cada um com "Padrão: … · Mín. … · Máx. …".

### REQ-48 — Ferramentas e decks de recompensas no catálogo

Alinha os REQ-10, REQ-11 e REQ-28.

- **Dado** uma carta `item` com `toolKind` (REQ-11), **então** depois dos efeitos aparecem "Ferramenta: {toolKind}" e "Vasculha em: {rótulos dos tipos de `scavengeZoneTypes`, na ordem recebida, separados por vírgula}"; com `toolKind` `null`, nada.
- **Dado** uma carta `item` ou `equipment` com `scavengeTool` (REQ-10, REQ-11), **então** aparece "Coletada com: {scavengeTool}"; com `null`, nada.
- **Dado** uma carta `dimension` com `rewardDecks` não vazio (REQ-28), **então** depois dos efeitos há a lista "Decks de recompensas", um item por entrada, na ordem recebida: "{rótulo do tipo de zona}" seguido da lista "{copies}× {nome da carta}" por carta, na ordem recebida (nomes de `GET /catalog/cards/:cardId`; até chegarem, "…"; erro → o id da carta no lugar do nome). Com `rewardDecks` vazio, nada.

### REQ-49 — Ferramentas e decks de recompensas no editor

Alinha os REQ-21 e REQ-31. Regras comuns do editor valem; o formulário não confere combinações (o backend confere, D-38).

- **Dado** o formulário de item, **então** depois de "Efeitos" há "Tipo de ferramenta" (texto; vazio = `null`), "Vasculha em" (caixas de marcar dos 16 tipos de zona, rótulos §2.7) e "Coletada com" (texto; vazio = `null`).
- **Dado** o formulário de equipamento, **então** depois de "Ajuste de preço" há "Coletada com" (texto; vazio = `null`).
- **Dado** o formulário de Carta de Dimensão, **então** depois de "Efeitos" há a lista "Decks de recompensas" (regras de lista do REQ-21); cada item tem "Tipo de zona" (seleção) e a lista "Cartas", cada uma com "Carta" (id, texto) e "Cópias" (número). Os erros chegam pelo caminho (`rewardDecks.0.cards.1.copies`, `scavengeZoneTypes`, `toolKind`…).
- **Dado** a pré-visualização (REQ-22), **então** usa o componente com os campos do REQ-48.

### REQ-50 — Cofre na tela do grupo

Alinha o REQ-44.

- **Dado** a seção de cada membro, **então**, depois de "Inventário" (REQ-44), há: a lista "Cofre ({vault.slots.length} de {vaultCapacity} slots)", um item "{quantity}× {nome da carta}" por slot, na ordem recebida, ou "Cofre vazio."; "Ouro no cofre {vault.gold} (capacidade {vaultGoldCapacity})"; e a lista "Decks guardados (até {vaultDeckSlots} slots de deck, contando a build em uso)", um item "Deck {n}" por deck (n a partir de 1, na ordem recebida) com a lista "{copies}× {nome da carta}", ou "Nenhum deck guardado.". Nomes e carregamento como no REQ-30.

### REQ-51 — Vasculhar

- **Dado** `availableActions` do host contém `scavenge`, **então** a região "A vez" mostra, depois de "Ajustar deck", o grupo "Vasculhar" com um botão "Vasculhar {nome}" por carta de `scavengeTargets`, na ordem recebida; sem `scavenge`, não há o grupo.
- **Quando** o jogador clica "Vasculhar {nome}", **então** o app envia `{ "type": "scavenge", "cardId" }`, sem confirmação (D-59); enquanto o pedido está em curso, todos os botões de ação ficam desabilitados.
- **Dado** o `200`, **então** a tela passa a mostrar o `Party` devolvido (REQ-35, item 3) e a área de status mostra, pelo `lastScavenge` do host devolvido: `found: true` → "Você achou {nome}."; `found: false` → "{nome} não estava no deck de recompensas." ({nome} = carta de `lastScavenge.cardId`).
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** nada muda e a área de status mostra a `message` seguida de: `inventoryFull` → "Não há espaço no inventário."; outro motivo → só a `message`. **Dado** outro erro §1.4 ou falha de rede/validação, vale o REQ-35.

### REQ-52 — Usar cofre

- **Dado** `availableActions` do host contém `useVault`, **então** a região "A vez" mostra o botão "Usar cofre", depois do grupo "Vasculhar"; sem `useVault`, não há botão.
- **Quando** o jogador clica "Usar cofre", **então** abre, abaixo da região "A vez", a seção "Usar cofre" (com ela aberta, "Usar cofre" fica desabilitado) com a lista "Operações" (começa vazia: "Nenhuma operação.") e os formulários abaixo, que **só acrescentam** à lista (nada é enviado). As escolhas mostram o estado recebido, sem descontar as operações já na lista (D-59):
  - "Guardar no cofre": seleção "Carta" (cartas do `inventory` e da `tcgFolder`, sem repetir, em ordem de `cardId`, "{nome}"), "Quantidade" (começa em 1) e "Acrescentar" → `{ operation: "store", cardId, quantity }`, descrita "Guardar {quantity}× {nome}".
  - "Retirar do cofre": seleção "Carta" (`vault.slots`), "Quantidade" e "Acrescentar" → `take`, "Retirar {quantity}× {nome}".
  - "Descartar do cofre": seleção "Carta" (`vault.slots`), "Quantidade", o aviso "A carta descartada vai para o limbo e não volta." e "Acrescentar" → `discard`, "Descartar {quantity}× {nome}".
  - "Ouro": campo "Quantidade de ouro", "Guardar ouro" → `storeGold` ("Guardar {amount} de ouro") e "Retirar ouro" → `takeGold` ("Retirar {amount} de ouro").
  - "Guardar deck": um campo "Cópias de {nome}" (começa em 0) por slot de `vault.slots` cuja carta do catálogo é `attribute` (tipo, dado de exibição) e "Acrescentar" → `saveDeck` com as linhas ≥ 1, em ordem de `cardId`, "Guardar deck de {total} cartas" (soma das cópias digitadas, descrição apenas).
  - Por deck guardado: "Desmontar deck {n}" → `unpackDeck` (`deckIndex` n − 1), "Desmontar deck {n}"; e "Usar deck {n} como build" → `swapBuild`, "Usar deck {n} como build".
  - "Editar build": uma linha por carta da `build` ou de slot de atributo de `vault.slots` (sem repetir, em ordem de `cardId`) com "Na build: {copies}", "No cofre: {quantity}" e o campo "Cópias na build de {nome}" (começa nas cópias da build); "Acrescentar" → `editBuild` com as linhas ≥ 1, "Editar a build ({total} cartas)".
- **Dado** um campo numérico vazio ou fora do formato (inteiro ≥ 1 em quantidades e ouro; inteiro ≥ 0 nos campos de cópias), **quando** "Acrescentar" (ou "Guardar ouro"/"Retirar ouro") é clicado, **então** nada é acrescentado e o campo mostra, ligado por `aria-describedby`, "Use um número inteiro a partir de 1." ou "Use um número inteiro a partir de 0.". Seleção sem carta escolhida desabilita "Acrescentar".
- **Dado** a lista "Operações", **então** cada item mostra "{posição}. {descrição}" com "Remover", "Subir" e "Descer"; abaixo, "Confirmar (1 ponto de ação)" (desabilitado com a lista vazia) e "Cancelar" (fecha a seção sem enviar). O frontend não limita o tamanho da lista (o backend responde `invalidLength`).
- **Quando** o jogador clica "Confirmar (1 ponto de ação)", **então** o app envia `{ "type": "useVault", "operations": [...] }` na ordem da lista, sem outra confirmação; enquanto o pedido está em curso, os botões da seção e os de ação ficam desabilitados.
- **Dado** o `200`, **então** a seção fecha, a tela passa a mostrar o `Party` devolvido (REQ-35, item 3) e a área de status mostra "Cofre: {n} operações feitas." ("1 operação feita" no singular).
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** a seção continua aberta com a lista, o item de posição `operationIndex + 1` fica marcado "Recusada" e, abaixo da lista, aparece a `message` seguida do texto do motivo ({nome} = carta de `details.cardId`; sem `cardId`, a da operação recusada): `notInInventory` → "{nome} não está no inventário nessa quantidade."; `notInTcgFolder` → "Não há essas cópias de {nome} na pasta de TCG."; `notStorable` → "{nome} não pode ir para o cofre."; `notInVault` → "Não há essa quantidade de {nome} no cofre."; `vaultFull` → "O cofre está cheio."; `notEnoughGold` → "Não há ouro suficiente na bolsa."; `vaultGoldFull` → "O ouro passaria da capacidade do cofre."; `notEnoughVaultGold` → "Não há ouro suficiente no cofre."; `purseFull` → "O ouro passaria da capacidade da bolsa."; `notAttribute` → "{nome} não é carta de atributo."; `deckSlotsFull` → "Não há slot de deck livre."; `deckNotFound` → "Esse deck guardado não existe."; `inventoryFull` → "Não há espaço no inventário."; `tcgFolderFull`, `buildBelowMinimum`, `notOwned`, `copyLimitExceeded` → os textos do REQ-42; outro motivo (ex.: `noActionPoints`, `zoneActionUnavailable`) → só a `message`.
- **Dado** outro erro §1.4 ou falha de rede/validação, **então** a seção continua aberta com a lista e mostra a `message` ou "Servidor indisponível. Tente novamente.". Nenhuma exceção chega à tela.

### REQ-53 — Efeitos estruturados nas cartas (FEAT-11)
- **Dado** um efeito do CONTRATO v0.52, **quando** recebido no catálogo/editor, **então** as quatro partes são validadas por formato e preservadas, incluindo variantes ainda não executadas pelo backend. Campos obrigatórios ausentes, `kind` desconhecido e parâmetros de tipo errado são dados inválidos (D-14).
- **Dada** uma carta, **então** mostra o `text` recebido e, quando presente, "Buff"/"Debuff"; zona e dimensão mostram "Positivo"/"Negativo". Não interpreta as partes para gerar texto ou calcular valores. Listas vazias não aparecem.

### REQ-54 — Status e ativação em Preparar (FEAT-11)
- **Dado** o estado de um membro, **então** a seção "Status" mostra, em ordem, a marca "Buff"/"Debuff", o `text` copiado no status, a carta de origem (id como fallback) e "Restantes: {remaining}" quando não nulo. Lista vazia: "Nenhum status ativo.". Modificadores continuam mostrando `effectiveModifiers` recebido.
- **Dado** o host com `prepare` em `availableActions`, **então** a seção "Ativar efeitos" lista somente `activatableEffects`, na ordem recebida, com origem "Inventário"/"Equipamento", nome da carta, texto do efeito e botão "Ativar {nome} — efeito {n}" (n = índice + 1). Funciona também com 0 pontos. Sem carta carregada, não permite enviar. Não deduz disponibilidade de `cost`, Pico ou Vigor.
- **Dado** `handPayment: null`, **quando** ativar, **então** envia `{ type: 'prepare', operation: 'activate', cardId, effectIndex }`, sem `payment`.
- **Dado** `handPayment` não nulo, **então** mostra sua instrução `text` e uma caixa por cópia da mão (nome e número da cópia). Só permite confirmar após selecionar `count` cópias; envia os ids em `payment.handCards`, repetidos quando necessário. Não filtra por atributo nem valida regra de pagamento.
- **Durante** um pedido, **então** todos os controles de ação ficam desabilitados. Sucesso substitui o estado inteiro pelo `Party` devolvido, limpa a escolha de pagamento e mostra "Efeito ativado.". Recusa mostra a `message` do backend e preserva o último estado e a escolha; falha de rede/validação mostra "Servidor indisponível. Tente novamente.". Nenhum status expira por relógio local.

### REQ-55 — Editor de efeitos estruturados (FEAT-11)
- **Dada** uma carta de zona, dimensão, atributo, equipamento ou item, **então** "Efeitos" permite adicionar, remover e reordenar efeitos. Cada efeito tem "Texto do efeito {n}", "Gatilho do efeito {n} (JSON)", "Custo do efeito {n} (JSON)", "Ativação do efeito {n} (JSON)", "Duração do efeito {n} (JSON)" e "Marcação do efeito {n}" (Sem marca/Buff/Debuff) ou "Polaridade do efeito {n}" (Positivo/Negativo).
- **Dado** um efeito carregado, **quando** editar e salvar, **então** preserva todos os parâmetros estruturados, ordem e valores nulos. Novo efeito começa com texto vazio, gatilho `null`, custo `[]`, ativação `[]`, duração `{"kind":"immediate"}`, sem marca (polaridade positiva em zona/dimensão).
- **Dado** JSON inválido ou formato incompatível com o contrato, **então** informa "Formato de efeito inválido." e impede salvar/pré-visualizar esse conteúdo. Não valida regras entre campos: consumível sem `consumeSelf`, por exemplo, é enviado ao backend, que devolve `CONTENT_INVALID` com mensagem junto ao campo indicado, inclusive caminhos de parâmetros aninhados.
- **Dada** a pré-visualização, **então** usa a mesma apresentação do REQ-53. Habilidades, requisitos e desfechos continuam como texto simples.

### Eventos aleatórios (FEAT-12)

Base: CONTRATO v0.57, seção FEAT-12, e README §§3.4, 6.5–6.6, 11.3 e 14–15.

### REQ-56 — Conteúdo e configuração
- **Dada** uma carta aleatória, **quando** aberta no catálogo ou editor, **então** a forma legada continua legível e a forma executável apresenta os textos e preserva requisitos, passos ordenados, limiar e Sem fuga. Erros `CONTENT_INVALID` aparecem junto aos campos identificados.
- **Dada** uma Carta de Dimensão editável, **quando** configurados decks de eventos, **então** o editor preserva tipo de zona, referências e cópias; o backend valida a publicação. No laboratório, a configuração expõe `escapeVigorPercent` e as entradas ponderadas do `reserveDeck`.

### REQ-57 — Início e encontro
- **Dado** `startEvent` disponível, **quando** acionado, **então** apresenta antecipação com a carta oculta e os controles autorizados. Revelar apresenta a carta, seus requisitos e benefícios ou penalidades. Após recarregar, a tela usa a escolha devolvida pelo GET.
- **Dada** uma ativação autorizada antes de pagar, **quando** confirmada, **então** usa `prepare/activate` da FEAT-11, inclusive com 0 PA. Após a primeira parte aceita, a tela usa as novas ações disponíveis e oculta os controles de ativação e fuga.

### REQ-58 — Pagamento, desistência e fuga
- **Dado** um requisito pagável com `handCardSelection: 'choose'`, **quando** confirmado, **então** envia os IDs das cópias elegíveis escolhidas. Atributo e descarte enviam uma cópia por parte; manipulação integral envia todas as cópias exigidas juntas. Com `'random'`, envia a ação sem `payment`; com `null`, apresenta somente as demais escolhas de pagamento aplicáveis.
- **Dada** uma recusa `eventMinimumNotMet`, **então** mostra os mínimos que falharam e mantém o estado confirmado, os recibos anteriores e a seleção ainda válida. Para evento somente de verificações, usa `resolveEvent` quando disponível.
- **Dado** um encontro com desistência ou fuga disponíveis, **quando** o jogador confirmar, **então** envia a ação correspondente e mostra o resultado recebido. A fuga apresenta custo, limiar e resultado do teste quando aplicável. O encerramento apresenta o desfecho, a reposição efetiva e a penalidade de PA ou dívida devolvidas pelo backend.

### REQ-59 — Recompensas pendentes e Vasculhar
- **Dada** uma recompensa pendente, **então** a tela mostra a cópia, as opções elegíveis de descarte e as ações de manter ou deixar. **Quando** um lote for recusado, **então** mostra a mensagem e preserva a escolha. **Quando** aceito, usa o próximo estado e apresenta a disposição recebida.
- **Dado** o retorno do Vasculhar, **então** apresenta o estado `inventory`, `pending`, `left` ou `none` conforme `lastScavenge.delivery`. Uma pendência do Vasculhar usa o mesmo controle de recompensa.
- **Dada** uma escolha com prazo retornado pelo backend, **então** a tela apresenta o prazo aplicável e usa a transição autoritativa após expirar. No solo, com prazo `null`, a escolha permanece aberta até uma ação do jogador.

Formato:

### Combate solo (FEAT-13)

Base: CONTRATO v0.64, seção FEAT-13, incluindo Escolha de efeitos disparados.

### REQ-60 — Catálogo, editor e laboratório

- **Dado** conteúdo legado ou executável, **quando** consultar ou editar uma carta, **então** o frontend mantém as variantes e campos do contrato. Conteúdo inválido recebe o erro da API no campo correspondente.
- **Dada** a configuração de combate, **quando** consultar ou alterar valores, **então** o laboratório usa os valores, limites, padrões e erros da API.

### REQ-61 — Combate solo

- **Dada** a revelação de combate, **quando** receber o estado e o lote do POST, **então** a tela mostra participantes, ordem, turno, ações projetadas e transições na ordem recebida.
- **Dada** uma ação elegível, **quando** enviá-la, **então** o cliente usa IDs, alvos e pagamento projetados. Isso inclui habilidade em Preparar com 0 PA quando elegível.
- **Dado** um reload ou desfecho, **quando** receber o snapshot, **então** a tela preserva o estado e oferece a recompensa pendente mesmo após vitória com queda por Reflexão, conforme as opções da API.

### REQ-62 — Escolha de efeitos disparados

- **Dada** uma passiva opcional por 1 ouro na antecipação, **quando** recusar ou pagar em saves equivalentes, **então** a resposta preserva o ouro na recusa ou cobra 1 e aplica o efeito uma vez no pagamento.
- **Dada** uma pausa no turno inimigo, **quando** recarregar e decidir, **então** o cliente preserva os IDs e apresenta as transições novas na ordem do POST.
- **Dados** efeitos simultâneos, **quando** escolher o primeiro, **então** a tela envia a decisão do modo correspondente, oferece apenas recusa com `canPay: false` e usa a próxima escolha e os custos devolvidos.
- **Dado** pagamento inválido ou escolha consumida, **quando** o POST retorna `paymentInvalid` ou `staleTriggeredEffectChoice`, **então** a tela informa a recusa e preserva o último estado confirmado.

### Nocaute, spawn e respawn (FEAT-14)

Base: ROADMAP v0.64, README §§20 e 12.2, Apêndice A e CONTRATO v0.66. O autor aprovou os REQ-63 a REQ-65 e a T-68 em 2026-11-21. As referências a payloads e projeções novas dependem do acordo do contrato.

### REQ-63 — Spawn e ponto de respawn

- **Dada** a entrada em uma dimensão, **quando** a tela receber o estado inicial, **então** apresenta a cidade inicial como zona de chegada e ponto de respawn de todos, usando os IDs projetados. Na entrada em outra dimensão, apresenta o novo ponto inicial quando esse fluxo estiver disponível.
- **Dado** que o membro está na própria vez, em zona Urbana e com pelo menos 1 PA, **quando** a API oferecer Salvar ponto de respawn, **então** a tela oferece a ação. Ao salvar, envia a intenção sem destino e mostra o ponto atualizado para o membro e o saldo reduzido em 1 PA conforme a resposta. Após recarregar, o ponto salvo continua visível.
- **Dada** uma zona não Urbana, falta de PA ou outra condição de indisponibilidade, **quando** a ação estiver ausente da projeção, **então** a tela a omite. Se uma intenção já enviada for recusada, mostra a mensagem da API e preserva o último estado confirmado.

### REQ-64 — Nocaute e retomada da partida

- **Dado** que o membro chega a 0 PV em um fluxo disponível, inclusive doação de vida, **quando** a API concluir o nocaute, **então** a tela mostra o retorno automático ao ponto salvo, a vida restaurada calculada sobre a vida máxima com o novo Pico, Pico e Vigor atualizados, as penalidades aplicáveis e o fim da vez atual. As informações e ações vêm do estado projetado pela API.
- **Dada** vitória com queda por Reflexão e recompensas pendentes, **quando** a API projetar escolhas obrigatórias, **então** elas continuam disponíveis também após recarga ou reabertura da sessão. Ao receber o estado após a última escolha, a tela apresenta o desfecho da vitória e o respawn resolvido pelo backend. Em derrota, apresenta as penalidades do desfecho já aplicadas pela API.
- **Dada** uma partida de um participante, **quando** o nocaute solo for resolvido, **então** a tela mostra a rodada avançada automaticamente, o ouro atualizado na bolsa e as ações da vez jogável projetada. A validação cobre o desconto arredondado para baixo, o cofre intacto e a passagem de rodada para durações e recargas disponíveis. Após recarga ou reabertura, a tela recupera o estado persistido, com as penalidades aplicadas uma só vez.
- **Dada** uma partida com mais de um participante, inclusive com IA, **quando** esses fluxos estiverem disponíveis e a API resolver o nocaute, **então** a tela usa a ordem projetada, com perda da vez atual e da próxima e sem a penalidade extra de ouro do solo. Em combate de grupo, o membro caído permanece no combate até seu encerramento e o frontend só mostra opções de reviver quando oferecidas pelas regras aplicáveis. A validação real desses cenários depende das FEATs 20 e 22.

### REQ-65 — Valores de nocaute no laboratório

- **Dada** a configuração de nocaute, **quando** consultar, salvar ou restaurar os valores, **então** o laboratório exibe os campos pactuados, usa os limites e padrões retornados pela API e associa os erros de validação aos campos correspondentes. A revisão do contrato deve cobrir vida no respawn, perda de Pico, teto de Vigor, perda de ouro solo e rodadas de espera solo, conforme o Apêndice A.

### Lacunas do contrato da FEAT-14

- **Salvar ponto de respawn.** A ação já existe no vocabulário de zona e o estado já expõe `respawnZoneId`. Pactuar `{ type: "saveRespawnPoint" }` na rota de ações existente, posição em `availableActions`, motivos de recusa e comportamento ao salvar novamente a zona já registrada. Reutilizar o estado de spawn da FEAT-06 e definir a compatibilidade dos saves existentes.
- **Nocaute.** Pactuar a projeção da queda, da espera por desfecho e do retorno, incluindo a semântica de `down`, o dado necessário para comunicar o resultado após GET e a relação com `lastCombatResult` e `combatUpdates`. Definir a ordem de desfecho, escolhas pendentes, penalidades, recálculo de atributos e passagem de vez, além do momento de persistência. Cobrir derrota, Reflexão com e sem recompensa pendente, doação até zero e demais fontes de 0 PV já executáveis. Confirmar `keepPeakOnKnockout` e o encerramento de status `untilKnockout` onde aplicáveis.
- **Vez e persistência.** Pactuar o estado autoritativo da rodada e das ações no solo e a representação da perda da próxima vez para múltiplos participantes. Definir transições atômicas e retomada de saves com `down: true` da FEAT-13, inclusive com recompensa pendente, sem reaplicar o desfecho.
- **Laboratório e dados de teste.** Pactuar chaves, unidades, limites, padrões, arredondamentos, erros de PATCH e fallback para configurações anteriores. Definir fixtures e respostas esperadas para duas Urbanas, recusa, nocaute fora de combate, derrota, vitória por Reflexão com escolha, nocaute solo e recarga.

### REQ-nn — <nome>
- **Dado** <estado>, **quando** <ação>, **então** <resultado exato>.

### Missões e progressão de classes (FEAT-15)

Critérios aprovados pelo autor em 2026-11-22 para o jogo solo. Base: README §§8.3, 8.4, 12.2, 21 e Apêndice A, ROADMAP v0.64 e devlog 088.

| ID | Dado | Quando | Então |
| --- | --- | --- | --- |
| REQ-66 | Uma zona com quadro e vaga para aceitar missão | O jogador pega, continua ou finaliza uma missão de zona por 1 PA | A missão aceita sai do quadro, que recebe a próxima carta quando houver, e aparece em área própria do dono, sem ocupar slot. A etapa exibe o local por tipo ou título e só oferece ações elegíveis. A conclusão aplica as recompensas projetadas e impede repetir a missão na dimensão. |
| REQ-67 | Zona Urbana ou Habitada, Pico mínimo (padrão 30), classe sem especialização e vaga para missão genérica | O jogador escolhe uma especialização, aceita a provação por 1 PA, cumpre os objetivos (padrão 3 êxitos em eventos e 3 vitórias de pé) e finaliza em zona elegível por 1 PA | A especialização é permanente, uma por classe, com benefícios sujeitos à trava da build. |
| REQ-68 | Zona Urbana ou Habitada, todas as classes atuais especializadas, vaga e ouro suficiente | O jogador escolhe uma classe que ainda não possui e treina com o mentor pagando todos os PA restantes e o ouro (padrão 150, dobrando a cada nova classe). Cumpre os objetivos (padrão 5 êxitos e 5 vitórias de pé) e finaliza em zona elegível por 1 PA | A ficha mostra a nova classe e as travas, com os modificadores base da classe ativa obtida primeiro ou o padrão quando nenhuma estiver ativa. O número de classes não altera a capacidade do inventário. |
| REQ-69 | Missões abertas, com limite padrão de três no total e uma genérica | O jogador progride, abandona, recebe uma recusa ou reabre a sessão | Só resultados posteriores à aceitação contam. Um resultado pode avançar todas as missões elegíveis. Vitória em combate de missão conclui a etapa mesmo com o dono caído. Derrota ou fuga bem-sucedida permite nova tentativa. Abandonar na própria vez fora de combate custa 0 PA, perde o progresso, libera a vaga e devolve a carta de zona ao fundo do deck ou ao quadro se houver vaga e o deck estiver vazio. O ouro do mentor não é devolvido. Recusas preservam o estado confirmado. Reabrir conserva progresso, escolhas e concessões. |
| REQ-70 | Laboratório ou editor de conteúdo em modo dev | O autor consulta, salva ou restaura os ajustes, ou cadastra uma missão de zona | O laboratório mostra os valores, padrões, limites e erros da API. O editor permite configurar etapas e referências à coleção, com erros junto aos campos. |

Missões genéricas podem ser repetidas na mesma dimensão quando os requisitos voltarem a ser atendidos. Os cenários de mudança de dimensão, ajudantes de IA e recrutamento dependem das entregas correspondentes do roadmap.

### Mercado (FEAT-16)

Base: CONTRATO v0.81 (`implementado (BE)`), seção FEAT-16; README 3.4, 5.3, 6.3–6.6, 12.2, 24.1–24.5; ROADMAP v0.72. Preços, capacidades, ofertas de venda, destino de cada single e resultados chegam prontos do backend (D-62); o frontend só exibe, monta o lote e envia.

### REQ-71 — Valores do mercado no laboratório

Alinha o REQ-06.

- **Dado** o `/lab`, **então** as 37 chaves da FEAT-16 aparecem com rótulos pt-BR (glossário CONTRATO §2.17; texto de cada rótulo fixado na T-71, como na D-49) no formato do REQ-06 ("Padrão: … · Mín. … · Máx. …").
- **Dado** `400` `LAB_CONFIG_INVALID` com `sumMismatch`, **então** cada uma das 5 chaves de chance do booster mostra "As cinco chances do booster precisam somar 1000 milésimos.". Com `minAboveMax` em `marketFactorMinPercent`/`marketFactorMaxPercent`, os dois campos mostram "O fator mínimo do mercado não pode passar do máximo." (o texto atual do REQ-06 continua para o par de jogadores).

### REQ-72 — Campos do mercado no catálogo e no editor

Alinha os REQ-09 a REQ-12, REQ-21 e REQ-22. Regras comuns do editor valem; o formulário não confere combinações (o backend confere, D-38).

- **Dado** uma carta `attribute` ou `item` no catálogo, **então** mostra "Preço ×{priceMultiplier}" (vírgula decimal, como no REQ-10). Um item com `stockPrice` mostra "Preço de estoque {stockPrice}" e, com `stockQuantity` > 1, "Lote de {stockQuantity}". Um booster mostra "Coleção: {nome da coleção}" (de `useCollections`; sem a coleção na lista, o id).
- **Dado** uma carta `zone` com `market`, **então** mostra o bloco "Mercado" com a lista "Estoque" (nome de cada carta de `market.stock`, na ordem recebida, ou "Sem estoque.") e "Vende singles" ou "Sem singles".
- **Dado** o formulário de atributo e o de item, **então** há "Ajuste de preço" (número decimal, como no equipamento). O de item ganha "Preço de estoque" (vazio = `null`), "Lote" (inteiro, começa em 1) e "Coleção do booster" (seleção das coleções do editor, com a opção vazia "Nenhuma" = `null`).
- **Dado** o formulário de zona, **então** há o bloco "Mercado" com a caixa "Tem mercado" (desmarcada = `market: null`); marcada, mostra a lista "Estoque" (regras de lista do REQ-21; cada item com "Carta", id em texto) e a caixa "Vende singles". Os erros `CONTENT_INVALID` chegam pelo caminho (`priceMultiplier`, `stockPrice`, `stockQuantity`, `boosterCollectionId`, `market`, `market.stock.1`); `CONTENT_REFERENCED` ao excluir mostra a `message` recebida.

### REQ-73 — Ir ao Mercado: o que o mercado oferece

- **Dado** `availableActions` do host contém `visitMarket`, **então** a região "A vez" mostra o botão "Ir ao Mercado", depois de "Usar cofre"; sem `visitMarket`, não há botão.
- **Quando** o jogador clica "Ir ao Mercado", **então** abre, abaixo da região "A vez", a seção "Mercado" (com ela aberta, o botão fica desabilitado) com "Ouro na bolsa {gold} (capacidade {purseCapacity})", "Fator do mercado {factorPercent}%" e, nesta ordem, os grupos abaixo, montados de `player.market` na ordem recebida, sem conta no frontend:
  - "Estoque": por entrada, "{nome} — {price} de ouro" (com `copiesPerPurchase` > 1: "{nome} ({copiesPerPurchase} unidades) — {price} de ouro"), o campo "Compras de {nome}" (começa em 1) e "Acrescentar" → `{ operation: "buyStock", cardId, quantity }`, descrita "Comprar {quantity}× {nome}". Lista vazia: "Sem estoque.".
  - "Boosters": por entrada, "{nome} — {price} de ouro", o campo "Boosters de {nome}" (começa em 1) e "Acrescentar" → `buyBooster`, "Comprar {quantity}× {nome}". Lista vazia: "Nenhum booster à venda.".
  - "Singles" (só quando `showcase` não é `null`): por slot, "Slot {slotIndex + 1}: {nome} — {price} de ouro (vai para a pasta de TCG | o inventário)" e "Comprar {nome}" → `{ operation: "buySingle", slotIndex }`, descrita "Comprar {nome} (slot {slotIndex + 1})"; slot com `offer: null` mostra "Slot {slotIndex + 1}: vazio", sem botão. Um slot já na lista fica com o botão desabilitado (D-62 item 2).
  - "Vender": por oferta, "{nome} (Inventário | Pasta de TCG, {owned} unidades) — {price} de ouro por unidade" (com `lotSize` > 1: "por lote de {lotSize}"), o campo "Unidades de {nome}" (começa em `lotSize`) e "Acrescentar" → `{ operation: "sell", source, cardId, quantity }`, descrita "Vender {quantity}× {nome}". Lista vazia: "Nada para vender.".
  - "Serviços": por entrada de `services`, "{rótulo} — {price} de ouro (capacidade passa a {capacity})" e "Comprar {rótulo}" → `{ operation: "buyExpansion", expansion }`, descrita "Comprar {rótulo}". Rótulos: `vaultSlots` "Expansão do cofre", `deckSlots` "Slot de deck", `tcgFolder` "Expansão da pasta de TCG", `purse` "Expansão da bolsa", `vaultGold` "Expansão do ouro do cofre".
- **Dado** um campo numérico vazio ou que não é inteiro ≥ 1, **quando** "Acrescentar" é clicado, **então** nada é acrescentado e o campo mostra, ligado por `aria-describedby`, "Use um número inteiro a partir de 1.". O frontend não confere múltiplo de lote, ouro nem espaço (o backend responde `notLotMultiple`, `notEnoughGold`…).
- **Dado** `player.market` `null` com `visitMarket` disponível (fora do contrato), **então** a seção mostra "Servidor indisponível. Tente novamente." sem grupos.

### REQ-74 — Ir ao Mercado: lote, confirmação e resultado

- **Dado** a lista "Operações" da seção "Mercado" (começa com "Nenhuma operação."), **então** vale o REQ-52 para itens, "Remover", "Subir", "Descer", "Confirmar (1 ponto de ação)" (desabilitado com a lista vazia), "Cancelar" e tamanho livre. Abaixo da lista, "Total previsto: {n} de ouro a pagar, {m} de ouro a receber", soma dos preços exibidos × quantidade das operações (só exibição; o cobrado vem do resultado, D-62 item 3).
- **Quando** o jogador confirma, **então** o app envia `{ "type": "visitMarket", "operations": [...] }` na ordem da lista; enquanto o pedido está em curso, os botões da seção e os de ação ficam desabilitados.
- **Dado** o `200`, **então** a seção fecha, a tela passa a mostrar o `Party` devolvido (REQ-35, item 3), a área de status mostra "Mercado: {n} operações feitas." (singular "1 operação feita") e, abaixo, a lista "Resultado do mercado" de `lastMarketVisit.results`, um item por operação: `buyStock` "Comprou {copiesReceived}× {nome} por {−gold} de ouro"; `buyBooster` "Comprou {quantity}× {nome} por {−gold} de ouro"; `buySingle` "Comprou {nome} (slot {slotIndex + 1}) por {−gold} de ouro; foi para a pasta de TCG | o inventário"; `sell` "Vendeu {quantity}× {nome} por {gold} de ouro"; `buyExpansion` "Comprou {rótulo} por {−gold} de ouro (capacidade {capacity})". Com `goldLost` > 0, mais "{goldLost} de ouro perdidos: a bolsa estava cheia.". `lastMarketVisit` `null` num `200` (fora do contrato) deixa a lista ausente.
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** vale o REQ-52 (lista mantida, item `operationIndex + 1` marcado "Recusada", `message` + texto do motivo; {nome} = carta de `details.cardId`, senão a da operação): `notInMarketStock` → "{nome} não está no estoque deste mercado."; `notMarketBooster` → "{nome} não está à venda neste mercado."; `singlesUnavailable` → "Este mercado não vende singles."; `showcaseSlotNotFound` → "Esse slot não existe na vitrine."; `showcaseSlotEmpty` → "Esse slot da vitrine está vazio."; `notLotMultiple` → "{nome} só é vendido em lotes inteiros."; `notEnoughGold` → "Não há ouro suficiente na bolsa."; `inventoryFull` → "Não há espaço no inventário."; `tcgFolderFull` → "Não há espaço na pasta de TCG."; `notInInventory` e `notInTcgFolder` → os textos do REQ-52; outro motivo → só a `message`. Outro erro §1.4 ou falha de rede/validação: como no REQ-52.

### REQ-75 — Abrir booster (Preparar e Usar cofre)

- **Dado** `availableActions` do host contém `prepare`, **então** cada slot do inventário do host cuja carta é `item` de `itemCategory` `booster` (dado de exibição, como a D-58 item 1) tem o botão "Abrir {nome}" → `{ "type": "prepare", "operation": "openBooster", "cardId" }`, sem confirmação; envio e bloqueio como no REQ-45.
- **Dado** a seção "Usar cofre" (REQ-52), **então** há o formulário "Abrir booster": seleção "Booster" (slots de `vault.slots` cuja carta é booster, sem repetir, em ordem de `cardId`) e "Acrescentar" → `{ operation: "openBooster", cardId }`, descrita "Abrir {nome}".
- **Dado** o `200` de um `openBooster` (no Preparar, ou num lote do cofre que o contém), **então** além do status de sempre a tela mostra a lista "Cartas do booster {nome}" de `lastBoosterOpening.cards`, na ordem recebida: "{nome} → pasta de TCG | inventário | cofre | entrega pendente". O status do Preparar é "Abriu {nome}.".
- **Dado** `409`, **então**: `notBooster` → "{nome} não é um booster."; `boosterEmpty` → "A coleção deste booster não tem cartas disponíveis."; `tcgFolderFull` no Preparar → "A pasta de TCG precisa de espaço para todas as cartas do booster."; `vaultFull` no cofre mantém o texto do REQ-52.
- **Dada** uma entrega pendente com `source.type` `booster` (REQ-59), **então** a origem aparece "Booster {nome}".

### REQ-76 — Capacidades e expansões na tela do grupo

Alinha os REQ-40, REQ-44 e REQ-50.

- **Dado** o `Party`, **então** as capacidades exibidas (bolsa, cofre, slots de deck, ouro do cofre, pasta de TCG) são as recebidas, já efetivas (sem conta no frontend); a seção do membro mostra "Expansões: cofre {vaultSlots}, slots de deck {deckSlots}, pasta de TCG {tcgFolder}, bolsa {purse}, ouro do cofre {vaultGold}" só quando alguma é > 0.

### Ferreiro e Oficina do Artífice (FEAT-17)

Base: CONTRATO v0.85 (`acordado`), seção FEAT-17; README 3.4, 5.1, 5.2, 8.8, 12.2, 16.1, 24.2, 25; ROADMAP v0.77. Estado de cada cópia de equipamento, custos, limiares, bônus, níveis seguintes, encantamentos que cabem, receitas e resultados chegam prontos do backend (D-63); o frontend só exibe, monta o lote e envia.

### REQ-77 — Valores do ferreiro no laboratório

Alinha o REQ-06.

- **Dado** o `/lab`, **então** as 19 chaves da FEAT-17 aparecem com rótulos pt-BR (texto de cada rótulo fixado na T-76, como na D-49) no formato do REQ-06 ("Padrão: … · Mín. … · Máx. …"). Os erros `outOfRange` e `notInteger` usam os textos do REQ-06.

### REQ-78 — Campos do ferreiro no catálogo e no editor

Alinha os REQ-10 a REQ-12, REQ-21 e REQ-22 (e a D-44). Regras comuns do editor valem; o formulário não confere combinações (o backend confere, D-38).

- **Dado** uma carta `equipment` refinável no catálogo, **então** o bloco "Refino" mostra "Até +{maxLevel}" e a lista "Materiais por tentativa" ("{quantity}× {nome}"), ou "Sem materiais definidos.". Encantável: o bloco "Encantamento" lista os slots, "Slot {n}: elemento | efeito, a partir do refino +{minRefinement}" (com `minRefinement` 0, sem o "a partir…").
- **Dado** um item `document` com `recipe`, **então** mostra o bloco "Receita": "Cria {nome do equipamento}", a lista "Materiais" (ou "Sem materiais."), "{gold} de ouro" e, com `consumed`, "A receita é consumida.".
- **Dado** uma carta `zone` com `blacksmith`, **então** mostra o bloco "Ferreiro" com a lista "Encantamentos" ("{name} — elemento {rótulo do elemento} (+{bonusPercent}%)" ou "{name} — efeito", seguido dos materiais), ou "Sem encantamentos.".
- **Dado** o formulário de equipamento, **então** "Materiais" do "Refino" vira uma lista (regras de lista do REQ-21; cada item com "Material", id em texto, e "Quantidade", inteiro ≥ 1), e "Encantamento" ligado mostra a lista "Slots" (cada item com "Tipo", elemento ou efeito, e "Refino mínimo", inteiro ≥ 0) no lugar do texto.
- **Dado** o formulário de item, **então** há a caixa "Receita" (desligada = `null`); ligada, "Equipamento criado" (id em texto), a lista "Materiais", "Ouro" (inteiro ≥ 0) e a caixa "Consumida ao criar".
- **Dado** o formulário de zona, **então** há o bloco "Ferreiro" com a caixa "Tem ferreiro" (desmarcada = `blacksmith: null`); marcada, a lista "Encantamentos", cada item, num grupo "Encantamento {n}", com "Identificador do encantamento {n}" (com o número, para não colidir com o "Identificador" da carta, D-63 item 9), "Nome", "Tipo" e, conforme o tipo, "Elemento" e "Bônus (%)" ou "Efeitos" e "Habilidades" (os subformulários do REQ-55 e do REQ-60), mais a lista "Materiais". Os erros `CONTENT_INVALID` chegam pelo caminho (ex.: `refinement.materials`, `enchantment.slots.0.minRefinement`, `recipe.equipmentId`, `blacksmith`, `blacksmith.enchantments.0.id`); `CONTENT_REFERENCED` ao excluir mostra a `message` recebida.

### REQ-79 — Estado do equipamento na tela do grupo

Alinha os REQ-44, REQ-50 e REQ-73.

- **Dado** a seção de cada membro, **então** cada categoria ocupada em "Equipamentos" e cada slot de equipamento do "Inventário" e do cofre acrescenta ao nome o estado recebido (`equipmentStates[slot]` ou `equipmentState`), só o que difere do padrão, nesta ordem: "+{refinement}", "quebrado", "Reparado ×{repairMarks}", "encantamentos: {nome}, {nome} (desligado)". Ex.: "Arma: Espada Curta +3, quebrado, Reparado ×1, encantamentos: Fio de Brasa (desligado)". "(desligado)" só no encantamento com `active: false`.
- **Dado** a seção "Mercado" (REQ-73), **então** cada oferta de venda com `equipmentState` mostra o mesmo sufixo depois do nome, não tem campo de unidades e "Acrescentar" envia `{ operation: "sell", source, cardId, quantity: 1, inventorySlotIndex }`.
- Sufixo (fixado na T-77): o refino entra com espaço ("Espada Curta +3"), os demais itens com ", " ("Espada Curta, Reparado ×1"). A operação de venda na lista leva o sufixo da cópia ("Vender 1× Espada Curta +3, Reparado ×1"), e o "Total previsto" usa o preço da oferta da mesma cópia (`inventorySlotIndex`). O texto da oferta mantém o resto do REQ-73 ("({origem}, {owned} unidades) — {price} de ouro por unidade").

### REQ-80 — Ir ao Ferreiro e Oficina: o que é oferecido

- **Dado** `availableActions` do host contém `visitBlacksmith` ou `artificerWorkshop`, **então** a região "A vez" mostra "Ir ao Ferreiro" (logo antes de "Ir ao Mercado") ou "Oficina do Artífice", na ordem de `availableActions`. Sem a ação, não há botão.
- **Quando** o jogador clica um deles, **então** abre, abaixo da região "A vez", a seção "Ferreiro" ou "Oficina do Artífice" (os dois botões ficam desabilitados enquanto ela está aberta), montada de `player.blacksmith.blacksmith` ou `player.blacksmith.workshop`, com "Ouro na bolsa {gold}" e o aviso "Gasta todos os pontos de ação restantes ({actionPoints})." (ferreiro) ou "Gasta 1 ponto de ação." (Oficina). Depois, os grupos:
  - "Equipamentos": um item por entrada de `equipment`, na ordem recebida, com o título "{nome}{sufixo do REQ-79} — {Em uso: {rótulo do slot} | Inventário, slot {inventorySlotIndex + 1}}"; dentro dele:
    - com `repair`: "Consertar — {repair.gold} de ouro" e o botão "Consertar {nome}" → `{ operation: "repair", target }`;
    - com `refineSteps` não vazia: "Refinar para +{targetLevel} — {materiais}, {gold} de ouro, {teste}" e o botão "Refinar {nome}" → `{ operation: "refine", target }`, descrita "Refinar {nome} para +{targetLevel}". O passo exibido é `refineSteps[k]`, k = refinos desse alvo já na lista (D-63 item 2); com k ≥ `refineSteps.length`, o botão fica desabilitado e o texto some. {teste}: `threshold` 0 → "sem teste"; senão "D20 + {d20Bonus} ≥ {threshold}" (sem "+ 0"), e com `breaksOnFailure` "; quebra se falhar";
    - por entrada de `enchantOptions` (só no ferreiro): "{encantamento} — {materiais}, {gold} de ouro, {teste}" (de `blacksmith.enchantments`), mais "; requer refino +{requiresRefinement}" quando > 0 e "; encantamento extra" quando `extra`, e o botão "Encantar {nome} com {encantamento}" → `{ operation: "enchant", target, enchantmentId }` (com `extra: true` quando `extra`). Com `replaceRequired`, antes do botão há a seleção "Substituir" com os encantamentos do estado ("{n + 1}: {nome}"), e o envio leva `replaceIndex`. O frontend não confere se o refino da lista alcança o requisito (o backend recusa com `enchantSlotUnavailable`).
  - "Receitas": por entrada de `recipes`, "{receita}: cria {equipamento} — {materiais}, {gold} de ouro" (+ ", consumida") e o botão "Criar {equipamento}" → `{ operation: "craft", inventorySlotIndex }`. Com `canCraft` `false`, acrescenta " (faltam materiais ou ouro)"; o botão continua. Lista vazia: "Nenhuma receita no inventário.".
  - Descrição de cada operação na lista: o texto do botão (refino: com o nível).
- **Dado** a vista do local `null` com a ação disponível (fora do contrato), **então** a seção mostra "Servidor indisponível. Tente novamente." sem grupos.

### REQ-81 — Ir ao Ferreiro e Oficina: lote, confirmação e resultado

- **Dado** a lista "Operações" da seção (começa com "Nenhuma operação."), **então** vale o REQ-52 para itens, "Remover", "Subir", "Descer", "Cancelar" e "Confirmar" desabilitado com a lista vazia; o rótulo é "Confirmar (todos os pontos de ação)" no ferreiro e "Confirmar (1 ponto de ação)" na Oficina; até 50 itens (com 50, os botões de acrescentar ficam desabilitados). "Total previsto: {n} de ouro", soma dos preços exibidos (só exibição; o cobrado vem do resultado). Mover ou remover itens recalcula o nível e o preço de cada refino pela posição (D-63 item 2).
- **Quando** confirma, **então** envia `{ "type": "visitBlacksmith" | "artificerWorkshop", "operations": [...] }` na ordem da lista; enquanto o pedido está em curso, os botões da seção e os de ação ficam desabilitados.
- **Dado** o `200`, **então** a seção fecha, a tela mostra o `Party` devolvido, a área de status mostra "Ferreiro: {n} operações, {actionPointsSpent} pontos de ação gastos." (ou "Oficina do Artífice: …"; singular "1 operação", "1 ponto de ação gasto") e, abaixo, a lista "Resultado do ferreiro" de `lastBlacksmithVisit.results`, um item por operação, na ordem ({rolagem}: `roll` `null` → vazio; senão ", D20 {roll} + {d20Bonus} contra {threshold}", sem "+ 0"):
  - `skipped` → "{descrição}: não feito (a operação anterior falhou).";
  - `repair` → "Consertou {nome} por {−gold} de ouro (Reparado ×{repairMarks}).";
  - `refine` → "Refinou {nome} para +{targetLevel} por {−gold} de ouro{rolagem}." ou "Falhou ao refinar {nome} para +{targetLevel}: {−gold} de ouro perdidos{rolagem}." e, com `broke`, " {nome} quebrou.";
  - `enchant` → "Encantou {nome} com {encantamento} por {−gold} de ouro{rolagem}." (com `replaced`, " Substituiu {nome do substituído}.") ou "Falhou ao encantar {nome} com {encantamento}: {−gold} de ouro perdidos{rolagem}.";
  - `craft` → "Criou {equipamento} por {−gold} de ouro; foi para {destino}." ({destino} do `destination`: `inventory` "o inventário", `mountInventory` "o inventário extra"; resultado sem `destination` lê `inventory`; REQ-88).
  - `lastBlacksmithVisit` `null` num `200` (fora do contrato) deixa a lista ausente.
- **Dado** `409` `ACTION_NOT_ALLOWED` com `operationIndex`, **então** vale o REQ-52 (lista mantida, item `operationIndex + 1` marcado "Recusada", `message` + texto do motivo; {nome} = carta de `details.cardId`, senão a da operação): `equipmentNotFound` → "Esse equipamento não está mais lá."; `notBroken` → "{nome} não está quebrado."; `equipmentBroken` → "{nome} está quebrado: conserte antes."; `notRefinable` → "{nome} não pode ser refinado."; `refinementMaterialsMissing` → "{nome} não tem materiais de refino definidos."; `refineLevelMax` → "{nome} já está no refino máximo."; `refineLevelTooHigh` → "A Oficina não refina acima desse nível."; `enchantNotAvailable` → "A Oficina não encanta."; `enchantmentNotOffered` → "Este ferreiro não oferece esse encantamento."; `notEnchantable` → "{nome} não pode ser encantado."; `enchantSlotUnavailable` → "{nome} não tem slot para esse encantamento."; `replaceIndexRequired` → "Escolha o encantamento a substituir."; `replaceIndexInvalid` → "O encantamento a substituir não existe."; `recipeMissing` → "{nome} não é uma receita."; `materialsMissing` → "Faltam materiais."; `notEnoughGold` → "Não há ouro suficiente na bolsa."; `inventoryFull` → "Não há espaço no inventário."; `notInInventory` → texto do REQ-52; outro motivo → só a `message`. Sem `operationIndex` (`artificerInactive`, `zoneActionUnavailable`, `noActionPoints`, `choicePending`, `combatInProgress`), a `message` aparece na área de status, sem marcar item. Outro erro §1.4 ou falha de rede/validação: como no REQ-52.

### Montarias e Estábulo (FEAT-18)

Base: CONTRATO v0.90 (`acordado`), seção FEAT-18; README 3.4, 6.5, 6.6, 12.2, 24, 26 e Apêndice A (linha "Montaria"); Apêndice B U1 e U2; ROADMAP v0.83. Preços, destinos (inventário, pasta ou montaria), rotas do Movimentar, se a montaria pode ser vendida e as origens de efeitos e habilidades chegam prontos do backend (D-64); o frontend só exibe e envia.

### REQ-82 — Valores da montaria e doação no laboratório

Alinha os REQ-06 e REQ-46.

- **Dado** o `/lab`, **então** as 7 chaves da FEAT-18 aparecem depois das da FEAT-17, com rótulos pt-BR (texto fixado na T-81, como na D-49) no formato do REQ-06; `outOfRange` e `notInteger` usam os textos do REQ-06.
- **Dado** a seção "Doação" com "Carta", **então** a seleção "Carta" também lista as cartas `mount` da coleção ("{nome} · montaria"). **Dado** `409` `LAB_GRANT_NO_SPACE` com `mountAlreadyOwned`, **então** mostra a `message` e "Já tem montaria.".

### REQ-83 — Montaria no catálogo e no editor

Alinha os REQ-04, REQ-08, REQ-12, REQ-21, REQ-22 e REQ-72. Regras comuns do editor valem; o formulário não confere combinações (o backend confere, D-38).

- **Dado** uma carta `mount` no catálogo, **então** no lugar da categoria aparece "Montaria" (README 26: montaria não tem categoria), seguido de "{rótulo da raridade}", "Tipos: {rótulos de `mountTypes`, na ordem recebida, separados por vírgula}", "Criatura: {creature}", os efeitos (REQ-53) e as habilidades (REQ-60). O filtro de tipo do catálogo ganha "Montaria".
- **Dado** uma carta `zone` com `market.mounts` não vazio, **então** o bloco "Mercado" (REQ-72) ganha a lista "Estábulo" com o nome de cada montaria, na ordem recebida; com `mounts` vazio, nada.
- **Dado** o editor, **então** "Nova carta" oferece o tipo "Montaria"; o formulário tem "Raridade", "Tipos" (caixas de marcar dos tipos de inimigo, rótulos §2), "Criatura" (texto), "Efeitos" (REQ-55) e "Habilidades" (REQ-60). No formulário de zona, o bloco "Mercado" ganha a lista "Estábulo" (regras de lista do REQ-21; cada item "Montaria {n}", id em texto). A pré-visualização (REQ-22) usa o componente do catálogo. Os erros `CONTENT_INVALID` chegam pelo caminho (`mountTypes`, `creature`, `market.mounts`, `market.mounts.0`); `CONTENT_REFERENCED` ao excluir mostra a `message` recebida.

### REQ-84 — Montaria na tela do grupo

Alinha os REQ-42, REQ-44 e REQ-79.

- **Dado** a seção de cada membro, **então**, depois de "Inventário" (REQ-44) e antes do "Cofre" (REQ-50), há o título "Montaria: {nome}" (com `mount` `null`: "Sem montaria.", sem as listas); com montaria, a lista "Inventário extra ({mount.inventory.length} de {mount.inventoryCapacity} slots)", um item "{quantity}× {nome}{sufixo do REQ-79}" por slot, na ordem recebida, ou "Inventário extra vazio."; e a lista "Pasta extra (capacidade {mount.tcgFolderCapacity})", "{copies}× {nome}" por entrada, ou "Pasta extra vazia.". Os slots da montaria não têm "Equipar" nem "Abrir" (o contrato manda transferir antes).
- **Dado** a seção "Ajustar deck" (REQ-42) com montaria, **então** as linhas incluem as cartas de `mount.tcgFolder` (mesma ordem, sem repetir) e cada linha ganha "Na pasta extra: {copies}" depois de "Na pasta". Sem montaria, a seção não muda.

### REQ-85 — Transferir entre o inventário e a montaria (Preparar)

- **Dado** `availableActions` do host contém `prepare` e o host tem montaria, **então** cada slot do "Inventário" e cada entrada da "Pasta de TCG" ganha o botão "Levar {nome} para a montaria", e cada slot do "Inventário extra" e entrada da "Pasta extra" ganha "Trazer {nome} da montaria"; com `quantity`/`copies` > 1, antes do botão há o campo "Quantidade de {nome}" (começa no total do slot). Sem `prepare` ou sem montaria, não há esses controles.
- **Quando** o jogador clica, **então** envia `{ "type": "prepare", "operation": "transferMount", "direction": "toMount" | "fromMount", "space": "inventory" | "tcgFolder", "cardId", "quantity" }`; num slot com `equipmentState` envia também `inventorySlotIndex` (índice no espaço de origem) e `quantity: 1`, sem campo. Campo vazio ou que não é inteiro ≥ 1: nada é enviado e o campo mostra "Use um número inteiro a partir de 1.". Envio, bloqueio e 0 PA como no REQ-45.
- **Dado** o `200`, **então** a tela mostra o `Party` devolvido e a área de status mostra "Levou {quantity}× {nome} para a montaria." ou "Trouxe {quantity}× {nome} da montaria.".
- **Dado** `409` `ACTION_NOT_ALLOWED`, **então** nada muda e a área de status mostra a `message` seguida de: `noMount` → "Você não tem montaria."; `notOwned` → "Não há essas cópias de {nome} ali."; `inventoryFull` → "Não há espaço no inventário extra." (`toMount`) ou "Não há espaço no inventário." (`fromMount`); `tcgFolderFull` → "Não há espaço na pasta extra." ou "Não há espaço na pasta de TCG."; outro motivo → só a `message`. Outro erro §1.4 ou falha de rede/validação: REQ-35.

### REQ-86 — Movimentar com montaria

Alinha os REQ-35 e REQ-37.

- **Dado** uma zona escolhida que está em `moveTargets` do host, com `move` disponível, **então** a seção "Zona escolhida" mostra, pela entrada da zona em `moveRoutes`: com `direct: true`, "Movimentar para {title}" (envia `{ type: "move", zoneId }`, sem `viaZoneId`, como hoje); e um botão "Movimentar para {title} passando por {título da zona do meio}" por zona de `via`, na ordem recebida (envia também `viaZoneId`). Sem entrada em `moveRoutes` (fora do contrato), só o botão simples.
- Enquanto um pedido está em curso, todos esses botões ficam desabilitados. `200` e erros: REQ-35 e REQ-37; com `409`, a `message` seguida de `noMount` → "Você não tem montaria."; `notConnected` e outro motivo → só a `message`.

### REQ-87 — Estábulo no Ir ao Mercado

Alinha os REQ-73 e REQ-74.

- **Dado** a seção "Mercado" com `market.stable` não `null`, **então** depois de "Serviços" há o grupo "Estábulo": por entrada de `stable.offers`, "{nome} — {price} de ouro" e "Comprar {nome}" → `{ operation: "buyMount", cardId }`, descrita "Comprar a montaria {nome}"; e, com `stable.currentMount`, "Sua montaria: {nome} — vende por {price} de ouro" e "Vender {nome}" → `{ operation: "sellMount" }`, descrita "Vender a montaria {nome}". Com `sellable: false`, o texto ganha " (esvazie o inventário extra e a pasta extra antes)" e o botão continua (o backend recusa). Com `stable` `null`, não há o grupo.
- **Dado** o lote, **então** o "Total previsto" (REQ-74) soma a compra em "a pagar" e a venda em "a receber". O frontend não impede comprar com montaria nem duas compras no lote (o backend responde `mountAlreadyOwned`).
- **Dado** o `200`, **então** "Resultado do mercado" mostra `buyMount` → "Comprou a montaria {nome} por {−gold} de ouro" e `sellMount` → "Vendeu a montaria {nome} por {gold} de ouro".
- **Dado** `409` com `operationIndex` (REQ-74), **então**: `mountNotOffered` → "Este Estábulo não vende {nome}."; `mountAlreadyOwned` → "Você já tem uma montaria: venda a atual antes."; `noMount` → "Você não tem montaria."; `mountNotEmpty` → "Esvazie o inventário extra e a pasta extra antes de vender a montaria.".

### REQ-88 — Destino pronto e descarte com montaria

Alinha os REQ-59 e REQ-73 a REQ-75.

- **Dado** qualquer destino recebido (`ReceiveSpace`), **então** o texto é: `inventory` "o inventário", `tcgFolder` "a pasta de TCG", `mountInventory` "o inventário extra", `mountTcgFolder` "a pasta extra" (nas "Cartas do booster", sem o artigo). Vale para a vitrine e o `buySingle` (REQ-73, REQ-74), as "Cartas do booster" (REQ-75) e o "1× {nome} para {destino}." da "Recompensa pendente".
- **Dado** um resultado `buyStock` ou `buyBooster` com alguma entrada `mountInventory` em `received`, **então** o texto do REQ-74 ganha " ({q} no inventário, {q} no inventário extra)" com as quantidades recebidas, só das entradas presentes; só com `inventory`, nada muda.
- **Dado** `lastRewardDelivery` com `disposition: "kept"` e `space` não `null`, **então** o texto passa a "{nome} foi para {destino}."; os demais casos não mudam. **Dado** `lastScavenge.delivery` `mountInventory`, **então** o status é "Você achou {nome}; foi para o inventário extra.".
- **Dada** uma "Recompensa pendente", **então** cada entrada de `discardOptions` (uma por carta e espaço) tem a seleção "Descartar {nome} ({Inventário | Pasta de TCG | Inventário extra | Pasta extra})", e "Manter" envia `discard` com `{ cardId, space, copies }` de cada seleção > 0.

### REQ-89 — Efeitos e habilidades da montaria

Alinha os REQ-54 e REQ-61.

- **Dado** `activatableEffects` com `source: "mount"`, **então** a origem aparece "Montaria · {nome}" e "Ativar" envia o `cardId` da montaria, como os demais.
- **Dada** uma opção de habilidade (Preparar ou combate) com `mountAbility: true`, **então** o nome vem da habilidade `abilityId` da carta de `host.player.mount.cardId` (sem a carta, o `abilityId`) e o envio leva `mountAbility: true` no lugar de `equipmentSlot`.
- **Dado** `409` `noMount` no Preparar, **então** a `message` seguida de "Você não tem montaria.". As origens `mount` e `mountAbility` em efeitos de combate e disparados são aceitas na leitura e exibidas como as demais.

### Conclusão da dimensão (FEAT-19)

Base: README 3.2, 12.1, 12.2, 18.3, 19.1 (item 10), 21.1, 28.1 ("Ir para nova dimensão", tabela "Mantém / Reinicia") e Apêndice A ("Pico por fonte": Chefe +15, conclusão +25); Apêndice B I3; ROADMAP v0.85. Coleções estendidas e reprint (README 27) ficam numa FEAT própria (decisão do autor, 2026-11-25). Se a ação aparece, quem cumpre o requisito, o resultado do combate, o prêmio, o Pico, a próxima dimensão e o save congelado chegam prontos do backend (D-65); o frontend só exibe e envia. Nomes de campos e eventos são os do contrato da FEAT-19 (a propor pela `/contrato FEAT-19`); os textos abaixo são os da tela.

### REQ-90 — Valores da conclusão no laboratório e doação de item de conclusão

Alinha os REQ-06 e REQ-46.

- **Dado** o `/lab`, **então** as chaves da FEAT-19 que o contrato trouxer (Pico de derrotar um Chefe e Pico de concluir a dimensão, Apêndice A) aparecem depois das da FEAT-18, com rótulos pt-BR (texto fixado na tarefa, como na D-49) no formato do REQ-06; `outOfRange` e `notInteger` usam os textos do REQ-06.
- **Dado** a seção "Doação" com "Carta", **então** a seleção também lista os itens de conclusão da coleção ("{nome} · item de conclusão"); a doação de um item de conclusão nunca responde falta de espaço (README 3.2) e o membro devolvido mostra o item na área do REQ-92.

### REQ-91 — Conclusão na Carta de Dimensão (catálogo e editor) e item de conclusão

Alinha os REQ-11, REQ-28 e REQ-31. Regras comuns do editor valem; o formulário não confere combinações (o backend confere, D-38).

- **Dado** uma carta `dimension` no catálogo, **então**, depois dos efeitos, aparece o bloco "Conclusão" com: "Zona de conclusão: {título}"; a lista "Requisito" com um item "{quantidade}× {nome do item de conclusão}" por entrada, na ordem recebida; "Prêmio máximo" com o que o contrato descrever (cartas como "{quantidade}× {nome}", ouro como "{n} de ouro"); e, só com chefe final, a seção "Chefe final" com o mesmo bloco de inimigo do REQ-13 e "Sem fuga" quando marcado (com rótulo, não só ícone).
- **Dado** um item de conclusão no catálogo, **então** a carta de item (REQ-11) mostra "Item de conclusão" depois da raridade.
- **Dado** o formulário de uma carta `dimension` no editor, **então** depois de "Decks de recompensas" há o bloco "Conclusão" com "Zona de conclusão" (título de zona), a lista "Requisito" (cada item com "Item de conclusão {n}" e "Quantidade {n}"), os campos do "Prêmio máximo" e a caixa "Tem chefe final", que mostra os campos de inimigo do evento de combate (D-45, sufixo " do chefe final") e a caixa "Sem fuga". Erros `CONTENT_INVALID` aparecem junto aos campos pelos caminhos do contrato; "Validar como dimensão" (REQ-25) mostra os problemas da conclusão na mesma lista.
- **Dado** o formulário de item, **então** há a caixa "Item de conclusão".

### REQ-92 — Itens de conclusão e requisito na tela do grupo

Alinha o REQ-30 e a área de missões (REQ-66).

- **Dado** a partida preparada, **então**, abaixo de "Cidade inicial", aparece a seção "Conclusão da dimensão" com "Zona de conclusão: {título}", a lista "Requisito" ("{quantidade}× {nome}") e, só com chefe final, "Chefe final: {nome}" (seguido de "· Sem fuga" quando marcado).
- **Dado** cada membro, **então** a seção dele ganha a lista "Itens de conclusão" (área própria, sem slot, ao lado das missões) com "{quantidade}× {nome}" por item, na ordem recebida; sem itens, "Nenhum item de conclusão.". Itens de conclusão não aparecem no inventário, na montaria nem nas listas de venda, descarte, cofre ou transferência (vêm fora delas no estado recebido).

### REQ-93 — Concluir dimensão

Alinha o REQ-34 (ações da vez).

- **Dado** a ação de conclusão em `availableActions` (só na zona de conclusão e só para quem cumpre sozinho o requisito, decidido pelo backend), **então** aparece o botão "Concluir dimensão" com o custo recebido ("1 PA"); sem a ação, o botão não existe (nenhuma explicação calculada na tela).
- **Dado** o clique, **então** o app envia a ação com o botão desabilitado e a área de status mostra "Concluindo a dimensão…".
- **Dada** a resposta de dimensão concluída (sem chefe final), **então** a tela mostra o painel "Dimensão concluída" (REQ-95).
- **Dada** a resposta com combate iniciado (com chefe final), **então** abre a tela de combate da FEAT-13 com o título "Chefe final · {nome}"; "Fugir" só aparece quando vier nas ações do combate (o backend tira com "Sem fuga").
- **Dado** `409` com um motivo do contrato, **então** a área de status mostra a `message`; erros de formato e falha de rede seguem o REQ-34.

### REQ-94 — Resultado do combate contra o chefe final

Alinha os REQ do resultado de combate (FEAT-13) e do nocaute (REQ-64).

- **Dada** vitória no combate do chefe final, **então** o resumo do combate é mostrado como os demais e, em seguida, o painel "Dimensão concluída" (REQ-95).
- **Dada** fuga, derrota ou limite de ciclos, **então** o resumo do combate é mostrado como os demais, seguido de "A dimensão não foi concluída. Você pode tentar de novo." e os itens de conclusão continuam na lista do REQ-92.

### REQ-95 — Dimensão concluída e passagem para a próxima

- **Dado** o resumo de conclusão recebido (do POST ou de um GET depois, enquanto o contrato o mantiver), **então** aparece o painel (papel `dialog`, modal) "Dimensão concluída: {nome da dimensão concluída}" com: a lista "Prêmio máximo" ("{quantidade}× {nome} para {destino}" com os destinos do REQ-88; ouro como "+{n} de ouro"), "Pico +{n}" por membro (o total recebido, já somado pelo backend), "Itens de conclusão saíram do jogo." e o botão "Continuar"; o foco vai para "Continuar".
- **Dado** que a próxima dimensão já foi lançada, **então** o painel diz "Próxima dimensão: {nome}" e "Continuar" fecha o painel e mostra a partida da nova dimensão (REQ-30: "Dimensão", "Cidade inicial", "Ordem dos jogadores" novos), com a mão nova e as missões da dimensão anterior ausentes, tudo como recebido.
- **Dado** que a próxima dimensão não foi lançada, **então** o painel diz "O save ficou congelado até o lançamento da próxima dimensão." e "Continuar" leva a `/`, com a área de status de "Seus jogos" mostrando "Save congelado.".

### REQ-96 — Save congelado

Alinha os REQ-14 e REQ-16.

- **Dado** um save congelado na lista de "Seus jogos", **então** a situação mostra "Congelado · aguardando a próxima dimensão" e o botão "Continuar" não aparece ("Abandonar" continua).
- **Dado** `/grupo/:partyId` de um save congelado (o backend recusa a sessão com o código do contrato), **então** a área de status mostra a `message` e o link "Voltar ao início".
- **Dado** que a próxima dimensão foi lançada depois (no dev, pelo editor), **então** a lista mostra o save como "Pausado" e "Continuar" abre a nova dimensão, conforme o estado recebido.

### Coleções estendidas e reprint (FEAT-33)

Base: README §§24.3, 24.4 e 27; ROADMAP v0.88; CONTRATO v1.01 (proposto). Aprovada pelo autor em 2026-11-26.

#### REQ-97 — Configurar a vigência

- **Dado** uma Carta de Dimensão em edição e coleções lançadas anteriormente, **quando** o autor salva as listas “Coleções estendidas” e “Reprints”, **então** o editor recupera as listas ao reabrir a carta e o catálogo exibe a configuração publicada.
- **Dado** conteúdo legado ou uma referência inválida, **quando** o editor carrega a carta legada ou recebe o erro da API, **então** exibe as duas listas vazias no primeiro caso e o erro no campo correspondente no segundo.

#### REQ-98 — Comprar boosters vigentes

- **Dado** um mercado com boosters da coleção própria, de uma estendida e de uma reimpressa, **quando** o jogador abre “Ir ao Mercado” e confirma o lote, **então** vê todas as ofertas e preços da API, envia os IDs selecionados em `buyBooster` e vê o resultado retornado.
- **Dado** que um booster selecionado saiu da oferta, **quando** o backend rejeita o lote, **então** a tela identifica a operação que falhou e o estado permanece igual, inclusive PA, ouro, cartas e vitrine.

#### REQ-99 — Comprar singles vigentes

- **Dado** um mercado com singles e uma oferta de coleção estendida ou reimpressa, **quando** o jogador confirma a compra, **então** a tela envia `buySingle` pelo slot exibido e mostra a carta e o destino retornados no resultado.
- **Dado** um conjunto vigente com várias coleções, **quando** o backend forma ou renova o pool, **então** considera cada ID elegível uma vez e aplica as regras atuais de estoque, escassez e reposição. O sorteio pode deixar uma coleção sem representação.

#### REQ-100 — Abrir booster e usar cartas antigas

- **Dado** que o jogador possui um booster reimpresso ou fora de vigência e tem espaço, **quando** usa “Preparar” ou “Usar cofre” para abri-lo, **então** recebe as cartas originais de `boosterCollectionId`, com a mesma raridade, e a tela mostra os destinos retornados. Cartas antigas adquiridas continuam utilizáveis.

#### REQ-101 — Atualizar a oferta na mudança de dimensão

- **Dado** uma transição em que termina uma extensão e volta outra coleção por reprint, **quando** o jogador acessa o mercado da dimensão de destino, **então** a oferta e o conjunto elegível de singles seguem a vigência do destino. Zonas, eventos, inimigos e deck de recompensas seguem a coleção própria da dimensão.

### Ajudantes de IA (FEAT-20)

#### REQ-102 — Criar grupo com ajudantes
- **Dado** Novo jogo, **quando** o host escolhe a quantidade de ajudantes, **então** o total respeita os limites vigentes (0 a 5 ajudantes na configuração padrão), e a quantidade segue na criação. Uma recusa preserva os dados e aparece no campo. A composição é definida na criação.

#### REQ-103 — Exibir membros e ordem
- **Dado** um grupo com ajudantes, **quando** a campanha abre ou é retomada, **então** a tela identifica o host humano, os ajudantes e o membro da vez na ordem devolvida pela API. A ordem fica fixa na dimensão e é substituída na transição.

#### REQ-104 — Acompanhar o avanço automático
- **Dado** que uma IA joga primeiro ou recebe a vez após uma ação humana, **quando** o backend processa as vezes automáticas, **então** a tela bloqueia o envio durante a operação, aplica o estado recebido e libera ações apenas na vez humana. Se houver transição ou congelamento, mostra o estado correspondente. Com um humano, todos os relógios ficam desligados.

#### REQ-105 — Retomar o save e preservar o solo
- **Dado** um save solo legado ou um grupo com ajudantes, **quando** o host continua, **então** a tela apresenta composição e progresso persistidos, com os sorteios já gravados. O solo conserva o fluxo existente.

#### REQ-106 — Configurar prioridades no laboratório
- **Dada** a configuração da IA no laboratório, **quando** o autor consulta, altera ou restaura as prioridades, **então** a tela usa os valores e as validações do contrato. A ordem inicial é evitar nocaute, avançar a conclusão da dimensão, fazer missões, ganhar Pico e ganhar ouro.

### Acompanhar as vezes dos ajudantes (FEAT-21)

#### REQ-107 — Acontecimentos em ordem

**Dado** um avanço automático no início, na retomada ou após uma ação humana, **quando** chegar a resposta HTTP, **então** a tela apresenta movimento, evento aleatório e combate na ordem recebida, identificando o ajudante e exibindo cada transição de combate uma vez. Com lote vazio, a tela mostra diretamente o estado confirmado.

#### REQ-108 — Ações durante a apresentação

**Dado** um avanço em curso ou uma sequência em apresentação, **quando** o humano tentar iniciar uma ação da vez, **então** a interface não envia a intenção. Ao concluir ou pular a sequência, a tela mostra o estado confirmado mais recente e oferece as ações permitidas somente se a sessão estiver ativa e na vez humana.

#### REQ-109 — Recuperação e reenvio

**Dado** um avanço interrompido, **quando** o reenvio da ação ou a retomada da sessão devolver o lote recuperado, **então** a tela apresenta apenas os acontecimentos ainda não consumidos na sessão da interface. Se uma jogada posterior já tiver superado a revisão do recibo, a tela preserva o estado atual e descarta o lote antigo.

### Recrutar ajudantes e combate em grupo (FEAT-22)

Base: README §§3.2, 11.3, 19.1, 19.5, 20.2, 21.1 e II.7, D-68 e CONTRATO FEAT-22.

#### REQ-110 — Recrutamento antes do primeiro ciclo
- **Dado** um combate de evento, missão ou chefe final com candidatos elegíveis na mesma zona, **quando** o iniciador convida e confirma o começo, **então** a tela mostra o elenco aceito, as recusas e o custo aplicável apenas ao iniciador. A janela fecha antes do primeiro ciclo e a interface não oferece entradas tardias. Sem candidatos, o fluxo solo segue diretamente.

#### REQ-111 — Decisão humana na vez da IA
- **Dado** um convite de IA ou outra decisão de combate atribuída ao humano durante uma vez automática, **quando** o humano responde, **então** a tela envia a decisão autorizada e acompanha a retomada da mesma vez de exploração. Recarregar recupera a decisão persistida. O humano também pode agir como combatente ou destinatário de recompensa quando for o dono da decisão.

#### REQ-112 — Combate e resultado por participante
- **Dado** um elenco confirmado, **quando** começar um ciclo, ocorrer fuga, nocaute, ressurreição ou terminar o combate, **então** a tela apresenta ordem, ator, alvos, alterações de estado e resultado coletivo e individual informados pela API. A interface distingue quem fugiu, quem foi revivido e quem ainda está caído no desfecho. Negociação fica indisponível durante o combate.

#### REQ-113 — Recompensas, missão e chefe final
- **Dado** um combate em grupo encerrado, **quando** o servidor registrar progresso, penalidades ou recompensas, **então** a tela mostra o desfecho e seus destinatários, inclusive as escolhas individuais no rodízio, sem recalcular valores. Exibe o progresso do dono da missão na vitória mesmo se ele fugiu ou caiu. No chefe final, apresenta também a conclusão e seu destino conforme a API.

#### REQ-114 — Reenvio, recarga e compatibilidade
- **Dado** um combate pausado, uma resposta perdida ou um recibo antigo, **quando** a interface recuperar a sessão ou a ação, **então** apresenta a decisão atual com os dados persistidos, consome cada transição uma vez e preserva o estado de revisão superior. Saves solo legados continuam com o fluxo já validado.

### Acabamento visual da campanha solo (FEAT-30)

Base: ROADMAP v1.10 §3, README §§II.4–II.5, FEAT-02 e CONTRATO v1.21 (FEAT-05 e FEAT-19). Escopo: campanha de um personagem no navegador de PC, com tratamento PSX 2D, artes e ícones do autor e animações simples. Aplicam-se as regras e o contrato existentes. A revisão dos fluxos com ajudantes de IA e o executável Tauri pertencem ao Momento 2.

#### REQ-115 — Criar e retomar

**Dado** o menu em 1280×720 ou 2560×1440, **quando** o jogador cria um save com um personagem, encerra a sessão e continua pelo menu, **então** seleção de classe, confirmação e lista de saves são legíveis e operáveis sem rolagem horizontal, e a sessão retomada mostra o progresso persistido.

#### REQ-116 — Explorar e agir

**Dado** um save solo em exploração, **quando** o jogador consulta o mapa, seleciona uma zona, move-se, encerra a vez ou abre um painel de ação, **então** zona atual, zona selecionada, travessias e destinos disponíveis são distinguíveis. Pontos de ação, rodada e ações disponíveis ficam identificáveis. Mão, inventário e painéis de zona mantêm controles e resultados acessíveis por teclado, com foco visível.

#### REQ-117 — Encontro, combate e recompensa

**Dado** um encontro, combate ou escolha de recompensa, **quando** o jogador abre o painel, envia uma ação e recebe o resultado, **então** o painel identifica fase, alvos, escolhas e desfecho, com apresentação distinta para carregamento, sucesso e recusa. Uma recusa mantém visível o último estado confirmado e permite retomar a interação conforme o fluxo existente.

#### REQ-118 — Identidade visual e movimento

**Dado** o tratamento visual de cartas, termos e ações solo, **quando** o jogador consulta uma carta ou termo, muda de painel, abre um booster ou recebe o resultado de forja, **então** as cartas mostram categoria por ícone, imagem e rótulo com os recursos aprovados, e o conteúdo permanece legível na ausência de arte. Os termos têm destaque e explicação por ponteiro e foco. As animações respeitam a preferência de movimento reduzido e preservam o acesso a controles e resultados.

#### REQ-119 — Concluir a dimensão

**Dado** um save solo novo, criado no navegador com API real e MSW desligado, **quando** o jogador cumpre os requisitos publicados, chega à zona de conclusão e vence o chefe final, se houver, **então** a interface mostra o resultado e o prêmio reportados pela API. Com sucessora publicada, a sessão passa à próxima dimensão. Ao fim do conteúdo publicado, a sessão termina e o save aparece como congelado. Após recarga, tela, lista de saves e consulta à API refletem o mesmo desfecho.

## Decisões

- **D-68 — Recrutamento e combate em grupo (FEAT-22, aprovada em 2026-11-27):** inclui evento, missão e chefe final no momento 2. Seleção e confirmação antes do primeiro ciclo, com convite e resposta de IA decididos no backend. Ordem da campanha como desempate padrão, com acordo prévio permitido. Decisões do humano persistem mesmo na vez de uma IA. O servidor resolve a distribuição por Celeridade efetiva no desfecho e entrega uma carta por vez, preservando a ordem gravada. Os detalhes da interface HTTP e da conclusão do chefe final seguem para acordo no contrato.
- **D-66 — Vigência por dimensão (FEAT-33):** o autor configura as extensões e os reprints na dimensão de destino. Para manter uma extensão por várias dimensões, inclui a coleção em cada uma. As duas listas têm o mesmo efeito comercial. O backend resolve e grava a vigência ao iniciar a dimensão. Saves legados sem registro usam apenas a coleção própria até a próxima transição. O frontend usa as ofertas prontas da API. *(Aprovada em 2026-11-26.)*

- **D-01 — Formato de erro:** os erros do backend chegam no formato de [`CONTRATO.md`](CONTRATO.md) §1.4 (`{ "error": { "code", "message" } }`). A UI mostra `message` (pt-BR) e decide o comportamento pelo `code`. Erro esperado nunca vira exceção na UI. Códigos: os do contrato.
- **D-02 — Idioma:** identificadores, rotas da API, campos JSON e eventos em inglês; textos para o jogador em pt-BR. O glossário do contrato faz a ponte. *(Motivo: o contrato é compartilhado com um backend em NestJS e as APIs e libs são em inglês.)*
- **D-03 — Regras referenciadas:** a spec cita o README por seção e não copia regras. *(Motivo: o README é a fonte única, compartilhada pelos dois repositórios, e muda com frequência; cópias ficariam desatualizadas.)*
- **D-04 — Desenvolvimento antes do backend com MSW:** o frontend avança com o MSW respondendo fixtures do contrato. Os handlers não têm regra de jogo. A FEAT só fecha depois de validada contra o backend real (`/retorno-backend`). *(Escolha do autor em 2026-11-13; vantagem: fidelidade à rede, nos testes e no navegador; custo: uma lib a mais e fixtures a manter alinhadas ao contrato.)*
- **D-05 — Formatador:** Prettier, só para formatar; o ESLint continua responsável pelo lint. *(Aprovado pelo autor em 2026-11-13.)*
- **D-06 — Vocabulário de tempo no código:** vez = `turn`, rodada = `round`, turno de combate = `combatTurn`, ciclo de combate = `combatCycle`. Fora do combate o código nunca usa `combatTurn`/`combatCycle`; dentro do combate, "turno" sozinho é sempre `combatTurn` (README 2.1).
- **D-07 — Laboratório só no dev:** `src/lab/` e suas rotas entram só quando o build é de dev; o build de release não contém o código (verificado por teste de build na FEAT-03). O controle de admin entra na FEAT-25, com a autenticação.
- **D-08 — Guarda de `src/`:** proibidos em `src/`: `Math.random` (sorteio é do backend; animações são determinísticas); `any`; `fetch`, `XMLHttpRequest`, `WebSocket` e `io(` fora de `src/api/`; importar `src/mocks/` fora do ponto de entrada de dev e dos testes; importar `src/lab/` fora da rota de dev. Aplicada pelo hook `.claude/hooks/client-guard.mjs` e pelo ESLint (T-02). Ponto de entrada de dev: `src/main.tsx` (passa a ser a rota de dev na T-03); testes podem importar `src/mocks/`, não `src/lab/` (os testes do próprio laboratório ficam em `src/lab/` e seguem a regra de dentro dele, T-10); dentro de `src/mocks/` e `src/lab/` (ambos só de dev) os imports entre si são livres.
- **D-09 — PC primeiro:** o layout se ajusta à resolução do monitor (README II.1). A faixa de resoluções suportada é definida no `/guia-visual` (FEAT-02).
- **D-10 — Variáveis de ambiente (confirmada na T-03):** `VITE_API_URL` (endereço do backend) e `VITE_USE_MOCKS` (`true` liga o MSW no dev; qualquer outro valor desliga). `.env.development` (commitado) traz `VITE_USE_MOCKS=true` — o mock fica ligado por padrão no dev; `.env.example` documenta as duas; `.env.development.local` (gitignored pelo `*.local`) sobrescreve localmente no dev — `.env.local` não serve, porque no Vite o arquivo do modo (`.env.development`) tem prioridade sobre ele. *(Autor, 2026-11-13; corrigida em 2026-11-14, roteiro da T-10.)*
- **D-11 — TypeScript 6.0 em vez do 7.0:** o template veio com TS ~7.0.2, mas o typescript-eslint só suporta até `<6.1` (o `npm run lint` falhava com "typescript-eslint does not support TS 7.0" e o npm recusava instalar libs novas por conflito de peer). Voltou para ~6.0.3. *(Autor, 2026-11-13. Volta para o 7 quando o typescript-eslint suportar.)*
- **D-12 — Testes de componentes e estilo de formatação:** autorizados `@testing-library/react`, `@testing-library/jest-dom` e `jsdom` (Vitest roda em `jsdom`, setup em `vitest.setup.ts`). Prettier sem ponto e vírgula e com aspas simples (o estilo que o código do template já usava). O Prettier formata também os Markdown fora de `docs/` (`CLAUDE.md`, `.claude/`); `docs/` fica fora para não reformatar o README compartilhado. `test:e2e` usa `--pass-with-no-tests` enquanto não houver e2e. *(Autor, 2026-11-13.)*
- **D-13 — Correção do `npm audit`:** os 9 alertas moderados eram uma única falha (GHSA-g3hv-75wg-m249, negação de serviço no `minimatch` 10), só em ferramentas de desenvolvimento (ESLint e typescript-eslint); o build de release já tinha 0. ESLint atualizado para ^10.15.0 e `overrides.minimatch = ^11.0.8` no `package.json`, porque o typescript-eslint mais novo (8.72.2) ainda pede o `minimatch` vulnerável e o `npm audit fix --force` o rebaixaria para 8.36. **Remover o override** quando o typescript-eslint publicar uma versão com o `minimatch` corrigido (conferir com `npm audit` depois de tirá-lo). *(Pedido do autor, 2026-11-13.)*

- **D-14 — Validação dos dados recebidos com Zod (resolve a P-01):** todo dado do backend entra como `unknown` e passa por um schema Zod antes de virar tipo do contrato (Princípio 2). Zod autorizado e instalado na T-03; schema → tipo num lugar só por inferência. *(Autor, 2026-11-13; alternativa descartada: validadores à mão — sem lib, porém mais código e risco de tipo e validador divergirem.)*
- **D-15 — MSW pelo plugin `msw/vite`:** o worker do MSW não fica em `public/` — o plugin o serve só no dev e só o emitiria no build se algum bundle importasse `virtual:msw`; a inicialização em `src/main.tsx` fica atrás de `import.meta.env.DEV` + `shouldEnableMocks` (D-10), então o build de release não contém código do MSW (verificado na T-03 com busca no `dist/`). *(T-03, 2026-11-13.)*
- **D-16 — Consulta de health sem retry automático:** `useHealth` usa `retry: false` — o erro aparece imediatamente na área de status e os testes ficam determinísticos (o padrão do TanStack Query são 3 tentativas com backoff, ~15 s até o estado de erro). Vale só para esta consulta; o padrão das próximas é decidido quando surgirem. *(T-04, 2026-11-14.)*
- **D-17 — Só tema escuro:** a interface tem um único tema, escuro (menus escuros e texto claro, na linha dos jogos de PS1). Todo estilo é conferido só nele. *(Autor, 2026-11-14; alternativa descartada: escuro e claro, que dobra o trabalho de contraste e testes.)*
- **D-18 — Tipografia (revisada na T-05):** fonte de títulos **Lora** (serifada, licença OFL, arquivo variável `src/ui/fonts/Lora/Lora-VariableFont_wght.ttf`, pesos 400 a 700) **só em títulos e rótulos curtos**; texto corrido, efeitos de carta e tooltips usam a fonte do sistema. O arquivo é servido junto com o app, sem CDN; só o arquivo referenciado entra no build. *(Autor, 2026-11-14. Primeira escolha, a pixelada Press Start 2P, foi descartada pelo autor ao vê-la: visual ruim. Consequência: a identidade PSX fica nas imagens, ícones e animações, como diz README II.5, e não na tipografia.)*
- **D-19 — Faixa de resoluções suportada:** de 1280×720 a 2560×1440; dentro dela o layout se ajusta e não há rolagem horizontal. Os e2e conferem as duas pontas. *(Autor, 2026-11-14.)*
- **D-20 — Textos dos tooltips no frontend:** o catálogo de termos (id do glossário do CONTRATO §2 → nome e texto explicativo em pt-BR) fica em `src/ui/`. O texto descreve o termo para o jogador; não calcula nem decide regra. Cada texto é aprovado pelo autor na tarefa que o acrescenta. Não muda o contrato. *(Autor, 2026-11-14; alternativa descartada: glossário enviado pelo backend, que exigiria endpoint novo.)*
- **D-21 — Valores da base visual:** `src/ui/tokens.css` é a fonte única dos tokens (cores do tema escuro, escala de tipografia, espaçamentos, movimento). A fonte raiz acompanha o monitor (`clamp(14px, 0.5rem + 0.5vw, 20px)`) e tudo em `rem` escala junto, o que atende a D-09 sem media queries. Movimento: 120 ms (micro), 250 ms (troca de tela), teto 500 ms, easing `cubic-bezier(0.2, 0, 0, 1)`. Paleta e easing foram propostos na T-05 e o autor pode vetá-los; o teste de contraste lê todos os tokens `--color-*` do arquivo e protege o WCAG AA em qualquer troca ou acréscimo de cor. `--color-border` é só decorativo e fica fora do teste; um contorno informativo (campo, botão) exige token próprio com 3:1. *(T-05, 2026-11-14.)*
- **D-22 — Imagens do jogo:** originais do autor em `assets-src/` (no Git, nunca editados); as versões do produto são exportadas à mão pelo autor para `src/assets/<categoria>/` (sem lib de conversão). O componente `CardCategory` recebe a entrada do catálogo (rótulo + ícone e imagem, ou `'pending'`); o catálogo de produção `src/ui/categories.ts` começa vazio (as categorias reais chegam na FEAT-04) e os ids `test-…` com SVG ficam em `src/ui/test-assets/`, importados só pelos testes e pela vitrine do laboratório (`src/lab/`, só dev, REQ-07, T-10), então nunca entram no release. Arte pendente: moldura neutra no lugar da imagem, sem ícone, rótulo visível. *(Autor, 2026-11-14.)*
- **D-23 — Laboratório: consultas sem retry e textos por `reason`:** `useLabConfig` e as mutações usam `retry: false` (como a D-16). Os textos por campo do REQ-06 são do frontend, montados de `reason` + `limits` como o contrato pede (CONTRATO §3 FEAT-03); não decidem regra. Campo vazio desabilita "Salvar" porque não há número para enviar (formato, não regra). *(Autor, 2026-11-14, com os rótulos e textos do REQ-06.)*
- **D-24 — Rotas de dev entregues pelo ponto de entrada (T-09):** só `src/main.tsx` importa `src/lab/` (D-08); ele carrega `labRoute` por import dinâmico atrás de `import.meta.env.DEV` e o entrega ao `App` pela prop `devRoutes`. O teste de build é `npm run test:build` (`scripts/check-release-build.mjs`): procura no `dist/` as marcas do laboratório ("Laboratório", `"/lab"`, `src/lab/`) e falha se achar; a `/checar` o roda no lugar do `npm run build`. *(T-09, 2026-11-14; alternativa descartada: liberar `src/App.tsx` para importar `src/lab/` — afrouxaria a guarda.)*
- **D-25 — Tela do laboratório (T-10):** os campos guardam só o que o jogador digitou; "Salvar" envia as chaves cujo número difere de `values` (o backend valida tudo, inclusive não inteiros). Sucesso (salvar ou restaurar) descarta o digitado e mostra o `values` devolvido. Os erros por campo valem até a próxima ação. A área de status mostra o resultado da última ação. As seções têm os títulos "Configuração" e "Componentes". Os testes da tela ficam em `src/lab/LabPage.test.tsx`. *(T-10, 2026-11-14.)*
- **D-26 — Catálogo só no laboratório (FEAT-04):** nesta FEAT o catálogo aparece só em `/lab` (dev). Os componentes de carta ficam em `src/ui/cards/` para as telas das FEATs seguintes. *(Autor, 2026-11-14; alternativa descartada: tela de release `/cartas`, que anteciparia menu e navegação.)*
- **D-27 — Efeitos como texto pronto até a FEAT-11:** efeitos, habilidades, requisitos de resolução e coisa boa/ruim chegam como texto pt-BR pronto do backend; o frontend só exibe. O formato estruturado entra na FEAT-11/12/13 ao lado do texto. *(Autor, 2026-11-14; alternativa descartada: estruturar agora, antecipando a FEAT-11.)*
- **D-28 — Categorias reais:** as 8 categorias de equipamento (`slot`, README 5.1) e as 8 de item (`itemCategory`, README 5.2), com os ids e rótulos do CONTRATO §2.7, entram no catálogo de produção `src/ui/categories.ts` como "arte pendente" (D-22) até o autor entregar as artes. *(FEAT-04, 2026-11-14.)*
- **D-29 — Cliente do catálogo (T-11):** o handler do MSW de `GET /catalog/collections/:collectionId/cards` é uma **tabela de cenários**: escolhe a resposta pronta pelo pedido (coleção `fixture` sem `type` → as 6 cartas; `type` conhecido → a lista daquele tipo, escrita à mão; `type` desconhecido → `400 CATALOG_QUERY_INVALID`; outra coleção → `404 COLLECTION_NOT_FOUND`), sem filtrar nem calcular. O schema Zod confere o formato e as faixas numéricas declaradas no contrato; invariantes entre campos (zona `urban` com 4 setas, `attributeKind` × número de atributos, `startEvent` presente, `enemyTypes` sem repetição) ficam com o backend. `useCollections` e `useCards` sem retry (como D-16/D-23). `CATALOG_QUERY_INVALID` fica `ApiError` genérico (a tela só usa a `message`). Fixtures em `src/mocks/catalogFixtures.ts`; só a carta de atributo é cópia exata do contrato, as outras 5 são provisórias até o `implementado (BE)`. *(Autor escolheu a tabela de cenários, 2026-11-14; alternativa descartada: resposta fixa, que deixaria o filtro inerte no dev.)*
- **D-30 — Cartas de atributo, equipamento e item (T-13):** componentes `AttributeCard`, `EquipmentCard` e `ItemCard` em `src/ui/cards/`, cada um um `article` com o nome como título; partes comuns em `parts.tsx` (moldura com nome, raridade e flavor; listas rotuladas "Atributos", "Modificadores", "Etiquetas", "Classes", "Habilidades", "Efeitos", que somem quando vazias). Os 7 modificadores entram no catálogo de termos (D-20) com textos resumidos do README 7.1; a vitrine do laboratório (REQ-07) segue mostrando só os 9 atributos. Números só formatados em pt-BR (`format.ts`: vírgula decimal, sinal "+"/"−"), sem conta. Encantamento aparece sob o título "Encantamento". *(Autor aprovou os textos dos modificadores como resumo do README 7.1, 2026-11-14.)*
- **D-31 — Cartas de zona e de evento (T-14):** `ZoneCard`, `RandomEventCard` e `CombatEventCard` em `src/ui/cards/`, no mesmo molde da D-30 (título no lugar do nome; zona e eventos sem raridade, zona sem flavor). Rótulos das ações de zona em `src/ui/labels.ts` (`zoneActionLabels`, CONTRATO §2.5; a linha "Pegar / Continuar / Finalizar missão" vira três rótulos). Efeito de zona escrito "Positivo: …"/"Negativo: …". Eventos: blocos "Coisa boa" e "Coisa ruim", "Sem fuga" como texto. Cada inimigo é uma `section` com título "{count}× {name}" (só o nome quando 1), listas "Tipos", "Modificadores" (os 7, na ordem do §2.3, como termo do jogo) e "Habilidades", e as linhas "Criatura: …", "Categoria: …", "Elemento: …", "Vida {n}", "Vigor {n}", "Comportamento: …". *(T-14, 2026-11-14.)*
- **D-32 — Campanha solo no frontend (FEAT-05):** primeiras telas de release: `/` (menu e "Seus jogos"), `/novo` e `/grupo/:partyId` (autor, 2026-11-14; alternativa descartada: tudo em `/`, sem link direto nem voltar do navegador). "Continuar" e criar só **navegam** para `/grupo/:partyId`; é a tela do grupo que envia `POST …/session` ao abrir, apoiada no "Continuar" sem efeito num grupo já em sessão (contrato). "Abandonar" fica na lista, com diálogo de confirmação (autor; alternativas descartadas: sem confirmação, ou só dentro do grupo). Encerrar sessão e abandonar voltam à lista com a mensagem de status (autor). Os textos por campo do REQ-15 são do frontend, montados de `reason`; os limites 40/24 vêm do `CreatePartyRequest` do contrato (CONTRATO v0.14), não do README. Data e hora de `savedAt` só formatadas (`Intl.DateTimeFormat('pt-BR')`, fuso do jogador). Consultas e mutações sem retry (como D-16). O MSW não guarda estado (princípio 3): o handler é uma tabela de cenários (como D-29) e a lista não muda depois de criar ou abandonar; o efeito real (lista atualizada, `404` depois do abandono) é conferido contra o backend real. *(FEAT-05, 2026-11-14.)*
- **D-33 — Controles do catálogo no laboratório (T-15):** coleção num grupo de rádios "Coleção" com a primeira já escolhida; tipo num grupo de rádios "Tipo de carta", "Todos" escolhido de início, quantidade no rótulo ("Zona (1)", "Todos" com a soma); cartas como lista "Cartas" de botões "{nome} · {tipo}", a escolhida com `aria-pressed`, carta completa ao lado. Trocar coleção ou tipo limpa a carta escolhida. A seção tem a própria área de status (a da "Configuração" segue separada). *(Autor, 2026-11-14; alternativas descartadas: caixas de seleção, que escondem as contagens; nenhuma coleção pré-escolhida, um clique a mais.)*
- **D-34 — Cliente da campanha (T-16):** hooks em `src/api/parties.ts`; `requestJson` aceita `DELETE` e devolve `undefined` no `204`. Datas validadas como ISO 8601 UTC com `Z` (`z.iso.datetime()`). `PARTY_INVALID` com `details` válido vira `PartyInvalidError` (com `fields`); fora do contrato, erro genérico (como D-23). Handlers do MSW por tabela de cenários (D-29): `POST /parties` devolve a fixture de erro só para os corpos exatos dos dois cenários de erro do contrato e o grupo de exemplo para qualquer outro corpo (não valida); as rotas de grupo respondem para o `id` de exemplo (`party-os-teimosos`) e `404 PARTY_NOT_FOUND` para os outros. `GET /parties/:partyId` fica sem hook e sem handler (não está em 3.4). Fixtures em `src/mocks/partyFixtures.ts`; `id` e datas são exemplos fixos. *(T-16, 2026-11-15.)*
- **D-35 — Menu inicial e abandono (T-17):** "Seus jogos" em `src/features/home/SavedGames.tsx`, numa `section` com título (região "Seus jogos") e sua área de status; a da ponte (REQ-01) continua fora dela. A mensagem de uma ação ("Grupo abandonado." ou o erro) tem precedência sobre o estado da consulta e fica até o próximo "Abandonar". O diálogo é próprio (`div` com `role="dialog"` e `aria-modal`), não o `<dialog>` nativo (`showModal` sem suporte no jsdom); foco inicial em "Cancelar", Esc fecha, foco volta ao "Abandonar" do save; **sem** prender o Tab dentro do diálogo (o REQ-17 não pede; fica para a `/visual` ou um REQ, se o autor quiser). Confirmar fecha o diálogo na hora e a mensagem chega com a resposta. Data: `Intl.DateTimeFormat` pt-BR de data e de hora juntas com espaço ("14/11/2026 18:30", sem a vírgula do `dateStyle`+`timeStyle`). Testes no fuso fixo `America/Sao_Paulo`; sem `@testing-library/user-event` (não autorizada), com `fireEvent`. *(T-17, 2026-11-15.)*
- **D-36 — Tela "Novo jogo" (T-18):** `src/features/party/NewGame.tsx`, num `form` com `noValidate` (a validação é do backend). O erro de cada campo fica num parágrafo logo abaixo dele, ligado por `aria-describedby` só enquanto existe. A área de status (papel `status`) vem depois do botão "Criar grupo"; o link "Voltar" fica no fim. Os textos derivam do último envio (estado da mutação), então somem ao enviar de novo. `PARTY_INVALID` com `details` fora do contrato mostra "Servidor indisponível. Tente novamente." (T-16). Até a T-19, `/grupo/:partyId` não tem tela.
- **D-37 — Tela do grupo em sessão (T-19):** `src/features/party/PartySession.tsx` em `/grupo/:partyId`. O `POST …/session` sai num efeito ao abrir. No StrictMode do dev o efeito roda duas vezes e o pedido também, mas sem consequência: pelo contrato, Continuar repetido não muda o grupo. Por isso não há guarda. Ordem da área de status: erro do encerrar, erro do abrir, "Abrindo o grupo…" até o `200`, vazio depois. Quando o encerrar falha, o grupo continua na tela e o botão volta a ficar habilitado. "Voltar ao início" só aparece com `PARTY_NOT_FOUND`. "Sessão encerrada." chega a "Seus jogos" pelo `state` da navegação (`{ message }`, lido como `unknown`), com a mesma precedência da D-35; recarregar `/` no navegador pode mostrá-la de novo, porque o histórico guarda o `state`. `formatSavedAt` saiu de `SavedGames.tsx` para `src/ui/formatSavedAt.ts`, compartilhado pelas duas telas. *(T-19, 2026-11-15.)*
- **D-38 — Editor: texto dos erros por campo vem pronto do backend:** em `CONTENT_INVALID` e `CONTENT_ID_TAKEN`, cada item de `details.fields` traz o caminho do campo (ex.: `modifiers.1.value`) e o texto pt-BR pronto; o frontend só liga o texto ao campo. *(Motivo: as conferências de conteúdo são muitas e são regra (README 3.4, 4.3, 5.1, 14.1, 18.1); montar o texto por `reason` no frontend, como a D-23, espalharia regra pela tela. A D-23 continua valendo para a configuração do laboratório.)*
- **D-39 — Editor de conteúdo (FEAT-31):** decisões do autor de 2026-11-15: (1) o backend grava o conteúdo em arquivos JSON no repositório dele (versionados no git); (2) cada carta é rascunho ou publicada; só as publicadas entram no catálogo (REQ-08) e nas partidas; (3) o editor cresce com cada FEAT, que acrescenta ao formulário o que trouxer (FEAT-11 efeitos estruturados, FEAT-15 missões, FEAT-16 boosters e estoque do mercado, FEAT-17 encantamentos do ferreiro, FEAT-18 montarias, FEAT-19 Carta de Dimensão e dimensão de lançamento da coleção); (4) id imutável depois de publicado e nada usado em saves é excluído (Apêndice B, T1). Outras escolhas desta spec: o editor fica em `src/lab/editor/` (só dev, D-07) na rota `/lab/editor`; editar uma carta publicada grava direto, sem rascunho paralelo (ferramenta de dev); a busca e os filtros são feitos pelo backend, como no catálogo; a pré-visualização confere só o **formato** com o schema Zod do `Card` antes de montar a carta, sem regra. *(Fora desta FEAT: upload de imagens (as artes seguem a `/assets`), efeitos estruturados, ofertas de serviço das zonas, missões, montarias, Carta de Dimensão, boosters.)*
- **D-40 — Cliente do editor (T-20):** hooks em `src/api/editor.ts`; `requestJson` aceita `PUT`. Todo pedido do editor passa por um helper que converte `CONTENT_INVALID` e `CONTENT_ID_TAKEN` em `ContentInvalidError` (subclasse de `ApiError`, `code` preservado, `fields` = `details.fields`); `details` fora do contrato → erro genérico (como D-23/D-34). Os outros códigos (`CONTENT_IN_USE`, `CONTENT_LOCKED`, `*_NOT_FOUND`) ficam `ApiError` (a tela usa a `message`). Todas as consultas ficam sob a chave `['editor']`; toda mutação que grava (criar, editar, excluir, importar, salvar, publicar, duplicar) invalida essa chave no sucesso, porque contagens e listas mudam juntas. Exportar é mutação (disparado por clique, sem cache). Filtros vazios não vão na URL (`q` vazio também não). O schema confere o formato do contrato; `classes` do export é `unknown[]` (com `[]` quando ausente) e `classCount` tem padrão 0 até a FEAT-06 tipar `EditorClass`. Sem retry. Handlers do MSW por tabela de cenários, sem estado (D-29): coleções conhecidas `fixture` e `bosque` (o `bosque` já renomeado "Bosque Antigo"); criar com `id` "Bosque X" → `400`, com `fixture` → `409` (o cenário "repetir o pedido" precisaria de estado), qualquer outro → o `bosque`; a lista de cartas do `bosque` responde a de rascunho com `status=draft` e as duas cartas nos outros casos; `type` desconhecido → `400`; a validação de dimensão devolve o resultado da `fixture` para qualquer coleção conhecida; publicar uma carta do `bosque` devolve a `forca-bruta` publicada; duplicar qualquer carta conhecida devolve a cópia do cenário; importar devolve `400` só para o corpo `{}` do cenário (o MSW não valida). Ids conhecidos são conferidos por chave própria (`Object.hasOwn`). Os handlers valem só para os ids e corpos dos cenários; fora deles, a resposta é um exemplo. Atenção: o schema descarta campos desconhecidos, então quando uma FEAT acrescentar campos ao `Card` ou ao export, o schema precisa ganhá-los antes que o export baixado (REQ-26) os perca. Fixtures em `src/mocks/editorFixtures.ts`; as 6 cartas da `fixture` vêm de `catalogFixtures.ts`. *(T-20, 2026-11-15.)*

- **D-41 — Roteador de dados e editor de coleções (T-21):** `src/main.tsx` usa `createBrowserRouter` com uma rota `*` que monta o `App` (que segue com as próprias `<Routes>`), para o `useBlocker` do REQ-24 pegar qualquer saída de rota, inclusive o Voltar do navegador (autor, 2026-11-16; alternativa descartada: perguntar só nos controles do editor, sem cobrir o Voltar). Os testes de telas com bloqueio usam `createMemoryRouter` + `RouterProvider`; os outros seguem com `MemoryRouter`. O hook `useUnsavedGuard` (`src/lab/editor/`) junta o bloqueio de rota, o `beforeunload` e as ações da própria tela; o formulário de carta (T-23) o reaproveita. O `ConfirmDialog` do editor segue o molde da D-35. Ao abrir o editor, nenhuma coleção vem escolhida (autor). Cada coleção é um botão com `aria-pressed`; o painel tem as listas "Por tipo" e "Por raridade". Erros por campo num parágrafo abaixo do campo (como a D-36). Precedência na área de status: mensagem da última ação, depois a consulta da lista, depois a da coleção escolhida (como a D-35). A marca "Editor de conteúdo" entra no `test:build`.
- **D-42 — Lista de cartas do editor (T-22):** a seção "Cartas" (`src/lab/editor/CardsSection.tsx`) aparece abaixo de "Coleções" quando a coleção escolhida carregou, e recomeça (filtros, busca, escolha) ao trocar de coleção. Filtros como no catálogo: grupos de rádio "Tipo de carta" ("Todos" + os 6) e "Situação" ("Todas", "Rascunho", "Publicada"); a busca é um campo de busca num formulário (`role="search"`) que consulta 300 ms depois da última tecla ou na hora com Enter (autor, 2026-11-16). Cada carta é um botão com `aria-pressed`. "Nova carta" abre o grupo "Tipo da nova carta" com 6 botões; escolher um tipo fecha o grupo e desmarca a carta escolhida. Até a T-23, escolher carta ou tipo só guarda a escolha, sem formulário (autor, 2026-11-16); a T-23 liga o formulário e a guarda do REQ-24 a essa escolha. Erros da lista na área de status da seção (`message` ou o texto genérico).
- **D-43 — Formulário de carta (T-23):** `src/lab/editor/CardForm.tsx` (seções "Carta" e "Pré-visualização", lado a lado) e o modelo `cardFormValues.ts` (valores ↔ `CardInput`). Os valores ficam no formato do formulário: números como texto, seleções com a opção vazia "Escolha…". "Salvar rascunho" fica desabilitado enquanto falta formato: texto obrigatório em branco (identificador, nome/título, local, texto de cada efeito), seleção não feita (tipo de zona, raridade, tipo, cada atributo) ou número que não é número; "Texto de ambientação" em branco vai como `null`. A pré-visualização aparece quando o corpo existe **e** a carta montada (`<collectionId>.<slug>`) passa no schema do `Card` (ex.: setas fora de 1 a 4 mostram o aviso). As ações de zona vão na ordem do glossário (§2.5). Cada campo, inclusive dentro de listas, usa o caminho do corpo enviado (`effects.1.text`, `attributes.0`); o erro de um caminho aparece abaixo do campo ou do grupo (lista, caixas), ligado por `aria-describedby`, até o próximo envio. Itens de lista: "Efeito {n}", "Polaridade do efeito {n}" (seleção "Positivo"/"Negativo"), "Atributo {n}". O formulário guarda o próprio estado: depois de salvar, mostra a carta devolvida sem recarregar (renomear um rascunho não fecha o formulário) e só a marcação da lista passa para o id novo. Carta salva: "Carregando carta…" enquanto a consulta não chega; erro com a `message` ou o texto genérico. **Uma guarda só no editor:** o `useBlocker` aceita um bloqueio por roteador, então `CollectionsSection` tem o único `useUnsavedGuard`, com sujo = coleção **ou** carta (o texto diz "desta coleção" quando a coleção tem alterações, senão "desta carta"); a seção "Cartas" usa essa guarda em "Nova carta" (que fecha o formulário aberto) e na escolha de outra carta, e o formulário avisa o sujo por `onDirtyChange`. `FullCard` saiu de `CatalogSection.tsx` para `src/ui/cards/FullCard.tsx` (catálogo e pré-visualização). Até a T-25, os eventos continuam só com a escolha, sem formulário (como a D-42). *(T-23, 2026-11-16.)*
- **D-44 — Formulários de equipamento e item (T-24):** em `CardForm.tsx` e `cardFormValues.ts`, no molde da D-43. Rótulos: "Slot" e "Categoria" (rótulos de `categories.ts`), "Etiqueta {n}", "Modificador {n}" (nomes do glossário, D-30) e "Valor do modificador {n}", com a marca "Principal" no primeiro; "Nome da habilidade {n}" e "Texto da habilidade {n}"; "Restrição de classe" em caixas na ordem do glossário (§2.4); "Bloqueia escudo", "Pico mínimo", "Ajuste de preço" (campo de texto, número com ponto, iniciado em "1"). "Refino" e "Encantamento" são caixas: ligadas, mostram "Nível máximo" e "Materiais" ou "Texto do encantamento", e o que foi digitado fica guardado ao desligar; desligadas, o corpo leva `null`. Formato que desabilita "Salvar rascunho": além da D-43, valor de modificador não numérico ou modificador não escolhido, pico preenchido que não é número, ajuste vazio ou não numérico, nome ou texto de habilidade em branco, etiqueta ou efeito em branco, e refino ou encantamento ligados com campo vazio ou nível não numérico; "Pico mínimo" vazio vai como `null`. As etiquetas já usadas na coleção (`tags` de `useEditorCollection`, a mesma consulta da seção "Coleções", sem pedido novo) entram como sugestão num `datalist` por campo de etiqueta. Limites e combinações (ex.: nível de 1 a 10, ajuste de 0,8 a 1,5, escudo fora de arma) seguem com o backend (README 5.1, `CONTENT_INVALID`, D-38). *(T-24, 2026-11-16.)*
- **D-45 — Formulários de evento aleatório e de combate (T-25):** no molde da D-43, os seis tipos têm formulário (sai o `hasForm`). Comuns aos dois eventos: "Título", "Texto de ambientação" (em branco = `null`), "Coisa boa", "Coisa ruim" (textos obrigatórios; caminhos `goodOutcome.text` e `badOutcome.text`) e a caixa "Sem fuga". Evento aleatório: "Requisitos", itens "Requisito {n}" (caminho `requirements.{n}.text`). Evento de combate: lista "Inimigos"; os campos de cada inimigo levam o sufixo " do inimigo {n}" para nomes acessíveis únicos ("Nome do inimigo 1", "Quantidade…", grupo "Tipos…" em caixas na ordem do glossário, "Criatura…", "Categoria…", "Elemento…" com a opção vazia "Sem elemento" = `null`, "Vida…", os 7 modificadores com o nome do glossário (D-30), "Vigor…" (vazio = `null`), lista "Habilidades…" com "Nome da habilidade {j} do inimigo {n}" e "Texto da habilidade {j} do inimigo {n}", "Comportamento…"); caminhos `enemies.{n}.<campo>` e `enemies.{n}.modifiers.<modificador>`. Inimigo novo começa com quantidade "1" e modificadores "0"; o resto vazio. Formato que desabilita "Salvar rascunho": texto obrigatório em branco (título, coisa boa, coisa ruim, requisito, nome e criatura do inimigo, nome ou texto de habilidade), seleção não feita (categoria, comportamento) ou número inválido (quantidade, vida, modificadores, vigor preenchido). Listas vazias (requisitos, inimigos, tipos) não bloqueiam: o mínimo de 1 é regra do contrato e vem do backend (D-38); a pré-visualização mostra o aviso enquanto a carta não passa no schema. *(T-25, 2026-11-16.)*
- **D-46 — Publicar, duplicar e excluir no formulário (T-26):** "Publicar", "Duplicar" e "Excluir carta" ficam no formulário de carta, depois de "Salvar rascunho", sempre visíveis; numa carta ainda não salva ficam desabilitados, e todos os botões de envio ficam desabilitados enquanto um pedido está em curso. O "{nome}" dos diálogos é o "Nome" (ou "Título", em zona e eventos) da última versão salva. Os diálogos usam o `ConfirmDialog` do editor (foco inicial em "Cancelar", Esc cancela). "Duplicar" abre a cópia direto da resposta do backend, sem novo `GET`, e não pergunta por alterações não salvas (o REQ-24 não lista "Duplicar"; alterações não salvas da carta de origem se perdem). "Carta excluída." aparece na área de status da seção "Cartas", porque o formulário fecha; some ao abrir outra carta ou "Nova carta". Erros de publicar e de excluir (`CONTENT_INVALID`, `CONTENT_IN_USE` e outros do §1.4) aparecem na área de status do formulário, como no salvar. *(T-26, 2026-11-16.)*
- **D-47 — Validar, exportar e importar na seção "Coleções" (T-27):** "Validar como dimensão" e "Exportar" ficam no painel da coleção escolhida, depois de "Excluir coleção"; "Importar coleção" (campo de arquivo `.json`) e a caixa "Substituir se já existir" ficam logo abaixo de "Nova coleção", sempre visíveis. A lista "Problemas" fica sob a área de status e some a cada nova validação, exportação, importação ou troca de coleção; na importação com `CONTENT_INVALID` cada item é "{campo}: {texto}" (só o texto, se o caminho for vazio); com `CONTENT_ID_TAKEN` só a `message` aparece na área de status. O arquivo exportado é o JSON recebido e validado pelo schema do contrato, com recuo de 2 espaços. Importar com alterações não salvas pergunta antes (a importação troca a coleção escolhida, o que descartaria o formulário; o REQ-24 não lista "Importar"). *(Motivo: evitar perder digitação em silêncio; vantagem: coerente com a escolha de outra coleção; desvantagem: o diálogo aparece depois de o arquivo ser escolhido.)*$
- **D-48 — Preparação da partida (FEAT-06):** (1) a tela do grupo mostra do mapa só a dimensão e a cidade inicial; o mapa (zonas, setas, travessias) chega validado no `Party`, mas o desenho é da FEAT-07 (autor, 2026-11-16; alternativa descartada: lista textual do mapa, descartável na FEAT-07); (2) a classe é escolhida por rádios com o detalhe da escolhida (modificadores base e deck pré-pronto), sem pré-escolha (autor; alternativas descartadas: só nomes; caixa de seleção); (3) a mão aparece com as cartas completas do REQ-09 (autor; alternativa descartada: só nomes, que adiaria o visual da mão para a FEAT-09); (4) nomes de cartas e classes vêm do catálogo (`GET /catalog/cards/:cardId`, uma consulta por id distinto, cacheada; `GET /catalog/classes`); (5) os textos por `reason` de `playerClass` são do frontend, como a D-32; os de `DIMENSION_INVALID` vêm prontos do backend (D-38); (6) o MSW segue sem estado (D-29, D-34): o `Party` de exemplo é a cópia do cenário do contrato com uma mão e um mapa fixos. *(Planejamento da FEAT-06, 2026-11-16.)*
- **D-49 — Cliente da FEAT-06 e estado intermediário (T-28):** schemas e fixtures do CONTRATO v0.21 §3 FEAT-06 em `src/api/` (`catalog.ts`: `dimensionCardSchema`, `arrowLayout`, `classDefinitionSchema`, `modifierValuesSchema`, `useClasses`, `useCatalogCard` com `staleTime: Infinity`; `parties.ts`: `PlayerState`, `PartyDimension`, `DimensionInvalidError` com `problems` e `dimensionCardId`; `labConfig.ts`: 11 chaves). `CreatePartyRequest.playerClass` é opcional no tipo porque o REQ-29 manda o corpo sem ele quando nada foi escolhido. O schema não confere atributos essenciais repetidos (regra do backend). Fixtures: só a Carta de Dimensão e a classe `warrior` são cópias do contrato; as outras 5 cartas novas e a `rogue` são provisórias até o `implementado (BE)` (como a D-29). **Estado intermediário até as tarefas indicadas** (autor, 2026-11-16: "só o mínimo para compilar"): os 11 rótulos do REQ-27 e o rótulo "Dimensão" já aparecem (testes na T-29); `FullCard` devolve `null` para a Carta de Dimensão (T-29); no editor, a Carta de Dimensão é escolhida sem formulário e fica fora de "Nova carta", e a zona guarda o `arrowLayout` recebido sem mostrá-lo, carta nova com `null` (T-33); o handler padrão não tem o cenário `required` (T-30), para o "Novo jogo" seguir criando grupo no dev; `validate-dimension` da `fixture` continua o resultado antigo (T-32). (encerrado na T-32, D-52) Testes e e2e que fixavam os dados antigos do contrato (6 cartas, contagens, corpo da zona) foram alinhados aos novos. *(T-28, 2026-11-16.)*
- **D-50 — Escolha de classe no "Novo jogo" (T-30):** o grupo "Classe" é um `radiogroup` rotulado pelo texto "Classe"; cada rádio mostra "{name} ({atributos essenciais separados por vírgula})", com os atributos como termo do jogo. Enquanto o nome de uma carta do deck pré-pronto não chega, o item mostra "{copies}× …". O handler padrão do MSW passa a responder `required` para "Os Teimosos"/"Lia" sem `playerClass` (fim do estado intermediário da D-49 nesta tela). *(T-30, 2026-11-16.)*
- **D-51 — Partida preparada na tela do grupo (T-31):** os nomes vêm de `useClasses` e do hook novo `useCatalogCards` (dimensão, cidade inicial, zona atual e respawn de cada membro e cartas da mão, uma consulta por id distinto). "Carregando a partida…" vale enquanto qualquer uma dessas consultas não chega; o primeiro erro entre elas vai para a área de status. Até o nome chegar, o texto mostra "…" e a mão só mostra as cartas recebidas. "Ordem dos jogadores" é um título de nível 2 que rotula a lista; cada membro é uma `section` com título de nível 2 (`characterName`) e a "Mão ({n})" uma `section` com título de nível 3, com `n` = tamanho de `hand` mesmo antes de as cartas chegarem; "Modificadores" é uma lista com "{valor} {termo}", como os "Modificadores base" do REQ-29. *(T-31, 2026-11-16.)*
- **D-52 — Cliente do editor: classes (T-32):** `ClassInput`, `EditorClass` e `EditorClassSummary` reaproveitam `classDefinitionSchema` e `playerClassSchema` do catálogo; `CollectionExport.classes` valida cada item como `EditorClass` (sem item fora do contrato) e segue `[]` quando ausente (D-40); `CardInput` já cobria `dimension` e `arrowLayout` desde a T-28 (é o `Card`). `CLASS_NOT_FOUND`, `CONTENT_REFERENCED` e `CONTENT_LOCKED` de classe chegam como `ApiError` comum. MSW sem estado (D-40): `GET …/classes` responde `fixture` → `rogue`, `warrior` publicadas e `bosque` → `mage` em rascunho; criar com `warrior`/`rogue` → `CONTENT_ID_TAKEN`, outro → `mage`; publicar `mage` → `CONTENT_INVALID`; `PUT` numa publicada com outro `playerClass` → `CONTENT_LOCKED`; excluir classe conhecida → `204`; excluir `fixture.dexterity-basic` → `CONTENT_REFERENCED`; `validate-dimension` da `fixture` → válida, do `bosque` → 2 problemas (fim do estado intermediário da D-49 nesse ponto). **Provisórios até o `implementado (BE)`** (como a D-29): os campos que o contrato omite no `mage` (nome "Mago", modificadores), os textos de `fields[].message` das classes e o texto e a ordem do problema da Carta de Dimensão no `bosque`. Extensões e limites da tabela sem estado: `rogue` também responde `CONTENT_ID_TAKEN`; `CONTENT_LOCKED` de classe reusa o texto do contrato (que fala em carta) até o BE confirmar; `CONTENT_REFERENCED` responde sempre (o "sem grupos" do cenário não se reproduz); `CONTENT_IN_USE` de classe e o `404` depois de excluir o `mage` não têm cenário (os testes da T-34 usam `server.use`). Os testes que fixavam a `fixture` inválida (e2e do REQ-25 e "nova validação apaga a lista") foram alinhados. *(T-32, 2026-11-16.)*
- **D-53 — Carta de Dimensão e forma das setas no editor (T-33):** sai o `hasForm`: os 7 tipos têm formulário e "Nova carta" oferece os 7, na ordem do glossário ("Dimensão" por último). Formulário da Carta de Dimensão no molde da D-43: "Nome" e "Ordem de lançamento" (número) obrigatórios; "Texto de ambientação" e "Zona de chegada" em branco = `null`; "Zona de chegada" é campo de texto livre, sem sugestão (o backend confere o título, D-38); efeitos com caminho `effects.{n}.text`. "Forma das setas" é uma seleção cuja opção vazia é "Não se aplica" (`null`); os rótulos do editor são "Opostas"/"Vizinhas" (os da carta, REQ-28, seguem "Setas opostas"/"Setas vizinhas"). Fim do estado intermediário da D-49 no editor; o e2e que contava 6 tipos em "Nova carta" foi alinhado. *(T-33, 2026-11-16.)*
- **D-54 — Classes no editor (T-34):** a seção "Classes" (`src/lab/editor/ClassesSection.tsx`) aparece depois de "Cartas" quando a coleção escolhida carregou e recomeça ao trocar de coleção; cada classe é um botão com `aria-pressed`. O formulário (`ClassForm.tsx`, região "Classe"; modelo `classFormValues.ts`) segue a D-43 e a D-46: estado próprio, números como texto, "Salvar classe" desabilitado sem formato (classe não escolhida, nome em branco, atributo essencial não escolhido, modificador ou cópias não numéricos, carta em branco); "Publicar classe" e "Excluir classe" sempre visíveis, desabilitados numa classe não salva (publicar também fora de rascunho ou com alterações). A seleção "Classe" fica **desabilitada** numa classe publicada (o `select` não tem `readOnly`). Os 7 modificadores base levam o nome do glossário como rótulo (D-30), caminhos `baseModifiers.<modificador>`; o deck usa `starterDeck.{n}.cardId` e `starterDeck.{n}.copies`. A sugestão de "Carta {n}" é um `datalist` com as cartas de `useEditorCards(coleção, { type: 'attribute' })` (o backend filtra). "Classe salva."/"Classe publicada." na área de status do formulário; "Classe excluída." na da seção, porque o formulário fecha. Limites (1 a 2 essenciais, trava do deck, cópias) seguem com o backend (D-38). A guarda única da D-43 passa a cobrir a classe ("desta classe", depois de coleção e carta na precedência). `CONTENT_REFERENCED` já aparecia pela `message` no formulário de carta (D-46); a T-34 só acrescenta os testes. `useFieldErrors`, `options` e `attributeOptions` saíram de `CardForm.tsx` para `formHelpers.tsx` (regra do Fast Refresh), e `TextField`, `SelectField` (com `disabled`) e `ListField` passaram a ser exportados. No MSW a lista de coleções só traz a `fixture`; os unitários acrescentam o `bosque` com `server.use` e o e2e cria a classe na `fixture`. *(T-34, 2026-11-16.)*
- **D-55 — Mapa e Movimentar (FEAT-07):** (1) o mapa é uma grade pelas posições recebidas, com títulos, setas e ligações das travessias; o acabamento é da FEAT-30 (autor, 2026-11-17; alternativa descartada: lista textual, descartável); (2) mover é em dois passos: escolher a zona no mapa (que mostra a carta completa) e clicar "Movimentar para {title}" (autor; vantagem: sem movimento acidental e a zona é lida antes; desvantagem: dois cliques; alternativas descartadas: clique direto na zona, lista de destinos fora do mapa); (3) o botão só aparece para zonas de `moveTargets`, e as ligações e "Travessias com" vêm só de `crossings`: o frontend não deduz travessia de setas nem de vizinhança (README 3.5 é do backend); (4) a tela mostra a resposta da ação, sem novo `GET` (o `200` já traz o `Party` gravado); (5) o MSW segue sem estado (D-29): o `POST …/actions` responde por tabela de cenários com `Party` fixos do mapa de exemplo, um por destino conhecido, e os erros do contrato por corpo; (6) os títulos das zonas do mapa vêm de `useCatalogCards`, como os da D-51. *(Planejamento da FEAT-07, 2026-11-17.)*
- **D-56 — A vez (FEAT-08):** (1) o botão de uma ação só aparece se o tipo está em `availableActions` (some, não fica desabilitado; vantagem: igual à D-55 item 3, a tela nunca oferece o que o backend recusaria; desvantagem: o jogador pode não entender por que o botão sumiu, por isso o aviso "Sem pontos de ação para Movimentar."); (2) "Encerrar a vez" sem confirmação (vantagem: um clique, e no solo não há prejuízo além dos pontos não usados; desvantagem: clique acidental perde os pontos; alternativa: confirmar quando `actionPoints > 0`, fica para a FEAT-30 se o autor quiser); (3) o MSW segue sem estado (D-29): `Party` fixos por cenário (após 1 movimento: 2 pontos; com 0 pontos: só `endTurn`; após `endTurn`: rodada 2 com pontos cheios); o `move` de um `Party` com 0 pontos responde `409` `noActionPoints` por tabela; (4) sem valor novo no laboratório: `actionPointsPerTurn` já está lá (FEAT-03); (5) o cenário "0 pontos" do MSW é escolhido pelo `id` do grupo (`party-sem-pontos`), já que o handler não tem estado nem lê o `Party` (T-38); (6) o termo `actionPoints` entra no catálogo de termos com o texto "O que o jogador pode gastar na vez com ações de zona, como Movimentar. Renovam a cada vez." (aprovado pelo autor) e o `Term` ganha um rótulo opcional para a flexão ("1 ponto de ação"); o botão "Encerrar a vez" já nasce dependendo de `endTurn` em `availableActions` (REQ-37 item 2), pois a T-39 cria o botão (T-39). (7) o handler de `POST /parties/:partyId/session` devolve o `partyNoPointsFixture` para o grupo `party-sem-pontos` (antes devolvia o grupo de 3 pontos), para a tela e o e2e mostrarem o cenário "0 pontos" (T-40). *(Planejamento da FEAT-08, 2026-11-17; item 7 na T-40.)*
- **D-57 — Deck de atributos (FEAT-09):** (1) Recuperar são três botões diretos, sem confirmação (vantagem: um clique; desvantagem: "Mão no deck" esvazia a mão num clique acidental, e o ponto se perde; alternativa: confirmar a opção (b), fica para a FEAT-30 se o autor quiser). Os rótulos não citam "até 7" porque `recoverHandSize` não chega no `Party` (só no laboratório); o número fica para o backend. (2) Ajustar deck é um formulário com o número de cópias na build por carta (build ∪ pasta), e não uma troca carta a carta (vantagem: o contrato pede a build inteira, e o formulário é uma linha por carta; desvantagem: não mostra quanto sobra na pasta enquanto se digita, porque isso seria refazer a conta do backend). O frontend só confere se o campo é um inteiro ≥ 0 (formato do pedido); mínimo, cópias, posse e espaço na pasta são do backend (`ACTION_NOT_ALLOWED`). (3) Sem diálogo de alterações não salvas no "Ajustar deck" (escopo; o rascunho some ao cancelar ou sair). (4) A "Pasta de TCG" mostra a capacidade, não "ocupado/capacidade": a ocupação não vem pronta (§1.3). (5) Sem termos novos com tooltip nesta FEAT (os textos precisariam de aprovação; ficam para a FEAT-30 ou um pedido do autor). (6) O MSW segue sem estado (D-29): `Party` fixos por resposta (após `recover` de cada opção, após `adjustDeck` sem mudança) e `409` por tabela: `adjustDeck` com build abaixo de 60 cartas → `buildBelowMinimum`; com cópias acima da build + pasta da fixture → `notOwned` com o `cardId`. Na T-41: a tabela compara a build enviada exatamente com as dos cenários do contrato (`S` 29, `S` 31, `fixture.dexterity-basic` 1 a mais); qualquer outra build recebe o `200` sem mudança; `recover` com opção desconhecida → `400` `unknownOption`, antes do `noActionPoints` (ordem do contrato). O `400` de `adjustDeck` (`notPositiveInteger`, `duplicateCard`) não entra no MSW: o formulário do REQ-42 não envia esses corpos. `ACTION_NOT_ALLOWED` vira `ActionNotAllowedError` (`reason`, `cardId`); um `reason` fora do contrato vira erro de validação ("Servidor indisponível"), como todo `details` fora do contrato (D-01). Os 5 rótulos do REQ-39 entraram no `LabPage` na T-41, porque o tipo `Record<GameConfigKey>` os exige (como na D-49). (7) Contra o backend real a pasta começa vazia e nada a enche nesta FEAT; a validação cobre Recuperar, Ajustar deck sem mudança e as recusas. (8) O limite de cópias ao publicar classe (CONTRATO FEAT-06/31) já aparece no campo `starterDeck.N.copies` do editor (REQ-32): sem tarefa. (9) Os erros do "Ajustar deck" aparecem só na seção, não na área de status (o REQ-42 os põe na seção; repetir seria ruído); o sucesso usa a área de status. *(Planejamento da FEAT-09, 2026-11-17; item 9 na T-44.)*
- **D-58 — Inventário, equipar e bolsa (FEAT-10):** (1) equipar e guardar são botões diretos por carta ("Equipar {nome}" no inventário, "Guardar {nome}" no slot), sem confirmação e sem botão "Preparar" separado (vantagem: um clique, a ação é gratuita e reversível; desvantagem: muitos botões com inventário cheio; o arranjo é da FEAT-30). O botão "Equipar" só aparece em slots cuja carta do catálogo é `equipment`: é o tipo da carta (exibição), não regra; Pico, classe e escudo ficam com o backend. (2) A tela mostra os modificadores efetivos como "Modificadores" e os da classe à parte, sem conta (§1.3). (3) A doação fica numa seção do `/lab`, que escolhe grupo e membro, e não num botão na tela do grupo (vantagem: o laboratório fica fora do release, D-07/D-08; desvantagem: ir e voltar entre `/lab` e `/grupo`). A carta é escolhida numa lista do catálogo (coleção e carta, com `useCollections` e `useCards`, sem hook novo), só com os tipos que se doam (equipamento, item, atributo, como diz o contrato); o backend continua conferindo (`notGrantable`) (autor, 2026-11-17; alternativa descartada: id digitado, mais simples e menos cômodo). (4) O MSW segue sem estado (D-29): `Party` fixos por resposta (após equipar `B`, após guardar a arma) e `409` por tabela, pelo `cardId`/`slot` do pedido conforme os cenários do contrato (`D` com `B` em uso → `shieldBlocked`, `H` → `peakRequirementNotMet`, `R` → `classRestricted`, `P` → `notEquipment`, carta fora do inventário → `notInInventory`, `head` → `slotEmpty`); a doação responde o `Party` com `P` em 2 para cartas, ouro 300 para ouro, e os erros do contrato por `cardId`/`memberId` (`fixture.gray-harbor` → `notGrantable`, `fixture.nope` → `CARD_NOT_FOUND`). Uma fixture "com equipamento" (grupo por `id`, como a D-56 item 5) mostra `prepare` no dev. (5) Sem termos novos com tooltip (como a D-57 item 5). (6) T-45: as 5 cartas novas da `fixture` (`short-sword`, `oak-shield`, `iron-helm`, `arcane-wand`, `pickaxe`) foram montadas só com o que os cenários do contrato fixam (slot, modificadores, requisito de Pico, restrição de classe, bloqueio de escudo, categoria), com nomes pt-BR de exemplo, **não** cópia do backend (autor, 2026-11-17; alternativa descartada: pedir o JSON ao backend, exato porém bloqueia a tarefa); a coleção da fixture passa a ter 17 cartas (equipamento 5, item 2). `useLabGrant()` não recebe argumentos (`{ partyId, memberId, grant }` vai na mutação, como na tabela de 3.4). O MSW acrescenta `GET /parties/:partyId` (o grupo criado), a rota da doação (tabela do item 4; `memberId` diferente de `member-lia` → `MEMBER_NOT_FOUND`) e `operation` desconhecida → `400` `unknownOperation`; o grupo `party-com-equipamento` (inventário `B`, `D`, `H`, `R`, `P`×2, com `prepare`) abre pela sessão do MSW. Os 2 rótulos do REQ-43 entraram no `LabPage` já na T-45 (o `Record<GameConfigKey, string>` os exige, como na D-49) e os 7 motivos do Preparar ficam sem texto no `reasonText` do "Ajustar deck" até a T-47. (7) T-46: "Equipamentos" e "Inventário (…)" são título `h3` + lista, como "Build" e "Pasta de TCG" (REQ-40); o teste do REQ-30 passou a conferir "Ouro 10 (bolsa para 300)" e os modificadores ficaram no teste do REQ-44 (alinhamento pedido pelo REQ-44, não ajuste para passar). (8) T-47: os botões "Equipar"/"Guardar" ficam dentro do item da lista ("Inventário" e "Equipamentos"); os testes do REQ-44 passaram a conferir o texto do item sem os botões (unitário: grupo sem `prepare`; e2e: `toContainText`), alinhamento pedido pelo REQ-45 (autor, 2026-11-17; alternativa descartada: botões num grupo fora da lista, longe da carta). O {nome} das mensagens vem da carta clicada (no "Guardar" a carta sai do slot). A tela guarda o último `Party` devolvido com sucesso: um pedido novo zera o `data` da mutação e, sem isso, uma recusa depois de um sucesso voltava ao `Party` da abertura (defeito achado pelo e2e da T-47; valia também para o REQ-35). (9) Doação (T-48): seção em `src/lab/GrantSection.tsx`; `useCards(null)` fica parada, para a seleção "Carta" não remontar quando as coleções chegam; o `200` invalida `partiesKey` (a tela do grupo aberta depois busca o estado novo); motivos de `LAB_GRANT_INVALID` com texto vêm depois da `message`, separados por espaço; enquanto `GET /parties` ou `GET /parties/:partyId` carregam, a seção mostra "Carregando jogos…" (como o REQ-18) ou "Carregando grupo…", e erro deles mostra a `message` (D-01) no lugar do formulário; erro de coleções ou cartas só aparece no status com "Carta" escolhido, e "Ouro" segue disponível. *(Planejamento da FEAT-10, 2026-11-17.)*
- **D-59 — Cofre e Vasculhar (FEAT-32):** (1) Usar cofre é uma lista de operações montada na seção "Usar cofre" e enviada de uma vez em "Confirmar (1 ponto de ação)" (autor, 2026-11-18; vantagem: fiel ao lote do contrato, várias operações por 1 ponto; desvantagem: tela maior; alternativa descartada: uma operação por envio, que gastaria 1 ponto cada). As escolhas mostram o estado recebido e **não** descontam as operações já na lista: simular o lote seria reimplementar a regra (o backend aponta a operação recusada por `operationIndex`). (2) Vasculhar são botões diretos "Vasculhar {nome}" por carta de `scavengeTargets`, sem confirmação, como o Recuperar (D-57) (autor, 2026-11-18; alternativa descartada: seleção + botão). O resultado vem de `lastScavenge` (CONTRATO v0.45), nunca da comparação do inventário. (3) O limbo não aparece; descartar mostra só o aviso de que a carta não volta (README 6.5). (4) `toolKind` e `scavengeTool` aparecem como o texto recebido (kebab-case, ex.: "fishing-rod") até o conteúdo trazer nome de exibição; o ícone da ferramenta (README 12.6) é da FEAT-30. (5) Catálogo e editor entram nesta FEAT (autor, 2026-11-18), para o designer criar ferramentas e decks de recompensas. (6) O MSW segue sem estado (D-29): a `fixture` ganha as 3 cartas e os campos do contrato (20 cartas, `item` 5); `fixture.gray-harbor` com `scavenge` e `useVault`; `useVault` entra no `availableActions` das fixtures na cidade; respostas fixas por cenário do contrato (Vasculhar `S` achado; `I` → `notScavengeable`; lote com `take` de 5 → `notInVault`, `operationIndex` 1; `operations: []` → `invalidLength`). (7) Sem termos novos com tooltip (como a D-57 item 5). (8) Na T-49 (2026-11-18): `ACTION_INVALID` segue sem schema próprio (chega como `ApiError`, como desde a FEAT-07); `invalidLength` e `notNonNegativeInteger` existem só nas fixtures. Por exigência de tipo, a T-49 já leva os 3 rótulos do REQ-47 (a T-50 fica com o e2e), os motivos novos no `switch` do REQ-42/45 (só a `message`, até as T-52 e T-53) e o transporte dos campos novos no estado do formulário do editor, sem controles (vantagem: salvar uma carta existente não apaga `toolKind` nem `rewardDecks`; os controles são da T-51). O MSW também responde a doação de `fixture.fishing-rod` com o cenário "Com F doado", para a T-52 ser verificável no dev; o lote com `take` de 5 responde sempre `operationIndex` 1 (resposta fixa do cenário, sem simular o lote), e qualquer outro lote não vazio devolve o `Party` do lote de exemplo do contrato. Na T-52, o `inventoryFull` do Vasculhar precisa de texto próprio (hoje o `switch` dá o texto do Preparar). (9) Na T-50 (2026-11-18): o REQ-48 não fixa a posição de "Coletada com"; ela vem logo depois dos efeitos (no item, depois de "Ferramenta" e "Vasculha em"; no equipamento, antes do refino). Os nomes dos "Decks de recompensas" vêm de uma consulta `useCatalogCard` por carta (mesmo cache, D-48), porque o erro é por carta (`useCatalogCards` só expõe o primeiro erro). Com isso, a Carta de Dimensão com decks precisa do `QueryClientProvider`. (10) Na T-51 (2026-11-18): dentro de "Decks de recompensas" os rótulos levam o número do deck, como os do inimigo (D-45): "Tipo de zona do deck {n}", a lista "Cartas do deck {n}", "Carta {j} do deck {n}" e "Cópias da carta {j} do deck {n}". Deck novo começa sem tipo e sem cartas; carta nova começa com id e cópias vazios (o formato exige os dois para salvar). As caixas de "Vasculha em" seguem a ordem do glossário e o corpo também. (11) Na T-52 (2026-11-18): o MSW não tem estado (D-29), então doar a vara no `/lab` não muda o grupo que a tela abre; o Vasculhar aparece no dev pelo grupo `party-com-vara` (o "Com F doado" em sessão, `id` como chave do cenário, como a D-56 item 5 e a D-58 item 4). "Cofre (…)" e "Decks guardados (…)" são título `h3` + lista (como a D-58 item 7); cada deck é um item "Deck {n}" com a lista rotulada "Deck {n}". O `inventoryFull` do Vasculhar tem texto próprio, fora do `reasonText` (que segue com o do Preparar); `notScavengeable` e os demais motivos mostram só a `message`. Com `lastScavenge` `null` num `200` (fora do contrato), a área de status fica vazia. (12) Na T-53 (2026-11-18): cada formulário é um grupo com legenda (o nome do formulário); as seleções "Carta" começam na opção vazia "Escolha uma carta" e não repetem carta (no cofre, a mesma carta em dois slots aparece uma vez; "No cofre" soma as quantidades dos slots, só exibição). "Guardar deck" tem uma linha por carta de atributo do cofre, sem repetir, em ordem de `cardId`. "Subir" fica desabilitado no primeiro item e "Descer" no último. Os campos não voltam ao valor inicial depois de "Acrescentar". A marca "Recusada" e o texto da recusa somem quando a lista é editada (o índice deixaria de valer) e ao fechar a seção; os erros do Usar cofre não vão para a área de status. A recusa aparece no dev sem grupo novo no MSW: confirmar um lote (o `200` devolve o cofre com Poção de Cura) e depois retirar 5 Poções. *(Planejamento da FEAT-32, 2026-11-18; item 8 na T-49; item 9 na T-50; item 10 na T-51; item 11 na T-52; item 12 na T-53.)*
- **D-62 — Mercado (FEAT-16):** (1) Ir ao Mercado é um lote montado na seção "Mercado" e enviado em "Confirmar (1 ponto de ação)", no mesmo padrão do Usar cofre (D-59 item 1) e do contrato (vantagem: várias compras por 1 ponto e um só padrão de tela; desvantagem: tela grande, com cinco grupos; alternativa descartada: uma operação por envio, que gastaria 1 ponto cada). As escolhas mostram a projeção recebida e não descontam o lote. (2) Cada slot da vitrine entra no máximo uma vez por lote (decisão do FE no CONTRATO v0.80): a compra repõe o slot com outra carta, que o jogador ainda não viu. (3) "Total previsto" soma os preços exibidos (só exibição, como o "{total}" da D-59); o preço cobrado vem de `lastMarketVisit` (a escassez pode subir outra cópia da mesma carta). (4) O booster é reconhecido pelo `itemCategory` da carta do catálogo (exibição); as 8 vagas exigidas ficam com o backend. (5) O MSW segue sem estado (D-29): a `fixture` ganha os campos e as cartas do contrato (`fixture.arrows`, `fixture.booster`, `item` +2) e o mercado do Porto Cinzento; `visitMarket` entra no `availableActions` das fixtures na cidade (entre `useVault` e `saveRespawnPoint`), com o `market` do cenário "Estado inicial" e uma vitrine fixa; respostas fixas por cenário do contrato (estoque e lote, venda, ouro perdido, lote recusado com `operationIndex` 1, expansão da bolsa, abrir booster no Preparar e no cofre, formato). (6) Preços e fator aparecem como números simples; ícones de moeda e raridade e a animação de abrir o booster são da FEAT-30. (7) Sem termos novos com tooltip (como a D-57 item 5). (8) Na T-70 (2026-11-23): os campos da FEAT-16 entram com `.default()` nos valores legados do contrato (padrão da T-69), em `src/api/market.ts`. Por exigência de tipo (como a D-49 e a D-59 item 8), já entraram os 37 rótulos do laboratório (a T-71 confirma os textos), o texto de `sumMismatch`, os 8 motivos novos no `switch` da tela (só a `message` até as T-72 e T-73), a descrição "Abrir {nome}" da operação do cofre e o transporte dos campos novos no formulário do editor, sem controles (salvar não apaga). No MSW, o `visitMarket` confere o formato dos cenários "Formato" e escolhe a resposta pela primeira operação que casa com um cenário do contrato (lote com mais de uma venda → "Venda"; duas expansões do cofre → `notEnoughGold` na operação 1); um lote não reconhecido devolve o `Party` de "Estoque e lote". O grupo `party-com-booster` tem o booster no inventário, para o Preparar no dev. Fora do Porto Cinzento, as fixtures têm `market: null`. O `tcgFolderFull` do abrir booster fica para a T-73. O `LabPage.test.tsx` ganhou prazo de 15 s (autor, 2026-11-23): com cerca de 100 campos, um teste passava dos 5 s na suíte inteira; nenhuma asserção mudou. (9) Na T-71 (2026-11-23): os 37 rótulos da T-70 ficam como estão. "Fator do mercado" tem texto próprio de `minAboveMax` (o `fieldErrorText` passou a receber a chave). No catálogo, "Preço ×{n}" aparece sempre no atributo e no item; "Coleção: {nome}" só no item com `itemCategory` `booster` e coleção; o bloco "Mercado" da zona lista o estoque pelos nomes (`useCatalogCard`, o `CardName` agora em `parts.tsx`, compartilhado com a Carta de Dimensão). No editor, os campos são texto (como "Ajuste de preço" do equipamento): número inválido desabilita "Salvar rascunho"; "Preço de estoque" vazio = `null`; "Lote" começa em 1; "Coleção do booster" lista as coleções do editor com "Nenhuma" = `null`; na zona, desmarcar "Tem mercado" envia `market: null` e guarda o que foi digitado; cada carta do "Estoque" é "Carta {n}" (id em texto). Os campos transportados da T-70 viraram controles, então o corpo de atributo, item e zona sempre leva os campos novos. (10) Na T-72 (2026-11-24): a seção é `MarketPanel.tsx`; `NumberField` e os helpers de campo saíram do `PartySession.tsx` para `fields.tsx` e `fieldRules.ts` (o lint separa componente de função). Cada entrada de Estoque, Boosters e Vender é um item de lista com texto, campo e "Acrescentar"; os grupos são listas com o nome do grupo. "Total previsto" da venda usa o preço exibido × (quantidade ÷ `lotSize`, arredondado para baixo), porque o preço da venda é por unidade ou por lote; compras: preço × quantidade; singles e serviços: o preço. "Resultado do mercado" aparece só depois de um `visitMarket` bem-sucedido (como o status) e o aviso de `goldLost` vem em um parágrafo abaixo da lista. `tcgFolderFull` no mercado tem texto próprio ("Não há espaço na pasta de TCG."); `notInInventory` e `notInTcgFolder` reaproveitam os do REQ-52; motivo desconhecido mostra só a `message`. Os e2e de `party` com MSW exigem `VITE_USE_MOCKS=true` (o `.env.development.local` do autor pode desligá-lo). (11) Na T-73 (2026-11-24): "Abrir {nome}" fica no slot do inventário cuja carta tem `itemCategory` `booster`, junto de "Equipar" e sob o mesmo bloqueio (sem encontro de evento aleatório, como o contrato manda); o formulário "Abrir booster" do cofre é um grupo próprio (`BoosterForm`), com seleção "Booster" e "Acrescentar", sem quantidade (abre 1 por vez). "Cartas do booster {nome}" é `BoosterResult.tsx`: lista de `lastBoosterOpening` mostrada só depois de um `prepare`/`openBooster` ou de um `useVault` que contém `openBooster` bem-sucedido (como o "Resultado do mercado"). `notBooster` e `boosterEmpty` têm texto no `reasonText` e no `vaultReasonText`; o `tcgFolderFull` do Preparar de booster tem texto próprio (o do "Ajustar deck" não serve) e é escolhido pela operação enviada. A origem "Booster {nome}" aparece na "Recompensa pendente" (`RewardChoice`). O MSW não ganhou cenário de `tcgFolderFull` (o teste unitário usa o contrato). *(Planejamento da FEAT-16, 2026-11-23; item 8 na T-70; item 9 na T-71; item 10 na T-72; item 11 na T-73.)*

**Pendências (decidir antes da tarefa indicada):**
- **D-67 — P-02 aprovada para a FEAT-21 (2026-11-27):** no momento 2, a apresentação começa após a resposta HTTP, com acontecimentos públicos ordenados pelo backend. A FEAT-26 define a entrega contínua por Socket.IO e pode reutilizar os tipos de acontecimento e a apresentação. Convites e janelas de reação seguem as entregas que introduzirem esses fluxos.

- **D-63 — Ferreiro e Oficina do Artífice (FEAT-17):** (1) Ir ao Ferreiro e a Oficina são lotes montados numa seção própria, no padrão do Usar cofre e do mercado (D-59, D-62): o ferreiro gasta todos os PA, então o lote é a única chance da vez (vantagem: vários refinos e o encantamento que o refino libera numa visita; desvantagem: o jogador vê os preços antes de saber se os testes passam; alternativa descartada: uma operação por envio, que no ferreiro gastaria a vez inteira na primeira). (2) O k-ésimo refino de um mesmo alvo na lista exibe `refineSteps[k]` (o contrato traz cada nível seguinte "supondo os níveis anteriores alcançados", v0.84): é indexar a projeção pela posição, não calcular custo; sem mais passos, o botão fica desabilitado. O que a falha de um teste muda dentro do lote é do backend (`skipped`). (3) "Total previsto" soma os preços exibidos (como D-62 item 3); o cobrado vem de `lastBlacksmithVisit`. (4) O frontend não confere materiais, ouro, slots, requisito de refino nem receita: mostra `canCraft` e `requiresRefinement` como texto e o backend recusa. Equipamento criado por `craft` não é alvo no mesmo lote (CONTRATO v0.85): ele não aparece na projeção até o `200`, então a tela não precisa de regra para isso. (5) O sufixo de estado (REQ-79) é só formatação do `EquipmentState` recebido; o efeito em modificadores e no preço de venda já vem pronto. (6) MSW sem estado (D-29): a `fixture` ganha os campos e as cartas do contrato (`fixture.ember-shard`, `fixture.sword-blueprint`, `item` +2, refino e encantamento da `fixture.short-sword`, ferreiro do Porto Cinzento), `equipmentStates`/`equipmentState` padrão em todo equipamento, `blacksmith` e `lastBlacksmithVisit` `null` fora do cenário, e `visitBlacksmith` no `availableActions` da cidade logo antes de `visitMarket`; respostas fixas por cenário do contrato ("Estado inicial", "Lote com falha e quebra", "Lote recusado" com `operationIndex` 1, "Consertar", "Venda valorizada", "Criar", "Oficina sem Artífice", "Fora do ferreiro", "Formato"). Um grupo de dev com Artífice ativo mostra a seção da Oficina (dado inventado só para a tela; o contrato não traz cenário com Artífice para o FE). (7) Sem termos novos com tooltip nesta FEAT ("Refino", "Encantamento" e "Ferreiro" já estão no glossário); ícones de estado e a animação da forja são da FEAT-30. (8) Na T-75 (2026-11-24): os schemas ficam em `src/api/blacksmith.ts` (estado, vista, resultado, ações) e em `catalog.ts` (`MaterialRequirement`, `BlacksmithEnchantment`, campos das cartas); `recipe`, `blacksmith`, `equipmentStates`, `blacksmith` do jogador e `lastBlacksmithVisit` entram com `.default()` nos valores legados; `equipmentState` é opcional no slot (só em equipamento). Materiais em texto (formato anterior) são recusados: o backend converte o legado (CONTRATO v0.85). Exigidos pelo tipo, como na D-62 item 8: os 19 rótulos do laboratório (a T-76 confirma), os 16 motivos novos no `switch` da tela só com a `message` (textos na T-78), e o editor transporta materiais, slots, receita e ferreiro sem controles; os campos de texto "Materiais" e "Texto do encantamento" saíram (as listas do REQ-78 entram na T-76) e a carta de equipamento mostra só "Refinável até +N" até lá. MSW: grupos `party-ferreiro` (cenário "Estado inicial") e `party-artifice` (Artífice ativo, exemplo); o `visitBlacksmith` escolhe a resposta pela forma do lote (com `enchant` → "Lote com falha e quebra"; dois consertos → `notBroken` na operação 1; um refino só → `equipmentBroken`; conserto → "Consertar"; `craft` do slot 2 → "Criar", de outro → `recipeMissing`; lote não reconhecido → "Lote com falha e quebra", como o fallback do mercado na D-62 item 8); `artificerWorkshop` fora do `party-artifice` → `artificerInactive`; Preparar `unequip` no `party-ferreiro` → "Venda valorizada". O cenário "Lote com falha e quebra" do contrato lista 5 operações no pedido e descreve 6 resultados (o último `skipped`); o MSW e o teste seguem a descrição (6 operações), a confirmar com o backend na T-79. Equipamento nas fixtures ganhou `equipmentState` padrão. O `vi.setConfig` de 15 s do `LabPage.test.tsx` passou para o topo do arquivo (o teste do REQ-65, antes dele, passava dos 5 s na suíte inteira; só o prazo). (9) Na T-76 (2026-11-24): os 19 rótulos do laboratório ficam como escritos na T-75 (testados, sem mudança). No catálogo, o bloco "Refino" (com "Até +{maxLevel}") substitui o "Refinável até +N" provisório da T-75; "Materiais" mostram o nome da carta pela consulta `GET /catalog/cards/:cardId` (como o "Estoque", D-48; até chegar, "…"; com erro, o id). Os encantamentos do ferreiro só mostram o que o REQ-78 lista (nome, tipo, elemento e bônus, materiais): efeitos e habilidades de um encantamento de efeito aparecem só no editor. No editor, "Materiais" e "Slots" são listas do REQ-21 (itens novos começam vazios, como "Modificadores"); "Receita" e "Tem ferreiro" desligados enviam `recipe: null` e `blacksmith: null` e guardam o que foi digitado; "Tipo" do encantamento não tem opção vazia (começa em "Elemento", como a polaridade do efeito) e o "Tipo n" do slot tem "Escolha…" (seleção obrigatória, formato). O rótulo do identificador do encantamento leva o número ("Identificador do encantamento {n}") porque "Identificador" repetido tornava ambíguo o `openCard` dos testes do Porto Cinzento e a busca por rótulo; os demais rótulos do grupo (que já ficam num grupo "Encantamento {n}") seguem a spec sem número. A lista "Efeitos" e "Habilidades" do encantamento reaproveita os subformulários do REQ-55 e do REQ-60 (mesmos rótulos, caminho `blacksmith.enchantments.{i}.effects` e `.abilities`). (10) Na T-78 (2026-11-24): {materiais} é "{quantidade}× {nome}" separados por ", " (como as linhas do inventário). Os botões "Ir ao Ferreiro" e "Oficina do Artífice" saem juntos logo antes de "Ir ao Mercado", entre si na ordem de `availableActions`. A seção da Oficina não lista encantamentos (o REQ-80 os limita ao ferreiro); o grupo "Receitas" aparece nas duas. A seleção "Substituir" começa no encantamento 1. No `200`, sem `lastBlacksmithVisit` (fora do contrato), o status fica só "Ferreiro: {n} operações." (sem os pontos de ação). {nome} de uma recusa sem `details.cardId` vem da projeção: o equipamento do alvo, ou a carta da receita no `craft`. O título da seção e do resultado do ferreiro valem também para a Oficina ("Resultado do ferreiro"). `notEnoughGold` e `notInInventory` usam os textos do REQ-52. *(Planejamento da FEAT-17, 2026-11-24; item 8 na T-75; item 9 na T-76; item 10 na T-78.)*

- **D-64 — Montarias e Estábulo (FEAT-18):** (1) O Estábulo é um grupo da seção "Mercado" (o contrato põe `buyMount`/`sellMount` no lote do `visitMarket`), sem seção própria. (2) Transferir é um botão direto por slot, gratuito e sem confirmação, como "Equipar" (D-58): vantagem, cada transferência aparece na hora; desvantagem, mover muitas cartas exige vários cliques (alternativa descartada: um lote de transferências, que o contrato não oferece). Pilhas têm campo de quantidade; equipamento com estado vai por `inventorySlotIndex`. (3) Movimentar: um botão por rota recebida em `moveRoutes` (a direta e uma por zona do meio); o frontend não procura caminhos (alternativa descartada: um botão só e o backend escolher a zona do meio, o que tiraria do jogador a escolha por onde passar quando os efeitos "ao entrar nesta zona" executarem). (4) Destinos, espaço somado e "pode vender" vêm prontos (CONTRATO v0.89/v0.90; desde a v0.91, o destino da recompensa pendente é o espaço principal e o espaço final vem em `lastRewardDelivery.space`): o frontend nunca compara o inventário para saber onde a carta foi parar. (5) Montaria sem categoria: o lugar da categoria mostra "Montaria" (README 26); o ícone é da FEAT-30. (6) MSW sem estado (D-29): a `fixture` ganha `fixture.plow-horse` e `fixture.war-pony` (efeito e habilidade de exemplo até os textos do aviso `implementado (BE)`), `fixture.old-mine` Rural com Estábulo, `mounts: []` no Porto Cinzento, `mount: null` e `moveRoutes` diretas nas fixtures existentes; grupos de dev `party-estabulo` (cenário "Estábulo") e `party-montaria` (com montaria e conteúdo, rotas a 2 zonas e uma recompensa pendente com descarte na montaria); respostas fixas por cenário do contrato ("Estábulo", "Estábulo recusado", "Transferir", "Vender com conteúdo", "Movimentar", "Formato", "Destino pronto", "Descarte com montaria", "Habilidade da montaria"). (7) "Montaria" e "Estábulo" já estão no glossário (CONTRATO §2); sem termos novos com tooltip nesta FEAT (como a D-57 item 5). (8) Na T-80 (2026-11-25): os schemas ficam nos módulos existentes (`ReceiveSpace` em `vocabulary.ts`; `MountState` e `MoveRoute` em `parties.ts`; `StableView` em `market.ts`; `mountCardSchema` em `catalog.ts`) e entram com `.default()` nos valores legados (`mount: null`, `moveRoutes: []`, `market.mounts: []`, `cardCounts.mount: 0`, `stable: null`, `received: []`, `space: null` na entrega, `mountAbility: false` nos estados e atualizações de combate); `discardOptions` sem `space` recebe o espaço do mesmo tipo do destino. A opção de habilidade é uma união (`equipmentSlot` **ou** `mountAbility: true`). Exigidos pelo tipo, como na D-62 item 8: rótulos de destino da montaria (REQ-88), descrição, total previsto e resultado de `buyMount`/`sellMount` com os textos do REQ-87, os 4 motivos só com a `message`, `mountAbility` no envio das habilidades, `space` no descarte, os 7 rótulos do laboratório (a T-81 confirma), "Já tem montaria." na doação, a carta de montaria provisória (só o nome; componente na T-81) e o editor só transportando os campos da montaria e `market.mounts` (o tipo `mount` fica fora das listas do editor até a T-81). MSW: um só grupo com montaria, `party-montaria`, com o Pônei de Guerra na Mina Velha (cobre Transferir, rota a 2 zonas até o Porto Cinzento, Estábulo com `sellable: false`, descarte na montaria, efeito e habilidade da montaria); `party-estabulo` é o cenário "Estábulo"; a doação de montaria responde o membro com montaria, e em `party-montaria`, `mountAlreadyOwned`. O 400 de `useAbility` segue o backend (resposta na T-87; o contrato não fixa o detalhe): os dois campos, ou `mountAbility` diferente de `true`, → `{ field: "mountAbility", reason: "invalidItem" }`; nenhum dos dois → `{ field: "equipmentSlot", reason: "required" }`. (9) Na T-81 (2026-11-25): a doação mostra a montaria no formato "{nome} · {tipo}" do REQ-46 ("Pônei de Guerra · Montaria"); a carta de montaria mostra "Montaria" e a raridade como parágrafos próprios, nessa ordem; no editor, "Montaria" fica por último em "Nova carta" e no filtro de tipo, os campos seguem a ordem Nome, Texto de ambientação, Raridade, Tipos, Criatura, Efeitos, Habilidades, e a lista "Estábulo" fica dentro de "Tem mercado", depois de "Vende singles". Os 7 rótulos do laboratório da T-80 ficam confirmados. (10) Na T-82 (2026-11-25): sem montaria, a seção mostra só "Sem montaria." (sem título). "Levar"/"Trazer" saem do mesmo grupo de controles do Preparar, fora do bloqueio de encontro de evento aleatório (o REQ-85 só exige `prepare` e montaria); "Quantidade de {nome}" é recriado quando o total do slot muda, e a mensagem de recusa do Transferir tem texto próprio (o `reasonText` genérico é o do Equipar). Lista da montaria: o texto do item fica num `span`. *(Planejamento da FEAT-18, 2026-11-24; item 8 na T-80; item 9 na T-81; item 10 na T-82.)*

- **D-65 — Conclusão da dimensão (FEAT-19):** (1) "Concluir dimensão" é um botão de ação da vez como os demais (REQ-34), só presente quando vem em `availableActions`: o frontend não confere zona nem requisito (alternativa descartada: botão sempre visível e desabilitado com motivo, que exigiria calcular a regra na tela). (2) O combate do chefe final reaproveita a tela de combate da FEAT-13; só o título muda. (3) O painel "Dimensão concluída" é modal e vem de um resumo gravado pelo backend (como `lastCombatResult`), para sobreviver a um GET ou à reabertura; vantagem: o jogador nunca perde o resumo; desvantagem: o contrato precisa definir quando o resumo some. (4) Save congelado é uma situação do save vinda pronta do backend; a lista não mostra "Continuar" (alternativa descartada: mostrar e deixar o backend recusar, o que leva o jogador a um erro previsível). (5) Itens de conclusão ficam numa lista própria na seção do membro, ao lado das missões, e nunca entram nas listas de slot. (6) MSW sem estado (D-29): a `fixture` ganha um item de conclusão, a Carta de Dimensão com conclusão (com e sem chefe final) e grupos de dev por cenário (na zona de conclusão com o requisito, concluída com próxima dimensão, congelado). *(Planejamento da FEAT-19, 2026-11-25.)*

## 4. Tarefas

Cada tarefa pertence a uma FEAT do [`ROADMAP.md`](ROADMAP.md). As tarefas de uma FEAT nascem quando ela é planejada (`/mudar-spec planejar FEAT-nn`).

**FEAT-01 — Esqueleto técnico (lado frontend)**

- [x] **T-01 — Ferramentas de qualidade** (D-05, D-11, D-12). Instalar Prettier, Vitest e Playwright (com o navegador Chromium); criar os scripts `typecheck` (`tsc -b`), `test` (`vitest run`), `test:e2e` (`playwright test`), `format` e `format:check`; configs mínimas; `.prettierignore` sem `docs/`. Antes de instalar, perguntar ao autor se autoriza os utilitários de teste de componentes (`@testing-library/react` e um ambiente DOM). Como verificar: os cinco scripts rodam sem erro num projeto ainda sem testes.
- [x] **T-02 — Guarda de `src/`** (D-08). Criar `.claude/hooks/client-guard.mjs` (modo hook pelo stdin e modo `--all`), registrar em `.claude/settings.json` (PostToolUse em Edit/Write) e reproduzir as regras no ESLint sem plugin novo. Como verificar: `node .claude/hooks/client-guard.mjs --all` passa; um arquivo de teste com `Math.random()` em `src/` é bloqueado com a mensagem do princípio; o arquivo é apagado depois.
- [x] **T-03 — Esqueleto do app** (D-04, D-07, D-10, P-01). Resolver a P-01; instalar TanStack Query, React Router DOM e MSW; criar as pastas de 3.2; provider de consultas; rota inicial; inicialização do MSW só no dev com `VITE_USE_MOCKS=true`; remover o conteúdo de exemplo do template do Vite. Como verificar: `npm run dev` abre a rota inicial sem o conteúdo do template; com `VITE_USE_MOCKS=true` o console mostra o MSW ativo; `npm run build` não contém código do MSW.

- [x] **T-04 — Consumo do `GET /health` na rota inicial** (REQ-01; CONTRATO v0.4 §3 FEAT-01; D-01, D-10, D-14). Em `src/api/`: tipo `HealthResponse` + schema Zod, chamada HTTP com base em `VITE_API_URL` que valida a resposta (dado entra como `unknown`) e converte o envelope de erro §1.4, e a consulta `useHealth` (TanStack Query). Em `src/mocks/`: handler de `GET /health` com a fixture dos cenários do contrato. Na rota inicial: a área de status do REQ-01. Como verificar: `npm run dev` (mocks ligados) mostra "Servidor conectado · contrato v0.4"; unitários do REQ-01 e e2e da área `app` passam.

A T-04 fecha o lado FE da FEAT-01: depois dela a coluna FE vai a `pronto`, aguardando a validação contra o backend real (`/retorno-backend`) para `validado`.

**FEAT-02 — Base visual** (só frontend; sem contrato, sem backend)

- [x] **T-05 — Tokens, tema escuro e tipografia** (REQ-02; D-09, D-17, D-18, D-19, D-21). Criar o arquivo de tokens em `src/ui/` (cores semânticas do tema escuro, escala de tipografia, espaçamentos relativos ao monitor, durações e easing de movimento); servir o arquivo da fonte de títulos (Lora, fornecida pelo autor) junto com o app; aplicar na rota inicial; teste unitário de contraste de todos os pares de tokens; e2e da área `app` nas duas pontas de resolução. Atualizar `/guia-visual` (§2, §3, §5, §6) com os valores escolhidos. Como verificar: `npm run dev` mostra a rota inicial em tema escuro, título em Lora e status na fonte do sistema.
- [x] **T-06 — Termo do jogo com destaque e tooltip** (REQ-03; D-20). Componente de termo em `src/ui/` e catálogo de termos tipado por id do glossário (CONTRATO §2). O catálogo começa com os **9 atributos** (README 4.1); os textos dos tooltips são rascunhados a partir do README e **aprovados pelo autor** antes de a tarefa fechar. Tooltip por mouse e por teclado, fecha com Esc, sem cobrir o termo. Como verificar: testes de componente (ainda não há tela que use termos).
- [x] **T-07 — Carta com categoria e convenção de imagens** (REQ-04). Componente de categoria de carta em `src/ui/` (ícone + imagem + rótulo, moldura neutra quando a arte está pendente); catálogo de categorias com **ids de teste** (`test-…`, SVG só para testes) — as categorias reais chegam com o modelo das cartas na FEAT-04; teste "todo id tem imagem ou está pendente". Definir com o autor e registrar em `/assets`: pasta dos originais e como as versões do produto são geradas. Como verificar: testes de componente.

A T-07 fecha o lado FE da FEAT-02 (o backend não tem alteração nela, ROADMAP `—`).

**FEAT-03 — Esqueleto do laboratório** (CONTRATO v0.7 `acordado`)

- [x] **T-08 — Cliente da configuração do laboratório** (REQ-06; CONTRATO §3 FEAT-03; D-01, D-14, D-23). Em `src/api/`: tipos `GameConfigValues`, `LabConfig`, `LabConfigPatch`, `LabConfigInvalidDetails` + schemas Zod; `useLabConfig`, `useUpdateLabConfig`, `useResetLabConfig`. Em `src/mocks/`: handlers de `/lab/config` e `/lab/config/reset` com fixtures dos cenários do contrato (cada resposta é fixa; os testes trocam o handler por cenário). Como verificar: unitários da camada de cliente.
- [x] **T-09 — Rota do laboratório só no dev** (REQ-05; D-07, D-08). Rota `/lab` registrada só atrás de `import.meta.env.DEV` com tela vazia titulada "Laboratório"; teste de build que procura marcas de `src/lab/` no `dist/`. Como verificar: `npm run dev` abre `/lab`; `npm run build` + teste de build passam; e2e da área `lab`.
- [x] **T-10 — Tela de configuração do laboratório** (REQ-06, REQ-07). Formulário em `src/lab/` com os 8 campos, padrões e limites, "Salvar", "Restaurar padrões", erros por campo e área de status; seção "Componentes" com o termo do jogo e a categoria de carta (os ids de teste passam a ser importados também por `src/lab/`, que é só dev — ajustar D-22 e a guarda se preciso). Como verificar: `npm run dev` (mocks) em `/lab`; unitários do REQ-06 e e2e da área `lab`.

A T-10 fecha o lado FE da FEAT-03 com MSW; depois, `/retorno-backend` contra o backend real.

**FEAT-04 — Catálogo de cartas e coleções** (CONTRATO v0.11 `acordado`)

- [x] **T-11 — Cliente do catálogo** (REQ-08; CONTRATO §3 FEAT-04; D-14, D-27, D-29). Em `src/api/`: os tipos da seção (`CardType`, `CollectionSummary`, `Card` com as 6 variantes por `type`, `Enemy`, `RuleText`, `Ability` e as uniões de §2.7) + schemas Zod; `useCollections()`, `useCards(collectionId, type?)`. Em `src/mocks/`: handlers com as fixtures dos cenários do contrato (coleção `fixture`, 6 cartas, erros `COLLECTION_NOT_FOUND` e `CATALOG_QUERY_INVALID`); as cópias exatas das cartas chegam com o `implementado (BE)` e substituem as provisórias. Fixtures extras só nos testes de componente (sinérgica, aprimorada, equipamento completo, combate com `count` > 1). Como verificar: unitários da camada de cliente.
- [x] **T-12 — Categorias e rótulos** (REQ-04; D-28). Ids de `slot` e `itemCategory` no catálogo de produção, com rótulos do §2.7 e arte pendente; mapa de rótulos pt-BR dos demais identificadores do §2.7 (tipos de zona, classes, elementos, inimigo) e de raridade e tipo de carta. Como verificar: teste "todo id tem imagem ou está pendente" e teste de que todo valor de cada união tem rótulo (erro de tipo se faltar).
- [x] **T-13 — Cartas de atributo, equipamento e item** (REQ-09 a REQ-11; D-30). Componentes em `src/ui/cards/`. Como verificar: testes de componente com as fixtures.
- [x] **T-14 — Cartas de zona e de evento** (REQ-12, REQ-13; D-31). Componentes em `src/ui/cards/`. Como verificar: testes de componente com as fixtures.
- [x] **T-15 — Seção "Catálogo" no laboratório** (REQ-08; D-26). Lista por coleção e tipo, carta escolhida exibida com o componente do `kind`, estados de carregamento e erro. Como verificar: `npm run dev` (mocks) em `/lab`; unitários do REQ-08 e e2e da área `lab`.

A T-15 fecha o lado FE da FEAT-04 com MSW; depois, `/retorno-backend` contra o backend real. Estilo visual das cartas (moldura PSX, raridade): `/visual` depois da T-15, se o autor quiser.

**FEAT-05 — Campanha solo (lado frontend)**

- [x] **T-16 — Cliente da campanha** (REQ-14 a REQ-17; D-32, D-34). Em `src/api/`: schemas Zod de `Party`, `PartyMember`, `PartySummary`, `PartyInvalidDetails`; `requestJson` aceita `204` sem corpo; hooks de 3.4; `PARTY_INVALID` com `details` válido vira erro com `fields`. Em `src/mocks/`: fixtures dos cenários do CONTRATO §3 FEAT-05 e handlers por tabela de cenários. Como verificar: unitários da camada de cliente.
- [x] **T-17 — Menu inicial e abandonar** (REQ-14, REQ-17). Lista de saves em `/`, link "Novo jogo", "Continuar", diálogo de abandono, mensagens de status. Como verificar: `npm run dev` (mocks) em `/`; unitários e e2e da área `app`.
- [x] **T-18 — Novo jogo** (REQ-15). Formulário em `/novo` com erros por campo. Como verificar: `npm run dev` (mocks) em `/novo`; unitários e e2e da área `party`.
- [x] **T-19 — Grupo em sessão** (REQ-16). Tela `/grupo/:partyId` com Continuar ao abrir e "Encerrar sessão". Como verificar: `npm run dev` (mocks), fluxo `/` → "Continuar" → "Encerrar sessão" → `/`; unitários e e2e da área `party`.

A T-19 fecha o lado FE da FEAT-05 com MSW; depois, `/retorno-backend` contra o backend real. O laboratório já tem `minPlayers` (FEAT-03), único valor do Apêndice A que a FEAT usa.

**FEAT-31 — Editor de conteúdo (lado frontend)** (depende do CONTRATO §3 FEAT-31 `acordado`)

- [x] **T-20 — Cliente do editor** (REQ-19 a REQ-26; D-38, D-39). Em `src/api/`: tipos e schemas Zod do CONTRATO §3 FEAT-31; hooks de 3.4; `CONTENT_INVALID` e `CONTENT_ID_TAKEN` com `details` válido viram erro com `fields`. Em `src/mocks/`: fixtures dos cenários do contrato e handlers por tabela de cenários (D-29), sem guardar estado. Como verificar: unitários da camada de cliente.
- [x] **T-21 — Rota do editor e coleções** (REQ-18, REQ-19, REQ-24 na parte de coleção). `/lab/editor` atrás da rota de dev (D-24), link em `/lab`, marca "Editor de conteúdo" no teste de build, seção "Coleções" com painel, formulário e exclusão. Como verificar: `npm run dev` (mocks) em `/lab/editor`; `npm run test:build`; unitários e e2e da área `editor`.
- [x] **T-22 — Lista de cartas** (REQ-20). Filtros, busca, "Nova carta" com escolha de tipo. Como verificar: unitários e e2e da área `editor`.
- [x] **T-23 — Formulário base, zona e atributo** (REQ-21, REQ-22, REQ-24). Estrutura comum (identificador, listas com adicionar/remover/subir/descer, erros por caminho de campo, "Salvar rascunho", alterações não salvas), formulários de zona e de atributo e a pré-visualização. Como verificar: unitários e e2e da área `editor`.
- [x] **T-24 — Formulários de equipamento e item** (REQ-21). Como verificar: unitários e e2e da área `editor`.
- [x] **T-25 — Formulários de evento aleatório e de combate** (REQ-21). Inclui a lista de inimigos. Como verificar: unitários e e2e da área `editor`.
- [x] **T-26 — Publicar, duplicar e excluir carta** (REQ-23). Como verificar: unitários e e2e da área `editor`.
- [x] **T-27 — Validar como dimensão, exportar e importar** (REQ-25, REQ-26). Como verificar: unitários e e2e da área `editor`.

A T-27 fecha o lado FE da FEAT-31 com MSW; depois, `/retorno-backend` contra o backend real. A FEAT não usa valores do Apêndice A.

**FEAT-06 — Preparação da partida (lado frontend)** (CONTRATO v0.21 §3 FEAT-06 `acordado`; altera as seções `validado` FEAT-03, 04, 05 e 31)

- [x] **T-28 — Alinhar o cliente ao contrato da FEAT-06** (REQ-27 a REQ-30; D-48). Em `src/api/`: schemas das 11 chaves novas de `GameConfigValues`; `DimensionCard`, `arrowLayout` e `dimension` em `CardType`/`cardCounts`; `ClassDefinition`; `CreatePartyRequest.playerClass`; `Party.dimension`, `turnOrder`, `PartyMember.player` (`PlayerState`, `PartyDimension`, `MapZone`, `Crossing`); `PartyInvalidDetails` com `playerClass`/`unknownClass`; `DIMENSION_INVALID` vira `DimensionInvalidError` (com `problems`); hooks novos `useClasses()` e `useCatalogCard(cardId)`. Em `src/mocks/`: fixtures da `fixture` com 12 cartas, as 2 classes, o `Party` preparado e os cenários de erro. Como verificar: unitários da camada de cliente; os testes das FEAT-03/04/05 que dependem das fixtures continuam passando.
- [x] **T-29 — Alinhar laboratório e catálogo** (REQ-27, REQ-28). 11 campos novos na configuração; opção "Dimensão" no filtro; componente `DimensionCard` em `src/ui/cards/`; forma das setas na carta de zona. Inclui o teste dos rótulos e da ordem dos 11 campos (já no `LabPage` desde a T-28, D-49) e troca o `null` de `FullCard` pelo componente. Como verificar: `npm run dev` (mocks) em `/lab`; unitários e e2e da área `lab`.
- [x] **T-30 — Alinhar o novo jogo: escolha de classe** (REQ-29). Acrescenta ao handler padrão do MSW o cenário `required` (corpo "Os Teimosos"/"Lia" sem `playerClass`), adiado na T-28 (D-49). Como verificar: `npm run dev` (mocks) em `/novo`; unitários e e2e da área `party`.
- [x] **T-31 — Alinhar a tela do grupo: partida preparada** (REQ-30). Como verificar: `npm run dev` (mocks), fluxo `/novo` → `/grupo/:partyId`; unitários e e2e da área `party`.
- [x] **T-32 — Cliente do editor: classes e Carta de Dimensão** (REQ-31 a REQ-33). Em `src/api/editor.ts`: `CardInput` com `dimension` e `arrowLayout`; `EditorClass`, `EditorClassSummary`, `ClassInput`; `CollectionExport.classes` tipado; hooks `useEditorClasses(collectionId)`, `useEditorClass(playerClass)`, `useCreateClass`, `useSaveClass`, `usePublishClass`, `useDeleteClass`; `CLASS_NOT_FOUND`, `CONTENT_REFERENCED` como `ApiError`. Em `src/mocks/`: cenários das classes do contrato; `validate-dimension` da `fixture` passa a `{ valid: true, problems: [] }` e o exemplo inválido vai para o `bosque` (adiado na T-28, D-49). Como verificar: unitários da camada de cliente.
- [x] **T-33 — Alinhar o editor: Carta de Dimensão e forma das setas** (REQ-31). Tira o `hasForm` e o filtro de "Nova carta" da T-28 (D-49), com teste de abrir a Carta de Dimensão. Como verificar: unitários e e2e da área `editor`.
- [x] **T-34 — Classes no editor** (REQ-32, REQ-33). Seção "Classes", formulário, publicar, excluir, guarda de alterações, `CONTENT_REFERENCED`, mensagem de importação. Como verificar: unitários e e2e da área `editor`.

A T-34 fecha o lado FE da FEAT-06 com MSW; depois, `/retorno-backend` contra o backend real (quando o BE estiver `pronto`). Valores do Apêndice A que a FEAT usa: os 11 novos do REQ-27 (laboratório) e os já existentes `baseHealth`, `initialPeak`, `initialVigor`, `initialGold`, `initialHandSize`.

**FEAT-07 — Mapa e Movimentar (lado frontend)** (CONTRATO v0.28 §3 FEAT-07 `acordado`; altera a seção `validado` FEAT-06)

- [x] **T-35 — Cliente da FEAT-07** (REQ-34, REQ-35; D-55). Em `src/api/`: `PlayerState.moveTargets` no schema; `PartyAction`/`MoveAction`; hook `usePartyAction(partyId)` (`POST /parties/:partyId/actions`, `Party` validado; erros como `ApiError` com a `message`). Em `src/mocks/`: `moveTargets` nas fixtures do `Party`; handler de ações por tabela de cenários (D-55 item 5). Como verificar: unitários da camada de cliente; os testes da FEAT-05/06 que usam o `Party` continuam passando.
- [x] **T-36 — Mapa na tela do grupo** (REQ-34). Grade, setas, ligações, "{characterName} está aqui", escolha de zona com a carta e "Travessias com". Como verificar: `npm run dev` (mocks), fluxo `/novo` → `/grupo/:partyId`; unitários e e2e da área `party`.
- [x] **T-37 — Movimentar** (REQ-35). Botão, envio, `Party` devolvido na tela, mensagens. Como verificar: `npm run dev` (mocks), mover e voltar à cidade; unitários e e2e da área `party`.

A T-37 fecha o lado FE da FEAT-07 com MSW; depois, `/retorno-backend` contra o backend real. A FEAT não usa valores novos do Apêndice A (o custo do Movimentar entra com a FEAT-08).

**FEAT-08 — A vez (lado frontend)** (CONTRATO v0.33 §3 FEAT-08 `implementado (BE)`; altera as seções `validado` FEAT-05/06/07)

- [x] **T-38 — Cliente da FEAT-08** (REQ-36 a REQ-38; D-56). Em `src/api/`: `Party.turn` (`PartyTurn`) e `PlayerState.availableActions` no schema; `EndTurnAction` em `PartyAction`; `usePartyAction` aceita `endTurn`. Em `src/mocks/`: `turn` e `availableActions` em todas as fixtures do `Party`; cenários da D-56 item 3 no handler de ações. Como verificar: unitários da camada de cliente; os testes das FEAT-05/06/07 que usam o `Party` continuam passando.
- [x] **T-39 — A vez e Encerrar a vez** (REQ-36, REQ-38). Região "A vez", botão, envio, mensagens. Como verificar: `npm run dev` (mocks), encerrar a vez e ver a rodada 2; unitários e e2e da área `party`.
- [x] **T-40 — Alinhar Movimentar às ações disponíveis** (REQ-37). Botão só com `move` em `availableActions` e o aviso de 0 pontos. Como verificar: `npm run dev` (mocks), gastar os pontos e ver o botão sumir; unitários e e2e da área `party`.

A T-40 fecha o lado FE da FEAT-08 com MSW; depois, `/retorno-backend` contra o backend real. Valor do Apêndice A: só `actionPointsPerTurn`, já no laboratório (REQ-06).

**FEAT-09 — Deck de atributos (lado frontend)** (CONTRATO v0.37 §3 FEAT-09 `implementado (BE)`; altera as seções `validado` FEAT-03/06/07/08)

- [x] **T-41 — Cliente da FEAT-09** (REQ-39 a REQ-42; D-57). Em `src/api/`: 5 chaves novas em `GameConfigValues`; `build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity` (`CardCopies`) em `PlayerState`; `RecoverAction` e `AdjustDeckAction` em `PartyAction` (`availableActions` aceita `recover` e `adjustDeck`); `ActionNotAllowedDetails` com os motivos novos e `cardId` opcional. Em `src/mocks/`: chaves e padrões no `LabConfig`; campos novos em todas as fixtures do `Party`; cenários da D-57 item 6 no handler de ações. Como verificar: unitários da camada de cliente; os testes das FEAT-03/05/06/07/08 continuam passando.
- [x] **T-42 — Laboratório, build e pasta** (REQ-39, REQ-40). 5 campos novos na configuração; listas "Build" e "Pasta de TCG" na seção do membro. Como verificar: `npm run dev` (mocks) em `/lab` e em `/grupo/:partyId`; unitários e e2e das áreas `lab` e `party`.
- [x] **T-43 — Recuperar** (REQ-41). Grupo de botões na região "A vez", envio, mensagens. Como verificar: `npm run dev` (mocks), cada opção; unitários e e2e da área `party`.
- [x] **T-44 — Ajustar deck** (REQ-42). Botão, seção com o formulário, envio, recusas por motivo. Como verificar: `npm run dev` (mocks), salvar sem mudança e ver as recusas; unitários e e2e da área `party`.

A T-44 fecha o lado FE da FEAT-09 com MSW; depois, `/retorno-backend` contra o backend real. Valores do Apêndice A: `maxCopiesPerCard`, `tcgFolderCapacity`, `recoverHealthPercent`, `recoverVigorPercent`, `recoverHandSize` (REQ-39).

**FEAT-10 — Inventário, equipar e bolsa (lado frontend)** (CONTRATO v0.41 §3 FEAT-10 `implementado (BE)`; altera as seções `validado` FEAT-03/06/07/08/09)

- [x] **T-45 — Cliente da FEAT-10** (REQ-43 a REQ-46; D-58). Em `src/api/`: `inventoryCapacity` e `purseCapacity` em `GameConfigValues`; `inventory` (`InventorySlot`), `inventoryCapacity`, `equipment`, `purseCapacity`, `effectiveModifiers` em `PlayerState`; `PrepareAction` em `PartyAction` (`availableActions` aceita `prepare`); motivos novos em `ActionNotAllowedDetails`; `useLabGrant()` (`{ partyId, memberId, grant }` na mutação) com `LabGrantInvalidError` (`fields`) e `LabGrantNoSpaceError` (`reason`); `useParty(partyId)` (`GET /parties/:partyId`, para a doação). Em `src/mocks/`: chaves e padrões no `LabConfig`; campos novos em todas as fixtures do `Party`; cartas novas da `fixture` (só com o que o contrato fixa, nomes de exemplo; D-58 item 6); cenários da D-58 item 4 nos handlers de ações e de doação. Como verificar: unitários da camada de cliente; os testes das FEAT-03 a 09 continuam passando.
- [x] **T-46 — Laboratório, inventário, equipamentos e bolsa** (REQ-43, REQ-44). 2 campos novos na configuração; ouro com a bolsa, modificadores efetivos e da classe, listas "Equipamentos" e "Inventário" na seção do membro. Como verificar: `npm run dev` (mocks) em `/lab` e em `/grupo/:partyId`; unitários e e2e das áreas `lab` e `party`.
- [x] **T-47 — Preparar** (REQ-45). Botões "Equipar"/"Guardar", envio, mensagens e recusas por motivo. Como verificar: `npm run dev` (mocks), equipar, guardar e ver as recusas; unitários e e2e da área `party`.
- [x] **T-48 — Doação do laboratório** (REQ-46). Seção "Doação" em `/lab`, com a carta escolhida pela lista do catálogo. Como verificar: `npm run dev` (mocks), doar carta e ouro e ver os erros; unitários e e2e da área `lab`.

A T-48 fecha o lado FE da FEAT-10 com MSW; depois, `/retorno-backend` contra o backend real. Valores do Apêndice A: `inventoryCapacity`, `purseCapacity` (REQ-43).

**FEAT-32 — Cofre, limbo, deck de recompensas e Vasculhar (lado frontend)** (CONTRATO v0.46 §3 FEAT-32 `acordado`; altera as seções `validado` FEAT-03/04/06/07/08/09/10/31)

- [x] **T-49 — Cliente da FEAT-32** (REQ-47 a REQ-52; D-59). Em `src/api/`: 3 chaves novas em `GameConfigValues`; `ItemCard.toolKind`/`scavengeZoneTypes`/`scavengeTool`, `EquipmentCard.scavengeTool`, `DimensionCard.rewardDecks` (o `CardInput` do editor acompanha); `vault` (`Vault`), `vaultCapacity`, `vaultDeckSlots`, `vaultGoldCapacity`, `scavengeTargets`, `lastScavenge` em `PlayerState`; `UseVaultAction` (`VaultOperation`) e `ScavengeAction` em `PartyAction` (`availableActions` aceita `scavenge` e `useVault`); motivos novos e `operationIndex` em `ActionNotAllowedDetails`; `invalidLength` e `notNonNegativeInteger` em `ActionInvalidDetails`. Em `src/mocks/`: D-59 item 6. Como verificar: unitários da camada de cliente; os testes das FEATs 03 a 10 e 31 que usam cartas e `Party` continuam passando (com `useVault` nos `availableActions` da cidade).
- [x] **T-50 — Laboratório e catálogo** (REQ-47, REQ-48). 3 campos novos na configuração; ferramenta, "Coletada com" e "Decks de recompensas" nas cartas. Como verificar: `npm run dev` (mocks) em `/lab`; unitários e e2e da área `lab`.
- [x] **T-51 — Editor: ferramentas e decks de recompensas** (REQ-49). Como verificar: `npm run dev` (mocks) em `/lab/editor`; unitários e e2e da área `editor`.
- [x] **T-52 — Cofre na tela do grupo e Vasculhar** (REQ-50, REQ-51). Como verificar: `npm run dev` (mocks), abrir `/grupo/party-com-vara` (D-59 item 11), vasculhar e ver o resultado; unitários e e2e da área `party`.
- [x] **T-53 — Usar cofre** (REQ-52). Seção, formulários, lista de operações, envio, recusa com `operationIndex`. Como verificar: `npm run dev` (mocks), montar e confirmar um lote e ver a recusa; unitários e e2e da área `party`.

A T-53 fecha o lado FE da FEAT-32 com MSW; depois, `/retorno-backend` contra o backend real, quando o BE chegar a `implementado (BE)`. Valores do Apêndice A: `vaultCapacity`, `vaultDeckSlots`, `vaultGoldCapacity` (REQ-47).

**FEAT-11 — Efeitos e status** (CONTRATO v0.53 `validado`; README 13 e 13.6, B K2). Implementação e validação integral autorizadas pelo autor em 2026-11-19.

- [x] **T-54 — Cliente e fixtures de efeitos** (REQ-53/54/55): schemas das quatro partes, efeitos, status, efeitos ativáveis, ação e erros; fixtures estáticas compatíveis. `src/api/effects.ts` centraliza schemas; nenhuma regra de execução.
- [x] **T-55 — Cartas e editor de efeitos** (REQ-53/55): marcação e polaridade; campos JSON validados escolhidos pelo autor; testes unitários e e2e `lab`/`editor`.
- [x] **T-56 — Status e ativação na partida** (REQ-54): apresentação, pagamento por cópia e atualização autoritativa; testes unitários e e2e `party`.
- [x] **T-57 — Validar FEAT-11 contra o backend real**: todos os cenários do contrato com MSW desligado, incluindo telas, editor e recusas; registrar resultados e só marcar validado se todos passarem.

**D-60 — FEAT-11:** os schemas verificam formato; regras cruzadas pertencem ao backend. Editor usa campos JSON por parte, opção escolhida pelo autor em 2026-11-19. Valores iniciais são apenas rascunhos editáveis. Telas afetadas (3.5): catálogo em `/lab`, editor em `/lab/editor`, partida em `/grupo/:partyId`; áreas e2e `lab`, `editor`, `party`. Sem valores novos do Apêndice A. `PlayerStatus.text` é independente do catálogo; `handPayment` é a única fonte da instrução e quantidade de pagamento. Tipos compartilhados de enumeração podem ser extraídos de `catalog.ts` para evitar ciclo entre catálogo e efeitos.

### FEAT-12 — Eventos aleatórios

- [x] **T-58 — Cliente e fixtures** (REQ-56 a REQ-59). Schemas, ações, erros e casos determinísticos do CONTRATO v0.57.
- [x] **T-59 — Catálogo, editor e configuração** (REQ-56). Compatibilidade legada e executável, decks por zona e valores do laboratório.
- [x] **T-60 — Encontro na tela do grupo** (REQ-57 e REQ-58). Antecipação, recarga, consumível, pagamentos por cópia, recusas, desistência e fuga.
- [x] **T-61 — Recompensas e Vasculhar** (REQ-59). Escolhas pendentes, recarga, descarte e resultado de Vasculhar.
- [x] **T-62 — Validação integrada da FEAT-12.** Repetir os cenários do contrato contra o backend real com MSW desligado, quando disponíveis a seção implementada, a URL e os dados de teste. Cenários de relógio multiplayer seguem a integração FEAT-26.

**D-61 — FEAT-12:** o frontend deriva opções e progresso dos campos autoritativos do contrato. As fixtures são estáticas por cenário. A apresentação de requisitos usa `handCardSelection`, IDs de cópia e recibos do backend. Áreas de teste `lab`, `editor` e `party`.

### FEAT-13 — Combate solo

- [x] **T-63 — Cliente e fixtures MSW** (REQ-60 a REQ-62). Contrato de catálogo, laboratório, combate, escolhas e recusas.
- [x] **T-64 — Catálogo, editor e laboratório** (REQ-60).
- [x] **T-65 — Tela, ações, pagamentos e desfechos de combate** (REQ-61).
- [x] **T-66 — Escolha de efeitos disparados** (REQ-62). Exercitar os quatro cenários acordados com MSW.
- [ ] **T-67 — Validação integrada.** Repetir os cenários da FEAT-13 com MSW desligado após a entrega do backend, com URL e dados de teste.

### FEAT-14 — Nocaute, spawn e respawn

- [x] **T-68 — Cliente e fixtures MSW de nocaute e respawn** (REQ-63 a REQ-65). Após aprovação da spec e acordo do contrato, escrever primeiro testes identificados pelos REQs para os novos formatos e cenários. Confirmar a falha esperada, alinhar schemas, cliente de ações, estado do grupo e configuração do laboratório e preparar fixtures para sucesso, recusas, desfecho e recarga. Concluir com os testes afetados e a checagem de tipos aprovados. As telas e a validação integrada ficam para tarefas posteriores.

### FEAT-15 — Missões e progressão de classes

- [x] **T-69 — Cliente e fixtures MSW de missões e progressão de classes** (REQ-66 a REQ-70). Após acordo do contrato, escrever primeiro os testes identificados pelos REQs e confirmar as falhas esperadas. Implementar schemas, cliente e fixtures para sucesso, recusa, desfecho e recarga. Rodar os testes afetados e a checagem de tipos. Interface de jogo, laboratório, editor e validação real ficam nas entregas seguintes.

### FEAT-16 — Mercado

- [x] **T-70 — Cliente e fixtures MSW do mercado** (REQ-71 a REQ-76). Schemas e tipos do CONTRATO v0.81 (`market`, `expansions`, `lastMarketVisit`, `lastBoosterOpening`, `VisitMarketAction`, `openBooster`, campos novos das cartas, 37 chaves, `sumMismatch`, motivos novos, fonte `booster`), `usePartyAction` com as ações novas e as fixtures da D-62 item 5, inclusive `visitMarket` nos `availableActions` já existentes na cidade. Testes primeiro; tipos e testes afetados verdes.
- [x] **T-71 — Laboratório, catálogo e editor** (REQ-71, REQ-72). E2E nas áreas `lab` e `editor`.
- [x] **T-72 — Ir ao Mercado na tela do grupo** (REQ-73, REQ-74, REQ-76). E2E na área `party`.
- [x] **T-73 — Abrir booster** (REQ-75). Preparar, Usar cofre e origem da entrega pendente; e2e na área `party`.
- [x] **T-74 — Validação integrada da FEAT-16.** Repetir os cenários do contrato contra o backend real com MSW desligado, com as campanhas preparadas pelo backend (CONTRATO v0.81).

### FEAT-17 — Ferreiro e Oficina do Artífice

- [x] **T-75 — Cliente e fixtures MSW do ferreiro** (REQ-77 a REQ-81). Schemas e tipos do CONTRATO v0.85 (`EquipmentState`, `equipmentStates`, `equipmentState` no inventário, no cofre e em `sellOffers`, `inventorySlotIndex` no `sell`, `blacksmith`, `lastBlacksmithVisit`, `VisitBlacksmithAction`, `ArtificerWorkshopAction`, `MaterialRequirement`, `refinement.materials` e `enchantment` estruturados, `recipe`, `ZoneCard.blacksmith`, 19 chaves, motivos novos), `usePartyAction` com as ações novas e as fixtures da D-63 item 6, inclusive `visitBlacksmith` nos `availableActions` já existentes na cidade. Testes primeiro; tipos e testes afetados verdes.
- [x] **T-76 — Laboratório, catálogo e editor** (REQ-77, REQ-78). E2E nas áreas `lab` e `editor`.
- [x] **T-77 — Estado do equipamento e venda por cópia** (REQ-79). E2E na área `party`.
- [x] **T-78 — Ir ao Ferreiro e Oficina: seção e lote** (REQ-80, REQ-81). E2E na área `party`.
- [x] **T-79 — Validação integrada da FEAT-17.** Repetir os cenários do contrato contra o backend real com MSW desligado, com as campanhas preparadas pelo backend (Artífice ativo e Ferreiro Arcano).

### FEAT-18 — Montarias e Estábulo

- [x] **T-80 — Cliente e fixtures MSW da montaria** (REQ-82 a REQ-89). Schemas e tipos do CONTRATO v0.90 (`MountCard`, `cardCounts.mount`, `market.mounts`, 7 chaves, `mount`, `moveRoutes`, `viaZoneId`, `transferMount`, `stable`, `buyMount`/`sellMount` e resultados, `loseMount`, `mountAlreadyOwned`, os 4 motivos novos, `ReceiveSpace` em todos os destinos, `received`, `lastRewardDelivery.space`, `discardOptions`/`keep` com `space`, origens da montaria e `mountAbility`), `usePartyAction` com as ações novas e as fixtures da D-64 item 6. Campos novos com `.default()` nos valores legados (saves antigos leem `mount: null`). Como na D-62 item 8, o que o tipo exigir na tela entra só com a `message`.
- [x] **T-81 — Laboratório, catálogo e editor da montaria** (REQ-82, REQ-83). E2E nas áreas `lab` e `editor`.
- [x] **T-82 — Montaria na tela do grupo e Transferir** (REQ-84, REQ-85). E2E na área `party`.
- [x] **T-83 — Movimentar com montaria** (REQ-86). E2E na área `party`.
- [x] **T-84 — Estábulo** (REQ-87). E2E na área `party`.
- [x] **T-85 — Destinos prontos e descarte com montaria** (REQ-88). E2E na área `party`.
- [x] **T-86 — Efeitos e habilidades da montaria** (REQ-89). E2E na área `party`.
- [x] **T-88 — Alinhar o cliente ao CONTRATO v0.92** (REQ-88). Resultado `craft` com `destination` (padrão `'inventory'`) e texto do resultado do ferreiro dizendo onde o equipamento criado entrou; `PendingReward.destination` lido como espaço principal (D-64 item 4); fixtures do MSW com `rewardDoesNotFit` para cópias acima do espaço. E2E na área `party`. Vem antes da T-87.
- [x] **T-87 — Validação integrada da FEAT-18.** Repetir os cenários do contrato contra o backend real com MSW desligado, com as campanhas preparadas pelo backend (Estábulo, montaria com conteúdo, inventário cheio, mapa com dois caminhos a 2 zonas) e a `fixture.war-pony`.

### FEAT-19 — Conclusão da dimensão, chefe final, passagem e save congelado

- [x] **T-89 — Cliente e fixtures MSW da conclusão** (REQ-90 a REQ-96). Schemas e tipos do contrato da FEAT-19 (campos de conclusão da Carta de Dimensão, item de conclusão, área de itens de conclusão do jogador, ação de conclusão, resumo de conclusão, situação congelada do save, chaves novas e códigos de erro), com `.default()` nos valores legados; fixtures e grupos de dev da D-65 item 6. Só depois do contrato `acordado`.
- [x] **T-90 — Laboratório, catálogo e editor da conclusão** (REQ-90, REQ-91). E2E nas áreas `lab` e `editor`.
- [x] **T-91 — Itens de conclusão e requisito na tela do grupo** (REQ-92). E2E na área `party`.
- [x] **T-92 — Concluir dimensão e painel de conclusão** (REQ-93, REQ-95). E2E na área `party`.
- [x] **T-93 — Chefe final** (REQ-93, REQ-94). E2E na área `party`.
- [x] **T-94 — Save congelado** (REQ-95, REQ-96). E2E nas áreas `app` e `party`.
- [x] **T-95 — Validação integrada da FEAT-19.** Repetir os cenários do contrato contra o backend real com MSW desligado, com as campanhas preparadas pelo backend (no limiar da conclusão, sem e com chefe final, última dimensão lançada). Perfil base verificado diretamente na API real e evidências dos perfis chefe e montaria registradas na T-86 do backend. Ver [devlog 125](devlog/125-T-95-validacao-integrada-feat-19.md).

### FEAT-33 — Coleções estendidas e reprint

- [x] **T-96 — Cliente e fixtures MSW** (REQ-97 a REQ-101). Atualizar schemas, tipos e fixtures de catálogo, editor e mercado após o contrato ficar `acordado`. Cobrir legado, extensão, reprint e coleção fora de vigência.
- [x] **T-97 — Carta de Dimensão no catálogo e no editor** (REQ-97). Editar e exibir as listas, persistir os IDs e mostrar erros indexados. Verificar reabertura e importação de conteúdo legado.
- [x] **T-98 — Mercado e abertura com múltiplas coleções** (REQ-98 a REQ-100). Cobrir lote, recusa por operação, compra por slot e abertura nos dois fluxos. Ajustar pressupostos de coleção única que os cenários revelarem.
- [x] **T-99 — Validação integrada** (REQ-97 a REQ-101). Repetir os cenários acordados contra a API real com MSW desligado, incluindo transição e save legado. Registrar evidências no devlog.

### FEAT-20 — Ajudantes de IA

- [x] **T-100 — Cliente e fixtures MSW** (REQ-102 a REQ-106). Após o contrato ficar `acordado`, atualizar schemas e fixtures para solo legado, limite, recusa, IA em primeiro lugar e ajudantes consecutivos.
- [x] **T-101 — Quantidade de ajudantes em Novo jogo** (REQ-102). Usar limites vigentes e erros de campo. E2E em `app` e `party`.
- [x] **T-102 — Composição e avanço automático** (REQ-103 a REQ-105). Mostrar ordem e aplicar respostas de avanço, retomada e transição. E2E em `party`, com virada de rodada e recuperação após falha.
- [x] **T-103 — Prioridades no laboratório** (REQ-106). Integrar à tela existente. E2E em `lab`.
- [ ] **T-104 — Validação integrada** (REQ-102 a REQ-106). Repetir os cenários do contrato com MSW desligado e registrar as evidências no devlog.

### FEAT-21 — Acompanhar as vezes dos ajudantes

- [ ] **T-105 — Cliente e fixtures MSW** (REQ-107 a REQ-109). Após o acordo, validar respostas de ação e sessão, revisão e lotes vazios, mistos e recuperados.
- [x] **T-106 — Apresentação sequencial** (REQ-107 e REQ-108). Integrar mapa, evento aleatório e combate na tela do grupo, oferecer a opção de pular e testar o bloqueio de ações em E2E de `party`.
- [x] **T-107 — Recuperação e reenvio** (REQ-109). Testar retomada, deduplicação e descarte de recibo antigo com MSW.
- [x] **T-108 — Validação integrada** (REQ-107 a REQ-109). Executar os cenários do contrato com MSW desligado e registrar a evidência.

### FEAT-22 — Recrutar ajudantes e combate em grupo

- [x] **T-109 — Cliente e fixtures MSW** (REQ-110 a REQ-114). Após o acordo, cobrir decisões pendentes, projeção de combatentes, desfechos individuais, recibos e solo legado.
- [x] **T-110 — Recrutamento e pausa da IA** (REQ-110, REQ-111, REQ-114). Cobrir convite nos dois sentidos, confirmação, desempate, recusa e recarga fora da vez humana.
- [x] **T-111 — Combate e recompensas em grupo** (REQ-112 a REQ-114). Apresentar combate por participante, rodízio e progresso de missão ou dimensão. Cobrir reenvio e recibo antigo.
- [x] **T-112 — Validação integrada** (REQ-110 a REQ-114). Executar os cenários do contrato com MSW desligado e registrar evidência HTTP e da interface.

### FEAT-30 — Acabamento visual da campanha solo

- [x] **T-113 — Definir a direção visual e os recursos** (REQ-115 a REQ-119). Revisar as telas solo, aprovar a composição das telas inicial, de exploração e de combate e inventariar artes e ícones do autor por tela, registrando os recursos faltantes e sua apresentação prevista.
- [x] **T-114 — Aplicar o layout de PC à entrada e à exploração** (REQ-115 e REQ-116). Dar acabamento à criação, aos saves, ao mapa e aos painéis de personagem e zona. Reaproveitar os componentes atuais e verificar as duas resoluções e a navegação por teclado.
- [ ] **T-115 — Dar acabamento aos estados e desfechos** (REQ-117 a REQ-119). Aplicar a direção visual a encontros, combate, recompensas e conclusão. Integrar artes, ícones e transições, incluindo booster e forja. Verificar recusa de ação, arte ausente e movimento reduzido.
- [ ] **T-116 — Validar e entregar a revisão solo** (REQ-115 a REQ-119). Executar as verificações de frontend com MSW e o roteiro abaixo com API real. Entregar a revisão identificada e o roteiro reproduzível ao autor.

**Validação real da T-116.** Usar Chrome com `VITE_USE_MOCKS=false` e a API disponibilizada pelo autor, com classe inicial e dimensão publicada concluível por um personagem. Criar um save novo pela interface, abrir a sessão, movimentar, executar uma ação de zona, encerrar a vez e recarregar para conferir a retomada. Cumprir os requisitos publicados, chegar à zona de conclusão e resolver o chefe final, se houver. Conferir resumo, prêmio, estado persistido e passagem à sucessora ou congelamento. Conferir o outro desfecho em cenário complementar, que pode usar dados preparados. A validação exige o percurso completo e os dois desfechos. Registrar revisões do frontend e do backend, navegador, dimensão, ID do save, evidências HTTP e de tela e resultado por cenário.

## 8. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-11-13 | Versão inicial (FEAT-00): visão, arquitetura, decisões D-01 a D-10, pendências P-01 e P-02, tarefas T-01 a T-03. |
| 0.2 | 2026-11-13 | T-01 concluída: D-11 (TypeScript 6.0) e D-12 (libs de teste de componentes e estilo do Prettier); tabela 3.2 atualizada. |
| 0.3 | 2026-11-13 | D-13: correção do `npm audit` (ESLint ^10.15 e override do `minimatch`). |
| 0.4 | 2026-11-13 | T-02 concluída: D-08 detalhada (ponto de entrada de dev = `src/main.tsx` até a T-03; testes importam mocks, não lab; imports livres entre mocks/ e lab/). Vitest também inclui `.claude/hooks/**/*.test.ts`. |
| 0.5 | 2026-11-13 | T-03 concluída: D-10 confirmada (`.env.development` com mocks ligados), D-14 (Zod resolve a P-01), D-15 (MSW pelo plugin `msw/vite`, fora do build); tabela 3.2 atualizada; área de e2e `app` criada (3.5). |
| 0.6 | 2026-11-14 | Fecho da FEAT-01 planejado: REQ-01 (estado da ponte na rota inicial), T-04, `useHealth` em 3.4, `HealthResponse` em 3.3 (CONTRATO v0.4 `acordado`). |
| 0.7 | 2026-11-14 | T-04 concluída: D-16 (health sem retry); REQ-01 explicita que erro HTTP sem envelope §1.4 válido cai em "Servidor indisponível. Tente novamente.". |
| 0.8 | 2026-11-14 | FEAT-02 planejada: REQ-02 a REQ-04, D-17 (só tema escuro), D-18 (tipografia), D-19 (1280×720 a 2560×1440), D-20 (textos dos tooltips no frontend), tarefas T-05 a T-07. |
| 0.9 | 2026-11-14 | T-05 concluída: D-18 revisada (Lora no lugar da Press Start 2P, pedido do autor), D-21 (valores da base visual em `src/ui/tokens.css`); REQ-02 ajustado à fonte de títulos. |
| 0.10 | 2026-11-14 | T-06 concluída: componente `Term` e catálogo `src/ui/terms.ts` com os 9 atributos (textos aprovados pelo autor); tooltip abaixo do termo, conferido pela regra de CSS (jsdom não mede layout). |
| 0.11 | 2026-11-14 | T-07 concluída: D-22 (originais em `assets-src/`, exportação manual para `src/assets/`, catálogo de produção vazio e ids de teste só nos testes); componente `CardCategory`. FE da FEAT-02 pronto. |
| 0.12 | 2026-11-14 | FEAT-03 planejada: REQ-05 (laboratório só no dev), REQ-06 (configuração ajustável), REQ-07 (vitrine de componentes, autor), D-23 (aprovada), hooks do laboratório em 3.4, área `lab` em 3.5, tarefas T-08 a T-10. |
| 0.13 | 2026-11-14 | T-08 concluída: cliente do laboratório (`useLabConfig`, `useUpdateLabConfig`, `useResetLabConfig`), `requestJson` e `LabConfigInvalidError` registrados em 3.4. |
| 0.14 | 2026-11-14 | T-09 concluída: rota `/lab` só no dev, D-24 (rotas de dev entregues por `src/main.tsx`; teste de build `npm run test:build`). |
| 0.15 | 2026-11-14 | T-10 concluída: tela de configuração e vitrine do laboratório; D-25; D-08 e D-22 ajustadas (testes em `src/lab/`, ids de teste usados pela vitrine). FE da FEAT-03 pronto com MSW. |
| 0.16 | 2026-11-14 | D-10 corrigida: a sobrescrita local no dev é `.env.development.local` (o `.env.development` vence o `.env.local` no Vite). Só texto, sem mudança de comportamento. |
| 0.17 | 2026-11-14 | FEAT-04 planejada: REQ-08 a REQ-13 (catálogo e os 5 tipos de carta), D-26 (catálogo só no laboratório), D-27 (efeitos como texto pronto), D-28 (categorias reais com arte pendente), hooks do catálogo em 3.4, tarefas T-11 a T-15. |
| 0.18 | 2026-11-14 | FEAT-04 alinhada ao CONTRATO v0.11 `acordado`: `type` com 6 variantes (filtro com "Evento aleatório" e "Evento de combate" e contagens), lista já traz a carta completa (sai `useCard`), zona mostra o número de setas e sem ofertas de serviço (fora da FEAT), regras comuns de campos ausentes, T-11 e T-12 ajustadas. |
| 0.19 | 2026-11-14 | T-11 concluída: cliente do catálogo (`useCollections`, `useCards`, schemas Zod das 6 variantes de `Card`); D-29 (handler por tabela de cenários, limites da validação, fixtures provisórias). |
| 0.20 | 2026-11-14 | T-12 concluída: catálogo de produção com os 8 `slot` e as 8 `itemCategory` em arte pendente (D-28); `src/ui/labels.ts` com os rótulos pt-BR de tipo de carta, raridade e §2.7, completos por tipo (`satisfies Record`). |
| 0.21 | 2026-11-14 | T-13 concluída: cartas de atributo, equipamento e item em `src/ui/cards/`; D-30 (modificadores no catálogo de termos, formatação pt-BR dos números). |
| 0.22 | 2026-11-14 | T-14 concluída: cartas de zona, evento aleatório e evento de combate em `src/ui/cards/`; D-31 (rótulos das ações de zona, polaridade com texto, bloco por inimigo). |
| 0.23 | 2026-11-14 | FEAT-05 planejada (CONTRATO v0.14 `acordado`): REQ-14 (menu e saves), REQ-15 (novo jogo), REQ-16 (grupo em sessão), REQ-17 (abandonar), D-32, área `party` e hooks da campanha em 3.4, tarefas T-16 a T-19. |
| 0.24 | 2026-11-14 | T-15 concluída: seção "Catálogo" no laboratório (`src/lab/CatalogSection.tsx`); D-33 (controles do catálogo). FEAT-04 com o lado FE pronto (MSW). |
| 0.25 | 2026-11-15 | T-16 concluída: cliente da campanha (`useParties`, `useCreateParty`, `useStartSession`, `useEndSession`, `useAbandonParty`, `PartyInvalidError`); `requestJson` com `DELETE`/`204`; D-34 (handlers por cenário, datas UTC). |
| 0.26 | 2026-11-15 | T-17 concluída: menu inicial com "Novo jogo" e "Seus jogos" e o abandono com diálogo (`src/features/home/SavedGames.tsx`); D-35. |
| 0.27 | 2026-11-15 | T-18 concluída: tela "Novo jogo" em `/novo` com erros por campo (`src/features/party/NewGame.tsx`); D-36. |
| 0.28 | 2026-11-15 | T-19 concluída: tela do grupo em sessão em `/grupo/:partyId` (`src/features/party/PartySession.tsx`); D-37. FEAT-05 com o lado FE pronto (MSW). |
| 0.29 | 2026-11-15 | FEAT-31 planejada (editor de conteúdo, só dev): REQ-18 a REQ-26, D-38 (erros por campo com texto do backend), D-39 (decisões do autor e da spec), área `editor` e cliente do editor em 3.4, tarefas T-20 a T-27. Depende do CONTRATO §3 FEAT-31. |
| 0.30 | 2026-11-15 | T-20 concluída: cliente do editor (`src/api/editor.ts`, `ContentInvalidError`, `PUT` no `requestJson`), fixtures e handlers do MSW por tabela de cenários; D-40, hooks listados em 3.4. |
| 0.31 | 2026-11-16 | T-21 concluída: rota `/lab/editor` e seção "Coleções"; D-41 (roteador de dados, guarda de alterações não salvas); REQ-19 e REQ-24 detalhados; `useEditorCollection` aceita `null`. |
| 0.32 | 2026-11-16 | T-22 concluída: seção "Cartas" do editor (filtros, busca, "Nova carta" com escolha de tipo); D-42. |
| 0.33 | 2026-11-16 | T-23 concluída: formulário de carta (base, zona, atributo) e pré-visualização; D-43 (formato no formulário, caminhos de erro, guarda única do editor). |
| 0.34 | 2026-11-16 | T-24 concluída: formulários de equipamento e item no editor, com sugestão de etiquetas da coleção; D-44. |
| 0.35 | 2026-11-16 | T-25 concluída: formulários de evento aleatório e de combate (lista de inimigos); todos os tipos têm formulário; D-45. |
| 0.36 | 2026-11-16 | T-26 concluída: publicar, duplicar e excluir carta no editor; D-46. |
| 0.37 | 2026-11-16 | T-27 concluída: validar como dimensão, exportar e importar coleção no editor; D-47. Lado FE da FEAT-31 pronto (falta validar contra o backend real). |
| 0.38 | 2026-11-16 | FEAT-06 planejada (CONTRATO v0.21 `acordado`): REQ-27 a REQ-33 (laboratório, catálogo, escolha de classe, partida preparada, editor com Carta de Dimensão e classes), D-48 (escolhas do autor), REQ-16 aponta para o REQ-30, área `party`/`editor` e hooks novos em 3.4, tarefas T-28 a T-34. |
| 0.39 | 2026-11-16 | T-28 concluída: cliente alinhado ao contrato da FEAT-06; D-49 (estado intermediário até T-29, T-30, T-32 e T-33); textos das T-29, T-30, T-32 e T-33 ajustados. |
| 0.40 | 2026-11-16 | T-29 concluída: `DimensionCard` no catálogo e no `FullCard`, forma das setas na carta de zona, testes dos 11 campos (REQ-27) e do filtro "Dimensão" (REQ-28). |
| 0.41 | 2026-11-16 | T-30 concluída: escolha de classe no "Novo jogo" (REQ-29), cenário `required` no handler padrão do MSW, D-50. |
| 0.42 | 2026-11-16 | T-31 concluída: partida preparada na tela do grupo (REQ-30), hook `useCatalogCards`, D-51. |
| 0.43 | 2026-11-16 | T-32 concluída: cliente do editor com classes e Carta de Dimensão, cenários das classes no MSW, `validate-dimension` da `fixture` válida; D-52. |
| 0.44 | 2026-11-16 | T-33 concluída: Carta de Dimensão e forma das setas no editor (REQ-31); D-53. |
| 0.45 | 2026-11-16 | T-34 concluída: classes no editor (REQ-32) e importação com classes (REQ-33); D-54. Lado FE da FEAT-06 pronto com MSW. |
| 0.46 | 2026-11-17 | FEAT-07 planejada (CONTRATO v0.28 `acordado`): REQ-34 (mapa em grade com escolha de zona), REQ-35 (Movimentar), D-55 (escolhas do autor), `usePartyAction` em 3.4, área `party` em 3.5, tarefas T-35 a T-37. |
| 0.47 | 2026-11-17 | T-35 concluída: `PlayerState.moveTargets`, `PartyAction`/`MoveAction` e `usePartyAction` em `src/api/parties.ts`; fixtures `moveTargets` e Party movidos e handler de ações por tabela de cenários no MSW (D-55 item 5: `stone-bend`/`whispering-grove`/`gray-harbor` → `200`; `old-mine` → `409 ACTION_NOT_ALLOWED`; zona desconhecida e `type` desconhecido → `400 ACTION_INVALID`). |
| 0.48 | 2026-11-17 | T-36 concluída: região "Mapa" na tela do grupo (`PartyMap`, REQ-34): grade pelas posições, zonas como botões com setas e "{characterName} está aqui", ligações só de `crossings` entre vizinhas, "Zona escolhida" com a carta e "Travessias com". Posição também em `data-col`/`data-row` (jsdom descarta as propriedades de grade). |
| 0.49 | 2026-11-17 | T-37 concluída: botão "Movimentar para {title}" na "Zona escolhida" só para zonas de `moveTargets` do host; a tela passa a mostrar o `Party` do `200` (sem novo `GET`, D-55 item 4) e "Você está em {title}." com o título da `zoneId` devolvida; erros na área de status sem mudar a tela. Lado FE da FEAT-07 pronto com MSW. |
| 0.50 | 2026-11-17 | FEAT-08 planejada (CONTRATO v0.33 `implementado (BE)`): REQ-36 (a vez na tela), REQ-37 (ações disponíveis, alinha o REQ-35), REQ-38 (Encerrar a vez), D-56, área `party` em 3.5, tarefas T-38 a T-40. |
| 0.51 | 2026-11-17 | T-38 concluída: `Party.turn` e `PlayerState.availableActions` no schema, `EndTurnAction` em `PartyAction`, `usePartyAction` aceita `endTurn`; fixtures com `turn`/`availableActions` (1 movimento = 2 pontos); cenário "0 pontos" por `id` de grupo (`party-sem-pontos`) no handler (D-56 item 3). |
| 0.52 | 2026-11-17 | T-39 concluída: região "A vez" antes do "Mapa" (rodada, vez, "{n} pontos de ação" com termo e singular), botão "Encerrar a vez" só com `endTurn` em `availableActions`, envio sem confirmação com os botões de ação desabilitados durante o pedido, "Rodada {round}: vez de {characterName}." no `200`; D-56 item 6 (termo `actionPoints`, rótulo opcional no `Term`). |
| 0.53 | 2026-11-17 | T-40 concluída: "Movimentar para {title}" só com `move` em `availableActions`; "Sem pontos de ação para Movimentar." na "Zona escolhida" quando a zona está em `moveTargets` e `turn.actionPoints` é 0; D-56 item 7 (sessão do MSW abre o grupo `party-sem-pontos` com 0 pontos). Fecha o lado FE da FEAT-08 com MSW. |
| 0.54 | 2026-11-17 | FEAT-09 planejada (CONTRATO v0.37 `implementado (BE)`): REQ-39 (valores no laboratório, alinha o REQ-06), REQ-40 (build e pasta, alinha o REQ-30), REQ-41 (Recuperar), REQ-42 (Ajustar deck), D-57, áreas `lab` e `party`, tarefas T-41 a T-44. |
| 0.55 | 2026-11-17 | T-41 concluída: 5 chaves da FEAT-09 em `GameConfigValues`; `build`, `buildSize`, `tcgFolder`, `tcgFolderCapacity` em `PlayerState`; `RecoverAction`, `AdjustDeckAction`; `ActionNotAllowedError` (`reason`, `cardId`); fixtures e tabela do MSW (D-57 item 6 detalhado); rótulos do REQ-39 no `LabPage`. |
| 0.56 | 2026-11-17 | T-42 concluída: listas "Build" e "Pasta de TCG" na seção do membro (REQ-40); o REQ-39 já estava no `LabPage` desde a T-41. |
| 0.57 | 2026-11-17 | T-43 concluída: grupo "Recuperar" (3 botões) na região "A vez" e status "Recuperou: vida …, Vigor …." (REQ-41); sem decisão nova. |
| 0.58 | 2026-11-17 | T-44 concluída: botão "Ajustar deck" e seção com uma linha por carta da build ∪ pasta, "Salvar build"/"Cancelar", validação inteiro ≥ 0, status "Build salva: {buildSize} cartas." e recusas por motivo na seção (REQ-42); D-57 item 9. Fecha o lado FE da FEAT-09 com MSW. |
| 0.59 | 2026-11-17 | FEAT-10 planejada (CONTRATO v0.41 `implementado (BE)`): REQ-43 (valores no laboratório, alinha o REQ-06), REQ-44 (inventário, equipamentos e bolsa, alinha os REQ-30 e REQ-40), REQ-45 (Preparar), REQ-46 (doação do laboratório), D-58, `useParty` e `useLabGrant` em 3.4, áreas `lab` e `party`, tarefas T-45 a T-48. |
| 0.60 | 2026-11-17 | T-45 concluída: `inventoryCapacity` e `purseCapacity` em `GameConfigValues`; `inventory`, `inventoryCapacity`, `equipment`, `purseCapacity`, `effectiveModifiers` em `PlayerState`; `prepare` em `PartyAction` e `availableActions`; 7 motivos novos em `ActionNotAllowedDetails`; `useParty` e `useLabGrant` (`LabGrantInvalidError`, `LabGrantNoSpaceError`); fixtures, 5 cartas novas e cenários do MSW; D-58 item 6. |
| 0.61 | 2026-11-17 | T-46 concluída: REQ-43 (rótulos já entraram na T-45, só testes) e REQ-44 na seção do membro (ouro com a bolsa, "Modificadores" efetivos e "Modificadores da classe", "Equipamentos", "Inventário"); D-58 item 7. |
| 0.62 | 2026-11-17 | T-47 concluída: REQ-45 ("Equipar"/"Guardar" no item da lista, envio, mensagens e recusas por motivo); a tela mantém o último `Party` devolvido quando um pedido seguinte falha; D-58 item 8. Cabeçalho corrigido (ficara em 0.60 na T-46). |
| 0.63 | 2026-11-18 | T-48 concluída: REQ-46 (seção "Doação" em `/lab`); `useCards` aceita `null`; `useLabGrant` invalida `partiesKey`; D-58 item 9. Lado FE da FEAT-10 pronto com MSW. |
| 0.64 | 2026-11-18 | FEAT-32 planejada (CONTRATO v0.46 `acordado`, com `lastScavenge`): REQ-47 (valores do cofre no laboratório), REQ-48 (ferramentas e decks de recompensas no catálogo), REQ-49 (no editor), REQ-50 (cofre na tela do grupo), REQ-51 (Vasculhar), REQ-52 (Usar cofre em lote), D-59, 3.4, áreas `lab`, `editor` e `party`, tarefas T-49 a T-53. |
| 0.65 | 2026-11-18 | T-49 concluída: cliente da FEAT-32 (`GameConfigValues`, campos novos das cartas, `Vault` e campos do `PlayerState`, `UseVaultAction`/`ScavengeAction`, motivos e `operationIndex` em `ActionNotAllowedDetails`); MSW da D-59 item 6; D-59 item 8. |
| 0.66 | 2026-11-18 | T-50 concluída: REQ-47 (e2e) e REQ-48 no catálogo (ferramenta, "Vasculha em", "Coletada com", "Decks de recompensas"); D-59 item 9. |
| 0.67 | 2026-11-18 | T-51 concluída: REQ-49 no editor ("Tipo de ferramenta", "Vasculha em", "Coletada com" no item; "Coletada com" no equipamento; "Decks de recompensas" na Carta de Dimensão); D-59 item 10. |
| 0.68 | 2026-11-18 | T-52 concluída: REQ-50 (cofre na seção do membro) e REQ-51 (Vasculhar na região "A vez", resultado por `lastScavenge`, `inventoryFull` com texto próprio); grupo `party-com-vara` no MSW; D-59 item 11. |
| 0.69 | 2026-11-18 | T-53 concluída: REQ-52 (seção "Usar cofre" com os formulários, a lista "Operações", o envio do lote e a recusa marcada por `operationIndex`); D-59 item 12. Lado FE da FEAT-32 pronto com MSW. |
| 0.70 | 2026-11-19 | FEAT-11 planejada dentro do retorno autorizado: REQ-53 a REQ-55, D-60, T-54 a T-57. Editor com campos JSON por parte escolhido pelo autor; contrato v0.52 recebido sem divergências entre cópias. |
| 0.71 | 2026-11-20 | T-56 concluída com MSW: status, ativação e pagamento por cópia na partida (REQ-54, D-60). |
| 0.72 | 2026-11-20 | T-57 concluída: FEAT-11 validada por HTTP e nas telas contra o backend real, sem MSW. |
| 0.73 | 2026-11-20 | T-54 concluída após aprovação de `typecheck` e `test:build`. |
| 0.74 | 2026-11-20 | FEAT-12 com CONTRATO v0.56 acordado. Critérios REQ-56 a REQ-59, D-61 e tarefas T-58 a T-62 aprovados pelo autor. |
| 0.75 | 2026-11-20 | T-62 concluída. FEAT-12 validada contra a API real com MSW desligado. |
| 0.76 | 2026-11-20 | Autor aprovou REQ-60 a REQ-62 e T-63 a T-67 da FEAT-13, conforme CONTRATO v0.64. T-63 concluída com cliente e fixtures MSW. |
| 0.77 | 2026-11-20 | T-64 concluída com MSW: catálogo, editor e laboratório de combate (REQ-60). |
| 0.78 | 2026-11-20 | T-65 concluída com MSW: tela, ações, pagamentos e desfechos de combate solo (REQ-61). |
| 0.79 | 2026-11-20 | T-66 concluída com MSW nos quatro cenários de escolha de efeitos disparados (REQ-62). T-67 aguarda integração com a API real. |
| 0.80 | 2026-11-21 | Proposta da FEAT-14 para aprovação: REQ-63 a REQ-65, T-68 e lacunas do contrato. Base: ROADMAP v0.64 e CONTRATO v0.66, que registra a validação da FEAT-13 após a T-67. |
| 0.81 | 2026-11-21 | Autor aprovou os REQ-63 a REQ-65 e a T-68 da FEAT-14. A T-68 aguarda o acordo do contrato. |
| 0.82 | 2026-11-22 | Autor aprovou os REQ-66 a REQ-70 e a T-69 da FEAT-15. A T-69 aguarda acordo do CONTRATO v0.70. |
| 0.83 | 2026-11-22 | T-69 concluída com MSW conforme CONTRATO v0.73. Interfaces e validação integrada seguem em etapas posteriores. |
| 0.84 | 2026-11-23 | Proposta da FEAT-16 para aprovação: REQ-71 a REQ-76, D-62, T-70 a T-74. Base: CONTRATO v0.81 (`implementado (BE)`) e ROADMAP v0.72. |
| 0.85 | 2026-11-23 | Autor aprovou os REQ-71 a REQ-76, a D-62 e as T-70 a T-74 da FEAT-16, com os textos propostos e o "Total previsto". Contrato sem mudança (v0.81). |
| 0.86 | 2026-11-23 | T-70 concluída com MSW conforme CONTRATO v0.81 (D-62 item 8). Telas e validação integrada seguem nas T-71 a T-74. |
| 0.87 | 2026-11-23 | T-71 concluída: laboratório, catálogo e editor com os campos do mercado (D-62 item 9). |
| 0.88 | 2026-11-24 | T-72 concluída: Ir ao Mercado na tela do grupo (REQ-73, REQ-74) e linha de expansões (REQ-76), com MSW (D-62 item 10). Abrir booster e validação integrada seguem nas T-73 e T-74. |
| 0.89 | 2026-11-24 | T-73 concluída: Abrir booster no Preparar e no Usar cofre, lista "Cartas do booster" e origem da entrega pendente (REQ-75, D-62 item 11), com MSW. Falta a T-74 (validação integrada). |
| 0.90 | 2026-11-24 | T-74 concluída: FEAT-16 validada contra o backend real (CONTRATO v0.82). |
| 0.91 | 2026-11-24 | Proposta da FEAT-17 para aprovação: REQ-77 a REQ-81, D-63, T-75 a T-79. Base: CONTRATO v0.85 (`acordado`) e ROADMAP v0.77. |
| 0.92 | 2026-11-24 | Autor aprovou a v0.91 com a fixture de dev do Artífice. T-75 concluída com MSW conforme CONTRATO v0.85 (D-63 item 8). |
| 0.93 | 2026-11-24 | T-76 concluída: laboratório, catálogo e editor do ferreiro (REQ-77, REQ-78, D-63 item 9). REQ-10 e REQ-21 alinhados ao REQ-78 (blocos "Refino" e "Encantamento"; "Slots"); rótulo "Identificador do encantamento {n}". |
| 0.94 | 2026-11-24 | T-77 concluída: estado do equipamento na tela do grupo e venda por cópia no Mercado (REQ-79), com MSW; formato do sufixo, descrição da venda e total por cópia fixados no REQ-79. |
| 0.95 | 2026-11-24 | T-78 concluída: seção do ferreiro e da Oficina com lote, confirmação, resultado e textos dos motivos (REQ-80, REQ-81), com MSW; formatação fixada na D-63 item 10. |
| 0.96 | 2026-11-24 | T-79 concluída: FEAT-17 validada contra o backend real (CONTRATO v0.87). O cenário "Lote com falha e quebra" tem 5 operações e nenhuma `skipped`; o MSW e o teste da T-75 (6 operações, D-63 item 8) ficam a alinhar. |
| 0.97 | 2026-11-24 | Proposta da FEAT-18 para aprovação: REQ-82 a REQ-89, D-64, T-80 a T-87. Base: CONTRATO v0.90 (`acordado`) e ROADMAP v0.83. |
| 0.98 | 2026-11-25 | Autor aprovou a v0.97. T-80 concluída com MSW conforme CONTRATO v0.90 (D-64 item 8). |
| 0.99 | 2026-11-25 | T-81 concluída com MSW: laboratório, catálogo e editor da montaria (D-64 item 9). |
| 1.00 | 2026-11-25 | T-82 concluída com MSW: montaria na tela do grupo e Transferir (REQ-84, REQ-85; D-64 item 10). |
| 1.01 | 2026-11-25 | T-83 concluída com MSW: Movimentar com montaria (REQ-86). |
| 1.02 | 2026-11-25 | T-84 concluída com MSW: Estábulo no Ir ao Mercado (REQ-87). |
| 1.03 | 2026-11-25 | T-85 concluída com MSW: destinos prontos, resultado do mercado por espaço e descarte por carta e espaço (REQ-88). |
| 1.04 | 2026-11-25 | T-86 concluída com MSW: origem "Montaria" nos efeitos ativáveis e texto do `noMount` no Preparar (REQ-89). |
| 1.05 | 2026-11-25 | CONTRATO v0.92 (aceite da v0.91): nova T-88 de alinhamento antes da T-87; D-64 item 4 atualizado. |
| 1.06 | 2026-11-25 | T-88 concluída com MSW: `craft` com `destination` (REQ-81, REQ-88) e `rewardDoesNotFit` para cópias acima do espaço no MSW. |
| 1.07 | 2026-11-25 | T-87 concluída: FEAT-18 validada contra o backend real (CONTRATO v0.94); D-64 item 8 com o 400 de `useAbility` do backend, alinhado no MSW. |
| 1.08 | 2026-11-25 | Proposta da FEAT-19 para aprovação: REQ-90 a REQ-96, D-65, T-89 a T-95. Base: ROADMAP v0.85; contrato da FEAT-19 a propor. Coleções estendidas e reprint fora (FEAT própria, decisão do autor). |
| 1.09 | 2026-11-26 | Autor aprovou a FEAT-33 (REQ-97 a REQ-101, D-66 e T-96 a T-99). T-96 aguarda o acordo do CONTRATO v1.01. |
| 1.10 | 2026-11-26 | FEAT-20 aprovada no FE (REQ-102 a REQ-106 e T-100 a T-104). T-100 aguarda o acordo do CONTRATO v1.05. |
| 1.11 | 2026-11-27 | FEAT-21 aprovada no FE. D-67, REQ-107 a REQ-109 e T-105 a T-108. T-105 aguarda o acordo do CONTRATO v1.11. |
| 1.12 | 2026-11-27 | FEAT-22 aprovada no FE. D-68, REQ-110 a REQ-114 e T-109 a T-112. T-109 aguarda o acordo do CONTRATO v1.16. |
| 1.13 | 2026-11-27 | Planejamento da FEAT-30 aprovado no FE. REQ-115 a REQ-119 e T-113 a T-116, com roteiro de validação solo pela API real. |
