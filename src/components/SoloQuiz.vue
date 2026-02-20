<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import BaseStatQuiz from './BaseStatQuiz.vue'
import LearnsetQuiz from './LearnsetQuiz.vue'
import DamageQuiz from './DamageQuiz.vue'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { QuizSettings, QuizMode } from '@/types/settings'
import { defaultSettings } from '@/types/settings'

const route = useRoute()
const settings = ref<QuizSettings>({
  ...defaultSettings,
  quizMode: (route.meta.quizMode as QuizMode) || defaultSettings.quizMode,
  vgc: (route.meta.vgc as boolean) ?? defaultSettings.vgc,
})

// Watch for route changes to update quiz mode and VGC setting
watch(
  () => [route.meta.quizMode, route.meta.vgc],
  ([newMode, newVgc]) => {
    if (newMode) {
      settings.value.quizMode = newMode as QuizMode
    }
    if (newVgc !== undefined) {
      settings.value.vgc = newVgc as boolean
    }
  },
)
</script>

<template>
  <SidebarProvider>
    <AppSidebar :settings="settings" @update:settings="(value) => settings = value" />
    <SidebarInset>
      <header><SidebarTrigger /></header>
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col">
          <div class="flex flex-col">
            <div class="flex items-center">
              <BaseStatQuiz v-if="settings.quizMode === 'base-stat'" :settings="settings" />
              <LearnsetQuiz v-else-if="settings.quizMode === 'learnset'" :settings="settings" />
              <DamageQuiz v-else-if="settings.quizMode === 'damage'" :settings="settings" />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
