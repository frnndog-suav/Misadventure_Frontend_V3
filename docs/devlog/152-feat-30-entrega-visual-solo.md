# 152 — FEAT-30, entrega visual da campanha solo

- **Data:** 2026-11-27
- **Horas da sessão:** null

O autor aprovou antecipar a FEAT-30 para fechar o Momento 1 com uma campanha para um personagem no navegador. O Momento 2 inclui a revisão visual dos fluxos com IA, o executável Tauri e a pausa para o teste do autor antes do multiplayer.

O roadmap compartilhado passou de v1.07 para v1.08. Esta entrada e o índice do devlog registram a decisão. A verificação documental conferiu a posição da FEAT-30 e da FEAT-29 e a condição de abertura do Momento 3.

O backend confirmou o recebimento da cópia integral do roadmap v1.08 e verificou que ela é idêntica à do frontend. Os testes do backend seguem na validação funcional em andamento.

## Planejamento aprovado

A T-112 foi concluída e o ROADMAP v1.10 encerrou a FEAT-22. O autor aprovou o plano da FEAT-30. A SPEC-FRONTEND v1.13 registra os critérios REQ-115 a REQ-119, as tarefas T-113 a T-116 e o percurso de validação no navegador, da criação do save à conclusão da dimensão com MSW desligado. A verificação cobre a passagem à sucessora e o congelamento ao fim do conteúdo publicado.

Arquivos atualizados nesta etapa: SPEC-FRONTEND, esta entrada e o índice do devlog. A conferência documental cobre os IDs, as referências e o roteiro da T-116. A verificação automatizada e o percurso com a API real ficam para a implementação e a validação.

Retomada pela T-113, com a composição das telas e o inventário de artes e ícones para aprovação antes do acabamento.

## T-113 — Direção visual aprovada

A revisão estática das rotas em `App.tsx`, dos componentes de menu, criação e sessão e dos painéis de mapa, combate e recompensa identificou os controles e estados a reaproveitar. A proposta mantém o tema escuro da FEAT-02, Lora nos títulos e texto de interface em fonte de sistema. A estética PSX 2D entra nas artes, ícones e transições. Em 1280×720 os painéis devem permitir rolagem vertical conforme o conteúdo. Em 2560×1440 o espaço adicional favorece mapa, cartas e respiro entre painéis.

| Tela | Composição proposta | Artes e ícones pendentes e apresentação provisória |
| --- | --- | --- |
| Inicial e criação (REQ-115) | Título, Novo jogo e lista de saves com estado e ação por linha. Na criação, formulário e seleção por rádio de um lado, detalhes da classe selecionada do outro, com confirmação junto ao resumo. Status da conexão em área secundária. | Arte de abertura e retratos e emblemas das classes publicadas. Até a entrega, fundo escuro, nome do jogo em texto e painel de classe com nome, atributos e detalhes. Saves identificados por texto, inclusive Congelado. |
| Exploração (REQ-116 e REQ-118) | Barra com dimensão, rodada, PA e Encerrar vez. Mapa central, personagem à esquerda e detalhes da zona à direita. Mão, inventário e ações de zona acessíveis por controles de teclado com foco visível. | Ilustração de dimensão, artes de zona, marcador de personagem e ícones de tipos de zona e ações. Até a entrega, grade, setas e conexões existentes, contorno e rótulo para seleção, texto para zona atual e destinos disponíveis e botões com nomes de ação. Cartas preservam nome, categoria ou tipo e conteúdo. |
| Encontro, combate e desfecho (REQ-117 a REQ-119) | Faixa com encontro, ciclo, fase e ator. Personagem e inimigos com PV e estados, opções de ação, alvos e confirmação na mesma área. Resultado e recompensa no painel central. Conclusão com prêmio e destino confirmados pela API. | Artes de encontro, inimigos e chefes, retrato do personagem reaproveitado, ícones de ação e estado, arte de abertura de booster e de conclusão. Até a entrega, fichas textuais de participantes, rótulos de alvos e ações, cartas ou lista de recompensas e resultado textual de booster, forja e conclusão. |

O catálogo em `src/ui/categories.ts` tem 16 pares de imagem e ícone pendentes, oito de equipamento e oito de item. `assets-src/` contém apenas o README e `src/assets/` ainda não existe. Os dois SVG de relíquia são recursos de teste e laboratório. Para equipamento e item, reaproveitar a moldura neutra e o rótulo do `CardCategory` conforme D-22 e D-28. Para as demais cartas exibidas nos fluxos solo, o tratamento proposto usa o rótulo do tipo e o conteúdo em texto até a entrega de arte e ícone correspondentes. Originais do autor ficam em `assets-src/` e as exportações manuais do produto em `src/assets/<categoria>/`.

Em combate, a ação pendente mantém o último estado confirmado visível. Sucesso apresenta o resultado e recusa apresenta o motivo junto ao ponto de interação, com retomada conforme o fluxo existente. Booster e forja apresentam o resultado assim que confirmado. Transições curtas de painel e revelação respeitam movimento reduzido. Termos usam o componente existente com destaque e explicação por ponteiro e foco.

A conferência desta etapa foi documental e estática. Em 2026-11-27, o autor aprovou integralmente a composição, o inventário e a apresentação provisória. A T-113 está concluída na SPEC-FRONTEND e a retomada é pela T-114, com REQ-115 e REQ-116. Arquivos alterados: esta entrada, o índice do devlog e a caixa de conclusão da T-113 na spec. Os testes de layout, teclado, arte ausente e movimento reduzido e o percurso com API real ficam para as etapas de implementação e validação.

## T-114 — Layout de PC para entrada e exploração

- **Data:** 2026-11-27
- **Horas da sessão:** null

O menu e os saves receberam painéis com estado e ações por jogo em `App.tsx` e `SavedGames.tsx`. Em `NewGame.tsx`, a seleção de classe por rádio atualiza o painel de detalhes. `PartySession.tsx`, `PartyMap.tsx` e `index.css` organizam a barra da vez, o personagem, o mapa e os detalhes da zona. A zona atual, a seleção e os destinos disponíveis têm indicações distintas. Mão e inventário têm atalhos que levam o foco aos respectivos títulos.

O teste `tests/e2e/party/solo-layout.spec.ts` passou no Chromium com MSW em 1280×720 e 2560×1440. O percurso usa teclado para criar, encerrar e retomar a sessão, acessar mão e inventário, selecionar um destino, mover, encerrar a vez e fazer uma operação no Mercado. Confere o foco, as travessias, a nova posição, a rodada seguinte e a ausência de rolagem horizontal. O cenário existente com zero PA confere o aviso e a ausência do botão de movimentação. Passaram os 69 testes de navegador de `tests/e2e/app` e `tests/e2e/party`, os 1.234 testes do Vitest, o typecheck, o lint e as verificações de formatação dos arquivos da etapa.

O MSW padrão entrega uma fixture inicial a cada abertura de sessão. A persistência do progresso após movimentação e avanço de rodada fica para a verificação com a API real na T-116. A próxima etapa de implementação é a T-115.
