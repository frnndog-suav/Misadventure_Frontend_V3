---
name: guia-visual
description: Guia visual do Misadventures (referência, não fluxo) - direção de arte PSX, tipografia, cor e tokens, superfícies e cartas, termos com destaque, movimento, layout para PC e acessibilidade, e o que nunca usar. Use antes de criar ou mudar qualquer tela, estilo, animação ou ícone (a /visual, o ux-designer, o motion-dev e o ui-dev leem), ou quando o autor perguntar como algo deve parecer.
---

# /guia-visual

> **Estado (2026-11-14, T-05):** tipografia, paleta, tema, faixa de resoluções e movimento definidos (spec D-17 a D-19, D-21). Valores de verdade: `src/ui/tokens.css` (fonte única; a UI só usa esses tokens). Itens ainda marcados _a definir_ não podem ser inventados numa tarefa: pergunte. **Layout e acabamento ficam para a FEAT-30 (§8).**

## 1. Direção de arte

- **O jogo é 2D.** Não há renderização 3D. O estilo PSX (fim dos anos 1990) aparece nas **imagens, ícones, animações e transições**; as artes podem retratar cenas com aparência de 3D de PS1 (README II.5).
- **Imagens e ícones são do autor** (README II.4). SVG próprio só para testes (veja `/assets`).
- O texto de referência para gerar arte é o de README II.5 (mantido em inglês de propósito). Não o reescreva.

| Característica da referência (README II.5)                | Tradução na interface                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Texturas de baixa resolução, pixelização visível          | _a definir na FEAT-02_ (ex.: escalar as artes do autor sem suavização)   |
| Profundidade de cor baixa, dithering sutil                | _a definir na FEAT-02_ (paleta contida; textura nunca sob texto corrido) |
| Efeitos visuais contidos, sem pós-processamento excessivo | animações e transições **bonitas e simples** (README II.4)               |
| Imperfeições do hardware original (jitter, aliasing)      | _a definir na FEAT-02_, só em transições e nunca em texto                |

**Proibido** (README II.5 e decisões do projeto): fotorrealismo moderno; alta resolução e suavização "modernizante" nas artes; PBR, ray tracing, estética de Unreal Engine 5 ou CGI cinematográfico; pós-processamento excessivo; renderização 3D na interface; texto sobre textura sem contraste.

## 2. Tipografia

- **Títulos** (`--font-title`, Lora, licença OFL em `src/ui/fonts/Lora/OFL.txt`): **só títulos e rótulos curtos** (spec D-18). Arquivo variável servido com o app, sem CDN. A fonte pixelada foi descartada pelo autor; a identidade PSX fica nas imagens, ícones e animações.
- **Legível** (`--font-body`, fonte do sistema): texto corrido, efeitos de carta, tooltips, valores.
- **Escala:** `--text-sm` 0.875rem · `--text-md` 1rem · `--text-lg` 1.25rem · `--text-title` 2rem. A fonte raiz acompanha o monitor (`clamp(14px, 0.5rem + 0.5vw, 20px)`), então tudo em `rem` escala junto.
- _A definir quando surgirem:_ rótulos de carta e números tabulares para valores que mudam (vida, Pico, Vigor, ouro).
- Fonte nova só com autorização.

## 3. Cor e tema

- A UI usa só **tokens semânticos**, nunca cores soltas (spec D-17):

| Token                | Uso                                      |
| -------------------- | ---------------------------------------- |
| `--color-bg`         | fundo da página                          |
| `--color-surface`    | painéis, cartas, tooltips                |
| `--color-border`     | contornos decorativos (não informativos) |
| `--color-text`       | texto principal                          |
| `--color-text-muted` | texto secundário                         |
| `--color-accent`     | destaque dos termos do jogo              |
| `--color-danger`     | erros e perigo                           |
| `--color-focus`      | contorno de foco                         |

- Todo token de texto passa 4.5:1 sobre `--color-bg` e `--color-surface`; `--color-focus` passa 3:1 (teste `src/ui/tokens.test.ts` — token de cor novo entra na lista do teste).
- **Contraste inegociável:** WCAG AA (4.5:1 para texto; 3:1 para texto grande, ícones informativos e contorno de foco).
- Opacidade não marca estado (derruba o contraste); use um token de "desligado".
- **Só tema escuro** (spec D-17).

## 4. Superfícies, cartas e termos

- **Categoria da carta sempre visível:** cada carta mostra a categoria com **ícone, imagem e label** (README II.4; ex.: diferenciar amuletos de Arma, Acessório e Relíquia).
- **Termos do jogo com destaque:** termos e suas variações têm destaque ou cor própria e mostram um **tooltip** explicativo ao passar o mouse (README II.4). A lista de termos vem do glossário do `docs/CONTRATO.md` §2; o texto do tooltip é pt-BR.
- Painéis, botões (normal, foco, pressionado, desabilitado) e área mínima de clique: _a definir na FEAT-02._

## 5. Movimento

- Durações (spec D-21): `--duration-micro` 120 ms; `--duration-screen` 250 ms; teto `--duration-max` 500 ms. Easing padrão `--easing-standard` (`cubic-bezier(0.2, 0, 0, 1)`).
- **Nunca bloquear a entrada:** o estado já mudou quando a animação começa; cliques, atalhos, foco e anúncios acessíveis funcionam durante a animação.
- Só `transform`/`opacity` (exceções justificadas).
- **Determinismo:** sem aleatório (`Math.random` é proibido em `src/`, spec D-08); keyframes fixos. A animação **reage aos dados que o backend envia**, não recalcula regras.
- `prefers-reduced-motion`: nada se desloca nem gira; no máximo um fade curto.
- As vezes dos outros jogadores e os acontecimentos do combate são animados em sequência (pendência P-02 do roadmap).

