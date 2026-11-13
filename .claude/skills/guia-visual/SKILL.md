---
name: guia-visual
description: Guia visual do Misadventures (referência, não fluxo) - direção de arte PSX, tipografia, cor e tokens, superfícies e cartas, termos com destaque, movimento, layout para PC e acessibilidade, e o que nunca usar. Use antes de criar ou mudar qualquer tela, estilo, animação ou ícone (a /visual, o ux-designer, o motion-dev e o ui-dev leem), ou quando o autor perguntar como algo deve parecer.
---

# /guia-visual

> **Estado (2026-11-13):** só a direção de arte das imagens está definida (README II.5) e os requisitos de interface (README II.4). Tipografia, paleta, tokens, faixa de resoluções e padrões de movimento são definidos com o autor na **FEAT-02**; até lá, os itens marcados *a definir* não podem ser inventados numa tarefa: pergunte. Valores de verdade ficarão no arquivo de tokens criado na FEAT-02.

## 1. Direção de arte
- **O jogo é 2D.** Não há renderização 3D. O estilo PSX (fim dos anos 1990) aparece nas **imagens, ícones, animações e transições**; as artes podem retratar cenas com aparência de 3D de PS1 (README II.5).
- **Imagens e ícones são do autor** (README II.4). SVG próprio só para testes (veja `/assets`).
- O texto de referência para gerar arte é o de README II.5 (mantido em inglês de propósito). Não o reescreva.

| Característica da referência (README II.5) | Tradução na interface |
|---|---|
| Texturas de baixa resolução, pixelização visível | *a definir na FEAT-02* (ex.: escalar as artes do autor sem suavização) |
| Profundidade de cor baixa, dithering sutil | *a definir na FEAT-02* (paleta contida; textura nunca sob texto corrido) |
| Efeitos visuais contidos, sem pós-processamento excessivo | animações e transições **bonitas e simples** (README II.4) |
| Imperfeições do hardware original (jitter, aliasing) | *a definir na FEAT-02*, só em transições e nunca em texto |

**Proibido** (README II.5 e decisões do projeto): fotorrealismo moderno; alta resolução e suavização "modernizante" nas artes; PBR, ray tracing, estética de Unreal Engine 5 ou CGI cinematográfico; pós-processamento excessivo; renderização 3D na interface; texto sobre textura sem contraste.

## 2. Tipografia
*A definir na FEAT-02:* família, origem dos arquivos (servidos junto com o app, sem depender de CDN), escala (corpo, interface, títulos, rótulos de carta), números tabulares para valores que mudam (vida, Pico, Vigor, ouro). Fonte nova só com autorização.

## 3. Cor e tema
- A UI usa só **tokens semânticos**, nunca cores soltas. *Paleta e tabela token → uso: a definir na FEAT-02.*
- **Contraste inegociável:** WCAG AA (4.5:1 para texto; 3:1 para texto grande, ícones informativos e contorno de foco).
- Opacidade não marca estado (derruba o contraste); use um token de "desligado".
- *Temas suportados (claro/escuro): a definir na FEAT-02.* Todo estilo novo funciona em todos os temas definidos.

## 4. Superfícies, cartas e termos
- **Categoria da carta sempre visível:** cada carta mostra a categoria com **ícone, imagem e label** (README II.4; ex.: diferenciar amuletos de Arma, Acessório e Relíquia).
- **Termos do jogo com destaque:** termos e suas variações têm destaque ou cor própria e mostram um **tooltip** explicativo ao passar o mouse (README II.4). A lista de termos vem do glossário do `docs/CONTRATO.md` §2; o texto do tooltip é pt-BR.
- Painéis, botões (normal, foco, pressionado, desabilitado) e área mínima de clique: *a definir na FEAT-02.*

## 5. Movimento
- Durações: micro 80–150 ms; troca de tela 200–350 ms; teto 500 ms. *Easing padrão: a definir na FEAT-02.*
- **Nunca bloquear a entrada:** o estado já mudou quando a animação começa; cliques, atalhos, foco e anúncios acessíveis funcionam durante a animação.
- Só `transform`/`opacity` (exceções justificadas).
- **Determinismo:** sem aleatório (`Math.random` é proibido em `src/`, spec D-08); keyframes fixos. A animação **reage aos dados que o backend envia**, não recalcula regras.
- `prefers-reduced-motion`: nada se desloca nem gira; no máximo um fade curto.
- As vezes dos outros jogadores e os acontecimentos do combate são animados em sequência (pendência P-02 do roadmap).

## 6. Layout e acessibilidade
- **PC primeiro** (spec D-09): distâncias, tamanhos e margens se ajustam ao monitor. *Faixa de resoluções suportada: a definir na FEAT-02.* Sem rolagem horizontal na faixa suportada.
- Controles reais (botão, link, campo) operáveis por teclado, com `focus-visible` visível.
- Tooltips não cobrem o controle que os abriu; rolagem interna focável.
- Resultados dinâmicos em `aria-live="polite"`.
- Textos visíveis e papéis ARIA definidos pela spec **não mudam** numa tarefa visual.

## 7. Antes de mudar qualquer coisa
- Índice do devlog e as entradas da área; `git log --oneline -- <arquivos>`.
- Decisões da spec que regem as telas afetadas.
- Decisão de design durável (paleta, fonte, tokens, padrão de animação, convenção de ícones) vira `D-xx` na spec e atualiza este guia.
