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
  PlayerRoundResult,
} from '@/types/vsMode'
import {
  defaultVsRoomSettings,
  generatePlayerName,
  generatePlayerId,
  generateRoomCode,
  calculateRoundScore,
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
  const players = ref<VsPlayer[]>([])
  const spectators = ref<VsPlayer[]>([])
  const currentRound = ref<VsRound | null>(null)
  const roundNumber = ref(0)
  const countdown = ref(3)
  const matchWinner = ref<string | null>(null) // player ID of winner
  const elapsedTime = ref(0)

  let roundTimer: ReturnType<typeof setInterval> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let elapsedTimer: ReturnType<typeof setInterval> | null = null
  let roundStartTime = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 10
  const isReconnecting = ref(false)

  // --- Player identity ---
  const myName = ref(generatePlayerName())
  const myPlayerId = ref('')

  // --- Peer connection ---
  const peerConn = usePeerConnection(handleMessage)
  const {
    isConnected, isHosting, error: connectionError, myRole,
    hostRoom, joinRoom, sendToAll, sendTo, destroy,
  } = peerConn

  // Track connections per player ID (host only)
  const playerConnections = new Map<string, DataConnection>()
  const spectatorConnections: DataConnection[] = []

  // --- Computed ---
  const me = computed<VsPlayer | null>(() =>
    players.value.find(p => p.id === myPlayerId.value) || null
  )

  const isHost = computed(() => myRole.value === 'host')
  const isSpectator = computed(() => myRole.value === 'spectator')

  const allPlayersAnswered = computed(() =>
    players.value.every(p => p.hasAnswered || !p.connected)
  )

  // Shared quiz logic (species filtering, stats checking, random pokemon)
  const speciesOptions = computed<SpeciesFilterOptions>(() => ({
    generation: settings.value.generation,
    minGeneration: settings.value.minGeneration,
    maxGeneration: settings.value.maxGeneration,
    fullyEvolvedOnly: settings.value.fullyEvolvedOnly,
    includeMegaPokemon: settings.value.includeMegaPokemon,
  }))

  // locale is not needed in useVsGame — VsGame.vue handles display.
  const quizLocale = ref('en')

  const {
    species,
    generateRandomPokemon,
    hasMatchingStats,
    findSpecies,
  } = useQuizLogic(speciesOptions, quizLocale)

  // --- Helpers ---
  function createPlayer(id: string, name: string, role: PlayerRole): VsPlayer {
    return {
      id,
      name,
      role,
      score: 0,
      roundScore: 0,
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
      players: players.value.map(p => ({ ...p })),
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
    myPlayerId.value = 'host'

    const hostPlayer = createPlayer('host', myName.value, 'host')
    players.value = [hostPlayer]
    gameState.value = 'waiting-for-players'

    try {
      await hostRoom(code)
      saveSession({
        roomCode: code,
        playerName: myName.value,
        playerId: 'host',
        role: 'host',
        peerId: code,
      })
    } catch {
      gameState.value = 'idle'
    }
  }

  // --- Player/Spectator: Join Room ---
  async function joinExistingRoom(code: string, asSpectator = false) {
    roomCode.value = code.toUpperCase()
    const playerId = generatePlayerId()
    myPlayerId.value = playerId
    gameState.value = 'lobby'

    try {
      await joinRoom(code.toUpperCase(), asSpectator)

      if (!asSpectator) {
        saveSession({
          roomCode: code.toUpperCase(),
          playerName: myName.value,
          playerId,
          role: 'player',
          peerId: peerConn.myPeerId.value,
        })
      }

      sendToAll({
        type: 'player-info',
        id: playerId,
        name: myName.value,
        role: asSpectator ? 'spectator' : 'player',
      })
    } catch {
      gameState.value = 'idle'
    }
  }

  // --- Restore state from a full room snapshot ---
  function restoreFromRoom(room: VsGameRoom) {
    gameState.value = room.state
    settings.value = room.settings
    players.value = room.players
    spectators.value = room.spectators
    currentRound.value = room.currentRound
    roundNumber.value = room.roundNumber
  }

  // --- Reconnection ---
  async function rejoinRoom(session: VsSession) {
    roomCode.value = session.roomCode
    myName.value = session.playerName
    myPlayerId.value = session.playerId

    try {
      if (session.role === 'host') {
        const savedState = loadGameState()
        if (savedState && savedState.roomCode === session.roomCode) {
          restoreFromRoom(savedState)
          if (gameState.value === 'playing' && currentRound.value) {
            // Reset answer states so the round can be replayed fairly
            for (const p of players.value) {
              p.hasAnswered = false
              p.lastGuess = null
              p.lastGuessCorrect = null
              p.lastGuessTimestamp = null
            }
            roundStartTime = Date.now()
            startRoundTimer()
          }
        } else {
          const hostPlayer = createPlayer('host', session.playerName, 'host')
          players.value = [hostPlayer]
          gameState.value = 'waiting-for-players'
        }
        await hostRoom(session.roomCode)
        saveSession(session)
      } else {
        gameState.value = 'lobby'
        await joinRoom(session.roomCode, false)
        saveSession({
          ...session,
          peerId: peerConn.myPeerId.value,
        })
        sendToAll({
          type: 'reconnect',
          id: session.playerId,
          name: session.playerName,
          role: 'player',
          peerId: peerConn.myPeerId.value,
        })
      }
    } catch {
      saveSession(null)
      gameState.value = 'idle'
    }
  }

  // --- Forfeit / Quit ---
  function forfeitGame() {
    sendToAll({ type: 'forfeit', playerId: myPlayerId.value })
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
        if (isHosting.value) {
          if (msg.role === 'spectator') {
            const spectator = createPlayer(msg.id, msg.name, 'spectator')
            spectators.value.push(spectator)
            spectatorConnections.push(conn)
            sendTo(conn, { type: 'room-settings', settings: settings.value })
            sendTo(conn, { type: 'spectator-state', room: getFullRoomState() })
          } else {
            // Player joined
            const newPlayer = createPlayer(msg.id, msg.name, 'player')
            players.value.push(newPlayer)
            playerConnections.set(msg.id, conn)
            gameState.value = 'lobby'

            // Send full state to new player
            sendTo(conn, { type: 'full-state', room: getFullRoomState() })

            // Notify all other players
            sendToAll({ type: 'player-joined', player: { ...newPlayer } })
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
          // Reset all player answer states
          for (const p of players.value) {
            p.hasAnswered = false
            p.lastGuess = null
            p.lastGuessCorrect = null
            p.lastGuessTimestamp = null
            p.roundScore = 0
          }
        }
        break

      case 'guess':
        if (isHosting.value) {
          const player = players.value.find(p => p.id === msg.playerId)
          if (player && !player.hasAnswered) {
            player.hasAnswered = true
            player.lastGuess = msg.pokemonId
            player.lastGuessCorrect = msg.correct
            player.lastGuessTimestamp = Date.now() // Host records arrival time

            // Notify all players that someone answered
            sendToAll({ type: 'player-answered', playerId: msg.playerId })
            broadcastToSpectators()

            if (allPlayersAnswered.value) {
              resolveRound()
            }
          }
        }
        break

      case 'player-answered':
        if (!isHosting.value) {
          const player = players.value.find(p => p.id === msg.playerId)
          if (player) {
            player.hasAnswered = true
          }
        }
        break

      case 'round-result':
        if (!isHosting.value) {
          gameState.value = 'round-result'
          for (const result of msg.results) {
            const player = players.value.find(p => p.id === result.playerId)
            if (player) {
              player.roundScore = result.score
              player.score += result.score
              player.lastGuess = result.guess
              player.lastGuessCorrect = result.correct
            }
          }
          if (currentRound.value) {
            currentRound.value.results = msg.results
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
        for (const p of msg.players) {
          const local = players.value.find(lp => lp.id === p.id)
          if (local) {
            local.score = p.score
            local.roundScore = p.roundScore
          }
        }
        // Find winner (highest score)
        const sorted = [...msg.players].sort((a, b) => b.score - a.score)
        matchWinner.value = sorted[0]?.id || null
        stopRoundTimer()
        break

      case 'restart-game':
        if (!isHosting.value) {
          for (const p of players.value) {
            p.score = 0
            p.roundScore = 0
            p.hasAnswered = false
            p.lastGuess = null
            p.lastGuessCorrect = null
            p.lastGuessTimestamp = null
          }
          roundNumber.value = 0
          elapsedTime.value = 0
          currentRound.value = null
          matchWinner.value = null
          gameState.value = 'countdown'
          startCountdown()
        }
        break

      case 'spectator-state':
        if (isSpectator.value) {
          restoreFromRoom(msg.room)
        }
        break

      case 'error':
        connectionError.value = msg.message
        break

      case 'reconnect':
        if (isHosting.value) {
          const existingPlayer = players.value.find(p => p.id === msg.id)
          if (existingPlayer) {
            existingPlayer.connected = true
            existingPlayer.name = msg.name
            playerConnections.set(msg.id, conn)
          } else {
            const newPlayer = createPlayer(msg.id, msg.name, 'player')
            players.value.push(newPlayer)
            playerConnections.set(msg.id, conn)
          }
          sendTo(conn, { type: 'full-state', room: getFullRoomState() })
          broadcastToSpectators()
          saveGameState(getFullRoomState())
        }
        break

      case 'full-state':
        if (!isHosting.value) {
          restoreFromRoom(msg.room)
        }
        break

      case 'forfeit':
        if (isHosting.value) {
          const player = players.value.find(p => p.id === msg.playerId)
          if (player) {
            player.connected = false
            sendToAll({ type: 'player-left', playerId: msg.playerId })
            broadcastToSpectators()

            // If less than 2 connected players remain during a game, end match
            const connectedPlayers = players.value.filter(p => p.connected)
            if (connectedPlayers.length < 2 && !['idle', 'waiting-for-players', 'lobby'].includes(gameState.value)) {
              const winner = connectedPlayers[0]
              if (winner) {
                matchWinner.value = winner.id
                gameState.value = 'match-end'
                stopRoundTimer()
                if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null }
                sendToAll({ type: 'match-end', players: players.value.map(p => ({ ...p })) })
                broadcastToSpectators()
              }
            } else if (allPlayersAnswered.value && gameState.value === 'playing') {
              resolveRound()
            }
          }
        }
        break

      case 'player-joined':
        if (!isHosting.value) {
          const exists = players.value.find(p => p.id === msg.player.id)
          if (!exists) {
            players.value.push(msg.player)
          }
        }
        break

      case 'player-left':
        if (!isHosting.value) {
          const player = players.value.find(p => p.id === msg.playerId)
          if (player) {
            player.connected = false
          }
        }
        break
    }
  }

  // --- Host: Start Game ---
  function startGame() {
    if (!isHosting.value || players.value.length < 2) return

    gameState.value = 'countdown'

    // Reset all player scores
    for (const p of players.value) {
      p.score = 0
      p.roundScore = 0
    }
    roundNumber.value = 0
    elapsedTime.value = 0

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
    roundStartTime = Date.now()

    const round: VsRound = {
      number: roundNumber.value,
      pokemonId: pokemon.name,
      pokemonTypes: [...pokemon.types],
      pokemonAbilities: Object.values(pokemon.abilities).filter(a => a) as string[],
      timeRemaining: settings.value.timeLimit,
      hintLevel: 0,
      results: [],
    }

    currentRound.value = round
    gameState.value = 'playing'

    // Reset answer states
    for (const p of players.value) {
      p.hasAnswered = false
      p.lastGuess = null
      p.lastGuessCorrect = null
      p.lastGuessTimestamp = null
      p.roundScore = 0
    }

    sendToAll({ type: 'new-round', round })
    broadcastToSpectators()
    saveGameState(getFullRoomState())

    startRoundTimer()

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

      // Sync timer to all players
      if (isHosting.value) {
        sendToAll({
          type: 'timer-sync',
          timeRemaining: currentRound.value.timeRemaining,
          hintLevel: currentRound.value.hintLevel,
        })
        broadcastToSpectators()
        if (currentRound.value.timeRemaining % 5 === 0) {
          saveGameState(getFullRoomState())
        }
      }

      // Time's up
      if (currentRound.value.timeRemaining <= 0) {
        stopRoundTimer()
        if (isHosting.value) {
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

    const myPlayer = me.value
    if (!myPlayer || myPlayer.hasAnswered) return // Can't change after submitting

    const pokemon = findSpecies(pokemonId)
    if (!pokemon) return

    const targetPokemon = findSpecies(currentRound.value.pokemonId)
    if (!targetPokemon) return

    const correct = hasMatchingStats(pokemon, targetPokemon)

    if (isHosting.value) {
      myPlayer.hasAnswered = true
      myPlayer.lastGuess = pokemonId
      myPlayer.lastGuessCorrect = correct
      myPlayer.lastGuessTimestamp = Date.now()

      sendToAll({ type: 'player-answered', playerId: myPlayerId.value })
      broadcastToSpectators()

      if (allPlayersAnswered.value) {
        resolveRound()
      }
    } else {
      // Non-host: send guess to host
      myPlayer.hasAnswered = true
      myPlayer.lastGuess = pokemonId
      myPlayer.lastGuessCorrect = correct

      sendToAll({
        type: 'guess',
        playerId: myPlayerId.value,
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

    const timeLimit = settings.value.timeLimit

    const results: PlayerRoundResult[] = players.value.map(player => {
      const isCorrect = player.lastGuessCorrect === true
      let timeRemaining = 0
      if (isCorrect && player.lastGuessTimestamp) {
        const timeUsed = (player.lastGuessTimestamp - roundStartTime) / 1000
        timeRemaining = Math.max(0, timeLimit - timeUsed)
      }
      const score = calculateRoundScore(timeRemaining, timeLimit, isCorrect)

      return {
        playerId: player.id,
        playerName: player.name,
        guess: player.lastGuess,
        correct: isCorrect,
        timestamp: player.lastGuessTimestamp,
        score,
      }
    })

    // Update player scores
    for (const result of results) {
      const player = players.value.find(p => p.id === result.playerId)
      if (player) {
        player.roundScore = result.score
        player.score += result.score
      }
    }

    currentRound.value.results = results
    gameState.value = 'round-result'

    sendToAll({ type: 'round-result', results, correctPokemon: currentRound.value.pokemonId })
    broadcastToSpectators()
    saveGameState(getFullRoomState())

    checkMatchEnd()
  }

  // --- Check if the match should end ---
  function checkMatchEnd() {
    let matchOver = false

    if (settings.value.gameMode === 'rounds') {
      matchOver = roundNumber.value >= settings.value.totalRounds
    } else {
      matchOver = players.value.some(p => p.score >= settings.value.targetScore)
    }

    if (matchOver) {
      setTimeout(() => {
        const sorted = [...players.value].sort((a, b) => b.score - a.score)
        matchWinner.value = sorted[0]?.id || null
        gameState.value = 'match-end'

        if (elapsedTimer) {
          clearInterval(elapsedTimer)
          elapsedTimer = null
        }

        sendToAll({ type: 'match-end', players: players.value.map(p => ({ ...p })) })
        broadcastToSpectators()
        saveGameState(getFullRoomState())
      }, 2000)
    } else {
      // Auto-advance to next round
      setTimeout(() => {
        if (gameState.value === 'round-result' && isHosting.value) {
          startNewRound()
        }
      }, 3000)
    }
  }

  // --- Host: Restart Game ---
  function restartGame() {
    if (!isHosting.value) return

    for (const p of players.value) {
      p.score = 0
      p.roundScore = 0
      p.hasAnswered = false
      p.lastGuess = null
      p.lastGuessCorrect = null
      p.lastGuessTimestamp = null
    }

    roundNumber.value = 0
    elapsedTime.value = 0
    currentRound.value = null
    matchWinner.value = null

    sendToAll({ type: 'restart-game' })
    broadcastToSpectators()
    startGame()
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
    players.value = []
    spectators.value = []
    currentRound.value = null
    roundNumber.value = 0
    matchWinner.value = null
    playerConnections.clear()
  }

  onUnmounted(() => {
    stopRoundTimer()
    stopAutoReconnect()
    if (countdownTimer) clearInterval(countdownTimer)
    if (elapsedTimer) clearInterval(elapsedTimer)
  })

  // --- Auto-reconnect when connection is lost ---
  watch(isConnected, (connected, wasConnected) => {
    if (wasConnected && !connected && myRole.value === 'player' && gameState.value !== 'idle') {
      startAutoReconnect()
    }
  })

  function startAutoReconnect() {
    const session = loadSession()
    if (!session || session.role === 'spectator') return
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
          id: session.playerId,
          name: session.playerName,
          role: session.role,
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
    players,
    spectators,
    currentRound,
    roundNumber,
    countdown,
    matchWinner,
    myName,
    myPlayerId,
    myRole,
    elapsedTime,

    // Computed
    me,
    isHost,
    isSpectator,
    isConnected,
    connectionError,
    allPlayersAnswered,
    species,

    // Actions
    createRoom,
    joinExistingRoom,
    rejoinRoom,
    startGame,
    submitGuess,
    restartGame,
    updateSettings,
    leaveGame,
    forfeitGame,
    getSavedSession,
  }
}
