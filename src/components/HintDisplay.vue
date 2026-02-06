<script setup lang="ts">
import { LightbulbIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  hintLevel: number
  types: string[]
  abilities: string[]
}>()
</script>

<template>
  <div v-if="hintLevel >= 1" class="bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 px-3 md:px-4 2xl:px-5 py-2 md:py-3 2xl:py-4 rounded-lg text-xs md:text-sm 2xl:text-base">
    <div class="flex flex-col gap-1.5 md:gap-2">
      <div class="flex items-center gap-1.5 md:gap-2">
        <LightbulbIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <div>
          <strong>{{ t('hints.firstHint') }}:</strong>
          <span class="ml-1 md:ml-2">{{ types.join(', ') }}</span>
        </div>
      </div>
      <div v-if="hintLevel >= 2" class="flex items-center gap-1.5 md:gap-2">
        <LightbulbIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <div>
          <strong>{{ t('hints.secondHint') }}:</strong>
          <span class="ml-1 md:ml-2">{{ abilities.join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
