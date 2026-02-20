<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { computed, ref, watch, onMounted } from 'vue'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useI18n } from 'vue-i18n'
import { useQuizLogic, type SpeciesFilterOptions } from '@/composables/useQuizLogic'
import { useLearnsetData, type MovesByType } from '@/composables/useLearnsetData'
import LearnsetDisplay from '@/components/LearnsetDisplay.vue'
import PokemonSelector from '@/components/PokemonSelector.vue'
import HintDisplay from '@/components/HintDisplay.vue'
import SpritesRenderer from '@/components/renderer/SpritesRenderer.vue'
import type { QuizSettings } from '@/types/settings'
import type { GenerationNum } from '@pkmn/dex'

const { t, locale } = useI18n()

const props = defineProps({
  settings: {
    type: Object as () => QuizSettings,
    required: true,
  },
})

const progressValue = ref(0)
const correctGuesses = ref(0)
const incorrectGuesses = ref(0)
const elapsedTime = ref(0)
const showCongratulations = ref(false)
const showExplanation = ref(true)
const hintLevel = ref(0)
const resultMessageRef = ref<HTMLDivElement | null>(null)
const currentMoves = ref<MovesByType | null>(null)
const isLoadingMoves = ref(true)
let timerInterval: ReturnType<typeof setInterval> | null = null
let loadingInterval: number | undefined

// Shared quiz logic
const speciesOptions = computed<SpeciesFilterOptions>(() => {
  return {
    ...props.settings,
    baseFormeOnly: true, // Learnset quiz should only use base species for guessing, but still consider evolutions for learnset generation
  }
})

const generation = computed<GenerationNum>(() => props.settings.generation as GenerationNum)

const {
  speciesSelection,
  generateRandomPokemon,
  getLocalizedName,
} = useQuizLogic(speciesOptions, locale)

const { getRandomPokemonWithMoves } = useLearnsetData(generation)

const currentPokemon = ref<ReturnType<typeof generateRandomPokemon>>(null!)
const value = ref('')

async function loadMoves() {
  isLoadingMoves.value = true
  try {
    const result = await getRandomPokemonWithMoves(generateRandomPokemon)
    currentPokemon.value = result.pokemon
    currentMoves.value = result.moves
  } catch {
    currentMoves.value = null
  }
  isLoadingMoves.value = false
}

const resetQuiz = async () => {
  value.value = ''
  progressValue.value = 0
  clearInterval(loadingInterval)
  correctGuesses.value = 0
  incorrectGuesses.value = 0
  elapsedTime.value = 0
  hintLevel.value = 0
  showCongratulations.value = false
  await loadMoves()
  startTimer()
}

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Watch for settings changes and regenerate
watch(() => [props.settings.generation, props.settings.minGeneration, props.settings.maxGeneration, props.settings.fullyEvolvedOnly, props.settings.includeMegaPokemon], () => {
  resetQuiz()
})

// Watch for correctGuesses to check if maxScore is reached
watch(() => correctGuesses.value, (newVal) => {
  if (newVal === props.settings.maxScore && newVal > 0) {
    progressValue.value = 0
    clearInterval(loadingInterval)
    stopTimer()
    showCongratulations.value = true
  }
})

// Start on mount
onMounted(async () => {
  await loadMoves()
  startTimer()
})

const selectedPokemon = computed(() =>
  speciesSelection.value.find((pokemon) => pokemon.value === value.value),
)

// For learnset quiz, correct = guessed the exact species
const isCorrect = computed(() => {
  if (!value.value) return null
  return value.value === currentPokemon.value.name
})

const nextPokemon = async () => {
  value.value = ''
  progressValue.value = 0
  hintLevel.value = 0
  await loadMoves()
  startTimer()
}

function setLoading() {
  progressValue.value = 0
  loadingInterval = setInterval(() => {
    progressValue.value += Math.random() * 5
    if (progressValue.value >= 100) {
      progressValue.value = 100
      clearInterval(loadingInterval)
      setTimeout(nextPokemon, 500)
    }
  }, 100)
}

