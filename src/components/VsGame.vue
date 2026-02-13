<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, LogOut, Swords, Zap, X } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { useQuizLogic } from '@/composables/useQuizLogic'
import PlayerCard from './PlayerCard.vue'
import StatDisplay from './StatDisplay.vue'
import PokemonSelector from './PokemonSelector.vue'
import HintDisplay from './HintDisplay.vue'
import SpritesRenderer from '@/components/renderer/SpritesRenderer.vue'
import type { VsPlayer, VsRound } from '@/types/vsMode'
import type { Species, GenerationNum } from '@pkmn/dex'

const { t, locale } = useI18n()

const props = defineProps<{
  host: VsPlayer
  guest: VsPlayer
  currentRound: VsRound
  roundNumber: number
  myRole: 'host' | 'guest' | 'spectator'
  isSpectator: boolean
  gameState: string
  species: Species[]
  settings: { maxScore: number; timeLimit: number }
  opponentAnswered: boolean
}>()

const emit = defineEmits<{
  'submit-guess': [pokemonId: string]
  'quit': []
}>()

const value = ref('')
const hasAnswered = ref(false)
const infoBannerDismissed = ref(false)

// Shared quiz logic (stats extraction, localized names)
// Species list comes from props (managed by useVsGame), so we just
// need the helpers from the composable.
const speciesOptions = computed(() => ({
  generation: 9,
  minGeneration: 1,
  maxGeneration: 9,
  fullyEvolvedOnly: false,
}))

const {
  getPokemonStats,
  getLocalizedName,
} = useQuizLogic(speciesOptions, locale)

const generation = computed<GenerationNum>(() => speciesOptions.value.generation as GenerationNum)

// Computed: current pokemon stats (from round)
const currentStats = computed(() => {
  const pokemon = props.species.find(s => s.name === props.currentRound.pokemonId)
  if (!pokemon) return null
  return getPokemonStats(pokemon)
})

const speciesSelection = computed(() =>
  props.species.map((pokemon) => ({
    label: getLocalizedName(pokemon.name),
    value: pokemon.name,
  }))
)

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

// Score progress
const hostProgress = computed(() => (props.host.score / props.settings.maxScore) * 100)
const guestProgress = computed(() => (props.guest.score / props.settings.maxScore) * 100)

// Round winner display
const isRoundResult = computed(() => props.gameState === 'round-result')

const roundWinnerName = computed(() => {
  if (!props.currentRound.winner || props.currentRound.winner === 'none') return null
  if (props.currentRound.winner === 'host') return props.host.name
  return props.guest.name
})

// Answer display for spectators
const correctPokemonName = computed(() => {
  return getLocalizedName(props.currentRound.pokemonId)
})

// Reset selection on new round
watch(() => props.roundNumber, () => {
  value.value = ''
  hasAnswered.value = false
})

