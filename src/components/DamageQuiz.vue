<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { computed, ref, watch, onMounted } from 'vue'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useI18n } from 'vue-i18n'
import { useDamageCalc, type DamageScenario } from '@/composables/useDamageCalc'
import DamageScenarioDisplay from '@/components/DamageScenarioDisplay.vue'
import type { QuizSettings } from '@/types/settings'
import type { GenerationNum } from '@pkmn/dex'

const { t } = useI18n()

const props = defineProps({
  settings: {
    type: Object as () => QuizSettings,
    required: true,
  },
})

const TOLERANCE = 5 // ±5% tolerance for correct answer

const progressValue = ref(0)
const correctGuesses = ref(0)
const incorrectGuesses = ref(0)
const elapsedTime = ref(0)
const showCongratulations = ref(false)
const showExplanation = ref(true)
const hasAnswered = ref(false)
const guessValue = ref([50])
const resultMessageRef = ref<HTMLDivElement | null>(null)
let timerInterval: ReturnType<typeof setInterval> | null = null
let loadingInterval: number | undefined

const generation = computed<GenerationNum>(() => props.settings.generation as GenerationNum)

const filterOptions = computed(() => ({
  generation: props.settings.generation,
  minGeneration: props.settings.minGeneration,
  maxGeneration: props.settings.maxGeneration,
  fullyEvolvedOnly: props.settings.fullyEvolvedOnly,
  includeMegaPokemon: props.settings.includeMegaPokemon,
}))

const { generateDamageScenario, isDamageGuessCorrect, waitUntilReady } = useDamageCalc(generation, filterOptions)

const currentScenario = ref<DamageScenario | null>(null)

function generateNewScenario() {
  currentScenario.value = generateDamageScenario()
}

const resetQuiz = async () => {
  await waitUntilReady()
  generateNewScenario()
  guessValue.value = [50]
  hasAnswered.value = false
  progressValue.value = 0
  clearInterval(loadingInterval)
  correctGuesses.value = 0
  incorrectGuesses.value = 0
  elapsedTime.value = 0
  showCongratulations.value = false
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

// Watch for settings changes and regenerate scenario
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

const isCorrect = computed(() => {
  if (!hasAnswered.value || !currentScenario.value) return null
  const guess = guessValue.value[0] ?? 0
  return isDamageGuessCorrect(guess, currentScenario.value.damagePercent, TOLERANCE)
})

// Start on mount
onMounted(async () => {
  await waitUntilReady()
  generateNewScenario()
  startTimer()
})

const nextScenario = () => {
  generateNewScenario()
  guessValue.value = [50]
  hasAnswered.value = false
  progressValue.value = 0
  startTimer()
}

function setLoading() {
  progressValue.value = 0
  loadingInterval = setInterval(() => {
    progressValue.value += Math.random() * 5
    if (progressValue.value >= 100) {
      progressValue.value = 100
      clearInterval(loadingInterval)
      setTimeout(nextScenario, 500)
    }
  }, 100)
}

function submitGuess() {
  if (hasAnswered.value || !currentScenario.value) return
  const guess = guessValue.value[0] ?? 0

  hasAnswered.value = true

  if (isDamageGuessCorrect(guess, currentScenario.value.damagePercent, TOLERANCE)) {
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
            {{ t('damage.title') }}
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
        <p>{{ t('damage.explanation', { tolerance: TOLERANCE }) }}</p>
        <button
          @click="showExplanation = false"
          class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors cursor-pointer shrink-0"
          :title="t('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- No scenario -->
      <div v-if="!currentScenario" class="text-center py-8 text-muted-foreground">
        {{ t('damage.noScenario') }}
      </div>

      <!-- Main layout -->
      <div v-else class="flex flex-col gap-4 md:gap-6 flex-1">
        <!-- Damage Scenario Display -->
        <DamageScenarioDisplay :scenario="currentScenario" :show-answer="hasAnswered" />

        <!-- Guess Input -->
        <div class="flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
          <label class="text-sm md:text-base font-semibold text-center">
            {{ t('damage.guessPrompt') }}
          </label>
          <div class="w-full space-y-3">
            <div class="flex items-center justify-center gap-3">
              <span class="text-3xl md:text-4xl font-bold font-mono text-primary">{{ guessValue[0] }}%</span>
            </div>
            <Slider
              v-model="guessValue"
              :min="0"
              :max="200"
              :step="1"
              :disabled="hasAnswered"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>200%</span>
            </div>
          </div>
          <Button
            @click="submitGuess"
            :disabled="hasAnswered"
            class="cursor-pointer w-full"
          >
            {{ t('damage.submit') }}
          </Button>
        </div>

        <!-- Result Message -->
        <div v-if="hasAnswered && isCorrect !== null" ref="resultMessageRef">
          <div
            v-if="isCorrect"
            class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base text-center"
          >
            {{ t('damage.correctGuess', { guess: guessValue[0], actual: currentScenario.damagePercent }) }}
          </div>
          <div
            v-else
            class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base text-center"
          >
            {{ t('damage.incorrectGuess', { guess: guessValue[0], actual: currentScenario.damagePercent }) }}
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

    <!-- Congratulations Dialog -->
    <Dialog :open="showCongratulations" @update:open="(open) => showCongratulations = open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('congratulations.title') }}</DialogTitle>
          <DialogDescription>{{ t('congratulations.message') }}</DialogDescription>
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
