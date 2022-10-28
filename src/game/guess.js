/** @typedef {'UNKNOWN'|'KNOWN'|'HIT'} ResultType */

/**
 * @typedef {object} CharacterResult
 * @property {string} character
 * @property {ResultType} result
 */

/** @typedef {CharacterResult[]} Result */

const RESULTS = {
  /** @type {'UNKNOWN'} */
  UNKNOWN: 'UNKNOWN',
  /** @type {'KNOWN'} */
  KNOWN: 'KNOWN',
  /** @type {'HIT'} */
  HIT: 'HIT'
}

/**
 * @param {string} word
 * @param {string} guess
 */
export default function guess (word, guess) {
  if (typeof word !== 'string') throw new TypeError('word must be a string')
  if (typeof guess !== 'string') throw new TypeError('guess must be a string')
  if (word.length === 0) {
    throw new RangeError('word must have a length greater than 0')
  }
  if (word.length !== guess.length) {
    throw new RangeError('word and guess must have the same length')
  }
  const charIndexMap = word.split('').reduce(
    /**
     * @param {Map<string, Set<number>>} map
     * @param {string} char
     * @param {number} index
     */
    (map, char, index) =>
      map.set(char, (map.get(char) ?? new Set()).add(index)),
    new Map()
  )
  /** @type {Result} */
  const result = guess
    .split('')
    .map(
      /** @returns {CharacterResult} */
      char => ({ character: char, result: RESULTS.UNKNOWN })
    )
    .map(
      /** @returns {CharacterResult} */
      (result, index) => {
        const characterSet = charIndexMap.get(result.character)
        if (characterSet && characterSet.has(index)) {
          characterSet.delete(index)
          return { ...result, result: RESULTS.HIT }
        }
        return result
      }
    )
    .map(
      /** @returns {CharacterResult} */
      result => {
        if (result.result !== 'UNKNOWN') return result
        const characterSet = charIndexMap.get(result.character)
        if (characterSet && characterSet.size > 0) {
          const firstValue = Array.from(characterSet.values())[0]
          characterSet.delete(firstValue)
          return { ...result, result: RESULTS.KNOWN }
        }
        return result
      }
    )
  const match = result.every(result => result.result === RESULTS.HIT)
  return { match, result }
}
