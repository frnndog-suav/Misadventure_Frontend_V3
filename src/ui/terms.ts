// Catálogo de termos do jogo (spec D-20, REQ-03). Ids do glossário do
// docs/CONTRATO.md §2; nome e texto em pt-BR, aprovados pelo autor.
// O texto descreve o termo; não calcula nem decide regra.

export type TermEntry = { name: string; description: string }

export const termCatalog = {
  strength: {
    name: 'Força',
    description:
      'Potência física: levantar, empurrar, carregar, quebrar objetos e causar impacto.',
  },
  dexterity: {
    name: 'Destreza',
    description:
      'Agilidade, coordenação e precisão: esquiva, equilíbrio e armas que exigem técnica.',
  },
  endurance: {
    name: 'Resistência',
    description:
      'Capacidade física de suportar esforço, dano e desgaste: vitalidade, fôlego e tolerância à dor.',
  },
  intelligence: {
    name: 'Inteligência',
    description:
      'Raciocínio e aprendizado: conhecimento, memória, investigação e resolução de problemas.',
  },
  wisdom: {
    name: 'Sabedoria',
    description:
      'Percepção e intuição: discernimento, leitura do ambiente e reconhecimento de padrões.',
  },
  charisma: {
    name: 'Carisma',
    description:
      'Capacidade de influenciar pessoas: persuasão, liderança, negociação e intimidação.',
  },
  spirit: {
    name: 'Espírito',
    description:
      'Força interior e vontade: exercer ou resistir a influências sobrenaturais e poderes místicos.',
  },
  sanity: {
    name: 'Sanidade',
    description:
      'Estabilidade mental diante do horror, do desconhecido e do que desafia a realidade.',
  },
  luck: {
    name: 'Sorte',
    description:
      'Influência do acaso: encontrar oportunidades, evitar o pior e se beneficiar do imprevisível.',
  },
} as const satisfies Record<string, TermEntry>

export type TermId = keyof typeof termCatalog
