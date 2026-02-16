<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DamageScenario } from '@/composables/useDamageCalc'

const { t } = useI18n()

const props = defineProps<{
  scenario: DamageScenario | null
  /** Whether to reveal the actual damage (after answer). */
  showAnswer?: boolean
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
</script>

<template>
  <div v-if="scenario" class="flex flex-col gap-3 md:gap-4">
    <!-- VS layout -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-4">
      <!-- Attacker -->
      <div class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 p-2.5 md:p-3 2xl:p-4">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="text-[10px] md:text-xs font-bold uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
            {{ t('damage.attacker') }}
          </span>
        </div>
        <h3 class="font-bold text-sm md:text-base lg:text-lg">{{ scenario.attackerName }}</h3>
        <p class="text-[10px] md:text-xs text-muted-foreground italic mb-1.5">{{ scenario.attackerSetName }}</p>
        <div class="text-[10px] md:text-xs space-y-0.5 text-muted-foreground">
          <div v-if="scenario.attackerSet.ability"><strong>{{ t('damage.ability') }}:</strong> {{ scenario.attackerSet.ability }}</div>
          <div v-if="scenario.attackerSet.item"><strong>{{ t('damage.item') }}:</strong> {{ scenario.attackerSet.item }}</div>
          <div v-if="scenario.attackerSet.nature"><strong>{{ t('damage.nature') }}:</strong> {{ scenario.attackerSet.nature }}</div>
          <div v-if="scenario.attackerSet.evs"><strong>{{ t('damage.evs') }}:</strong> {{ formatEvs(scenario.attackerSet.evs) }}</div>
          <div v-if="scenario.attackerSet.teraType">
            <strong>{{ t('damage.teraType') }}:</strong> {{ scenario.attackerSet.teraType }}
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
        <h3 class="font-bold text-sm md:text-base lg:text-lg">{{ scenario.defenderName }}</h3>
        <p class="text-[10px] md:text-xs text-muted-foreground italic mb-1.5">{{ scenario.defenderSetName }}</p>
        <div class="text-[10px] md:text-xs space-y-0.5 text-muted-foreground">
          <div v-if="scenario.defenderSet.ability"><strong>{{ t('damage.ability') }}:</strong> {{ scenario.defenderSet.ability }}</div>
          <div v-if="scenario.defenderSet.item"><strong>{{ t('damage.item') }}:</strong> {{ scenario.defenderSet.item }}</div>
          <div v-if="scenario.defenderSet.nature"><strong>{{ t('damage.nature') }}:</strong> {{ scenario.defenderSet.nature }}</div>
          <div v-if="scenario.defenderSet.evs"><strong>{{ t('damage.evs') }}:</strong> {{ formatEvs(scenario.defenderSet.evs) }}</div>
          <div v-if="scenario.defenderSet.teraType">
            <strong>{{ t('damage.teraType') }}:</strong> {{ scenario.defenderSet.teraType }}
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
