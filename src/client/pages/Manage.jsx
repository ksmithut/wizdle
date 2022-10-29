import clsx from 'clsx'
import React from 'react'
import { Link, useParams } from 'react-router-dom'
import Guess from '../components/Guess.jsx'
import QRCode from '../components/QRCode.jsx'
import {
  useGameState,
  useRedirectIfDoesNotExist,
  useStartGame
} from '../lib/api-hooks.js'

export default function Manage () {
  /** @type {{ code: string}} */
  // @ts-ignore
  const { code } = useParams()
  useRedirectIfDoesNotExist(code)
  const { error, finished, state } = useGameState(code)
  const [startGameInfo, startGame] = useStartGame()
  const url = new URL(
    `/game/${encodeURIComponent(code)}`,
    window.location.origin
  )
  const handleStartGameClick = React.useCallback(
    /** @type {React.MouseEventHandler<HTMLButtonElement>} */
    e => {
      startGame(code)
    },
    [code]
  )
  if (!state) return null
  return (
    <div className='flex w-full items-center flex-col'>
      {startGameInfo.data === null
        ? (
          <PreGame
            code={code}
            state={state}
            onStartGameClick={handleStartGameClick}
          />
        )
        : <Spectate state={state} />}
    </div>
  )
}

/**
 * @param {object} props
 * @param {string} props.code
 * @param {import('../lib/api-hooks.js').GameState} props.state
 * @param {(e: any) => void} props.onStartGameClick
 */
function PreGame ({ code, state, onStartGameClick }) {
  const url = new URL(
    `/join/${encodeURIComponent(code)}`,
    window.location.origin
  )
  const players = Object.entries(state?.players ?? {})
  const guess = code.split('').map(char => ({
    character: char,
    /** @type {'HIT'} */
    result: 'HIT'
  }))
  return (
    <>
      <h1 className='text-4xl p-4 text-center uppercase font-bold'>
        Join Code:
      </h1>
      <Guess guess={guess} className='mb-3' />
      <QRCode
        className='w-full max-h-52 h-full object-contain'
        value={url.toString()}
      />

      <button
        disabled={players.length === 0}
        className='max-w-96 text-3xl px-6 py-2 font-bold uppercase rounded-full cursor-pointer mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed active:bg-green-500 bg-green-500 hover:bg-green-400 text-white'
        onClick={onStartGameClick}
      >
        Start Game
      </button>

      {players.map(([id, player]) => {
        const guess = player.name.split('').map(char => ({
          character: char,
          /** @type {'UNKNOWN'} */
          result: 'UNKNOWN'
        }))
        return <Guess className='my-2' key={id} guess={guess} />
      })}
    </>
  )
}

/**
 * @param {object} props
 * @param {import('../lib/api-hooks.js').GameState} props.state
 */
function Spectate ({ state }) {
  return (
    <div>
      {state.state === 'FINISHED' && (
        <>
          <p className='font-bold uppercase text-center text-3xl'>Finished!</p>
          <Link className='text-center text-2xl text-blue-500' to='/'>
            Go Back Home
          </Link>
        </>
      )}
      <div className='w-full h-full flex justify-center'>
        {Object.entries(state.players).map(([id, player]) => (
          <Player key={id} player={player} />
        ))}
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {import('../lib/api-hooks.js').Player} props.player
 */
function Player ({ player }) {
  return (
    <div className='p-2 w-auto flex-0'>
      <p className='text-center text-xl font-bold'>{player.name}</p>
      <div className='flex flex-col gap-1'>
        {player.guesses.map((guess, i) => (
          <div key={i} className='flex flex-row gap-1'>
            {guess.map((char, i) => {
              return (
                <div
                  key={i}
                  className={clsx('w-6 h-6 rounded', {
                    'bg-green-500': char.result === 'HIT',
                    'bg-yellow-500': char.result === 'KNOWN',
                    'bg-gray-500': char.result === 'UNKNOWN'
                  })}
                >
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
