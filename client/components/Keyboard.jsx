import clsx from 'clsx'
import React from 'react'

const row1 = 'QWERTYUIOP'.split('')
const row2 = 'ASDFGHJKL'.split('')
const row3 = 'ZXCVBNM'.split('')

const defaultOnEnter = () => {}
/** @param {string} value */
const defaultOnChange = (value) => value

/**
 * @param {(word: string) => void} [onEnter]
 * @param {(word: string) => string} [onChange]
 * @returns {[string, () => void, (value: string) => void]}
 */
export function useKeyboardInput(
  onEnter = defaultOnEnter,
  onChange = defaultOnChange,
  initialValue = '',
) {
  const [word, setWord] = React.useState(initialValue)
  const handleKeyPress = React.useCallback(
    /**
     * @param {string} value
     */
    (value) => {
      switch (value) {
        case 'enter':
          onEnter(word)
          break
        case 'backspace':
          setWord((word) => onChange(word.slice(0, -1)))
          break
        default:
          setWord((word) => onChange(word + value))
          break
      }
    },
    [word, onEnter, onChange],
  )
  const resetWord = React.useCallback(() => {
    setWord('')
  }, [])
  return [word, resetWord, handleKeyPress]
}

/**
 * @param {object} params
 * @param {(key: string) => void} params.onKeyPress
 * @param {string} [params.enterLabel]
 * @param {string} [params.enterClassName]
 * @param {string[]} [params.hits]
 * @param {string[]} [params.misses]
 * @param {string[]} [params.knowns]
 */
export default function Keyboard({
  onKeyPress,
  enterLabel = 'enter',
  enterClassName,
  hits = [],
  misses = [],
  knowns = [],
}) {
  const handleKeyPress = React.useCallback(
    /** @type {React.MouseEventHandler<HTMLButtonElement>} */
    (e) => {
      const value = e.currentTarget.dataset.value
      if (typeof value === 'string') onKeyPress(value)
    },
    [onKeyPress],
  )
  React.useEffect(() => {
    /** @param {KeyboardEvent} e */
    function handleKeyPress(e) {
      if (/^[a-z]$/i.test(e.key)) onKeyPress(e.key.toUpperCase())
      else if (e.key === 'Enter') onKeyPress('enter')
    }
    /** @param {KeyboardEvent} e */
    function handleKeyUp(e) {
      if (e.key === 'Backspace') onKeyPress('backspace')
    }
    window.addEventListener('keypress', handleKeyPress)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onKeyPress])
  const hitSet = new Set(hits)
  const missSet = new Set(misses)
  const knownSet = new Set(knowns)
  return (
    <div className="w-full text-white text-xs sm:text-base">
      <div className="w-full flex gap-1 mb-1">
        {row1.map((char) => (
          <CharacterButton
            key={char}
            hitSet={hitSet}
            knownSet={knownSet}
            missSet={missSet}
            char={char}
            onClick={handleKeyPress}
          />
        ))}
      </div>
      <div className="w-full flex gap-1 mb-1">
        <div className="h-12" style={{ flex: 0.375 }} />
        {row2.map((char) => (
          <CharacterButton
            key={char}
            hitSet={hitSet}
            knownSet={knownSet}
            missSet={missSet}
            char={char}
            onClick={handleKeyPress}
          />
        ))}
        <div className="h-12" style={{ flex: 0.375 }} />
      </div>
      <div className="w-full flex gap-1 mb-1">
        <button
          data-value="enter"
          className={clsx(
            'h-12 bg-gray-500 rounded font-light sm:font-bold md:text-xl uppercase',
            enterClassName,
          )}
          style={{ flex: 1.5 }}
          onClick={handleKeyPress}
        >
          {enterLabel}
        </button>
        {row3.map((char) => (
          <CharacterButton
            key={char}
            hitSet={hitSet}
            knownSet={knownSet}
            missSet={missSet}
            char={char}
            onClick={handleKeyPress}
          />
        ))}
        <button
          data-value="backspace"
          className="h-12 bg-gray-500 rounded flex items-center justify-center"
          style={{ flex: 1.5 }}
          onClick={handleKeyPress}
        >
          <Backspace />
        </button>
      </div>
    </div>
  )
}

function Backspace() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
      />
    </svg>
  )
}

/**
 * @param {object} props
 * @param {Set<string>} props.hitSet
 * @param {Set<string>} props.knownSet
 * @param {Set<string>} props.missSet
 * @param {string} props.char
 * @param {React.MouseEventHandler<HTMLButtonElement>} props.onClick
 */
function CharacterButton({ hitSet, knownSet, missSet, char, onClick }) {
  return (
    <button
      data-value={char}
      className={clsx(
        'h-12 flex-1 rounded font-bold md:text-xl',
        hitSet.has(char)
          ? 'bg-green-500'
          : knownSet.has(char)
            ? 'bg-yellow-500'
            : missSet.has(char)
              ? 'bg-gray-800'
              : 'bg-gray-500',
      )}
      onClick={onClick}
    >
      {char}
    </button>
  )
}
