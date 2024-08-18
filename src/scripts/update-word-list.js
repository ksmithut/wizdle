import fs from 'fs/promises'

const MIN_WORD_LENGTH = 3

const source =
  'https://raw.githubusercontent.com/lorenbrichter/Words/master/Words/en.txt'
const badWordsSource =
  'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/list.txt'

const data = await (await fetch(source)).text()
const badWordsData = await (await fetch(badWordsSource)).text()

const badWordsSet = new Set(badWordsData.trim().split(/\r?\n/))

const words = data
  .trim()
  .split(/\r?\n/)
  .filter((word) => {
    if (word.length < MIN_WORD_LENGTH) return false
    if (badWordsSet.has(word)) return false
    if (!word.match(/^[a-z]+$/)) return false
    return true
  })
  .join('\n')

await fs.writeFile(new URL('../game/words.txt', import.meta.url), words)
