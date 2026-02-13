import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { computed, ref, reactive, watch, watchEffect, onMounted, onUnmounted, nextTick } from 'vue'

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

// Mock Vue auto-imports
globalThis.computed = computed
globalThis.ref = ref
globalThis.reactive = reactive
globalThis.watch = watch
globalThis.watchEffect = watchEffect
globalThis.onMounted = onMounted
globalThis.onUnmounted = onUnmounted
globalThis.nextTick = nextTick

// Mock vue-router globals (for auto-imported composables)
globalThis.useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  beforeEach: vi.fn(),
  afterEach: vi.fn(),
}))

globalThis.useRoute = vi.fn(() => ({
  params: {},
  query: {},
  path: '/',
  name: undefined,
  meta: {},
}))

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
