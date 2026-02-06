/**
 * Quiz settings configuration
 */
export interface QuizSettings {
  generation: number
  minGeneration: number
  maxGeneration: number
  fullyEvolvedOnly: boolean
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
  maxScore: 10,
  hintsEnabled: true,
}
