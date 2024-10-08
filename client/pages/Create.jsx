import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Guess from '../components/Guess.jsx'
import Keyboard, { useKeyboardInput } from '../components/Keyboard.jsx'
import { useCreateGame } from '../lib/api-hooks.js'

/** @type {Record<string, () => string>} */
const ERRORS = {
  INVALID_WORD: () => 'You must choose a valid english word',
  NETWORK_ERROR: () => 'Unexpected Network Error',
}

export default function Create() {
  const navigate = useNavigate()
  const { code } = useParams()
  const [{ loading, error, data }, createGame] = useCreateGame(code)
  const [hideText, setHideText] = React.useState(true)
  const [word, , handleKeyPress] = useKeyboardInput(
    React.useCallback(
      /**
       * @param {string} word
       */
      (word) => {
        if (word.length < 3) return
        createGame(word.toLowerCase())
      },
      [createGame],
    ),
  )
  const handleToggleVisibility = React.useCallback(
    /** @type {React.MouseEventHandler<HTMLButtonElement>} */
    () => setHideText((value) => !value),
    [],
  )
  React.useEffect(() => {
    if (data?.code) navigate(`/game/${encodeURIComponent(data.code)}/manage`)
  }, [data?.code])
  /** @type {{ character: string?, result: 'UNKNOWN' }[]} */
  const guess = React.useMemo(() => {
    const guess = word.split('').map((char) => ({
      character: hideText ? '?' : char,
      /** @type {'UNKNOWN'} */
      result: 'UNKNOWN',
    }))
    if (!guess.length) {
      return [
        {
          character: null,
          /** @type {'UNKNOWN'} */
          result: 'UNKNOWN',
        },
      ]
    }
    return guess
  }, [word, hideText])
  /** @type {string|undefined} */
  // @ts-ignore
  const errorCode = error?.body?.code
  return (
    <div className="h-full w-full flex justify-between items-center flex-col">
      <div className="flex flex-col items-center w-full">
        <>
          <label htmlFor="word" className="text-3xl text-center">
            Choose an english word
            <br />
            with 3 or more letters
          </label>
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1 rounded-full m-2"
          >
            {hideText ? 'Show' : 'Hide'} word
          </button>
          <Guess guess={guess} />
          {errorCode && (
            <p className="text-rose-500 font-bold">
              {ERRORS[errorCode]?.() ?? 'Unexpected error occurred'}
            </p>
          )}
        </>
      </div>

      <Keyboard
        enterLabel="create"
        enterClassName={word.length >= 3 ? 'bg-green-500' : undefined}
        onKeyPress={handleKeyPress}
      />
    </div>
  )
}
