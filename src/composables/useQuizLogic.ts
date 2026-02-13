import { computed, type Ref, type ComputedRef } from 'vue'
import { Dex, type Species } from '@pkmn/dex'
import { getLocalizedPokemonName } from '@/lib/pokemonNameHelper'

/**
 * Options for species filtering — shared shape used by both
 * QuizSettings (solo) and VsRoomSettings (multiplayer).
 */
export interface SpeciesFilterOptions {
  generation: number
  minGeneration: number
  maxGeneration: number
  fullyEvolvedOnly: boolean
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

    return list
  })

  // ── Random Pokémon ─────────────────────────────────────────────────

  function generateRandomPokemon(): Species {
    const list = species.value
    const idx = Math.floor(Math.random() * list.length)
    return list[idx]!
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
