import { type Ref, type ComputedRef, computed, ref, watch } from 'vue'
import {
  calculate,
  Generations,
  Pokemon,
  Move,
} from '@smogon/calc'
import { Dex, type GenerationNum } from '@pkmn/dex'
import type { SpeciesFilterOptions } from '@/composables/useQuizLogic'

/**
 * Shape of a single set from the setdex JSON.
 */
interface SetdexSet {
  level?: number
  ability?: string
  item?: string
  nature?: string
  evs?: { hp?: number; at?: number; df?: number; sa?: number; sd?: number; sp?: number }
  ivs?: { hp?: number; at?: number; df?: number; sa?: number; sd?: number; sp?: number }
  moves: string[]
  teraType?: string
}

type Setdex = Record<string, Record<string, SetdexSet>>

/**
 * Lazy-load a generation's setdex JSON. Uses dynamic import so that only the
 * needed generation(s) are bundled into the chunks that actually use them.
 */
const setdexCache = new Map<number, Setdex>()

async function loadSetdex(gen: number): Promise<Setdex> {
  const cached = setdexCache.get(gen)
  if (cached) return cached

  let raw: unknown
  switch (gen) {
    case 1: raw = (await import('@/lib/setdex-gen1.json')).default; break
    case 2: raw = (await import('@/lib/setdex-gen2.json')).default; break
    case 3: raw = (await import('@/lib/setdex-gen3.json')).default; break
    case 4: raw = (await import('@/lib/setdex-gen4.json')).default; break
    case 5: raw = (await import('@/lib/setdex-gen5.json')).default; break
    case 6: raw = (await import('@/lib/setdex-gen6.json')).default; break
    case 7: raw = (await import('@/lib/setdex-gen7.json')).default; break
    case 8: raw = (await import('@/lib/setdex-gen8.json')).default; break
    case 9: raw = (await import('@/lib/setdex-gen9.json')).default; break
    default: raw = (await import('@/lib/setdex-gen9.json')).default; break
  }

  const setdex = raw as Setdex
  setdexCache.set(gen, setdex)
  return setdex
}

/** Scenario generated for a damage quiz question. */
export interface DamageScenario {
  attackerName: string
  attackerSetName: string
  attackerSet: SetdexSet
  defenderName: string
  defenderSetName: string
  defenderSet: SetdexSet
  moveName: string
  /** Average damage as % of defender HP (midpoint of roll range). */
  damagePercent: number
  /** Min/max damage as % of defender HP. */
  damageRange: [number, number]
}

/**
 * Map setdex EV shorthand → @smogon/calc stat names.
 */
function toStatSpread(evs?: SetdexSet['evs']): Record<string, number> {
  if (!evs) return {}
  return {
    hp: evs.hp ?? 0,
    atk: evs.at ?? 0,
    def: evs.df ?? 0,
    spa: evs.sa ?? 0,
    spd: evs.sd ?? 0,
    spe: evs.sp ?? 0,
  }
}

/**
 * Composable for damage calculation using @smogon/calc.
 *
 * - `generateDamageScenario()` → random matchup with calculated damage %
 * - `isDamageGuessCorrect(guess, actual, tolerance)` → within ±tolerance%
 *
 * Accepts species filter options to respect game settings (generation range,
 * fully evolved only, mega inclusions, etc.). CAP Pokémon are always excluded.
 */
