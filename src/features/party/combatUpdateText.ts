import type { PartyActionResponse } from '../../api/parties'

type Update = NonNullable<PartyActionResponse['combatUpdates']>[number]

export const combatResolutionLabel = {
  victory: 'Vitória',
  defeat: 'Derrota',
  escaped: 'Fuga',
}

export function combatUpdateText(update: Update, name: (id: string) => string) {
  switch (update.type) {
    case 'combatStarted':
      return `Combate iniciado · ${update.cardTitle} · ${update.participants.map(({ id }) => name(id)).join(', ')}`
    case 'combatTurnStarted':
      return `Turno de ${name(update.actorId)} · ciclo ${update.cycle}`
    case 'combatAbilityUsed':
      return `${name(update.actorId)} usou ${update.abilityId}`
    case 'combatEffectActivated':
      return `${name(update.actorId)} ativou ${update.effectId}`
    case 'combatDamageResolved':
      return `${update.actorId === null ? 'Efeito' : name(update.actorId)} → ${name(update.targetId)} · ${update.hit === false ? 'errou' : `${update.damage} de dano`} · ${update.targetHealth} PV${update.reflectedDamage ? ` · Reflexão: ${update.reflectedDamage} de dano` : ''}`
    case 'combatEscapeAttempted':
      return `${name(update.actorId)} · fuga ${update.succeeded ? 'bem-sucedida' : 'falhou'} · ${update.vigorSpent} Vigor${update.total === null ? '' : ` · total ${update.total}, limiar ${update.threshold}`}`
    case 'combatEnded':
      return `Combate encerrado · ${combatResolutionLabel[update.result.resolution]}`
  }
}
