import type { Species } from '@pkmn/dex'
import type { MoveInfo } from '@/composables/useLearnsetData'
import type { DamageScenario } from '@/composables/useDamageCalc'
import type { PlayerRoundResult, VsPlayer, VsRound } from '@/types/vsMode'
import type { QuizMode } from '@/types/settings'
import { getPokemonValueTarget } from '@/lib/valueQuizOptions'

export type ValueMode = 'weight' | 'height'
export type ClosestScoreMode = 'damage' | ValueMode

export interface CreateRoundParams {
  quizMode: QuizMode
  roundNumber: number
  timeLimit: number
  generateRandomPokemon: () => Species
  getRandomPokemonWithMoves: (generator: () => Species) => Promise<{ pokemon: Species; moves: Record<string, MoveInfo[]> }>
  waitDamageReady: () => Promise<void>
  generateDamageScenario: () => DamageScenario | null
}

export function isValueMode(mode: QuizMode): mode is ValueMode {
  return mode === 'weight' || mode === 'height'
}

export function getValueTolerance(mode: ValueMode, targetValue: number): number {
  if (mode === 'weight') {
    return Math.max(2, targetValue * 0.08)
  }
  return Math.max(0.1, targetValue * 0.08)
}

export function isValueGuessWithinTolerance(mode: ValueMode, targetValue: number, guessedValue: number): boolean {
  return Math.abs(guessedValue - targetValue) <= getValueTolerance(mode, targetValue)
}

export function getDamageDistance(guess: number, damageRange: [number, number]): number {
  const [minDamage, maxDamage] = damageRange
  if (guess >= minDamage && guess <= maxDamage) return 0
  return Math.min(Math.abs(guess - minDamage), Math.abs(guess - maxDamage))
}

export function getClosestGuessScore(distance: number, bestDistance: number, mode: ClosestScoreMode): number {
  if (!Number.isFinite(distance)) return 0

  const modeScale = mode === 'damage' ? 20 : mode === 'weight' ? 30 : 0.8
  const normalized = Math.min(distance / modeScale, 2)
  const baseScore = Math.max(0, Math.round(900 - normalized * 550))
  const closestBonus = distance === bestDistance ? 200 : 0
  return baseScore + closestBonus
}

export function resetRoundAnswerState(players: VsPlayer[]): void {
  for (const player of players) {
    player.hasAnswered = false
    player.lastGuess = null
    player.lastGuessCorrect = null
    player.lastGuessTimestamp = null
    player.roundScore = 0
  }
}

export function resetMatchScores(players: VsPlayer[]): void {
  for (const player of players) {
    player.score = 0
    player.roundScore = 0
  }
}

export function applyPlayerAnswer(
  player: VsPlayer,
  guess: string,
  correct: boolean,
  timestamp = Date.now(),
): void {
  player.hasAnswered = true
  player.lastGuess = guess
  player.lastGuessCorrect = correct
  player.lastGuessTimestamp = timestamp
}

export function applyRoundResults(players: VsPlayer[], results: PlayerRoundResult[]): void {
  for (const result of results) {
    const player = players.find(p => p.id === result.playerId)
    if (player) {
      player.roundScore = result.score
      player.score += result.score
    }
  }
}

export async function createRoundForQuizMode(params: CreateRoundParams): Promise<VsRound> {
  const {
    quizMode,
    roundNumber,
    timeLimit,
    generateRandomPokemon,
    getRandomPokemonWithMoves,
    waitDamageReady,
    generateDamageScenario,
  } = params

  if (quizMode === 'damage') {
    await waitDamageReady()
    const scenario = generateDamageScenario()
    return {
      number: roundNumber,
      pokemonId: scenario ? scenario.attackerName : 'Unknown',
      pokemonTypes: [],
      pokemonAbilities: [],
      timeRemaining: timeLimit,
      hintLevel: 0,
      results: [],
      damageScenario: scenario ?? undefined,
    }
  }

  let pokemon: Species
  let learnsetMoves: Record<string, MoveInfo[]> | undefined
  let targetValue: number | undefined
  let targetUnit: 'kg' | 'm' | undefined

  if (quizMode === 'learnset') {
    const learnsetResult = await getRandomPokemonWithMoves(generateRandomPokemon)
    pokemon = learnsetResult.pokemon
    learnsetMoves = learnsetResult.moves
  } else {
    pokemon = generateRandomPokemon()

    if (isValueMode(quizMode)) {
      const target = getPokemonValueTarget(quizMode, pokemon)
      targetValue = target.targetValue
      targetUnit = target.targetUnit
    }
  }

  return {
    number: roundNumber,
    pokemonId: pokemon.name,
    pokemonTypes: [...pokemon.types],
    pokemonAbilities: Object.values(pokemon.abilities).filter(a => a) as string[],
    timeRemaining: timeLimit,
    hintLevel: 0,
    results: [],
    ...(learnsetMoves && { learnsetMoves }),
    ...(targetValue !== undefined && { targetValue, targetUnit }),
  }
}
