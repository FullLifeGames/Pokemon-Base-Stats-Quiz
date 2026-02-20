<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import GenerationSelect from './GenerationSelect.vue'
import { Copy, Users, Eye, ArrowLeft, Loader2 } from 'lucide-vue-next'
import type { VsRoomSettings, VsPlayer, GameMode } from '@/types/vsMode'
import type { QuizMode } from '@/types/settings'
import type { GenerationNum } from '@pkmn/dex'

const { t } = useI18n()

const props = defineProps<{
  roomCode: string
  settings: VsRoomSettings
  myName: string
  myPlayerId: string
  isHost: boolean
  isConnected: boolean
  players: VsPlayer[]
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

const updateSetting = <K extends keyof VsRoomSettings>(key: K, value: VsRoomSettings[K] | number) => {
  if (props.gameState === 'idle') {
    if (key === 'generation' || key === 'minGeneration' || key === 'maxGeneration') {
      emit('update-settings', { ...props.settings, [key]: value as GenerationNum })
    } else {
      emit('update-settings', { ...props.settings, [key]: value })
    }
  }
}

const setGameMode = (mode: GameMode) => {
  emit('update-settings', { ...props.settings, gameMode: mode })
}

const setQuizMode = (mode: QuizMode) => {
  emit('update-settings', { ...props.settings, quizMode: mode })
}

const quizModes: { value: QuizMode; labelKey: string }[] = [
  { value: 'base-stat', labelKey: 'sidebar.quizModes.baseStat' },
  { value: 'learnset', labelKey: 'sidebar.quizModes.learnset' },
  { value: 'damage', labelKey: 'sidebar.quizModes.damage' },
]
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

            <!-- Quiz Mode (what kind of quiz) -->
            <div class="space-y-2">
              <label class="text-sm font-medium">{{ t('sidebar.quizMode') }}</label>
              <div class="flex rounded-lg border overflow-hidden">
                <button
                  v-for="mode in quizModes"
                  :key="mode.value"
                  class="flex-1 px-2 py-2 text-xs font-medium transition-colors cursor-pointer"
                  :class="settings.quizMode === mode.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
                  @click="setQuizMode(mode.value)"
                >
                  {{ t(mode.labelKey) }}
                </button>
              </div>
            </div>

            <!-- Game Mode -->
            <div class="space-y-2">
              <label class="text-sm font-medium">{{ t('vs.gameMode') }}</label>
              <div class="flex rounded-lg border overflow-hidden">
                <button
                  class="flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                  :class="settings.gameMode === 'rounds' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
                  @click="setGameMode('rounds')"
                >
                  {{ t('vs.roundsBased') }}
                </button>
                <button
                  class="flex-1 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                  :class="settings.gameMode === 'target-score' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'"
                  @click="setGameMode('target-score')"
                >
                  {{ t('vs.targetScoreBased') }}
                </button>
              </div>
            </div>

            <!-- Total Rounds (when rounds mode) -->
            <div v-if="settings.gameMode === 'rounds'" class="space-y-2">
              <label class="text-sm font-medium">{{ t('vs.totalRounds') }}</label>
              <Input
                type="number"
                :model-value="settings.totalRounds"
                @update:model-value="(val) => updateSetting('totalRounds', Math.max(1, typeof val === 'number' ? val : parseInt(String(val)) || 10))"
                min="1"
                max="50"
              />
            </div>

            <!-- Target Score (when target-score mode) -->
            <div v-if="settings.gameMode === 'target-score'" class="space-y-2">
              <label class="text-sm font-medium">{{ t('vs.targetScore') }}</label>
              <Input
                type="number"
                :model-value="settings.targetScore"
                @update:model-value="(val) => updateSetting('targetScore', Math.max(1000, typeof val === 'number' ? val : parseInt(String(val)) || 5000))"
                min="1000"
                max="50000"
                step="1000"
              />
            </div>

            <!-- Time Limit -->
            <div class="space-y-2">
              <label class="text-sm font-medium">{{ t('vs.timeLimit') }}</label>
              <Input
                type="number"
                :model-value="settings.timeLimit"
                @update:model-value="(val) => updateSetting('timeLimit', Math.max(10, typeof val === 'number' ? val : parseInt(String(val)) || 30))"
                min="10"
                max="300"
              />
              <p class="text-xs text-muted-foreground">{{ t('vs.timeLimitDesc') }}</p>
            </div>

            <!-- Collapsible filter & quiz settings -->
            <Accordion type="multiple" class="w-full" :default-value="['quiz']">
              <AccordionItem value="filters">
                <AccordionTrigger class="text-sm font-medium py-2 hover:no-underline cursor-pointer">
                  {{ t('sidebar.pokemonFilters') }}
                </AccordionTrigger>
                <AccordionContent class="space-y-3 pt-2">
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

                  <!-- Include Mega Pokémon -->
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="settings.includeMegaPokemon"
                      @change="(e) => updateSetting('includeMegaPokemon', (e.target as HTMLInputElement).checked)"
                      class="w-4 h-4 rounded border border-input cursor-pointer"
                      id="vsIncludeMegaPokemon"
                    />
                    <label for="vsIncludeMegaPokemon" class="text-sm cursor-pointer">
                      {{ t('sidebar.includeMegaPokemon') }}
                    </label>
                  </div>

                  <!-- Generation selects -->
                  <GenerationSelect
                    :model-value="settings.generation"
                    @update:model-value="(val) => updateSetting('generation', val)"
                    :label="t('sidebar.generation')"
                  />

                  <GenerationSelect
                    :model-value="settings.minGeneration"
                    @update:model-value="(val) => updateSetting('minGeneration', val)"
                    :label="t('sidebar.minGeneration')"
                  />

                  <GenerationSelect
                    :model-value="settings.maxGeneration"
                    @update:model-value="(val) => updateSetting('maxGeneration', val)"
                    :label="t('sidebar.maxGeneration')"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="quiz">
                <AccordionTrigger class="text-sm font-medium py-2 hover:no-underline cursor-pointer">
                  {{ t('sidebar.quizSettings') }}
                </AccordionTrigger>
                <AccordionContent class="space-y-3 pt-2">
                  <!-- Hints Enabled -->
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="settings.hintsEnabled"
                      @change="(e) => updateSetting('hintsEnabled', (e.target as HTMLInputElement).checked)"
                      class="w-4 h-4 rounded border border-input cursor-pointer"
                      id="vsHintsEnabled"
                    />
                    <label for="vsHintsEnabled" class="text-sm cursor-pointer">
                      {{ t('sidebar.hintsEnabled') }}
                    </label>
                  </div>

                  <!-- VGC Mode (only for Damage Quiz) -->
                  <div v-if="settings.quizMode === 'damage'" class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :checked="settings.vgc"
                      @change="(e) => updateSetting('vgc', (e.target as HTMLInputElement).checked)"
                      class="w-4 h-4 rounded border border-input cursor-pointer"
                      id="vsVgcMode"
                    />
                    <label for="vsVgcMode" class="text-sm cursor-pointer">
                      {{ t('sidebar.vgcMode') }}
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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

      <!-- Waiting for players (host created room) -->
      <template v-else-if="gameState === 'waiting-for-players'">
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
            <span>{{ t('vs.waitingForPlayers') }}</span>
          </div>

          <Button variant="outline" class="cursor-pointer" @click="emit('leave')">
            {{ t('vs.cancelRoom') }}
          </Button>
        </div>
      </template>

      <!-- Lobby (players present) -->
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

          <!-- Players list -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold">{{ t('vs.players') }} ({{ players.length }})</h3>
            <div class="space-y-2">
              <div
                v-for="player in players"
                :key="player.id"
                class="flex items-center gap-2 p-2.5 rounded-lg bg-muted"
              >
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {{ player.name.charAt(0).toUpperCase() }}
                </div>
                <span class="font-semibold text-sm truncate">{{ player.name }}</span>
                <span v-if="player.role === 'host'" class="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
                  {{ t('vs.host') }}
                </span>
                <span v-if="player.id === myPlayerId" class="text-[10px] text-muted-foreground shrink-0">
                  ({{ t('vs.you') }})
                </span>
              </div>
            </div>
          </div>

          <!-- Spectator count -->
          <div v-if="spectatorCount > 0" class="text-center text-sm text-muted-foreground">
            <Eye class="w-4 h-4 inline mr-1" />
            {{ t('vs.spectators', { count: spectatorCount }) }}
          </div>

          <!-- Settings display (for non-host) -->
          <div v-if="!isHost" class="space-y-2 bg-muted rounded-lg p-3 md:p-4 2xl:p-5">
            <h3 class="text-sm 2xl:text-base font-semibold">{{ t('sidebar.settings') }}</h3>
            <div class="text-sm 2xl:text-base space-y-1 text-muted-foreground">
              <div>{{ t('sidebar.quizMode') }}: {{ t(`sidebar.quizModes.${settings.quizMode === 'base-stat' ? 'baseStat' : settings.quizMode}`) }}</div>
              <div>{{ t('vs.gameMode') }}: {{ settings.gameMode === 'rounds' ? t('vs.roundsBased') : t('vs.targetScoreBased') }}</div>
              <div v-if="settings.gameMode === 'rounds'">{{ t('vs.totalRounds') }}: {{ settings.totalRounds }}</div>
              <div v-else>{{ t('vs.targetScore') }}: {{ settings.targetScore }}</div>
              <div>{{ t('vs.timeLimit') }}: {{ settings.timeLimit }}s</div>
              <div>{{ t('sidebar.fullyEvolvedOnly') }}: {{ settings.fullyEvolvedOnly ? '✓' : '✗' }}</div>
              <div>{{ t('sidebar.includeMegaPokemon') }}: {{ settings.includeMegaPokemon ? '✓' : '✗' }}</div>
              <div>{{ t('sidebar.generation') }}: {{ settings.generation }}</div>
            </div>
          </div>

          <!-- Start button (host only) -->
          <Button
            v-if="isHost"
            class="w-full cursor-pointer text-base md:text-lg 2xl:text-xl py-4 md:py-6 2xl:py-7"
            :disabled="players.length < 2"
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
