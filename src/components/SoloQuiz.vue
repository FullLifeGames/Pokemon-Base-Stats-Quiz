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
        <div class="@container/main flex flex-1 flex-col">
          <div class="flex flex-col">
            <div class="flex items-center">
              <BaseStatQuiz :settings="settings" />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
