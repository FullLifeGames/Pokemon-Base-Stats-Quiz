import { describe, it, expect, vi } from 'vitest'
import type { VsPlayer } from '@/types/vsMode'
import {
  applyPlayerAnswer,
  applyRoundResults,
  createRoundForQuizMode,
  getClosestGuessScore,
  getDamageDistance,
  getValueTolerance,
  isValueGuessWithinTolerance,
  isValueMode,
  resetMatchScores,
  resetRoundAnswerState,
} from '@/lib/vsGameRoundUtils'

function createTestPlayer(overrides: Partial<VsPlayer> = {}): VsPlayer {
  return {
    id: 'p1',
    name: 'Player',
    role: 'player',
    score: 0,
    roundScore: 0,
    hasAnswered: false,
    lastGuess: null,
    lastGuessCorrect: null,
    lastGuessTimestamp: null,
    connected: true,
    ...overrides,
  }
}

describe('vsGameRoundUtils', () => {
  it('detects value modes', () => {
    expect(isValueMode('weight')).toBe(true)
    expect(isValueMode('height')).toBe(true)
    expect(isValueMode('damage')).toBe(false)
  })

  it('calculates value tolerance by mode', () => {
    expect(getValueTolerance('weight', 100)).toBeGreaterThan(2)
    expect(getValueTolerance('height', 1)).toBeGreaterThanOrEqual(0.1)
  })

  it('checks if guessed value is within tolerance', () => {
    expect(isValueGuessWithinTolerance('weight', 100, 105)).toBe(true)
    expect(isValueGuessWithinTolerance('height', 1, 2)).toBe(false)
  })

  it('calculates damage distance from range', () => {
    expect(getDamageDistance(50, [40, 60])).toBe(0)
    expect(getDamageDistance(35, [40, 60])).toBe(5)
  })

  it('returns non-negative closest score and rewards best distance', () => {
    const best = getClosestGuessScore(0, 0, 'damage')
    const worse = getClosestGuessScore(20, 0, 'damage')
    expect(best).toBeGreaterThan(worse)
    expect(worse).toBeGreaterThanOrEqual(0)
  })

  it('resets round answer state', () => {
    const players = [
      createTestPlayer({ hasAnswered: true, lastGuess: 'Pikachu', lastGuessCorrect: true, lastGuessTimestamp: 1, roundScore: 99 }),
    ]

    resetRoundAnswerState(players)

    expect(players[0]).toMatchObject({
      hasAnswered: false,
      lastGuess: null,
      lastGuessCorrect: null,
      lastGuessTimestamp: null,
      roundScore: 0,
    })
  })

  it('resets match scores only', () => {
    const players = [createTestPlayer({ score: 10, roundScore: 7, hasAnswered: true })]
    resetMatchScores(players)

    expect(players[0]?.score).toBe(0)
    expect(players[0]?.roundScore).toBe(0)
    expect(players[0]?.hasAnswered).toBe(true)
  })

  it('applies player answer payload', () => {
    const player = createTestPlayer()
    applyPlayerAnswer(player, '25', true, 123)

    expect(player).toMatchObject({
      hasAnswered: true,
      lastGuess: '25',
      lastGuessCorrect: true,
      lastGuessTimestamp: 123,
    })
  })

  it('applies round results to player scores', () => {
    const players = [createTestPlayer({ id: 'p1' }), createTestPlayer({ id: 'p2' })]
    const results = [
      { playerId: 'p1', playerName: 'P1', guess: 'A', correct: true, timestamp: 1, score: 300 },
      { playerId: 'p2', playerName: 'P2', guess: 'B', correct: false, timestamp: 2, score: 0 },
    ]

    applyRoundResults(players, results)

    expect(players[0]?.score).toBe(300)
    expect(players[0]?.roundScore).toBe(300)
    expect(players[1]?.score).toBe(0)
  })

  it('creates damage round for damage mode', async () => {
    const round = await createRoundForQuizMode({
      quizMode: 'damage',
      roundNumber: 2,
      timeLimit: 30,
      generateRandomPokemon: vi.fn(),
      getRandomPokemonWithMoves: vi.fn(),
      waitDamageReady: vi.fn(async () => {}),
      generateDamageScenario: vi.fn(() => ({
        attackerName: 'Pikachu',
        attackerSetName: 'Set',
        attackerSet: { moves: ['Thunderbolt'] },
        defenderName: 'Bulbasaur',
        defenderSetName: 'Set',
        defenderSet: { moves: ['Tackle'] },
        moveName: 'Thunderbolt',
        damagePercent: 50,
        damageRange: [40, 60] as [number, number],
      })),
    })

    expect(round.number).toBe(2)
    expect(round.pokemonId).toBe('Pikachu')
    expect(round.damageScenario).toBeDefined()
  })

  it('creates learnset and value rounds for non-damage modes', async () => {
    const pokemon = {
      name: 'Pikachu',
      types: ['Electric'],
      abilities: { 0: 'Static' },
      weightkg: 6,
    }

    const learnsetRound = await createRoundForQuizMode({
      quizMode: 'learnset',
      roundNumber: 1,
      timeLimit: 20,
      generateRandomPokemon: vi.fn(() => pokemon as any),
      getRandomPokemonWithMoves: vi.fn(async () => ({ pokemon: pokemon as any, moves: { Electric: [{ name: 'Thunderbolt', type: 'Electric' }] as any } })),
      waitDamageReady: vi.fn(async () => {}),
      generateDamageScenario: vi.fn(),
    })

    const weightRound = await createRoundForQuizMode({
      quizMode: 'weight',
      roundNumber: 1,
      timeLimit: 20,
      generateRandomPokemon: vi.fn(() => pokemon as any),
      getRandomPokemonWithMoves: vi.fn(),
      waitDamageReady: vi.fn(async () => {}),
      generateDamageScenario: vi.fn(),
    })

    expect(learnsetRound.learnsetMoves).toBeDefined()
    expect(weightRound.targetValue).toBe(6)
    expect(weightRound.targetUnit).toBe('kg')
  })
})
