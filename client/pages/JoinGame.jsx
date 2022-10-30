import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Guess from '../components/Guess.jsx'
import Keyboard, { useKeyboardInput } from '../components/Keyboard.jsx'
import { useJoinGame } from '../lib/api-hooks.js'

export default function JoinGame () {
  /** @type {{ code: string }} */
  // @ts-ignore
  const { code } = useParams()
  const navigate = useNavigate()
  const [{ loading, error, data }, joinGame] = useJoinGame()
  const [name, , handleKeyPress] = useKeyboardInput(React.useCallback(
    /**
     * @param {string} name
     */
    (name) => joinGame(code, name),
    [code, joinGame]
  ))
  React.useEffect(() => {
    if (data === true) navigate(`/game/${code}`)
  }, [data, code])
  const codeGuess = code.split('').map(char => ({
    character: char,
    /** @type {'HIT'} */
    result: 'HIT'
  }))
  /** @type {{ character: string?, result: 'UNKNOWN' }[]} */
  const nameGuess = name.split('').map(char => ({
    character: char,
    /** @type {'UNKNOWN'} */
    result: 'UNKNOWN'
  }))
  if (nameGuess.length === 0) {
    nameGuess.push({ character: null, result: 'UNKNOWN' })
  }
  return (
    <div className='h-full w-full flex justify-between items-center flex-col p-4'>
      <div className='w-full flex flex-col'>
        <label className='text-4xl text-center mb-4 uppercase font-bold'>
          Join Code:
        </label>
        <Guess guess={codeGuess} />
        <label className='text-4xl text-center my-4 uppercase font-bold'>
          Enter Player Name:
        </label>
        <Guess guess={nameGuess} />
      </div>
      <Keyboard
        onKeyPress={handleKeyPress}
        enterLabel='join'
        enterClassName={name.length
          ? 'bg-green-500'
          : undefined}
      />
    </div>
  )
}
