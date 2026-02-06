import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Create i18n for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      title: 'Test Title',
      correct: 'Correct',
      incorrect: 'Incorrect',
      resetQuiz: 'Reset Quiz',
      selectPokemon: 'Select Pokémon',
      searchPlaceholder: 'Search',
      noResults: 'No results',
      explanation: {
        intro: 'Intro',
        hp: 'HP',
        hpDesc: 'Hit Points',
        atk: 'Atk',
        atkDesc: 'Attack',
        def: 'Def',
        defDesc: 'Defense',
        spa: 'SpA',
        spaDesc: 'Special Attack',
        spd: 'SpD',
        spdDesc: 'Special Defense',
        spe: 'Spe',
        speDesc: 'Speed',
        and: 'and',
        question: 'Question',
      },
      sidebar: {
        settings: 'Settings',
        generation: 'Generation',
        minGeneration: 'Min Generation',
        maxGeneration: 'Max Generation',
        fullyEvolvedOnly: 'Fully Evolved Only',
        maxScore: 'Win Score',
        madeBy: 'Made by',
        english: 'English',
        deutsch: 'Deutsch',
      },
      congratulations: {
        title: 'Congratulations',
        message: 'You won',
        finalScore: 'Final Score',
        timeElapsed: 'Time Elapsed',
        startNewQuiz: 'Start New Quiz',
      },
      loading: 'Loading',
      correctMessage: 'Correct: {pokemon}',
      alsoCorrect: 'Also correct',
      incorrectMessage: 'Incorrect: {pokemon}',
    },
    de: {
      title: 'Test Titel',
      correct: 'Korrekt',
      incorrect: 'Falsch',
      resetQuiz: 'Quiz zurücksetzen',
    },
  },
})

config.global.plugins = [i18n]