function selectPokemon(selectedValue: string) {
  if (props.isSpectator) return
  // Allow selection/changes until opponent has answered
  if (hasAnswered.value && props.opponentAnswered) return
  
  value.value = selectedValue === value.value ? '' : selectedValue
  hasAnswered.value = true
  emit('submit-guess', value.value)
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
            {{ t('vs.firstTo', { n: settings.maxScore }) }}
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

    <!-- Player Cards with VS divider -->
    <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 md:gap-3 lg:gap-4 2xl:gap-6 items-center">
      <div class="flex flex-col gap-1.5 min-w-0">
        <PlayerCard
          :player="host"
          :is-me="myRole === 'host'"
          :show-result="isRoundResult"
          :is-winner="isRoundResult && currentRound.winner === 'host'"
        />
        <Progress :model-value="hostProgress" class="h-1 md:h-1.5 2xl:h-2" />
      </div>
      <div class="flex flex-col items-center justify-center shrink-0">
        <span class="text-[10px] md:text-xs 2xl:text-sm font-bold text-muted-foreground bg-muted px-1.5 md:px-2 py-0.5 md:py-1 rounded-md">VS</span>
      </div>
      <div class="flex flex-col gap-1.5 min-w-0">
        <PlayerCard
          :player="guest"
          :is-me="myRole === 'guest'"
          :show-result="isRoundResult"
          :is-winner="isRoundResult && currentRound.winner === 'guest'"
        />
        <Progress :model-value="guestProgress" class="h-1 md:h-1.5 2xl:h-2" />
      </div>
    </div>

    <!-- Main content area — on large screens, 2-column: stats left, selector right -->
    <div class="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-3 md:gap-4 lg:gap-6 2xl:gap-8 min-h-0">
      <!-- Left column: stats + hints -->
      <div class="flex flex-col gap-3 md:gap-4">
        <!-- Spectator: See the answer -->
        <div v-if="isSpectator" class="bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 px-3 md:px-4 py-2 md:py-3 rounded-lg text-center font-semibold text-sm">
          🔍 {{ t('vs.spectatorAnswer') }}: {{ correctPokemonName }}
        </div>

        <!-- Info banner (hidden on mobile to save space, shown on md+) -->
        <div v-if="!infoBannerDismissed" class="hidden md:flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-4 2xl:px-5 py-3 2xl:py-4 rounded-lg text-sm 2xl:text-base">
          <p>{{ t('vs.identifyStats') }}</p>
          <button 
            @click="infoBannerDismissed = true" 
            class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors cursor-pointer shrink-0"
            :title="t('close')"
          >
            <X class="w-4 h-4 2xl:w-5 2xl:h-5" />
          </button>
        </div>

        <!-- Stats Display Section -->
        <StatDisplay :stats="currentStats" :show-bst="true" />

        <!-- Auto Hints -->
        <HintDisplay
          :hint-level="currentRound.hintLevel"
          :types="currentRound.pokemonTypes"
          :abilities="currentRound.pokemonAbilities"
        />
      </div>

      <!-- Right column: selector + result -->
      <div class="flex flex-col gap-3 md:gap-4">
        <!-- Selection (only for players, not spectators) -->
        <div v-if="!isSpectator && !isRoundResult" class="flex flex-col gap-2 md:gap-3">
          <!-- Current selection indicator -->
          <div v-if="hasAnswered" class="text-center py-1.5 md:py-2 bg-muted/50 rounded-lg">
            <p class="text-xs md:text-sm text-muted-foreground">
              {{ t('vs.currentSelection') }}: <strong class="text-foreground">{{ selectedPokemon?.label || value }}</strong>
            </p>
            <p v-if="!opponentAnswered" class="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
              {{ t('vs.canChangeAnswer') }}
            </p>
            <p v-else class="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
              {{ t('vs.waitingForResults') }}
            </p>
          </div>

          <!-- Pokemon selector - always show unless both have answered -->
          <PokemonSelector
            v-if="!(hasAnswered && opponentAnswered)"
            :species-selection="speciesSelection"
            :selected-value="value"
            @select="selectPokemon"
          />
        </div>

        <!-- Round Result -->
        <div v-if="isRoundResult" class="flex items-center justify-center lg:flex-1">
          <div class="rounded-xl px-5 md:px-6 2xl:px-8 py-4 md:py-5 2xl:py-6 inline-flex flex-col items-center gap-1.5 md:gap-2 2xl:gap-3 shadow-sm border w-full max-w-sm 2xl:max-w-md" :class="{
            'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100': currentRound.winner !== 'none',
            'bg-muted border-border': currentRound.winner === 'none',
          }">
            <div class="w-20 h-20 md:w-24 md:h-24 2xl:w-32 2xl:h-32 flex items-center justify-center">
              <SpritesRenderer class="max-w-full max-h-full" :generation="generation" :name="currentRound.pokemonId" />
            </div>
            <p class="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold">
              <template v-if="currentRound.winner === 'none'">
                {{ t('vs.roundTie') }}
              </template>
              <template v-else>
                {{ t('vs.roundWinner', { name: roundWinnerName }) }}
              </template>
            </p>
            <p v-if="currentRound.wonBySpeed && currentRound.winner !== 'none'" class="text-xs md:text-sm 2xl:text-base font-medium flex items-center gap-1">
              <Zap class="w-3 h-3 md:w-3.5 md:h-3.5 2xl:w-4 2xl:h-4" />
              {{ t('vs.wonBySpeed') }}
            </p>
            <p class="text-xs md:text-sm 2xl:text-base opacity-80">
              {{ t('vs.correctAnswer') }}: <strong>{{ correctPokemonName }}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
