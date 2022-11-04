import { createGame } from './game.js'

/**
 * @typedef {ReturnType<configureGameService>} GameService
 */

const GAME_TIMEOUT_MS = 1000 * 60 * 60 * 2 // 2 hours

export function configureGameService () {
  /** @type {Map<string, { created: number, subscribers: Set<(code: string) => void>, game: ReturnType<createGame>}>} */
  const gameMap = new Map()

  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, game] of gameMap) {
      if (now - game.created > GAME_TIMEOUT_MS) {
        game.game.close()
        game.subscribers.clear()
        gameMap.delete(key)
      }
    }
  }, 1000)

  const service = {
    /**
     * @param {string} word
     */
    createGame (word) {
      let code = generateCode()
      while (gameMap.has(code)) code = generateCode()
      gameMap.set(code, {
        created: Date.now(),
        subscribers: new Set(),
        game: createGame(word)
      })
      return code
    },
    /**
     * @param {string} existingCode
     * @param {string} word
     */
    createNewGame (existingCode, word) {
      const game = gameMap.get(existingCode)
      if (!game) throw new GameNotFound()
      const code = service.createGame(word)
      game.subscribers.forEach(onNewGame => onNewGame(code))
      service.closeGame(existingCode)
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
     * @param {(code: string) => void} onNewGame
     */
    subscribe (code, onChange, onFinish, onNewGame) {
      const game = gameMap.get(code)
      if (!game) throw new GameNotFound()
      game.subscribers.add(onNewGame)
      const unsubscribe = game.game.subscribe(onChange, onFinish)
      return () => {
        unsubscribe()
        game.subscribers.delete(onNewGame)
      }
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
      if (result.success) return result.state
      throw result.error
    },
    /**
     * @param {string} code
     */
    closeGame (code) {
      const game = gameMap.get(code)
      if (!game) return
      game.subscribers.clear()
      game.game.close()
      gameMap.delete(code)
    },
    stop () {
      clearInterval(cleanupInterval)
      for (const [code, game] of gameMap) {
        game.game.close()
        gameMap.delete(code)
      }
    }
  }
  return service
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
