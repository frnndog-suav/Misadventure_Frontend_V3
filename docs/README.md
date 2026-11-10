# Introdução

Estou querendo criar um jogo TCG de card web com frontend e backend. Me ajude idealizar o jogo. O jogo TCG tem como ideia ser um jogo modular no aspecto de quantidade de jogadores, grind, RPG, TCG, jogos de tabuleiro e outras mecânicas que irei descrever mais pra frente. Falando sobre o aspecto de quantidade de jogadores, o jogo pode comportar 1 até infinitos jogadores (por mais que seja improvável). Mas, infinitos jogadores seria para considerar que podem ser um número muito elevado de jogadores.

Dando um contexto primeiramente sobre o jogo (sinopse) seria: um aventureiro ou vários chegam numa dimensão para pegar o prêmio máximo daquela dimensão (um artefato, prêmio em moedas de ouro, equipamentos muito fortes, etc) ou matar o chefe final daquele lugar. Dependendo do modo de jogo, os jogadores devem se ajudar ou derrotar os outros ou tentar ajudar temporariamente outros jogadores para conseguir algum benefício para conseguir desbravar essa dimensão. O jogo se baseia num sistema baseado em turnos misturado com outros conceitos de TCG, mecânicas de jogo de tabuleiro, interatividade em tempo real, etc. Os jogadores exploram o mapa tendo que resolver alguns encontros (eventos aleatórios) e confrontos (com outros jogadores, junto com outros jogadores ou contra inimigos propostos pelo próprio mundo) até um jogador conseguir obter o prêmio máximo daquela dimensão ou matar o chefe final daquela dimensão. Todas as coisas conquistadas por um jogador (poção, equipamentos, bugs, prêmios, dinheiro, etc) são levadas para a próxima dimensão. O jogo não tem uma dimensão final. Vai existir um sistema de lançamento de coleção onde, a cada certo período de tempo (3 meses por exemplo), uma nova dimensão com novos itens, cartas, prêmios, etc são adicionados e os jogadores vão desbravando infinitas dimensões atrás de ter os melhores itens, equipamentos, buffs, mais dinheiro, etc. O jogo tem 3 modos: campanha (modo cooperativo onde suas coisas são levadas para outras dimensões e todos trabalham juntos para "zerar" aquela dimensão), desbravadores (cada um por si e quem completar os objetivos sorteados no começo da partida primeiro ganha) e o modo batalha x1 (apenas combate para testar sua build que não influencia nos outros modos). No modo campanha, os jogadores não podem retornar para uma dimensão ja concluída por padrão. No modo desbravadores, como é um modo considerado competitivo e no formato de "runs", os jogadores podem jogar várias vezes a mesma dimensão apenas por diversão.

Vamos falar primeiro do modo campanha porque, a partir dele, a explicação dos outros modos fica mais fácil. Com base no ![protótipo de mapa mundi](/docs/images/protótipo_mapa_mundi.JPG), vou explicar alguns conceitos do jogo. A dimensão tem cartas de zonas (podem ser umas 12 cartas, 16 cartas, 20 cartas, etc). Ao iniciar o jogo, as cartas das zonas da dimensão são embaralhadas. As cartas de zonas podem possuir nenhuma, uma, duas, três ou quatro setas apontandas para as aresta da carta. Algum jogador pega o baralho embaralhado de zonas da dimensão e começa a montar o mapa. Obrigatóriamente, uma carta de zona urbana do tipo cidade deve ser selecionada de forma aleatória para ser a primeira carta posicionada na mesa (obrigatóriamente qualquer zona urbana tem as quatro setas apontando uma para cada aresta da carta). Após isso, alguém começa a comprar cartas do topo do deck de zonas da dimensão para montar o mapa. Cada nova carta de zona da dimensão deve ser posicionada para onde uma seta de uma carta já posicionada no mapa aponta. Dessa forma, toda vez que o a dimensão for jogada, uma nova versão daquele mapa é construído, permitindo um rejogabilidade e diferentes estratégias e planos. Uma vez montado o mapa, os jogadores escolhem onde começar no mapa (é obrigatório os jogadores iniciarem em uma zona urbana). Se essa é a primeira dimensão que os jogadores entram (nunca jogaram esse jogo antes, ou seja, é a primeira aventura), todos os jogadores começam sem equipamentos, armas e acessórios. 

Os jogadores começam com 
- 10 moedas de ouro.
- 20 pontos de vida por padrão (não existe limite de pontos de vida).
- Compram 7 cartas do deck de atributos para mão.
- Escolhem uma classe para iniciar a aventura. 

Cada jogador joga um vez e vão se revezando (é escolhido a ordem dos jogadores de forma aleatório ou por algum critério). Ao iniciar a vez de um jogador, a primeira coisa que ele tem que fazer é escolher ficar na mesma zona ou mudar para uma zona que tenha conexão com a zona atual em que ele esta (não é possível se movimentar em diagonal e é apenas uma ação de movimento por padrão). Uma vez escolhido se movimentar ou ficar, o jogador tem algumas escolhas a fazer. A zonas tem ações que podem ser executadas. O jogador tem 3 pontos de ação por padrão para gastar entre essas ações possíveis. O jogador não precisa usar todas elas. Ele pode simplesmente pular se não quiser usar todos os pontos de ação. Quando um jogador terminar de usar todas as suas ações ou pular a vez, segue para o próximo jogador. Sobre a dimensão, pode ser que tenha um efeito padrão, nenhum ou vários. Por exemplo, jogadores dentro dessa dimensão não podem usar efeitos do elmo. Outro exemplo seria, jogadores precisam pagar 1 moeda de ouro para usar uma ação e durante eventos do tipo combate não podem usar poções, etc. Isso são só exemplos. Pode ser que a dimensão não tenha nenhum efeito também (mas isso pode significar que a dimensão tenham eventos muitos difíceis). Turno é considerando quando todos os jogadores tiverem jogado uma vez (exemplo: tem três jogadores jogando; o jogador A faz as ações da sua vez; o jogador B faz as suas ações; o jogador C faz suas ações; turno encerrado e volta para a vez do jogador A)

Sobre o modo desbravadores, esse modo é mais competitivo e cada um por si (mas os jogadores podem decidir entre eles se eles querem fazer alianças temporárias). Nesse modo, o jogador que coletar 10 pontos de objetivos primeiro ganha. No começo do jogo, cada jogador recebe objetivos para cumprir. Por exemplo, o jogador A recebe as missões "Ir para a zona X", "Ir para zona Y", "Coletar N itens de um tipo", "Nocautear duas vezes outros jogadores", "forjar um equipamento específico", etc. Existem diversos objetivos que podem ser sorteados. A cada objetivo cumprido, o jogador recebe uma quantidade de pontos de objetivo descrito na carta de objetivo. Objetivos mais difíceis dão mais pontos de objetivo. Por padrão todos os jogadores recebem 5 cartas de objetivos e, no mínimo, cada objetivo da 2 pontos de objetivo por padrão. Cada jogador escolhe quais objetivos ele quer cumprir. O que muda no modo desbravadores seria "todos os jogadores jogam ao mesmo tempo". Todos os jogadores escolhem secretamente para qual zona querem se mover ou permancer caso não queiram se mexer. Após todos tiverem feitos suas escolhas, todos revelam ao mesmo tempo para onde se moveram ou permanceram. Caso só tenha um jogador numa zona, ele prossegue para o fluxo normal de executar 3 ações por padrão daquela zona. Caso 2 ou mais jogadores se encontrarem na mesma zona, todos os jogadores na mesma zona escolhem secretamente se querem lutar ou não. Depois, todos revelam suas escolhas ao mesmo. Se um jogador quiser lutar e os outros não, os jogadores que não quiseram lutar devem tentar fugir (teste de fuga: o jogador que quer lutar rola um D20. O jogador que quer fugir rola um D20 e se ele tirar um número menor que o número do jogador que quer lutar, eles são obrigados a lutar. Se for maior, o jogador foge com sucesso). Se mais de um jogador quiser lutar, os jogadores que quiserem fugir devem rolar um D20 para cada jogador que queira lutar seguindo o mesmo testes de fuga. Agora, se todos decidirem não lutar, nada acontece. Nesse aspecto, isso significa que podem haver lutas com 2, 3, 4, 5 jogadores ou mais dependendo da quantidade de jogadores na mesma zona. Só pode haver um ganhador no combate. O ganhador tem direito de fazer o saque no inventário dos perdedores e das pastas de TCG deles (enquanto o ganhador tiver espaço no inventário dele, ele podem pegar quantos itens quiser dos inventários dos perdedores). Os perdedores perdem seus itens que foram saqueados pelo ganhador, perdem 3 pontos de objetivo por padrão, vão para zona de spawn escolhida no começo do jogo (antes do jogo iniciar, cada jogador decide qual zona ele quer ser o seu ponto inicial de spawn) e recebem a benção do spawn (caso já tenha um outro jogador na zona de spawn do perdedor, o jogador ou jogadores que estiverem lá não podem ataca-lo como forma de ser justo). Seguindo o fluxo de caso nenhum jogador queira se enfrentar quando se encontrarem na mesma zona, cada jogador executa suas 3 ações por padrão (seguindo o mesmo fluxo do modo campanha).

---

# Levar em consideração (aspectos de gameplay e regras).

**Atenção**: muitos conceitos estão sujeitos a mudar com tempo devido a novas ideias ou descobertas de problemas. Essa sessão apresenta as ideias básicas.

- Organize as ideias como se fossem uma manual de regras da melhor forma possível (como um manual de jogo de tabuleiro) para seguir de guia para os jogadores conseguirem entender do que se trata o jogo.
- O nome do jogo tem o "working title" como Misadventures.
- Quando um jogador chega a zero pontos de vida, ele é nocauteado. Ele retorna para o ponto de spawn dele com a vida cheia e perde seu próximo turno por padrão (se estiver jogando sozinho, ele não perde um turno).

### O que são Atributos? ![(referência de imagem protótipo)](images/exemplos_prototipo_de_atributos.JPG)
Cada jogador tem um deck de atributos próprio contendo exatas 60 cartas. A mecânica de deck building desse jogo envolve construir um deck de atributos. 
o sistema possui 9 atributos fundamentais, organizados em três categorias: físicos, mental social, e metafísicos. 
- **Atributos físicos**:
**Força**
Representa a potência física e a capacidade do personagem de exercer força muscular. Está relacionada à capacidade de levantar, empurrar, carregar, quebrar objetos e causar impacto físico.
**Destreza**
Representa a agilidade, a coordenação motora e a precisão dos movimentos. Está relacionada à capacidade de realizar movimentos rápidos, esquivar-se, manter o equilíbrio, manipular objetos com precisão e utilizar armas que exigem técnica.
**Resistência**  
 Representa a capacidade física de suportar esforços, danos e condições adversas. Está relacionada à vitalidade, tolerância à dor, fôlego e capacidade de continuar lutando mesmo sob desgaste físico. 

 - **Atributos mental social**  
**Inteligência**  
 Representa a capacidade de raciocínio, aprendizado e compreensão lógica. Está relacionada ao conhecimento, memória, resolução de problemas, investigação, planejamento e domínio de assuntos complexos.
**Sabedoria**
Representa a percepção, a intuição e a capacidade de interpretar situações. Está relacionada ao discernimento, experiência, leitura do ambiente, reconhecimento de padrões e tomada de decisões sensatas.
**Carisma**  
 Representa a personalidade e a capacidade de influenciar outras pessoas. Está relacionado à persuasão, liderança, negociação, intimidação, eloquência e capacidade de conquistar a confiança ou o respeito de alguém. 

- **Atributos metafísicos**
**Espírito**
Representa a força interior, a determinação e a capacidade de exercer ou resistir a influências sobrenaturais. Está relacionado à força de vontade, concentração, energia espiritual, resistência a possessões e domínio de poderes místicos.  
 **Sanidade**
