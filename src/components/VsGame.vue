<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, LogOut, Swords, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useI18n } from 'vue-i18n'
import { useQuizLogic, type SpeciesFilterOptions } from '@/composables/useQuizLogic'
import { MAX_DAMAGE_PERCENT } from '@/composables/useDamageCalc'
import PlayerCard from './PlayerCard.vue'
import StatDisplay from './StatDisplay.vue'
import LearnsetDisplay from './LearnsetDisplay.vue'
import DamageScenarioDisplay from './DamageScenarioDisplay.vue'
import PokemonSelector from './PokemonSelector.vue'
import HintDisplay from './HintDisplay.vue'
import SpritesRenderer from '@/components/renderer/SpritesRenderer.vue'
import type { VsPlayer, VsRound, VsRoomSettings, PlayerRoundResult } from '@/types/vsMode'
import type { QuizMode } from '@/types/settings'
import type { Species, GenerationNum } from '@pkmn/dex'

const { t, locale } = useI18n()

const props = defineProps<{
  players: VsPlayer[]
  myPlayerId: string
  currentRound: VsRound
  roundNumber: number
  myRole: 'host' | 'player' | 'spectator'
  isSpectator: boolean
  gameState: string
  species: Species[]
  settings: VsRoomSettings
}>()

const emit = defineEmits<{
  'submit-guess': [pokemonId: string]
  'submit-damage-guess': [damagePercent: number]
  'quit': []
}>()

const value = ref('')
const damageGuessValue = ref([50])
const hasAnswered = ref(false)
const infoBannerDismissed = ref(false)

const quizMode = computed<QuizMode>(() => props.settings.quizMode ?? 'base-stat')

// Shared quiz logic (stats extraction, localized names, species selection)
const speciesOptions = computed<SpeciesFilterOptions>(() => props.settings)

const {
  speciesSelection,
  getPokemonStats,
  getLocalizedName,
  findSpecies,
} = useQuizLogic(speciesOptions, locale)

const generation = computed<GenerationNum>(() => speciesOptions.value.generation as GenerationNum)

// Current pokemon stats
const currentStats = computed(() => {
  const pokemon = findSpecies(props.currentRound.pokemonId)
  if (!pokemon) return null
  return getPokemonStats(pokemon)
})

const selectedPokemon = computed(() =>
  speciesSelection.value.find((pokemon) => pokemon.value === value.value)
)

