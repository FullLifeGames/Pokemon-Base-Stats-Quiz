<script setup lang="ts">
import { computed } from 'vue'
import { LightbulbIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { MAX_DAMAGE_PERCENT } from '@/composables/useDamageCalc'

const { t } = useI18n()

const props = defineProps<{
  damagePercent: number
  hintLevel: number
}>()

// Hint 1: Damage range (which third of the slider)
const damageRangeHint = computed(() => {
  const actual = props.damagePercent
  const third = MAX_DAMAGE_PERCENT / 3
  if (actual < third) return `0-${Math.round(third)}%`
  if (actual < third * 2) return `${Math.round(third)}-${Math.round(third * 2)}%`
  return `${Math.round(third * 2)}-${MAX_DAMAGE_PERCENT}%`
})

// Hint 2: OHKO/2HKO/3HKO indicator
const koIndicator = computed(() => {
  const damage = props.damagePercent
  if (damage >= 100) return 'OHKO (One-Hit Knockout)'
  if (damage >= 50) return '2HKO (Two-Hit Knockout)'
  if (damage >= 33.4) return '3HKO (Three-Hit Knockout)'
  if (damage >= 25) return '4HKO (Four-Hit Knockout)'
  return '5+HKO (Five or More Hits to Knockout)'
})
</script>

<template>
  <div v-if="hintLevel >= 1" class="bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm">
    <div class="flex flex-col gap-1.5 md:gap-2">
      <div class="flex items-center gap-1.5 md:gap-2">
        <LightbulbIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <div>
          <strong>{{ t('hints.damageRange') }}:</strong>
          <span class="ml-1 md:ml-2">{{ damageRangeHint }}</span>
        </div>
      </div>
      <div v-if="hintLevel >= 2" class="flex items-center gap-1.5 md:gap-2">
        <LightbulbIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <div>
          <strong>{{ t('hints.koIndicator') }}:</strong>
          <span class="ml-1 md:ml-2">{{ koIndicator }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
