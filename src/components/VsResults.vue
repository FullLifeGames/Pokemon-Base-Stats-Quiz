<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-vue-next'
import type { VsPlayer, PlayerRole } from '@/types/vsMode'

const { t } = useI18n()

const props = defineProps<{
  host: VsPlayer
  guest: VsPlayer
  winner: PlayerRole
  myRole: PlayerRole
  elapsedTime: number
  rematchRequested: boolean
  rematchRequestedBy: PlayerRole | null
  opponentForfeited: boolean
}>()

const emit = defineEmits<{
  'request-rematch': []
  'accept-rematch': []
  'leave': []
}>()

const isWinner = props.winner === props.myRole
const winnerName = props.winner === 'host' ? props.host.name : props.guest.name
const showAcceptRematch = props.rematchRequested && props.rematchRequestedBy !== props.myRole

// Debug logging
console.log('[VsResults] Rematch state:', {
  myRole: props.myRole,
  rematchRequested: props.rematchRequested,
  rematchRequestedBy: props.rematchRequestedBy,
  showAcceptRematch,
})
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
        <p class="text-muted-foreground text-base md:text-lg 2xl:text-xl">
          {{ t('vs.winnerIs', { name: winnerName }) }}
        </p>
        <p v-if="opponentForfeited" class="text-sm 2xl:text-base text-orange-600 dark:text-orange-400 font-medium">
          {{ t('vs.wonByForfeit') }}
        </p>
      </div>

      <!-- Scores -->
      <div class="grid grid-cols-2 gap-3 md:gap-4 2xl:gap-6">
        <div class="p-3 md:p-4 2xl:p-6 rounded-xl border-2" :class="{
          'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950': winner === 'host',
          'border-border bg-card': winner !== 'host',
        }">
          <p class="text-xs md:text-sm 2xl:text-base text-muted-foreground">{{ host.name }}</p>
          <p class="text-3xl md:text-4xl 2xl:text-5xl font-bold mt-1">{{ host.score }}</p>
        </div>
        <div class="p-3 md:p-4 2xl:p-6 rounded-xl border-2" :class="{
          'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950': winner === 'guest',
          'border-border bg-card': winner !== 'guest',
        }">
          <p class="text-xs md:text-sm 2xl:text-base text-muted-foreground">{{ guest.name }}</p>
          <p class="text-3xl md:text-4xl 2xl:text-5xl font-bold mt-1">{{ guest.score }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-3 2xl:gap-4">
        <template v-if="myRole !== 'spectator' && !opponentForfeited">
          <Button
            v-if="showAcceptRematch"
            class="w-full cursor-pointer"
            @click="emit('accept-rematch')"
          >
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t('vs.acceptRematch') }}
          </Button>
          <Button
            v-else-if="!rematchRequested"
            class="w-full cursor-pointer"
            @click="emit('request-rematch')"
          >
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t('vs.requestRematch') }}
          </Button>
          <p v-else class="text-sm text-muted-foreground">
            {{ t('vs.rematchWaiting') }}
          </p>
        </template>
        <Button variant="outline" class="w-full cursor-pointer" @click="emit('leave')">
          <ArrowLeft class="w-4 h-4 mr-2" />
          {{ t('vs.backToMenu') }}
        </Button>
      </div>
    </div>
  </div>
</template>
