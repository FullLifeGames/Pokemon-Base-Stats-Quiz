import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { Dex, type Species, type GenerationNum } from '@pkmn/dex'
import { getLocalizedPokemonName } from '@/lib/pokemonNameHelper'

/**
 * Options for species filtering — shared shape used by both
 * QuizSettings (solo) and VsRoomSettings (multiplayer).
 */
export interface SpeciesFilterOptions {
  generation: GenerationNum
  minGeneration: GenerationNum
  maxGeneration: GenerationNum
  fullyEvolvedOnly: boolean
  includeMegaPokemon: boolean
}

/**
 * Normalized base-stat object used by StatDisplay and other UI.
 */
export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

/**
 * Item shape used by PokemonSelector's selection list.
 */
export interface SpeciesSelectionItem {
  label: string
  value: string
}

/**
 * Composable that centralises **all** quiz logic shared between the
 * solo BaseStatQuiz and the multiplayer VsGame / useVsGame:
 *
 *  • species filtering by generation range, evolution stage, and forme
 *  • random Pokémon generation
 *  • base-stat extraction
 *  • stat-based correctness checking (two Pokémon are "the same answer"
 *    when their six base stats are identical)
 *  • localized selection list for the PokemonSelector component
 *
 * Both callers pass in a reactive `options` ref/computed that satisfies
 * `SpeciesFilterOptions` and a reactive `locale` string.
 */
export function useQuizLogic(
  options: Ref<SpeciesFilterOptions> | ComputedRef<SpeciesFilterOptions>,
  locale: Ref<string>,
) {
  // ── Dex & species list ─────────────────────────────────────────────

  const generationDex = computed(() => Dex.forGen(options.value.generation))

  const species = computed<Species[]>(() => {
    let list = generationDex.value.species
      .all()
      .filter(
        (s) =>
          s.num > 0 &&
          s.forme !== 'Gmax' &&
          s.forme !== 'Alola-Totem',
      )

    list = list.filter(
      (s) =>
        s.gen >= options.value.minGeneration &&
        s.gen <= options.value.maxGeneration,
    )

    if (options.value.fullyEvolvedOnly) {
      list = list.filter((s) => !s.evos || s.evos.length === 0)
    }

    if (!options.value.includeMegaPokemon) {
      list = list.filter((s) => !s.forme || !s.forme.includes('Mega'))
    }

    return list
  })

  // ── Random Pokémon ─────────────────────────────────────────────────

  // Track recent Pokémon to avoid immediate repetition
  const recentPokemon = ref<string[]>([])
  const RECENT_HISTORY_SIZE = 10

  // Group species by their stat signature to deduplicate identical stats
  const statGroups = computed(() => {
    const groups = new Map<string, Species[]>()
    
    for (const pokemon of species.value) {
      const statsKey = `${pokemon.baseStats.hp}-${pokemon.baseStats.atk}-${pokemon.baseStats.def}-${pokemon.baseStats.spa}-${pokemon.baseStats.spd}-${pokemon.baseStats.spe}`
      if (!groups.has(statsKey)) {
        groups.set(statsKey, [])
      }
      groups.get(statsKey)!.push(pokemon)
    }
    
    return groups
  })

  function generateRandomPokemon(): Species {
    // Filter out recent Pokémon from each group
    const availableGroups: Species[][] = []
    for (const group of statGroups.value.values()) {
      const nonRecentInGroup = group.filter(p => !recentPokemon.value.includes(p.name))
      if (nonRecentInGroup.length > 0) {
        availableGroups.push(nonRecentInGroup)
      }
    }
    
    // If all Pokémon are recent (edge case with very small pools), reset history
    if (availableGroups.length === 0) {
      recentPokemon.value = []
      for (const group of statGroups.value.values()) {
        availableGroups.push(group)
      }
    }
    
    // Pick a random stat group (ensures equal probability regardless of stat duplicates)
    const groupIdx = Math.floor(Math.random() * availableGroups.length)
    const selectedGroup = availableGroups[groupIdx]!
    
    // Pick a random Pokémon from that group (for variety among stat twins)
    const pokemonIdx = Math.floor(Math.random() * selectedGroup.length)
    const selected = selectedGroup[pokemonIdx]!
    
    // Update recent history
    recentPokemon.value.push(selected.name)
    if (recentPokemon.value.length > RECENT_HISTORY_SIZE) {
      recentPokemon.value.shift()
    }
    
    return selected
  }

  // ── Stats helpers ──────────────────────────────────────────────────

  function getPokemonStats(pokemon: Species): PokemonStats {
    return {
      hp: pokemon.baseStats.hp,
      attack: pokemon.baseStats.atk,
      defense: pokemon.baseStats.def,
      specialAttack: pokemon.baseStats.spa,
      specialDefense: pokemon.baseStats.spd,
      speed: pokemon.baseStats.spe,
    }
  }

  /**
   * Two Pokémon count as "the same answer" when all six base stats
   * match (handles cases like Plusle / Minun).
   */
  function hasMatchingStats(a: Species, b: Species): boolean {
    return (
      a.baseStats.hp === b.baseStats.hp &&
      a.baseStats.atk === b.baseStats.atk &&
      a.baseStats.def === b.baseStats.def &&
      a.baseStats.spa === b.baseStats.spa &&
      a.baseStats.spd === b.baseStats.spd &&
      a.baseStats.spe === b.baseStats.spe
    )
  }

  /**
   * Checks whether a guess (by Pokémon name) has the same stats as the
   * target Pokémon.  Returns `false` for unknown names / empty strings.
   */
  function isCorrectGuess(guessName: string, target: Species): boolean {
    if (!guessName) return false
    const guessed = species.value.find((s) => s.name === guessName)
    if (!guessed) return false
    return hasMatchingStats(guessed, target)
  }

  // ── Selection list ─────────────────────────────────────────────────

  const speciesSelection = computed<SpeciesSelectionItem[]>(() =>
    species.value.map((p) => ({
      label: getLocalizedPokemonName(p.name, locale.value),
      value: p.name,
    })),
  )

  // ── Localized name helper ──────────────────────────────────────────

  function getLocalizedName(name: string): string {
    return getLocalizedPokemonName(name, locale.value)
  }

  // ── Lookup ─────────────────────────────────────────────────────────

  function findSpecies(name: string): Species | undefined {
    return species.value.find((s) => s.name === name)
  }

  // ── Public API ─────────────────────────────────────────────────────

  return {
    generationDex,
    species,
    speciesSelection,
    generateRandomPokemon,
    getPokemonStats,
    hasMatchingStats,
    isCorrectGuess,
    getLocalizedName,
    findSpecies,
  }
}
