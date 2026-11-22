import { z } from 'zod'
import { playerClassSchema, zoneTypeSchema } from './vocabulary'

const id = z.string().min(1)
const count = z.number().int().nonnegative()

export const questLocationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('zoneType'), zoneType: zoneTypeSchema }),
  z.object({ type: z.literal('zoneTitle'), title: id }),
])

const counter = z.object({ current: count, target: count })
const objectives = z.object({
  randomEventSuccesses: counter,
  combatVictories: counter,
})
const quest = z.object({ questId: id, title: id })
const openQuest = z.discriminatedUnion('type', [
  quest.extend({
    type: z.literal('zoneQuest'),
    questCardId: id,
    originZoneId: id,
    stage: z.object({
      index: count,
      text: z.string(),
      location: questLocationSchema,
      status: z.enum(['ready', 'inProgress', 'completed']),
      objectives: objectives.nullable(),
    }),
  }),
  quest.extend({
    type: z.literal('trialQuest'),
    classId: playerClassSchema,
    specializationId: id,
    objectives,
  }),
  quest.extend({
    type: z.literal('mentorQuest'),
    classId: playerClassSchema,
    objectives,
  }),
])
export type OpenQuest = z.infer<typeof openQuest>

const questActions = [
  z.object({ type: z.literal('takeQuest'), questCardId: id }),
  z.object({ type: z.literal('continueQuest'), questId: id }),
  z.object({ type: z.literal('finishQuest'), questId: id }),
  z.object({ type: z.literal('abandonQuest'), questId: id }),
  z.object({
    type: z.literal('takeTrialQuest'),
    classId: playerClassSchema,
    specializationId: id,
  }),
  z.object({ type: z.literal('trainWithMentor'), classId: playerClassSchema }),
] as const
export const questActionSchema = z.discriminatedUnion('type', questActions)
export type QuestAction = z.infer<typeof questActionSchema>

const costs = { actionPoints: count, gold: count }
const questChoice = z.discriminatedUnion('type', [
  questActions[0].extend(costs),
  questActions[1].extend(costs),
  questActions[2].extend(costs),
  questActions[3].extend(costs),
  questActions[4].extend(costs),
  questActions[5].extend(costs),
])
export const playerQuestFields = {
  questBoard: z
    .array(z.object({ questCardId: id, title: id, summary: z.string() }))
    .default([]),
  openQuests: z.array(openQuest).default([]),
  questChoices: z.array(questChoice).default([]),
  specializations: z
    .array(
      z.object({
        classId: playerClassSchema,
        specializationId: id,
        deckLockMet: z.boolean(),
      }),
    )
    .default([]),
}
