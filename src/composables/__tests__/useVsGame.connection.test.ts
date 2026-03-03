import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type { DataConnection } from 'peerjs'
import type { VsMessage, PlayerRole } from '@/types/vsMode'

/**
 * Tests for VS mode connection handling in useVsGame.
 *
 * We capture the handleMessage callback that useVsGame passes to
 * usePeerConnection, then invoke it directly with crafted messages
 * and mock connections. This lets us test the host-side logic for
 * player-info acceptance/rejection, room-full enforcement,
 * game-in-progress blocking, and leaveGame cleanup.
 */

// Store the captured handleMessage callback
let capturedHandleMessage: ((msg: VsMessage, conn: DataConnection) => void) | null = null

// Shared mock refs that both the mock and our tests can access
const mockIsHosting = ref(false)
const mockIsConnected = ref(false)
const mockMyRole = ref<PlayerRole>('host')
const mockError = ref<string | null>(null)
const mockMyPeerId = ref('test-peer-id')
const mockConnections = ref<DataConnection[]>([])

const mockHostRoom = vi.fn().mockResolvedValue(undefined)
const mockJoinRoom = vi.fn().mockResolvedValue(undefined)
const mockSendToAll = vi.fn()
const mockSendTo = vi.fn()
const mockDestroy = vi.fn()

vi.mock('../usePeerConnection', () => ({
  usePeerConnection: vi.fn((onMessage: (msg: VsMessage, conn: DataConnection) => void) => {
    capturedHandleMessage = onMessage
    return {
      peer: ref(null),
      connections: mockConnections,
      myPeerId: mockMyPeerId,
      isConnected: mockIsConnected,
      isHosting: mockIsHosting,
      error: mockError,
      myRole: mockMyRole,
      hostRoom: mockHostRoom,
      joinRoom: mockJoinRoom,
      sendToAll: mockSendToAll,
      sendTo: mockSendTo,
      destroy: mockDestroy,
    }
  }),
}))

// Must import after mock setup
import { useVsGame } from '../useVsGame'

function createMockConn(overrides: Partial<DataConnection> = {}): DataConnection {
  return {
    open: true,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    peer: 'mock-peer',
    ...overrides,
  } as unknown as DataConnection
}

