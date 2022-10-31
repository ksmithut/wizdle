import clsx from 'clsx'
import React from 'react'

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props.style]
 * @param {object[]} props.guess
 * @param {string?} props.guess[].character
 * @param {'HIT'|'KNOWN'|'UNKNOWN'} props.guess[].result
 */
export default function Guess ({ guess, className, style }) {
  return (
    <div
      className={clsx(
        'h-14 flex gap-1 w-full justify-center sm:gap-2',
        className
      )}
      style={style}
    >
      {guess.map((char, i) => {
        return (
          <div
            key={`${i}:${char.result}:${char.character}`}
            className={clsx(
              'w-14 h-14 flex items-center justify-center text-3xl font-bold rounded text-white',
              {
                ['bg-gray-300']: char.result === 'UNKNOWN' && !char.character,
                ['bg-gray-500']: char.result === 'UNKNOWN' && char.character,
                ['bg-green-500']: char.result === 'HIT',
                ['bg-yellow-500']: char.result === 'KNOWN'
              }
            )}
          >
            {char.character?.toUpperCase()}
          </div>
        )
      })}
    </div>
  )
}