Representa a estabilidade mental e a capacidade de preservar a lucidez diante de experiências psicologicamente perturbadoras. Está relacionada à resistência ao horror, ao desconhecido, a entidades incompreensíveis e a fenômenos que desafiam a percepção da realidade.  
 **Sorte**  
 Representa a influência do acaso sobre os acontecimentos que envolvem o personagem. Está relacionada à probabilidade de encontrar oportunidades, evitar situações desfavoráveis, obter resultados inesperados e se beneficiar de circunstâncias imprevisíveis.

**Obs**: Distinções entre atributos: Alguns atributos possuem conceitos próximos, mas representam capacidades diferentes.
**Força vs. Resistência**: - **Força:** capacidade de exercer potência física. - **Resistência:** capacidade de suportar esforço e danos.  
 **Inteligência vs. Sabedoria**: - **Inteligência:** capacidade de adquirir e processar conhecimento. - **Sabedoria:** capacidade de interpretar situações e aplicar discernimento.
**Espírito vs. Sanidade**: - **Espírito:** força interior para resistir a influências externas e sobrenaturais. - **Sanidade:** capacidade de preservar a lucidez diante de experiências perturbadoras.
**Carisma vs. Espírito**: - **Carisma:** capacidade de influenciar outras pessoas. - **Espírito:** capacidade de sustentar a própria vontade diante de influências externas.

- Observações sobre o sistema de atributos: Espírito e Sanidade não precisam ser atributos exclusivos de personagens mágicos. Um guerreiro pode possuir Espírito elevado devido à sua determinação, enquanto um explorador pode apresentar Sanidade elevada por sua capacidade de lidar com situações extremas. Essa abordagem permite que todos os atributos sejam relevantes para diferentes classes, mesmo que algumas possuam maior afinidade com determinados atributos.
- Atributos são sub-dividos em categorias "**Básico**", "**Sinérgico**" e "**Aprimorado**":
  - **Atributo Básico** tem valor 1 para o atributo da carta (atributo Básico podem ter infinitas cópias no deck).
  - **Atributo Sinérgico** são atributos que podem valer 2 ou até 4 atributos diferentes. Por exemplo, uma carta de atributo que vale por 1 de carisma e 1 de sabedoria; outro exemplo seria uma carta de atributo pode valer por 1 de resistência, 1 de destreza e 1 de sorte; assim por diante. Atributo Sinérgico só podem ter no máximo 4 cópias daquela mesma carta.
  - **Atributo Aprimorado** são parecidos com o atributo Básico com a exceção que eles possuem um efeito. Atributo Aprimorado só podem ter no máximo 4 cópias daquela mesma carta.

### O que são zonas?

Zonas são cartas de lugares que compõe o mapa de uma dimensão. Zonas possuem um tipo que é o local. Aqui estão algumas categorias de zonas possíveis das dimensões e seus repectivos locais (lembrando que em outras dimensões podem ter zonas específicas e diferentes) ![(referência de imagem protótipo)](images/prototipo_de_zonas.JPG):
  - Zona **montanhosa**. Possíveis locais: Montanhas, colinas, vales, picos, cordilheiras, etc.
  - Zona **florestal**. Possíveis locais: Florestas, bosques, matas, selvas, etc.
  - Zona **costeira**. Possíveis locais: Praias, falésias, enseadas, litoral, Portos, docas, ancoradouros, etc.
  - Zona **lacustre**. Possíveis locais: Lagos, lagoas, margens, áreas alagadas, etc.
  - Zona **pantanosa**. Possíveis locais: Pântanos, brejos, manguezais, charcos, etc.
  - Zona **campestre**. Possíveis locais: Campos, pradarias, pastagens, planícies, etc.
  - Zona **desértica**. Possíveis locais: Desertos, dunas, oásis, terrenos áridos, etc.
  - Zona **vulcânica**. Possíveis locais: Vulcões, crateras, campos de lava, etc.
  - Zona **fluvial**. Possíveis locais: Rios, riachos, cachoeiras, corredeiras, etc.
  - Zona **subterrânea**. Possíveis locais: Cavernas, grutas, túneis, minas, abismos, etc.
  - Zona **urbana**. Possíveis locais: Cidades, metrópoles, etc.
  - Zona **rural**. Possíveis locais: Fazendas, plantações etc.
  - Zona **habitada**. Possíveis locais: Vilas, aldeias, povoados, assentamentos, Acampamentos, etc.
  - Zona **fortificada**. Possíveis locais: Castelos, fortalezas, cidadelas, muralhas, etc.
  - Zona **religiosa**. Possíveis locais: Templos, santuários, monastérios, etc.
  - Zona **industrial**. Possíveis locais: Fábricas, oficinas, complexos industriais.
- As zonas da dimensão possuem ações dentro delas. Nem todas as ações estão presentes em todas as zonas. Por exemplo, uma zona da dimensão pode ter uma 5 ações possíveis que o jogador pode fazer dentro dela, outra zona pode ter apenas uma ação possível de ser executada nela. As ações das zonas consomem energia. Dependendo da ação, mais energia é necessária para executa-la. Algumas ações são exclusivas de certas zonas, mas existem ações que podem ser feitas em mais de uma zona diferente. Por exemplo, uma zona de cidade pode ter as ações de "iniciar evento", "ir no ferreiro", "ir no mercado" e "ir ao hotel". Cada ação interage diferente com o jogo. Porém, em um outra cidade, pode ser que tenha apenas as ações "iniciar evento" e "ir no mercado". Essas ações limitam o que o jogador pode fazer dentro daquela ação e faz com que o jogador tenha que pensar para onde ir na dimensão para conseguir cumprir objetivos pessoais seus ou conseguir algum item, serviço ou outra coisa. Segue uma lista de ações padrões possíveis de existirem na zona em que o jogador esta e pode ser executadas:
    - **Iniciar evento**: enfrentando eventos podem te dar recompensas se conseguir resolver com sucesso ou te dar debuffs e penalidades se falhar ao resolve-lo. Mecâncias de TCG acontecem principalmente nesta ação.
    - **Usar cofre**: qualquer tipo de recurso que o jogador não quiser usar durante a aventura podem ser guardados dentro dentro dele. Para facilitar a jogabilidade, os itens guardados em um cofre podem ser acessados de qualquer lugar desde que tenha um cofre na zona também (o cofre esta atrelado ao jogador e, inclusive, o jogador pode acessar os mesmos itens de diferentes dimensões).
    - **Recuperar**: o jogador recebe 3 pontos de vida por padrão e escolhe entre:  
      - Comprar cartas do deck de atributos até ter sete cartas na mão.
      - Reembaralhar sua mão no deck de atributos. 
      - Reembaralhar as cartas da pilha de descarte de atributos no deck de atributos.
    - **Pegar/Continuar/Finalizar missão X**: Em algumas zonas, você pode aceitar fazer missões para conseguir recompensas. Algumas missões envolvem recolher itens, falar com algum NPC, etc. Um jogador só pode completar a mesma missão uma vez. Uma vez a missão completada, ela não pode ser repetida por aquele jogador. Caso você chegue em uma zona que tem uma parte da missão que você tem, você interage para continuar com a missão ou finalizá-la. Dessa forma, você ganha a recompensa daquela missão.
    - **Preparar**: Mexer na build do seu deck de atributos (usando apenas as cartas presentes na pasta de TCG do jogador), trocar itens de equipamento com os que estão no inventário e usar recursos.
    - **Pegar/Continuar/Finalizar objetivo X**: Somente presente no modo desbravadores. Seria uma missão. Ao cumpri-la, o jogador recebe pontos de objetivo de acordo com a carta de objetivo. Esta ação não consome pontos de ação.
    - **Negociar**: Jogadores na mesma zona podem trocar itens que estão em seus respectivos inventários. Esta ação na gasta pontos de ação de nenhum dos jogadores envolvido na negociação.
    - **Iniciar raide**: algumas zonas possuem uma ou mais raides (dungeons ou instâncias, use o termo que achar melhor). Ao iniciar uma raide, o jogador não pode executar mais nenhuma ação. As raides podem ser feitas em grupo ou solo. Para fazer uma raide em grupo, um jogador gasta seu ponto de ação para iniciar a raide e, se tiver mais jogadores naquela mesma zona, eles podem querer ou não se juntarem a raide.
    - **Ir no Ferreiro**: refinar, encantar, criar e consertar equipamentos.
    - **Ir ao Mercado**: compra e venda de itens, cartas e boosters.    
    - **Salvar ponto de Respawn**: o jogador salva seu ponto de respawn na zona em que esta. Quando for nocauteado em combate, ele vai ser teletransportado para a zona em que salvou seu ponto de respawn.
- As zonas podem possuir nenhum, um ou vários efeitos. Por exemplo, na zona X, a classe mago tem mais dano em combate; na zona Y, os jogadores que forem nocauteados em um evento ou combate, perdem todas suas moedas de ouro. Na zona Z, equipamentos do tipo armadura tem seu efeitos anulados, etc.
- As zonas possuem seus repectivos decks separados por tipo da zona. Os decks são de eventos daquela zona, deck de recompensas daquela zona e deck de itens possíveis de encontrar naquela zona. Zonas diferentes podem possuir a mesma carta no deck de eventos, recompensas e itens.

### Classes e especialização
Existe uma trilha de progressão de classe no jogo. Existem a classe primária (classe que o jogador escolhe no começo do jogo), especialização (uma sub classe dentro das escolhas possíveis da classe primária) e multi-classe (ter mais de uma classe primária). Classes primárias travam seu deck de atributos com uma quantidade e/ou combinação de um ou mais atributos específicos para serem daquela classe. Especializações dão um ou mais efeitos e também você trava seu deck de atributos com uma quantidade e/ou combinação de um ou mais atributos específicos. Classes que existem no jogo (lembrando que em outras dimensões podem ter classes exclusivas):

- Classe primária: **Guerreiro** - **Atributos essenciais:** Força, Resistência.
  - **Cavaleiro** => Defesa, armaduras e disciplina.
    - Atributos adicionais: Sabedoria (disciplina e percepção tática).
    - Reforço: Resistência (capacidade defensiva e sobrevivência).
  - **Bárbaro** => Força bruta e fúria.
    - Atributos adicionais: Espírito (controle e manifestação da fúria).
    - Reforço: Força e Resistência (potência física e durabilidade).
  - **Espadachim** => Técnica e precisão com espadas.
    - Atributos adicionais: Destreza (precisão, velocidade e coordenação).
    - Reforço: Força (potência dos golpes).
  - **Gladiador** => Combate agressivo e resistência.
    - Atributos adicionais: Carisma (presença e intimidação).
    - Reforço: Força e Resistência (agressividade e capacidade de suportar danos).
- Classe primária: **Mago** - **Atributos essenciais:** Inteligência, Espírito.
  - **Necromante** => Manipulação da morte e dos mortos-vivos.
    - Atributos adicionais: Sanidade (contato com forças perturbadoras e conhecimento sobre a morte).
    - Reforço: Inteligência e Espírito (domínio e manipulação de energias sobrenaturais).
  - **Ilusionista** => Ilusões e manipulação da percepção.
    - Atributos adicionais: Carisma (manipulação da percepção e influência sobre outras pessoas).
    - Reforço: Inteligência (complexidade e precisão das ilusões).
  - **Invocador** => Conjuração de criaturas e entidades.
    - Atributos adicionais: Sabedoria (compreensão e percepção de entidades).
    - Reforço: Inteligência e Espírito (complexidade das invocações e controle das entidades).
  - **Elementalista** => Manipulação dos elementos.
    - Atributos adicionais: Sabedoria (compreensão das forças naturais).
    - Reforço: Inteligência e Espírito (controle e intensidade das manifestações elementais).
