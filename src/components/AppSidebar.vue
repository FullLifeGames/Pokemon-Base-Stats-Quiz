<script setup lang="ts">
import { computed } from 'vue'
import { Globe } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { QuizSettings } from '@/types/settings'
import type { GenerationNum } from '@pkmn/dex'
import GenerationSelect from './GenerationSelect.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import ModeToggle from './ModeToggle.vue'

const { locale, t } = useI18n()

const props = defineProps({
  settings: {
    type: Object as () => QuizSettings,
    required: true,
  },
})

const emit = defineEmits<{
  'update:settings': [value: QuizSettings]
}>()

const appTitle = computed(() => locale.value === 'en' ? 'Pokémon Stats Quiz' : 'Pokémon-Stat-Quiz')

const changeLocale = (newLocale: string) => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
}

const updateGeneration = (newGeneration: number) => {
  emit('update:settings', { ...props.settings, generation: newGeneration as GenerationNum })
}

const updateMinGeneration = (newMinGen: number) => {
  emit('update:settings', { ...props.settings, minGeneration: newMinGen as GenerationNum })
}

const updateMaxGeneration = (newMaxGen: number) => {
  emit('update:settings', { ...props.settings, maxGeneration: newMaxGen as GenerationNum })
}

const updateFullyEvolvedOnly = (value: boolean) => {
  emit('update:settings', { ...props.settings, fullyEvolvedOnly: value })
}

const updateMaxScore = (newMaxScore: number) => {
  emit('update:settings', { ...props.settings, maxScore: newMaxScore })
}

const updateHintsEnabled = (value: boolean) => {
  emit('update:settings', { ...props.settings, hintsEnabled: value })
}
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ appTitle }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <a href="#">
                  <span>{{ locale === 'en' ? 'Home' : 'Startseite' }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>{{ t('sidebar.settings') }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <div class="px-2 py-2 text-sm space-y-4">
                <!-- Fully Evolved Only Checkbox (First) -->
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    :checked="settings.fullyEvolvedOnly" 
                    @change="(e) => updateFullyEvolvedOnly((e.target as HTMLInputElement).checked)"
                    class="w-4 h-4 rounded border border-input cursor-pointer"
                    id="fullyEvolvedCheckbox"
                  />
                  <label for="fullyEvolvedCheckbox" class="text-sm font-medium cursor-pointer">
                    {{ t('sidebar.fullyEvolvedOnly') }}
                  </label>
                </div>

                <!-- Hints Enabled Checkbox -->
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    :checked="settings.hintsEnabled" 
                    @change="(e) => updateHintsEnabled((e.target as HTMLInputElement).checked)"
                    class="w-4 h-4 rounded border border-input cursor-pointer"
                    id="hintsEnabledCheckbox"
                  />
                  <label for="hintsEnabledCheckbox" class="text-sm font-medium cursor-pointer">
                    {{ t('sidebar.hintsEnabled') }}
                  </label>
                </div>

                <!-- Max Score Input -->
                <div class="flex flex-col gap-2">
                  <label for="maxScoreInput" class="text-sm font-medium">
                    {{ t('sidebar.maxScore') }}
                  </label>
                  <Input 
                    id="maxScoreInput"
                    type="number" 
                    :model-value="settings.maxScore" 
                    @update:model-value="(val) => updateMaxScore(Math.max(1, typeof val === 'number' ? val : parseInt(val as string) || 1))"
                    min="1"
                    max="999"
                  />
                </div>

                <!-- Min Generation Setting (Second) -->
                <GenerationSelect 
                  :model-value="settings.minGeneration" 
                  @update:model-value="updateMinGeneration"
                  :label="t('sidebar.minGeneration')"
                />

                <!-- Max Generation Setting (Third) -->
                <GenerationSelect 
                  :model-value="settings.maxGeneration" 
                  @update:model-value="updateMaxGeneration"
                  :label="t('sidebar.maxGeneration')"
                />

                <!-- Generation Setting (Fourth) -->
                <GenerationSelect 
                  :model-value="settings.generation" 
                  @update:model-value="updateGeneration"
                  :label="t('sidebar.generation')"
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <div class="flex flex-col gap-3 p-2 border-t">
        <!-- Links Section -->
        <div class="flex flex-col gap-2 text-xs">
          <a href="https://fulllifegames.com" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors">
            fulllifegames.com
          </a>
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">{{ t('sidebar.madeBy') }}</span>
            <a href="https://youtube.com/@Bene" target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Bene
            </a>
          </div>
        </div>
        
        <!-- Controls Section -->
        <div class="flex flex-col gap-2 border-t pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button class="flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm hover:bg-accent cursor-pointer">
                <Globe class="w-4 h-4" />
                <span>{{ locale === 'en' ? t('sidebar.english') : t('sidebar.deutsch') }}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="changeLocale('en')" :class="{ 'bg-accent': locale === 'en' }" class="cursor-pointer">
                {{ t('sidebar.english') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="changeLocale('de')" :class="{ 'bg-accent': locale === 'de' }" class="cursor-pointer">
                {{ t('sidebar.deutsch') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
