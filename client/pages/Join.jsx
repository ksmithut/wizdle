import React from 'react'
import { useNavigate } from 'react-router-dom'
import Guess from '../components/Guess.jsx'
import Keyboard, { useKeyboardInput } from '../components/Keyboard.jsx'
import { useExists } from '../lib/api-hooks.js'

export default function Join () {
  const navigate = useNavigate()
  const [{ loading, error, data }, exists] = useExists()
  const [code, , handleKeyPress] = useKeyboardInput(
    React.useCallback(
      /** @param {string} word */
      word => {
        word.length === 4 && exists(word)
      },
      [exists]
    ),
    React.useCallback(
      /** @param {string} word */
      word => word.slice(0, 4),
      []
    )
  )
  React.useEffect(() => {
    if (data) navigate(`/join/${code}`)
  }, [data, code])
  const guess = React.useMemo(() => {
    return new Array(4).fill(null).map((_, i) => {
      return {
        character: code[i] ?? null,
        /** @type {'UNKNOWN'} */
        result: 'UNKNOWN'
      }
    })
  }, [code])
  return (
    <div className='h-full w-full flex justify-between items-center flex-col p-4'>
      <div className='w-full flex items-center flex-col'>
        <label
          htmlFor='code'
          className='text-4xl text-center mb-4 font-bold uppercase'
        >
          Enter Join Code:
        </label>
        <Guess guess={guess} />
        {data === false && <p>That game does not exist</p>}
      </div>
      <Keyboard
        onKeyPress={handleKeyPress}
        enterLabel='join'
        enterClassName={code.length === 4
          ? 'bg-green-500'
          : undefined}
      />
    </div>
  )
}
