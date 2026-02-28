<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'

const { t } = useI18n()

const isVisible = ref(true)
</script>

<template>
  <div
    v-if="isVisible"
    class="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-4 md:px-6 py-3 md:py-4 rounded-lg text-sm md:text-base"
  >
    <div class="min-w-0">
      <slot />
    </div>
    <button
      class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors cursor-pointer shrink-0"
      :title="t('close')"
      @click="isVisible = false"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
</template>