import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useVsGame } from '../useVsGame'

// Mock usePeerConnection
vi.mock('../usePeerConnection', () => ({
  usePeerConnection: vi.fn(() => ({
    peer: { value: null },
    connections: { value: [] },
    myPeerId: { value: 'test-peer-id' },
    isConnected: { value: false },
    isHosting: { value: false },
    error: { value: null },
    myRole: { value: 'host' },
    hostRoom: vi.fn().mockResolvedValue(undefined),
    joinRoom: vi.fn().mockResolvedValue(undefined),
    sendToAll: vi.fn(),
    sendTo: vi.fn(),
    destroy: vi.fn(),
  })),
}))

/**
 * Comprehensive tests for useVsGame composable
 * Tests cover state management, game logic, and multiplayer interactions
 */

describe('useVsGame', () => {
  let game: ReturnType<typeof useVsGame>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()

    // Clear sessionStorage
    sessionStorage.clear()

    game = useVsGame()
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  describe('Initialization', () => {
    it('should initialize with idle state', () => {
      expect(game.gameState.value).toBe('idle')
      expect(game.roomCode.value).toBe('')
      expect(game.currentRound.value).toBe(null)
      expect(game.roundNumber.value).toBe(0)
    })

    it('should initialize with default settings', () => {
      expect(game.settings.value).toMatchObject({
        generation: 9,
        minGeneration: 1,
        maxGeneration: 9,
        fullyEvolvedOnly: true,
        includeMegaPokemon: false,
        hintsEnabled: true,
        timeLimit: 30,
        gameMode: 'rounds',
        totalRounds: 10,
        targetScore: 5000,
      })
    })

    it('should generate a random player name', () => {
      expect(game.myName.value).toBeTruthy()
      expect(game.myName.value.length).toBeGreaterThan(0)
    })

    it('should initialize with empty players list', () => {
      expect(game.players.value).toEqual([])
    })
  })

  describe('Computed Properties', () => {
    it('should filter species by generation settings', () => {
      game.settings.value.generation = 1
      game.settings.value.minGeneration = 1
      game.settings.value.maxGeneration = 1

      const filtered = game.species.value
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(s => s.gen === 1)).toBe(true)
    })

    it('should filter fully evolved Pokémon when enabled', () => {
      game.settings.value.fullyEvolvedOnly = true

      const filtered = game.species.value
      expect(filtered.every(s => !s.evos || s.evos.length === 0)).toBe(true)
    })

    it('should allow adding spectators', () => {
      expect(game.spectators.value).toHaveLength(0)

      game.spectators.value = [
        { id: 'spec1', name: 'Spec1', role: 'spectator', score: 0, roundScore: 0, hasAnswered: false, lastGuess: null, lastGuessCorrect: null, lastGuessTimestamp: null, connected: true },
        { id: 'spec2', name: 'Spec2', role: 'spectator', score: 0, roundScore: 0, hasAnswered: false, lastGuess: null, lastGuessCorrect: null, lastGuessTimestamp: null, connected: true },
      ]

      expect(game.spectators.value).toHaveLength(2)
    })
  })

  describe('Settings Management', () => {
    it('should update maxScore setting', () => {
      game.updateSettings({ ...game.settings.value, maxScore: 15 })
      expect(game.settings.value.maxScore).toBe(15)
    })

    it('should update generation setting', () => {
      game.updateSettings({ ...game.settings.value, generation: 5 })
      expect(game.settings.value.generation).toBe(5)
    })

    it('should update fullyEvolvedOnly setting', () => {
      game.updateSettings({ ...game.settings.value, fullyEvolvedOnly: true })
      expect(game.settings.value.fullyEvolvedOnly).toBe(true)
    })

    it('should update includeMegaPokemon setting', () => {
      game.updateSettings({ ...game.settings.value, includeMegaPokemon: true })
      expect(game.settings.value.includeMegaPokemon).toBe(true)
    })

    it('should update timeLimit setting', () => {
      game.updateSettings({ ...game.settings.value, timeLimit: 45 })
      expect(game.settings.value.timeLimit).toBe(45)
    })

    it('should update gameMode setting', () => {
      game.updateSettings({ ...game.settings.value, gameMode: 'target-score' })
      expect(game.settings.value.gameMode).toBe('target-score')
    })

    it('should update totalRounds setting', () => {
      game.updateSettings({ ...game.settings.value, totalRounds: 20 })
      expect(game.settings.value.totalRounds).toBe(20)
    })

    it('should update targetScore setting', () => {
      game.updateSettings({ ...game.settings.value, targetScore: 10000 })
      expect(game.settings.value.targetScore).toBe(10000)
    })

    it('should update multiple settings at once', () => {
      game.updateSettings({
        ...game.settings.value,
        maxScore: 20,
        generation: 3,
        timeLimit: 45,
        gameMode: 'target-score',
        targetScore: 8000,
      })

      expect(game.settings.value.maxScore).toBe(20)
      expect(game.settings.value.generation).toBe(3)
      expect(game.settings.value.timeLimit).toBe(45)
      expect(game.settings.value.gameMode).toBe('target-score')
      expect(game.settings.value.targetScore).toBe(8000)
    })
  })

  describe('Session Persistence', () => {
    it('should load saved session', () => {
      const testSession = {
        roomCode: 'ABCD',
        playerName: 'TestPlayer',
        playerId: 'host',
        role: 'host' as const,
        peerId: 'test-peer',
      }
      sessionStorage.setItem('pokemon-quiz-vs-session', JSON.stringify(testSession))

      const savedSession = game.getSavedSession()

      expect(savedSession).toEqual(testSession)
    })

    it('should return null for non-existent session', () => {
      expect(game.getSavedSession()).toBe(null)
    })

    it('should clear session on leave', () => {
      sessionStorage.setItem('pokemon-quiz-vs-session', JSON.stringify({ roomCode: 'TEST' }))
      sessionStorage.setItem('pokemon-quiz-vs-gamestate', JSON.stringify({ state: 'playing' }))

      game.leaveGame()

      expect(sessionStorage.getItem('pokemon-quiz-vs-session')).toBe(null)
      expect(sessionStorage.getItem('pokemon-quiz-vs-gamestate')).toBe(null)
    })

    it('should reset game state to idle on leave', () => {
      game.gameState.value = 'playing'
      game.roomCode.value = 'TEST'

      game.leaveGame()

      expect(game.gameState.value).toBe('idle')
    })
  })

  describe('State Management', () => {
    it('should track players', () => {
      expect(game.players.value).toEqual([])

      game.players.value = [
        {
          id: 'host',
          name: 'Host Player',
          role: 'host',
          score: 3,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
      ]

      expect(game.players.value[0]?.name).toBe('Host Player')
      expect(game.players.value[0]?.score).toBe(3)
    })

    it('should track match winner by player ID', () => {
      game.matchWinner.value = 'host'
      expect(game.matchWinner.value).toBe('host')
    })

    it('should track elapsed time', () => {
      game.elapsedTime.value = 45
      expect(game.elapsedTime.value).toBe(45)
    })

    it('should track round number', () => {
      game.roundNumber.value = 5
      expect(game.roundNumber.value).toBe(5)
    })

    it('should track countdown', () => {
      game.countdown.value = 3
      expect(game.countdown.value).toBe(3)
    })

    it('should track spectators', () => {
      game.spectators.value = [
        { id: 'spec1', name: 'Spec1', role: 'spectator', score: 0, roundScore: 0, hasAnswered: false, lastGuess: null, lastGuessCorrect: null, lastGuessTimestamp: null, connected: true },
      ]

      expect(game.spectators.value.length).toBe(1)
      expect(game.spectators.value[0]?.name).toBe('Spec1')
    })
  })

  describe('API Methods', () => {
    it('should expose all required methods', () => {
      expect(typeof game.createRoom).toBe('function')
      expect(typeof game.joinExistingRoom).toBe('function')
      expect(typeof game.startGame).toBe('function')
      expect(typeof game.submitGuess).toBe('function')
      expect(typeof game.updateSettings).toBe('function')
      expect(typeof game.restartGame).toBe('function')
      expect(typeof game.leaveGame).toBe('function')
      expect(typeof game.forfeitGame).toBe('function')
      expect(typeof game.rejoinRoom).toBe('function')
      expect(typeof game.getSavedSession).toBe('function')
    })
  })

  describe('Game State Transitions', () => {
    it('should allow state transitions', () => {
      const states = ['idle', 'waiting-for-players', 'lobby', 'countdown', 'playing', 'round-result', 'match-end'] as const

      for (const state of states) {
        game.gameState.value = state
        expect(game.gameState.value).toBe(state)
      }
    })
  })

  describe('Player Name Generation', () => {
    it('should generate non-empty player names', () => {
      expect(game.myName.value).toBeTruthy()
      expect(typeof game.myName.value).toBe('string')
      expect(game.myName.value.length).toBeGreaterThan(0)
    })

    it('should allow updating player name', () => {
      game.myName.value = 'CustomName'
      expect(game.myName.value).toBe('CustomName')
    })
  })
})