## 6. Layout e acessibilidade

- **PC primeiro** (spec D-09): distâncias, tamanhos e margens se ajustam ao monitor. Faixa suportada: **1280×720 a 2560×1440** (spec D-19), conferida nos e2e de `tests/e2e/app/visual.spec.ts`. Sem rolagem horizontal na faixa suportada. Espaçamentos com os tokens `--space-*`.
- Controles reais (botão, link, campo) operáveis por teclado, com `focus-visible` visível.
- Tooltips não cobrem o controle que os abriu; rolagem interna focável.
- Resultados dinâmicos em `aria-live="polite"`.
- Textos visíveis e papéis ARIA definidos pela spec **não mudam** numa tarefa visual.

## 7. Antes de mudar qualquer coisa

- Índice do devlog e as entradas da área; `git log --oneline -- <arquivos>`.
- Decisões da spec que regem as telas afetadas.
- Decisão de design durável (paleta, fonte, tokens, padrão de animação, convenção de ícones) vira `D-xx` na spec e atualiza este guia.

## 8. FEAT-30 — Acabamento visual (pendente)

**Até a FEAT-30, nenhuma tarefa faz passada de layout** (decisão do autor, 2026-11-15; ROADMAP v0.22). As telas usam só os tokens e a estrutura semântica; layout, componentes e tratamento PSX ficam para a FEAT-30, que vem depois de todas as FEATs funcionais e antes da FEAT-29. Os itens "a definir" deste guia são resolvidos nela. Fluxo: `/mudar-spec` para planejar a FEAT-30, depois uma `/visual` por tela.

**Diretrizes pesquisadas (2026-11-15), a transformar em regras deste guia:**

- **Zonas de tela:** informação persistente nas bordas e cantos, centro livre para a ação, informação de contexto só quando necessária. Cada elemento fica sempre no mesmo lugar. HUD mínimo: inventário, mapa e diário ficam sob demanda. PC permite mais densidade que console, sem poluir. Fontes: [Abratabia, HUD](https://abratabia.com/game-ui-design/hud-design.php), [RocketBrush](https://rocketbrush.com/blog/designing-practical-and-pretty-hud-in-video-games), [7 erros de HUD](https://bootcamp.uxdesign.cc/7-obvious-beginner-mistakes-with-your-games-hud-from-a-ui-ux-art-director-d852e255184a).
- **Jogo de cartas:** mão em leque na borda de baixo; contadores de mão e deck sempre visíveis; o mais importante primeiro na carta; cartas jogadas com o mesmo formato das da mão; controles refletem só as ações disponíveis (vindas do backend); nada importante só na visão periférica. Fontes: [Gwent](https://www.gamepressure.com/gwent-the-witcher-card-game/user-interface/z79e5d), [CrowdControl](https://crowdcontrol-network.gitbook.io/crowdcontrol-learn/design-guidelines/game-board), [contraste em CCG](https://gamedeveloper.com/design/contrast-and-user-focus-in-ui-design-for-an-online-ccg).
- **Menus:** menus densos podem ser lidos com calma; o HUD tem que ser entendido num olhar. Abas para 3–7 seções equivalentes, barra lateral para muitas. Fonte: [Unity, UI/UX basics](https://unity.com/blog/video-game-ui-ux-basics).
- **Acessibilidade de jogo:** texto nunca embutido em imagem (exceto o logo); 4.5:1 e 3:1 de contraste (já valem aqui); "texto grande" a partir de ~36 px em 1080p; considerar um modo de alto contraste (7:1) e o ajuste do tamanho do texto. Fontes: [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines), [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/basic/).

**Perguntas ao autor no início da FEAT-30** (com a recomendação):

1. Clima e tom (recomendação: fantasia com humor, aventura desastrada, pelo nome do jogo).
2. Dois ou três jogos de referência de interface.
3. Material das molduras e painéis (pergaminho, madeira, pedra, metal, couro…).
4. Paleta: manter o tema escuro? Cor de destaque desejada ou proibida?
5. Menu inicial (recomendação: ilustração em tela cheia, logo e menu em coluna à esquerda, "Seus jogos" num painel ao lado).
6. Pixelização das artes (recomendação: pixel visível, escala inteira sem suavização).

**Artes e ícones a pedir ao autor** (PNG com transparência, tamanho nativo baixo; molduras com a largura da borda fixa do 9-slice). A lista cresce com as telas das FEATs até lá:

- Estrutura: logo; fundo do menu inicial (16:9); fundo das telas secundárias; moldura e textura de painel (9-slice); botão em 4 estados (normal, hover, pressionado, desabilitado) ou só a moldura; moldura de diálogo.
- Ícones da interface (24–32 px): novo jogo, continuar, abandonar, encerrar sessão, voltar; host, em sessão, pausado, salvo; aviso, erro, sucesso; carregando (4–8 quadros); retrato padrão de personagem.
- Cartas: moldura por tipo e verso; ícones dos 8 `slot` e das 8 `itemCategory` (hoje em arte pendente); raridade, elemento e atributos (vida, Pico, Vigor, ouro, pontos de ação).
