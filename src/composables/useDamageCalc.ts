import { type Ref, type ComputedRef, computed, ref, watch } from 'vue'
import {
  calculate,
  Generations,
  Pokemon,
  Move,
  Field,
} from '@smogon/calc'
import { Dex, type GenerationNum } from '@pkmn/dex'
import type { SpeciesFilterOptions } from '@/composables/useQuizLogic'

/**
 * Maximum damage percentage for UI sliders and scenario filtering.
 */
export const MAX_DAMAGE_PERCENT = 110

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

/** Active field effects that modify battle calculations. */
export interface FieldEffects {
  weather?: 'Sun' | 'Rain' | 'Sand' | 'Snow' | 'Hail'
  terrain?: 'Grassy' | 'Electric' | 'Psychic' | 'Misty'
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
  /** Active field effects triggered by Pokémon abilities. */
  fieldEffects?: FieldEffects
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
 * Map abilities to the field effects they trigger.
 */
function getFieldEffectsFromAbility(ability?: string): FieldEffects {
  if (!ability) return {}
  
  const weatherAbilities: Record<string, FieldEffects['weather']> = {
    'Drought': 'Sun',
    'Drizzle': 'Rain',
    'Sand Stream': 'Sand',
    'Snow Warning': 'Snow',
    'Orichalcum Pulse': 'Sun',
    'Hadron Engine': 'Electric' as any, // This is actually terrain
    'Desolate Land': 'Sun',
    'Primordial Sea': 'Rain',
  }
  
  const terrainAbilities: Record<string, FieldEffects['terrain']> = {
    'Grassy Surge': 'Grassy',
    'Electric Surge': 'Electric',
    'Psychic Surge': 'Psychic',
    'Misty Surge': 'Misty',
  }
  
  const effects: FieldEffects = {}
  
  if (weatherAbilities[ability]) {
    effects.weather = weatherAbilities[ability]
  }
  
  if (terrainAbilities[ability]) {
    effects.terrain = terrainAbilities[ability]
  }
  
  // Special case: Hadron Engine sets Electric Terrain
  if (ability === 'Hadron Engine') {
    effects.weather = undefined
    effects.terrain = 'Electric'
  }
  
  return effects
}

/**
 * Combine field effects from attacker and defender, giving defender precedence.
 */
function mergeFieldEffects(attackerEffects: FieldEffects, defenderEffects: FieldEffects): FieldEffects {
  return {
    weather: defenderEffects.weather ?? attackerEffects.weather,
    terrain: defenderEffects.terrain ?? attackerEffects.terrain,
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

  // Level for calculation the damage
  const level = computed(() => filterOptions?.value.vgc ? 50 : 100)

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

  /** VGC or Doubles metagame set name prefixes to include/exclude. */
  const DOUBLES_SET_PREFIXES = ['Doubles', 'VGC']

  /** Filter out non-standard metagame sets from a Pokémon's set entries. */
  function filterStandardSets(setEntries: [string, SetdexSet][]): [string, SetdexSet][] {
    let filteredEntries = setEntries.filter(
      ([name]) => !EXCLUDED_SET_PREFIXES.some(prefix => name.startsWith(prefix)),
    );
    if (filterOptions?.value.vgc) {
      filteredEntries = filteredEntries.filter(
        ([name]) => DOUBLES_SET_PREFIXES.some(prefix => name.startsWith(prefix)),
      )
    } else {
      filteredEntries = filteredEntries.filter(
        ([name]) => !DOUBLES_SET_PREFIXES.some(prefix => name.startsWith(prefix)),
      )
    }
    return filteredEntries
  }

  /**
   * Pre-filtered Pokémon pool with only standard sets (based on VGC setting).
   * Each entry is guaranteed to have at least one valid set.
   */
  const pokemonWithFilteredSets = computed(() => {
    return pokemonWithSets.value
      .map(([name, sets]) => {
        const filteredSets = filterStandardSets(Object.entries(sets))
        return [name, Object.fromEntries(filteredSets)] as [string, Record<string, SetdexSet>]
      })
      .filter(([, sets]) => Object.keys(sets).length > 0)
  })

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
    const pool = pokemonWithFilteredSets.value
    if (pool.length < 2) return null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Pick random attacker
        const [atkName, atkSets] = randomPick(pool)
        const [atkSetName, atkSet] = randomPick(Object.entries(atkSets))

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
        const [defSetName, defSet] = randomPick(Object.entries(defSets))

        // Build @smogon/calc objects
        const attacker = new Pokemon(gen.value, atkName, {
          level: level.value,
          item: atkSet.item,
          nature: atkSet.nature,
          ability: atkSet.ability,
          evs: toStatSpread(atkSet.evs),
          ivs: atkSet.ivs ? toStatSpread(atkSet.ivs) : undefined,
        })

        const defender = new Pokemon(gen.value, defName, {
          level: level.value,
          item: defSet.item,
          nature: defSet.nature,
          ability: defSet.ability,
          evs: toStatSpread(defSet.evs),
          ivs: defSet.ivs ? toStatSpread(defSet.ivs) : undefined,
        })

        const move = new Move(gen.value, moveName)

        // Detect field effects from abilities (defender takes precedence)
        const attackerFieldEffects = getFieldEffectsFromAbility(atkSet.ability)
        const defenderFieldEffects = getFieldEffectsFromAbility(defSet.ability)
        const activeFieldEffects = mergeFieldEffects(attackerFieldEffects, defenderFieldEffects)

        const field = new Field({
          gameType: filterOptions?.value.vgc ? 'Doubles' : 'Singles',
          weather: activeFieldEffects.weather,
          terrain: activeFieldEffects.terrain,
        })

        const result = calculate(gen.value, attacker, defender, move, field)

        // Get damage range
        const range = result.range()
        if (!range || range[0] === 0) continue // Skip zero-damage moves

        const defHP = defender.maxHP()
        if (defHP <= 0) continue

        const minPct = (range[0] / defHP) * 100
        const maxPct = (range[1] / defHP) * 100
        const avgPct = (minPct + maxPct) / 2

        // Skip extremely high damage (>MAX_DAMAGE_PERCENT) or extremely low (<1%)
        if (avgPct < 1 || avgPct > MAX_DAMAGE_PERCENT) continue

        // Prepare field effects for display (only include if they exist)
        const scenarioFieldEffects: FieldEffects = {}
        if (activeFieldEffects.weather) scenarioFieldEffects.weather = activeFieldEffects.weather
        if (activeFieldEffects.terrain) scenarioFieldEffects.terrain = activeFieldEffects.terrain

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
          fieldEffects: Object.keys(scenarioFieldEffects).length > 0 ? scenarioFieldEffects : undefined,
        }
      } catch {
        // Some sets may reference invalid Pokémon/moves — skip
        continue
      }
    }

    return null
  }

  /**
   * Check if a user's guess falls within the damage roll range.
   */
  function isDamageGuessCorrect(
    guess: number,
    damageRange: [number, number],
  ): boolean {
    return guess >= Math.floor(damageRange[0]) && guess <= Math.ceil(damageRange[1])
  }

  return {
    generateDamageScenario,
    isDamageGuessCorrect,
    isReady,
    waitUntilReady,
  }
}
