<script setup lang="ts">
import { computed } from 'vue'
import type { VsPlayer } from '@/types/vsMode'
import { useI18n } from 'vue-i18n'
import { CheckIcon, Loader2 } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{
  player: VsPlayer
  isMe: boolean
  showResult: boolean
  isWinner: boolean
}>()

const statusIcon = computed(() => {
  if (props.showResult) {
    if (props.player.lastGuessCorrect === true) return 'correct'
    if (props.player.lastGuessCorrect === false) return 'incorrect'
    return 'no-answer'
  }
  if (props.player.hasAnswered) return 'answered'
  return 'thinking'
})
</script>

<template>
  <div
    class="relative flex flex-col items-center gap-1 md:gap-1.5 p-2 md:p-3 lg:p-4 rounded-xl border-2 transition-all duration-300 min-w-[80px] md:min-w-[100px] max-w-[140px] md:max-w-[160px]"
    :class="{
      'border-primary bg-primary/5': isMe,
      'border-border bg-card': !isMe,
      'ring-2 ring-yellow-400 dark:ring-yellow-500': isWinner,
      'pt-5 md:pt-4': isWinner,
    }"
  >
    <!-- Winner crown -->
    <div v-if="isWinner" class="absolute -top-1 md:-top-2 left-1/2 -translate-x-1/2 text-base md:text-xl 2xl:text-2xl">👑</div>

    <!-- Player name -->
    <div class="font-semibold text-[10px] md:text-xs lg:text-sm truncate max-w-full">
      {{ player.name }}
      <span v-if="isMe" class="text-[9px] md:text-[10px] text-muted-foreground">({{ t('vs.you') }})</span>
    </div>

    <!-- Cumulative score -->
    <div class="text-lg md:text-2xl lg:text-3xl font-bold tabular-nums leading-tight">
      {{ player.score }}
    </div>

    <!-- Round score bubble (during results) -->
    <div v-if="showResult" class="text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full" :class="{
      'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': player.roundScore > 0,
      'bg-muted text-muted-foreground': player.roundScore === 0,
    }">
      +{{ player.roundScore }}
    </div>

    <!-- Status indicator during gameplay -->
    <div v-else class="flex items-center gap-0.5 text-[9px] md:text-[10px] lg:text-xs h-4 md:h-5">
      <template v-if="statusIcon === 'answered'">
        <span class="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
          <CheckIcon class="w-2.5 h-2.5 md:w-3 md:h-3" />
          {{ t('vs.answered') }}
        </span>
      </template>
      <template v-else-if="statusIcon === 'thinking'">
        <span class="text-muted-foreground flex items-center gap-0.5">
          <Loader2 class="w-2.5 h-2.5 md:w-3 md:h-3 animate-spin" />
          {{ t('vs.thinking') }}
        </span>
      </template>
    </div>

    <!-- Connection status -->
    <div v-if="!player.connected" class="text-[9px] md:text-[10px] text-red-500">
      {{ t('vs.disconnected') }}
    </div>
  </div>
</template>