- Classe primária: **Ladino** - **Atributos essenciais:** Destreza.
  - **Ladrão** => Furtividade, furtos e arrombamentos.
    - Atributos adicionais: Inteligência (mecanismos, fechaduras e armadilhas).
    - Reforço: Destreza (agilidade e precisão).
  - **Assassino** => Eliminação precisa de alvos.
    - Atributos adicionais: Inteligência (planejamento e identificação de vulnerabilidades).
    - Reforço: Destreza e Sorte (precisão, oportunidade e execução).
  - **Espião** => Disfarces, espionagem e coleta de informações.
    - Atributos adicionais: Carisma (persuasão, disfarces e interação social).
    - Reforço: Destreza (furtividade e movimentação).
  - **Trapaceiro** => Enganação e artimanhas.
    - Atributos adicionais: Carisma (persuasão e manipulação).
    - Reforço: Destreza e Sorte (improvisação e execução de artimanhas).
- Classe primária: **Clérigo** - **Atributos essenciais:** Sabedoria, Espírito.
  - **Sacerdote** => Cura, bênçãos e suporte divino.
    - Atributos adicionais: Carisma (liderança espiritual e inspiração).
    - Reforço: Sabedoria e Espírito (poderes divinos e capacidade de cura).
  - **Exorcista** => Combate a espíritos e entidades malignas.
    - Atributos adicionais: Sanidade (resistência psicológica diante de entidades perturbadoras).
    - Reforço: Espírito (resistência e enfrentamento de forças sobrenaturais).
  - **Inquisidor** => Investigação, julgamento e combate a hereges.
    - Atributos adicionais: Inteligência (investigação e raciocínio).
    - Reforço: Sabedoria e Espírito (discernimento e convicção).
  - **Oráculo** => Profecias, visões e conhecimento divino.
    - Atributos adicionais: Sanidade (capacidade de suportar visões perturbadoras).
    - Reforço: Sabedoria e Espírito (intuição e conexão espiritual).
- Classe primária: **Patrulheiro** - **Atributos essenciais:** Destreza, Sabedoria.
  - **Caçador** => Rastreamento e caça de criaturas.
    - Atributos adicionais: Resistência (perseguições prolongadas e sobrevivência).
    - Reforço: Destreza e Sabedoria (precisão e identificação de alvos).
  - **Arqueiro** => Maestria com arcos e armas de longo alcance.
    - Atributos adicionais: Força (potência dos disparos).
    - Reforço: Destreza (precisão e coordenação).
  - **Explorador** => Sobrevivência e exploração de territórios.
    - Atributos adicionais: Resistência (esforço físico e adaptação a ambientes hostis).
    - Reforço: Sabedoria (percepção e orientação).
  - **Rastreador** => Identificação e perseguição de rastros.
    - Atributos adicionais: Inteligência (interpretação de evidências e identificação de padrões).
    - Reforço: Sabedoria e Destreza (percepção e movimentação).
- Classe primária: **Druida** - **Atributos essenciais:** Sabedoria, Espírito.
  - **Metamorfo** => Transformação em animais e criaturas.
    - Atributos adicionais: Resistência (adaptação física e capacidade de suportar transformações).
    - Reforço: Espírito (controle das transformações).
  - **Guardião Natural** => Proteção da natureza.
    - Atributos adicionais: Resistência (proteção e preservação de ambientes naturais).
    - Reforço: Sabedoria e Espírito (conexão e domínio das forças naturais).
  - **Xamã** => Comunicação com espíritos e ancestrais.
    - Atributos adicionais: Sanidade (capacidade de suportar contatos sobrenaturais).
    - Reforço: Sabedoria e Espírito (percepção e conexão espiritual).
  - **Naturalista** => Conhecimento da fauna, flora e ecossistemas.
    - Atributos adicionais: Inteligência (conhecimento científico e identificação de espécies).
    - Reforço: Sabedoria (percepção e compreensão da natureza).
- Classe primária: **Monge** - **Atributos essenciais:** Destreza, Espírito.
  - **Mestre Marcial** => Maestria em artes marciais. - Atributos adicionais: Força (potência dos golpes). - Reforço: Destreza e Espírito (precisão e controle corporal).
    **Asceta** => Disciplina física e espiritual. - Atributos adicionais: Resistência (privação, esforço e tolerância física). - Reforço: Espírito (autocontrole e disciplina).
    **Mestre das Sombras** => Técnicas furtivas e movimentos ocultos. - Atributos adicionais: Sorte (oportunidades e circunstâncias favoráveis). - Reforço: Destreza (agilidade e furtividade).
    **Punho Elemental** => Artes marciais combinadas com energia elemental. - Atributos adicionais: Sabedoria (compreensão e percepção das forças elementais). - Reforço: Espírito e Destreza (canalização de energia e precisão dos movimentos).
- Classe primária: **Bardo** - **Atributos essenciais:** Carisma.
  - **Menestrel** => Música e entretenimento.
    - Atributos adicionais: Destreza (execução e coordenação musical).
    - Reforço: Carisma (expressividade e capacidade de entreter).
  - **Trovador** => Narrativas, inspiração e tradição oral.
    - Atributos adicionais: Inteligência (conhecimento histórico e cultural).
    - Reforço: Carisma (comunicação e capacidade de inspirar).
  - **Diplomata** => Persuasão, negociação e influência.
    - Atributos adicionais: Inteligência (argumentação e estratégia).
    - Reforço: Carisma (persuasão e influência social).
  - **Artista** => Expressão artística e criatividade.
    - Atributos adicionais: Inteligência (criatividade e elaboração artística).
    - Reforço: Carisma (expressividade e impacto artístico).
- Classe primária: **Alquimista** - **Atributos essenciais:** Inteligência.
  - **Transmutador** => Transformação da matéria.
    - Atributos adicionais: Espírito (manipulação de energias necessárias à transmutação).
    - Reforço: Inteligência (conhecimento e precisão dos processos).
  - **Toxicologista** => Venenos, toxinas e substâncias.
    - Atributos adicionais: Destreza (manipulação precisa de substâncias).
    - Reforço: Inteligência (conhecimento químico e preparação de compostos).
  - **Bombardeiro** => Explosivos e dispositivos químicos.
    - Atributos adicionais: Destreza (manuseio e precisão no lançamento).
    - Reforço: Inteligência (preparação e conhecimento dos compostos).
  - **Farmacêutico** => Poções, remédios e preparados.
    - Atributos adicionais: Sabedoria (identificação de propriedades e aplicação adequada de preparados).
    - Reforço: Inteligência (conhecimento e elaboração de fórmulas).
- Classe primária: **Artífice** - **Atributos essenciais:** Inteligência.
  - **Engenhoqueiro** => Mecanismos e dispositivos.
    - Atributos adicionais: Destreza (montagem e manipulação de mecanismos).
    - Reforço: Inteligência (compreensão e desenvolvimento de dispositivos).
  - **Inventor** => Criação de ferramentas e máquinas.
    - Atributos adicionais: Sorte (experimentação e resultados inesperados).
    - Reforço: Inteligência (criatividade e desenvolvimento de invenções).
  - **Construtor** => Construções e estruturas especiais.
    - Atributos adicionais: Força (manipulação de materiais e trabalho físico).
    - Reforço: Inteligência (planejamento e engenharia).
  - **Ferreiro Arcano** => Criação e aprimoramento de equipamentos mágicos.
    - Atributos adicionais: Espírito (manipulação e canalização de energias mágicas).
    - Reforço: Inteligência (conhecimento técnico e mágico).
- Classe primária: **Bruxo** - **Atributos essenciais:** Espírito, Inteligência.
  - **Demonologista** => Pactos com demônios e entidades infernais.
    - Atributos adicionais: Sanidade (exposição a entidades e forças infernais).
    - Reforço: Espírito (controle e manutenção dos pactos).
  - **Ocultista** => Conhecimentos proibidos e rituais.
    - Atributos adicionais: Sanidade (contato com conhecimentos perturbadores).
    - Reforço: Inteligência e Espírito (compreensão e execução de rituais).
  - **Pactário** => Vínculos sobrenaturais e contratos.
    - Atributos adicionais: Carisma (negociação e estabelecimento de contratos).
    - Reforço: Espírito (manutenção e controle dos vínculos).
  - **Maldito** => Maldições, corrupção e debilitamento.
    - Atributos adicionais: Sanidade (contato com forças corruptoras).
    - Reforço: Espírito (manipulação e imposição de maldições).
  - **Abissalista** => Poderes de entidades cósmicas e abissais.
    - Atributos adicionais: Sanidade (exposição a entidades incompreensíveis).
    - Reforço: Espírito e Inteligência (canalização e compreensão de poderes abissais).
- Classe primária: **Feiticeiro** - **Atributos essenciais:** Espírito, Carisma.
  - **Dracônico** => Herança de dragões e poderes dracônicos.
    - Atributos adicionais: Resistência (vigor e tolerância a poderes dracônicos).
    - Reforço: Espírito (manifestação dos poderes herdados).
  - **Elemental** => Afinidade natural com elementos.
    - Atributos adicionais: Sabedoria (compreensão e percepção das forças elementais).
    - Reforço: Espírito (manifestação e controle dos poderes elementais).
  - **Celestial** => Poderes de origem divina ou celestial.
    - Atributos adicionais: Sabedoria (discernimento e compreensão de forças divinas).
    - Reforço: Espírito e Carisma (manifestação e expressão dos poderes celestiais).
  - **Trevoso** => Poderes de origem demoníaca ou infernal.
    - Atributos adicionais: Sanidade (exposição e adaptação a forças sombrias).
    - Reforço: Espírito (controle e manifestação dos poderes infernais).

- Os atributos essenciais representam a identidade mecânica da classe primária.
- Os atributos adicionais complementam as especializações e podem introduzir novas possibilidades de habilidades, utilização de recursos, etc.
- Os reforços representam uma concentração maior nos atributos essenciais da classe.
- É necessário analisar e criar conceitos de quais classes e especializações são mais fáceis de fazer uma certa build específica. Pode ser que certas builds sejam exclusivas de certas classes e especializações.
- É necessario analisar e pensar qual o principal conceito entre classes e especializações. Por exemplo: Um Feiticeiro Trevoso consegue recuperar cartas que estão no limbo; um Guerreiro Espadachim consegue comprar mais cartas do que outras classes e especializações; etc. Um conceito pode ou não ser exclusiva de uma classe ou especialização. Mais de uma classe e especialização podem compartilhar o mesmo conceito.
- Uma especialização não precisa necessariamente possuir atributos adicionais.
- Os atributos não devem funcionar como restrições absolutas. Personagens podem desenvolver capacidades fora de suas especialidades. 
- Como conseguir a especialização da sua classe primária?: TODO Você não pode ter duas especializações iguais ???????????????
- Como ser multi-classe (pegar mais uma classe primária)?: TODO Você não pode ter duas vezes a mesma classe primária. ?????????????


### O que são os eventos?

Eventos precisam ser resolvidos pelos jogadores para conseguir recompensas. Existem alguns tipos de eventos:
- **Aleatórios** ![(referência de imagem protótipo)](images/fluxo_de_eventos.JPG): quando o jogador escolhe a ação de "Iniciar evento", um carta de eventos é comprada do deck de eventos daquele tipo de zona específica e revelada para o jogador resolver. O evento possui um flavor text, título, requisitos de resolução, coisa boa (o que acontece se o jogador resolver o evento) e coisa ruim (o que acontece se o jogador não conseguir resolver o evento). O jogador não é obrigado a resolver o evento. Ele pode simplesmente aceitar a coisa ruim. Nem sempre o evento te da alguma coisa ao resolve-lo com sucesso. As vezes, resolver o evento com sucesso só previne o jogador de receber a coisa ruim. A coisa boa e a coisa ruim ativam efeitos e devem ser ativados por padrão. Para tentar resolver um evento, existe um sistema de resolução. Os requisitos para resolução de eventos envolvem: 
  - Combinação de **atributos específicos** ou **apenas um atributo** específico ou um **atributo genérico**. 
  - **Doar vida**.
  - **Descarte de carta de atributo**.
  - **Abdicar de equipamento**.
  - **Pagar ouro**.
  - **Oferecer recurso do inventário**.
  - **Manipulação de cartas**.
  - Uma combinação de dois ou mais requisitos listados acima.
