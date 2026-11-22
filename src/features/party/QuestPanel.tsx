import type { ClassDefinition } from '../../api/catalog'
import type { PartyMember } from '../../api/parties'
import { questActionSchema, type QuestAction } from '../../api/quests'
import { zoneTypeLabels } from '../../ui/labels'

const stageLabels = {
  ready: 'Disponível',
  inProgress: 'Em andamento',
  completed: 'Concluída',
}

const actionLabels = {
  takeQuest: 'Aceitar',
  continueQuest: 'Continuar',
  finishQuest: 'Finalizar',
  abandonQuest: 'Abandonar',
  takeTrialQuest: 'Aceitar provação',
  trainWithMentor: 'Treinar com mentor',
}

export function QuestPanel({
  player,
  classes,
  pending,
  onAction,
}: {
  player: PartyMember['player']
  classes: ClassDefinition[]
  pending: boolean
  onAction: (action: QuestAction) => void
}) {
  type Choice = (typeof player.questChoices)[number]
  function button(choice: Choice, target: string) {
    return (
      <button
        key={JSON.stringify(choice)}
        type="button"
        disabled={pending}
        onClick={() => onAction(questActionSchema.parse(choice))}
      >
        {actionLabels[choice.type]} {target} · {choice.actionPoints} PA
        {choice.gold > 0 && ` · ${choice.gold} ouro`}
      </button>
    )
  }

  const progression = player.questChoices.filter(
    (choice) =>
      choice.type === 'takeTrialQuest' || choice.type === 'trainWithMentor',
  )
  if (
    !player.questBoard.length &&
    !player.openQuests.length &&
    !progression.length
  )
    return null

  return (
    <>
      {player.questBoard.length > 0 && (
        <section aria-label="Quadro de missões">
          <h2>Quadro de missões</h2>
          <ul>
            {player.questBoard.map((offer) => (
              <li key={offer.questCardId}>
                <h3>{offer.title}</h3>
                <p>{offer.summary}</p>
                {player.questChoices
                  .filter(
                    (choice) =>
                      choice.type === 'takeQuest' &&
                      choice.questCardId === offer.questCardId,
                  )
                  .map((choice) => button(choice, offer.title))}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="Missões abertas">
        <h2>Missões abertas</h2>
        {player.openQuests.length === 0 && <p>Nenhuma missão aberta.</p>}
        <ul>
          {player.openQuests.map((quest) => {
            const stage = quest.type === 'zoneQuest' ? quest.stage : null
            const objectives =
              quest.type === 'zoneQuest'
                ? quest.stage.objectives
                : quest.objectives
            return (
              <li key={quest.questId}>
                <h3>{quest.title}</h3>
                {stage ? (
                  <>
                    <p>
                      Etapa {stage.index + 1} · {stageLabels[stage.status]}
                    </p>
                    <p>{stage.text}</p>
                    <p>
                      Destino:{' '}
                      {stage.location.type === 'zoneTitle'
                        ? stage.location.title
                        : zoneTypeLabels[stage.location.zoneType]}
                    </p>
                  </>
                ) : (
                  <p>Entrega em zona Urbana ou Habitada.</p>
                )}
                {objectives && (
                  <ul>
                    <li>
                      Êxitos em eventos:{' '}
                      {objectives.randomEventSuccesses.current}/
                      {objectives.randomEventSuccesses.target}
                    </li>
                    <li>
                      Vitórias de pé: {objectives.combatVictories.current}/
                      {objectives.combatVictories.target}
                    </li>
                  </ul>
                )}
                {player.questChoices
                  .filter(
                    (choice) =>
                      'questId' in choice && choice.questId === quest.questId,
                  )
                  .map((choice) => button(choice, quest.title))}
              </li>
            )
          })}
        </ul>
      </section>
      {progression.length > 0 && (
        <section aria-label="Progressão de classes">
          <h2>Progressão de classes</h2>
          <ul>
            {progression.map((choice) => {
              const definition = classes.find(
                (entry) => entry.playerClass === choice.classId,
              )
              const name = definition?.name ?? choice.classId
              const specialization =
                choice.type === 'takeTrialQuest'
                  ? (definition?.specializations.find(
                      (entry) => entry.id === choice.specializationId,
                    )?.name ?? choice.specializationId)
                  : null
              return (
                <li key={JSON.stringify(choice)}>
                  {button(
                    choice,
                    specialization ? `${name} · ${specialization}` : name,
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
