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

## T-115 — Acabamento dos estados e desfechos

- **Data:** 2026-11-28
- **Horas da sessão:** null

`PartySession.tsx`, `CombatPanel.tsx` e `RandomEventPanel.tsx` aplicam a composição de encontro e combate, com ciclo, fase, ator, fichas textuais de participantes e controles próximos ao status da ação. Ao enviar uma ação, os dados confirmados continuam visíveis. A recusa apresenta o motivo no painel e libera a retomada conforme a regra existente. `RewardChoice.tsx` aproxima o status da escolha e abre a carta por teclado com `FullCard`, que reaproveita `CardCategory` e `Term`. A moldura neutra e o rótulo cobrem as categorias sem recursos publicados.

`BoosterResult.tsx`, `BlacksmithPanel.tsx`, `CombatPanel.tsx` e `PartySession.tsx` apresentam os resultados confirmados em painéis, com prêmio e destino no diálogo de conclusão. `index.css` aplica transições curtas de painel e revelação quando a preferência do sistema permite movimento. As artes e os ícones pendentes continuam com a apresentação provisória aprovada na T-113.

Os roteiros em `tests/e2e/party/party-session.spec.ts` e `tests/e2e/party/random-event.spec.ts` cobrem o envio e a recusa de ataque com PV preservados, a retomada da escolha de recompensa, o acesso por teclado à carta sem arte, o resultado do booster e a quebra de equipamento na forja com movimento reduzido. O cenário de borda de conclusão ao fim do conteúdo reabre o resumo persistido e volta ao menu com o save congelado. `PartySession.test.tsx` confere o resumo visível da recompensa agora que a carta também pode ser consultada.

Passaram 71 testes de navegador no Chromium com MSW em `tests/e2e/app` e `tests/e2e/party` e 1.216 testes do Vitest em `src/`. Também passaram o typecheck, o lint de `src/` e `tests/`, o Prettier nos arquivos alterados e `git diff --check`.

A T-116 requer a API real e os dados publicados previstos no roteiro da SPEC-FRONTEND v1.13. A passagem à sucessora e o congelamento foram exercitados com MSW. A confirmação da persistência com a API real fica para a T-116.

## T-116 — Validação da campanha solo no Chrome

- **Data:** 2026-11-28
- **Horas da sessão:** null
- **Frontend:** checkout `e4329ed` com as alterações locais da T-115 e da T-116.
- **Backend:** checkout `37737c9`, CONTRATO v1.21, seção FEAT-19. Os dois endpoints `/health` responderam HTTP 200 com `contractVersion: "1.13"`.
- **Navegador:** Google Chrome 158.0.8127.38, 1280×720, frontend em `http://localhost:5173` com `VITE_USE_MOCKS=false`. As APIs de teste permitem essa origem.

Para reproduzir, configurar `VITE_API_URL` com a API do cenário e abrir o frontend no Chrome. Criar um save com Guerreiro, zero ajudantes e a Dimensão de Teste (`fixture.test-dimension`). No Porto Cinzento, iniciar e revelar Viajante Ferido, escolher Desistir e confirmar. Conferir o Fragmento em Itens de conclusão. Ir à Mina Velha pela Curva de Pedra, encerrar a vez e recarregar. A posição na Mina Velha e a rodada 2 devem permanecer. Concluir a dimensão, conferir o diálogo e recarregar antes de continuar. O recibo deve reaparecer com +25 Pico, +100 de ouro e uma Lâmina do Crepúsculo no inventário. O GET deve conservar o recibo e o saldo de 110 de ouro, que começou em 10. A dimensão de teste não tem chefe final.

| Cenário | Save criado no Chrome | Resultado após recarga |
| --- | --- | --- |
| Congelamento, API `localhost:3333` | `fad89b9b-1c19-4fc2-b50c-e9a91681f077` | A sessão retornou `409 PARTY_FROZEN`. O GET retornou 200 com `frozen`, Mina Velha e o mesmo recibo. Continuar no diálogo voltou ao menu. O save apareceu como Congelado, sem ação de continuar na lista. |
| Sucessora, API `localhost:3335` | `17fa8698-35b4-40df-babe-4cb501575680` | A sessão e o GET retornaram 200. O GET manteve `inSession`, `fixture-next.next-dimension` e `fixture-next.city`. Continuar no diálogo revelou a Segunda Dimensão. A lista mostrou Em sessão. |

Nos dois saves, a criação retornou 201 e `completeDimension` retornou 200. As respostas e capturas de retomada, recibo recarregado e destino estão em `test-results/t116-chrome/`. Na primeira execução, a API preservou o recibo congelado, mas o frontend parou na recusa de reabrir a sessão. `PartySession.tsx` passou a consultar o grupo após `PARTY_FROZEN` e a usar o recibo retornado no diálogo. A regressão em `tests/e2e/party/party-session.spec.ts` reproduziu a ausência do diálogo antes da correção e passou depois. O caso de borda usa a recusa de abertura seguida de GET válido sem reativar o save.

Depois da correção, passaram os dois percursos reais, 71 testes de navegador com MSW, 259 testes do Vitest nas suítes de sessão, recompensa e conclusão, lint e build de release. A SPEC-FRONTEND registra a T-116 concluída. O ROADMAP v1.11 registra a FEAT-30 validada no frontend e deve ser sincronizado integralmente com o backend.
