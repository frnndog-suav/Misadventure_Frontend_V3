# Misadventures (frontend) — Especificação

> **Versão da spec:** 0.21 · **Data:** 2026-11-14
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
| `useCards(collectionId, type?)` | consulta `GET /catalog/collections/:collectionId/cards`: `Card[]` completo (união por `type`), filtrado pelo backend | T-11 |

Base comum (T-08): `requestJson(method, path, body?)` em `src/api/http.ts` faz todo pedido; `ApiError` traz `code`, `message` e `details` (ainda `unknown`); `LAB_CONFIG_INVALID` com `details` válido vira `LabConfigInvalidError` (subclasse, com `fields`); com `details` fora do contrato vira erro genérico (falha de validação, REQ-06).

### 3.5 Telas e áreas de e2e

| Área | Rota | Telas | FEAT |
|---|---|---|---|
| app | `/` | rota inicial (placeholder "Misadventures" até a primeira tela real) + área de status da ponte com o servidor (REQ-01); tema e tipografia da base visual (REQ-02) | FEAT-01, FEAT-02 |
| lab | `/lab` (só dev, D-07) | laboratório: configuração ajustável do jogo e vitrine de componentes (REQ-05 a REQ-07); catálogo de cartas (REQ-08 a REQ-13) | FEAT-03, FEAT-04 |

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

- **Dado** uma carta `equipment` (README 5.1), **quando** exibida, **então** mostra: nome; categoria de `slot` (REQ-04); etiquetas; raridade; modificadores na ordem recebida, com o primeiro marcado "principal" (ex.: "+12 Ataque (principal)"); ajuste de preço ("Preço ×1,2"); e, só quando presentes, "Pico {n}", restrição de classe (rótulos das classes), "Bloqueia escudo" (só quando `true`), habilidades (nome e texto), efeitos, refino ("Refinável até +{maxLevel}" e os materiais) e encantamento.

### REQ-11 — Carta de item

- **Dado** uma carta `item` (README 5.2), **quando** exibida, **então** mostra nome, categoria de `itemCategory` (REQ-04), etiquetas, raridade e efeitos.

### REQ-12 — Carta de zona

- **Dado** uma carta `zone` (README 3.4), **quando** exibida, **então** mostra título, tipo de zona, local, "Setas de conexão: {n}", as ações de zona (rótulos do glossário §2.5) e os efeitos, cada um marcado "Positivo" ou "Negativo" de `polarity` (com texto, não só cor).

### REQ-13 — Cartas de evento

- **Dado** uma carta `randomEvent` (README 14.1), **quando** exibida, **então** mostra título, requisitos de resolução, "Coisa boa", "Coisa ruim" e, só quando `noEscape` é `true`, "Sem fuga" (com rótulo, não só ícone).
- **Dado** uma carta `combatEvent` (README 14.1, 18.1), **quando** exibida, **então** mostra título, "Coisa boa", "Coisa ruim", "Sem fuga" como acima e um bloco por inimigo com: "{count}× {name}" (só o nome quando `count` é 1), flavor text, tipos, criatura, categoria, elemento (se houver), vida, os 7 modificadores, Vigor (se houver), habilidades e comportamento.

Formato:

### REQ-nn — <nome>
- **Dado** <estado>, **quando** <ação>, **então** <resultado exato>.

## Decisões

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

**Pendências (decidir antes da tarefa indicada):**
- **P-02 — Como o jogador vê as vezes dos outros no momento 2** (antes da FEAT-21): proposta: o backend devolve a lista ordenada de eventos do domínio e o frontend anima um por um; no momento 3 só o transporte muda (socket). Registrada também no ROADMAP.

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
- [ ] **T-14 — Cartas de zona e de evento** (REQ-12, REQ-13). Componentes em `src/ui/cards/`. Como verificar: testes de componente com as fixtures.
- [ ] **T-15 — Seção "Catálogo" no laboratório** (REQ-08; D-26). Lista por coleção e tipo, carta escolhida exibida com o componente do `kind`, estados de carregamento e erro. Como verificar: `npm run dev` (mocks) em `/lab`; unitários do REQ-08 e e2e da área `lab`.

A T-15 fecha o lado FE da FEAT-04 com MSW; depois, `/retorno-backend` contra o backend real. Estilo visual das cartas (moldura PSX, raridade): `/visual` depois da T-15, se o autor quiser.

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
