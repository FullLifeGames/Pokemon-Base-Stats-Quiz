<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DamageScenario } from '@/composables/useDamageCalc'
import type { GenerationNum } from '@pkmn/dex'
import SpritesRenderer from '@/components/renderer/SpritesRenderer.vue'
import { getLocalizedPokemonName } from '@/lib/pokemonNameHelper'

const { t, locale } = useI18n()

function localizedName(name?: string): string {
  if (!name) return ''
  return getLocalizedPokemonName(name, String(locale?.value || ''))
}

const props = defineProps<{
  scenario: DamageScenario | null
  /** Whether to reveal the actual damage (after answer). */
  showAnswer?: boolean
  /** Level of Pokémon (50 for VGC, 100 otherwise). */
  level?: number
  /** Generation for sprite rendering. */
  generation?: GenerationNum
}>()

function formatEvs(evs?: Record<string, number | undefined>): string {
  if (!evs) return '—'
  const statNames: Record<string, string> = {
    hp: 'HP', at: 'Atk', df: 'Def', sa: 'SpA', sd: 'SpD', sp: 'Spe',
  }
  return Object.entries(evs)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${v} ${statNames[k] || k}`)
    .join(' / ')
}

function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    Sun: '☀️',
    Rain: '🌧️',
    Sand: '🌪️',
    Snow: '❄️',
    Hail: '🧊',
  }
  return icons[weather] || '🌤️'
}

function getTerrainIcon(terrain: string): string {
  const icons: Record<string, string> = {
    Grassy: '🌿',
    Electric: '⚡',
    Psychic: '🔮',
    Misty: '🌸',
  }
  return icons[terrain] || '🗺️'
}
</script>

<template>
  <div v-if="scenario" class="flex flex-col gap-3 md:gap-4">
    <!-- Active Field Effects -->
    <div v-if="scenario.fieldEffects && (scenario.fieldEffects.weather || scenario.fieldEffects.terrain)" class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 md:p-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] md:text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
          {{ t('damage.activeEffects') }}:
        </span>
        <div class="flex gap-2 flex-wrap">
          <span v-if="scenario.fieldEffects.weather" class="text-xs md:text-sm font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            {{ getWeatherIcon(scenario.fieldEffects.weather) }} {{ t(`damage.weather.${scenario.fieldEffects.weather.toLowerCase()}`) }}
          </span>
          <span v-if="scenario.fieldEffects.terrain" class="text-xs md:text-sm font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            {{ getTerrainIcon(scenario.fieldEffects.terrain) }} {{ t(`damage.terrain.${scenario.fieldEffects.terrain.toLowerCase()}`) }}
          </span>
        </div>
      </div>
    </div>

    <!-- VS layout -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-4">
      <!-- Attacker -->
      <div class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 p-2.5 md:p-3 2xl:p-4">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="text-[10px] md:text-xs font-bold uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
            {{ t('damage.attacker') }}
          </span>
        </div>
        <div class="flex items-start gap-2 mb-2">
          <div class="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shrink-0">
            <SpritesRenderer v-if="generation" class="max-w-full max-h-full" :generation="generation" :name="scenario.attackerName" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-sm md:text-base lg:text-lg">{{ localizedName(scenario.attackerName) }}</h3>
            <p class="text-[10px] md:text-xs text-muted-foreground italic">{{ scenario.attackerSetName }}</p>
            <p v-if="level" class="text-[10px] md:text-xs font-semibold text-red-600 dark:text-red-400">{{ t('damage.level', { level }) }}</p>
          </div>
        </div>
        <div class="text-[10px] md:text-xs space-y-0.5 text-muted-foreground">
          <div v-if="scenario.attackerSet.ability"><strong>{{ t('damage.ability') }}:</strong> {{ scenario.attackerSet.ability }}</div>
          <div v-if="scenario.attackerSet.item"><strong>{{ t('damage.item') }}:</strong> {{ scenario.attackerSet.item }}</div>
          <div v-if="scenario.attackerSet.nature"><strong>{{ t('damage.nature') }}:</strong> {{ scenario.attackerSet.nature }}</div>
          <div v-if="scenario.attackerSet.evs"><strong>{{ t('damage.evs') }}:</strong> {{ formatEvs(scenario.attackerSet.evs) }}</div>
          <div v-if="scenario.attackerTeraType" class="font-semibold text-purple-600 dark:text-purple-400">
            💎 <strong>{{ t('damage.teraType') }}:</strong> {{ scenario.attackerTeraType }}
          </div>
        </div>
      </div>

      <!-- Move indicator -->
      <div class="flex flex-col items-center justify-center self-center gap-1 px-1">
        <span class="text-lg md:text-2xl">⚔️</span>
        <div class="bg-primary text-primary-foreground text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full text-center whitespace-nowrap max-w-28 md:max-w-none truncate">
          {{ scenario.moveName }}
        </div>
        <span class="text-[10px] md:text-xs text-muted-foreground">→</span>
      </div>

      <!-- Defender -->
      <div class="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 md:p-3 2xl:p-4">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="text-[10px] md:text-xs font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
            {{ t('damage.defender') }}
          </span>
        </div>
        <div class="flex items-start gap-2 mb-2">
          <div class="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shrink-0">
            <SpritesRenderer v-if="generation" class="max-w-full max-h-full" :generation="generation" :name="scenario.defenderName" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-sm md:text-base lg:text-lg">{{ localizedName(scenario.defenderName) }}</h3>
            <p class="text-[10px] md:text-xs text-muted-foreground italic">{{ scenario.defenderSetName }}</p>
            <p v-if="level" class="text-[10px] md:text-xs font-semibold text-blue-600 dark:text-blue-400">{{ t('damage.level', { level }) }}</p>
          </div>
        </div>
        <div class="text-[10px] md:text-xs space-y-0.5 text-muted-foreground">
          <div v-if="scenario.defenderSet.ability"><strong>{{ t('damage.ability') }}:</strong> {{ scenario.defenderSet.ability }}</div>
          <div v-if="scenario.defenderSet.item"><strong>{{ t('damage.item') }}:</strong> {{ scenario.defenderSet.item }}</div>
          <div v-if="scenario.defenderSet.nature"><strong>{{ t('damage.nature') }}:</strong> {{ scenario.defenderSet.nature }}</div>
          <div v-if="scenario.defenderSet.evs"><strong>{{ t('damage.evs') }}:</strong> {{ formatEvs(scenario.defenderSet.evs) }}</div>
          <div v-if="scenario.defenderTeraType" class="font-semibold text-purple-600 dark:text-purple-400">
            💎 <strong>{{ t('damage.teraType') }}:</strong> {{ scenario.defenderTeraType }}
          </div>
        </div>
      </div>
    </div>

    <!-- Answer reveal -->
    <div
      v-if="showAnswer"
      class="text-center py-2 md:py-3 bg-muted rounded-lg"
    >
      <p class="text-xs md:text-sm text-muted-foreground">{{ t('damage.actualDamage') }}</p>
      <p class="text-xl md:text-2xl font-bold font-mono">
        {{ scenario.damageRange[0] }}% – {{ scenario.damageRange[1] }}%
      </p>
      <p class="text-xs text-muted-foreground">
        ({{ t('damage.average') }}: {{ scenario.damagePercent }}%)
      </p>
    </div>
  </div>
</template>
