# Misadventures

> *Working title.* Jogo de cartas colecionáveis (TCG) para web, com frontend e backend, que mistura **TCG**, **RPG**, **jogo de tabuleiro**, **grind** e **interatividade em tempo real**.

> **Atenção**: muitos conceitos estão sujeitos a mudar com o tempo devido a novas ideias ou à descoberta de problemas. Este documento apresenta as ideias básicas.

Marcadores usados neste documento:
- `==TODO==` → ponto ainda não definido.
- `==REVISAR==` → ponto apontado para revisão do autor.
- `==VALIDAR==` → interpretação feita na reorganização do documento que precisa de confirmação.

---

## Sumário

**Parte I — Manual de regras**
1. [Visão geral](#1-visão-geral)
2. [Glossário de tempo: rodada, vez e turno de combate](#2-glossário-de-tempo-rodada-vez-e-turno-de-combate)
3. [O jogador](#3-o-jogador)
4. [Atributos e o deck de atributos](#4-atributos-e-o-deck-de-atributos)
5. [Classes e especializações](#5-classes-e-especializações)
6. [Recursos: equipamentos e itens](#6-recursos-equipamentos-e-itens)
7. [Inventário, pasta de TCG e cofre](#7-inventário-pasta-de-tcg-e-cofre)
8. [Dimensões e zonas](#8-dimensões-e-zonas)
9. [Montagem do mapa e preparação da partida](#9-montagem-do-mapa-e-preparação-da-partida)
10. [A vez do jogador](#10-a-vez-do-jogador)
11. [Ações de zona](#11-ações-de-zona)
12. [Pilhas de descarte e limbo](#12-pilhas-de-descarte-e-limbo)
13. [Eventos](#13-eventos)
14. [Teste de fuga](#14-teste-de-fuga)
15. [Nocaute, spawn e respawn](#15-nocaute-spawn-e-respawn)
16. [Modificadores e Vigor](#16-modificadores-e-vigor)
17. [Sistema de combate](#17-sistema-de-combate)
18. [Elementos](#18-elementos)
19. [Habilidades](#19-habilidades)
20. [Efeitos](#20-efeitos)
21. [Missões](#21-missões)
22. [Raides](#22-raides)
23. [Negociação](#23-negociação)
24. [Mercado](#24-mercado)
25. [Coleções](#25-coleções)
26. [Ferreiro](#26-ferreiro)
27. [Modos de jogo](#27-modos-de-jogo)
28. [Pendências do manual](#28-pendências-do-manual)

**Parte II — Requisitos técnicos**

**Parte III — Etapas de desenvolvimento**

---

# Parte I — Manual de regras

## 1. Visão geral

### 1.1 Sinopse

Um ou mais aventureiros chegam a uma **dimensão** para conquistar o **prêmio máximo** daquele lugar (um artefato, um prêmio em moedas de ouro, equipamentos muito fortes, etc.) ou para **derrotar o chefe final** dela.

Dependendo do modo de jogo, os jogadores devem:
- se ajudar,
- derrotar os outros, ou
- se ajudar temporariamente para obter algum benefício e conseguir desbravar a dimensão.

### 1.2 Como se joga, em resumo

- O jogo é **baseado em turnos** e combina conceitos de TCG, mecânicas de jogo de tabuleiro e interatividade em tempo real.
- Os jogadores **exploram o mapa** e resolvem **encontros** (eventos aleatórios) e **confrontos** (contra outros jogadores, junto com outros jogadores ou contra inimigos do próprio mundo).
- A partida termina quando um jogador obtém o prêmio máximo ou derrota o chefe final da dimensão (ou quando a condição de vitória do modo é cumprida, veja [Modos de jogo](#27-modos-de-jogo)).

### 1.3 Número de jogadores

O jogo é **modular** na quantidade de jogadores: comporta de **1 até "infinitos" jogadores**. "Infinitos" significa que o jogo deve suportar um número muito elevado de jogadores, por mais improvável que isso seja.

### 1.4 Progressão infinita de dimensões

- **Tudo o que um jogador conquista** (poções, equipamentos, bugs, prêmios, dinheiro, etc.) **é levado para a próxima dimensão** (modo campanha).
- **Não existe dimensão final.**
- Periodicamente (por exemplo, a cada 3 meses), uma **nova dimensão** é lançada com novos itens, cartas, prêmios, etc. (veja [Coleções](#25-coleções)).
- Os jogadores desbravam infinitas dimensões em busca dos melhores itens, equipamentos, buffs, mais dinheiro, etc.

### 1.5 Modos de jogo (resumo)

| Modo | Tipo | Progresso levado para outras dimensões? |
|---|---|---|
| **Campanha** | Cooperativo | Sim |
| **Desbravadores** | Competitivo (cada um por si), em formato de *runs* |Não. Progressão acontece apenas dentro da dimensão. |
| **Clássico** | Desbravadores cooperativo, run curta | Não |
| **Enfrentamento (PVP)** | Apenas combate com outros jogadores, para testar builds | Não |

Detalhes de cada modo em [Modos de jogo](#27-modos-de-jogo). As regras dos capítulos 2 a 26 são descritas a partir do **modo campanha**; as diferenças dos outros modos estão no capítulo 27.

---

## 2. Glossário de tempo: rodada, vez e turno de combate

| Termo | Significado |
|---|---|
| **Vez** | O momento em que **um** jogador joga (move-se, executa ações, etc.). |
| **Rodada** | Termina quando **todos** os jogadores jogaram sua vez uma vez. |
| **Turno de combate** | Dentro de um combate, o momento em que uma das partes (jogador ou inimigo) age e ataca. |

**Exemplo de rodada:** três jogadores (A, B e C). O jogador A joga sua vez, depois o B, depois o C. A rodada termina e volta para a vez do jogador A.

A ordem dos jogadores é definida de forma aleatória ou por algum critério (quem tirar o maior número no dado, etc).

---

## 3. O jogador

### 3.1 Valores iniciais

Cada jogador começa a aventura com:
- **10 moedas de ouro**;
- **20 pontos de vida**. **Não existe limite máximo de pontos de vida** por padrão: o jogador pode acumular quanta vida conseguir;
- **7 cartas** compradas do seu [deck de atributos](#4-atributos-e-o-deck-de-atributos) para a mão;
- **1 classe primária**, escolhida para iniciar a aventura (veja [Classes](#5-classes-e-especializações)).

Se essa é a **primeira dimensão** do jogador (é a primeira aventura dele), ele começa **sem equipamentos, armas, recursos, etc**.

### 3.2 Regras gerais do jogador

- **Mão de cartas:** não há limite de cartas na mão por padrão. Alguns efeitos podem impor um limite; as cartas em excesso vão para a **pilha de descarte de atributos** do jogador por padrão, a não ser que algum efeito altere essa regra.
- **Deck de atributos esgotado:** se o deck de atributos chegar a zero cartas, o jogador **não perde o jogo**. Considera-se que ele administrou mal seus atributos. O jogo segue normalmente, mas será bem difícil continuar sem deck. Existem efeitos, recursos e outros fatores que permitem um *comeback* e a restauração do deck.
- **Números inteiros:** todos os cálculos do jogo resultam em **números inteiros**. As lógicas podem arredondar para cima ou para baixo, conforme a finalidade de cada cálculo.

---

## 4. Atributos e o deck de atributos

![Referência de imagem protótipo de atributos](images/exemplos_prototipo_de_atributos.JPG)

### 4.1 O deck de atributos

- Cada jogador tem o **seu próprio deck de atributos** com **exatas 60 cartas** (número especulativo, sujeito a análise).
- O **deck building** deste jogo consiste em construir o deck de atributos.
- As cartas de atributo são usadas principalmente para **resolver eventos**, **ativar efeitos/habilidades/recursos** e **pagar custos** de efeitos.

### 4.2 Os 9 atributos

Os atributos se organizam em três categorias.

#### Atributos físicos

| Atributo | Representa | Relacionado a |
|---|---|---|
| **Força** | Potência física e capacidade de exercer força muscular. | Levantar, empurrar, carregar, quebrar objetos e causar impacto físico. |
| **Destreza** | Agilidade, coordenação motora e precisão dos movimentos. | Movimentos rápidos, esquiva, equilíbrio, manipular objetos com precisão e usar armas que exigem técnica. |
| **Resistência** | Capacidade física de suportar esforços, danos e condições adversas. | Vitalidade, tolerância à dor, fôlego e continuar lutando sob desgaste físico. |

#### Atributos mentais/sociais

| Atributo | Representa | Relacionado a |
|---|---|---|
| **Inteligência** | Raciocínio, aprendizado e compreensão lógica. | Conhecimento, memória, resolução de problemas, investigação, planejamento e domínio de assuntos complexos. |
| **Sabedoria** | Percepção, intuição e capacidade de interpretar situações. | Discernimento, experiência, leitura do ambiente, reconhecimento de padrões e decisões sensatas. |
| **Carisma** | Personalidade e capacidade de influenciar outras pessoas. | Persuasão, liderança, negociação, intimidação, eloquência e conquistar confiança ou respeito. |

#### Atributos metafísicos

| Atributo | Representa | Relacionado a |
|---|---|---|
| **Espírito** | Força interior, determinação e capacidade de exercer ou resistir a influências sobrenaturais. | Força de vontade, concentração, energia espiritual, resistência a possessões e domínio de poderes místicos. |
| **Sanidade** | Estabilidade mental e capacidade de preservar a lucidez diante de experiências psicologicamente perturbadoras. | Resistência ao horror, ao desconhecido, a entidades incompreensíveis e a fenômenos que desafiam a percepção da realidade. |
| **Sorte** | Influência do acaso sobre o que envolve o personagem. | Encontrar oportunidades, evitar situações desfavoráveis, obter resultados inesperados e se beneficiar de circunstâncias imprevisíveis. |

### 4.3 Distinções entre atributos parecidos

| Par | Diferença |
|---|---|
| **Força × Resistência** | Força: exercer potência física. Resistência: suportar esforço e danos. |
| **Inteligência × Sabedoria** | Inteligência: adquirir e processar conhecimento. Sabedoria: interpretar situações e aplicar discernimento. |
| **Espírito × Sanidade** | Espírito: força interior para resistir a influências externas e sobrenaturais. Sanidade: preservar a lucidez diante de experiências perturbadoras. |
| **Carisma × Espírito** | Carisma: influenciar outras pessoas. Espírito: sustentar a própria vontade diante de influências externas. |

Espírito e Sanidade **não são exclusivos de personagens mágicos**. Um guerreiro pode ter Espírito elevado pela determinação; um explorador pode ter Sanidade elevada por lidar com situações extremas. Assim, todos os atributos são relevantes para diferentes classes, mesmo que algumas tenham mais afinidade com certos atributos.

### 4.4 Tipos de carta de atributo

| Tipo | Descrição | Cópias permitidas no deck |
|---|---|---|
| **Básico** | Vale **1** do atributo da carta. | Ilimitadas |
| **Sinérgico** | Vale por **2 a 4 atributos diferentes**. Ex.: 1 Carisma + 1 Sabedoria; ou 1 Resistência + 1 Destreza + 1 Sorte. | Máximo 4 da mesma carta (número especulativo, sujeito a análise) |
| **Aprimorado** | Igual ao Básico, mas possui um **efeito**. | Máximo 4 da mesma carta (número especulativo, sujeito a análise) |

---

## 5. Classes e especializações

### 5.1 Trilha de progressão

| Etapa | Descrição |
|---|---|
| **Classe primária** | Escolhida no início do jogo. **Trava** o deck de atributos com uma quantidade e/ou combinação de um ou mais atributos específicos. |
| **Especialização** | Uma subclasse dentro das opções da classe primária. Concede um ou mais **efeitos** e também **trava** o deck com uma quantidade e/ou combinação de atributos. |
| **Multiclasse** | Ter mais de uma classe primária e, consequentemente, ter mais de uma especialização. |

Regras:
- Não é possível ter **duas especializações iguais**.
- Não é possível ter **a mesma classe primária duas vezes**.
- Como obter uma especialização: ==TODO==
- Como se tornar multiclasse: ==TODO==

### 5.2 Como ler a tabela de classes

- **Atributos essenciais** representam a identidade mecânica da classe primária.
- **Atributos adicionais** complementam a especialização e podem introduzir novas possibilidades (habilidades, uso de recursos, etc.). Uma especialização **não necessariamente precisa** ter atributos adicionais.
- **Reforço** representa uma concentração maior nos atributos essenciais da classe.
- Os atributos **não são restrições absolutas**: personagens podem desenvolver capacidades fora de suas especialidades, porém, talvez tenham menos afinidade, menos consistência no deck e talvez não se beneficiem tanto assim.
- Outras dimensões podem ter classes e especializações exclusivas.

### 5.3 Lista de classes

#### Guerreiro — essenciais: Força, Resistência

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Cavaleiro** | Defesa, armaduras e disciplina | Sabedoria (disciplina e percepção tática) | Resistência (capacidade defensiva e sobrevivência) |
| **Bárbaro** | Força bruta e fúria | Espírito (controle e manifestação da fúria) | Força e Resistência (potência física e durabilidade) |
| **Espadachim** | Técnica e precisão com espadas | Destreza (precisão, velocidade e coordenação) | Força (potência dos golpes) |
| **Gladiador** | Combate agressivo e resistência | Carisma (presença e intimidação) | Força e Resistência (agressividade e capacidade de suportar danos) |

#### Mago — essenciais: Inteligência, Espírito

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Necromante** | Manipulação da morte e dos mortos-vivos | Sanidade (contato com forças perturbadoras e conhecimento sobre a morte) | Inteligência e Espírito (domínio e manipulação de energias sobrenaturais) |
| **Ilusionista** | Ilusões e manipulação da percepção | Carisma (manipulação da percepção e influência sobre outras pessoas) | Inteligência (complexidade e precisão das ilusões) |
| **Invocador** | Conjuração de criaturas e entidades | Sabedoria (compreensão e percepção de entidades) | Inteligência e Espírito (complexidade das invocações e controle das entidades) |
| **Elementalista** | Manipulação dos elementos | Sabedoria (compreensão das forças naturais) | Inteligência e Espírito (controle e intensidade das manifestações elementais) |

#### Ladino — essencial: Destreza

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Ladrão** | Furtividade, furtos e arrombamentos | Inteligência (mecanismos, fechaduras e armadilhas) | Destreza (agilidade e precisão) |
| **Assassino** | Eliminação precisa de alvos | Inteligência (planejamento e identificação de vulnerabilidades) | Destreza e Sorte (precisão, oportunidade e execução) |
| **Espião** | Disfarces, espionagem e coleta de informações | Carisma (persuasão, disfarces e interação social) | Destreza (furtividade e movimentação) |
| **Trapaceiro** | Enganação e artimanhas | Carisma (persuasão e manipulação) | Destreza e Sorte (improvisação e execução de artimanhas) |

#### Clérigo — essenciais: Sabedoria, Espírito

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Sacerdote** | Cura, bênçãos e suporte divino | Carisma (liderança espiritual e inspiração) | Sabedoria e Espírito (poderes divinos e capacidade de cura) |
| **Exorcista** | Combate a espíritos e entidades malignas | Sanidade (resistência psicológica diante de entidades perturbadoras) | Espírito (resistência e enfrentamento de forças sobrenaturais) |
| **Inquisidor** | Investigação, julgamento e combate a hereges | Inteligência (investigação e raciocínio) | Sabedoria e Espírito (discernimento e convicção) |
| **Oráculo** | Profecias, visões e conhecimento divino | Sanidade (capacidade de suportar visões perturbadoras) | Sabedoria e Espírito (intuição e conexão espiritual) |

#### Patrulheiro — essenciais: Destreza, Sabedoria

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Caçador** | Rastreamento e caça de criaturas | Resistência (perseguições prolongadas e sobrevivência) | Destreza e Sabedoria (precisão e identificação de alvos) |
| **Arqueiro** | Maestria com arcos e armas de longo alcance | Força (potência dos disparos) | Destreza (precisão e coordenação) |
| **Explorador** | Sobrevivência e exploração de territórios | Resistência (esforço físico e adaptação a ambientes hostis) | Sabedoria (percepção e orientação) |
| **Rastreador** | Identificação e perseguição de rastros | Inteligência (interpretação de evidências e identificação de padrões) | Sabedoria e Destreza (percepção e movimentação) |

#### Druida — essenciais: Sabedoria, Espírito

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Metamorfo** | Transformação em animais e criaturas | Resistência (adaptação física e capacidade de suportar transformações) | Espírito (controle das transformações) |
| **Guardião** | Proteção da natureza | Resistência (proteção e preservação de ambientes naturais) | Sabedoria e Espírito (conexão e domínio das forças naturais) |
| **Xamã** | Comunicação com espíritos e ancestrais | Sanidade (capacidade de suportar contatos sobrenaturais) | Sabedoria e Espírito (percepção e conexão espiritual) |
| **Naturalista** | Conhecimento da fauna, flora e ecossistemas | Inteligência (conhecimento científico e identificação de espécies) | Sabedoria (percepção e compreensão da natureza) |

#### Monge — essenciais: Destreza, Espírito

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Mestre Marcial** | Maestria em artes marciais | Força (potência dos golpes) | Destreza e Espírito (precisão e controle corporal) |
| **Asceta** | Disciplina física e espiritual | Resistência (privação, esforço e tolerância física) | Espírito (autocontrole e disciplina) |
| **Mestre das Sombras** | Técnicas furtivas e movimentos ocultos | Sorte (oportunidades e circunstâncias favoráveis) | Destreza (agilidade e furtividade) |
| **Punho Elemental** | Artes marciais combinadas com energia elemental | Sabedoria (compreensão e percepção das forças elementais) | Espírito e Destreza (canalização de energia e precisão dos movimentos) |

#### Bardo — essencial: Carisma

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Menestrel** | Música e entretenimento | Destreza (execução e coordenação musical) | Carisma (expressividade e capacidade de entreter) |
| **Trovador** | Narrativas, inspiração e tradição oral | Inteligência (conhecimento histórico e cultural) | Carisma (comunicação e capacidade de inspirar) |
| **Diplomata** | Persuasão, negociação e influência | Inteligência (argumentação e estratégia) | Carisma (persuasão e influência social) |
| **Artista** | Expressão artística e criatividade | Inteligência (criatividade e elaboração artística) | Carisma (expressividade e impacto artístico) |

#### Alquimista — essencial: Inteligência

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Transmutador** | Transformação da matéria | Espírito (manipulação de energias necessárias à transmutação) | Inteligência (conhecimento e precisão dos processos) |
| **Toxicologista** | Venenos, toxinas e substâncias | Destreza (manipulação precisa de substâncias) | Inteligência (conhecimento químico e preparação de compostos) |
| **Bombardeiro** | Explosivos e dispositivos químicos | Destreza (manuseio e precisão no lançamento) | Inteligência (preparação e conhecimento dos compostos) |
| **Farmacêutico** | Poções, remédios e preparados | Sabedoria (identificação de propriedades e aplicação adequada de preparados) | Inteligência (conhecimento e elaboração de fórmulas) |

#### Artífice — essencial: Inteligência

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Engenhoqueiro** | Mecanismos e dispositivos | Destreza (montagem e manipulação de mecanismos) | Inteligência (compreensão e desenvolvimento de dispositivos) |
| **Inventor** | Criação de ferramentas e máquinas | Sorte (experimentação e resultados inesperados) | Inteligência (criatividade e desenvolvimento de invenções) |
| **Construtor** | Construções e estruturas especiais | Força (manipulação de materiais e trabalho físico) | Inteligência (planejamento e engenharia) |
| **Ferreiro Arcano** | Criação e aprimoramento de equipamentos mágicos | Espírito (manipulação e canalização de energias mágicas) | Inteligência (conhecimento técnico e mágico) |

#### Bruxo — essenciais: Espírito, Inteligência

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Demonologista** | Pactos com demônios e entidades infernais | Sanidade (exposição a entidades e forças infernais) | Espírito (controle e manutenção dos pactos) |
| **Ocultista** | Conhecimentos proibidos e rituais | Sanidade (contato com conhecimentos perturbadores) | Inteligência e Espírito (compreensão e execução de rituais) |
| **Pactário** | Vínculos sobrenaturais e contratos | Carisma (negociação e estabelecimento de contratos) | Espírito (manutenção e controle dos vínculos) |
| **Maldito** | Maldições, corrupção e debilitamento | Sanidade (contato com forças corruptoras) | Espírito (manipulação e imposição de maldições) |
| **Abissalista** | Poderes de entidades cósmicas e abissais | Sanidade (exposição a entidades incompreensíveis) | Espírito e Inteligência (canalização e compreensão de poderes abissais) |

#### Feiticeiro — essenciais: Espírito, Carisma

| Especialização | Foco | Adicional | Reforço |
|---|---|---|---|
| **Dracônico** | Herança de dragões e poderes dracônicos | Resistência (vigor e tolerância a poderes dracônicos) | Espírito (manifestação dos poderes herdados) |
| **Elemental** | Afinidade natural com elementos | Sabedoria (compreensão e percepção das forças elementais) | Espírito (manifestação e controle dos poderes elementais) |
| **Celestial** | Poderes de origem divina ou celestial | Sabedoria (discernimento e compreensão de forças divinas) | Espírito e Carisma (manifestação e expressão dos poderes celestiais) |
| **Trevoso** | Poderes de origem demoníaca ou infernal | Sanidade (exposição e adaptação a forças sombrias) | Espírito (controle e manifestação dos poderes infernais) |

### 5.4 Conceitos de classe a desenvolver

- É necessário analisar quais classes e especializações facilitam certas builds. Algumas builds podem ser exclusivas de certas classes e especializações.
- É necessário definir o **conceito principal** de cada classe e especialização. Exemplos: um Feiticeiro Trevoso consegue recuperar cartas do limbo; um Guerreiro Espadachim consegue comprar mais cartas do que outras classes. Um conceito pode ou não ser exclusivo, e mais de uma classe/especialização pode compartilhar o mesmo conceito.
- A classe influencia a quantidade de slots do [inventário](#71-inventário).
- Classes e especializações podem ter a capacidade de reparar equipamentos.
- Analisar e planejar como conectar classes e especializações a certos elementos (algumas têm mais afinidade com certos elementos).
---

## 6. Recursos: equipamentos e itens

**Recursos** são equipamentos e itens (mais tipos podem ser adicionados no futuro). Eles possuem efeitos e ajudam o jogador.

### 6.1 Equipamentos

- São recursos que o jogador usa **o tempo todo**. As cartas ficam posicionadas **na frente do jogador**, mostrando que estão equipadas.
- Equipamentos **não vão para a mão**. Podem ser guardados no **inventário** e trocados pelos que estão em uso, por estratégia (veja a ação [Preparar](#11-ações-de-zona)).
- O jogador pode usar **1 equipamento de cada categoria**:

| Categoria | Exemplos |
|---|---|
| **Cabeça** | Capacetes, tiaras mágicas, capuzes, coroas, etc. |
| **Tronco** | Peitorais de metal, cotas de malha, túnicas de tecido, corpetes de couro, etc. |
| **Inferior** | Calças, grevas de armadura, saias de combate, etc. |
| **Calçado** | Botas de ferro, sapatos leves de couro, sandálias encantadas, cintos, pochetes, etc. |
| **Capa** | Capa, manto, etc. |
| **Arma** | Adagas, punhais, facas, espadas curtas, espadas longas, sabres, cimitarras, katanas, clavas, maças, martelos de guerra, manguais, porretes, lanças, alabardas, tridentes, foices, espadas de duas mãos (montantes), machados de batalha grandes, martelos pesados, manoplas reforçadas, garras, soco-inglês, arcos, bestas, facas de arremesso, machadinhas, azagaias, shurikens, dardos, pistolas, mosquetes, rifles, bacamartes, cajados, varinhas, tomos, grimórios, cruzes, amuletos, talismãs, orbes mágicos, etc. |
| **Escudo** | Escudo leve de madeira ou metal (pequeno), escudo pesado, escudo de corpo/pavês, escudos especiais (ornamental, concha, táurico), etc. |

> Algumas armas **não permitem usar escudo**. Nesse caso, o jogador fica com um slot a menos.

- Equipamentos e armas possuem **[habilidades](#19-habilidades)**, que podem causar dano ao oponente ou ativar efeitos. Armas e equipamentos de categorias diferentes podem ter as mesmas habilidades.
- **Quebra de equipamentos:** efeitos, habilidades e outros fatores podem quebrar equipamentos. Para repará-los, é preciso levá-los ao [ferreiro](#26-ferreiro) ou usar um efeito/habilidade/recurso de reparo.

### 6.2 Itens

Podem existir mais categorias no futuro, inclusive categorias exclusivas de uma dimensão.

| Categoria | Finalidade | Exemplos |
|---|---|---|
| **Consumíveis** | Recuperar vida, remover status negativos, obter status positivos e ganhar efeitos. | Poções, elixires, alimentos, bebidas, pergaminhos, bombas, remédios, etc. |
| **Materiais** | Fabricação, aprimoramento ou outras atividades. | Minérios, gemas, ervas, tecidos, couros, componentes, peças, etc. |
| **Relíquias** | Objetos especiais, geralmente raros, mágicos ou com propriedades extraordinárias. | Artefatos, amuletos, talismãs, objetos amaldiçoados, objetos lendários, etc. |
| **Ferramentas** | Executar atividades específicas, interagir com o ambiente ou superar obstáculos. | Ferramentas de mineração e de coleta, instrumentos, utensílios, equipamentos de exploração, dispositivos. |
| **Tesouros** | Representar valor econômico ou servir de recompensa. | Moedas, joias, pedras preciosas, objetos valiosos, antiguidades, etc. |
| **Documentos** | Carregar informações, registros ou conhecimentos. | Mapas, livros, cartas, manuscritos, registros, contratos, etc. |
| **Objetos especiais** | Relacionados a eventos, progressão ou situações específicas do jogo. | Qualquer coisa, inclusive itens das outras categorias. |

---

## 7. Inventário, pasta de TCG e cofre

O jogador guarda suas coisas em três lugares diferentes:

| Onde | O que guarda | Capacidade padrão | Onde acessa |
|---|---|---|---|
| **Inventário** | Recursos que o jogador carrega | 10 slots (varia por classe) | Sempre |
| **Pasta de TCG** | Cartas para ajustar o deck | 20 unidades de cartas no total | Ação **Preparar** |
| **Cofre** | Tudo do jogador | 30 slots + 10 slots de decks | Ação **Usar cofre** |

### 7.1 Inventário

- Funciona como uma **"segunda mão"**.
- A quantidade de slots depende da **classe**: classes com mais força, por exemplo, têm mais slots. **Por padrão, a maioria das classes tem 10 slots.**
- Durante eventos, raides, etc., o jogador pode usar o que está no inventário, desde que o conteúdo do slot permita.
- Buffs, efeitos, itens e equipamentos podem **aumentar** ou **diminuir** o tamanho do inventário. No caso de recursos no inventário que estejam em excesso (estejam a mais no inventário), o jogador escolhe quais recursos devem ser jogados no **limbo** imediatamente.

### 7.2 Pasta de TCG

- Todo jogador carrega uma pasta de TCG com até **20 unidades de cartas** no total.
- Ela permite mexer na build do deck **sem precisar do cofre**, por meio da ação **Preparar**.
- A pasta **não ocupa slot do inventário**: ela tem um slot exclusivo.

### 7.3 Cofre

- Guarda **todas as coisas** do jogador: recursos, itens, cartas de atributo, boosters, etc.
- O cofre está **atrelado ao jogador**: os mesmos itens podem ser acessados de qualquer zona que tenha cofre, inclusive em **dimensões diferentes**.
- No cofre, o jogador faz **todo o deck building**: gerencia decks, monta builds diferentes e move cartas, itens e recursos entre o inventário e o cofre.
- **Slots do cofre:**
  - **10 slots de decks** por padrão (builds diferentes). Slots de decks são exclusivos e separados dos demais.
  - **30 slots** por padrão para cartas, boosters, recursos, itens, etc.
  - Cópias repetidas **se empilham** sem limite; cada carta/item/recurso **diferente** ocupa um slot diferente.

---

## 8. Dimensões e zonas

### 8.1 Dimensões

- Uma **dimensão** é o mundo onde a partida acontece. Ela é composta por um conjunto de **cartas de zona** (por exemplo, 12, 16 ou 20 cartas). Esses valores são especulativos. Quantidades sujeitas a análise.
- A dimensão pode ter **nenhum, um ou vários efeitos** padrão. Exemplos:
  - jogadores dentro dela não podem usar efeitos do elmo;
  - jogadores precisam pagar 1 moeda de ouro para usar uma ação;
  - durante eventos de combate, não é possível usar poções.
- Uma dimensão sem efeitos pode significar que seus eventos são muito difíceis.

### 8.2 Zonas

![Referência de imagem protótipo de zonas](images/prototipo_de_zonas.JPG)

**Zonas** são cartas de lugares que compõem o mapa de uma dimensão. Cada zona tem um **tipo** e um **local**. Outras dimensões podem ter zonas específicas e diferentes.

| Tipo de zona | Possíveis locais |
|---|---|
| **Montanhosa** | Montanhas, colinas, vales, picos, cordilheiras, etc. |
| **Florestal** | Florestas, bosques, matas, selvas, etc. |
| **Costeira** | Praias, falésias, enseadas, litoral, portos, docas, ancoradouros, etc. |
| **Lacustre** | Lagos, lagoas, margens, áreas alagadas, etc. |
| **Pantanosa** | Pântanos, brejos, manguezais, charcos, etc. |
| **Campestre** | Campos, pradarias, pastagens, planícies, etc. |
| **Desértica** | Desertos, dunas, oásis, terrenos áridos, etc. |
| **Vulcânica** | Vulcões, crateras, campos de lava, etc. |
| **Fluvial** | Rios, riachos, cachoeiras, corredeiras, etc. |
| **Subterrânea** | Cavernas, grutas, túneis, minas, abismos, etc. |
| **Urbana** | Cidades, metrópoles, etc. |
| **Rural** | Fazendas, plantações, etc. |
| **Habitada** | Vilas, aldeias, povoados, assentamentos, acampamentos, etc. |
| **Fortificada** | Castelos, fortalezas, cidadelas, muralhas, etc. |
| **Religiosa** | Templos, santuários, monastérios, etc. |
| **Industrial** | Fábricas, oficinas, complexos industriais. |

### 8.3 O que uma carta de zona contém

- **Setas de conexão:** de nenhuma a quatro setas, cada uma apontando para uma aresta da carta. **Toda zona urbana tem obrigatoriamente as quatro setas.**
- **Ações:** cada zona tem as suas próprias [ações de zona](#11-ações-de-zona). Uma zona pode ter 5 ações e outra apenas 1. Algumas ações são exclusivas de certas zonas; outras aparecem em várias. Exemplo: uma cidade pode ter "Iniciar evento", "Ir ao Ferreiro", "Ir ao Mercado" e "Ir ao hotel"; outra cidade pode ter só "Iniciar evento" e "Ir ao Mercado". Isso obriga o jogador a pensar para onde ir para cumprir seus objetivos ou conseguir algum item ou serviço.
- **Efeitos:** nenhum, um ou vários. Exemplos: na zona X, a classe Mago causa mais dano em combate; na zona Y, quem for nocauteado em evento ou combate perde todas as moedas de ouro; na zona Z, equipamentos do tipo armadura têm seus efeitos anulados.
- **Decks próprios**, separados pelo tipo da zona:
  - **deck de eventos** (cerca de 30 cartas de eventos aleatórios por zona; número especulativo, sujeito a análise);
  - **deck de recompensas**;
  - **deck de recursos** que podem ser encontrados na zona.
  
  Zonas diferentes podem ter a mesma carta nesses decks.

---

## 9. Montagem do mapa e preparação da partida

![Protótipo de mapa-múndi](images/protótipo_mapa_mundi.JPG)

### 9.1 Montagem do mapa

1. **Embaralhe** as cartas de zona da dimensão.
2. Selecione **aleatoriamente uma zona urbana do tipo cidade** e posicione-a na mesa como **primeira carta**.
3. Compre cartas do **topo** do deck de zonas.
4. Posicione cada nova carta **onde uma seta de uma carta já posicionada aponta**.
5. Repita até montar o mapa.

Assim, **cada vez que a dimensão é jogada, um mapa diferente é construído**, o que dá rejogabilidade e permite estratégias e planos diferentes.

### 9.2 Preparação dos jogadores

1. Cada jogador escolhe uma **classe primária**.
2. Cada jogador recebe os [valores iniciais](#31-valores-iniciais) e compra **7 cartas** do deck de atributos.
3. Cada jogador escolhe a **zona inicial** (seu ponto de **spawn**). Na campanha, ela deve ser **obrigatoriamente uma zona urbana**.
4. Define-se a **ordem dos jogadores** (aleatória ou por algum critério).

---

## 10. A vez do jogador

1. O jogador tem **3 pontos de ação** por padrão.
2. Cada [ação de zona](#11-ações-de-zona) gasta pontos de ação (exceto as indicadas como gratuitas), inclusive a ação **Movimentar**.
3. As ações podem ser feitas **em qualquer ordem**. Exemplo: Iniciar evento → Movimentar → Ir ao Mercado.
4. O jogador **não precisa usar todos os pontos**: ele pode encerrar a vez quando quiser.
5. Quando os pontos acabam ou o jogador encerra a vez, a vez passa para o próximo jogador.

---

## 11. Ações de zona

Cada zona oferece apenas algumas das ações abaixo. Estas são as **ações padrão** que podem existir.

| Ação | Custo | Descrição |
|---|---|---|
| **Movimentar** | 1 ponto de ação | O jogador se move para uma zona **conectada** à zona atual. Por padrão, só nas direções **cima, baixo, esquerda e direita** (sem diagonal). Efeitos podem permitir diagonal. Pode ser usada **mais de uma vez** na mesma vez. |
| **Iniciar evento** | 1 ponto de ação | Revela um [evento](#13-eventos). Resolver dá recompensas; falhar dá debuffs e penalidades. As mecânicas de TCG acontecem principalmente aqui. Pode ser usada **mais de uma vez** na mesma vez. |
| **Usar cofre** | 1 ponto de ação | Acessa o [cofre](#73-cofre). Pode ser usada **mais de uma vez** na mesma vez. |
| **Recuperar** | 1 ponto de ação | O jogador recebe **3 pontos de vida** por padrão e escolhe uma opção: (a) comprar cartas até ter 7 na mão; (b) reembaralhar a mão no deck de atributos; (c) reembaralhar a pilha de descarte de atributos no deck de atributos. Pode ser usada **mais de uma vez** na mesma vez. |
| **Enfrentar jogador ou jogadores** | 1 ponto de ação  | Entre em combate com um ou mais jogadores. |
| **Preparar** | **Gratuita**  | Pode ser usada **mais de uma vez** na mesma vez. Faz tudo isto na mesma ação: (a) mexer na build do deck usando as cartas da **pasta de TCG**; (b) **trocar equipamentos** em uso por outros do inventário; (c) **usar recursos** do inventário (ativar efeitos e habilidades). |
| **Pegar / Continuar / Finalizar missão X** | 1 ponto de ação | Interage com uma [missão](#21-missões) disponível na zona. |
| **Pegar / Continuar / Finalizar objetivo X** | 1 ponto de ação | Somente nos modos **Desbravadores** e **Clássico**. Cumprir um objetivo dá pontos de objetivo, conforme a carta. |
| **Negociar** | **Gratuita** | Troca de itens entre jogadores na mesma zona (veja [Negociação](#23-negociação)). Não gasta ponto de ação de nenhum envolvido. |
| **Iniciar raide** | Todos os pontos de ação restantes (no mínimo 1 ponto de ação) | Inicia uma [raide](#22-raides). Depois disso, o jogador não pode executar mais nenhuma ação na vez. |
| **Ir ao Ferreiro** | Todos os pontos de ação restantes (no mínimo 1 ponto de ação) | Refinar, encantar, criar e consertar equipamentos (veja [Ferreiro](#26-ferreiro)). |
| **Ir ao Mercado** | Todos os pontos de ação restantes (no mínimo 1 ponto de ação) | Comprar e vender itens, cartas e boosters (veja [Mercado](#24-mercado)). |
| **Salvar ponto de respawn** | Todos os pontos de ação restantes (no mínimo 1 ponto de ação) | Define a zona atual como o ponto de [respawn](#15-nocaute-spawn-e-respawn). |

---

## 12. Pilhas de descarte e limbo

Antes de falar de eventos e efeitos, é importante saber para onde vão as cartas.

| Origem | Destino padrão |
|---|---|
| **Cartas de atributo** usadas como requisito, pagas como custo, descartadas por efeito/habilidade ou em qualquer outra situação, inclusive o excesso de cartas na mão | **Pilha de descarte de atributos** do próprio jogador |
| **Equipamento abdicado** | **Limbo** |
| **Recurso oferecido** | **Limbo** |
| **Cartas que não são de atributo** usadas para resolver um evento | **Limbo** |
| **Carta de evento**, resolvida ou não | **Pilha de descarte de eventos** daquela zona |

- O **limbo** é uma **pilha de descarte comum a todos os jogadores**.
- Alguns efeitos e habilidades podem mandar cartas de atributo para o **limbo** em vez da pilha de descarte do jogador.
- Quando o deck de eventos de uma zona acaba, a pilha de descarte de eventos **daquela zona** é reembaralhada para formar um novo deck.
- **IMPORTANTE:** se uma carta não diz explicitamente para embaralhar um deck, o deck **NÃO** deve ser embaralhado.

---

## 13. Eventos

![Fluxo de eventos](images/fluxo_de_eventos.JPG)

Eventos precisam ser resolvidos pelos jogadores para conseguir recompensas. Alguns tipos de eventos são (podem existir mais no futuro):
- **Evento aleatório**: um desafio com requisitos a cumprir;
- **Evento de combate**: um combate contra um ou mais inimigos (veja [Sistema de combate](#17-sistema-de-combate)).

### 13.1 A carta de evento

Ao usar **Iniciar evento**, compra-se uma carta do **deck de eventos da zona**, que é revelada ao jogador. A carta contém:
- **Título**;
- **Flavor text**;
- **Requisitos de resolução**;
- **Coisa boa**: o que acontece se o jogador resolver o evento;
- **Coisa ruim**: o que acontece se o jogador não resolver.

Observações:
- O jogador **não é obrigado** a resolver o evento. Ele pode simplesmente aceitar a coisa ruim.
- Nem sempre resolver dá algo ao jogador: às vezes, resolver apenas **evita a coisa ruim**.
- A coisa boa e a coisa ruim ativam efeitos e **devem ser ativadas** por padrão.

### 13.2 Requisitos de resolução

Um evento pode exigir um ou uma combinação de dois ou mais dos requisitos abaixo:
- **Atributos**: uma combinação de atributos específicos, um único atributo específico ou um atributo genérico;
- **Doar vida**;
- **Descartar carta de atributo**;
- **Abdicar de equipamento**;
- **Pagar ouro**;
- **Oferecer recurso do inventário**;
- **Manipulação de cartas**. ==TODO==

### 13.3 Fases do evento

| Fase | Quando acontece |
|---|---|
| **Antecipação** | Antes de a carta de evento ser revelada. |
| **Encontro** | O jogador tenta (ou não) resolver o evento. |
| **Êxito** | Depois de o evento ser resolvido com sucesso: o jogador recebe benefícios, buffs, itens e/ou recompensas (ou apenas evita a coisa ruim). |
| **Revés** | Depois de o evento não ser resolvido: o jogador sofre as penalidades da carta. |

Durante o encontro, o jogador pode tentar **fugir** com o [teste de fuga](#14-teste-de-fuga).

### 13.4 Reposição de cartas

Ao terminar o evento (depois do êxito ou do revés), o jogador **compra imediatamente** do deck de atributos **a mesma quantidade de cartas de atributo** que jogou para tentar resolver o evento.

| Exemplo | O que aconteceu | Compra cartas? |
|---|---|---|
| 1 | Gastou 4 cartas e resolveu o evento → as 4 cartas vão para a pilha de descarte de atributos → êxito encerrado. | **Sim, 4** |
| 2 | Gastou 2 cartas, percebeu que não ia conseguir, tentou fugir e falhou → sofre as penalidades → revés encerrado. | **Sim, 2** |
| 3 | Não quis gastar cartas, tentou fugir e falhou → sofre as penalidades → revés encerrado. | **Não** (nenhuma carta usada) |
| 4 | Gastou 5 cartas, percebeu que não ia conseguir, tentou fugir e **conseguiu** → não sofre penalidades → o encontro se encerra. | **Não** (fugiu com sucesso) |

---

## 14. Teste de fuga

- O teste de fuga pode acontecer durante um **evento** ou **uma outra situação**.
- O jogador que quer fugir rola um **D20**.
- Por padrão, para fugir é preciso tirar **um número maior que 10**.
- Alguns eventos e combates têm um **valor mínimo de fuga** próprio.
- Efeitos/Habilidades podem aumentar ou diminuir tanto o valor do dado quanto o valor mínimo de fuga.
- **Falhar na fuga de um combate** deixa o jogador **nocauteado** (veja [Sistema de combate](#17-sistema-de-combate)).
- **Não é possível fugir:**
  - no modo **Enfrentamento (PVP)**, onde o jogador pode apenas **desistir** do combate;
  - em batalhas **dentro de raides**.

> O teste de fuga entre **jogadores** no modo Desbravadores tem uma regra própria (veja [Desbravadores](#272-desbravadores)).

---

## 15. Nocaute, spawn e respawn

### 15.1 Spawn e respawn

- **Spawn** e **respawn** são o mesmo ponto do mapa:
  - **spawn** é onde o jogador aparece no mundo **pela primeira vez**;
  - **respawn** é onde o jogador **reaparece depois de ser nocauteado**.
- A ação **Salvar ponto de respawn** muda esse ponto para a zona atual.

### 15.2 Nocaute

Quando o jogador chega a **0 pontos de vida**, ele é **nocauteado**:
1. Volta para o seu **ponto de respawn** com a **vida inicial** que começou a partida.
2. Perde as **ações restantes** da vez e a sua **próxima vez**.
   - **Exceção:** jogando **sozinho** nos modos Campanha, Desbravadores e Clássico, o jogador **não** perde a vez.
3. Sofre as penalidades da coisa que o nocauteou, se houver (por exemplo, as penalidades da carta do inimigo).

> Em combates com vários jogadores, o nocauteado só é teletransportado ao fim do combate (veja [Sistema de combate](#17-sistema-de-combate)).

---

## 16. Modificadores e Vigor

**Modificadores** são pontos do jogador que afetam cálculos e interações durante toda a partida. Recursos, efeitos e habilidades podem **aumentar ou diminuir** um ou mais modificadores. Mais modificadores podem surgir no futuro.

Todos os modificadores são usados **principalmente em combate**, mas também podem aparecer como requisito em eventos aleatórios e em outras ocasiões. O cálculo de cada um combina o próprio modificador com equipamentos, efeitos ativos, outros fatores (como cartas de atributo específicas na mão) e, **principalmente, o Vigor**. A lógica de cada cálculo ainda precisa ser definida.

| Modificador | O que o resultado do cálculo define |
|---|---|
| **Ataque** | O valor do ataque desferido no oponente (usa a força dos equipamentos). |
| **Defesa** | Quanto o jogador resiste ao ataque inimigo (usa a defesa dos equipamentos). Se o ataque for **maior** que a defesa, o defensor toma a diferença como dano; se for **igual**, não toma dano. |
| **Precisão** | Se o ataque **acerta**. Se acertar, o valor de ataque é usado. |
| **Esquiva** | Se o alvo **escapa** do ataque. Se escapar, não sofre dano. |
| **Celeridade** | A **ordem de ação** no combate: quanto maior, mais cedo a parte ataca. |
| **Perfuração** | Quanto da **defesa** do oponente é ignorado no cálculo de dano. |
| **Reflexão** | Quanto do ataque recebido é **devolvido** ao atacante. O valor devolvido é subtraído do dano ao defensor. |
| **Vigor** | O **modificador mais importante**. Influencia **todos** os outros modificadores e é o que mais pesa no resultado final dos cálculos. |

### 16.1 Vigor (o sistema de "nível")

**Não existe nível no jogo.** No lugar dele existe o **Vigor**, que é altamente dinâmico: quase tudo no jogo concede ou remove um pouco de Vigor.

| Concedem Vigor | Removem Vigor |
|---|---|
| Cumprir missões | Fugir de combates |
| Usar itens pontuais | Usar algumas habilidades de equipamentos |
| Habilidades de equipamentos | Não conseguir resolver eventos |
| Resolver eventos com sucesso | Perder combates |
| Ganhar combates | Ser nocauteado |
| Derrotar inimigos | Perder uma raide |
| Efeitos positivos (buffs) | Efeitos negativos (debuffs) |
| Etc. | Etc. |

O Vigor também é o **custo padrão** para usar [habilidades](#19-habilidades).

---

## 17. Sistema de combate

Quando um **evento de combate** é revelado (ou acontece uma batalha numa raide), começa um combate.

### 17.1 Combate 1 jogador × 1 inimigo (regra base)

1. **Ordem de ataque:** pela **celeridade**, da maior para a menor. Em caso de empate, o **inimigo tem prioridade** por padrão (efeitos, habilidades e itens podem mudar isso).
2. **Turnos de combate:** as partes se revezam, uma por vez.
3. **No seu turno de combate**, a parte pode ativar vários efeitos, habilidades, etc. **A última coisa do turno é sempre atacar.**
4. **Cálculo do dano:** o ataque vai contra a defesa do oponente.
   - Ataque **igual** à defesa → o oponente não toma dano.
   - Ataque **maior** que a defesa → o oponente perde vida igual à diferença.
   - Se o alvo **esquivar**, o ataque é um **"miss"** e o turno passa para o próximo atacante.
5. **Ataques múltiplos:** efeitos, habilidades e itens podem permitir atacar mais de uma vez, desde que suas condições sejam cumpridas e nenhum **efeito** ou **habilidade** impeça.
6. O inimigo segue a mesma lógica: ativa efeitos e habilidades e por fim ataca.
7. **Quem chegar a 0 de vida primeiro é nocauteado.**
   - **Vitória do jogador:** recebe as recompensas descritas na carta do inimigo e segue para a próxima ação, se ainda tiver pontos de ação.
   - **Derrota do jogador:** é [nocauteado](#15-nocaute-spawn-e-respawn) e sofre as penalidades descritas na carta do inimigo, se houver.
8. **Troca de equipamentos:** não é permitida durante o combate por padrão; efeitos, habilidades ou outros fatores podem mudar isso.
9. **Fuga:** o jogador pode tentar o [teste de fuga](#14-teste-de-fuga).
   - **Sucesso:** o combate termina imediatamente.
   - **Falha:** o jogador é **nocauteado**. Como ninguém derrotou o inimigo nem fugiu com sucesso, o combate é considerado **derrotado** e o jogador sofre as penalidades descritas na carta do inimigo.

Inimigos **não usam "cartas na mão"**: tudo é feito automaticamente pelo sistema.

### 17.2 Combate 1 jogador × 2 ou mais inimigos

Segue a regra base, com duas diferenças:
- No seu turno de combate, o jogador **escolhe qual inimigo atacar**.
- As recompensas só são entregues depois de **todos os inimigos** serem derrotados.

### 17.3 Combate com 2 ou mais jogadores × 1 ou mais inimigos

**Quem pode entrar:** se um jogador inicia um evento de combate e há outros jogadores na mesma zona, ele pode **recrutá-los** para ajudar. Não há limite de ajudantes.

**Custo e recompensas:**
- Só o **jogador que iniciou o combate** gasta ponto de ação. Os ajudantes não perdem pontos de ação.
- Só o **jogador que iniciou** recebe as recompensas.
- **Exceção:** se quem iniciou fugir, ou for nocauteado e não for ressuscitado até o fim, e os outros vencerem, as recompensas são **divididas entre os sobreviventes**. Eles escolhem as recompensas em ordem de celeridade, da maior para a menor.
- Isso cria uma dinâmica no combate: alguns jogadores podem fugir por conta própria, enquanto outros podem querer ficar e vencer para levar as recompensas.

**Nocaute durante o combate:**
- O jogador nocauteado **não é teletransportado** imediatamente, porque outros jogadores podem **ressuscitá-lo** com itens, efeitos, habilidades, etc.
- Enquanto está nocauteado, ele **não joga** seu turno de combate (apenas assiste).
- Se o combate terminar **com vitória** e algum jogador ainda estiver nocauteado, ele vai para o respawn, mas **não sofre** as penalidades dos inimigos.

**Fuga em grupo** (vale nos modos Campanha, Desbravadores e Clássico):
- Cada jogador tenta o teste de fuga **um por vez**, no seu turno de combate.
- Falhar na fuga deixa o jogador **nocauteado**.
- Quem foge com sucesso sai do combate e não joga mais nele.

**Resultado do combate:**

| Situação | Resultado | Penalidades dos inimigos |
|---|---|---|
| Os jogadores derrotam todos os inimigos | **Vitória** | Ninguém sofre |
| **Todos** os jogadores fogem com sucesso | **Fuga com sucesso** | Ninguém sofre |
| Alguns fogem e outros terminam nocauteados, sem vitória | **Derrota** | Só os **nocauteados** sofrem |
| Ninguém derrota os inimigos nem foge com sucesso | **Derrota** | Os **nocauteados** sofrem |

Quem fugiu com sucesso não sofre as penalidades dos inimigos, mas pode sofrer penalidades de outros fatores (efeitos, etc.).

**Exemplo:**
1. Participantes: jogadores A, B e C; inimigos A, B, C e D.
2. Ordem por celeridade: jogador A → inimigo C → inimigo A → jogador C → jogador B → inimigo D → inimigo B.
3. Os jogadores percebem que não vão vencer e decidem fugir.
4. O jogador A tenta fugir, falha e é nocauteado. Os inimigos C e A atacam. O jogador C tenta fugir, falha e é nocauteado. O jogador B foge com sucesso e sai do combate.
5. Resultado: **derrota**. Os jogadores A e C sofrem as penalidades dos inimigos; o jogador B não.

**Outras regras:**
- **Não é permitido negociar** entre jogadores durante um combate. **Nada** pode alterar essa regra.
- No modo **Desbravadores**, antes do combate, os ajudantes podem **negociar a divisão da recompensa** com quem iniciou. Eles não são obrigados a pedir parte da recompensa.

### 17.4 Combate em raides

- **Não é possível fugir** de batalhas dentro de uma raide, porque o confronto faz parte da história.
- Se um jogador for nocauteado, ou quando todos os jogadores forem nocauteados, a raide **termina** e todos sofrem as penalidades descritas naquela etapa da raide.

### 17.5 IA dos inimigos

É necessário implementar uma IA que controle as ações dos inimigos em combate: perceber quando o jogador tem defesa ou ataque fracos, escolher as melhores estratégias, ajudar ou ressuscitar um aliado, etc.

---

## 18. Elementos

Elementos têm relações de vantagem, desvantagem e neutralidade entre si. Eles influenciam o cálculo de dano, a defesa e diversos outros cenários do jogo.

| Relação | Efeito padrão |
|---|---|
| **Vantagem** | +25% de efetividade contra o elemento |
| **Desvantagem** | −25% de efetividade contra o elemento |
| **Neutro** | Os elementos não têm relação entre si; a habilidade funciona normalmente. |
| **Sem elemento** | A habilidade não tem afinidade elemental; o resultado é sempre neutro. |

Exemplos: Fogo contra Água tem desvantagem. Fogo contra Ar é neutro. Uma habilidade sem elemento contra Água ou contra Fogo é neutra.

### 18.1 Tabela de elementos

Novos elementos podem surgir no futuro.

| Elemento | Descrição | Vantagem contra | Desvantagem contra |
|---|---|---|---|
| **Terra** | Rochas, minerais, areia, cristais e manifestações geológicas. Resistência, estabilidade e força. | Elétrico, Sônico, Ar | Orgânico, Água |
| **Água** | Água, líquidos, correntes, pressão e manipulação de fluidos. | Fogo, Tóxico, Terra | Elétrico, Gélido, Orgânico |
| **Fogo** | Chamas, calor, combustão, explosões e energia térmica. | Gélido, Orgânico, Cósmico | Água |
| **Elétrico** | Eletricidade, raios, magnetismo e descargas energéticas. | Água, Ar | Terra, Cósmico |
| **Ar** | Ventos, pressão atmosférica, tempestades e manipulação de gases. | Tóxico, Sanguíneo | Terra, Elétrico |
| **Gélido** | Gelo, congelamento, baixas temperaturas e cristalização. | Água, Orgânico | Fogo, Sônico |
| **Orgânico** | Vegetação, raízes, fungos, flores e manifestações biológicas da natureza. | Terra, Água | Fogo, Gélido, Tóxico, Dracônico |
| **Tóxico** | Venenos, toxinas, ácidos, contaminação e substâncias nocivas. | Orgânico, Sanguíneo | Água, Ar, Celestial |
| **Arcano** | Energia mágica, feitiços, runas, encantamentos e forças sobrenaturais. | Dracônico, Espiritual | Obscuro, Psíquico |
| **Obscuro** | Sombras, maldições, corrupção, trevas e energia negativa. | Psíquico, Espiritual, Arcano | Celestial |
| **Celestial** | Luz divina, bênçãos, energia sagrada, purificação e manifestações celestiais. | Obscuro, Tóxico | Sanguíneo, Cósmico |
| **Dracônico** | Poderes de dragões, sangue dracônico, sopros e energia ancestral. | Orgânico | Arcano, Sanguíneo |
| **Cósmico** | Estrelas, gravidade, energia astral, dimensões, espaço e fenômenos cósmicos. | Elétrico, Celestial | Fogo |
| **Sônico** | Vibrações, frequências, ondas sonoras e ressonância. | Psíquico, Gélido | Terra |
| **Psíquico** | Telepatia, telecinese, ilusões e manipulação mental. | Sanguíneo, Espiritual, Arcano | Obscuro, Sônico |
| **Sanguíneo** | Sangue, vitalidade, sacrifícios e manipulação biológica. | Celestial, Dracônico | Ar, Tóxico, Psíquico, Espiritual |
| **Espiritual** | Espíritos, almas, aparições e manifestações espectrais. | Sanguíneo | Arcano, Obscuro, Psíquico |

---

## 19. Habilidades

- Habilidades estão **vinculadas a equipamentos** de todas as categorias.
- Cada habilidade tem um **nome** e um ou mais **[efeitos](#20-efeitos)**.
- **Custo:** usar uma habilidade consome pontos de **Vigor** por padrão. Quanto mais forte a habilidade, mais Vigor ela custa. Algumas habilidades não consomem Vigor, e recursos, efeitos e outras habilidades podem reduzir ou aumentar o custo.
- Cada habilidade tem um ou mais **[elementos](#18-elementos)** e uma **forma**:

| Forma | Descrição |
|---|---|
| **Direcionada** | Atinge um alvo específico. |
| **Projétil** | Dispara algo em direção a um alvo. |
| **Área** | Afeta uma região e mais de um inimigo ao mesmo tempo. |
| **Contínua** | Permanece ativa por determinado período (exige ativação). |
| **Canalizada** | Exige concentração ou preparação: é preciso usar a habilidade algumas vezes antes de ela poder ser usada de fato. |
| **Passiva** | Funciona sem ativação manual. |

Continuar a descrição das habilidades: ==TODO==

---

## 20. Efeitos

Efeitos são uma das partes **mais dinâmicas** do jogo. Eles podem afetar qualquer coisa, positiva ou negativamente, e praticamente tudo no jogo pode ter um efeito.

Todo efeito tem quatro partes:

```
[ Gatilho (opcional) ] → [ Custo (opcional) ] → [ Ativação ] → [ Duração ]
     quando ativa            o que pagar          o que faz      por quanto tempo
```

Em todas as categorias abaixo, mais variações podem surgir no futuro (veja a [Parte III](#parte-iii--etapas-de-desenvolvimento)).

### 20.1 Gatilho (opcional)

O gatilho é a **condição de ativação**. Nem todo efeito tem gatilho.

| Categoria | Exemplos |
|---|---|
| **De zona** | Ao entrar nesta zona; ao entrar numa zona montanhosa; ao entrar numa zona campestre, fluvial ou religiosa; ao entrar em qualquer zona que não seja vulcânica ou subterrânea; ao entrar numa zona pantanosa, num local de vila, de castelo ou de pradaria; ao entrar numa zona desértica que não seja um oásis. |
| **De ação de zona** | Ao não realizar nenhuma ação de evento numa zona; ao passar por mais de duas zonas diferentes sem realizar ação de evento; ao descansar três vezes seguidas; ao não descansar nenhuma vez ao chegar a uma zona; enquanto não descansar mais de 1 vez; ao ficar sem descansar depois de passar por mais de quatro zonas; ao finalizar uma missão numa zona; ao finalizar todas as missões de uma zona; ao finalizar mais de três missões numa zona; ao finalizar uma missão em três zonas diferentes; ao finalizar uma raide numa zona; ao finalizar uma raide; ao finalizar 5 raides diferentes; ao finalizar a mesma raide 5 vezes. |
| **De evento aleatório** | Na fase de encontro; na fase de êxito ou revés; em qualquer fase que não seja a de antecipação. |
| **De evento de combate** | Ao derrotar um oponente; ao derrotar três oponentes diferentes; ao tentar fugir. |
| **De habilidade** | Ao usar uma habilidade de calçado; ao usar a habilidade de um equipamento de cabeça ou inferior; ao usar a habilidade de um equipamento que não seja de tronco; ao usar qualquer habilidade do equipamento "NOME DO EQUIPAMENTO"; ao usar qualquer habilidade de uma shuriken, espada de duas mãos ou adaga; ao usar uma habilidade de capa ou manopla. |
| **De recurso** | Ao ativar um efeito de um recurso; ao ativar quatro efeitos de recursos diferentes; enquanto não ativar mais de dois efeitos de recursos diferentes. |
| **De classe/especialização** | Enquanto você for de uma especialização da classe Bruxo; enquanto tiver apenas uma classe primária; se tiver duas classes primárias; se tiver mais de três classes primárias; se tiver duas especializações; se for um Guerreiro; se for um Ladino ou Clérigo; se for um Feiticeiro Druida. |
| **De modificador** | Se seu maior modificador for Reflexão; se seu maior modificador for Vigor ou Precisão; se seu menor modificador for Ataque; se seu menor modificador for Esquiva ou Celeridade; se tiver mais Precisão do que Defesa; se a soma de Ataque e Reflexão for maior que N. |
| **De atributo** | Se tiver uma carta de Sanidade na mão; duas cartas de Sorte; mais de três cartas de Destreza; três ou menos cartas de Força; uma de Resistência e uma de Carisma; uma de Espírito ou de Inteligência; três ou mais atributos diferentes; apenas um tipo de atributo; quatro ou menos atributos diferentes na mão. |
| **De inventário** | Ao ativar um efeito de um recurso do inventário; ao ativar dois ou mais efeitos de recursos diferentes do inventário; ao ativar um efeito de um item do inventário; ao ativar um efeito de um equipamento do inventário; ao ter 4 ou menos recursos diferentes no inventário; se não tiver nenhum recurso no inventário. |
| **De efeito** | Ao usar um efeito de um equipamento; ao usar dois ou mais efeitos de equipamentos diferentes; ao usar três ou menos efeitos de recursos diferentes do inventário; se usou efeitos de um item e de um equipamento; se usou efeitos de um equipamento de cabeça; se não usou efeito de equipamento de tronco ou capa; se usou três ou mais efeitos de itens diferentes do inventário. |
| **De jogador** | Se estiver sem cartas na mão; se tiver três ou menos cartas na mão; se não tiver cartas na pilha de descarte de atributos; se tiver 10 ou mais pontos de vida; se não tiver mais cartas no deck de atributos; se tiver 30 ou mais moedas de ouro; se tiver 3 ou menos pontos de vida. |

### 20.2 Custo (opcional)

O custo é o que é preciso pagar para ativar o efeito. Nem todo efeito tem custo.
- **Efeitos muito fortes** têm custos **difíceis e mais específicos**.
- Um custo pode ter **um ou infinitos requisitos**, misturando todas as categorias.
- **O efeito não pode ser ativado se o custo não for pago.**

| Requisito | Destino do que é pago | Exemplos |
|---|---|---|
| **Atributos** (um específico, uma combinação ou qualquer um) | Pilha de descarte de atributos | Um de Força; um de Carisma + três de Destreza + dois de Sanidade; dois de Espírito + 2 quaisquer. |
| **Doar vida** | — | Doe 7 de vida; doe vida igual à quantidade de equipamentos em uso (mín. 2); igual à quantidade de equipamentos no inventário (mín. 3); igual à quantidade de recursos no inventário (mín. 4); igual à quantidade de relíquias e documentos no inventário (mín. 2 no total); igual às cartas da pilha de descarte de atributos (mín. 5); metade da sua vida (arredonde para cima); igual ao seu maior modificador (mín. 200); igual ao seu menor modificador (mín. 100). |
| **Pagar ouro** | — | Pague 15 moedas; ouro igual à quantidade de equipamentos em uso (mín. 2); igual aos equipamentos no inventário (mín. 6); igual aos recursos no inventário (mín. 4); igual às relíquias e documentos no inventário (mín. 2 no total); igual às cartas da pilha de descarte de atributos (mín. 5); metade do seu ouro (arredonde para cima); igual ao seu maior modificador (mín. 50); igual ao seu menor modificador (mín. 90). |
| **Abdicar de equipamento** | **Limbo** | Só equipamentos **em uso** (no slot do jogador) no momento do gatilho. Abdique do equipamento de cabeça; de capa e tronco; de qualquer um que não seja calçado; de um aleatório; de um aleatório que não seja inferior; de três equipamentos. |
| **Descartar carta de atributo** | Pilha de descarte de atributos (por padrão) | Descarte 1 carta da mão; 1 aleatória; 1 de Carisma; 1 que não seja Força nem Sabedoria; 3 cartas; 4 que não sejam Destreza nem Espírito; até ficar com 2 na mão (mín. 1); toda a mão (mín. 3); 1 de Sanidade, 1 de Resistência e 1 de Sorte; 3 cartas diferentes; 2 cartas iguais. |
| **Oferecer recurso do inventário** | **Limbo** | Ofereça 1 item; 2 itens diferentes; 1 equipamento e 1 relíquia; 3 recursos iguais; 1 ferramenta, 1 tesouro e 1 documento; 5 recursos diferentes; 2 equipamentos e 2 itens; 1 que não seja equipamento; 2 que não sejam itens; 4 diferentes que não sejam relíquias, tesouros ou calçados. |
| **Manipulação de cartas** | Conforme a carta | Enviar N cartas do topo do deck de atributos para a pilha de descarte de atributos; enviar N cartas do fundo do deck para o limbo; reembaralhar N cartas da pilha de descarte no deck; reembaralhar no mínimo 3 cartas da mão no deck; colocar no mínimo 1 carta da mão no topo do deck; colocar no mínimo 3 cartas da mão no fundo do deck. |

### 20.3 Ativação

A ativação é a consequência do efeito: a ação, o ato.

| Categoria | Exemplos |
|---|---|
| **Interação matemática** | Perca/ganhe X moedas de ouro; perca/ganhe X pontos de vida; aumente seu Vigor em X; aumente Ataque e Esquiva em X; reduza Defesa, Perfuração e Reflexão em X; zere Celeridade e Defesa; zere o modificador X; uma carta do atributo X vale 2; uma carta do atributo X tem o valor multiplicado por 2; reduza sua vida pela metade (arredonde para cima); cause X de dano no oponente; reduza o ataque do oponente em X. |
| **Interação de cartas** | Compre X cartas do deck de atributos; descarte X cartas da mão; descarte uma carta específica; escolha uma carta da pilha de descarte de atributos e coloque-a no topo do deck; coloque X cartas do topo do deck na pilha de descarte; procure um atributo X na pilha de descarte; procure um atributo X no deck e coloque-o na mão; procure duas cartas do atributo X no deck, coloque-as na mão e embaralhe o deck; coloque X cartas da mão no topo do deck; envie X cartas do topo/fundo do deck para o limbo. |
| **Interação de efeito** | Anule todos os efeitos de um equipamento (a habilidade ativa, mas o efeito "não faz nada"); anule todos os efeitos dos itens; de equipamentos da categoria X; de itens da categoria X; de atributos aprimorados. |
| **Interação de habilidade** | Anule todas as habilidades de um equipamento (a habilidade **nem pode ser ativada**); de equipamentos de capa e calçado; de armas; de cimitarras, katanas, adagas e facas. |
| **Interação de regra** | Altera uma regra padrão do jogo: começar com 40 de vida em vez de 20; mover-se em diagonal; ter 4 ações por zona em vez de 3; ganhar X ações extras por zona; andar até 2 (ou X) zonas de distância; começar com 50 moedas em vez de 10; Recuperar dá 5 de vida em vez de 3; não ativar a coisa ruim de um evento no revés; ter no máximo X cartas na mão; valor de sucesso de fuga passa a ser 5; diminuir o valor de fuga em uma quantidade igual às cartas na mão; aumentar o valor de fuga em 4; a vitrine do mercado mostra +2 cartas para você; a vitrine mostra apenas 1 carta para você; a pasta de TCG passa a caber 50 cartas; a pasta passa a caber apenas 5 cartas. |
| **Interação de dados** | Ao rolar um dado, escolha o resultado; some 3 ao resultado; diminua do resultado uma quantidade igual às cartas na sua mão. |
| **Interação de recursos** | Quebre um equipamento do inimigo; quebre o equipamento de tronco do inimigo; quebre um equipamento seu aleatório; abdique de um equipamento seu à escolha ou aleatório; abdique do seu calçado ou da cabeça; repare um equipamento seu; repare um equipamento de um jogador na mesma zona; ofereça um recurso do tipo X ou Y do inventário; ofereça X recursos do inventário. |
| **Interação de elemento** | ==TODO== |
| **Interação de combate** | Derrote o inimigo automaticamente, sem causar dano. |

### 20.4 Duração

A duração é por quanto tempo o efeito vale.

| Categoria | Descrição |
|---|---|
| **Imediata** | O efeito acontece na hora e não se prolonga para nenhum outro cenário. |
| **Infinita** | O efeito fica em vigor até que uma carta, efeito, habilidade, recurso, etc. o desabilite. |
| **De carta** | Exemplos: até esta carta ir para a pilha de descarte de atributos; até a carta X ir para a pilha de descarte; até você ter três ou menos cartas na mão; até pelo menos quatro cartas irem para o limbo. |
| **De rodada** (no original, "de turno") | ==TODO== |
| **De zona** | ==TODO== |
| **De evento aleatório** | ==TODO== |
| **De evento de combate** | ==TODO== |
| **De fase de evento** | ==TODO== |
| **De ação de zona** | ==TODO== |
| **De combate** | ==TODO== |
| **De habilidade** | ==TODO== |
| **De efeito** | ==TODO== |
| **De atributo** | ==TODO== |
| **De jogador** | ==TODO== |
| **De inventário** | ==TODO== |
| **De modificador** | ==TODO== |
| **De classe/especialização** | ==TODO== |

---

## 21. Missões

- Missões são encontradas em algumas zonas. Nem toda zona tem missões.
- Algumas missões envolvem recolher itens, falar com um NPC, etc.
- Ações relacionadas: **Pegar**, **Continuar** e **Finalizar missão**. Quando o jogador chega a uma zona que tem uma etapa de uma missão que ele já pegou, ele interage para continuar ou finalizar a missão.
- **Não são obrigatórias:** se o jogador pegar uma missão e não cumpri-la, nada acontece. A missão fica em aberto até ele decidir cumpri-la.
- **Não se repetem:** cada jogador só pode completar a mesma missão **uma vez**.
- Ao concluir uma missão, o jogador pode receber recompensas.

---

## 22. Raides

Uma **raide** (dungeon ou instância) é uma **sequência determinada de eventos**, um após o outro, que acontece **somente na zona onde foi iniciada**.

### 22.1 Como iniciar

- Um jogador pode iniciar a raide **sozinho** ou chamar os jogadores da **mesma zona**, que podem aceitar ou não.
- Quem inicia a raide **gasta todos os pontos de ação** restantes.
- Quem participa junto **não gasta pontos de ação** nem perde a vez.
- Algumas raides necessitam de requisitos para poder ser iniciada. Quando o jogador tentar iniciar a raide, uma validação é feita dos requisitos necessários no inventário do jogador. Se os requisitos forem cumpridos, a raide pode ser iniciada.

### 22.2 Como funciona

- Os eventos da raide são **específicos** e **não se misturam** com o deck de eventos da zona.
- Eles contam uma **história**, e por isso é preciso consultar o **manual (guia do jogo)**. Haverá um livro físico com todas as raides, porque muita coisa acontece nelas.
- A raide funciona como um **jogo-livro**: o jogador participa ativamente da história e toma decisões que mudam a narrativa.
- A história **não precisa ser linear**. Dependendo das decisões, o jogador pode seguir caminhos diferentes, encontrar personagens distintos, enfrentar desafios, adquirir itens, desenvolver habilidades e chegar a **finais completamente diferentes**.
- Raides são **muito difíceis e extensas**, e por isso podem dar recompensas **muito boas e fortes** (uma ou mais).
- Para as regras de combate dentro da raide, veja [Combate em raides](#174-combate-em-raides).

### 22.3 Repetição

- É possível repetir a mesma raide várias vezes para ver outros finais, explorar outros caminhos e conseguir recompensas diferentes.
- Para repetir, é preciso esperar o **cooldown** descrito na carta da raide (por exemplo, esperar 3 rodadas, ou ter o recurso X no inventário, etc).

---

## 23. Negociação

- Acontece entre **dois jogadores na mesma zona**.
- **Não gasta ponto de ação** de nenhum dos jogadores.
- Os dois jogadores precisam **concordar** em iniciar a negociação.
- Não há limite de coisas negociadas de cada lado.
- Algumas zonas têm efeitos que **proíbem** a negociação.
- **Nunca** é permitido negociar durante um combate.

---

## 24. Mercado

O mercado aparece em algumas zonas e permite **comprar e vender** recursos, cartas e boosters.

### 24.1 Venda pelo jogador

- **Preço tabelado:** todos os mercados pagam a **mesma quantia** pelo mesmo recurso. Nenhum mercado paga mais que outro por padrão.
- Efeitos, habilidades e recursos do jogador podem fazer o mercado oferecer **mais ouro**.

### 24.2 Compra de itens, recursos e equipamentos

- Mercados de zonas diferentes podem oferecer recursos **iguais** e recursos **exclusivos**. O jogador precisa explorar vários mercados para encontrar o que procura.
- Não há limite de venda de um item, recurso ou equipamento específico.
- Coisas essenciais, como **munição e poções**, existem em todos os mercados.

### 24.3 Boosters

- Todos os mercados têm **boosters ilimitados** das [coleções](#25-coleções) vigentes.
- O preço do booster é **sempre tabelado**, mas efeitos, buffs e habilidades podem dar desconto.
- Um booster contém **cartas novas de recursos e de atributos**.

### 24.4 Singles

**Singles** são cópias avulsas de uma carta específica: recursos, itens e equipamentos que vão para o inventário ou são equipados, e atributos que vão para o deck.

- **Nem todo mercado** vende singles.
- **Vitrine:** os singles ficam numa vitrine de **4 slots** por padrão. Quando uma carta sai da vitrine, entra outra carta aleatória das coleções vigentes.
- **Distribuição aleatória:** não se sabe em qual mercado um single vai aparecer. Mais de um mercado pode vender o mesmo single.
- **Preços variáveis:** cada mercado tem sua própria lógica de preço para singles, e o mesmo single pode estar mais caro ou mais barato em mercados diferentes. Cartas com mais vantagens, benefícios, efeitos, buffs, dano ou defesa são mais caras. A lógica de cálculo ainda precisa ser definida.
- **Esgotamento:**
  1. Exemplo: o mercado da zona A tem 4 cópias da carta X. Quando elas acabam, a carta X deixa de estar disponível ali. Em outro mercado, na zona B, podem "surgir" mais 2 cópias.
  2. Quando **todos os mercados** da dimensão tiverem vendido **pelo menos 1 cópia** da carta X, nenhum mercado vende mais essa carta.
  3. A carta esgotada **não aparece na vitrine** até que **todas as outras cartas** das coleções vigentes tenham aparecido. Depois disso, os singles voltam a se repetir.
- **Mercado "vivo":** independentemente do número de jogadores (solo, 2 ou mais), os mercados têm um **sistema de decaimento** de singles, como se houvesse NPCs comprando. Os jogadores precisam ficar atentos para não perder uma carta de que precisam.
- Nem todas as cartas das coleções vigentes estarão disponíveis como singles, porque o volume de cartas é grande e provavelmente não haveria tempo de jogo para todas circularem.

---

## 25. Coleções

- As coleções funcionam como os lançamentos de coleções de TCGs tradicionais.
- **Por padrão, cada dimensão é uma coleção nova** de cartas (atributos, recursos, zonas, etc.).
- **Por padrão, existe 1 coleção ativa por dimensão.** A dimensão escolhida para jogar tem, por padrão, **apenas as cartas da sua coleção**.
- Todas as cartas de uma coleção podem ser obtidas dentro da dimensão em que ela foi lançada.
- Uma coleção pode **estender seu período ativo**, por exemplo, por até três dimensões seguintes.
- Pode haver **reprint** de uma coleção já lançada numa nova dimensão completamente diferente.
- O que uma nova coleção traz:
  - **Para o jogador** (dentro dos boosters): novas cartas de recursos e atributos.
  - **Para o jogo** (a dimensão): novas zonas, possíveis ações exclusivas, novos eventos, novas raides, etc.
- Novas dimensões e coleções são lançadas periodicamente (por exemplo, a cada 3 meses).
- No modo **Clássico**, é possível escolher quais coleções ficam ativas (veja [Clássico](#273-clássico)).

---

## 26. Ferreiro

Ação de zona **Ir ao Ferreiro**: refinar, encantar, criar e consertar equipamentos.

Mecânicas de refino, reparação de armas quebradas e criação de equipamentos: ==TODO==

---

## 27. Modos de jogo

### 27.1 Campanha

- **Cooperativo:** todos trabalham juntos para "zerar" a dimensão.
- Tudo o que os jogadores conquistam é **levado para as próximas dimensões**.
- Por padrão, os jogadores **não podem voltar** a uma dimensão já concluída.
- As regras dos capítulos 2 a 26 descrevem este modo.

### 27.2 Desbravadores

**Visão geral:**
- **Competitivo, cada um por si.** Os jogadores podem formar **alianças temporárias** se quiserem.
- Formato de **runs**: é possível jogar a mesma dimensão várias vezes, só por diversão.
- As vezes são jogadas **uma de cada vez**, e a movimentação segue **as mesmas regras da campanha**.

**Objetivos e vitória:**
- No início, cada jogador recebe **5 cartas de objetivo** por padrão. Exemplos: "Ir para a zona X", "Ir para a zona Y", "Coletar N itens de um tipo", "Nocautear outros jogadores duas vezes", "Forjar um equipamento específico".
- Cada jogador escolhe quais objetivos quer cumprir.
- Cada objetivo dá a quantidade de **pontos de objetivo** escrita na carta. Objetivos mais difíceis dão mais pontos, e o mínimo por padrão é **2 pontos**.
- **Vence quem somar 10 pontos de objetivo primeiro.**

**Spawn:**
- Antes da partida, cada jogador escolhe sua **zona de spawn**.
- Neste modo, é possível **trocar** o ponto de spawn.

**Benção do spawn** (exclusiva deste modo):
- Quando reaparece depois de um nocaute, o jogador provavelmente acabou de sofrer penalidades. A benção existe para que ele não entre em combate contra outro jogador em desvantagem.
- Enquanto tem a benção, ele **não pode ser atacado** por outros jogadores e **também não pode atacá-los**.
- A benção acaba quando:
  - o jogador **sai da zona de spawn**, ou
  - **todos os outros jogadores** jogaram uma vez depois que ele reapareceu.

**Encontro entre jogadores (PvP):**

1. Quando um jogador entra em uma zona em que há um outro jogador, uma nova ação de zona é habilitada: ação de **enfrentar jogador ou jogadores**. Esta ação consome um ponto de ação.
2. **Ninguém quer lutar:** não necessariamente um jogador precisa iniciar um conflito com outros jogadores. Cada jogador segue com suas ações normalmente.
3. **Alguém quer lutar e outros não:** se alguém usa uma ação de enfrentamento, todos os jogadores daquela zona vão se enfrentar cada um por si. Quem não quer lutar deve fazer um **teste de fuga**:
   - quem quer lutar rola um D20;
   - quem quer fugir rola um D20;
   - se o resultado de quem quer fugir for **menor**, os dois são obrigados a lutar; se for **maior**, a fuga dá certo;
   - se **mais de um** jogador quiser lutar, quem quer fugir rola um D20 **contra cada um** deles. O jogador que quer fugir tem que conseguir passar no teste de fuga contra todos os outros jogadores. Falhar em um teste de fuga já é o suficiente para obrigar quem esta tentando fugir a lutar.
4. Pode haver lutas com **2, 3, 4, 5 ou mais jogadores**, dependendo de quantos estão na mesma zona. **Só pode haver um vencedor.**
5. **Vencedor:** pode **saquear** o inventário e a pasta de TCG dos perdedores, pegando quantos itens quiser **enquanto tiver espaço** no próprio inventário e pasta de TCG.
6. **Perdedores:**
   - perdem os itens saqueados;
   - perdem **3 pontos de objetivo** por padrão;
   - vão para o seu ponto de spawn;
   - recebem a **benção do spawn**.

**Combate contra inimigos com ajuda de outros jogadores:** os ajudantes podem negociar a divisão da recompensa antes de entrar no combate (veja [Sistema de combate](#173-combate-com-2-ou-mais-jogadores--1-ou-mais-inimigos)).

### 27.3 Clássico

- É o **Desbravadores em versão cooperativa**.
- Antes da partida, os jogadores escolhem **qualquer dimensão**.
- **Coleções:** é possível manter apenas as cartas daquela dimensão ou ativar uma ou mais outras coleções.
- As vezes são jogadas **uma de cada vez**, como na campanha.
- **Não existe combate entre jogadores.**
- Usa **cartas de objetivo** e a ação de objetivo, como o Desbravadores.
- **Vitória:** **todos** os jogadores precisam atingir ou ultrapassar **10 pontos de objetivo cada um**.
- **Nenhuma recompensa** é levada para outras dimensões. É uma run curta, para jogar rápido com amigos ou sozinho e para testar a dimensão.

### 27.4 Enfrentamento (PVP)

- Modo **apenas de combate** entre jogadores, sem compromisso, para **testar decks e builds**.
- Aceita várias combinações de times: 1 contra 1, 1 contra 3, 4 contra 3, etc.
- **Não afeta** a progressão de nenhum outro modo: não dá recompensas nem vantagens que sejam levadas para outros modos.
- Cada jogador tem **10 slots de decks** para montar builds e testar combos.
- Todos os jogadores têm acesso a **todas as cartas já lançadas**, de coleções vigentes ou não.
- **Não é possível fugir**, mas é possível **desistir** do combate.

---

## 28. Pendências do manual

| Tema | Pendência |
|---|---|
| Classes | Como obter uma especialização; como se tornar multiclasse; afinidade de classes com elementos. |
| Habilidades | Continuar a descrição. |
| Efeitos | Interação de elemento; durações marcadas com ==TODO==. |
| Ferreiro | Mecânicas de refino, reparo e criação. |
| Desbravadores | Quando o encontro PvP é disparado; empate no teste de fuga contra jogador; se o progresso é levado para outras dimensões. |
| Batalha (X1/PVP) | Nome definitivo. |
| Ações de zona | Confirmar o custo de cada ação. |
| **Montaria** | Movimentação entre zonas e outros benefícios? ==TODO== |
| **Tipos de inimigo** | Raça? ==TODO== |

---

# Parte II — Requisitos técnicos

> **Atenção**: muitos conceitos estão sujeitos a mudar com o tempo devido a novas ideias ou à descoberta de problemas. Esta seção apresenta as ideias básicas.

### Natureza do projeto
- Este documento descreve o jogo como se fosse um jogo físico de verdade. O projeto, porém, é uma **versão digital**, onde muitas partes do gameplay podem ser **automatizadas** para facilitar a implementação e deixar o jogo mais fluido.
- O jogo é em **tempo real**, com interações acontecendo ao mesmo tempo entre os jogadores e o próprio jogo.
- O jogo funcionará principalmente em **PC (monitores)**. Distâncias, tamanhos, margens e espaços devem se ajustar ao monitor do usuário para a melhor experiência possível.

### Stack
- **Frontend:** TypeScript, Vite, React, TanStack Query (React Query) e React Router DOM, além de outras bibliotecas a decidir durante o desenvolvimento.
  - Primeiro roda localmente via web; depois será portado para executável de PC com **[Tauri](https://v2.tauri.app/start/)**.
- **Backend:** TypeScript, NestJS, ORM Drizzle, arquitetura hexagonal e Domain-Driven Design, além de WebSockets, Socket.IO, Aggregate Root, Domain Events & State Machine, Portas (interfaces) e Adaptadores (implementações), e outras tecnologias e arquiteturas que surgirem conforme a necessidade.
  - **Docker Compose** para o banco de dados e o backend, para implementar primeiro localmente antes do deploy (as plataformas de hospedagem são pagas).
- **Não instalar bibliotecas de terceiros sem permissão.**

### Testes
- **Frontend:** Vitest (unitários) e Playwright (end-to-end). Sugestões são aceitas para testes de integração.
- **Backend:** Vitest, uma biblioteca para testar requests aos endpoints e outros testes considerados importantes.

### Interface e experiência
- Animações e transições **bonitas e simples**.
- **Termos do jogo com highlight:** termos (e suas variações) devem ter destaque ou cor própria e mostrar um **tooltip** explicativo ao passar o mouse. Exemplos: Atributos e cada atributo, Zonas, Classes e cada classe, modificadores, cada ação de zona, cada tipo de evento, etc.
- **Imagens e ícones** serão fornecidos pelo autor. Imagens e ícones SVG podem ser criados apenas para testes.
- Termos do jogo podem ser alterados, **com aprovação** do autor.

### Estilo gráfico: 2.5D no estilo PSX

- **Geometry and models:** Extremely low-poly 3D models, low polygon counts, angular silhouettes, visibly faceted surfaces, simple geometric shapes, coarse environmental geometry, primitive character models and rigid-looking structures.
- **Textures and materials:** Very low-resolution textures, visibly pixelated texture maps, blurry and muddy surfaces, crude hand-painted textures, limited texture detail, affine texture mapping artifacts, perspective distortion, warped textures, and subtle polygon vertex jitter reminiscent of original PS1 hardware.
- **Rendering and lighting:** Original PlayStation-era rendering aesthetics, simple vertex lighting, minimal dynamic lighting, limited shading, basic diffuse materials, hard-edged shadows where appropriate, low color depth appearance, restrained visual effects, and authentic late-1990s 3D game rendering.
- **Image quality:** Low internal rendering resolution, visible pixelation, jagged polygon edges, aliasing, subtle dithering, limited draw distance, atmospheric distance fog when appropriate, and the characteristic imperfections of early real-time 3D graphics. Preserve the raw, imperfect appearance of vintage console footage rather than modernizing the image.
- **Art direction:** Nostalgic, atmospheric, imperfect, surreal when appropriate, visually distinctive and unmistakably from the original PlayStation era. The final image should look like an authentic screenshot captured directly from a real 1990s PS1 game running on original hardware.
- **Strict restrictions:** No modern photorealism, no high-poly models, no physically based rendering (PBR), no ray tracing, no modern cinematic CGI, no ultra-high-resolution textures, no Unreal Engine 5 aesthetic and no excessive post-processing.

### Valores que precisam de análise
- Tamanho do deck de atributos: **60 cartas** (especulativo).
- Tamanho do deck de eventos por zona: **~30 cartas** (especulativo).

---

# Parte III — Etapas de desenvolvimento

### Agentes e skills
- Criar os agentes e skills necessários para desenvolver o projeto. O [arquivo de referência](PROMPT-AGENTES-E-SKILLS.md) dá uma ideia de como criá-los.
- Instruções obrigatórias nos agentes de desenvolvimento:
  - "Não disfarce suas dúvidas. Explicite as vantagens e desvantagens de cada escolha."
  - "Implemente apenas o necessário para resolver o problema. Não acrescente nada baseado em suposições."
  - "Modifique apenas o que for indispensável. Corrija ou limpe tudo aquilo que suas próprias alterações deixarem para trás."
  - "Estabeleça critérios claros para considerar a tarefa concluída. Continue iterando até confirmar que eles foram atendidos."

### Desenvolvimento por feature
- Dois projetos em paralelo, **frontend** e **backend**, cada um com seus próprios agentes e skills.
- Toda implementação resolve **uma feature ou um bug específico**.
- Uma feature só está completa quando foi resolvida **nos dois lados** (ou no único lado que precisa de alteração).
- O autor faz o controle e leva as informações de um projeto para o outro. As skills e os agentes devem ter instruções claras sobre **quando precisam de validação do outro lado**.
- Analisar todos os requisitos e criar os agentes e skills do frontend e do backend.
- Criar a lista de passos, etapas e fases de desenvolvimento do frontend e do backend.

### Efeitos
- Para cada categoria de gatilho, custo, ativação e duração, é preciso criar uma **vasta variedade** de possibilidades, para permitir estratégia "infinita" e fazer o jogador pensar.
- Analisar todo o [capítulo de efeitos](#20-efeitos) e criar a maior variedade possível de combinações de gatilho, custo, ativação e duração. Quanto mais variedade, mais desafiador e estratégico fica o jogo.
- A lista de variações deve ser **validada pelo autor**, que decide o que entra e o que sai.

### Etapas (ordem sugerida pelo autor; pode ser alterada se houver uma sequência melhor)

**Etapa 1 — Análise e planejamento**
- Analisar o documento inteiro e apontar pontos em aberto, problemas de conceito, contradições, pontos que precisam de esclarecimento e dúvidas (técnicas e de ideia do jogo).
- **Entrevistar o autor** para tirar todas as dúvidas antes de seguir.
- Planejar com **spec-driven development**. Referências:
  - https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
  - https://blog.dsacademy.com.br/spec-driven-development-a-nova-arquitetura-de-engenharia-de-software-na-era-dos-agentes-de-ia-parte-3/
  - https://www.ibm.com/br-pt/think/topics/spec-driven-development
  - https://thoughtworks.medium.com/spec-driven-development-d85995a81387
- Organizar as etapas em três momentos:
  1. Jogo funcional (frontend e backend) para **um jogador**.
  2. **Mais jogadores controlados por IA** (testar com outros três jogadores, todos IAs).
  3. Jogo **online web** com interatividade em tempo real, WebSockets, etc.
- Separar em **dois arquivos**: um com todo o contexto, regras, aspectos e etapas do frontend, e outro com o mesmo para o backend.

**Etapa 2 — Manual de regras**
- Criar um arquivo `.md` de regras organizado e estruturado como um manual de jogo de tabuleiro, que sirva de guia para os jogadores.
- Ordenar as regras de forma que cada uma facilite o entendimento da próxima.
- Explicar em detalhe, com **infográficos e imagens** para os conceitos mais complexos.