Ao resolver o evento com sucesso, as cartas requisitos de atributo usadas para resolver o evento vão para uma pilha de descarte de cartas de atributo do jogador. Cartas que não são de atributos usadas para resolver um evento vão para um lixo comum genérico usados por todos os jogadores (chamado de **limbo**). Após a carta de evento ser resolvida ou não pelo jogador, ela vai para a pilha de descarte de cartas de eventos daquela zona específica. 
O evento é dividido em fases: 
- antecipação (antes da carta de evento ser revelada), 
- encontro (o jogador resolve o evento ou não),
- êxito (após o evento ser resolvido com sucesso)
- revés (após o evento não ser resolvido). 
Caso o jogador tenha resolvido com sucesso o evento, ele entra na fase de êxito e recebe os benefícios, buff, itens e/ou recompensas descritas nas carta (ou não, pois resolver com sucesso alguns eventos só previnem o jogador de não receber a coisa ruim). Caso o jogador não tenha resolvido o evento, ele entra na fase de revés e sofre as penalidades descritas na carta. Ao finalizar o evento, após a fase de êxito e revés, imediatamente o jogador compra a mesma quantidade de cartas de atributos jogadas na fase resolução. Exemplo 1: o jogador gastou 4 cartas da mão para resolver um evento e consegue; as cartas 4 cartas de atributos jogadas vão para a pilha de descarte de atributos; a fase de êxito se encerra; o jogador compra 4 cartas do seu deck de atributos. Exemplo 2: o jogador tentou resolver um evento e gastou 2 cartas da mão para tentar resolver; percebe que não vai conseguir e tentar fugir; falha no teste de fuga, então vai ter que sofrer as penalidades; encerra fase de revés; compra 2 cartas do deck de atributos. Exemplo 3: o jogador não quer tentar resolver o evento (gastar cartas na mão por algum motivo); tenta fugir e falha; sofre as penalidades; encerra fase de revés; o jogador não compra cartas do deck de atributo porque nenhuma carta de atributo foi utilizada para resolver o evento. Exemplo 4: o jogador gasta 5 cartas da mão para tentar resolver o evento e percebe que não vai conseguir resolver o evento; faz o teste de fuga e consegue passar; não sofre as penalidades; a fase de encontro se encerra; o jogador não tem direito de comprar cartas de atributo porque ele fugiu com sucesso do evento.
- **Combate**: o jogador enfrentará um inimigo. Ao derrota-lo, o jogador recebe as recompensas devidas descritas na carta do oponente, segue para executar sua próxima ação se tiver ainda pontos de ação. Se o jogador perder no combate (pontos de vida chega a 0), o jogador é nocauteado, toma as penalidades descritas na carta do inimigo (se tiver alguma), o jogador retorna para o ponto de spawn e perde um turno e as ações restantes se tivesse alguma (o jogador não perde um turno caso esteja jogando no modo campanha sozinho). Se um jogador inicia um evento de combate e naquela mesma zona tem outros jogadores, o jogador que iniciou o combate pode recrutar os outros jogadores para ajuda-lo (não há limite de companheiros que podem te ajudar num combate). Porém, caso o evento de combate seja resolvido com sucesso, apenas o jogador que iniciou o combate recebe as recompensas. Os outros jogadores que ajudaram no combate não perdem seus pontos de ação em seus respectivos turnos. No modo desbravadores, quando o jogador que iniciou um evento de combate quiser pedir ajuda para outros jogadores naquela mesma zona, os outros jogadores poderão negociar como dividir a recompensa antes de entrar no combate (os outros jogadores não são obrigados a pedir uma parte da recompensa se não quiserem).

### O que são missões?

Missões podem ser encontradas em zonas. Nem todas as zonas possuem missões. Um jogador não pode repetir a mesma missão (as missões são concluídas e não podem ser cumpridas novamente). Missões não tem obrigatoriedade de execução. Se um jogador pegar uma missão e decidir não cumpri-la para focar em outras coisas, nada acontece. A missão fica em aberto até que o jogador decida cumpri-la. Ao concluir uma missão, o jogador pode receber recompensas.

### O que é uma raide?

Raide seria uma "sequência determinada de eventos que acontecem uma após a outra" e acontecem somente na zona em que foi iniciada. Um jogador pode iniciar uma raide numa zona sozinho ou pode chamar jogadores que estiverem nessa mesma zona para participar junto com eles (os jogadores que resolveram participar junto não tem seus pontos de ação consumido nem turnos pulados). Quando um jogador iniciar uma raide (todos os pontos de ação do jogador que iniciou a raide são consumidos). Os eventos que acontecem dentro de uma raide são específicas e não se misturam com o deck de eventos da zona. Os eventos da raide contam uma história sobre aquela raide (por isso é uma sequência de eventos determinados e não se misturam com o deck de eventos daquela zona). Esses eventos que acontecem dentro da raide, como pertencem a uma história, é necessário pegar o manual (guia do jogo) para encontrar a história respectiva (vai existir um livro físico com todas as raides já que são muitas coisas que acontecem numa raide). Ao concluir uma raide, ela pode dar uma ou mais recompensas. Raides são eventos muito difíceis e extensos. Ou seja, a raide pode dar recompensas muito boas e fortes. Um aspecto importante de raides é que eles lembram um um jogo-livro: uma modalidade de livro interativo em que o leitor não apenas acompanha uma história, mas também participa ativamente dela, tomando decisões que influenciam o desenvolvimento da narrativa. A história não precisa ser linear. Dependendo das decisões do jogador, ele pode explorar caminhos diferentes, encontrar personagens distintos, enfrentar desafios, adquirir itens, desenvolver habilidades e até chegar a finais completamente diferentes. É possível repetir a mesma raide várias vezes para conseguir diferentes finais, explorar diversos caminhos diferentes dentro daquela raid para conseguir encontrar recompensas diferentes. Porém, para repetir a mesma raid de novo é preciso esperar o cooldown da raid descrito na carta dela (por exemplo, esperar 3 turnos; ter um recurso X no inventário; etc).

### Como funciona o evento de combate (enfretamento contra inimigos ou outros jogadores ou em conjunto com outros jogadores)?

Quando um evento de combate é revelado, um novo sistema de combate começa.

- O jogador não tem limite de cartas na mão por padrão. Alguns efeitos podem causar o limite de cartas na mão do jogador. Cartas em excesso vão para a pilha de descarte do deck de atributos daquele jogador.
- O deck de atributos do jogador deve conter exatas 60 cartas (esse número é especulativo e é necessário uma analise sua para saber qual a melhor quantidade).
- Quando um deck de eventos de uma zona se esgota, todo a pilha de descarte de eventos daquela zona em específico é reembaralhada. Uma zona tem pode ter por volta de 30 cartas de eventos aleatórios (esse número é especulativo e é necessário uma analise sua para saber qual a melhor quantidade).

### O que é o teste de fuga?

O teste de fuga acontece durante um evento aleatório ou um evento de combate. O jogador que quer fugir lança um D20. Por padrão, para fugir de um evento, tem que tirar um número maior que 10. Alguns eventos e combates podem ter um valor mínimo de fuga específicos. Efeitos do jogo podem causar com que o dado lançado pelo jogador ganhe ou perca valor. O mesmo vale para o valor mínimo de fuga do evento. Não é possível fugir no modo X1 do jogo, mas, o jogador pode só desistir do combate.

### O que são recursos?

São equipamentos e itens (mais recursos podem ser adicionados em futuras atualizações). Eles possuem efeitos e podem ajudar o jogador.
- **Equipamentos**: são recursos que o jogador usa a todo momento. As cartas de equipamento ficam posicionados na frente do jogador para mostrar que ele esta com eles equipados. Equipamentos não vão para a mão do jogador. Equipamentos podem ir no inventário. O jogador pode ter alguns equipamentos no inventário e trocar pelos o que ele esta usando por motivos de estratégia, efeitos, etc. Os equipamentos são divididos nas categorias cabeça, tronco, inferior, calçado, capa, arma e escudo. O jogador pode usar 1 equipamento de cada categoria. Alguns equipamentos de cada categoria são:
    - **Cabeça** => Capacetes, tiaras mágicas, capuzes, coroas, etc.
    - **Tronco** => Peitorais de metal, cotas de malha, túnicas de tecido, corpetes de couro, etc.
    - **Inferior** => Calças, grevas de armadura, saias de combate, etc.
    - **Calçado** => Botas de ferro, sapatos leves de couro, sandálias encantadas, cintos, pochetes, etc.
    - **Capa** => Capa, Manto, etc.
    - **Armas** (algumas armas não permitem o jogador usar escudo. Nessa cenário, o jogador fica com um slot a menos.) => Adagas, punhais, facas, Espadas curtas, espadas longas, sabres, cimitarras, katanas, Clavas, maças, martelos de guerra, manguais, porretes, Lanças, alabardas, tridentes, foices, espadas de duas mãos (montantes), machados de batalha grandes , martelos pesados, Manoplas reforçadas, garras, soco-inglês, Arcos, Bestas (Crossbows), Facas de arremesso, machadinhas, azagaias, shurikens, dardos, Pistolas, mosquetes, rifles, bacamartes, Cajados (Staves), Varinhas (Wands), Tomos, Grimórios, Cruzes, amuletos, talismãs, orbes mágicos, etc. 
    - **Escudo** => Escudo Leve de Madeira ou Metal, Pequeno; Escudo Pesado; Escudos de Corpo / Pavês; Escudos Especiais (Ex: Escudo Ornamental, Escudo Concha ou Escudo Táurico); etc.
- **Itens** (podem existir mais categorias em futuras atualizações e ter categorias de itens exclusivos por dimensão e/ou zona):
    - **Consumíveis** (recuperar vida, remover status negativos, obter status positivos e ganhar efeitos) => Poções,Elixires, Alimentos, Bebidas, Pergaminhos, Bombas, Remédios, etc.
    - Materiais (Materiais utilizados para fabricação, aprimoramento, ou outras atividades) => Minérios, Gemas, Ervas, Tecidos, Couros, Componentes, Peças, etc.
    - **Relíquias** (Objetos especiais, geralmente raros, mágicos ou dotados de propriedades extraordinárias) => Artefatos, Amuletos, Talismãs, Objetos amaldiçoados, Objetos lendários, etc.
    - **Ferramentas** (Objetos utilizados para executar atividades específicas, interagir com o ambiente ou superar obstáculos) => Ferramentas de mineração, Ferramentas de coleta, Instrumentos, Utensílios, Equipamentos de exploração, Dispositivos.
    - **Tesouros** (Objetos cujo principal propósito é representar valor econômico ou servir como recompensa) => Moedas, Joias, Pedras preciosas, Objetos valiosos, Antiguidades, etc.
    - **Documentos** (Objetos que carregam informações, registros ou conhecimentos) => Mapas, Livros, Cartas, Manuscritos, Registros, Contratos, etc.
    - **Objetos especiais** (Itens cuja finalidade está relacionada a eventos, progressão ou situações específicas do jogo) => pode ser qualquer coisa.
Sobre os equipamentos e armas, eles possuem habilidades. Habilidades podem causar dano no oponente ou ativar algum efeito. Diferentes armas de diferentes categorias podem ter mesmas habilidades. O mesmo vale para equipamentos. 

Descrever uma pouco mais sobre habilidades?????????

### Mercado (compra de boosters, cartas, equipamentos, itens, etc)

