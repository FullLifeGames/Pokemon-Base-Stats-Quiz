import type { QuizSettings } from './settings'
import type { MoveInfo } from '@/composables/useLearnsetData'
import type { DamageScenario } from '@/composables/useDamageCalc'

/**
 * Roles in a VS game
 */
export type PlayerRole = 'host' | 'player' | 'spectator'

/**
 * VS game states
 */
export type VsGameState =
  | 'idle'
  | 'waiting-for-players'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'round-result'
  | 'match-end'

/**
 * Game mode determines how the match ends
 */
export type GameMode = 'rounds' | 'target-score'

/**
 * Player info
 */
export interface VsPlayer {
  id: string
  name: string
  role: PlayerRole
  score: number
  roundScore: number
  hasAnswered: boolean
  lastGuess: string | null
  lastGuessCorrect: boolean | null
  lastGuessTimestamp: number | null
  connected: boolean
}

/**
 * Per-player result for a round
 */
export interface PlayerRoundResult {
  playerId: string
  playerName: string
  guess: string | null
  correct: boolean
  timestamp: number | null
  score: number
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
  results: PlayerRoundResult[]
  /** Quiz-mode-specific: learnset moves grouped by type (learnset mode) */
  learnsetMoves?: Record<string, MoveInfo[]>
  /** Quiz-mode-specific: damage scenario (damage mode) */
  damageScenario?: DamageScenario
}

/**
 * VS game room settings
 */
export interface VsRoomSettings extends QuizSettings {
  timeLimit: number       // seconds per round, minimum 10
  gameMode: GameMode
  totalRounds: number     // used when gameMode === 'rounds'
  targetScore: number     // used when gameMode === 'target-score'
}

/**
 * Full VS game state
 */
export interface VsGameRoom {
  roomCode: string
  state: VsGameState
  settings: VsRoomSettings
  players: VsPlayer[]
  spectators: VsPlayer[]
  currentRound: VsRound | null
  roundNumber: number
}

/**
 * Message types for peer communication
 */
export type VsMessage =
  | { type: 'player-info'; id: string; name: string; role: PlayerRole }
  | { type: 'room-settings'; settings: VsRoomSettings }
  | { type: 'game-start' }
  | { type: 'new-round'; round: VsRound }
  | { type: 'guess'; playerId: string; pokemonId: string; correct: boolean; timestamp: number }
  | { type: 'damage-guess'; playerId: string; damagePercent: number; correct: boolean; timestamp: number }
  | { type: 'player-answered'; playerId: string }
  | { type: 'round-result'; results: PlayerRoundResult[]; correctPokemon: string }
  | { type: 'match-end'; players: VsPlayer[] }
  | { type: 'restart-game' }
  | { type: 'timer-sync'; timeRemaining: number; hintLevel: number }
  | { type: 'spectator-state'; room: VsGameRoom }
  | { type: 'error'; message: string }
  | { type: 'reconnect'; id: string; name: string; role: PlayerRole; peerId: string }
  | { type: 'full-state'; room: VsGameRoom }
  | { type: 'forfeit'; playerId: string }
  | { type: 'player-joined'; player: VsPlayer }
  | { type: 'player-left'; playerId: string }

/**
 * Session data stored for reconnection
 */
export interface VsSession {
  roomCode: string
  playerName: string
  playerId: string
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
  vgc: false,
  maxScore: 5,
  hintsEnabled: true,
  quizMode: 'base-stat',
  timeLimit: 30,
  gameMode: 'rounds',
  totalRounds: 10,
  targetScore: 5000,
}

/**
 * Calculate score for a correct answer based on remaining time.
 * Returns 1000 for instant answers, scaling down to 100 at the deadline.
 * Returns 0 for incorrect answers.
 */
export function calculateRoundScore(timeRemaining: number, timeLimit: number, isCorrect: boolean): number {
  if (!isCorrect) return 0
  if (timeLimit <= 0) return 500
  const ratio = Math.max(0, Math.min(1, timeRemaining / timeLimit))
  return Math.round(100 + 900 * ratio)
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 10)
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
  'Arcanine', 'Hydreigon', 'Salamence', 'Metagross', 'Scorbunny', 'Sobble',
  'Cramorant', 'Haxorus', 'Venusaur', 'Blissey', 'Alakazam', 'Machamp',
  'Ditto', 'Jolteon', 'Vaporeon', 'Flareon', 'Noivern', 'Rhyperior',
  'Excadrill', 'Goodra', 'Rillaboom', 'Inteleon', 'Incineroar', 'Lycanroc',
  'Primarina', 'Tapu Koko', 'Zacian', 'Zamazenta', 'Regieleki', 'Regidrago',
  'Indeedee', 'Kommo-o', 'Hatterene', 'Talonflame', 'Bisharp', 'Golisopod',
  'Porygon-Z', 'Corphish', 'Swampert', 'Ferrothorn', 'Mamoswine', 'Lucario-Mega',
  'Gyarados', 'Kingdra', 'Milotic', 'Greninja-Ash'
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
