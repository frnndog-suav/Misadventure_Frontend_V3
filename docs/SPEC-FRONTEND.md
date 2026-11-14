# Misadventures (frontend) — Especificação

> **Versão da spec:** 0.7 · **Data:** 2026-11-14
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

### 3.5 Telas e áreas de e2e

| Área | Rota | Telas | FEAT |
|---|---|---|---|
| app | `/` | rota inicial (placeholder "Misadventures" até a primeira tela real) + área de status da ponte com o servidor (REQ-01) | FEAT-01 |

### 3.6 Laboratório

Requisitos em README II.6. No frontend: existe só no build de dev (D-07); cada FEAT acrescenta os valores do Apêndice A que ela usa, conforme o ROADMAP. O backend aplica os valores; a tela só os edita e mostra.

## Requisitos

### REQ-01 — Estado da ponte com o servidor na rota inicial

A rota inicial mostra uma **área de status** (elemento com papel acessível `status`), discreta, abaixo do título. Os textos exatos:

- **Dado** o app aberto na rota inicial, **quando** a consulta `GET /health` está em andamento, **então** a área de status mostra "Conectando ao servidor…".
- **Dado** o backend respondendo `200` com `{ "status": "ok", "contractVersion": "0.4" }`, **quando** a rota inicial carrega, **então** a área de status mostra "Servidor conectado · contrato v0.4" (a versão vem de `contractVersion`; nunca fixa no código do frontend).
- **Dado** o backend respondendo erro no formato do CONTRATO §1.4 (ex.: `500` com `{ "error": { "code": "INTERNAL_ERROR", "message": "Erro inesperado no servidor. Tente novamente." } }`), **quando** a rota inicial carrega, **então** a área de status mostra exatamente a `message` recebida (D-01) e nenhuma exceção chega à tela.
- **Dado** o servidor inacessível (falha de rede) ou uma resposta que não passa na validação (D-14) — inclusive um erro HTTP cujo corpo não é o envelope §1.4 válido —, **quando** a rota inicial carrega, **então** a área de status mostra "Servidor indisponível. Tente novamente." e nenhuma exceção chega à tela. *(Texto do frontend: falha de conexão não é regra de jogo e não tem `message` do backend; corpo fora do contrato nunca vira texto cru na tela.)*

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
- **D-08 — Guarda de `src/`:** proibidos em `src/`: `Math.random` (sorteio é do backend; animações são determinísticas); `any`; `fetch`, `XMLHttpRequest`, `WebSocket` e `io(` fora de `src/api/`; importar `src/mocks/` fora do ponto de entrada de dev e dos testes; importar `src/lab/` fora da rota de dev. Aplicada pelo hook `.claude/hooks/client-guard.mjs` e pelo ESLint (T-02). Ponto de entrada de dev: `src/main.tsx` (passa a ser a rota de dev na T-03); testes podem importar `src/mocks/`, não `src/lab/`; dentro de `src/mocks/` e `src/lab/` (ambos só de dev) os imports entre si são livres.
- **D-09 — PC primeiro:** o layout se ajusta à resolução do monitor (README II.1). A faixa de resoluções suportada é definida no `/guia-visual` (FEAT-02).
- **D-10 — Variáveis de ambiente (confirmada na T-03):** `VITE_API_URL` (endereço do backend) e `VITE_USE_MOCKS` (`true` liga o MSW no dev; qualquer outro valor desliga). `.env.development` (commitado) traz `VITE_USE_MOCKS=true` — o mock fica ligado por padrão no dev; `.env.example` documenta as duas; `.env.local` (gitignored) sobrescreve localmente. *(Autor, 2026-11-13.)*
- **D-11 — TypeScript 6.0 em vez do 7.0:** o template veio com TS ~7.0.2, mas o typescript-eslint só suporta até `<6.1` (o `npm run lint` falhava com "typescript-eslint does not support TS 7.0" e o npm recusava instalar libs novas por conflito de peer). Voltou para ~6.0.3. *(Autor, 2026-11-13. Volta para o 7 quando o typescript-eslint suportar.)*
- **D-12 — Testes de componentes e estilo de formatação:** autorizados `@testing-library/react`, `@testing-library/jest-dom` e `jsdom` (Vitest roda em `jsdom`, setup em `vitest.setup.ts`). Prettier sem ponto e vírgula e com aspas simples (o estilo que o código do template já usava). O Prettier formata também os Markdown fora de `docs/` (`CLAUDE.md`, `.claude/`); `docs/` fica fora para não reformatar o README compartilhado. `test:e2e` usa `--pass-with-no-tests` enquanto não houver e2e. *(Autor, 2026-11-13.)*
- **D-13 — Correção do `npm audit`:** os 9 alertas moderados eram uma única falha (GHSA-g3hv-75wg-m249, negação de serviço no `minimatch` 10), só em ferramentas de desenvolvimento (ESLint e typescript-eslint); o build de release já tinha 0. ESLint atualizado para ^10.15.0 e `overrides.minimatch = ^11.0.8` no `package.json`, porque o typescript-eslint mais novo (8.72.2) ainda pede o `minimatch` vulnerável e o `npm audit fix --force` o rebaixaria para 8.36. **Remover o override** quando o typescript-eslint publicar uma versão com o `minimatch` corrigido (conferir com `npm audit` depois de tirá-lo). *(Pedido do autor, 2026-11-13.)*

- **D-14 — Validação dos dados recebidos com Zod (resolve a P-01):** todo dado do backend entra como `unknown` e passa por um schema Zod antes de virar tipo do contrato (Princípio 2). Zod autorizado e instalado na T-03; schema → tipo num lugar só por inferência. *(Autor, 2026-11-13; alternativa descartada: validadores à mão — sem lib, porém mais código e risco de tipo e validador divergirem.)*
- **D-15 — MSW pelo plugin `msw/vite`:** o worker do MSW não fica em `public/` — o plugin o serve só no dev e só o emitiria no build se algum bundle importasse `virtual:msw`; a inicialização em `src/main.tsx` fica atrás de `import.meta.env.DEV` + `shouldEnableMocks` (D-10), então o build de release não contém código do MSW (verificado na T-03 com busca no `dist/`). *(T-03, 2026-11-13.)*
- **D-16 — Consulta de health sem retry automático:** `useHealth` usa `retry: false` — o erro aparece imediatamente na área de status e os testes ficam determinísticos (o padrão do TanStack Query são 3 tentativas com backoff, ~15 s até o estado de erro). Vale só para esta consulta; o padrão das próximas é decidido quando surgirem. *(T-04, 2026-11-14.)*

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
