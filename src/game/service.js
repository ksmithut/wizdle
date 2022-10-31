import { createGame } from './game.js'

/**
 * @typedef {ReturnType<configureGameService>} GameService
 */

const GAME_TIMEOUT_MS = 1000 * 60 * 60 * 1 // 1 hour

export function configureGameService () {
  /** @type {Map<string, { created: number, game: ReturnType<createGame>}>} */
  const gameMap = new Map()

  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, game] of gameMap) {
      if (now - game.created > GAME_TIMEOUT_MS) {
        game.game.close()
        gameMap.delete(key)
      }
    }
  }, 1000)

  return {
    /**
     * @param {string} word
     */
    createGame (word) {
      let code = generateCode()
      while (gameMap.has(code)) code = generateCode()
      gameMap.set(code, { created: Date.now(), game: createGame(word) })
      return code
    },
    /**
     * @param {string} code
     */
    hasGame (code) {
      return gameMap.has(code)
    },
    /**
     * @param {string} code
     * @param {(game: import('./state.js').GameState) => void} onChange
     * @param {() => void} onFinish
     */
    subscribe (code, onChange, onFinish) {
      const game = gameMap.get(code)
      if (!game) throw new GameNotFound()
      return game.game.subscribe(onChange, onFinish)
    },
    /**
     * @param {string} code
     * @param {string} playerId
     * @param {string} name
     */
    joinGame (code, playerId, name) {
      const game = gameMap.get(code)
      if (!game) throw new GameNotFound()
      const result = game.game.addPlayer(playerId, name)
      if (result.success) return result.state
      throw result.error
    },
    /**
     * @param {string} code
     */
    startGame (code) {
      const game = gameMap.get(code)
      if (!game) throw new GameNotFound()
      const result = game.game.startGame()
      if (result.success) return result.state
      throw result.error
    },
    /**
     * @param {string} code
     * @param {string} playerId
     * @param {string} guess
     */
    guess (code, playerId, guess) {
      const game = gameMap.get(code)
      if (!game) throw new GameNotFound()
      const result = game.game.guess(playerId, guess)
      if (result.success) {
        if (result.state.state === 'FINISHED') {
          game.game.close()
          gameMap.delete(code)
        }
        return result.state
      }
      throw result.error
    },
    stop () {
      clearInterval(cleanupInterval)
      for (const [code, game] of gameMap) {
        game.game.close()
        gameMap.delete(code)
      }
    }
  }
}

export class GameNotFound extends Error {
  constructor () {
    super('Game Not Found')
    Error.captureStackTrace(this, this.constructor)
    this.code = 'GAME_NOT_FOUND'
  }
}

const alphabet = 'BCDFGHJKLMNPQRSTVWXYZ'

function generateCode (length = 4) {
  return new Array(length)
    .fill(null)
    .map(() => alphabet[random(0, alphabet.length - 1)])
    .join('')
}

/**
 * @param {number} min
 * @param {number} max
 */
function random (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
