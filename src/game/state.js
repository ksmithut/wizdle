import fs from 'node:fs/promises'
import actualGuess from './guess.js'

const words = await fs
  .readFile(new URL('./words.txt', import.meta.url), 'utf-8')
  .then((lines) => new Set(lines.trim().split('\n')))

/** @typedef {'INITIALIZED'|'STARTED'|'FINISHED'} State */

/**
 * @typedef {object} Player
 * @property {string} name
 * @property {import('./guess.js').Result[]} guesses
 * @property {boolean} complete
 */

/**
 * @typedef {object} GameState
 * @property {State} state
 * @property {string} word
 * @property {Map<string, Player>} players
 */

/**
 * @typedef {object} GameStateUpdateSuccess
 * @property {true} success
 * @property {GameState} state
 */

/**
 * @typedef {object} GameStateUpdateFailure
 * @property {false} success
 * @property {GameError} error
 */

/**
 * @typedef {GameStateUpdateSuccess|GameStateUpdateFailure} GameStateUpdateResult
 */

const STATE = {
  /** @type {'INITIALIZED'} */
  INITIALIZED: 'INITIALIZED',
  /** @type {'STARTED'} */
  STARTED: 'STARTED',
  /** @type {'FINISHED'} */
  FINISHED: 'FINISHED',
}

/**
 * @param {string} word
 * @returns {GameStateUpdateResult}
 */
export function initializeGame(word) {
  if (!words.has(word)) {
    return { success: false, error: new InvalidWord(word) }
  }
  return {
    success: true,
    state: { state: STATE.INITIALIZED, word, players: new Map() },
  }
}

/**
 * @param {GameState} gameState
 * @param {string} playerId
 * @param {string} name
 * @returns {GameStateUpdateResult}
 */
export function addPlayer(gameState, playerId, name) {
  if (gameState.state !== STATE.INITIALIZED) {
    return { success: false, error: new AlreadyStarted() }
  }
  return {
    success: true,
    state: {
      ...gameState,
      players: new Map(gameState.players).set(playerId, {
        complete: false,
        guesses: [],
        name,
      }),
    },
  }
}

/**
 * @param {GameState} gameState
 * @returns {GameStateUpdateResult}
 */
export function startGame(gameState) {
  if (gameState.state !== STATE.INITIALIZED) {
    return { success: false, error: new AlreadyStarted() }
  }
  if (gameState.players.size === 0) {
    return { success: false, error: new NotEnoughPlayers() }
  }
  return { success: true, state: { ...gameState, state: STATE.STARTED } }
}

/**
 * @param {GameState} gameState
 * @param {string} playerId
 * @param {string} guess
 * @returns {GameStateUpdateResult}
 */
export function guess(gameState, playerId, guess) {
  if (gameState.state === STATE.INITIALIZED) {
    return { success: false, error: new NotStarted() }
  }
  if (gameState.state === STATE.FINISHED) {
    return { success: false, error: new AlreadyFinished() }
  }
  const player = gameState.players.get(playerId)
  if (!player) {
    return { success: false, error: new PlayerNotRegistered() }
  }
  if (player.complete) {
    return { success: false, error: new PlayerAlreadyFinished() }
  }
  if (!words.has(guess)) {
    return { success: false, error: new InvalidWord(guess) }
  }
  const existingGuesses = player.guesses.reduce(
    /**
     * @param {Set<string>} set
     * @param {import('./guess.js').Result} result
     */
    (set, result) => {
      return set.add(result.reduce((word, char) => word + char.character, ''))
    },
    new Set(),
  )
  if (existingGuesses.has(guess)) {
    return { success: false, error: new AlreadyGuessed() }
  }
  try {
    const result = actualGuess(gameState.word, guess)
    return {
      success: true,
      state: maybeFinish({
        ...gameState,
        players: new Map(gameState.players).set(playerId, {
          ...player,
          complete: result.match,
          guesses: [...player.guesses, result.result],
        }),
      }),
    }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { success: false, error: new GuessError(error) }
  }
}

/**
 * @param {GameState} gameState
 * @return {GameState}
 */
function maybeFinish(gameState) {
  const isFinished = Array.from(gameState.players.values()).every(
    (player) => player.complete,
  )
  if (!isFinished) return gameState
  return { ...gameState, state: STATE.FINISHED }
}

export class GameError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor(message, code) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
  }
}

export class InvalidWord extends GameError {
  /**
   * @param {string} word
   */
  constructor(word) {
    super(`"${word.toUpperCase()}" is not a valid word`, 'INVALID_WORD')
  }
}

export class AlreadyStarted extends GameError {
  constructor() {
    super('Game has already started', 'ALREADY_STARTED')
  }
}

export class NotStarted extends GameError {
  constructor() {
    super('Game has not started', 'NOT_STARTED')
  }
}

export class AlreadyFinished extends GameError {
  constructor() {
    super('Game has already finished', 'ALREADY_FINISHED')
  }
}

export class NotEnoughPlayers extends GameError {
  constructor() {
    super('Not enought players to start', 'NOT_ENOUGH_PLAYERS')
  }
}

export class PlayerNotRegistered extends GameError {
  constructor() {
    super('Player is not registered', 'PLAYER_NOT_REGISTERED')
  }
}

export class PlayerAlreadyFinished extends GameError {
  constructor() {
    super('Player is already finished', 'PLAYER_ALREADY_FINISHED')
  }
}

export class AlreadyGuessed extends GameError {
  constructor() {
    super('Word has already been gueessed', 'ALREADY_GUESSED')
  }
}

export class GuessError extends GameError {
  /**
   * @param {Error} orig
   */
  constructor(orig) {
    super('Error guessing', 'GUESS_ERROR')
    this.orig = orig
  }
}
