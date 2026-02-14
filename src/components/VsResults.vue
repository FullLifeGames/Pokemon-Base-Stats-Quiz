<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-vue-next'
import type { VsPlayer, PlayerRole } from '@/types/vsMode'

const { t } = useI18n()

const props = defineProps<{
  players: VsPlayer[]
  matchWinner: string // player ID
  myPlayerId: string
  myRole: PlayerRole
  elapsedTime: number
  isHost: boolean
}>()

const emit = defineEmits<{
  'restart': []
  'leave': []
}>()

const sortedPlayers = computed(() =>
  [...props.players].sort((a, b) => b.score - a.score)
)

const winnerPlayer = computed(() =>
  props.players.find(p => p.id === props.matchWinner)
)

const isWinner = computed(() => props.matchWinner === props.myPlayerId)
</script>

<template>
  <div class="min-h-[100dvh] flex items-center justify-center p-4 md:p-8 2xl:p-12">
    <div class="w-full space-y-4 md:space-y-6 2xl:space-y-8 text-center" style="max-width: min(28rem, 88vw);">
      <!-- Trophy -->
      <div class="flex justify-center">
        <div class="w-20 h-20 md:w-24 md:h-24 2xl:w-32 2xl:h-32 rounded-full flex items-center justify-center" :class="{
          'bg-yellow-100 dark:bg-yellow-950': isWinner,
          'bg-muted': !isWinner,
        }">
          <Trophy class="w-10 h-10 md:w-12 md:h-12 2xl:w-16 2xl:h-16" :class="{
            'text-yellow-500': isWinner,
            'text-muted-foreground': !isWinner,
          }" />
        </div>
      </div>

      <!-- Result text -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-4xl 2xl:text-5xl font-bold">
          <template v-if="myRole === 'spectator'">
            {{ t('vs.matchOver') }}
          </template>
          <template v-else-if="isWinner">
            {{ t('vs.youWin') }}
          </template>
          <template v-else>
            {{ t('vs.youLose') }}
          </template>
        </h1>
        <p v-if="winnerPlayer" class="text-muted-foreground text-base md:text-lg 2xl:text-xl">
          {{ t('vs.winnerIs', { name: winnerPlayer.name }) }}
        </p>
      </div>

      <!-- Leaderboard -->
      <div class="space-y-2">
        <div
          v-for="(player, index) in sortedPlayers"
          :key="player.id"
          class="flex items-center gap-3 p-3 rounded-lg border-2 text-left"
          :class="{
            'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950': index === 0,
            'border-border bg-card': index > 0,
          }"
        >
          <span class="text-xl font-bold w-8 text-center shrink-0" :class="{
            'text-yellow-500': index === 0,
            'text-muted-foreground': index > 0,
          }">
            {{ index === 0 ? '🏆' : `#${index + 1}` }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ player.name }}</p>
            <p v-if="player.id === myPlayerId" class="text-xs text-primary">({{ t('vs.you') }})</p>
          </div>
          <p class="text-2xl font-bold tabular-nums shrink-0">{{ player.score }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3 2xl:gap-4">
        <Button v-if="isHost" class="w-full cursor-pointer" @click="emit('restart')">
          <RotateCcw class="w-4 h-4 mr-2" />
          {{ t('vs.playAgain') }}
        </Button>
        <p v-else-if="myRole !== 'spectator'" class="text-sm text-muted-foreground">
          {{ t('vs.hostCanRestart') }}
        </p>
        <Button variant="outline" class="w-full cursor-pointer" @click="emit('leave')">
          <ArrowLeft class="w-4 h-4 mr-2" />
          {{ t('vs.backToMenu') }}
        </Button>
      </div>
    </div>
  </div>
</template>
