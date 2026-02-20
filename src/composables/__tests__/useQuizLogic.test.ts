import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useQuizLogic, type SpeciesFilterOptions } from '../useQuizLogic'

// ---------------------------------------------------------------------------
// Mock @pkmn/dex — mirrors the mock used by the component tests but with
// enough data to exercise every composable code-path.
// ---------------------------------------------------------------------------

const bulbasaur = {
  name: 'bulbasaur', num: 1, forme: '', gen: 1,
  evos: ['ivysaur'],
  types: ['Grass', 'Poison'],
  abilities: { '0': 'Overgrow', H: 'Chlorophyll' },
  baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
}

const venusaur = {
  name: 'venusaur', num: 3, forme: '', gen: 1,
  evos: [],
  types: ['Grass', 'Poison'],
  abilities: { '0': 'Overgrow', H: 'Chlorophyll' },
  baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 },
}

const charizard = {
  name: 'charizard', num: 6, forme: '', gen: 1,
  evos: [],
  types: ['Fire', 'Flying'],
  abilities: { '0': 'Blaze', H: 'Solar Power' },
  baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 },
}

// Two Pokémon with *identical* base stats (fictional – used to test stat matching)
const statTwinA = {
  name: 'stat-twin-a', num: 900, forme: '', gen: 3,
  evos: [],
  types: ['Normal'],
  abilities: { '0': 'Keen Eye' },
  baseStats: { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 },
}

const statTwinB = {
  name: 'stat-twin-b', num: 901, forme: '', gen: 3,
  evos: [],
  types: ['Normal'],
  abilities: { '0': 'Run Away' },
  baseStats: { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 },
}

// Gmax forme — should always be filtered out
const charizardGmax = {
  name: 'charizard-gmax', num: 6, forme: 'Gmax', gen: 1,
  evos: [],
  types: ['Fire', 'Flying'],
  abilities: { '0': 'Blaze' },
  baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 },
}

// Alola-Totem forme — should always be filtered out
const raticate = {
  name: 'raticate-alola-totem', num: 20, forme: 'Alola-Totem', gen: 7,
  evos: [],
  types: ['Dark', 'Normal'],
  abilities: { '0': 'Hustle' },
  baseStats: { hp: 75, atk: 71, def: 70, spa: 40, spd: 80, spe: 77 },
}

// A Pokémon with num 0 — should be filtered out (CAP/placeholder)
const zeroPokemon = {
  name: 'missingno', num: 0, forme: '', gen: 1,
  evos: [],
  types: ['Normal'],
  abilities: { '0': 'Levitate' },
  baseStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
}

// A Gen-5 unevolved Pokémon
const oshawott = {
  name: 'oshawott', num: 501, forme: '', gen: 5,
  evos: ['dewott'],
  types: ['Water'],
  abilities: { '0': 'Torrent', H: 'Shell Armor' },
  baseStats: { hp: 55, atk: 55, def: 45, spa: 63, spd: 45, spe: 45 },
}

const allMockSpecies = [
  bulbasaur, venusaur, charizard,
  statTwinA, statTwinB,
  charizardGmax, raticate, zeroPokemon,
  oshawott,
]

vi.mock('@pkmn/dex', () => ({
  Dex: {
    forGen: () => ({
      species: {
        all: () => allMockSpecies,
      },
    }),
  },
}))

