<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import BaseStatQuiz from './BaseStatQuiz.vue'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import type { QuizSettings } from '@/types/settings'
import { defaultSettings } from '@/types/settings'

const settings = ref<QuizSettings>({ ...defaultSettings })
</script>

<template>
  <SidebarProvider>
    <AppSidebar :settings="settings" @update:settings="(value) => settings = value" />
    <SidebarInset>
      <header><SidebarTrigger /></header>
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
            <div class="flex items-center">
              <BaseStatQuiz :settings="settings" />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