// Timer display
const timerDisplay = computed(() => {
  if (props.settings.timeLimit <= 0) return null
  const remaining = props.currentRound.timeRemaining
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const timerProgress = computed(() => {
  if (props.settings.timeLimit <= 0) return 100
  return (props.currentRound.timeRemaining / props.settings.timeLimit) * 100
})

const timerUrgent = computed(() => {
  if (props.settings.timeLimit <= 0) return false
  return props.currentRound.timeRemaining <= Math.floor(props.settings.timeLimit * 1 / 4)
})

const timerWarning = computed(() => {
  if (props.settings.timeLimit <= 0) return false
  return props.currentRound.timeRemaining <= Math.floor(props.settings.timeLimit / 2)
})

// How many have answered
const answeredCount = computed(() => props.players.filter(p => p.hasAnswered).length)

// Round result
const isRoundResult = computed(() => props.gameState === 'round-result')

// Sorted round results (highest score first)
const sortedRoundResults = computed<PlayerRoundResult[]>(() => {
  if (!props.currentRound.results || props.currentRound.results.length === 0) return []
  return [...props.currentRound.results].sort((a, b) => b.score - a.score)
})

// Top scorer for this round (for crown display)
const topRoundScorer = computed(() => {
  if (sortedRoundResults.value.length === 0) return null
  const top = sortedRoundResults.value[0]
  if (!top || top.score === 0) return null
  return top.playerId
})

// Answer display for spectators
const correctPokemonName = computed(() => {
  if (quizMode.value === 'damage') {
    const scenario = props.currentRound.damageScenario
    return scenario ? `${scenario.damagePercent}%` : '?'
  }
  return getLocalizedName(props.currentRound.pokemonId)
})

// Info banner text
const infoBannerText = computed(() => {
  switch (quizMode.value) {
    case 'learnset': return t('learnset.explanation')
    case 'damage': return t('damage.vsExplanation', { tolerance: 5 })
    default: return t('vs.identifyStats')
  }
})

// Game progress display
const progressLabel = computed(() => {
  if (props.settings.gameMode === 'rounds') {
    return t('vs.roundOf', { n: props.roundNumber, total: props.settings.totalRounds })
  }
  return t('vs.targetScoreLabel', { score: props.settings.targetScore })
})

// Reset selection on new round
watch(() => props.roundNumber, () => {
  value.value = ''
  damageGuessValue.value = [50]
  hasAnswered.value = false
})

function selectPokemon(selectedValue: string) {
  if (props.isSpectator) return
  if (hasAnswered.value) return

  value.value = selectedValue
  hasAnswered.value = true
  emit('submit-guess', value.value)
}

function submitDamageAnswer() {
  if (props.isSpectator) return
  if (hasAnswered.value) return
  const guess = damageGuessValue.value[0] ?? 0

  hasAnswered.value = true
  emit('submit-damage-guess', guess)
}
</script>

<template>
  <div class="w-full min-h-[100dvh] flex flex-col gap-3 md:gap-4 lg:gap-5 p-3 md:p-5 lg:p-6 xl:p-8 2xl:p-10 mx-auto" style="max-width: min(90rem, 92vw);">
    <!-- Round header with timer -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 md:gap-3 min-w-0">
          <div class="flex items-center gap-1.5 md:gap-2 shrink-0">
            <Swords class="w-4 h-4 md:w-5 md:h-5 2xl:w-6 2xl:h-6 text-primary" />
            <h2 class="text-base md:text-xl lg:text-2xl 2xl:text-3xl font-bold whitespace-nowrap">
              {{ t('vs.round', { n: roundNumber }) }}
            </h2>
          </div>
          <span class="hidden sm:inline text-xs md:text-sm 2xl:text-base text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
            {{ progressLabel }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div
            v-if="timerDisplay"
            class="flex items-center gap-1.5 font-mono text-sm md:text-lg lg:text-xl 2xl:text-2xl font-bold px-2 md:px-3 2xl:px-4 py-1 md:py-1.5 rounded-lg"
            :class="{
              'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse': timerUrgent,
              'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400': timerWarning && !timerUrgent,
              'bg-muted': !timerWarning,
            }"
          >
            <Clock class="w-3.5 h-3.5 md:w-4 md:h-4" />
            {{ timerDisplay }}
          </div>
          <Button v-if="!isSpectator" variant="ghost" size="icon" class="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-destructive cursor-pointer" @click="emit('quit')" :title="t('vs.quit')">
            <LogOut class="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
      <!-- Timer progress bar -->
      <div v-if="settings.timeLimit > 0" class="w-full h-1 md:h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-1000 ease-linear"
          :class="{
            'bg-red-500': timerUrgent,
            'bg-yellow-500': timerWarning && !timerUrgent,
            'bg-primary': !timerWarning,
          }"
          :style="{ width: `${timerProgress}%` }"
        />
      </div>
    </div>

    <!-- Player Cards — flexible row that wraps -->
    <div class="flex flex-wrap gap-2 md:gap-3 justify-center">
      <PlayerCard
        v-for="player in players"
        :key="player.id"
        :player="player"
        :is-me="player.id === myPlayerId"
        :show-result="isRoundResult"
        :is-winner="isRoundResult && topRoundScorer === player.id"
      />
    </div>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-3 md:gap-4 lg:gap-6 2xl:gap-8 min-h-0">
      <!-- Left column: stats + hints -->
      <div class="flex flex-col gap-3 md:gap-4">
        <!-- Spectator: See the answer -->
        <div v-if="isSpectator" class="bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 px-3 md:px-4 py-2 md:py-3 rounded-lg text-center font-semibold text-sm">
          🔍 {{ t('vs.spectatorAnswer') }}: {{ correctPokemonName }}
        </div>

        <!-- Info banner -->
        <div v-if="!infoBannerDismissed" class="hidden md:flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-4 2xl:px-5 py-3 2xl:py-4 rounded-lg text-sm 2xl:text-base">
          <p>{{ infoBannerText }}</p>
          <button
            @click="infoBannerDismissed = true"
            class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors cursor-pointer shrink-0"
            :title="t('close')"
          >
            <X class="w-4 h-4 2xl:w-5 2xl:h-5" />
          </button>
        </div>

        <!-- Quiz content: mode-dependent -->
        <template v-if="quizMode === 'base-stat'">
          <StatDisplay :stats="currentStats" :show-bst="true" />
          <HintDisplay
            :hint-level="currentRound.hintLevel"
            :types="currentRound.pokemonTypes"
            :abilities="currentRound.pokemonAbilities"
          />
        </template>

        <template v-else-if="quizMode === 'learnset'">
          <LearnsetDisplay :moves="currentRound.learnsetMoves ?? null" />
          <HintDisplay
            :hint-level="currentRound.hintLevel"
            :types="currentRound.pokemonTypes"
            :abilities="currentRound.pokemonAbilities"
          />
        </template>

        <template v-else-if="quizMode === 'damage'">
          <DamageScenarioDisplay
            :scenario="currentRound.damageScenario ?? null"
            :show-answer="isRoundResult"
            :level="settings.vgc ? 50 : 100"
            :generation="generation"
          />
        </template>
      </div>

      <!-- Right column: selector + result -->
      <div class="flex flex-col gap-3 md:gap-4">
        <!-- Selection (only for players, not spectators, not during results) -->
        <div v-if="!isSpectator && !isRoundResult" class="flex flex-col gap-2 md:gap-3">
          <!-- Current selection indicator -->
          <div v-if="hasAnswered" class="text-center py-1.5 md:py-2 bg-muted/50 rounded-lg">
            <p class="text-xs md:text-sm text-muted-foreground">
              <template v-if="quizMode === 'damage'">
                {{ t('vs.youAnswered', { pokemon: damageGuessValue[0] + '%' }) }}
              </template>
              <template v-else>
                {{ t('vs.youAnswered', { pokemon: selectedPokemon?.label || value }) }}
              </template>
            </p>
            <p class="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
              {{ t('vs.playersAnswered', { n: answeredCount, total: players.length }) }}
            </p>
          </div>

          <!-- Pokemon selector for base-stat / learnset modes -->
          <PokemonSelector
            v-if="!hasAnswered && quizMode !== 'damage'"
            :species-selection="speciesSelection"
            :selected-value="value"
            @select="selectPokemon"
          />

          <!-- Damage guess input for damage mode -->
          <div v-if="!hasAnswered && quizMode === 'damage'" class="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <p class="text-sm text-muted-foreground">{{ t('damage.guessPrompt') }}</p>
            <div class="w-full space-y-3">
              <div class="flex items-center justify-center gap-3">
                <span class="text-3xl md:text-4xl font-bold font-mono text-primary">{{ damageGuessValue[0] }}%</span>
              </div>
              <Slider
                v-model="damageGuessValue"
                :min="0"
                :max="MAX_DAMAGE_PERCENT"
                :step="1"
                class="w-full"
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{{ MAX_DAMAGE_PERCENT }}%</span>
              </div>
            </div>
            <Button @click="submitDamageAnswer" class="cursor-pointer w-full">
              {{ t('damage.submit') }}
            </Button>
          </div>
        </div>

        <!-- Round Result -->
        <div v-if="isRoundResult" class="flex items-center justify-center lg:flex-1">
          <div class="rounded-xl px-5 md:px-6 2xl:px-8 py-4 md:py-5 2xl:py-6 inline-flex flex-col items-center gap-2 md:gap-3 shadow-sm border w-full max-w-sm 2xl:max-w-md bg-card">
            <!-- Sprite for base-stat / learnset modes -->
            <div v-if="quizMode !== 'damage'" class="w-20 h-20 md:w-24 md:h-24 2xl:w-32 2xl:h-32 flex items-center justify-center">
              <SpritesRenderer class="max-w-full max-h-full" :generation="generation" :name="currentRound.pokemonId" />
            </div>
            <!-- Damage answer icon -->
            <div v-else class="text-4xl md:text-5xl 2xl:text-6xl">
              🎯
            </div>
            <p class="text-xs md:text-sm 2xl:text-base opacity-80">
              {{ t('vs.correctAnswer') }}: <strong>{{ correctPokemonName }}</strong>
            </p>
            <!-- Per-player round scores -->
            <div class="w-full space-y-1">
              <div
                v-for="result in sortedRoundResults"
                :key="result.playerId"
                class="flex items-center justify-between text-sm px-2 py-1.5 rounded"
                :class="{
                  'bg-green-50 dark:bg-green-950': result.correct,
                  'bg-red-50 dark:bg-red-950': !result.correct && result.guess,
                  'bg-muted': !result.guess,
                }"
              >
                <span class="font-medium truncate mr-2">{{ result.playerName }}</span>
                <span
                  class="font-bold shrink-0"
                  :class="{
                    'text-green-600 dark:text-green-400': result.score > 0,
                    'text-muted-foreground': result.score === 0,
                  }"
                >
                  +{{ result.score }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
