import type { SpeciesFilterOptions } from '@/composables/useQuizLogic'

/**
 * Quiz settings configuration
 */
export interface QuizSettings extends SpeciesFilterOptions {
  maxScore: number
  hintsEnabled: boolean
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
}