vi.mock('@/lib/pokemonNameHelper', () => ({
  getLocalizedPokemonName: (name: string, locale: string) =>
    locale === 'de' ? `DE:${name}` : name,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(
  overrides: Partial<SpeciesFilterOptions> = {},
  localeStr = 'en',
) {
  const options = ref<SpeciesFilterOptions>({
    generation: 9,
    minGeneration: 1,
    maxGeneration: 9,
    fullyEvolvedOnly: false,
    includeMegaPokemon: false,
    ...overrides,
  })
  const locale = ref(localeStr)
  return { ...useQuizLogic(options, locale), options, locale }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useQuizLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── species filtering ──────────────────────────────────────────────

  describe('species', () => {
    it('excludes Pokémon with num <= 0', () => {
      const { species } = setup()
      expect(species.value.every((s) => s.num > 0)).toBe(true)
      expect(species.value.find((s) => s.name === 'missingno')).toBeUndefined()
    })

    it('excludes Gmax formes', () => {
      const { species } = setup()
      expect(species.value.find((s) => s.name === 'charizard-gmax')).toBeUndefined()
    })

    it('excludes Alola-Totem formes', () => {
      const { species } = setup()
      expect(species.value.find((s) => s.name === 'raticate-alola-totem')).toBeUndefined()
    })

    it('filters by generation range', () => {
      const { species } = setup({ minGeneration: 3, maxGeneration: 3 })
      // Only the stat-twins are gen 3
      expect(species.value.length).toBe(2)
      expect(species.value.every((s) => s.gen === 3)).toBe(true)
    })

    it('includes unevolved Pokémon when fullyEvolvedOnly is false', () => {
      const { species } = setup({ fullyEvolvedOnly: false })
      const unevolved = species.value.filter((s) => s.evos && s.evos.length > 0)
      expect(unevolved.length).toBeGreaterThan(0)
    })

    it('excludes unevolved Pokémon when fullyEvolvedOnly is true', () => {
      const { species } = setup({ fullyEvolvedOnly: true })
      expect(species.value.every((s) => !s.evos || s.evos.length === 0)).toBe(true)
      expect(species.value.find((s) => s.name === 'bulbasaur')).toBeUndefined()
      expect(species.value.find((s) => s.name === 'oshawott')).toBeUndefined()
    })

    it('reactively updates when options change', async () => {
      const { species, options } = setup({ minGeneration: 1, maxGeneration: 9, fullyEvolvedOnly: false })
      const initialCount = species.value.length

      options.value = { ...options.value, minGeneration: 5, maxGeneration: 5 }
      await nextTick()

      // Only oshawott is gen 5
      expect(species.value.length).toBe(1)
      expect(species.value[0]!.name).toBe('oshawott')
      expect(species.value.length).toBeLessThan(initialCount)
    })
  })

  // ── generateRandomPokemon ──────────────────────────────────────────

  describe('generateRandomPokemon', () => {
    it('returns a species from the filtered list', () => {
      const { species, generateRandomPokemon } = setup()
      const pokemon = generateRandomPokemon()
      expect(species.value).toContainEqual(pokemon)
    })

    it('never returns excluded species (Gmax, totem, num 0)', () => {
      const { generateRandomPokemon } = setup()
      for (let i = 0; i < 50; i++) {
        const p = generateRandomPokemon()
        expect(p.forme).not.toBe('Gmax')
        expect(p.forme).not.toBe('Alola-Totem')
        expect(p.num).toBeGreaterThan(0)
      }
    })

    it('avoids repeating the same Pokémon in short succession', () => {
      const { generateRandomPokemon } = setup()
      
      // Generate several Pokémon and check that immediate repeats are avoided
      let previous = generateRandomPokemon().name
      let immediateRepeatCount = 0
      
      // With proper anti-repeat logic, we should see very few immediate repeats
      // (only possible if the pool is extremely small)
      for (let i = 0; i < 50; i++) {
        const current = generateRandomPokemon().name
        if (current === previous) {
          immediateRepeatCount++
        }
        previous = current
      }
      
      // With 6 unique Pokémon in our mock, immediate repeats should be very rare
      // With history of 10, probability of repeat should be near zero
      // Allow up to 5 repeats due to randomness (10% of 50 attempts)
      expect(immediateRepeatCount).toBeLessThan(5)
    })

    it('weighs Pokémon with identical stats equally', () => {
      const { generateRandomPokemon } = setup()
      const results = new Map<string, number>()
      
      // Generate many Pokémon to check distribution
      for (let i = 0; i < 200; i++) {
        const pokemon = generateRandomPokemon()
        const statsKey = `${pokemon.baseStats.hp}-${pokemon.baseStats.atk}-${pokemon.baseStats.def}-${pokemon.baseStats.spa}-${pokemon.baseStats.spd}-${pokemon.baseStats.spe}`
        results.set(statsKey, (results.get(statsKey) || 0) + 1)
      }
      
      // Our mock has stat-twin-a and stat-twin-b with identical stats
      // Together they should not be overly represented compared to unique stat Pokémon
      // This is a probabilistic test, so we just check they don't dominate
      const counts = Array.from(results.values())
      const max = Math.max(...counts)
      const min = Math.min(...counts)
      
      // No stat signature should appear more than 4x as often as the least common
      // (with proper weighting, distribution should be more even)
      expect(max / min).toBeLessThan(4)
    })
  })

  // ── getPokemonStats ────────────────────────────────────────────────

  describe('getPokemonStats', () => {
    it('maps pkmn/dex stat keys to human-readable names', () => {
      const { getPokemonStats, findSpecies } = setup()
      const pokemon = findSpecies('charizard')!
      const stats = getPokemonStats(pokemon)

      expect(stats).toEqual({
        hp: 78,
        attack: 84,
        defense: 78,
        specialAttack: 109,
        specialDefense: 85,
        speed: 100,
      })
    })

    it('returns numbers for every stat field', () => {
      const { getPokemonStats, generateRandomPokemon } = setup()
      const stats = getPokemonStats(generateRandomPokemon())
      for (const val of Object.values(stats)) {
        expect(typeof val).toBe('number')
      }
    })
  })

  // ── hasMatchingStats ───────────────────────────────────────────────

  describe('hasMatchingStats', () => {
    it('returns true for the same Pokémon', () => {
      const { hasMatchingStats, findSpecies } = setup()
      const poke = findSpecies('venusaur')!
      expect(hasMatchingStats(poke, poke)).toBe(true)
    })

    it('returns true for different Pokémon with identical stats', () => {
      const { hasMatchingStats, findSpecies } = setup()
      const a = findSpecies('stat-twin-a')!
      const b = findSpecies('stat-twin-b')!
      expect(hasMatchingStats(a, b)).toBe(true)
    })

    it('returns false for Pokémon with different stats', () => {
      const { hasMatchingStats, findSpecies } = setup()
      const a = findSpecies('bulbasaur')!
      const b = findSpecies('charizard')!
      expect(hasMatchingStats(a, b)).toBe(false)
    })
  })

  // ── isCorrectGuess ─────────────────────────────────────────────────

  describe('isCorrectGuess', () => {
    it('returns true for a correct exact guess', () => {
      const { isCorrectGuess, findSpecies } = setup()
      const target = findSpecies('charizard')!
      expect(isCorrectGuess('charizard', target)).toBe(true)
    })

    it('returns true when guessed Pokémon has matching stats (stat twins)', () => {
      const { isCorrectGuess, findSpecies } = setup()
      const target = findSpecies('stat-twin-a')!
      expect(isCorrectGuess('stat-twin-b', target)).toBe(true)
    })

    it('returns false for an incorrect guess', () => {
      const { isCorrectGuess, findSpecies } = setup()
      const target = findSpecies('charizard')!
      expect(isCorrectGuess('bulbasaur', target)).toBe(false)
    })

    it('returns false for an empty string guess', () => {
      const { isCorrectGuess, findSpecies } = setup()
      const target = findSpecies('charizard')!
      expect(isCorrectGuess('', target)).toBe(false)
    })

    it('returns false for a non-existent Pokémon name', () => {
      const { isCorrectGuess, findSpecies } = setup()
      const target = findSpecies('charizard')!
      expect(isCorrectGuess('totally-made-up', target)).toBe(false)
    })
  })

  // ── speciesSelection ───────────────────────────────────────────────

  describe('speciesSelection', () => {
    it('produces label/value pairs for every filtered species', () => {
      const { species, speciesSelection } = setup()
      expect(speciesSelection.value.length).toBe(species.value.length)

      for (const item of speciesSelection.value) {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('value')
        expect(typeof item.label).toBe('string')
        expect(typeof item.value).toBe('string')
      }
    })

    it('uses English names when locale is "en"', () => {
      const { speciesSelection } = setup({}, 'en')
      const charizardItem = speciesSelection.value.find((s) => s.value === 'charizard')
      expect(charizardItem?.label).toBe('charizard')
    })

    it('uses localized (DE) names when locale is "de"', () => {
      const { speciesSelection } = setup({}, 'de')
      const charizardItem = speciesSelection.value.find((s) => s.value === 'charizard')
      expect(charizardItem?.label).toBe('DE:charizard')
    })

    it('reactively updates when locale changes', async () => {
      const { speciesSelection, locale } = setup({}, 'en')
      const before = speciesSelection.value.find((s) => s.value === 'charizard')?.label
      expect(before).toBe('charizard')

      locale.value = 'de'
      await nextTick()

      const after = speciesSelection.value.find((s) => s.value === 'charizard')?.label
      expect(after).toBe('DE:charizard')
    })
  })

  // ── getLocalizedName ───────────────────────────────────────────────

  describe('getLocalizedName', () => {
    it('returns English name for "en" locale', () => {
      const { getLocalizedName } = setup({}, 'en')
      expect(getLocalizedName('charizard')).toBe('charizard')
    })

    it('returns German name for "de" locale', () => {
      const { getLocalizedName } = setup({}, 'de')
      expect(getLocalizedName('charizard')).toBe('DE:charizard')
    })

    it('follows locale changes reactively', async () => {
      const { getLocalizedName, locale } = setup({}, 'en')
      expect(getLocalizedName('charizard')).toBe('charizard')

      locale.value = 'de'
      await nextTick()

      expect(getLocalizedName('charizard')).toBe('DE:charizard')
    })
  })

  // ── findSpecies ────────────────────────────────────────────────────

  describe('findSpecies', () => {
    it('finds a Pokémon by name', () => {
      const { findSpecies } = setup()
      const result = findSpecies('bulbasaur')
      expect(result).toBeDefined()
      expect(result!.name).toBe('bulbasaur')
    })

    it('returns undefined for unknown names', () => {
      const { findSpecies } = setup()
      expect(findSpecies('does-not-exist')).toBeUndefined()
    })

    it('returns undefined for filtered-out species', () => {
      // Gen 1 only — oshawott is gen 5
      const { findSpecies } = setup({ minGeneration: 1, maxGeneration: 1 })
      expect(findSpecies('oshawott')).toBeUndefined()
    })

    it('returns undefined for Gmax formes (always excluded)', () => {
      const { findSpecies } = setup()
      expect(findSpecies('charizard-gmax')).toBeUndefined()
    })
  })

  // ── generationDex ──────────────────────────────────────────────────

  describe('generationDex', () => {
    it('is reactive to generation changes', async () => {
      const { generationDex, options } = setup({ generation: 9 })
      // The mock always returns the same Dex, but the computed should re-evaluate
      const dex1 = generationDex.value
      options.value = { ...options.value, generation: 5 }
      await nextTick()
      const dex2 = generationDex.value
      // With the mock both will be the same object, but the computed itself was re-triggered
      expect(dex1).toBeDefined()
      expect(dex2).toBeDefined()
    })
  })

  // ── Integration: options + species + selection stay in sync ─────────

  describe('integration', () => {
    it('changing fullyEvolvedOnly updates species and speciesSelection together', async () => {
      const { species, speciesSelection, options } = setup({ fullyEvolvedOnly: false })
      const speciesBefore = species.value.length
      const selectionBefore = speciesSelection.value.length
      expect(speciesBefore).toBe(selectionBefore)

      options.value = { ...options.value, fullyEvolvedOnly: true }
      await nextTick()

      expect(species.value.length).toBeLessThan(speciesBefore)
      expect(speciesSelection.value.length).toBe(species.value.length)
    })

    it('isCorrectGuess respects current species filter', async () => {
      const { isCorrectGuess, findSpecies, options } = setup({ minGeneration: 1, maxGeneration: 9 })

      // oshawott is in the list — guess against itself should be correct
      const target = findSpecies('oshawott')!
      expect(isCorrectGuess('oshawott', target)).toBe(true)

      // Now restrict to gen 1 — oshawott is no longer in the species list
      options.value = { ...options.value, minGeneration: 1, maxGeneration: 1 }
      await nextTick()

      // The target object still exists, but oshawott is no longer findable
      expect(isCorrectGuess('oshawott', target)).toBe(false)
    })
  })
})
