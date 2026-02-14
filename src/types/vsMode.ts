import type { QuizSettings } from './settings'

/**
 * Roles in a VS game
 */
export type PlayerRole = 'host' | 'guest' | 'spectator'

/**
 * VS game states
 */
export type VsGameState =
  | 'idle'
  | 'lobby'
  | 'waiting-for-opponent'
  | 'countdown'
  | 'playing'
  | 'round-result'
  | 'match-end'

/**
 * Player info
 */
export interface VsPlayer {
  name: string
  role: PlayerRole
  score: number
  hasAnswered: boolean
  lastGuess: string | null
  lastGuessCorrect: boolean | null
  lastGuessTimestamp: number | null
  connected: boolean
}

/**
 * Round state
 */
export interface VsRound {
  number: number
  pokemonId: string
  pokemonTypes: string[]
  pokemonAbilities: string[]
  timeRemaining: number
  hintLevel: number
  winner: PlayerRole | 'none' | null
  wonBySpeed: boolean
}

/**
 * VS game room settings
 */
export interface VsRoomSettings extends QuizSettings {
  timeLimit: number // seconds per round, 0 = no limit
}

/**
 * Full VS game state
 */
export interface VsGameRoom {
  roomCode: string
  state: VsGameState
  settings: VsRoomSettings
  host: VsPlayer
  guest: VsPlayer | null
  spectators: VsPlayer[]
  currentRound: VsRound | null
  roundNumber: number
}

/**
 * Message types for peer communication
 */
export type VsMessage =
  | { type: 'player-info'; name: string; role: PlayerRole }
  | { type: 'room-settings'; settings: VsRoomSettings }
  | { type: 'game-start' }
  | { type: 'new-round'; round: VsRound }
  | { type: 'guess'; pokemonId: string; correct: boolean; timestamp: number }
  | { type: 'opponent-answered' }
  | { type: 'round-result'; winner: PlayerRole | 'none'; correctPokemon: string; hostGuess: string | null; guestGuess: string | null; hostCorrect: boolean | null; guestCorrect: boolean | null; wonBySpeed: boolean }
  | { type: 'match-end'; winner: PlayerRole; hostScore: number; guestScore: number }
  | { type: 'rematch-request' }
  | { type: 'rematch-accept' }
  | { type: 'timer-sync'; timeRemaining: number; hintLevel: number }
  | { type: 'spectator-state'; room: VsGameRoom }
  | { type: 'error'; message: string }
  | { type: 'reconnect'; name: string; role: PlayerRole; peerId: string }
  | { type: 'full-state'; room: VsGameRoom }
  | { type: 'forfeit'; role: PlayerRole }

/**
 * Session data stored for reconnection
 */
export interface VsSession {
  roomCode: string
  playerName: string
  role: PlayerRole
  peerId: string
}

/**
 * Default VS room settings
 */
export const defaultVsRoomSettings: VsRoomSettings = {
  generation: 9,
  minGeneration: 1,
  maxGeneration: 9,
  fullyEvolvedOnly: true,
  includeMegaPokemon: false,
  maxScore: 5,
  hintsEnabled: true,
  timeLimit: 40,
}

/**
 * Pokémon-themed name parts for auto-generation
 */
const nameAdjectives = [
  'Swift', 'Bold', 'Brave', 'Calm', 'Jolly', 'Modest', 'Adamant', 'Timid',
  'Hasty', 'Gentle', 'Sassy', 'Naive', 'Quiet', 'Rash', 'Careful', 'Naughty',
  'Lonely', 'Mild', 'Relaxed', 'Impish', 'Lax', 'Hardy', 'Docile', 'Serious',
]

const namePokemon = [
  'Pikachu', 'Eevee', 'Charizard', 'Mewtwo', 'Gengar', 'Snorlax',
  'Lucario', 'Gardevoir', 'Blaziken', 'Greninja', 'Dragapult', 'Mimikyu',
  'Umbreon', 'Sylveon', 'Tyranitar', 'Garchomp', 'Scizor', 'Togekiss',
  'Infernape', 'Decidueye', 'Cinderace', 'Toxtricity', 'Corviknight', 'Zoroark',
]

/**
 * Generate a random player name
 */
export function generatePlayerName(): string {
  const adj = nameAdjectives[Math.floor(Math.random() * nameAdjectives.length)]!
  const poke = namePokemon[Math.floor(Math.random() * namePokemon.length)]!
  return `${adj}${poke}`
}

/**
 * Generate a random 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I, O, 0, 1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
