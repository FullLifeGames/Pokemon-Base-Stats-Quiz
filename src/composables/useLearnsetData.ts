import { computed, type Ref, type ComputedRef } from 'vue'
import { Dex, type Species, type GenerationNum } from '@pkmn/dex'
import { Generations, type Learnset } from '@pkmn/data'

// Side-effect import: load learnsets data into Dex
import '@pkmn/dex/build/learnsets.min.js'

const gens = new Generations(Dex)

/** Minimal move info for display. */
export interface MoveInfo {
  name: string
  type: string
  category: 'Physical' | 'Special' | 'Status'
  basePower: number
}

/** Moves grouped by type, sorted alphabetically. */
export type MovesByType = Record<string, MoveInfo[]>

/**
 * Composable that provides learnset data for a given generation.
 *
 * - `getLearnsetMoves(species)` → moves grouped by type
 * - `getRandomMovesSubset(moves, count)` → random subset for quiz hints
 */
export function useLearnsetData(
  generation: Ref<GenerationNum> | ComputedRef<GenerationNum>,
) {
  const gen = computed(() => gens.get(generation.value))

  /**
   * Fetch all learnable moves for a species and return them grouped by type.
   */
  async function getLearnsetMoves(species: Species): Promise<MovesByType> {
    let learnset: Learnset["learnset"] | undefined;
    // Gen 9 has a special "Paldea" restriction that limits learnsets to what was actually available in that region.
    if (generation.value === 9) {
      learnset = await gen.value.learnsets.learnable(species.name, 'Paldea')
    } else {
      learnset = (await gen.value.learnsets.get(species.name))?.learnset
    }
    if (!learnset) return {}

    const movesByType: MovesByType = {}

    for (const moveId of Object.keys(learnset)) {
      const move = gen.value.moves.get(moveId)
      if (!move || move.isNonstandard !== null) continue

      const info: MoveInfo = {
        name: move.name,
        type: move.type,
        category: move.category as MoveInfo['category'],
        basePower: move.basePower,
      }

      if (!movesByType[move.type]) {
        movesByType[move.type] = []
      }
      movesByType[move.type]!.push(info)
    }

    // Sort moves within each type alphabetically
    for (const type of Object.keys(movesByType)) {
      movesByType[type]!.sort((a, b) => a.name.localeCompare(b.name))
    }

    return movesByType
  }

  /**
   * Flatten a MovesByType record into a single sorted array.
   */
  function flattenMoves(movesByType: MovesByType): MoveInfo[] {
    return Object.values(movesByType)
      .flat()
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Pick a random subset of moves (preserving type grouping).
   * Useful for making the quiz harder by limiting visible moves.
   */
  function getRandomMovesSubset(movesByType: MovesByType, count: number): MovesByType {
    const allMoves = flattenMoves(movesByType)
    const shuffled = allMoves.sort(() => Math.random() - 0.5)
    const subset = shuffled.slice(0, count)

    const result: MovesByType = {}
    for (const move of subset) {
      if (!result[move.type]) {
        result[move.type] = []
      }
      result[move.type]!.push(move)
    }

    // Sort moves within each type
    for (const type of Object.keys(result)) {
      result[type]!.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }

  return {
    gen,
    getLearnsetMoves,
    flattenMoves,
    getRandomMovesSubset,
  }
}
