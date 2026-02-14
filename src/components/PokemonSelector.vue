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
const displayCount = ref(30)
const dragStartY = ref(0)
const dragCurrentY = ref(0)
const isDragging = ref(false)

// Touch event handlers for drag-to-dismiss
function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  dragStartY.value = touch.clientY
  isDragging.value = true
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const touch = e.touches[0]
  if (!touch) return
  dragCurrentY.value = touch.clientY
  const deltaY = dragCurrentY.value - dragStartY.value
  
  // Only allow dragging down (positive deltaY)
  if (deltaY > 0) {
    // Prevent default only if dragging down to allow sheet to move
    e.preventDefault()
  }
}

function handleTouchEnd() {
  if (!isDragging.value) return
  
  const deltaY = dragCurrentY.value - dragStartY.value
  
  // Close if dragged down more than 100px
  if (deltaY > 100) {
    open.value = false
  }
  
  isDragging.value = false
  dragStartY.value = 0
  dragCurrentY.value = 0
}

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
  // Reset display count when closing
  if (!isOpen) {
    displayCount.value = 30
  }
})

const filteredSpecies = computed(() => {
  if (!searchQuery.value) {
    return props.speciesSelection.slice(0, displayCount.value)
  }
  return props.speciesSelection
    .filter((pokemon) =>
      pokemon.label.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .slice(0, displayCount.value)
})

// Handle infinite scroll
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const scrollPosition = target.scrollTop + target.clientHeight
  const scrollHeight = target.scrollHeight
  
  // Load more when within 200px of bottom
  if (scrollHeight - scrollPosition < 200 && displayCount.value < props.speciesSelection.length) {
    displayCount.value += 30
  }
}

// Reset display count when search changes
watch(searchQuery, () => {
  displayCount.value = 30
})

// Reset display count when species selection changes
watch(() => props.speciesSelection, () => {
  displayCount.value = 30
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
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div v-if="selectedValue" class="flex-shrink-0 flex items-center justify-center scale-[0.6] origin-left">
            <IconRenderer :name="selectedValue" />
          </div>
          <span class="text-xs sm:text-sm truncate flex-1">{{ selectedPokemonLabel || t('selectPokemon') }}</span>
        </div>
        <ChevronsUpDownIcon class="opacity-50 flex-shrink-0 ml-2" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" class="h-[70vh] flex flex-col">
      <div 
        class="flex-shrink-0 pb-2 -mx-6 px-6 pt-4 -mt-4 cursor-grab active:cursor-grabbing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="w-12 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-6"></div>
        <SheetHeader>
          <SheetTitle>{{ t('selectPokemon') }}</SheetTitle>
        </SheetHeader>
      </div>
      <Command class="flex-1 flex flex-col min-h-0">
        <CommandInput v-model="searchQuery" class="h-8 w-full text-xs sm:text-sm" :placeholder="t('searchPlaceholder')" />
        <CommandList class="flex-1 overflow-y-auto max-h-full" @scroll="handleScroll">
          <CommandEmpty v-if="filteredSpecies.length === 0" class="text-xs sm:text-sm">{{ t('noResults') }}</CommandEmpty>
          <CommandGroup v-else>
            <CommandItem
              v-for="pokemon in filteredSpecies"
              :key="pokemon.value"
              :value="pokemon.value"
              class="cursor-pointer text-xs sm:text-sm flex items-center gap-2"
              @select="(ev: any) => selectPokemon(ev.detail.value as string)"
            >
              <div class="flex-shrink-0 flex items-center justify-center">
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
          <div class="flex items-center gap-2 min-w-0">
            <div v-if="selectedValue" class="flex-shrink-0 flex items-center justify-center scale-75 origin-left">
              <IconRenderer :name="selectedValue" />
            </div>
            <span class="text-sm lg:text-base 2xl:text-lg truncate">{{ selectedPokemonLabel || t('selectPokemon') }}</span>
          </div>
          <ChevronsUpDownIcon class="opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 !w-[var(--pokemon-selector-width)]" side="top" align="center" :side-offset="8">
        <Command>
          <CommandInput v-model="searchQuery" class="h-9 lg:h-10 2xl:h-11 w-full text-sm lg:text-base 2xl:text-lg" :placeholder="t('searchPlaceholder')" />
          <CommandList @scroll="handleScroll">
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
