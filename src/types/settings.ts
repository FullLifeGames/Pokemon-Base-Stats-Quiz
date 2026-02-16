import type { SpeciesFilterOptions } from '@/composables/useQuizLogic'

/**
 * Available quiz modes.
 * Extend this union when adding new quiz types.
 */
export type QuizMode = 'base-stat' | 'learnset' | 'damage'

/**
 * Quiz settings configuration
 */
export interface QuizSettings extends SpeciesFilterOptions {
  maxScore: number
  hintsEnabled: boolean
  quizMode: QuizMode
}

/**
 * Default quiz settings
 */
export const defaultSettings: QuizSettings = {
  generation: 9,
  minGeneration: 1,
  maxGeneration: 9,
  fullyEvolvedOnly: true,
  includeMegaPokemon: false,
  maxScore: 10,
  hintsEnabled: true,
  quizMode: 'base-stat',
}
