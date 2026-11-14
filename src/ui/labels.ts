// Rótulos pt-BR dos identificadores do catálogo (REQ-04, T-12). Fonte: glossário
// do docs/CONTRATO.md §2 (tipo de carta e raridade) e §2.7. `satisfies Record`
// faz faltar um rótulo virar erro de tipo. Categorias de slot/itemCategory
// ficam em categories.ts (D-28).
import type {
  AttributeCard,
  CardType,
  Element,
  EnemyBehavior,
  EnemyCategory,
  EnemyType,
  PlayerClass,
  Rarity,
  ZoneAction,
  ZoneType,
} from '../api/catalog'

export const cardTypeLabels = {
  zone: 'Zona',
  attribute: 'Atributo',
  equipment: 'Equipamento',
  item: 'Item',
  randomEvent: 'Evento aleatório',
  combatEvent: 'Evento de combate',
} satisfies Record<CardType, string>

/** Tipo da carta de atributo (CONTRATO §2, README 4.3). */
export const attributeKindLabels = {
  basic: 'Básica',
  synergy: 'Sinérgica',
  enhanced: 'Aprimorada',
} satisfies Record<AttributeCard['attributeKind'], string>

export const rarityLabels = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Rara',
  epic: 'Épica',
  legendary: 'Lendária',
} satisfies Record<Rarity, string>

export const zoneTypeLabels = {
  mountainous: 'Montanhosa',
  forest: 'Florestal',
  coastal: 'Costeira',
  lacustrine: 'Lacustre',
  swamp: 'Pantanosa',
  grassland: 'Campestre',
  desert: 'Desértica',
  volcanic: 'Vulcânica',
  fluvial: 'Fluvial',
  underground: 'Subterrânea',
  urban: 'Urbana',
  rural: 'Rural',
  inhabited: 'Habitada',
  fortified: 'Fortificada',
  religious: 'Religiosa',
  industrial: 'Industrial',
} satisfies Record<ZoneType, string>

export const playerClassLabels = {
  warrior: 'Guerreiro',
  mage: 'Mago',
  rogue: 'Ladino',
  cleric: 'Clérigo',
  ranger: 'Patrulheiro',
  druid: 'Druida',
  monk: 'Monge',
  bard: 'Bardo',
  alchemist: 'Alquimista',
  artificer: 'Artífice',
  warlock: 'Bruxo',
  sorcerer: 'Feiticeiro',
} satisfies Record<PlayerClass, string>

export const elementLabels = {
  earth: 'Terra',
  water: 'Água',
  fire: 'Fogo',
  air: 'Ar',
  frost: 'Gélido',
  electric: 'Elétrico',
  organic: 'Orgânico',
  toxic: 'Tóxico',
  arcane: 'Arcano',
  dark: 'Obscuro',
  celestial: 'Celestial',
  draconic: 'Dracônico',
  cosmic: 'Cósmico',
  sonic: 'Sônico',
  psychic: 'Psíquico',
  blood: 'Sanguíneo',
  spiritual: 'Espiritual',
} satisfies Record<Element, string>

export const enemyTypeLabels = {
  beast: 'Fera',
  humanoid: 'Humanoide',
  undead: 'Morto-vivo',
  spirit: 'Espírito',
  demon: 'Demônio',
  celestial: 'Celestial',
  elemental: 'Elemental',
  construct: 'Constructo',
  draconic: 'Dracônico',
  aberration: 'Aberração',
  plant: 'Planta',
} satisfies Record<EnemyType, string>

export const enemyCategoryLabels = {
  common: 'Comum',
  elite: 'Elite',
  boss: 'Chefe',
} satisfies Record<EnemyCategory, string>

export const behaviorLabels = {
  aggressive: 'Agressivo',
  defensive: 'Defensivo',
  support: 'Suporte',
  hunter: 'Caçador',
} satisfies Record<EnemyBehavior, string>

/** Ações de zona (CONTRATO §2.5). "Pegar / Continuar / Finalizar missão" vira três rótulos. */
export const zoneActionLabels = {
  move: 'Movimentar',
  recover: 'Recuperar',
  prepare: 'Preparar',
  adjustDeck: 'Ajustar deck',
  negotiate: 'Negociar',
  abandonQuest: 'Abandonar missão',
  artificerWorkshop: 'Oficina do Artífice',
  startEvent: 'Iniciar evento',
  scavenge: 'Vasculhar',
  useVault: 'Usar cofre',
  takeQuest: 'Pegar missão',
  continueQuest: 'Continuar missão',
  finishQuest: 'Finalizar missão',
  takeTrialQuest: 'Pegar missão de provação',
  completeDimension: 'Concluir dimensão',
  visitBlacksmith: 'Ir ao Ferreiro',
  visitMarket: 'Ir ao Mercado',
  trainWithMentor: 'Treinar com mentor',
  saveRespawnPoint: 'Salvar ponto de respawn',
} satisfies Record<ZoneAction, string>