Durante uma aventura em uma dimensão, é possível encontrar mercados em certas zonas. O jogador pode vender e comprar recursos. Mercados em zonas diferentes podem oferecer recursos iguais e recursos exclusivos, ou seja, o jogador precisa "explorar" diferentes mercados em diferentes zona para conseguir encontrar recursos específicos para comprar. Caso o jogador queira vender um recurso, todos os mercados vão oferecer a mesma quantia de moedas de ouro (preço tabelado). Não existe um mercado que pague mais pelo mesmo recurso. Porém, existem efeitos, habilidades e até recursos que o jogador tiver podem fazer com que o mercado oferça mais moeda de ouro pelos recursos sendo vendidos. 

Por padrão, cada dimensão representa uma coleção nova de cartas (atributos, recursos, zonas, etc). Todas as cartas presentes em uma coleção nova podem ser adquiridas dentro da dimensão em que ela foi lançada. Possívelmente, pode haver um reprint de uma coleção já lançada em uma dimensão anterior para uma nova dimensão completamente diferente. Por padrão, existe 1 coleção ativa por dimensão. Mas, pode ser que uma coleção extenda seu período ativo por até três dimensões seguintes por exemplo. 

As coleções tem um comportamento parecido com o sistema de lançamento de coleções de TCG (Yugioh, MTG, Pokemon, etc). As cartas que vem dentro do booster (para o jogador) são cartas novas de recursos e atributos. Para o jogo (dimensão), novas zonas são liberadas, com possíveis ações exclusivas, eventos novos, raides novas, etc. O jogador pode comprar boosters das coleções vigentes dentro daquela dimensão. O preço de compra de booster é sempre tabelado independente do mercado dentro da dimensão. Mas, existem efeitos, buffs, habilidades, etc que podem fazer com que o mercado ofereça um desconto para o jogador. É possível comprar cartas "single" (uma cópia de uma carta específica). "Singles" são cartas de recurso, itens, equipamentos, etc que o jogador leva no seu inventário, pode equipar (singles de equipamento), deck de atributos (singles de atributo), etc. Singles são negociados no mercado. Porém, é aleatório em qual mercado ele vai estar disponível. Exemplo: um single da carta X tem 4 cópias disponíveis em um mercado numa zona A; caso todas as cópias dessa carta sejam vendidas nesse mercado, ele não vai estar mais disponível ali; em um outro mercado em uma zona B, "surgem" mais 2 cópias da carta X para serem vendidas; quando todas os mercados em todas as zonas daquela dimensão já tiverem vendido no mínimo 1 single da carta X, nenhum mercado mais pode vender esse single. Isso faz com que o jogadores explorem todos os mercado possíveis em toda a dimensão. Independente de quantos jogadores estejam jogando a partida (solo ou 2 jogadores ou mais), o sistema de mercado é "vivo". Óbviamente, nem todas as cartas das coleções vigentes vão estar disponível como singles devido a quantidade de cartas que podem circular e, provavelmente, nem daria tempo de jogo para circular todas as cartas. No mercado, sempre estará disponível ilimitadas cópias de boosters das coleções vigentes. Nem todo mercado vende single. Os singles ficam em uma vitrine dentro da loja de 4 slots por padrão. Quando uma carta sai da vitrine, outra carta aleatória das coleções vigentes entra no lugar. Mais de um mercado pode vender a mesma single de outros mercados. O mercado de single tem uma "lógica" própria de preços. Um single em um mercado pode estar mais caro ou mais barato em outros mercados. Cartas que oferecem mais vantagens, benefícios, efeitos, buffs, dano, defesa são mais caras. É necessário implementar uma lógica para calcular os preços de single. Em um cenário que todos as cartas de todas as coleções vigentes circularam, os singles começam a se repetir novamente. Independente da quantidade de jogadores jogando, é necessário implementar uma lógica de sistema de decaimento de singles nos mercados (como se houvessem NPCs comprando os singles). Dessa forma, o jogador ou jogadores precisam ficar atento aos mercados para não perder uma carta que precisam para seus decks. Além de venda de coisas e compra de cartas, os mercados vendem itens, recursos, equipamentos, etc para os jogadores. Não existe um limite de venda de um item, recurso, equipamento, etc específico. Algumas coisas como munição, poções, etc são comuns em todos os mercados pois são coisas essenciais.

### Ferreiro (mecânica de refino, reparação de armas quebradas e criação de equipamentos)


???


### Deck building
Dentro do cofre, o jogador pode fazer todo o manuseio de deck building dele e de todas as cartas que ele já conseguiu de recursos e atributos. A ação de preparar que o jogador usa dentro de uma zona atua apenas sobre os itens que o jogador tem no seu inventário. O cofre guarda todas as coisas do jogador (recursos, itens, cartas de atributos, boosters, etc). No cofre, o jogador pode gerenciar seus decks, montar builds diferentes, colocar itens, cartas e recursos do inventário para dentro do cofre e vice-versa. O jogador tem um limite padrão de 10 slots de decks dentro do cofre (o jogador pode ter diversas deck builds diferentes). Cartas, itens, recursos, etc repetidos (mais de uma cópia/unidade) se empilham dentro do cofre e não tem limite por cada um. Porém, dentro do cofre cada carta, item, recursos, etc diferentes ocupam slots diferentes dentro do cofre. O jogador tem, por padrão, 30 slots dentro do cofre. Decks ocupam slots exclusivos dentro do cofre. Slots de decks são diferentes de slots de cartas, boosters, recursos, itens, etc.

Lembrando que o deck de atributos deve conter exatas 60 cartas.

Em zonas que não é possível usar a ação de cofre, o jogador sempre poderá usar a ação de **Preparar** descrita em uma sessão anterior. Todo jogador leva consigo uma pasta de TCG onde pode guardar até 20 unidades de cartas no total usadas para mexer na build do deck sem precisar mexer no cofre. A pasta de TCG não ocupa slot do inventário do jogador (o slot da pasta de TCG é exclusiva).


### Como funciona o inventário?

O inventário do jogador é como se fosse uma "segunda mão". Dependendo da classe que o jogador escolhe, a quantidade de slots disponíveis dentro do inventário muda. Classes que possuem mais força, por exemplo, vão ter mais slots de inventário do que classes que usam menos força. Por padrão, a maioria das classes possuem 10 slots no inventário. Durante eventos, raides, etc, o jogador pode usar coisas do inventário para ajuda-lo, desde que a coisa comportada no slot permita isso. Existem buffs, efeitos, itens, equipamentos, etc que permitem o jogador ter mais slots de inventário. Da mesma forma que, podem existir coisas que diminua o tamanho do inventário.


### Como funciona a negociação?

A negociação acontece entre dois jogadores numa mesma zona e não consome ponto de ação de nenhum jogador. Não há limite de coisas sendo negociadas entre os lados. Algumas zonas possuem efeito de não permitir negociação. Os jogadores envolvidos na negociação tem que concordar em iniciar uma negociação.


### O que é o sistema de modificadores?

Modificadores são os pontos que o jogador tem que afetam cálculos durante toda a partida e interações. Alguns modificadores são (podem haver mais modificadores no futuro):

- **Ataque**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: a força dos equipamentos que o jogador estiver usando, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo é o ataque que será desferido no oponente.
- **Defesa**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: a defesa dos equipamentos que o jogador estiver usando, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo é a defesa que o jogador tem para resistir ao ataque do inimigo. Lembrando que se o valor de ataque do oponente for maior que a defesa do jogador, o jogador toma o dano excedente do ataque. Ataque do inimigo igual a defesa do jogador significa que o jogador não leva nenhum dano.
- **Precisão**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: equipamentos que estiver usando que aumentam a precisão do jogador, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo diz se o jogador ou o inimigo acertaram o ataque (caso sim, o valor do modificador de ataque pode ser usado).
- **Esquiva**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: equipamentos que estiver usando que aumentam a esquiva do jogador, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo diz se o jogador ou o inimigo conseguiu escapar, desviar do ataque do adversário (caso sim, o jogador ou inimigo não sofre qualquer dano).
- **Celeridade**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Esse atributo define a ordem do jogador dentro de um combate. Quanto mais alto a celeridade, mais chances de ser um dos primeiros atacar. Equipamentos, efeitos, outros fatores como cartas específicas na mão, etc, e principalmente o modificador de vigor, impactam no cálculo de celeridade. É necessário implementar uma lógica para o cálculo. 
- **Perfuração**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: equipamentos que estiver usando que aumentam a perfuração, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo diz o quanto da defesa do oponente/jogador é ignorado na hora de saber o quanto de dano ele vai receber.
- **Reflexão**: Usado principalmente em combates, porém, em alguns eventos aleatórios pode ser usado como requisito e em outros ocasiões também. Um cálculo é feito com esse modificador junto com: equipamentos que estiver usando que aumentam a reflexão, efeitos que ele possa estar sob efeito, outros fatores como cartas de atributo específicas na mão, etc, e principalmente o modificador de vigor. É necessário implementar uma lógica para o cálculo. O resultado do cálculo de reflexão diz o quanto do valor de ataque do atacante a um defensor é devolvido para o atacante (o valor do dano devolvido do ataque é subtraído do dano ao defensor).
- **Vigor** (O MAIS IMPORTANTE): Usado em vários momentos do jogo. Este modificador impacta em vários cálculos do jogo. Praticamente tudo no jogo concede um pouco de vigor para o jogador. Esse modificador é altamente dinâmico. Da mesma forma que muitas coisas concedem pontos de vigor, muitas coisas também removem pontos de vigor. Este modificador impacta TODOS os outros modificadores como maior influenciador do resultado final dos cálculos em que os modificadores estão envolvidos.

Obs: Recursos, efeitos, habilidades, etc podem tanto aumentar quanto abaixar um ou mais modificadores.


### Sistema de combate (raide ou evento de combate): 

Cenário em que 1 jogador enfrenta um inimigo. A ordem de quem vai atacar primeiro é definido pelo modificador de celeridade e é decrescente (a ordem vai de quem tem mais celeridade até que tem menos). No empate de celeridade, o inimigo tem prioridade de ataque por padrão (efeitos, habilidade, itens, etc podem alterar isso). O combate funciona em turnos onde as partes se revezam um por vez para atacar. A última coisa que é feita no turno das partes é atacar. O jogador pode ativar vários efeitos, habilidades, etc antes de atacar. Ao atacar, os cálculos de dano devidos são feitos e a vez passa para o oponente. O ataque do jogador vai na defesa do oponente. Ataque do jogador igual a defesa do oponente significa que o oponente não toma dano. Ataque do jogador maior que a defesa do oponente significa que o oponente tem sua vida reduzida igual a diferença entre ataque do jogador e defesa do oponente. Existem efeitos, habilidades, itens, etc que permitem o jogador ataque mais de uma vez desde que as condições dos itens, equipamentos, habilidades, etc sejam cumpridas e não exista restrições de efeitos soberanos sobre o combate. Efeitos soberanos seriam efeitos passivos que regem em cima daquele evento, zona, dimensão, etc. Por exemplo, um zona pode ter o efeito de "jogadores não podem atacar mais de três vezes seguidas". Se o jogador entrar em combate nessa zona, não poderá atacar quatro vezes ou mais. Olhando para a vez do oponente, ele também vai seguir a mesma lógica de poder ativar alguns efeitos e habilidades até atacar. Quem tiver a vida reduzida a zero primeiro perde. No caso do jogador, ao morrer em combate (nocauteado), ele é teletransportado para o ponto de respawn dele e tomas as penalidades descritas na carta do oponente. No caso de vitória do jogador, ele recebe as recompensas descritas na carta do oponente. Não é permitido trocar equipamentos durante a batalha com equipamentos do seu inventário por padrão, mas efeitos, habilidades ou outros fatores podem alterar essa regra. Caso o jogador perceber que não vai conseguir ganhar o combate, ele pode tentar fugir executando o teste de fuga. Ao conseguir fugir com sucesso, a batalha se encerra imediatamente. Caso falhe na fuga, a batalha se encerra imediatamente o jogador toma as penalidades descritas na carta do oponente. Importante dizer que se o jogador ou inimigo esquivar de um ataque, aquilo conta como "miss" (não conseguiu acertar o adversário) e o turno passa pro próximo atacante.

