<script setup lang="ts">
import { CheckIcon, ChevronsUpDownIcon, LightbulbIcon } from "lucide-vue-next";
import { computed, ref, watch, onMounted } from "vue";
import { Dex } from "@pkmn/dex";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "vue-i18n";
import { getLocalizedPokemonName } from "@/lib/pokemonNameHelper";
import type { QuizSettings } from "@/types/settings";

const { t, locale } = useI18n();

const props = defineProps({
  settings: {
    type: Object as () => QuizSettings,
    required: true,
  },
})

const searchQuery = ref("");
const progressValue = ref(0);
const correctGuesses = ref(0);
const incorrectGuesses = ref(0);
const elapsedTime = ref(0);
const showCongratulations = ref(false);
const hintLevel = ref(0); // 0 = no hints, 1 = first hint (types), 2 = second hint (abilities)
const resultMessageRef = ref<HTMLDivElement | null>(null);
const isMobile = ref(window.innerWidth < 768);
let timerInterval: ReturnType<typeof setInterval> | null = null;
let loadingInterval: number | undefined;

const generationDex = computed(() => Dex.forGen(props.settings.generation));
const species = computed(() => {
  let allSpecies = generationDex.value.species.all().filter(s => s.num > 0 && s.forme !== "Gmax" && s.forme !== "Alola-Totem");
  
  // Filter by generation range (min and max)
  allSpecies = allSpecies.filter(s => s.gen >= props.settings.minGeneration && s.gen <= props.settings.maxGeneration);
  
  // Filter by evolution stage
  if (props.settings.fullyEvolvedOnly) {
    allSpecies = allSpecies.filter(s => !s.evos || s.evos.length === 0);
  }
  
  return allSpecies;
});

const generateRandomPokemon = () => {
  const randomIndex = Math.floor(Math.random() * species.value.length);
  return species.value[randomIndex]!;
};

const currentPokemon = ref(generateRandomPokemon());