function selectPokemon(selectedValue: string) {
  value.value = selectedValue === value.value ? '' : selectedValue

  if (isCorrect.value) {
    correctGuesses.value++
  } else {
    incorrectGuesses.value++
  }

  stopTimer()
  setLoading()

  setTimeout(() => {
    if (resultMessageRef.value && window.innerWidth < 768) {
      resultMessageRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}
</script>

<template>
  <div class="w-full h-full min-h-screen flex flex-col p-3 md:p-4 lg:p-6">
    <div class="flex flex-col gap-3 md:gap-4 flex-1">
      <!-- Header Section with Score -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-semibold">
            {{ t('learnset.title') }}
          </h1>
          <div class="flex gap-6 mt-2 text-sm md:text-base flex-wrap items-center">
            <span class="text-green-600 dark:text-green-400 font-semibold">
              ✓ {{ t('correct') }}: {{ correctGuesses }}
            </span>
            <span class="text-red-600 dark:text-red-400 font-semibold">
              ✗ {{ t('incorrect') }}: {{ incorrectGuesses }}
            </span>
            <span class="font-mono font-semibold text-lg">
              {{ formatTime(elapsedTime) }}
            </span>
          </div>
        </div>
        <Button
          class="cursor-pointer w-full md:w-auto"
          @click="resetQuiz"
        >
          {{ t('resetQuiz') }}
        </Button>
      </div>

      <!-- Explanation Text -->
      <div v-if="showExplanation" class="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-4 md:px-6 py-3 md:py-4 rounded-lg text-sm md:text-base">
        <p>{{ t('learnset.explanation') }}</p>
        <button
          @click="showExplanation = false"
          class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors cursor-pointer shrink-0"
          :title="t('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingMoves" class="flex items-center justify-center py-8">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>

      <!-- Main layout -->
      <div v-else class="flex flex-col lg:grid lg:grid-cols-2 gap-3 md:gap-4 flex-1">
        <!-- Left: Learnset display -->
        <div class="flex flex-col gap-3 md:gap-4">
          <LearnsetDisplay :moves="currentMoves" />

          <!-- Hint Section -->
          <div v-if="settings.hintsEnabled" class="flex flex-col gap-4">
            <Button
              v-if="hintLevel < 2"
              variant="outline"
              class="cursor-pointer w-full md:w-auto"
              @click="hintLevel++"
              :disabled="progressValue > 0"
            >
              {{ hintLevel === 0 ? t('requestHint') : t('requestSecondHint') }}
            </Button>
            
            <HintDisplay
              :hint-level="hintLevel"
              :types="currentPokemon.types"
              :abilities="Object.values(currentPokemon.abilities).filter(a => !!a) as string[]"
            />
          </div>
        </div>

        <!-- Right: Selection & Results -->
        <div class="flex flex-col gap-4">
          <PokemonSelector
            :species-selection="speciesSelection"
            :selected-value="value"
            :disabled="progressValue > 0"
            @select="selectPokemon"
          />

          <!-- Result Message -->
          <div v-if="isCorrect !== null && progressValue > 0" ref="resultMessageRef">
            <div
              v-if="isCorrect"
              class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base flex items-center justify-center gap-3"
            >
              <div class="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                <SpritesRenderer class="max-w-full max-h-full" :generation="settings.generation" :name="currentPokemon.name" />
              </div>
              <div>{{ t('correctMessage', { pokemon: selectedPokemon?.label || value }) }}</div>
            </div>
            <div
              v-else
              class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base flex items-center justify-center gap-3"
            >
              <div class="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                <SpritesRenderer class="max-w-full max-h-full" :generation="settings.generation" :name="currentPokemon.name" />
              </div>
              <div>{{ t('incorrectMessage', { pokemon: getLocalizedName(currentPokemon.name) }) }}</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="progressValue > 0" class="flex flex-col gap-2">
            <Progress :model-value="progressValue" class="w-full" />
            <p class="text-center text-sm text-muted-foreground">
              {{ t('loading') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Congratulations Dialog -->
    <Dialog :open="showCongratulations" @update:open="(open) => showCongratulations = open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('congratulations.title') }}</DialogTitle>
          <DialogDescription>{{ incorrectGuesses === 0 ? t('congratulations.messagePerfect') : t('congratulations.message') }}</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold">{{ t('congratulations.finalScore') }}</p>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-green-600 dark:text-green-400 font-medium">✓ {{ t('correct') }}</span>
                <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ correctGuesses }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-red-600 dark:text-red-400 font-medium">✗ {{ t('incorrect') }}</span>
                <span class="text-2xl font-bold text-red-600 dark:text-red-400">{{ incorrectGuesses }}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold">{{ t('congratulations.timeElapsed') }}</p>
            <p class="text-2xl font-bold font-mono">{{ formatTime(elapsedTime) }}</p>
          </div>
          <Button
            @click="() => { showCongratulations = false; resetQuiz(); }"
            class="w-full cursor-pointer"
          >
            {{ t('congratulations.startNewQuiz') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