export function useDamageCalc(
  generation: Ref<GenerationNum> | ComputedRef<GenerationNum>,
  filterOptions?: Ref<SpeciesFilterOptions> | ComputedRef<SpeciesFilterOptions>,
) {
  // Use the actual generation for @smogon/calc
  const gen = computed(() => Generations.get(generation.value))

  // Reactive setdex that updates when generation changes
  const currentSetdex = ref<Setdex>({})
  const isReady = ref(false)
  let readyPromiseResolve: (() => void) | null = null
  let readyPromise: Promise<void> = new Promise(r => { readyPromiseResolve = r })

  // Load setdex when generation changes
  watch(generation, async (newGen) => {
    isReady.value = false
    // Create a new promise for consumers that call waitUntilReady()
    readyPromise = new Promise(r => { readyPromiseResolve = r })
    currentSetdex.value = await loadSetdex(newGen)
    isReady.value = true
    readyPromiseResolve?.()
  }, { immediate: true })

  /** Wait until the setdex for the current generation has loaded. */
  function waitUntilReady(): Promise<void> {
    return isReady.value ? Promise.resolve() : readyPromise
  }

  // Filter setdex entries based on species filter settings + always exclude CAP
  const pokemonWithSets = computed(() => {
    const allEntries = Object.entries(currentSetdex.value).filter(
      ([, sets]) => Object.values(sets).some(s => s.moves.length > 0),
    )

    return allEntries.filter(([name]) => {
      const species = Dex.species.get(name)
      if (!species || !species.exists) return false

      // Always exclude CAP (Create-A-Pokémon) — they have num <= 0
      if (species.num <= 0) return false

      // Always exclude Gmax forms
      if (species.forme === 'Gmax' || species.forme === 'Alola-Totem') return false

      if (filterOptions) {
        const opts = filterOptions.value

        // Generation range filter
        if (species.gen < opts.minGeneration || species.gen > opts.maxGeneration) return false

        // Fully evolved only
        if (opts.fullyEvolvedOnly && species.evos && species.evos.length > 0) return false

        // Mega Pokémon filter
        if (!opts.includeMegaPokemon && species.forme && species.forme.includes('Mega')) return false
      }

      return true
    })
  })

  /** Non-standard metagame set name prefixes to exclude. */
  const EXCLUDED_SET_PREFIXES = ['Balanced Hackmons', 'Almost Any Ability']

  /** Filter out non-standard metagame sets from a Pokémon's set entries. */
  function filterStandardSets(setEntries: [string, SetdexSet][]): [string, SetdexSet][] {
    return setEntries.filter(
      ([name]) => !EXCLUDED_SET_PREFIXES.some(prefix => name.startsWith(prefix)),
    )
  }

  /**
   * Pick a random entry from an array.
   */
  function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!
  }

  /**
   * Generate a random damage scenario:
   * attacker (random set) → move → defender (random set).
   * Ensures the move deals at least some damage.
   */
  function generateDamageScenario(maxAttempts = 50): DamageScenario | null {
    const pool = pokemonWithSets.value
    if (pool.length < 2) return null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Pick random attacker
        const [atkName, atkSets] = randomPick(pool)
        const atkSetEntries = filterStandardSets(Object.entries(atkSets))
        if (atkSetEntries.length === 0) continue
        const [atkSetName, atkSet] = randomPick(atkSetEntries)

        // Pick a random move from the attacker's set
        const moveName = randomPick(atkSet.moves)

        // Pick random defender (different Pokémon)
        let defEntry = randomPick(pool)
        let retries = 0
        while (defEntry[0] === atkName && retries < 10) {
          defEntry = randomPick(pool)
          retries++
        }
        const [defName, defSets] = defEntry
        const defSetEntries = filterStandardSets(Object.entries(defSets))
        if (defSetEntries.length === 0) continue
        const [defSetName, defSet] = randomPick(defSetEntries)

        // Build @smogon/calc objects
        const attacker = new Pokemon(gen.value, atkName, {
          level: 100,
          item: atkSet.item,
          nature: atkSet.nature,
          ability: atkSet.ability,
          evs: toStatSpread(atkSet.evs),
          ivs: atkSet.ivs ? toStatSpread(atkSet.ivs) : undefined,
        })

        const defender = new Pokemon(gen.value, defName, {
          level: 100,
          item: defSet.item,
          nature: defSet.nature,
          ability: defSet.ability,
          evs: toStatSpread(defSet.evs),
          ivs: defSet.ivs ? toStatSpread(defSet.ivs) : undefined,
        })

        const move = new Move(gen.value, moveName)

        const result = calculate(gen.value, attacker, defender, move)

        // Get damage range
        const range = result.range()
        if (!range || range[0] === 0) continue // Skip zero-damage moves

        const defHP = defender.maxHP()
        if (defHP <= 0) continue

        const minPct = (range[0] / defHP) * 100
        const maxPct = (range[1] / defHP) * 100
        const avgPct = (minPct + maxPct) / 2

        // Skip extremely high damage (>200%) or extremely low (<1%)
        if (avgPct < 1 || avgPct > 200) continue

        return {
          attackerName: atkName,
          attackerSetName: atkSetName,
          attackerSet: atkSet,
          defenderName: defName,
          defenderSetName: defSetName,
          defenderSet: defSet,
          moveName,
          damagePercent: Math.round(avgPct * 10) / 10,
          damageRange: [
            Math.round(minPct * 10) / 10,
            Math.round(maxPct * 10) / 10,
          ],
        }
      } catch {
        // Some sets may reference invalid Pokémon/moves — skip
        continue
      }
    }

    return null
  }

  /**
   * Check if a user's guess is within the tolerance range.
   */
  function isDamageGuessCorrect(
    guess: number,
    actual: number,
    tolerance = 5,
  ): boolean {
    return Math.abs(guess - actual) <= tolerance
  }

  return {
    generateDamageScenario,
    isDamageGuessCorrect,
    isReady,
    waitUntilReady,
  }
}
