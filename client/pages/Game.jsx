import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Guess from '../components/Guess.jsx'
import Keyboard from '../components/Keyboard.jsx'
import {
  useGameState,
  useGuess,
  useRedirectIfDoesNotExist,
} from '../lib/api-hooks.js'

export default function Game() {
  /** @type {{ code: string }} */
  // @ts-ignore
  const { code } = useParams()
  useRedirectIfDoesNotExist(code)
  const { finished, state, newGame } = useGameState(code)
  if (!state) return <p>Loading...</p>
  if (state.state === 'INITIALIZED') {
    return (
      <p className="text-3xl text-center p-2 w-full uppercase">
        Waiting for the game to begin
      </p>
    )
  }

  return <GuessBoard code={code} state={state} newGame={newGame} />
}

/**
 * @param {object} props
 * @param {string} props.code
 * @param {import('../lib/api-hooks.js').GameState} props.state
 * @param {string?} props.newGame
 */
function GuessBoard({ code, state, newGame }) {
  const [guessInfo, guessAPI] = useGuess()
  const [guess, setGuess] = React.useState(
    /**
     * @returns {{ character: string?, result: 'HIT'|'KNOWN'|'UNKNOWN' }[]}
     */
    () => {
      return new Array(state.length).fill(null).map(() => ({
        character: null,
        result: 'UNKNOWN',
      }))
    },
  )
  const word = guess
    .map((char) => char.character ?? '')
    .join('')
    .toLowerCase()
  const me = Object.values(state.players).find((player) => player.me)
  const handleKeyPress = React.useCallback(
    /**
     * @param {string} key
     */
    (key) => {
      if (me?.complete) return
      if (key === 'enter') {
        if (word.length === state.length) {
          guessAPI(code, word).then((result) => {
            if (result.status === 'fulfilled') {
              setGuess(
                new Array(state.length).fill(null).map(() => ({
                  character: null,
                  result: 'UNKNOWN',
                })),
              )
            }
          })
        }

        // TODO GUESS
        return
      }
      if (key === 'backspace') {
        setGuess((guess) => {
          let indexToClear = guess.findIndex((c) => c.character === null)
          if (indexToClear === -1) indexToClear = guess.length
          indexToClear -= 1
          return guess.map((c, i) => {
            return i === indexToClear ? { ...c, character: null } : c
          })
        })
        return
      }
      setGuess((guess) => {
        const indexToUpdate = guess.findIndex((c) => c.character === null)
        return guess.map((c, i) => {
          return i === indexToUpdate ? { ...c, character: key } : c
        })
      })
    },
    [code, word, state.length, me?.complete],
  )
  const { hits, misses, knowns } = React.useMemo(() => {
    return (me?.guesses ?? []).reduce(
      /**
       * @param {object} memo
       * @param {string[]} memo.hits
       * @param {string[]} memo.misses
       * @param {string[]} memo.knowns
       */
      (memo, guess) => {
        guess.forEach((c) => {
          if (c.result === 'HIT') memo.hits.push(c.character.toUpperCase())
          if (c.result === 'KNOWN') memo.knowns.push(c.character.toUpperCase())
          if (c.result === 'UNKNOWN') {
            memo.misses.push(c.character.toUpperCase())
          }
        })
        return memo
      },
      { hits: [], misses: [], knowns: [] },
    )
  }, [me?.guesses])
  if (!me) return null
  /** @type {string|undefined} */
  // @ts-ignore
  const guessError = guessInfo.error?.body?.error
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="w-full flex-1 gap-2 my-2 overflow-y-scroll">
        <>
          {me.guesses.map((guess, i) => (
            <Guess
              className="overflow-anchor-none mb-2"
              key={i}
              guess={guess}
            />
          ))}
          {!me.complete && (
            <Guess className="overflow-anchor-none mb-2" guess={guess} />
          )}
          {guessError && (
            <p className="font-bold text-red-500 text-center overflow-anchor-none mb-2">
              {guessError}
            </p>
          )}
          <div className="overflow-anchor-auto" style={{ height: 1 }}></div>
        </>
      </div>
      {me.complete ? (
        <>
          <p className="font-bold uppercase text-center text-3xl">Finished!</p>
          <Link className="text-center text-2xl text-blue-500" to="/">
            Go Back Home
          </Link>
          {newGame && (
            <Link
              className="text-center text-2xl text-blue-500"
              to={`/join/${newGame}`}
            >
              Play Again?
            </Link>
          )}
        </>
      ) : (
        <Keyboard
          onKeyPress={handleKeyPress}
          hits={hits}
          misses={misses}
          knowns={knowns}
        />
      )}
    </div>
  )
}
