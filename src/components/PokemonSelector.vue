<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useI18n } from 'vue-i18n'
import IconRenderer from '@/components/renderer/IconRenderer.vue'

const { t } = useI18n()

const props = defineProps<{
  speciesSelection: { label: string; value: string }[]
  selectedValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const open = ref(false)
const searchQuery = ref('')
const isMobile = ref(window.innerWidth < 768)
const popoverWrapperRef = ref<HTMLDivElement>()

// Update isMobile on window resize
const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// Update popover width when it opens
watch(open, async (isOpen) => {
  if (isOpen && popoverWrapperRef.value) {
    await nextTick()
    const button = popoverWrapperRef.value.querySelector('button')
    if (button) {
      const width = button.offsetWidth
      document.documentElement.style.setProperty('--pokemon-selector-width', `${width}px`)
    }
  }
})

const filteredSpecies = computed(() => {
  if (!searchQuery.value) {
    return props.speciesSelection.slice(0, 50)
  }
  return props.speciesSelection
    .filter((pokemon) =>
      pokemon.label.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .slice(0, 100)
})

const selectedPokemonLabel = computed(() =>
  props.speciesSelection.find(p => p.value === props.selectedValue)?.label
)

// Reset search when selection is cleared (e.g. new round)
watch(() => props.selectedValue, (newVal) => {
  if (!newVal) {
    searchQuery.value = ''
  }
})

function selectPokemon(value: string) {
  open.value = false
  searchQuery.value = ''
  emit('select', value)
}
</script>

<template>
  <!-- Mobile: Sheet -->
  <Sheet v-if="isMobile" v-model:open="open">
    <SheetTrigger as-child>
      <Button variant="outline" role="combobox" :aria-expanded="open" :disabled="disabled" class="justify-between w-full cursor-pointer h-9 sm:h-10">
        <span class="text-xs sm:text-sm truncate">{{ selectedPokemonLabel || t('selectPokemon') }}</span>
        <ChevronsUpDownIcon class="opacity-50 flex-shrink-0" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" class="h-[80vh] flex flex-col">
      <SheetHeader><SheetTitle>{{ t('selectPokemon') }}</SheetTitle></SheetHeader>
      <Command class="flex-1 flex flex-col">
        <CommandInput v-model="searchQuery" class="h-8 w-full text-xs sm:text-sm" :placeholder="t('searchPlaceholder')" />
        <CommandList class="flex-1 overflow-y-auto">
          <CommandEmpty v-if="filteredSpecies.length === 0" class="text-xs sm:text-sm">{{ t('noResults') }}</CommandEmpty>
          <CommandGroup v-else>
            <CommandItem
              v-for="pokemon in filteredSpecies"
              :key="pokemon.value"
              :value="pokemon.value"
              class="cursor-pointer text-xs sm:text-sm flex items-center gap-2"
              @select="(ev: any) => selectPokemon(ev.detail.value as string)"
            >
              <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <IconRenderer :name="pokemon.value" />
              </div>
              <span class="flex-1 truncate">{{ pokemon.label }}</span>
              <CheckIcon :class="cn('flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4', selectedValue === pokemon.value ? 'opacity-100' : 'opacity-0')" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </SheetContent>
  </Sheet>

  <!-- Desktop: Popover -->
  <div v-else ref="popoverWrapperRef">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" role="combobox" :aria-expanded="open" :disabled="disabled" class="justify-between w-full cursor-pointer h-10 lg:h-12 2xl:h-14">
          <span class="text-sm lg:text-base 2xl:text-lg truncate">{{ selectedPokemonLabel || t('selectPokemon') }}</span>
          <ChevronsUpDownIcon class="opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 !w-[var(--pokemon-selector-width)]" side="top" align="center" :side-offset="8">
        <Command>
          <CommandInput v-model="searchQuery" class="h-9 lg:h-10 2xl:h-11 w-full text-sm lg:text-base 2xl:text-lg" :placeholder="t('searchPlaceholder')" />
          <CommandList>
            <CommandEmpty v-if="filteredSpecies.length === 0" class="text-sm lg:text-base 2xl:text-lg">{{ t('noResults') }}</CommandEmpty>
            <CommandGroup v-else>
              <CommandItem
                v-for="pokemon in filteredSpecies"
                :key="pokemon.value"
                :value="pokemon.value"
                class="cursor-pointer text-sm lg:text-base 2xl:text-lg flex items-center gap-2"
                @select="(ev: any) => selectPokemon(ev.detail.value as string)"
              >
                <div class="w-10 h-10 2xl:w-12 2xl:h-12 flex-shrink-0 flex items-center justify-center">
                  <IconRenderer :name="pokemon.value" />
                </div>
                <span class="flex-1 truncate">{{ pokemon.label }}</span>
                <CheckIcon :class="cn('flex-shrink-0 h-4 w-4 2xl:h-5 2xl:w-5', selectedValue === pokemon.value ? 'opacity-100' : 'opacity-0')" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
