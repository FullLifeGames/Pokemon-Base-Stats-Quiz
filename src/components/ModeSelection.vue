<script setup lang="ts">
import { Swords, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import ModeToggle from './ModeToggle.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-vue-next'

const { t, locale } = useI18n()
const router = useRouter()

const changeLocale = (newLocale: string) => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 md:p-8 2xl:p-12 gap-6 md:gap-8 2xl:gap-12">
    <!-- Header -->
    <div class="text-center space-y-2 md:space-y-3">
      <h1 class="text-3xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold tracking-tight">
        {{ t('modeSelect.title') }}
      </h1>
      <p class="text-muted-foreground text-base md:text-xl 2xl:text-2xl">
        {{ t('modeSelect.subtitle') }}
      </p>
    </div>

    <!-- Mode Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 2xl:gap-8 w-full" style="max-width: min(48rem, 80vw);">
      <!-- Solo Mode -->
      <button
        class="group relative flex flex-col items-center gap-3 md:gap-4 2xl:gap-6 p-6 md:p-10 2xl:p-14 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
        @click="router.push('/solo')"
      >
        <div class="w-14 h-14 md:w-20 md:h-20 2xl:w-28 2xl:h-28 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
          <User class="w-7 h-7 md:w-10 md:h-10 2xl:w-14 2xl:h-14 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="space-y-1 text-center">
          <h2 class="text-lg md:text-2xl 2xl:text-3xl font-semibold">{{ t('modeSelect.solo') }}</h2>
          <p class="text-xs md:text-sm 2xl:text-base text-muted-foreground">{{ t('modeSelect.soloDesc') }}</p>
        </div>
      </button>

      <!-- VS Mode -->
      <button
        class="group relative flex flex-col items-center gap-3 md:gap-4 2xl:gap-6 p-6 md:p-10 2xl:p-14 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer"
        @click="router.push('/vs')"
      >
        <div class="w-14 h-14 md:w-20 md:h-20 2xl:w-28 2xl:h-28 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Swords class="w-7 h-7 md:w-10 md:h-10 2xl:w-14 2xl:h-14 text-red-600 dark:text-red-400" />
        </div>
        <div class="space-y-1 text-center">
          <h2 class="text-lg md:text-2xl 2xl:text-3xl font-semibold">{{ t('modeSelect.vs') }}</h2>
          <p class="text-xs md:text-sm 2xl:text-base text-muted-foreground">{{ t('modeSelect.vsDesc') }}</p>
        </div>
      </button>
    </div>

    <!-- Footer controls -->
    <div class="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="cursor-pointer">
            <Globe class="w-4 h-4 mr-2" />
            {{ locale === 'en' ? 'English' : 'Deutsch' }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="changeLocale('en')" class="cursor-pointer">English</DropdownMenuItem>
          <DropdownMenuItem @click="changeLocale('de')" class="cursor-pointer">Deutsch</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ModeToggle />
    </div>

    <!-- Footer Links -->
    <div class="text-xs text-muted-foreground flex flex-col items-center gap-1">
      <a href="https://fulllifegames.com" target="_blank" class="hover:text-foreground transition-colors">fulllifegames.com</a>
      <div>
        {{ t('sidebar.madeBy') }}
        <a href="https://youtube.com/@Bene" target="_blank" class="hover:text-foreground transition-colors font-medium">Bene</a>
      </div>
    </div>
  </div>
</template>
