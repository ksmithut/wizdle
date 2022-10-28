import React from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from './api.js'
import { useLazyPromise } from './use-promise.js'

export function useCreateGame () {
  return useLazyPromise(api.createGame)
}

export function useJoinGame () {
  return useLazyPromise(api.joinGame)
}

export function useExists () {
  return useLazyPromise(api.exists)
}

export function useStartGame () {
  return useLazyPromise(api.startGame)
}

export function useGuess () {
  return useLazyPromise(api.guess)
}

/**
 * @typedef {object} CharacterResult
 * @property {string} character
 * @property {'HIT'|'KNOWN'|'UNKNOWN'} result
 */

/** @typedef {CharacterResult[]} Guess */

/**
 * @typedef {object} Player
 * @property {boolean} complete
 * @property {string} name
 * @property {boolean} me
 * @property {Guess[]} guesses
 */

/**
 * @typedef {object} GameState
 * @property {string} state
 * @property {number} length
 * @property {Record<string, Player>} players
 */

/**
 * @param {string} code
 */
export function useGameState (code) {
  const [state, setState] = React.useState(() => ({
    finished: false,
    /** @type {Event?} */
    error: null,
    /** @type {GameState?} */
    state: null
  }))
  React.useEffect(() => {
    return api.listen(code, (data) => {
      setState(() => ({ error: null, finished: false, state: data }))
    }, {
      onError (event) {
        setState(state => ({ ...state, error: event }))
      },
      onFinish () {
        setState(state => ({ ...state, error: null, finished: true }))
      }
    })
  }, [code])
  return state
}

/**
 * @param {string} code
 */
export function useRedirectIfDoesNotExist (code) {
  const [existsInfo, exists] = useExists()
  const navigate = useNavigate()
  React.useEffect(() => {
    if (code) {
      exists(code).then(res => {
        if (res.status === 'fulfilled' && res.value === false) {
          navigate('/')
        }
      })
    }
  }, [code, navigate])
}
