<script setup lang="ts">
import { computed } from 'vue'
import type { MovesByType, MoveInfo } from '@/composables/useLearnsetData'

const props = defineProps<{
  moves: MovesByType | null
}>()

/** Pokémon type → Tailwind color classes */
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  Normal:   { bg: 'bg-gray-200 dark:bg-gray-700',     text: 'text-gray-800 dark:text-gray-200',   border: 'border-gray-300 dark:border-gray-600' },
  Fire:     { bg: 'bg-red-100 dark:bg-red-900/40',     text: 'text-red-800 dark:text-red-200',     border: 'border-red-300 dark:border-red-700' },
  Water:    { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-800 dark:text-blue-200',   border: 'border-blue-300 dark:border-blue-700' },
  Electric: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700' },
  Grass:    { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  Ice:      { bg: 'bg-cyan-100 dark:bg-cyan-900/40',   text: 'text-cyan-800 dark:text-cyan-200',   border: 'border-cyan-300 dark:border-cyan-700' },
  Fighting: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' },
  Poison:   { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  Ground:   { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  Flying:   { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  Psychic:  { bg: 'bg-pink-100 dark:bg-pink-900/40',   text: 'text-pink-800 dark:text-pink-200',   border: 'border-pink-300 dark:border-pink-700' },
  Bug:      { bg: 'bg-lime-100 dark:bg-lime-900/40',   text: 'text-lime-800 dark:text-lime-200',   border: 'border-lime-300 dark:border-lime-700' },
  Rock:     { bg: 'bg-yellow-700/20 dark:bg-yellow-900/60', text: 'text-yellow-900 dark:text-yellow-100', border: 'border-yellow-600 dark:border-yellow-700' },
  Ghost:    { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-700' },
  Dragon:   { bg: 'bg-indigo-200 dark:bg-indigo-900/40', text: 'text-indigo-900 dark:text-indigo-200', border: 'border-indigo-400 dark:border-indigo-600' },
  Dark:     { bg: 'bg-neutral-300 dark:bg-neutral-800', text: 'text-neutral-900 dark:text-neutral-200', border: 'border-neutral-400 dark:border-neutral-600' },
  Steel:    { bg: 'bg-slate-200 dark:bg-slate-700',    text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-600' },
  Fairy:    { bg: 'bg-rose-100 dark:bg-rose-900/40',   text: 'text-rose-800 dark:text-rose-200',   border: 'border-rose-300 dark:border-rose-700' },
}

const defaultColors = { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' }

/** Types sorted alphabetically, each with its moves. */
const sortedTypes = computed(() => {
  if (!props.moves) return []
  return Object.entries(props.moves)
    .map(([type, moves]) => ({
      type,
      moves,
      colors: typeColors[type] ?? defaultColors,
    }))
    .sort((a, b) => a.type.localeCompare(b.type))
})

const totalMoveCount = computed(() => {
  if (!props.moves) return 0
  return Object.values(props.moves).reduce((sum, m) => sum + m.length, 0)
})

function categoryIcon(category: MoveInfo['category']): string {
  switch (category) {
    case 'Physical': return '⚔️'
    case 'Special': return '✨'
    case 'Status': return '📊'
  }
}
</script>

<template>
  <div v-if="moves" class="flex flex-col gap-2 md:gap-3">
    <p class="text-xs md:text-sm text-muted-foreground">
      {{ totalMoveCount }} moves
    </p>
    <div class="max-h-[50vh] overflow-y-auto pr-1 space-y-2 md:space-y-3">
      <div
        v-for="{ type, moves: typeMoves, colors } in sortedTypes"
        :key="type"
        class="rounded-lg border p-2 md:p-3"
        :class="[colors.border]"
      >
        <!-- Type header -->
        <div class="flex items-center gap-2 mb-1.5 md:mb-2">
          <span
            class="text-[10px] md:text-xs font-bold uppercase px-2 py-0.5 rounded-full"
            :class="[colors.bg, colors.text]"
          >
            {{ type }}
          </span>
          <span class="text-[10px] md:text-xs text-muted-foreground">
            ({{ typeMoves.length }})
          </span>
        </div>

        <!-- Move list -->
        <div class="flex flex-wrap gap-1 md:gap-1.5">
          <span
            v-for="move in typeMoves"
            :key="move.name"
            class="inline-flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md"
            :class="[colors.bg, colors.text]"
            :title="`${move.name} — ${move.category}${move.basePower ? ` (${move.basePower} BP)` : ''}`"
          >
            <span class="text-[8px] md:text-[10px]">{{ categoryIcon(move.category) }}</span>
            {{ move.name }}
            <span v-if="move.basePower" class="opacity-60 text-[8px] md:text-[10px]">{{ move.basePower }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
