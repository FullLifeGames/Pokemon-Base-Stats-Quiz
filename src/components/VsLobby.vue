<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import GenerationSelect from './GenerationSelect.vue'
import { Copy, Users, Eye, ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { VsRoomSettings } from '@/types/vsMode'

const { t } = useI18n()

const props = defineProps<{
  roomCode: string
  settings: VsRoomSettings
  myName: string
  isHost: boolean
  isConnected: boolean
  hostName: string | null
  guestName: string | null
  spectatorCount: number
  connectionError: string | null
  gameState: string
}>()

const emit = defineEmits<{
  'create-room': []
  'join-room': [code: string, asSpectator: boolean]
  'start-game': []
  'update-settings': [settings: VsRoomSettings]
  'update-name': [name: string]
  'leave': []
}>()

const joinCode = ref('')
const activeTab = ref<'create' | 'join'>('create')

// Pre-fill join code from route if roomCode is set but we're in idle state
watchEffect(() => {
  if (props.gameState === 'idle' && props.roomCode && !joinCode.value) {
    joinCode.value = props.roomCode
    activeTab.value = 'join'
  }
})

const copyRoomCode = async () => {
  await navigator.clipboard.writeText(props.roomCode)
}

const updateSetting = <K extends keyof VsRoomSettings>(key: K, value: VsRoomSettings[K]) => {
  // Only allow settings updates before room is created (during idle state)
  if (props.gameState === 'idle') {
    emit('update-settings', { ...props.settings, [key]: value })
  }
}
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 md:p-8 2xl:p-12">
    <div class="w-full space-y-4 md:space-y-6 2xl:space-y-8" style="max-width: min(32rem, 88vw);">
      <!-- Back button -->
      <Button variant="ghost" class="cursor-pointer" @click="emit('leave')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        {{ t('vs.backToMenu') }}
      </Button>

      <h1 class="text-2xl md:text-4xl 2xl:text-5xl font-bold text-center">{{ t('vs.lobby') }}</h1>

      <!-- Not yet in a room -->
      <template v-if="gameState === 'idle'">
        <!-- Tab selection -->
        <div class="flex rounded-lg border overflow-hidden">
          <button
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            :class="activeTab === 'create' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
            @click="activeTab = 'create'"
          >
            {{ t('vs.createRoom') }}
          </button>
          <button
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer"
            :class="activeTab === 'join' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
            @click="activeTab = 'join'"
          >
            {{ t('vs.joinRoom') }}
          </button>
        </div>

        <!-- Create Room Tab -->
        <div v-if="activeTab === 'create'" class="space-y-4">
          <!-- Player Name -->
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t('vs.yourName') }}</label>
            <Input
              :model-value="myName"
              @update:model-value="(val) => emit('update-name', String(val))"
              :placeholder="t('vs.enterName')"
            />
          </div>

          <Separator />

          <!-- Settings -->
          <div class="space-y-4">
            <h3 class="text-sm font-semibold">{{ t('sidebar.settings') }}</h3>
            
            <!-- Fully Evolved Only -->
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="settings.fullyEvolvedOnly"
                @change="(e) => updateSetting('fullyEvolvedOnly', (e.target as HTMLInputElement).checked)"
                class="w-4 h-4 rounded border border-input cursor-pointer"
                id="vsFullyEvolved"
              />
              <label for="vsFullyEvolved" class="text-sm cursor-pointer">
                {{ t('sidebar.fullyEvolvedOnly') }}
              </label>
            </div>

            <!-- Max Score -->
            <div class="space-y-2">
              <label class="text-sm font-medium">{{ t('sidebar.maxScore') }}</label>
              <Input
                type="number"
                :model-value="settings.maxScore"
                @update:model-value="(val) => updateSetting('maxScore', Math.max(1, typeof val === 'number' ? val : parseInt(String(val)) || 10))"
                min="1"
                max="999"
              />
            </div>

            <!-- Time Limit -->
            <div class="space-y-2">
              <label class="text-sm font-medium">{{ t('vs.timeLimit') }}</label>
              <Input
                type="number"
                :model-value="settings.timeLimit"
                @update:model-value="(val) => updateSetting('timeLimit', Math.max(0, typeof val === 'number' ? val : parseInt(String(val)) || 0))"
                min="0"
                max="300"
              />
              <p class="text-xs text-muted-foreground">{{ t('vs.timeLimitDesc') }}</p>
            </div>

            <!-- Min Generation -->
            <GenerationSelect
              :model-value="settings.minGeneration"
              @update:model-value="(val) => updateSetting('minGeneration', val)"
              :label="t('sidebar.minGeneration')"
            />

            <!-- Max Generation -->
            <GenerationSelect
              :model-value="settings.maxGeneration"
              @update:model-value="(val) => updateSetting('maxGeneration', val)"
              :label="t('sidebar.maxGeneration')"
            />

            <!-- Generation -->
            <GenerationSelect
              :model-value="settings.generation"
              @update:model-value="(val) => updateSetting('generation', val)"
              :label="t('sidebar.generation')"
            />
          </div>

          <Button class="w-full cursor-pointer" @click="emit('create-room')">
            {{ t('vs.createRoom') }}
          </Button>
        </div>

        <!-- Join Room Tab -->
        <div v-if="activeTab === 'join'" class="space-y-4">
          <!-- Player Name -->
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t('vs.yourName') }}</label>
            <Input
              :model-value="myName"
              @update:model-value="(val) => emit('update-name', String(val))"
              :placeholder="t('vs.enterName')"
            />
          </div>

          <Separator />

          <!-- Room Code Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t('vs.roomCode') }}</label>
            <Input
              v-model="joinCode"
              :placeholder="t('vs.enterRoomCode')"
              class="text-center text-lg tracking-widest uppercase font-mono"
              maxlength="6"
            />
          </div>

          <!-- Error -->
          <div v-if="connectionError" class="text-sm text-red-600 dark:text-red-400 text-center">
            {{ t(`vs.errors.${connectionError}`) }}
          </div>

          <div class="flex flex-col gap-2">
            <Button
              class="w-full cursor-pointer"
              :disabled="joinCode.length < 6"
              @click="emit('join-room', joinCode, false)"
            >
              <Users class="w-4 h-4 mr-2" />
              {{ t('vs.joinAsPlayer') }}
            </Button>
            <Button
              variant="outline"
              class="w-full cursor-pointer"
              :disabled="joinCode.length < 6"
              @click="emit('join-room', joinCode, true)"
            >
              <Eye class="w-4 h-4 mr-2" />
              {{ t('vs.joinAsSpectator') }}
            </Button>
          </div>
        </div>
      </template>

      <!-- Waiting for opponent (host created room) -->
      <template v-else-if="gameState === 'waiting-for-opponent'">
        <div class="text-center space-y-6">
          <!-- Room Code Display -->
          <div class="space-y-2">
            <p class="text-sm text-muted-foreground">{{ t('vs.shareCode') }}</p>
            <div class="flex items-center justify-center gap-2">
              <div class="text-3xl md:text-5xl 2xl:text-6xl font-mono font-bold tracking-[0.3em] bg-muted px-4 md:px-6 2xl:px-8 py-3 md:py-4 2xl:py-5 rounded-xl">
                {{ roomCode }}
              </div>
              <Button variant="outline" size="icon" class="cursor-pointer" @click="copyRoomCode">
                <Copy class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div class="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>{{ t('vs.waitingForOpponent') }}</span>
          </div>

          <Button variant="outline" class="cursor-pointer" @click="emit('leave')">
            {{ t('vs.cancelRoom') }}
          </Button>
        </div>
      </template>

      <!-- Lobby (both players present) -->
      <template v-else-if="gameState === 'lobby'">
        <div class="space-y-6">
          <!-- Room Code -->
          <div class="text-center">
            <p class="text-xs text-muted-foreground">{{ t('vs.roomCode') }}</p>
            <div class="flex items-center justify-center gap-2">
              <span class="font-mono font-bold text-lg tracking-widest">{{ roomCode }}</span>
              <Button variant="ghost" size="icon" class="h-6 w-6 cursor-pointer" @click="copyRoomCode">
                <Copy class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <!-- Players -->
          <div class="flex items-center justify-center gap-3 md:gap-4 2xl:gap-6">
            <div class="flex flex-col items-center gap-1 p-3 md:p-4 2xl:p-5 rounded-lg bg-muted min-w-[100px] md:min-w-[120px]">
              <span class="text-xs 2xl:text-sm text-muted-foreground">{{ t('vs.host') }}</span>
              <span class="font-semibold text-sm md:text-base 2xl:text-lg">{{ hostName || '...' }}</span>
              <span v-if="isHost" class="text-xs text-primary">({{ t('vs.you') }})</span>
            </div>
            <span class="text-xl md:text-2xl 2xl:text-3xl font-bold text-muted-foreground">VS</span>
            <div class="flex flex-col items-center gap-1 p-3 md:p-4 2xl:p-5 rounded-lg bg-muted min-w-[100px] md:min-w-[120px]">
              <span class="text-xs 2xl:text-sm text-muted-foreground">{{ t('vs.guest') }}</span>
              <span class="font-semibold text-sm md:text-base 2xl:text-lg">{{ guestName || '...' }}</span>
              <span v-if="!isHost" class="text-xs text-primary">({{ t('vs.you') }})</span>
            </div>
          </div>

          <!-- Spectator count -->
          <div v-if="spectatorCount > 0" class="text-center text-sm text-muted-foreground">
            <Eye class="w-4 h-4 inline mr-1" />
            {{ t('vs.spectators', { count: spectatorCount }) }}
          </div>

          <!-- Settings display (for guest) -->
          <div v-if="!isHost" class="space-y-2 bg-muted rounded-lg p-3 md:p-4 2xl:p-5">
            <h3 class="text-sm 2xl:text-base font-semibold">{{ t('sidebar.settings') }}</h3>
            <div class="text-sm 2xl:text-base space-y-1 text-muted-foreground">
              <div>{{ t('sidebar.maxScore') }}: {{ settings.maxScore }}</div>
              <div>{{ t('vs.timeLimit') }}: {{ settings.timeLimit > 0 ? `${settings.timeLimit}s` : t('vs.noTimeLimit') }}</div>
              <div>{{ t('sidebar.fullyEvolvedOnly') }}: {{ settings.fullyEvolvedOnly ? '✓' : '✗' }}</div>
              <div>{{ t('sidebar.generation') }}: {{ settings.generation }}</div>
            </div>
          </div>

          <!-- Start button (host only) -->
          <Button
            v-if="isHost"
            class="w-full cursor-pointer text-base md:text-lg 2xl:text-xl py-4 md:py-6 2xl:py-7"
            :disabled="!guestName"
            @click="emit('start-game')"
          >
            {{ t('vs.startMatch') }}
          </Button>
          <p v-else class="text-center text-sm text-muted-foreground">
            {{ t('vs.waitingForHost') }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