Cenário em que 1 jogador enfrenta 2 ou mais inimigos: A lógica segue igual ao do combate 1 jogador contra 1 inimigo descrito anteriormente com a diferença que, na vez do jogador, ele escolhe qual inimigo atacar. As recompensas descritas nas cartas dos inimigos só são entregues ao jogador depois que ele derrotar todos os inimigos. 

Cenário 2 ou mais jogadores enfrentando um ou mais inimigos: A lógica segue igual ao do combate 1 jogador contra 1 inimigo descrito anteriormente. Porém, há alguns pontos a se levar em consideração. Caso um dos jogadores for nocauteado em combate, ele não é teletransportado para seu ponto de respawn pois outros jogadores podem usar itens, efeitos, habilidades, etc para ressucitá-lo. Um jogador nocauteado em combate, fica sem jogar no turno que seria sua vez (ele fica apenas assistindo). Se ao final da batalha tiver algum jogador nocauteado, aí sim ele é teletransportado para seu devido ponto de respawn, mas não toma as penalidades dos inimigos porque eles foram derrotados. Não é permitido negociar coisas entre jogadores durante um combate e nada pode alterar essa regra. No modo campanha, para fugir de um combate, um por vez, cada jogador tenta fazer o teste de fuga. Simulando um exemplo:
  1 - O combate envolve jogador A, jogador B, jogador C, oponente A, oponente B, oponente C e oponente D.
  2 - Por ordem de celeridade, a ordem ficou jogador A, oponente C, oponente A, jogador C, jogador B, oponente D e oponente B.
  3 - Os jogadores percebem que não vão conseguir derrotar os oponentes e então vão tentar fugir.
  4 - O jogador A tenta fugir mas falha no processo e então é nocauteado. Oponente C ataca um dos jogadores. Oponente A ataca um dos jogadores. Jogador C tenta fugir mas falha e então é nocauteado. Jogador B tenta fazer o teste de fuga e consegue (não joga mais e não esta mais envolvido com este combate). 
  5 - Jogador A e C foram nocauteados ao tentar fugir. Logo, sofrem as penalidades dos inimigos. Jogador B conseguiu fugir com sucesso e não sofre as penalidades dos oponentes (mas pode sofrer penalidades devidos a outros fatores como efeitos, etc).
Ao final do combate, os jogadores que foram nocauteados ao final de uma batalha derrotada sofrem todas as penalidades dos oponentes. Se todos os jogadores conseguirem fugir, ninguém sofre penalidades do oponentes. Se alguns jogadores foram nocauteados e outros jogadores conseguirem fugir, isso conta como uma batalha perdida e os jogadores nocauteados sofrem as penalidades dos oponentes. Só conta como fuga com sucesso se todos os jogadores conseguiram fugir vivos (ninguém sofre penalidades dos oponentes). Lembrando que apenas o jogador que iniciou o evento de combate tem o ponto de ação consumido. O jogador que iniciou o evento de combate é o único que recebe as recompensas. Se o jogador que iniciou o combate fugir ou for nocauteado e não for ressuscitado até o final de um combate, se os outros jogadores conseguiram derrotar os oponentes, toda a recompensa daquele combate é compartilhado entre os jogadores sobreviventes (em ordem de maior celeridade até menor celeridade, eles escolhem as recompensas que querem receber). É possível notar que existe um dinâmica dentro do evento de combate: alguns jogadores podem fugir por conta própria, mas, outros podem querer ficar e ganhar o combate para ficar com as recompensas.

Cenário PVP: Além dos modos de jogo campanha e desbravadores, existe um modo que é simplesmente um X1 entre dois jogadores ou mais. Podem ser configurados em diversas combinações possíveis (1 jogador contra 3 jogadores, 4 jogadores contra 3 jogadores, etc). Esse modo não impacta na progressão dos modos campanha e desbravadores. O modo PVP é um modo sem compromissos e para se divertir, onde todos os jogadores usam ele para testar seus decks de forma descompromissada. No modo X1, não se ganha recompensas ou vantagens que são portadas para os outros modos. No modo X1, os jogadores tem 10 slots de decks diferentes para montar builds e testar combos. Nesse modo X1, todos os jogadores tem acesso a todas as cartas já lançadas dentro do jogo (cartas de coleções que estão vigente no modo campanha/desbravador e cartas de coleções que não estão mais disponíveis no modo campanha/desbravador). 

Cenário Raide: Em raides, os jogadores podem encontrar batalhas. Não é possível fugir de batalhas dentro de uma raide. Entende-se que, o confronto com os oponentes fazem parte da história daquela raide. Ao ser nocauteado ou quando todos os jogadores forem nocauteados, a raide é encerrada e todos os jogadores tomam as penalidades descritas naquela etapa da raide. 

É necessário implementar uma IA para controlar as ações dos inimigos dentro do combate (perceber que o usuário não tem uma defesa/ataque bom, melhores estratégias, ajudar/ressucitar um aliado, etc).

### O que são os efeitos?

Efeitos é uma das partes mais dinâmicas do jogo. Eles podem afetar tudo positivamente ou negativamente. Praticamente tudo pode ter um efeito dentro do jogo. O efeito é estruturada em Gatilho, Custo, Ativação e Duração:

- **Gatilho** (opcional): A condição de ativação (condições apropriadas para o efeito ativar). Nem todos os efeitos possuem gatilho. Os gatilhos podem ser dividos em algumas categorias (podem haver mais no futuro):
  - **De zona**. Exemplos. Ao entrar nessa zona; Ao entrar em um zona montanhosa; Ao entrar em uma zona campestre, fluvial ou religiosa; Ao entrar em qualquer zona que não seja vulcânica ou subterrânea; Ao entrar em uma zona pantanosa, locais de vila, local de castelos ou locais de pradarias; Ao entrar em uma zona desértica que não seja um local de oasis; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De ação de zona**: Exemplos: Ao não realizar nenhuma ação de evento em uma zona; Ao passar por mais de duas zonas diferentes sem realizar nenhuma ação de evento; Ao realizar Ao descansar três vezes seguidas; Ao não descansar nenhuma vez ao chegar a uma zona; Enquanto você não descansar mais que 1 vez; Ao ficar sem descansar depois de passar por mais de quatro zonas diferentes; Ao finalizar uma missão em uma zona; Ao finalizar todas as missões de uma zona; Ao finalizar mais de três missões em uma zona; Ao finalizar uma missão em três zonas diferentes; Ao finalizar uma raide em uma zona; Ao finalizar uma raide; Ao finalizar 5 raides diferentes;  Ao finalizar a mesma raide 5 vezes; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De evento aleatório**. Exemplos: Na fase de encontro; Na fase de êxito ou revés; Em qualquer fase que não seja de antecipação; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De evento de combate**. Exemplos: Ao derrotar um oponente; Ao derrotar três oponentes diferentes; Ao tenta fugir; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De habilidade**. Exemplo: Ao usar uma habilidade de um equipamento calçado; Ao usar a habilidade de um equipamento de cabeça ou inferior; Ao usar a habilidade de um equipamento que não seja de tronco; Ao usar uma habilidade qualquer do equipamento específico "NOME DO EQUIPAMENTO"; Ao usar uma habilidade qualquer de uma arma do tipo shuriken, espada de duas mãos ou adaga; Ao usar uma habilidade de capa ou manopla; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De recurso**. Exemplo: Ao ativar um efeito de um recurso; Ao ativar quatro efeitos de recursos diferentes; Enquanto não ativar mais de dois efeitos de recursos diferentes; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De classe/especialização**. Exemplo: Enquanto você for uma especialização da classe primária Bruxo; Enquanto você tiver apenas uma classe primária; Se você tiver duas classes primárias; Se você tiver mais de três classes primárias; Se você tiver duas especializações; Se você forExemplo: Ao ativar um efeito de um recurso no inventário; Ao ativar mais de três efeitos diferentes de recursos no seu inventário; Se você for um guerreiro; Se você for um Ladino ou Clérigo; Se você for um Feiticeiro Druida; Se você tiver mais de três classes primárias; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De modificador**. Exemplo: Se o seu maior modificador for Reflexão; Se o seu maior modificador for Vigor ou Precisão; Se o seu menor modificador for Ataque; Se o seu menor modificador for Esquiva ou Celeridade; Se você tiver mais modificador de Precisão do que Defesa; Se a soma dos modificadores Ataque e Reflexão for maior que N; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De atributo**. Exemplo: Se você tiver uma carta de Atributo Sanidade em sua mão; Se você tiver duas cartas de Atributo Sorte em sua mão; Se você tiver mais do que três cartas de Atributo Destreza em sua mão; Se você tiver três ou menos cartas de Atributo Força em sua mão; Se você tiver uma carta de Atributo Resistência e uma de Atributo Carisma em sua mão; Se você tiver uma carta de Atributo Espírito ou Atributo de Inteligência em sua mão; Se você tiver três ou mais Atributos diferentes em sua mão; Se você tiver apenas um tipo de Atributo em sua mão; Se você tiver quatro ou menos Atributos diferentes em sua mão; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
    - **De inventário**. Exemplo: Ao ativar um efeito de um recurso no inventário; Ao ativar dois ou mais efeitos de recursos diferentes no seu inventário; Ao ativar um efeito de um Item no seu inventário; Ao ativar um efeito de um equipamento em seu inventário; Ao ter 4 ou menos recursos diferentes no seu inventário; Se você não tiver nenhum recurso no seu inventário; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De efeito**. Exemplo: Ao usar um efeito de um equipamento; Ao usar dois ou mais efeitos de equipamentos diferentes; Ao usar três ou menos efeitos de recursos diferentes no seu inventário; Se você usou um ou mais efeitos de um item e um ou mais efeitos de um equipamento; Se você usou um ou mais efeitos de um equipamento para cabeça; Se você não usou um efeito de equipamento para tronco ou capa; Se você usou três ou mais efeitos de itens diferentes no seu inventário; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **De jogador**: Exemplo: Se você tiver sem cartas na mão; Se você tiver três ou menos cartas na mão; Se você não tiver cartas na sua pilha de descarte de Atributos; Se você tiver 10 ou mais pontos de vida; Se você não tiver mais cartas no seu deck de Atributos; Se você tiver 30 ou mais moedas de ouro; Se você tiver 3 ou menos pontos de vida; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
