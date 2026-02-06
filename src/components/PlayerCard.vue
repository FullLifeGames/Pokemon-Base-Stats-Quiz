<script setup lang="ts">
import { computed } from 'vue'
import type { VsPlayer } from '@/types/vsMode'
import { useI18n } from 'vue-i18n'
import { CheckIcon, XIcon, Clock, Loader2 } from 'lucide-vue-next'

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
    class="relative flex flex-col items-center gap-1 md:gap-2 2xl:gap-3 p-2.5 md:p-4 lg:p-5 2xl:p-6 rounded-xl border-2 transition-all duration-300"
    :class="{
      'border-primary bg-primary/5': isMe,
      'border-border bg-card': !isMe,
      'ring-2 ring-yellow-400 dark:ring-yellow-500': isWinner,
    }"
  >
    <!-- Winner crown -->
    <div v-if="isWinner" class="absolute -top-1.5 md:-top-2 left-1/2 -translate-x-1/2 text-lg md:text-xl 2xl:text-2xl">👑</div>

    <!-- Player name -->
    <div class="font-semibold text-xs md:text-sm lg:text-base 2xl:text-lg truncate max-w-full">
      {{ player.name }}
      <span v-if="isMe" class="text-[10px] md:text-xs text-muted-foreground">({{ t('vs.you') }})</span>
    </div>

    <!-- Score -->
    <div class="text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold tabular-nums leading-tight">
      {{ player.score }}
    </div>

    <!-- Status indicator during gameplay -->
    <div class="flex items-center gap-1 text-[10px] md:text-xs lg:text-sm 2xl:text-base h-5 md:h-6 2xl:h-7">
      <template v-if="showResult">
        <span v-if="statusIcon === 'correct'" class="text-green-600 dark:text-green-400 flex items-center gap-0.5 md:gap-1">
          <CheckIcon class="w-3 h-3 md:w-4 md:h-4" />
          {{ t('correct') }}
        </span>
        <span v-else-if="statusIcon === 'incorrect'" class="text-red-600 dark:text-red-400 flex items-center gap-0.5 md:gap-1">
          <XIcon class="w-3 h-3 md:w-4 md:h-4" />
          {{ t('incorrect') }}
        </span>
        <span v-else class="text-muted-foreground flex items-center gap-0.5 md:gap-1">
          <Clock class="w-3 h-3 md:w-4 md:h-4" />
          {{ t('vs.noAnswer') }}
        </span>
      </template>
      <template v-else>
        <span v-if="statusIcon === 'answered'" class="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 md:gap-1">
          <CheckIcon class="w-3 h-3 md:w-4 md:h-4" />
          {{ t('vs.answered') }}
        </span>
        <span v-else-if="statusIcon === 'thinking'" class="text-muted-foreground flex items-center gap-0.5 md:gap-1">
          <Loader2 class="w-3 h-3 md:w-4 md:h-4 animate-spin" />
          {{ t('vs.thinking') }}
        </span>
      </template>
    </div>

    <!-- Connection status -->
    <div v-if="!player.connected" class="text-[10px] md:text-xs text-red-500">
      {{ t('vs.disconnected') }}
    </div>
  </div>
</template>
