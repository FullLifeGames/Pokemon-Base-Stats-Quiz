import { ref, computed, watch, onUnmounted } from 'vue'
import type { DataConnection } from 'peerjs'
import { usePeerConnection } from './usePeerConnection'
import { useQuizLogic, type SpeciesFilterOptions } from './useQuizLogic'
import type {
  VsGameState,
  VsPlayer,
  VsRound,
  VsRoomSettings,
  VsMessage,
  PlayerRole,
  VsGameRoom,
  VsSession,
} from '@/types/vsMode'
import {
  defaultVsRoomSettings,
  generatePlayerName,
  generateRoomCode,
} from '@/types/vsMode'

const SESSION_KEY = 'pokemon-quiz-vs-session'
const GAME_STATE_KEY = 'pokemon-quiz-vs-gamestate'

function saveSession(session: VsSession | null) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

function loadSession(): VsSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as VsSession
  } catch {
    return null
  }
}

function saveGameState(room: VsGameRoom | null) {
  if (room) {
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(room))
  } else {
    sessionStorage.removeItem(GAME_STATE_KEY)
  }
}

function loadGameState(): VsGameRoom | null {
  try {
    const raw = sessionStorage.getItem(GAME_STATE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as VsGameRoom
  } catch {
    return null
  }
}

export function useVsGame() {
  // --- State ---
  const gameState = ref<VsGameState>('idle')
  const roomCode = ref('')
  const settings = ref<VsRoomSettings>({ ...defaultVsRoomSettings })
  const host = ref<VsPlayer>(createPlayer('', 'host'))
  const guest = ref<VsPlayer | null>(null)
  const spectators = ref<VsPlayer[]>([])
  const currentRound = ref<VsRound | null>(null)
  const roundNumber = ref(0)
  const countdown = ref(3)
  const rematchRequested = ref(false)
  const rematchRequestedBy = ref<PlayerRole | null>(null)
  const matchWinner = ref<PlayerRole | null>(null)
  const elapsedTime = ref(0)
  const opponentForfeited = ref(false)

  let roundTimer: ReturnType<typeof setInterval> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let elapsedTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 10
  const isReconnecting = ref(false)

  // --- Player name ---
  const myName = ref(generatePlayerName())

  // --- Peer connection ---
  const peerConn = usePeerConnection(handleMessage)
  const { 
    isConnected, isHosting, error: connectionError, myRole,
    hostRoom, joinRoom, sendToAll, sendTo, destroy,
  } = peerConn

  // Track spectator connections for broadcasting
  const spectatorConnections: DataConnection[] = []

  // --- Computed ---
  const me = computed<VsPlayer | null>(() => {
    if (myRole.value === 'host') return host.value
    if (myRole.value === 'guest') return guest.value
    return null
  })

  const opponent = computed<VsPlayer | null>(() => {
    if (myRole.value === 'host') return guest.value
    if (myRole.value === 'guest') return host.value
    return null
  })

  const isHost = computed(() => myRole.value === 'host')
  const isSpectator = computed(() => myRole.value === 'spectator')

  // Shared quiz logic (species filtering, stats checking, random pokemon)
  const speciesOptions = computed<SpeciesFilterOptions>(() => ({
    generation: settings.value.generation,
    minGeneration: settings.value.minGeneration,
    maxGeneration: settings.value.maxGeneration,
    fullyEvolvedOnly: settings.value.fullyEvolvedOnly,
    includeMegaPokemon: settings.value.includeMegaPokemon,
  }))

  // locale is not needed in useVsGame — VsGame.vue handles display.
  // We pass a static ref so the composable works; selection lists are
  // built in VsGame.vue with its own locale.
  const quizLocale = ref('en')

  const {
    species,
    generateRandomPokemon,
    hasMatchingStats,
    findSpecies,
  } = useQuizLogic(speciesOptions, quizLocale)

  // --- Helpers ---
  function createPlayer(name: string, role: PlayerRole): VsPlayer {
    return {
      name,
      role,
      score: 0,
      hasAnswered: false,
      lastGuess: null,
      lastGuessCorrect: null,
      lastGuessTimestamp: null,
      connected: true,
    }
  }

  function getFullRoomState(): VsGameRoom {
    return {
      roomCode: roomCode.value,
      state: gameState.value,
      settings: { ...settings.value },
      host: { ...host.value },
      guest: guest.value ? { ...guest.value } : null,
      spectators: spectators.value.map(s => ({ ...s })),
      currentRound: currentRound.value ? { ...currentRound.value } : null,
      roundNumber: roundNumber.value,
    }
  }

  function broadcastToSpectators() {
    const state: VsMessage = { type: 'spectator-state', room: getFullRoomState() }
    for (const conn of spectatorConnections) {
      if (conn.open) {
        sendTo(conn, state)
      }
    }
  }

  // --- Host: Create Room ---
  async function createRoom() {
    const code = generateRoomCode()
    roomCode.value = code
    host.value = createPlayer(myName.value, 'host')
    gameState.value = 'waiting-for-opponent'

    try {
      await hostRoom(code)
      // Save session for reconnection
      saveSession({
        roomCode: code,
        playerName: myName.value,
        role: 'host',
        peerId: code, // Host peerId is always the room code
      })
    } catch {
      gameState.value = 'idle'
    }
  }

  // --- Guest/Spectator: Join Room ---
  async function joinExistingRoom(code: string, asSpectator = false) {
    roomCode.value = code.toUpperCase()
    gameState.value = 'lobby'

    try {
      await joinRoom(code.toUpperCase(), asSpectator)
      // Set own player data
      if (!asSpectator) {
        guest.value = createPlayer(myName.value, 'guest')
        // Save session for reconnection
        saveSession({
          roomCode: code.toUpperCase(),
          playerName: myName.value,
          role: 'guest',
          peerId: peerConn.myPeerId.value,
        })
      }
      // Send player info to host
      sendToAll({
        type: 'player-info',
        name: myName.value,
        role: asSpectator ? 'spectator' : 'guest',
      })
    } catch {
      gameState.value = 'idle'
    }
  }

  // --- Restore state from a full room snapshot ---
  function restoreFromRoom(room: VsGameRoom) {
    gameState.value = room.state
    settings.value = room.settings
    host.value = room.host
    guest.value = room.guest
    spectators.value = room.spectators
    currentRound.value = room.currentRound
    roundNumber.value = room.roundNumber
  }

  // --- Reconnection ---
  async function rejoinRoom(session: VsSession) {
    roomCode.value = session.roomCode
    myName.value = session.playerName

    try {
      if (session.role === 'host') {
        // Host reconnects by re-hosting with the same room code
        // Try to restore full game state first
        const savedState = loadGameState()
        if (savedState && savedState.roomCode === session.roomCode) {
          restoreFromRoom(savedState)
          // If we were mid-round, restart the timer with the saved timeRemaining
          if (gameState.value === 'playing' && currentRound.value) {
            // Reset answer states so the round can be replayed fairly
            host.value.hasAnswered = false
            host.value.lastGuess = null
            host.value.lastGuessCorrect = null
            host.value.lastGuessTimestamp = null
            if (guest.value) {
              guest.value.hasAnswered = false
              guest.value.lastGuess = null
              guest.value.lastGuessCorrect = null
              guest.value.lastGuessTimestamp = null
            }
            startRoundTimer()
          }
        } else {
          // No saved game state — fresh re-host
          host.value = createPlayer(session.playerName, 'host')
          gameState.value = 'waiting-for-opponent'
        }
        await hostRoom(session.roomCode)
        // Save session again
        saveSession(session)
      } else {
        // Guest reconnects with a new peerId and sends reconnect message
        gameState.value = 'lobby'
        await joinRoom(session.roomCode, false)
        // Update saved session with new peerId
        saveSession({
          ...session,
          peerId: peerConn.myPeerId.value,
        })
        // Tell host we're reconnecting (not a new join)
        sendToAll({
          type: 'reconnect',
          name: session.playerName,
          role: 'guest',
          peerId: peerConn.myPeerId.value,
        })
      }
    } catch {
      // Reconnection failed, clear session
      saveSession(null)
      gameState.value = 'idle'
    }
  }

  // --- Forfeit / Quit ---
  function forfeitGame() {
    const role = myRole.value
    sendToAll({ type: 'forfeit', role })
    saveSession(null)
    saveGameState(null)
    leaveGame()
  }

  function getSavedSession(): VsSession | null {
    return loadSession()
  }

  // --- Host: Handle incoming messages ---
  function handleMessage(msg: VsMessage, conn: DataConnection) {
    switch (msg.type) {
      case 'player-info':
        // Guest/spectator receives host's info
        if (!isHosting.value && msg.role === 'host') {
          host.value = createPlayer(msg.name, 'host')
          break
        }
        if (isHosting.value) {
          if (msg.role === 'spectator') {
            const spectator = createPlayer(msg.name, 'spectator')
            spectators.value.push(spectator)
            spectatorConnections.push(conn)
            // Send current settings and state
            sendTo(conn, { type: 'room-settings', settings: settings.value })
            sendTo(conn, { type: 'spectator-state', room: getFullRoomState() })
          } else {
            // Guest joined
            guest.value = createPlayer(msg.name, 'guest')
            gameState.value = 'lobby'
            // Send full state to guest to ensure they have all info including host name
            sendTo(conn, { type: 'full-state', room: getFullRoomState() })
            broadcastToSpectators()
            saveGameState(getFullRoomState())
          }
        }
        break

      case 'room-settings':
        if (!isHosting.value) {
          settings.value = msg.settings
        }
        break

      case 'game-start':
        if (!isHosting.value) {
          gameState.value = 'countdown'
          startCountdown()
        }
        break

      case 'new-round':
        if (!isHosting.value) {
          currentRound.value = msg.round
          roundNumber.value = msg.round.number
          gameState.value = 'playing'
          if (myRole.value === 'guest') {
            // Reset guest answer state
            if (guest.value) {
              guest.value.hasAnswered = false
              guest.value.lastGuess = null
              guest.value.lastGuessCorrect = null
              guest.value.lastGuessTimestamp = null
            }
            // Reset host answer state
            host.value.hasAnswered = false
            host.value.lastGuess = null
            host.value.lastGuessCorrect = null
            host.value.lastGuessTimestamp = null
          }
        }
        break

      case 'guess':
        if (isHosting.value && guest.value) {
          guest.value.hasAnswered = true
          guest.value.lastGuess = msg.pokemonId
          guest.value.lastGuessCorrect = msg.correct
          guest.value.lastGuessTimestamp = msg.timestamp

          // Notify host UI that opponent answered
          // Check if both answered
          if (host.value.hasAnswered) {
            resolveRound()
          } else {
            // Tell host that opponent answered (without spoiling)
            // The host UI will show "Opponent answered!" 
          }
        } else if (!isHosting.value && !isSpectator.value) {
          // Guest received host's guess notification (not used directly)
        }
        break

      case 'opponent-answered':
        // Notification that the other player has answered
        if (myRole.value === 'guest') {
          host.value.hasAnswered = true
        }
        break

      case 'round-result':
        if (!isHosting.value) {
          gameState.value = 'round-result'
          // Update scores from the result
          if (msg.winner === 'host') {
            host.value.score++
          } else if (msg.winner === 'guest' && guest.value) {
            guest.value.score++
          }
          // Update guesses for display
          host.value.lastGuess = msg.hostGuess
          host.value.lastGuessCorrect = msg.hostCorrect
          if (guest.value) {
            guest.value.lastGuess = msg.guestGuess
            guest.value.lastGuessCorrect = msg.guestCorrect
          }
          if (currentRound.value) {
            currentRound.value.winner = msg.winner
            currentRound.value.wonBySpeed = msg.wonBySpeed
          }
        }
        break

      case 'timer-sync':
        if (!isHosting.value && currentRound.value) {
          currentRound.value.timeRemaining = msg.timeRemaining
          currentRound.value.hintLevel = msg.hintLevel
        }
        break

      case 'match-end':
        gameState.value = 'match-end'
        matchWinner.value = msg.winner
        host.value.score = msg.hostScore
        if (guest.value) guest.value.score = msg.guestScore
        stopRoundTimer()
        break

      case 'rematch-request':
        console.log('[useVsGame] Received rematch-request, myRole:', myRole.value, 'isHosting:', isHosting.value)
        rematchRequested.value = true
        rematchRequestedBy.value = isHosting.value ? 'guest' : 'host'
        console.log('[useVsGame] Set rematchRequestedBy to:', rematchRequestedBy.value)
        break

      case 'rematch-accept':
        console.log('[useVsGame] Received rematch-accept, myRole:', myRole.value, 'isHosting:', isHosting.value)
        // Host received acceptance - broadcast rematch start to both players
        if (isHosting.value) {
          console.log('[useVsGame] Host broadcasting rematch-accept to all')
          sendToAll({ type: 'rematch-accept' })
        }
        startRematch()
        break

      case 'spectator-state':
        if (isSpectator.value) {
          // Update all state from host
          const room = msg.room
          gameState.value = room.state
          host.value = room.host
          guest.value = room.guest
          spectators.value = room.spectators
          currentRound.value = room.currentRound
          roundNumber.value = room.roundNumber
          settings.value = room.settings
        }
        break

      case 'error':
        connectionError.value = msg.message
        break

      case 'reconnect':
        // Host receives reconnection from a guest
        if (isHosting.value && msg.role === 'guest') {
          // Restore guest as connected
          if (guest.value) {
            guest.value.connected = true
            guest.value.name = msg.name
          } else {
            guest.value = createPlayer(msg.name, 'guest')
          }
          // Send full game state to reconnecting guest
          sendTo(conn, { type: 'full-state', room: getFullRoomState() })
          broadcastToSpectators()
          saveGameState(getFullRoomState())
        }
        break

      case 'full-state':
        // Guest receives full state on reconnect or initial join
        if (!isHosting.value) {
          const room = msg.room
          gameState.value = room.state
          host.value = room.host
          guest.value = room.guest
          spectators.value = room.spectators
          currentRound.value = room.currentRound
          roundNumber.value = room.roundNumber
          settings.value = room.settings
        }
        break

      case 'forfeit':
        // Opponent forfeited — they win by default
        if (msg.role === 'host') {
          // Host forfeited, guest wins
          matchWinner.value = 'guest'
        } else {
          // Guest forfeited, host wins
          matchWinner.value = 'host'
        }
        stopRoundTimer()
        if (countdownTimer) clearInterval(countdownTimer)
        gameState.value = 'match-end'
        opponentForfeited.value = true
        break
    }
  }

  // --- Host: Start Game ---
  function startGame() {
    if (!isHosting.value || !guest.value) return

    gameState.value = 'countdown'
    host.value.score = 0
    guest.value.score = 0
    roundNumber.value = 0
    elapsedTime.value = 0

    // Tell guest to start countdown
    sendToAll({ type: 'game-start' })
    broadcastToSpectators()
    startCountdown()
  }

  function startCountdown() {
    countdown.value = 3
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
        if (isHosting.value) {
          startNewRound()
        }
      }
    }, 1000)
  }

  // --- Host: Start Round ---
  function startNewRound() {
    if (!isHosting.value) return

    const pokemon = generateRandomPokemon()
    roundNumber.value++

    const round: VsRound = {
      number: roundNumber.value,
      pokemonId: pokemon.name,
      pokemonTypes: [...pokemon.types],
      pokemonAbilities: Object.values(pokemon.abilities).filter(a => a) as string[],
      timeRemaining: settings.value.timeLimit > 0 ? settings.value.timeLimit : 0,
      hintLevel: 0,
      winner: null,
      wonBySpeed: false,
    }

    currentRound.value = round
    gameState.value = 'playing'

    // Reset answer states
    host.value.hasAnswered = false
    host.value.lastGuess = null
    host.value.lastGuessCorrect = null
    host.value.lastGuessTimestamp = null
    if (guest.value) {
      guest.value.hasAnswered = false
      guest.value.lastGuess = null
      guest.value.lastGuessCorrect = null
      guest.value.lastGuessTimestamp = null
    }

    // Send round to guest
    sendToAll({ type: 'new-round', round })
    broadcastToSpectators()
    saveGameState(getFullRoomState())

    // Start round timer
    startRoundTimer()

    // Start elapsed timer
    if (!elapsedTimer) {
      elapsedTimer = setInterval(() => {
        elapsedTime.value++
      }, 1000)
    }
  }

  function startRoundTimer() {
    stopRoundTimer()
    if (settings.value.timeLimit <= 0 || !currentRound.value) return

    roundTimer = setInterval(() => {
      if (!currentRound.value) return

      currentRound.value.timeRemaining--

      // Auto-hints based on time
      const totalTime = settings.value.timeLimit
      const remaining = currentRound.value.timeRemaining
      
      if (remaining <= Math.floor(totalTime / 2) && currentRound.value.hintLevel < 1) {
        currentRound.value.hintLevel = 1
      }
      if (remaining <= Math.floor(totalTime * 1 / 4) && currentRound.value.hintLevel < 2) {
        currentRound.value.hintLevel = 2
      }

      // Sync timer to guest
      if (isHosting.value) {
        sendToAll({
          type: 'timer-sync',
          timeRemaining: currentRound.value.timeRemaining,
          hintLevel: currentRound.value.hintLevel,
        })
        broadcastToSpectators()
        // Periodically persist game state for host reconnection
        if (currentRound.value.timeRemaining % 5 === 0) {
          saveGameState(getFullRoomState())
        }
      }

      // Time's up
      if (currentRound.value.timeRemaining <= 0) {
        stopRoundTimer()
        if (isHosting.value) {
          // Force resolve the round - nobody wins if neither answered correctly
          resolveRound()
        }
      }
    }, 1000)
  }

  function stopRoundTimer() {
    if (roundTimer) {
      clearInterval(roundTimer)
      roundTimer = null
    }
  }

  // --- Player: Submit Guess ---
  function submitGuess(pokemonId: string) {
    if (!currentRound.value || gameState.value !== 'playing') return
    if (myRole.value === 'spectator') return

    // Check correctness using shared quiz logic
    const pokemon = findSpecies(pokemonId)
    if (!pokemon) return

    const targetPokemon = findSpecies(currentRound.value.pokemonId)
    if (!targetPokemon) return

    const correct = hasMatchingStats(pokemon, targetPokemon)

    if (isHosting.value) {
      host.value.hasAnswered = true
      host.value.lastGuess = pokemonId
      host.value.lastGuessCorrect = correct
      host.value.lastGuessTimestamp = Date.now()

      // Check if both answered
      if (guest.value?.hasAnswered) {
        resolveRound()
      } else {
        // Notify guest that host answered
        sendToAll({ type: 'opponent-answered' })
      }
    } else {
      // Guest: send guess to host
      if (guest.value) {
        guest.value.hasAnswered = true
        guest.value.lastGuess = pokemonId
        guest.value.lastGuessCorrect = correct
        guest.value.lastGuessTimestamp = Date.now()
      }
      sendToAll({
        type: 'guess',
        pokemonId,
        correct,
        timestamp: Date.now(),
      })
    }
  }

  // --- Host: Resolve Round ---
  function resolveRound() {
    if (!isHosting.value || !currentRound.value) return

    stopRoundTimer()

    let winner: PlayerRole | 'none' = 'none'

    const hostCorrect = host.value.lastGuessCorrect === true
    const guestCorrect = guest.value?.lastGuessCorrect === true
    let wonBySpeed = false

    if (hostCorrect && guestCorrect) {
      // Both correct - give point to whoever answered first (by timestamp)
      wonBySpeed = true
      const hostTime = host.value.lastGuessTimestamp ?? Infinity
      const guestTime = guest.value?.lastGuessTimestamp ?? Infinity
      
      if (hostTime < guestTime) {
        winner = 'host'
      } else if (guestTime < hostTime) {
        winner = 'guest'
      } else {
        // Same timestamp (extremely unlikely) = tie
        winner = 'none'
        wonBySpeed = false
      }
    } else if (hostCorrect) {
      winner = 'host'
    } else if (guestCorrect) {
      winner = 'guest'
    }

    // Update scores
    if (winner === 'host') {
      host.value.score++
    } else if (winner === 'guest' && guest.value) {
      guest.value.score++
    }

    currentRound.value.winner = winner
    currentRound.value.wonBySpeed = wonBySpeed
    gameState.value = 'round-result'

    const resultMsg: VsMessage = {
      type: 'round-result',
      winner,
      correctPokemon: currentRound.value.pokemonId,
      hostGuess: host.value.lastGuess,
      guestGuess: guest.value?.lastGuess ?? null,
      hostCorrect: host.value.lastGuessCorrect,
      guestCorrect: guest.value?.lastGuessCorrect ?? null,
      wonBySpeed,
    }

    sendToAll(resultMsg)
    broadcastToSpectators()
    saveGameState(getFullRoomState())

    // Check for match end
    const hostWon = host.value.score >= settings.value.maxScore
    const guestWon = (guest.value?.score ?? 0) >= settings.value.maxScore

    if (hostWon || guestWon) {
      setTimeout(() => {
        const mWinner: PlayerRole = hostWon ? 'host' : 'guest'
        matchWinner.value = mWinner
        gameState.value = 'match-end'

        if (elapsedTimer) {
          clearInterval(elapsedTimer)
          elapsedTimer = null
        }

        const endMsg: VsMessage = {
          type: 'match-end',
          winner: mWinner,
          hostScore: host.value.score,
          guestScore: guest.value?.score ?? 0,
        }
        sendToAll(endMsg)
        broadcastToSpectators()
        saveGameState(getFullRoomState())
      }, 2000)
    } else {
      // Auto-advance to next round after delay
      setTimeout(() => {
        if (gameState.value === 'round-result' && isHosting.value) {
          startNewRound()
        }
      }, 3000)
    }
  }

  // --- Rematch ---
  function requestRematch() {
    console.log('[useVsGame] requestRematch called by', myRole.value)
    rematchRequested.value = true
    rematchRequestedBy.value = myRole.value as PlayerRole
    sendToAll({ type: 'rematch-request' })
    console.log('[useVsGame] After requestRematch:', { rematchRequested: rematchRequested.value, rematchRequestedBy: rematchRequestedBy.value })
  }

  function acceptRematch() {
    console.log('[useVsGame] acceptRematch called by', myRole.value)
    // Guest accepts - send to host who will broadcast rematch start
    sendToAll({ type: 'rematch-accept' })
  }

  function startRematch() {
    rematchRequested.value = false
    rematchRequestedBy.value = null
    matchWinner.value = null
    host.value.score = 0
    if (guest.value) guest.value.score = 0
    roundNumber.value = 0
    elapsedTime.value = 0
    currentRound.value = null

    if (isHosting.value) {
      startGame()
    }
  }

  // --- Update settings (host only) ---
  function updateSettings(newSettings: VsRoomSettings) {
    if (!isHost.value) return
    settings.value = newSettings
    sendToAll({ type: 'room-settings', settings: newSettings })
    broadcastToSpectators()
  }

  // --- Cleanup ---
  function leaveGame() {
    stopRoundTimer()
    stopAutoReconnect()
    if (countdownTimer) clearInterval(countdownTimer)
    if (elapsedTimer) clearInterval(elapsedTimer)
    saveSession(null)
    saveGameState(null)
    destroy()
    gameState.value = 'idle'
    guest.value = null
    spectators.value = []
    currentRound.value = null
    roundNumber.value = 0
    rematchRequested.value = false
    opponentForfeited.value = false
  }

  onUnmounted(() => {
    stopRoundTimer()
    stopAutoReconnect()
    if (countdownTimer) clearInterval(countdownTimer)
    if (elapsedTimer) clearInterval(elapsedTimer)
  })

  // Watch for opponent answered (for UI reactivity on host side)
  const opponentAnswered = computed(() => {
    if (myRole.value === 'host') return guest.value?.hasAnswered ?? false
    if (myRole.value === 'guest') return host.value.hasAnswered
    return false
  })

  // --- Guest auto-reconnect when connection to host is lost ---
  watch(isConnected, (connected, wasConnected) => {
    if (wasConnected && !connected && myRole.value === 'guest' && gameState.value !== 'idle') {
      startAutoReconnect()
    }
  })

  function startAutoReconnect() {
    const session = loadSession()
    if (!session || session.role !== 'guest') return
    isReconnecting.value = true
    reconnectAttempts = 0
    attemptReconnect(session)
  }

  function attemptReconnect(session: VsSession) {
    if (isConnected.value) {
      isReconnecting.value = false
      reconnectAttempts = 0
      return
    }
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      isReconnecting.value = false
      reconnectAttempts = 0
      return
    }

    const delay = Math.min(2000 + reconnectAttempts * 1000, 5000)
    reconnectTimer = setTimeout(async () => {
      if (isConnected.value) {
        isReconnecting.value = false
        reconnectAttempts = 0
        return
      }
      reconnectAttempts++
      try {
        await joinRoom(session.roomCode, false)
        saveSession({ ...session, peerId: peerConn.myPeerId.value })
        sendToAll({
          type: 'reconnect',
          name: session.playerName,
          role: 'guest',
          peerId: peerConn.myPeerId.value,
        })
        isReconnecting.value = false
        reconnectAttempts = 0
      } catch {
        attemptReconnect(session)
      }
    }, delay)
  }

  function stopAutoReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    isReconnecting.value = false
    reconnectAttempts = 0
  }

  return {
    // State
    gameState,
    roomCode,
    settings,
    host,
    guest,
    spectators,
    currentRound,
    roundNumber,
    countdown,
    rematchRequested,
    rematchRequestedBy,
    matchWinner,
    myName,
    myRole,
    elapsedTime,
    opponentForfeited,

    // Computed
    me,
    opponent,
    isHost,
    isSpectator,
    isConnected,
    connectionError,
    opponentAnswered,
    species,

    // Actions
    createRoom,
    joinExistingRoom,
    rejoinRoom,
    startGame,
    submitGuess,
    requestRematch,
    acceptRematch,
    updateSettings,
    leaveGame,
    forfeitGame,
    getSavedSession,
  }
}