describe('useVsGame – Connection Handling', () => {
  let game: ReturnType<typeof useVsGame>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    sessionStorage.clear()
    capturedHandleMessage = null

    // Reset refs
    mockIsHosting.value = false
    mockIsConnected.value = false
    mockMyRole.value = 'host'
    mockError.value = null

    game = useVsGame()
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  function triggerMessage(msg: VsMessage, conn?: DataConnection) {
    expect(capturedHandleMessage).not.toBeNull()
    capturedHandleMessage!(msg, conn ?? createMockConn())
  }

  describe('Host: Player Join (player-info)', () => {
    beforeEach(async () => {
      // Simulate being the host with a lobby
      mockIsHosting.value = true
      mockMyRole.value = 'host'
      game.gameState.value = 'lobby'
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
      ]
    })

    it('should accept a player joining the lobby', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p1', name: 'Player1', role: 'player' }, conn)

      expect(game.players.value).toHaveLength(2)
      expect(game.players.value[1]?.id).toBe('p1')
      expect(game.players.value[1]?.name).toBe('Player1')
    })

    it('should send full-state to the newly joined player', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p1', name: 'Player1', role: 'player' }, conn)

      expect(mockSendTo).toHaveBeenCalledWith(conn, expect.objectContaining({ type: 'full-state' }))
    })

    it('should broadcast player-joined to all other players', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p1', name: 'Player1', role: 'player' }, conn)

      expect(mockSendToAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'player-joined', player: expect.objectContaining({ id: 'p1' }) }),
      )
    })

    it('should accept spectators even during active games', () => {
      game.gameState.value = 'playing'

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 's1', name: 'Spectator1', role: 'spectator' }, conn)

      expect(game.spectators.value).toHaveLength(1)
      expect(game.spectators.value[0]?.id).toBe('s1')
    })
  })

  describe('Host: Game-in-progress blocking', () => {
    beforeEach(() => {
      mockIsHosting.value = true
      mockMyRole.value = 'host'
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
        {
          id: 'p1',
          name: 'Player1',
          role: 'player',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
      ]
    })

    it('should reject a player trying to join during "playing" state', () => {
      game.gameState.value = 'playing'

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'Latecomer', role: 'player' }, conn)

      // Player was NOT added
      expect(game.players.value).toHaveLength(2)
      // Error message sent back
      expect(mockSendTo).toHaveBeenCalledWith(conn, { type: 'error', message: 'game-in-progress' })
    })

    it('should reject a player trying to join during "countdown" state', () => {
      game.gameState.value = 'countdown'

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'Latecomer', role: 'player' }, conn)

      expect(game.players.value).toHaveLength(2)
      expect(mockSendTo).toHaveBeenCalledWith(conn, { type: 'error', message: 'game-in-progress' })
    })

    it('should reject a player trying to join during "round-result" state', () => {
      game.gameState.value = 'round-result'

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'Latecomer', role: 'player' }, conn)

      expect(game.players.value).toHaveLength(2)
      expect(mockSendTo).toHaveBeenCalledWith(conn, { type: 'error', message: 'game-in-progress' })
    })

    it('should reject a player trying to join during "match-end" state', () => {
      game.gameState.value = 'match-end'

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'Latecomer', role: 'player' }, conn)

      expect(game.players.value).toHaveLength(2)
      expect(mockSendTo).toHaveBeenCalledWith(conn, { type: 'error', message: 'game-in-progress' })
    })
  })

  describe('Host: Room-full enforcement', () => {
    beforeEach(() => {
      mockIsHosting.value = true
      mockMyRole.value = 'host'
      game.gameState.value = 'lobby'
      game.settings.value.maxPlayers = 2
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
        {
          id: 'p1',
          name: 'Player1',
          role: 'player',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
      ]
    })

    it('should reject a player when maxPlayers is reached', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'TooMany', role: 'player' }, conn)

      expect(game.players.value).toHaveLength(2)
      expect(mockSendTo).toHaveBeenCalledWith(conn, { type: 'error', message: 'room-full' })
    })

    it('should allow joining when a player has disconnected (slot freed)', () => {
      game.players.value[1]!.connected = false

      const conn = createMockConn()
      triggerMessage({ type: 'player-info', id: 'p2', name: 'Replacement', role: 'player' }, conn)

      // disconnected player + new player = 3 total entries, but only 2 connected
      expect(game.players.value).toHaveLength(3)
      expect(game.players.value[2]?.name).toBe('Replacement')
    })

    it('should allow unlimited players when maxPlayers is 0', () => {
      game.settings.value.maxPlayers = 0
      // Start with 2, add more
      for (let i = 2; i <= 10; i++) {
        triggerMessage({ type: 'player-info', id: `p${i}`, name: `Player${i}`, role: 'player' })
      }

      expect(game.players.value).toHaveLength(11) // host + 10 others
    })
  })

  describe('Error message handling (client side)', () => {
    it('should set connectionError on game-in-progress error', () => {
      game.gameState.value = 'lobby'

      triggerMessage({ type: 'error', message: 'game-in-progress' })

      expect(game.connectionError.value).toBe('game-in-progress')
      expect(game.gameState.value).toBe('idle')
    })

    it('should set connectionError on room-full error', () => {
      game.gameState.value = 'lobby'

      triggerMessage({ type: 'error', message: 'room-full' })

      expect(game.connectionError.value).toBe('room-full')
      expect(game.gameState.value).toBe('idle')
    })

    it('should clear session on rejection errors', () => {
      sessionStorage.setItem('pokemon-quiz-vs-session', JSON.stringify({ roomCode: 'TEST' }))

      triggerMessage({ type: 'error', message: 'game-in-progress' })

      expect(sessionStorage.getItem('pokemon-quiz-vs-session')).toBe(null)
    })
  })

  describe('leaveGame cleanup', () => {
    it('should reset roomCode on leave', () => {
      game.roomCode.value = 'ABCDEF'
      game.leaveGame()
      expect(game.roomCode.value).toBe('')
    })

    it('should reset settings to defaults on leave', () => {
      game.settings.value.timeLimit = 99
      game.settings.value.maxPlayers = 5
      game.settings.value.quizMode = 'learnset'

      game.leaveGame()

      expect(game.settings.value.timeLimit).toBe(30)
      expect(game.settings.value.maxPlayers).toBe(0)
      expect(game.settings.value.quizMode).toBe('base-stat')
    })

    it('should reset connectionError on leave', () => {
      game.connectionError.value = 'room-full'
      game.leaveGame()
      expect(game.connectionError.value).toBeNull()
    })

    it('should reset all game state on leave', () => {
      game.gameState.value = 'playing'
      game.roundNumber.value = 5
      game.matchWinner.value = 'host'
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 10,
          roundScore: 5,
          hasAnswered: true,
          lastGuess: 'Pikachu',
          lastGuessCorrect: true,
          lastGuessTimestamp: 123,
          connected: true,
        },
      ]

      game.leaveGame()

      expect(game.gameState.value).toBe('idle')
      expect(game.roundNumber.value).toBe(0)
      expect(game.matchWinner.value).toBeNull()
      expect(game.players.value).toEqual([])
      expect(game.currentRound.value).toBeNull()
    })

    it('should call destroy on peer connection', () => {
      game.leaveGame()
      expect(mockDestroy).toHaveBeenCalled()
    })

    it('should clear sessionStorage', () => {
      sessionStorage.setItem('pokemon-quiz-vs-session', JSON.stringify({ roomCode: 'TEST' }))
      sessionStorage.setItem('pokemon-quiz-vs-gamestate', JSON.stringify({ state: 'playing' }))

      game.leaveGame()

      expect(sessionStorage.getItem('pokemon-quiz-vs-session')).toBeNull()
      expect(sessionStorage.getItem('pokemon-quiz-vs-gamestate')).toBeNull()
    })
  })

  describe('Reconnection handling', () => {
    beforeEach(() => {
      mockIsHosting.value = true
      mockMyRole.value = 'host'
      game.gameState.value = 'playing'
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
        {
          id: 'p1',
          name: 'Player1',
          role: 'player',
          score: 100,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: false,
        },
      ]
    })

    it('should reconnect an existing player', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'reconnect', id: 'p1', name: 'Player1', role: 'player', peerId: 'new-peer' }, conn)

      const player = game.players.value.find(p => p.id === 'p1')
      expect(player?.connected).toBe(true)
      expect(player?.name).toBe('Player1')
    })

    it('should send full-state to reconnected player', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'reconnect', id: 'p1', name: 'Player1', role: 'player', peerId: 'new-peer' }, conn)

      expect(mockSendTo).toHaveBeenCalledWith(conn, expect.objectContaining({ type: 'full-state' }))
    })

    it('should add a brand-new player on reconnect if ID not found', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'reconnect', id: 'p-new', name: 'NewPlayer', role: 'player', peerId: 'new-peer' }, conn)

      expect(game.players.value).toHaveLength(3)
      expect(game.players.value[2]?.id).toBe('p-new')
    })

    it('should preserve score for reconnected existing player', () => {
      const conn = createMockConn()
      triggerMessage({ type: 'reconnect', id: 'p1', name: 'Player1', role: 'player', peerId: 'new-peer' }, conn)

      const player = game.players.value.find(p => p.id === 'p1')
      expect(player?.score).toBe(100)
    })
  })

  describe('Forfeit handling', () => {
    beforeEach(() => {
      mockIsHosting.value = true
      mockMyRole.value = 'host'
      game.gameState.value = 'playing'
      game.players.value = [
        {
          id: 'host',
          name: 'Host',
          role: 'host',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
        {
          id: 'p1',
          name: 'Player1',
          role: 'player',
          score: 0,
          roundScore: 0,
          hasAnswered: false,
          lastGuess: null,
          lastGuessCorrect: null,
          lastGuessTimestamp: null,
          connected: true,
        },
      ]
    })

    it('should mark a forfeiting player as disconnected', () => {
      triggerMessage({ type: 'forfeit', playerId: 'p1' })

      const player = game.players.value.find(p => p.id === 'p1')
      expect(player?.connected).toBe(false)
    })

    it('should broadcast player-left to all', () => {
      triggerMessage({ type: 'forfeit', playerId: 'p1' })

      expect(mockSendToAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'player-left', playerId: 'p1' }),
      )
    })

    it('should end match when fewer than 2 connected players remain', () => {
      triggerMessage({ type: 'forfeit', playerId: 'p1' })

      // Only host remains → match should end
      expect(game.gameState.value).toBe('match-end')
      expect(game.matchWinner.value).toBe('host')
    })
  })
})
