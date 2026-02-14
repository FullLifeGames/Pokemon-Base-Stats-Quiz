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

const updateIncludeMegaPokemon = (value: boolean) => {
  emit('update:settings', { ...props.settings, includeMegaPokemon: value })
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
                
                <!-- Include Mega Pokémon Checkbox (Second) -->
                <div class="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    :checked="settings.includeMegaPokemon" 
                    @change="(e) => updateIncludeMegaPokemon((e.target as HTMLInputElement).checked)"
                    class="w-4 h-4 rounded border border-input cursor-pointer"
                    id="includeMegaPokemonCheckbox"
                  />
                  <label for="includeMegaPokemonCheckbox" class="text-sm font-medium cursor-pointer">
                    {{ t('sidebar.includeMegaPokemon') }}
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
        <div class="text-xs text-muted-foreground flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <a href="https://fulllifegames.com" target="_blank" rel="noopener noreferrer" class="hover:text-foreground transition-colors">fulllifegames.com</a>
            <span class="text-muted-foreground/50">·</span>
            <a href="https://github.com/FullLifeGames/Pokemon-Base-Stats-Quiz" target="_blank" rel="noopener noreferrer" class="hover:text-foreground transition-colors flex items-center gap-1">
              <svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
          </div>
          <div>
            {{ t('sidebar.madeBy') }}
            <a href="https://youtube.com/@Bene" target="_blank" rel="noopener noreferrer" class="hover:text-foreground transition-colors font-medium">Bene</a>
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
