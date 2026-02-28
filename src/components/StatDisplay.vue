<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  } | null
  showBst?: boolean
  compactTable?: boolean
}>()

const statEntries = computed(() => {
  if (!props.stats) return []
  const s = props.stats
  return [
    { key: 'hp', label: t('hp'), value: s.hp, color: 'bg-red-500', bgColor: 'bg-red-500/15', textColor: 'text-red-700 dark:text-red-300' },
    { key: 'atk', label: t('atk'), value: s.attack, color: 'bg-orange-500', bgColor: 'bg-orange-500/15', textColor: 'text-orange-700 dark:text-orange-300' },
    { key: 'def', label: t('def'), value: s.defense, color: 'bg-yellow-500', bgColor: 'bg-yellow-500/15', textColor: 'text-yellow-700 dark:text-yellow-300' },
    { key: 'spa', label: t('spa'), value: s.specialAttack, color: 'bg-blue-500', bgColor: 'bg-blue-500/15', textColor: 'text-blue-700 dark:text-blue-300' },
    { key: 'spd', label: t('spd'), value: s.specialDefense, color: 'bg-green-500', bgColor: 'bg-green-500/15', textColor: 'text-green-700 dark:text-green-300' },
    { key: 'spe', label: t('spe'), value: s.speed, color: 'bg-pink-500', bgColor: 'bg-pink-500/15', textColor: 'text-pink-700 dark:text-pink-300' },
  ]
})

const bst = computed(() => {
  if (!props.stats) return 0
  const s = props.stats
  return s.hp + s.attack + s.defense + s.specialAttack + s.specialDefense + s.speed
})
</script>

<template>
  <div
    v-if="stats"
    class="flex flex-col"
    :class="compactTable ? 'gap-0' : 'gap-1.5 md:gap-2.5 lg:gap-3 2xl:gap-4'"
  >
    <div
      v-for="stat in statEntries"
      :key="stat.key"
      class="flex items-center gap-2 md:gap-3 2xl:gap-4 p-1.5 md:p-2.5 lg:p-3 2xl:p-4"
      :class="{
        [stat.bgColor]: true,
        'rounded-lg': !compactTable,
        'rounded-t-lg': compactTable && stat.key === 'hp',
        'rounded-b-lg': compactTable && stat.key === 'spe',
      }"
    >
      <span class="text-xs md:text-sm lg:text-sm 2xl:text-base font-bold w-8 md:w-9 lg:w-10 2xl:w-12 text-center" :class="stat.textColor">{{ stat.label }}</span>
      <div class="flex-1 h-2.5 md:h-3.5 lg:h-4 2xl:h-5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="stat.color"
          :style="{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }"
        />
      </div>
      <span class="text-sm md:text-sm lg:text-base 2xl:text-lg font-bold tabular-nums w-8 md:w-9 lg:w-10 2xl:w-12 text-right" :class="stat.textColor">{{ stat.value }}</span>
    </div>
    <!-- BST -->
    <div v-if="showBst !== false" class="flex items-center justify-end gap-2 pr-1" :class="compactTable ? 'mt-2' : ''">
      <span class="text-xs md:text-sm 2xl:text-sm font-semibold text-muted-foreground uppercase">{{ t('bst') }}</span>
      <span class="text-sm md:text-sm lg:text-base 2xl:text-lg font-bold tabular-nums">{{ bst }}</span>
    </div>
  </div>
</template>