- **Custo** (opcional): Esse é o custo para pode ativar o efeito. Nem todos os efeitos possuem custos. A ideia geral é que efeitos muito fortes tem um custo muito difícil de ser cumprido e mais específico. O custo seria uma ou uma combinação de múltiplos requisitos para poder ativar. O efeito não podem ser ativados se o custo não for pago. Um custo pode ter um ou infinitos requisitos e eles podem se misturar entre todas as categorias. Alguns requisitos de custos são (podem haver mais no futuro): 
  - Um **atributo específico** ou uma **combinação de atributos específicos** ou **qualquer atributo**. Exemplo: Um Atributo força; Um Atributo Carisma, três Atributos de Destreza e dois Atributo Sanidade; dois Atributos Espírito e 2 Atributos quaisquer; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Doar vida**. Exemplo: Doe sete de vida; Doe uma quantidade de vida igual a quantidade de equipamentos que você esta usando (no mínimo 2); Doe uma quantidade de vida igual a quantidade de equipamentos no seu inventário (no mínimo 3); Doe uma quantidade de vida igual a quantidade de recursos no seu inventário (no mínimo 4); Doe uma quantidade de vida igual a quantidade de Relíquias e Documentos no seu inventário (no mínimo 2 no total); Doe uma quantidade de vida igual a quantidade de cartas na pilha de descarte de atributos (no mínimo 5); Doe metade da sua vida (arredonde para cima); Doe uma quantidade de vida igual a seu modificador mais alto (no mínimo 200); Doe uma quantidade; Doe uma quantidade de vida igual ao seu modificador mais baixo (no mínimo 100); etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Pagar ouro**. Exemplo: Pague 15 moedas de ouro; Pague uma quantidade de ouro igual a quantidade de equipamentos que você esta usando (no mínimo 2); Pague uma quantidade de ouro igual a quantidade de equipamentos no seu inventário (no mínimo 6); Pague uma quantidade de ouro igual a quantidade de recursos no seu inventário (no mínimo 4); Pague uma quantidade de ouro igual a quantidade de Relíquias e Documentos no seu inventário (no mínimo 2 no total); Pague uma quantidade de ouro igual a quantidade de cartas na pilha de descarte de atributos (no mínimo 5); Pague metade da seu ouro total (arredonde para cima); Pague uma quantidade de ouro igual a seu modificador mais alto (no mínimo 50); Pague uma quantidade de ouro igual ao seu modificador mais baixo (no mínimo 90); etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Abdicar de equipamento**. Só pode abdicar de equipamentos que você esteja usando no momento do gatilho do efeito (o equipamento precisa estar no slot de uso do jogador para ser abdicado). Equipamentos abdicados vão para a pilha comum de descarte do jogo (chamado de **limbo**). Exemplos: Abdique do seu equipamento de cabeça; Abdique do seu equipamento de capa e tronco; Abdique de qualquer equipamento que não seja um calçado; Abdique aleatóriamento um equipamento; Abdique aleatóriamente um equipamento que não seja inferior; Abdique de três equipamentos; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Descartar de carta de atributo**. Cartas descartas vão para a pilha comum de descarte do jogo (chamado de **limbo**). Exemplos: Descarte uma carta da sua mão; Descarte aleatóriamente uma carta da sua mão; Descarte uma carta de Atributo Carisma; Descarte uma carta de Atributo que não seja de Força ou Sabedoria; Descarte 3 cartas da sua mão; Descarte 4 cartas da sua mão que não sejam de Atributo Destreza ou Atributo Espírito; Descarte cartas até ter duas cartas na sua mão (no mínimo uma carta precisa ser descartada); Descarte toda a sua mão (no mínimo 3 cartas); Descarte uma carta de Atributo Sanidade, Atributo Resistência e Atributo Sorte; Descarte três cartas diferentes; Descarte duas cartas iguais; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Oferecer recurso do inventário**. Recursos oferecidos vão para a pilha comum de descarte do jogo (chamado de **limbo**). Exemplos: Ofereça um recurso do tipo Item; Ofereça dois recursos do tipo Item diferentes; Ofereça um recurso do tipo equipamento e um recurso do tipo Relíquia; Ofereça três recursos iguais; Ofereça um recurso do tipo Ferramenta, um do tipo Tesouro e um do tipo Documento; Ofereça cinco recursos diferentes; Ofereça dois recursos de equipamentos e dois recursos de itens; Ofereça um item que não seja de equipamento; Ofereça dois recursos que não sejam de itens; Ofereça 4 recursos diferentes que não sejam Relíquias, Tesouros ou Calçado; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Manipulação de cartas**: Exemplo: Enviar N cartas do topo do deck de Atributos para a pilha de descarte de Atributos; Enviar N cartas do fundo do deck de Atributos para o Limbo (pilha de descarte global); Reembaralhar N cartas da pilha de descarte de Atributos no seu deck de Atributos; Reembaralhar no mínimo três cartas de Atributo da sua mão de volta no deck de Atributos; Colocar no mínimo uma carta de Atributo da sua mão no topo do deck de Atributos; Colocar no mínimo três carta de Atributo da sua mão no fundo do deck de Atributos; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
- **Ativação**: a consequência, a ação, o ato. As ativações podem ser divididas em algumas categorias (podem haver mais no futuro): 
  - **Manipulação matemática**: Envolve cálculos matemáticos. Exemplo: Perca X moedas de ouro; Ganhar X moedas de ouro; Perca X pontos de vida; Ganha X pontos de vida; Aumente seu modificador de Vigor em X pontos; Aumente seu modificador de Ataque e Esquiva em X pontos; Reduza seus modificadores de Defesa, Perfuração e Reflexão em X pontos; Zere seus modificadores de Celeridade e Defesa; Zere seu modificador X; Uma carta do Atributo X tem o valor dois; Uma carta do Atributo X tem seu valor multiplicado por dois; Reduza seus pontos de vida pela metade (arredonde para cima); Cause X pontos de dano no oponente; Reduza o ataque do oponente em X pontos; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Manipulação de cartas**: interação com qualquer tipo de carta. IMPORTANTE: se a carta não diz explicitamente para embaralhar o deck, então o deck não deve ser embaralhado. Exemplo: Compre X cartas do seu deck de Atributos; Descarte X cartas da sua mão; Descarte uma carta específica da sua mão; Escolha uma carta da sua pilha de descarte de atributo e coloque-a no topo do seu deck de Atributos; Colocar X cartas do topo do seu deck de atributos na pilha de descarte de atributos; Procure por um Atributo X na sua pilha de descarte de atributos; Procure por um Atributo X no seu deck de Atributos e coloque-a na sua mão; Procure por duas cartas de Atributo X no seu deck e coloque-as na sua mão e depois embaralhe seu deck de Atributos; Coloque X cartas da sua mão no topo do seu deck de Atributos; Envie X cartas do topo/fundo do deck para o limbo (pilha de descarte global); etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Manipulação de efeito**. Exemplo: Anule todos os efeitos de um equipamento (o efeito é negado, ou seja, quando uma habilidade for ativada, não acontecerá nada. É como se a habilidade tivesse o efeito de "não faz nada"); Anule todos os efeitos dos itens; Anule todos os efeitos de equipamento da categoria X; Anule todos os efeitos de itens da categoria X; Anule todos os efeitos de Atributos Aprimorados; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Manipulação de habilidade**. Exemplo: Anule todas as habilidades de um equipamento (a habilidade não podem nem ser ativada e o efeito desencadeado da habilidade não ativa); Anule todas as habilidades de equipamentos de capa e calçados; Anule todas as habilidades de armas; Anule todas as habilidades de cimitarras, katanas, adagas e facas; etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.
  - **Manipulação de regra**. altera uma regra padrão do jogo ??????
  - **Manipulação de recursos**. abdique de equipamento, ofereça o recurso
  - **Manipulação de elemento**. "  
  - **Manipulação de combate**. Exemplo: 
- **Duração**: Por quanto tempo o efeito vai valer. A duração podem ser divididas em algumas categorias. Alguns exemplos são (podem haver mais no futuro):
  - Imediata: o efeito acontece imediatamente e não é prolongado para nenhum outro cenário ou ocasião. 
  - Infinita: o efeito sempre estará em vigor até que uma carta, efeito, habilidade, recurso, etc consiga desabilitá-la.
  - De turno:
  - De zona:
  - De evento aleatório:
  - De evento de combate:  
  - De fase de evento: 
  - De ação de zona:
  - De combate:
  - De habilidade: 
  - De efeito:
  - De atributo:
  - De jogador: 
  - De inventário:
  - De modificador: 
  - De classe/especialização:
  - De carta. Exemplo: até que essa carta seja descartada para a pilha de descarte de Atributos; até que a carta X seja descartada para a pilha de descarte; até que você tenha três ou menos cartas na mão; até que no mínimo quatro cartas tenham sido descartadas na pilha de descarte global (limbo); etc. É necessário implementar uma vasta variações do efeitos possíveis para permitir uma estratégia infinita e fazer com que o jogador pense.

Para a implementação da sessão de efeitos, você deve analisar todo o texto dessa sessão e criar a mais ampla possibilidade de variações e misturas possíveis. Quanto mais variedade de Gatilho, Custo, Ativação e Duração, mais desafiador fica o jogo e mais estratégia precisa ser pensada pelos jogadores.

### Os elementos do jogo

Os elementos possuem vantagens, desvantagens e neutralidade sobre outros. Elementos impactam nos cálculos de dano, defesa e em diversos outros cenários do jogo.
- **Vantagem**: +25% de efetividade contra o elemento por padrão.
- **Desvantagem**: -25% de efetividade contra o elemento por padrão.
- **Neutro**: quando dois elementos não possuem uma relação de vantagem ou desvantagem entre si, a habilidade funciona normalmente.
- **Sem Elemento**: a habilidade não possui afinidade elemental. Não recebe vantagens nem sofre desvantagens contra nenhum elemento.

Por exemplo:
- Uma habilidade de Fogo contra Água possui desvantagem.
- Uma habilidade de Fogo contra Ar possui resultado neutro.
- Uma habilidade sem elemento contra Água possui resultado neutro.
- Uma habilidade sem elemento contra Fogo também possui resultado neutro.

Alguns exemplos de elementos são (podem surgir novos elementos no futuro):
- **Elementos**:  
  - **Terra**: Rochas, minerais, areia, cristais e manifestações geológicas. Representa resistência, estabilidade e força.
    - Vantagem: Elétrico, Sônico.
    - Desvantagem: Orgânico, Água.
  - **Água**: Água, líquidos, correntes, pressão e manipulação de fluidos.
    - Vantagem: Fogo, Tóxico.
    - Desvantagem: Elétrico, Gélido, Orgânico.
  - **Fogo**:  Chamas, calor, combustão, explosões e energia térmica.
    - Vantagem: Gélido, Orgânico.
    - Desvantagem: Água, Cósmico
  - **Elétrico**: Eletricidade, raios, magnetismo e descargas energéticas.
    - Vantagem: Água.
    - Desvantagem: Terra, Cósmico.
  - **Ar**: Ventos, pressão atmosférica, tempestades e manipulação de gases.
    - Vantagem: Tóxico, Sanguíneo.
    - Desvantagem: Terra, Elétrico.
  - **Gélido**: Gelo, congelamento, baixas temperaturas e cristalização.
    - Vantagem: Água, Orgânico.
    - Desvantagem: Fogo, Sônico.
  - **Orgânico**: Vegetação, raízes, fungos, flores e manifestações biológicas da natureza. 
    - Vantagem: Terra, Água.
    - Desvantagem: Fogo, Gélido, Tóxico, Dracônico.
  - **Tóxico**: Venenos, toxinas, ácidos, contaminação e substâncias nocivas. 
    - Vantagem: Orgânico, Sanguíneo.
    - Desvantagem: Água, Ar, Celestial.
  - **Arcano**: Energia mágica, feitiços, runas, encantamentos e manipulação de forças sobrenaturais.
    - Vantagem: Dracônico, Espiritual.
    - Desvantagem: Obscuro, Psíquico.
  - **Obscuro**: Sombras, maldições, corrupção, trevas e manifestações negativas de energia.
    - Vantagem: Psíquico, Espiritual.
    - Desvantagem: Celestial.
  - **Celestial**: Luz divina, bênçãos, energia sagrada, purificação e manifestações celestiais.
    - Vantagem: Obscuro, Tóxico.
    - Desvantagem: Sanguíneo, Cósmico.
  - **Dracônico**: Poderes associados a dragões, sangue dracônico, sopros e energia ancestral.
    - Vantagem: Orgânico.
    - Desvantagem: Arcano, Sanguíneo.
  - **Cósmico**: Estrelas, gravidade, energia astral, dimensões, espaço e fenômenos cósmicos.
    - Vantagem: Elétrico.
    - Desvantagem: Fogo, Celestial.
  - **Sônico**: Vibrações, frequências, ondas sonoras e ressonância.
    - Vantagem: Psíquico, Gélido.
    - Desvantagem: Terra.
  - **Psíquico**: Telepatia, telecinese, ilusões e manipulação mental.
    - Vantagem: Sanguíneo, Espiritual.
    - Desvantagem: Obscuro, Sônico.
  - **Sanguíneo**: Sangue, vitalidade, sacrifícios e manipulação biológica.
    - Vantagem: Celestial, Dracônico.
    - Desvantagem: Ar, Tóxico, Psíquico, Espiritual.
  - **Espiritual**: Espíritos, almas, aparições e manifestações espectrais.
    - Vantagem: Sanguíneo. 
    - Desvantagem: Arcano, Obscuro, Psíquico.


