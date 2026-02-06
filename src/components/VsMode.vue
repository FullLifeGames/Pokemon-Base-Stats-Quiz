<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useVsGame } from '@/composables/useVsGame'
import { useI18n } from 'vue-i18n'
import VsLobby from './VsLobby.vue'
import VsGame from './VsGame.vue'
import VsResults from './VsResults.vue'
import type { VsRoomSettings } from '@/types/vsMode'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const {
  gameState,
  roomCode,
  settings,
  host,
  guest,
  spectators,
  currentRound,
  roundNumber,
  countdown,
  rematchRequested,
  rematchRequestedBy,
  matchWinner,
  myName,
  myRole,
  elapsedTime,
  isHost,
  isSpectator,
  isConnected,
  connectionError,
  opponentAnswered,
  opponentForfeited,
  species,
  createRoom,
  joinExistingRoom,
  rejoinRoom,
  startGame,
  submitGuess,
  requestRematch,
  acceptRematch,
  updateSettings,
  leaveGame,
  forfeitGame,
  getSavedSession,
} = useVsGame()

const showForfeitDialog = ref(false)

const hostName = computed(() => host.value?.name || null)
const guestName = computed(() => guest.value?.name ?? null)
const spectatorCount = computed(() => spectators.value.length)

// Update URL when room code changes
watch(roomCode, (code) => {
  if (code && route.path !== `/vs/${code}`) {
    router.replace(`/vs/${code}`)
  }
})

// Auto-reconnect on mount
onMounted(async () => {
  const session = getSavedSession()
  const routeCode = route.params.roomCode as string | undefined

  if (session && (session.roomCode === routeCode || !routeCode)) {
    // We have a saved session — attempt reconnection
    await rejoinRoom(session)
  } else if (routeCode && !session) {
    // URL has a room code but no session — user clicked a shared link, go to join
    // Pre-fill the join code (VsLobby will handle it)
    roomCode.value = routeCode.toUpperCase()
  }
})

function handleLeave() {
  leaveGame()
  router.push('/')
}

function handleQuit() {
  showForfeitDialog.value = true
}

function confirmForfeit() {
  showForfeitDialog.value = false
  forfeitGame()
  router.push('/')
}

function handleJoinRoom(code: string, asSpectator: boolean) {
  joinExistingRoom(code, asSpectator)
}

function handleUpdateSettings(newSettings: VsRoomSettings) {
  updateSettings(newSettings)
}

function handleUpdateName(name: string) {
  myName.value = name
}

const showLobby = computed(() =>
  ['idle', 'waiting-for-opponent', 'lobby'].includes(gameState.value)
)

const showCountdown = computed(() => gameState.value === 'countdown')

const showGame = computed(() =>
  ['playing', 'round-result'].includes(gameState.value)
)

const showResults = computed(() => gameState.value === 'match-end')
</script>

<template>
  <!-- Lobby / Waiting / Room Setup -->
  <VsLobby
    v-if="showLobby"
    :room-code="roomCode"
    :settings="settings"
    :my-name="myName"
    :is-host="isHost"
    :is-connected="isConnected"
    :host-name="hostName"
    :guest-name="guestName"
    :spectator-count="spectatorCount"
    :connection-error="connectionError"
    :game-state="gameState"
    @create-room="createRoom"
    @join-room="handleJoinRoom"
    @start-game="startGame"
    @update-settings="handleUpdateSettings"
    @update-name="handleUpdateName"
    @leave="handleLeave"
  />

  <!-- Countdown -->
  <div v-else-if="showCountdown" class="min-h-[100dvh] flex items-center justify-center">
    <div class="text-center space-y-4">
      <p class="text-muted-foreground text-base md:text-lg 2xl:text-xl">{{ $t('vs.getReady') }}</p>
      <div class="text-6xl md:text-8xl 2xl:text-[10rem] font-bold animate-bounce tabular-nums">
        {{ countdown }}
      </div>
    </div>
  </div>

  <!-- VS Game -->
  <VsGame
    v-else-if="showGame && currentRound && guest"
    :host="host"
    :guest="guest"
    :current-round="currentRound"
    :round-number="roundNumber"
    :my-role="myRole"
    :is-spectator="isSpectator"
    :game-state="gameState"
    :species="species"
    :settings="{ maxScore: settings.maxScore, timeLimit: settings.timeLimit }"
    :opponent-answered="opponentAnswered"
    @submit-guess="submitGuess"
    @quit="handleQuit"
  />

  <!-- Match Results -->
  <VsResults
    v-else-if="showResults && guest && matchWinner"
    :host="host"
    :guest="guest"
    :winner="matchWinner"
    :my-role="myRole"
    :elapsed-time="elapsedTime"
    :rematch-requested="rematchRequested"
    :rematch-requested-by="rematchRequestedBy"
    :opponent-forfeited="opponentForfeited"
    @request-rematch="requestRematch"
    @accept-rematch="acceptRematch"
    @leave="handleLeave"
  />

  <!-- Forfeit Confirmation Dialog -->
  <Dialog v-model:open="showForfeitDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('vs.quitTitle') }}</DialogTitle>
        <DialogDescription>{{ t('vs.quitWarning') }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2">
        <Button variant="outline" class="cursor-pointer" @click="showForfeitDialog = false">
          {{ t('vs.cancelRoom') }}
        </Button>
        <Button variant="destructive" class="cursor-pointer" @click="confirmForfeit">
          {{ t('vs.confirmQuit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
