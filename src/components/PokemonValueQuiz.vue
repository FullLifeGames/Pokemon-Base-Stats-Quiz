<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useI18n } from 'vue-i18n'
import { useQuizLogic, type SpeciesFilterOptions } from '@/composables/useQuizLogic'
import SpritesRenderer from '@/components/renderer/SpritesRenderer.vue'
import ValueOptionGrid from './ValueOptionGrid.vue'
import DismissibleInfoBanner from './DismissibleInfoBanner.vue'
import type { QuizSettings } from '@/types/settings'
import { generateValueQuizOptions, getPokemonValueTarget, getValueQuizTextKeys, getValueQuizUnit, type ValueQuizMode } from '@/lib/valueQuizOptions'
import { useQuizFlowTiming } from '@/composables/useQuizFlowTiming'
import { useSoloQuizLifecycle } from '@/composables/useSoloQuizLifecycle'

const { t, locale } = useI18n()

const props = defineProps<{
  settings: QuizSettings
  mode: ValueQuizMode
}>()

const correctGuesses = ref(0)
const incorrectGuesses = ref(0)
const showCongratulations = ref(false)
const submittedGuess = ref<number | null>(null)
const answerOptions = ref<number[]>([])
const resultMessageRef = ref<HTMLDivElement | null>(null)
const {
  elapsedTime,
  progressValue,
  startTimer,
  stopTimer,
  resetElapsedTime,
  resetProgress,
  runLoadingTransition,
  formatTime,
} = useQuizFlowTiming()

const speciesOptions = computed<SpeciesFilterOptions>(() => props.settings)

const {
  generateRandomPokemon,
  getLocalizedName,
} = useQuizLogic(speciesOptions, locale)

const currentPokemon = ref(generateRandomPokemon())

function getTargetValue(): number {
  return getPokemonValueTarget(props.mode, currentPokemon.value).targetValue
}

function refreshAnswerOptions() {
  answerOptions.value = generateValueQuizOptions(getTargetValue(), props.mode)
}

const targetValue = computed(() => getTargetValue())
const modeTextKeys = computed(() => getValueQuizTextKeys(props.mode))

const modeUnit = computed(() => getValueQuizUnit(props.mode))

const modeTitle = computed(() => t(modeTextKeys.value.titleKey))

const modeExplanation = computed(() => t(modeTextKeys.value.explanationKey))

const modePrompt = computed(() => t(modeTextKeys.value.promptKey))

const isCorrect = computed(() => {
  if (submittedGuess.value === null) return null
  return submittedGuess.value === formattedTargetValue.value
})

const formattedTargetValue = computed(() => {
  const decimals = 1
  return Number(targetValue.value.toFixed(decimals))
})

const selectedPokemonName = computed(() => getLocalizedName(currentPokemon.value.name))

const resetValueQuizState = () => {
  currentPokemon.value = generateRandomPokemon()
  submittedGuess.value = null
  refreshAnswerOptions()
  correctGuesses.value = 0
  incorrectGuesses.value = 0
  showCongratulations.value = false
}

watch(() => [props.settings.generation, props.settings.minGeneration, props.settings.maxGeneration, props.settings.fullyEvolvedOnly, props.settings.includeMegaPokemon], () => {
  resetQuiz()
})

watch(() => correctGuesses.value, (newVal) => {
  if (newVal === props.settings.maxScore && newVal > 0) {
    resetProgress()
    stopTimer()
    showCongratulations.value = true
  }
})

onMounted(() => {
  startTimer()
})

const advanceValueQuizQuestion = () => {
  currentPokemon.value = generateRandomPokemon()
  submittedGuess.value = null
  refreshAnswerOptions()
}

const { resetQuiz, advanceQuestion } = useSoloQuizLifecycle({
  resetProgress,
  resetElapsedTime,
  startTimer,
  onResetState: resetValueQuizState,
  onAdvanceState: advanceValueQuizQuestion,
})

function handleValueSubmit(choice: number) {
  if (progressValue.value > 0) return

  submittedGuess.value = choice

  if (isCorrect.value) {
    correctGuesses.value++
  } else {
    incorrectGuesses.value++
  }

  stopTimer()
  runLoadingTransition(() => {
    void advanceQuestion()
  })

  setTimeout(() => {
    if (resultMessageRef.value && window.innerWidth < 768) {
      resultMessageRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

watch(currentPokemon, () => {
  if (progressValue.value === 0) {
    refreshAnswerOptions()
  }
})

onMounted(() => {
  refreshAnswerOptions()
})
</script>

<template>
  <div class="w-full h-full min-h-screen flex flex-col p-3 md:p-4 lg:p-6">
    <div class="flex flex-col gap-2 md:gap-3 flex-1">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-semibold">
            {{ modeTitle }}
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

        <DismissibleInfoBanner class="md:flex-1 md:max-w-3xl md:mx-2 md:self-center">
          {{ modeExplanation }}
        </DismissibleInfoBanner>

        <Button class="cursor-pointer w-full md:w-auto md:self-center" @click="resetQuiz">
          {{ t('resetQuiz') }}
        </Button>
      </div>

      <div class="rounded-xl border bg-card px-4 py-6 md:p-8 flex flex-col items-center gap-4">
        <div class="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
          <SpritesRenderer class="max-w-full max-h-full" :generation="settings.generation" :name="currentPokemon.name" />
        </div>
        <p class="text-lg md:text-2xl font-semibold text-center">
          {{ selectedPokemonName }}
        </p>
        <p class="text-sm text-muted-foreground text-center">
          {{ modePrompt }}
        </p>
      </div>

      <ValueOptionGrid
        :options="answerOptions"
        :unit="modeUnit"
        :disabled="progressValue > 0"
        :selected-option="submittedGuess"
        @select="handleValueSubmit"
      />

      <div v-if="isCorrect !== null && progressValue > 0" ref="resultMessageRef">
        <div
          v-if="isCorrect"
          class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base text-center"
        >
          {{ t('valueQuiz.correctGuess', { guess: submittedGuess, value: formattedTargetValue, unit: modeUnit }) }}
        </div>
        <div
          v-else
          class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base text-center"
        >
          {{ t('valueQuiz.incorrectGuess', { guess: submittedGuess, value: formattedTargetValue, unit: modeUnit }) }}
        </div>
      </div>

      <div v-if="progressValue > 0" class="flex flex-col gap-2">
        <Progress :model-value="progressValue" class="w-full" />
        <p class="text-center text-sm text-muted-foreground">
          {{ t('loading') }}
        </p>
      </div>
    </div>

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