const resetQuiz = () => {
  currentPokemon.value = generateRandomPokemon();
  value.value = "";
  progressValue.value = 0;
  clearInterval(loadingInterval);
  searchQuery.value = "";
  correctGuesses.value = 0;
  incorrectGuesses.value = 0;
  elapsedTime.value = 0;
  hintLevel.value = 0;
  startTimer();
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Watch for settings changes and regenerate Pokemon
watch(() => [props.settings.generation, props.settings.minGeneration, props.settings.maxGeneration, props.settings.fullyEvolvedOnly], () => {
  resetQuiz();
});

// Watch for correctGuesses to check if maxScore is reached
watch(() => correctGuesses.value, (newVal) => {
  if (newVal === props.settings.maxScore && newVal > 0) {
    progressValue.value = 0;
    clearInterval(loadingInterval);
    stopTimer();
    showCongratulations.value = true;
  }
});

// Start timer on component mount
onMounted(() => {
  startTimer();
});
const currentStats = computed(() => {
  return {
    hp: currentPokemon.value.baseStats.hp,
    attack: currentPokemon.value.baseStats.atk,
    defense: currentPokemon.value.baseStats.def,
    specialAttack: currentPokemon.value.baseStats.spa,
    specialDefense: currentPokemon.value.baseStats.spd,
    speed: currentPokemon.value.baseStats.spe,
  };
});

const speciesSelection = computed(() =>
  species.value.map((pokemon) => ({
    label: getLocalizedPokemonName(pokemon.name, locale.value),
    value: pokemon.name,
  })),
);

const filteredSpecies = computed(() => {
  if (!searchQuery.value) {
    return speciesSelection.value.slice(0, 50); // Show first 50 by default
  }
  return speciesSelection.value
    .filter((pokemon) =>
      pokemon.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
    .slice(0, 100); // Limit filtered results
});

const open = ref(false);
const value = ref("");

const selectedPokemon = computed(() =>
  speciesSelection.value.find((pokemon) => pokemon.value === value.value),
);

const isCorrect = computed(() => {
  if (!value.value) return null;
  const selectedPok = species.value.find((p) => p.name === value.value);
  if (!selectedPok) return false;
  
  // Check if stats match
  return (
    selectedPok.baseStats.hp === currentPokemon.value.baseStats.hp &&
    selectedPok.baseStats.atk === currentPokemon.value.baseStats.atk &&
    selectedPok.baseStats.def === currentPokemon.value.baseStats.def &&
    selectedPok.baseStats.spa === currentPokemon.value.baseStats.spa &&
    selectedPok.baseStats.spd === currentPokemon.value.baseStats.spd &&
    selectedPok.baseStats.spe === currentPokemon.value.baseStats.spe
  );
});

const nextPokemon = () => {
  currentPokemon.value = generateRandomPokemon();
  value.value = "";
  progressValue.value = 0;
  searchQuery.value = "";
  hintLevel.value = 0;
  startTimer();
};

function setLoading() {
  // Start progress bar animation
  progressValue.value = 0;
  loadingInterval = setInterval(() => {
    progressValue.value += Math.random() * 5;
    if (progressValue.value >= 100) {
      progressValue.value = 100;
      clearInterval(loadingInterval);
      // Auto-advance to next Pokémon after progress completes
      setTimeout(nextPokemon, 500);
    }
  }, 100);
}

function selectPokemon(selectedValue: string) {
  value.value = selectedValue === value.value ? "" : selectedValue;
  open.value = false;
  searchQuery.value = "";

  // Update score
  if (isCorrect.value) {
    correctGuesses.value++;
  } else {
    incorrectGuesses.value++;
  }

  // Pause timer during loading
  stopTimer();

  // Start progress bar animation
  setLoading();

  // Scroll to result message on mobile after a brief delay
  setTimeout(() => {
    if (resultMessageRef.value && window.innerWidth < 768) {
      resultMessageRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}
</script>

<template>
  <div class="w-full h-full min-h-screen flex flex-col p-4 md:p-6 lg:p-8">
    <div class="flex flex-col gap-6 md:gap-8 flex-1">
      <!-- Header Section with Score -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-semibold">
            {{ t('title') }}
          </h1>
          <div class="flex gap-6 mt-2 text-sm md:text-base flex-wrap items-center">
            <span class="text-green-600 dark:text-green-400 font-semibold">
              ✓ {{ t('correct') }}: {{ correctGuesses }}
            </span>
            <span class="text-red-600 dark:text-red-400 font-semibold">
              ✗ {{ t('incorrect') }}: {{ incorrectGuesses }}
            </span>
            <span class="font-mono font-semibold text-lg">
              {{ formatTime(elapsedTime) }}
            </span>
          </div>
        </div>
        <Button
          class="cursor-pointer w-full md:w-auto"
          @click="resetQuiz"
        >
          {{ t('resetQuiz') }}
        </Button>
      </div>

      <!-- Explanation Text -->
      <div class="bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-4 md:px-6 py-3 md:py-4 rounded-lg text-sm md:text-base">
        <p>
          {{ t('explanation.intro') }}
          <strong>{{ t('explanation.hp') }}</strong> ({{ t('explanation.hpDesc') }}),
          <strong>{{ t('explanation.atk') }}</strong> ({{ t('explanation.atkDesc') }}),
          <strong>{{ t('explanation.def') }}</strong> ({{ t('explanation.defDesc') }}),
          <strong>{{ t('explanation.spa') }}</strong> ({{ t('explanation.spaDesc') }}),
          <strong>{{ t('explanation.spd') }}</strong> ({{ t('explanation.spdDesc') }})
          {{ t('explanation.and') }}
          <strong>{{ t('explanation.spe') }}</strong> ({{ t('explanation.speDesc') }}).
          {{ t('explanation.question') }}
        </p>
      </div>

      <!-- Stats Display Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('hp') }}: {{ currentStats.hp }}</span
          >
        </div>
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('atk') }}: {{ currentStats.attack }}</span
          >
        </div>
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('def') }}: {{ currentStats.defense }}</span
          >
        </div>
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('spa') }}: {{ currentStats.specialAttack }}</span
          >
        </div>
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('spd') }}: {{ currentStats.specialDefense }}</span
          >
        </div>
        <div class="bg-muted rounded-lg p-4 md:p-6 text-center">
          <span class="text-lg md:text-2xl lg:text-3xl font-semibold"
            >{{ t('spe') }}: {{ currentStats.speed }}</span
          >
        </div>
      </div>

      <!-- Hint Section -->
      <div v-if="settings.hintsEnabled" class="flex flex-col gap-4">
        <Button
          v-if="hintLevel < 2"
          variant="outline"
          class="cursor-pointer w-full md:w-auto"
          @click="hintLevel++"
          :disabled="progressValue > 0"
        >
          <LightbulbIcon class="mr-2 h-4 w-4" />
          {{ t('requestHint') }}
        </Button>
        
        <div v-if="hintLevel >= 1" class="bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 px-4 md:px-6 py-3 md:py-4 rounded-lg">
          <div class="flex flex-col gap-2">
            <div>
              <strong>{{ t('hints.firstHint') }}:</strong>
              <span class="ml-2">{{ currentPokemon.types.join(', ') }}</span>
            </div>
            <div v-if="hintLevel >= 2">
              <strong>{{ t('hints.secondHint') }}:</strong>
              <span class="ml-2">{{ Object.values(currentPokemon.abilities).filter(a => a).join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selection Section -->
      <div class="flex flex-col gap-4">
        <!-- Mobile: Sheet Modal -->
        <Sheet v-if="isMobile" v-model:open="open" :disabled="progressValue > 0">
          <SheetTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="open"
              class="justify-between w-full cursor-pointer h-10 md:h-12"
              :disabled="progressValue > 0"
            >
              <span class="text-sm md:text-base truncate">
                {{ selectedPokemon?.label || t('selectPokemon') }}
              </span>
              <ChevronsUpDownIcon class="opacity-50 flex-shrink-0" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" class="h-[80vh] flex flex-col">
            <SheetHeader>
              <SheetTitle>{{ t('selectPokemon') }}</SheetTitle>
            </SheetHeader>
            <Command class="flex-1 flex flex-col">
              <CommandInput
                v-model="searchQuery"
                class="h-9 w-full"
                :placeholder="t('searchPlaceholder')"
              />
              <CommandList class="flex-1 overflow-y-auto">
                <CommandEmpty v-if="filteredSpecies.length === 0"
                  >{{ t('noResults') }}</CommandEmpty
                >
                <CommandGroup v-else>
                  <CommandItem
                    v-for="pokemon in filteredSpecies"
                    :key="pokemon.value"
                    :value="pokemon.value"
                    class="cursor-pointer"
                    @select="
                      (ev) => {
                        selectPokemon(ev.detail.value as string);
                      }
                    "
                  >
                    {{ pokemon.label }}
                    <CheckIcon
                      :class="
                        cn(
                          'ml-auto',
                          value === pokemon.value ? 'opacity-100' : 'opacity-0',
                        )
                      "
                    />
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </SheetContent>
        </Sheet>

        <!-- Desktop: Popover -->
        <Popover v-else v-model:open="open" :disabled="progressValue > 0">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="open"
              class="justify-between w-full cursor-pointer h-10 md:h-12"
              :disabled="progressValue > 0"
            >
              <span class="text-sm md:text-base truncate">
                {{ selectedPokemon?.label || t('selectPokemon') }}
              </span>
              <ChevronsUpDownIcon class="opacity-50 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="p-0 w-full" side="top" align="center" :side-offset="8">
            <Command>
              <CommandInput
                v-model="searchQuery"
                class="h-9 w-full"
                :placeholder="t('searchPlaceholder')"
              />
              <CommandList>
                <CommandEmpty v-if="filteredSpecies.length === 0"
                  >{{ t('noResults') }}</CommandEmpty
                >
                <CommandGroup v-else>
                  <CommandItem
                    v-for="pokemon in filteredSpecies"
                    :key="pokemon.value"
                    :value="pokemon.value"
                    class="cursor-pointer"
                    @select="
                      (ev) => {
                        selectPokemon(ev.detail.value as string);
                      }
                    "
                  >
                    {{ pokemon.label }}
                    <CheckIcon
                      :class="
                        cn(
                          'ml-auto',
                          value === pokemon.value ? 'opacity-100' : 'opacity-0',
                        )
                      "
                    />
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <!-- Result Message -->
        <div v-if="isCorrect !== null && progressValue > 0" ref="resultMessageRef" class="text-center">
          <div
            v-if="isCorrect"
            class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 md:px-6 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg"
          >
            <div>{{ t('correctMessage', { pokemon: selectedPokemon?.label || value }) }}</div>
            <div v-if="selectedPokemon?.value !== currentPokemon.name" class="text-sm mt-2 opacity-90">
              ({{ t('alsoCorrect') }}: {{ getLocalizedPokemonName(currentPokemon.name, locale) }})
            </div>
          </div>
          <div
            v-else
            class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 md:px-6 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg"
          >
            {{ t('incorrectMessage', { pokemon: getLocalizedPokemonName(currentPokemon.name, locale) }) }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="progressValue > 0" class="flex flex-col gap-2">
          <Progress :model-value="progressValue" class="w-full" />
          <p class="text-center text-sm text-muted-foreground">
            {{ t('loading') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Congratulations Dialog -->
    <Dialog :open="showCongratulations" @update:open="(open) => showCongratulations = open">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('congratulations.title') }}</DialogTitle>
          <DialogDescription>{{ t('congratulations.message') }}</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold">{{ t('congratulations.finalScore') }}</p>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-green-600 dark:text-green-400 font-medium">✓ {{ t('correct') }}</span>
                <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ correctGuesses }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-red-600 dark:text-red-400 font-medium">✗ {{ t('incorrect') }}</span>
                <span class="text-2xl font-bold text-red-600 dark:text-red-400">{{ incorrectGuesses }}</span>
              </div> 
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-sm font-semibold">{{ t('congratulations.timeElapsed') }}</p>
            <p class="text-2xl font-bold font-mono">{{ formatTime(elapsedTime) }}</p>
          </div>
          <Button 
            @click="() => {
              showCongratulations = false;
              resetQuiz();
            }"
            class="w-full cursor-pointer"
          >
            {{ t('congratulations.startNewQuiz') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
