import * as state from './state.js'

/**
 * @param {string} word
 */
export function createGame(word) {
  if (typeof word !== 'string') throw new Error('Invalid word')
  if (!word.match(/^[a-z]+$/)) throw new Error('Invalid word')
  const result = state.initializeGame(word)
  if (!result.success) throw result.error
  let gameState = result.state
  /** @type {Set<[(gameState: import('./state.js').GameState) => void, () => void]>} */
  const subscribers = new Set()

  /**
   * @param {import('./state.js').GameState} gameState
   */
  function emit(gameState) {
    subscribers.forEach(([onChange]) => onChange(gameState))
  }

  return {
    /**
     * @param {string} playerId
     * @param {string} name
     */
    addPlayer(playerId, name) {
      const result = state.addPlayer(gameState, playerId, name)
      if (result.success) {
        gameState = result.state
        emit(gameState)
      }
      return result
    },
    startGame() {
      const result = state.startGame(gameState)
      if (result.success) {
        gameState = result.state
        emit(gameState)
      }
      return result
    },
    /**
     * @param {string} playerId
     * @param {string} guess
     */
    guess(playerId, guess) {
      const result = state.guess(gameState, playerId, guess)
      if (result.success) {
        gameState = result.state
        emit(gameState)
      }
      return result
    },
    /**
     * @param {(gameState: import('./state.js').GameState) => void} onChange
     * @param {() => void} onFinish
     */
    subscribe(onChange, onFinish) {
      /** @type {[(gameState: import('./state.js').GameState) => void, () => void]} */
      const subscriberTuple = [onChange, onFinish]
      subscribers.add(subscriberTuple)
      onChange(gameState)
      return () => {
        subscribers.delete(subscriberTuple)
        onFinish()
      }
    },
    close() {
      subscribers.forEach(([_, onFinish]) => onFinish())
      subscribers.clear()
    },
  }
}