conectar classes e especializações a certos elementos (algumas classes e especializações tem mais afinidade com certos elementos)?????

### O que são habilidades?
Vínculadas a equipamentos de todas as categorias. Estruturada em nome da habilidade e efeito (ou efeitos). Ao usar uma habilidade, você consome pontos de Vigor (modificador) por padrão. Mas, existem recursos, efeitos e outras habilidades que podem reduzir a quantidade de pontos de vigor para usar uma habilidade. Algumas habilidades não consomem pontos de vigor. Entende-se que, quanto mais forte uma habilidade, mais pontos de vigor é necessário para usá-la. Habilidades possuem um ou mais elementos e uma forma:
- **Formas**:  
  - **Direcionada**: Atinge um alvo específico.
  - **Projétil**:	Dispara algo em direção a um alvo.
  - **Área**:	Afeta uma região e mais de um inimigo ao mesmo tempo.
  - **Contínua**:	Permanece ativa por determinado período (exige ativação).
  - **Canalizada**	Exige concentração ou preparação (exige usar algumas vezes a habilidade até ela poder ser usada de fato).
  - **Passiva**:	Funciona sem ativação manual (não precisa ser ativada).



?????? continuar a descrever

### Sistema de leveling e XP (Vigor): 
Não existe level dentro do jogo, mas existe um sistema de vigor. Vigor é o modificador mais importante do jogador e é vital ter bastante desse modificador pois ele impacta diretamente em todos os cálculos do jogo. 
- Algumas coisas que concedem pontos de vigor:
  - Cumprir missões.
  - Usar itens pontuais.
  - Habilidades de equipamentos.
  - Resolver eventos com sucesso.
  - Ganhar combates.
  - Derrotar inimigos.
  - Efeitos positivos (buffs).
  - Etc.

- Algumas coisas que removem pontos de vigor:
  - Fugir de combates.
  - Usar algumas habilidades de equipamentos.
  - Não conseguir resolver eventos.
  - Perder combates.
  - Ser nocauteado.
  - Perder uma raide.
  - Efeitos negativos (debuffs).
  - Etc.

---------

# Montaria

movimentação de zona e outros benefícios ???

# Tipos de Inimigo

- raça ???

# Levar em consideração (aspectos técnicos)

**Atenção**: muitos conceitos estão sujeitos a mudar com tempo devido a novas ideias ou descobertas de problemas. Essa sessão apresenta as ideias básicas.

- Tudo o que esta descrito neste documento inteiro, esta descrito de maneira como se o jogo fosse um jogo de verdade. Porém, esse projeto seria uma versão digital do jogo onde muitas coisas do gameplay vão poder ser automatizadas para facilitar a implementação e deixar o jogo mais fluido.
- Crie agentes e skills necessárias para conseguir desenvolver o projeto. Importantes instruções que devem conter nos agentes de desenvolvimento são: "Não disfarce suas dúvidas. Explicite as vantagens e desvantagens de cada escolha.", "Implemente apenas o necessário para resolver o problema. Não acrescente nada baseado em suposições.", "Modifique apenas o que for indispensável. Corrija ou limpe tudo aquilo que suas próprias alterações deixarem para trás."e "Estabeleça critérios claros para considerar a tarefa concluída. Continue iterando até confirmar que eles foram atendidos.". O ![arquivo de referência](PROMPT-AGENTES-E-SKILLS.md) tem uma ideia de como você pode criar os agentes e skills.
- Frontend deve ser feito em Typescript, Vite, React-query (Tanstack), React Router Dom e React (fora outras bibliotecas externas que serão decididas quais usar durante o desenvolvimento). O backend deve ser feito com typescript, NestJS, ORM Drizzle, arquitetura hexagonal, domain driven design e outras tecnologias e arquiteturas para ajudar a desenvolver o backend como WebSockets, Socket.IO, Aggregate Root (Entidade Raiz), Domain Events & State Machine, Portas (Interfaces) e Adaptadores (Implementações) e mais outras que podem surgir durante o desenvolvimento conforme necessidade.
- O jogo é em tempo-real com interações acontecendo ao mesmo tempo entre os jogadores e o jogo em si.
- Testes no frontend devem usar a lib vitest para testes unitários e playwright para testes end-to-end. Para testes de integração, eu aceito sugestões.
- Teste no backend devem usar o vitest também e algum lib para fazer testes de requests para o endpoint e mais testes que você julgar importante.
- Como o projeto tem frontend e backend, gostaria de ter alguma estratégia de desenvolvimento por feature (todas as implementações para de frontend e backend são feitas para resolver um bug específico ou implementar um feature específica). Ou seja, eu ia criar dois projetos em paralelo (um frontend e um backend) onde cada um teria seus agentes e skills específicos para implementarem seus devidos códigos. Uma feature só é considerada completa quando uma feature ou bug foi resolvido dos dois lados (ou quando apenas um lados tem seus código escritos ou corrigidos). Eu estarei fazendo o controle e passando a informação de um projeto para o outro para pode validar. Para isso, você terá que criar as skills e agentes com instruções claras de quando ele precisa de uma validação do outro lado do projeto (estarei ajudando nas confirmações). Para isso, você terá que analisar todos os requisitos do projeto e criar os agentes e skills para o projeto frontend e os agentes e skills para o projeto backend. Crie a lista de passos, etapas, fases de desenvolvimento para o frontend e backend. 
- Para a implementação do backend, estava pensando em usar docker compose para o banco de dados e backend para ajudar a implementar primeiramente localmente antes de fazer o deploy já que é necessário pagar as plataformas para deixar o projeto no ar.
- O jogo funcionará principalmente em PC (monitores). Distâncias entre elementos da tela, tamanhos, margens, espaços, etc, devem ser ajustados conforme o monitor do usuário para que ele tenha a melhor experiência de jogo possível.
- Inimigos em eventos de combates não usam "cartas na mão". É tudo feito de forma automática pelo sistema.
- Você não deve instalar libs terceiras sem minha permissão.
- Quero que o jogo tenha animações e transições bonitas e simples.
- O estilo gráfico do jogo é 2.5D com estilo de PSX (Geometry and models: Extremely low-poly 3D models, low polygon counts, angular silhouettes, visibly faceted surfaces, simple geometric shapes, coarse environmental geometry, primitive character models and rigid-looking structures.
Textures and materials: Very low-resolution textures, visibly pixelated texture maps, blurry and muddy surfaces, crude hand-painted textures, limited texture detail, affine texture mapping artifacts, perspective distortion, warped textures, and subtle polygon vertex jitter reminiscent of original PS1 hardware.
Rendering and lighting: Original PlayStation-era rendering aesthetics, simple vertex lighting, minimal dynamic lighting, limited shading, basic diffuse materials, hard-edged shadows where appropriate, low color depth appearance, restrained visual effects, and authentic late-1990s 3D game rendering.
Image quality: Low internal rendering resolution, visible pixelation, jagged polygon edges, aliasing, subtle dithering, limited draw distance, atmospheric distance fog when appropriate, and the characteristic imperfections of early real-time 3D graphics. Preserve the raw, imperfect appearance of vintage console footage rather than modernizing the image.
Art direction: Nostalgic, atmospheric, imperfect, surreal when appropriate, visually distinctive and unmistakably from the original PlayStation era. The final image should look like an authentic screenshot captured directly from a real 1990s PS1 game running on original hardware.
Strict restrictions: No modern photorealism, no high-poly models, no physically based rendering (PBR), no ray tracing, no modern cinematic CGI, no ultra-high-resolution textures, no Unreal Engine 5 aesthetic and no excessive post-processing)
- Termos podem ser alterados da forma que você achar melhor (mas você precisa da minha aprovação).
- Imagens e ícones vão estar presentes na aplicação. Irei providenciar elas. Você pode criar imagens e ícones svg apenas para seus testes.
- Termos dentro do jogo devem ter um "highlight" ou uma cor para representar aquele termo para o jogador saber que, quando ele passar o mouse por cima, um tooltip explicando o que é aquele termo aparece. Variações dos termos também devem conter essa funcionalidade. Alguns termos do jogo são: Atributos, cada um dos atributos, Zonas, Classes, cada uma das classes, modificadores, cada uma das ações de zona, cada um dos tipos de eventos, etc.
- Cada jogador inicia a partida com 20 pontos de vida. Mas, esse não é o limite. O jogador pode acumular infinitos pontos de vida se ele conseguir. Não limite máximo de pontos de vida por padrão.
- Caso o deck de atributos do jogador se esgotar (ter zero cartas), ele não perde o jogo. É considerado que o jogador fez uma péssima admnistração de atributos. O jogo segue normalmente, mas será bem difícil o jogador conseguir continuar jogando sem um deck de recursos. Mas, tem efeitos, recursos e outros fatores que podem ajudar o jogador a ter um "comeback" (voltar a partida de forma incrível) e conseguir restaurar seu deck de atributos. 
- Todos os cálculos do jogo devem ter um resultado de número inteiro. O jogo não trabalha com números quebrados, mas, as lógicas e cálculos podem fazer arredondamentos (o arredondamento para cima ou para baixo vai depender da finalidade do cálculo).

# Objetivos em etapas (a ordem que eu pensei, mas você pode fazer alterações se identificar uma sequência melhor)

1 - Analisar todo esse documento e ver pontos que ficaram em abertos, problemas de conceito, ideais que se contradizem, pontos que precisam de mais esclarecimentos, dúvidas que você tem sobre o projeto como um todo (aspectos técnicos e de ideia do jogo). Certifique-se de tirar todas suas dúvidas e apontar problemas antes de passar para a próxima etapa. Você deve me entrevistar para tirar todas suas dúvidas antes de seguir para o próximo passo. O planejamento deve ser feito com base na estratégia do spec-driven design Use o conceito de spec-drive development (para mais contextos sobre "spec-driven development" tem as urls de contexto "[https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)", "[https://blog.dsacademy.com.br/spec-driven-development-a-nova-arquitetura-de-engenharia-de-software-na-era-dos-agentes-de-ia-parte-3/]", "[https://www.ibm.com/br-pt/think/topics/spec-driven-development](https://www.ibm.com/br-pt/think/topics/spec-driven-development)" e "[https://thoughtworks.medium.com/spec-driven-development-d85995a81387](https://thoughtworks.medium.com/spec-driven-development-d85995a81387)"). As etapas em si devem ser pensadas, organizadas e dividas em primeiramente para ter um jogo funcional (frontend e backend) funcionando totalmente para apenas um jogador. Em segundo momento, as etapas devem ser pensadas para introduzir mais jogadores com IA (será possível eu testar o jogo junto a outros três jogadores todos eles sendo IAs). Em um terceiro momento, deve ser pensando nas etapas necessárias para desenvolver todas as funcionalidades relacionadas para ter um jogo online web com interatividade em tempo real, web sockets, etc. Separe em dois arquivos diferentes: um arquivo contem todo o contexto, regras, aspectos, etapas de frontend e o outro arquivo é a mesma coisa para o backend. O frontend será implementado primeiramente para rodar localmente via web. Mas, em um segundo momento, o projeto frontend será portado para um executável de PC usando Tauri https://v2.tauri.app/start/.
2 - Criar um arquivo .md organizado e estruturado de regras (manual de regras). Estruturar da melhor forma para que a ordem das regras tenham uma sequência de entendimento para facilitar a próxima regra. Explicar de forma detalhada. Usar infográficos e imagens para ajudar a explicar conceitos mais complexos. 

