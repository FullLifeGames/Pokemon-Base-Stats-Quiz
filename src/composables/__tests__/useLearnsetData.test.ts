import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { GenerationNum } from '@pkmn/dex'
import type { MovesByType, MoveInfo } from '../useLearnsetData'

// ---------------------------------------------------------------------------
// Mock move data used by getLearnsetMoves under the hood
// ---------------------------------------------------------------------------

const mockMoveDatabase: Record<string, { name: string; type: string; category: string; basePower: number; isNonstandard: null | string }> = {
  tackle: { name: 'Tackle', type: 'Normal', category: 'Physical', basePower: 40, isNonstandard: null },
  growl: { name: 'Growl', type: 'Normal', category: 'Status', basePower: 0, isNonstandard: null },
  ember: { name: 'Ember', type: 'Fire', category: 'Special', basePower: 40, isNonstandard: null },
  scratch: { name: 'Scratch', type: 'Normal', category: 'Physical', basePower: 40, isNonstandard: null },
  watergun: { name: 'Water Gun', type: 'Water', category: 'Special', basePower: 40, isNonstandard: null },
}

// Learnset entries per species (moveId -> learn string)
const mockLearnsetDatabase: Record<string, Record<string, string>> = {
  'species-a':      { tackle: '5L1', growl: '5L1', ember: '5L5' },
  'learnset-twin':  { tackle: '5L1', growl: '5L1', ember: '5L5' }, // same moves as species-a
  'species-c':      { scratch: '5L1', watergun: '5L3' },           // different moves
}

// Pre-built MovesByType for convenience in non-async tests
const tackle: MoveInfo = { name: 'Tackle', type: 'Normal', category: 'Physical', basePower: 40 }
const growl: MoveInfo = { name: 'Growl', type: 'Normal', category: 'Status', basePower: 0 }
const ember: MoveInfo = { name: 'Ember', type: 'Fire', category: 'Special', basePower: 40 }
const scratch: MoveInfo = { name: 'Scratch', type: 'Normal', category: 'Physical', basePower: 40 }
const waterGun: MoveInfo = { name: 'Water Gun', type: 'Water', category: 'Special', basePower: 40 }

const sharedMovesByType: MovesByType = {
  Normal: [growl, tackle],
  Fire: [ember],
}

const differentMovesByType: MovesByType = {
  Normal: [scratch],
  Water: [waterGun],
}

// Fake species objects
const speciesA = { name: 'species-a' } as any
const learnsetTwin = { name: 'learnset-twin' } as any
const speciesC = { name: 'species-c' } as any
const speciesBroken = { name: 'species-broken' } as any

// ---------------------------------------------------------------------------
// Mock @pkmn/dex + @pkmn/data
// ---------------------------------------------------------------------------

const mockLearnsets = {
  get: vi.fn(async (name: string) => {
    const learnset = mockLearnsetDatabase[name]
    return learnset ? { learnset } : undefined
  }),
  learnable: vi.fn(),
}

const mockMoves = {
  get: vi.fn((moveId: string) => mockMoveDatabase[moveId] ?? null),
}

const mockGen = {
  learnsets: mockLearnsets,
  moves: mockMoves,
}

vi.mock('@pkmn/dex', () => ({
  Dex: {},
}))

vi.mock('@pkmn/data', () => ({
  Generations: class {
    get() { return mockGen }
  },
}))

vi.mock('@pkmn/dex/build/learnsets.min.js', () => ({}))

// ---------------------------------------------------------------------------
// Import composable AFTER mocks are set up
// ---------------------------------------------------------------------------

import { useLearnsetData } from '../useLearnsetData'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLearnsetData', () => {
  let composable: ReturnType<typeof useLearnsetData>

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup default mock implementations after clearAllMocks
    mockLearnsets.get.mockImplementation(async (name: string) => {
      const learnset = mockLearnsetDatabase[name]
      return learnset ? { learnset } : undefined
    })
    mockMoves.get.mockImplementation((moveId: string) => mockMoveDatabase[moveId] ?? null)

    const generation = ref<GenerationNum>(5)
    composable = useLearnsetData(generation)
  })

  // ── getLearnsetSignature ───────────────────────────────────────────

  describe('getLearnsetSignature', () => {
    it('produces the same signature for identical learnsets regardless of type grouping order', () => {
      const movesGroupedAB: MovesByType = {
        Fire: [ember],
        Normal: [growl, tackle],
      }
      const movesGroupedBA: MovesByType = {
        Normal: [tackle, growl],
        Fire: [ember],
      }

      expect(composable.getLearnsetSignature(movesGroupedAB))
        .toBe(composable.getLearnsetSignature(movesGroupedBA))
    })

    it('produces different signatures for different learnsets', () => {
      expect(composable.getLearnsetSignature(sharedMovesByType))
        .not.toBe(composable.getLearnsetSignature(differentMovesByType))
    })

    it('returns an empty string for an empty learnset', () => {
      expect(composable.getLearnsetSignature({})).toBe('')
    })
  })

  // ── hasMatchingLearnset ────────────────────────────────────────────

  describe('hasMatchingLearnset', () => {
    it('returns true when the guessed Pokémon has the same learnset as the target', async () => {
      // species-a and learnset-twin share the same moves in mockLearnsetDatabase
      const targetMoves = await composable.getLearnsetMoves(speciesA)
      const result = await composable.hasMatchingLearnset(learnsetTwin, targetMoves)

      expect(result).toBe(true)
    })

    it('returns false when the guessed Pokémon has a different learnset', async () => {
      const targetMoves = await composable.getLearnsetMoves(speciesA)
      const result = await composable.hasMatchingLearnset(speciesC, targetMoves)

      expect(result).toBe(false)
    })

    it('returns false when getLearnsetMoves throws', async () => {
      mockLearnsets.get.mockRejectedValueOnce(new Error('data unavailable'))

      const result = await composable.hasMatchingLearnset(speciesBroken, sharedMovesByType)

      expect(result).toBe(false)
    })
  })

  // ── flattenMoves ───────────────────────────────────────────────────

  describe('flattenMoves', () => {
    it('flattens grouped moves into a single alphabetically sorted array', () => {
      const flat = composable.flattenMoves(sharedMovesByType)

      expect(flat.map(m => m.name)).toEqual(['Ember', 'Growl', 'Tackle'])
    })

    it('returns an empty array for empty input', () => {
      expect(composable.flattenMoves({})).toEqual([])
    })
  })

  // ── getRandomMovesSubset ───────────────────────────────────────────

  describe('getRandomMovesSubset', () => {
    it('returns at most `count` moves, preserving type grouping', () => {
      const subset = composable.getRandomMovesSubset(sharedMovesByType, 2)

      const totalMoves = Object.values(subset).flat()
      expect(totalMoves.length).toBe(2)

      // Every move in the subset must exist in the original
      const originalNames = Object.values(sharedMovesByType).flat().map(m => m.name)
      for (const move of totalMoves) {
        expect(originalNames).toContain(move.name)
      }
    })
  })

  // ── getRandomPokemonWithMoves ──────────────────────────────────────

  describe('getRandomPokemonWithMoves', () => {
    it('retries when the first species has an empty learnset', async () => {
      let callCount = 0
      const generator = (): any => {
        callCount++
        return callCount === 1 ? speciesBroken : speciesA
      }

      const { pokemon, moves } = await composable.getRandomPokemonWithMoves(generator)

      expect(pokemon.name).toBe('species-a')
      expect(Object.keys(moves).length).toBeGreaterThan(0)
      expect(callCount).toBe(2)
    })
  })
})
