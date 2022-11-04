import { z } from 'zod'

const createGameSchema = z.object({ code: z.string() })

/**
 * @param {string} word
 */
export async function createGame (word) {
  const url = new URL('/api/games', window.location.origin)
  url.searchParams.set('word', word)
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'same-origin'
  })
  if (res.ok) {
    return createGameSchema.parse(await res.json())
  }
  throw Object.assign(new Error('Failed to create game'), {
    body: await res.json()
  })
}

/**
 * @param {string} code
 * @param {string} word
 */
export async function createNewGame (code, word) {
  const url = new URL(
    `/api/games/${encodeURIComponent(code)}/new`,
    window.location.origin
  )
  url.searchParams.set('word', word)
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'same-origin'
  })
  if (res.ok) {
    return createGameSchema.parse(await res.json())
  }
  throw Object.assign(new Error('Failed to create game'), {
    body: await res.json()
  })
}

/**
 * @param {string} code
 * @param {string} name
 */
export async function joinGame (code, name) {
  const url = new URL(
    `/api/games/${encodeURIComponent(code)}/player/${encodeURIComponent(name)}`,
    window.origin
  )
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'same-origin'
  })
  if (res.ok) return true
  throw Object.assign(new Error('Failed to join game'), {
    body: await res.json()
  })
}

/**
 * @param {string} code
 */
export async function exists (code) {
  const url = new URL(`/api/games/${encodeURIComponent(code)}`, window.origin)
  const res = await fetch(url.toString(), { credentials: 'same-origin' })
  return res.ok
}

/**
 * @param {string} code
 */
export async function startGame (code) {
  const url = new URL(
    `/api/games/${encodeURIComponent(code)}/start`,
    window.origin
  )
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'same-origin'
  })
  if (res.ok) return true
  throw Object.assign(new Error('Failed to start game'), {
    body: await res.json()
  })
}

/**
 * @param {string} code
 * @param {string} guess
 */
export async function guess (code, guess) {
  const url = new URL(
    `/api/games/${encodeURIComponent(code)}/guess/${encodeURIComponent(guess)}`,
    window.origin
  )
  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'same-origin'
  })
  if (res.ok) return true
  throw Object.assign(new Error('Failed to guess'), { body: await res.json() })
}

/**
 * @param {string} code
 * @param {(data: any) => void} onMessage
 * @param {object} [params]
 * @param {(error: Event) => void} [params.onError]
 * @param {() => void} [params.onFinish]
 * @param {(code: string) => void} [params.onNewGame]
 */
export function listen (
  code,
  onMessage,
  // @ts-ignore
  { onError = () => {}, onFinish = () => {}, onNewGame = () => {} } = {}
) {
  const url = new URL(
    `/api/games/${encodeURIComponent(code)}/events`,
    window.origin
  )
  const eventSource = new EventSource(url.toString(), { withCredentials: true })
  function close () {
    eventSource.removeEventListener('new', handleNewGame)
    eventSource.removeEventListener('update', handleMessage)
    eventSource.removeEventListener('error', handleError)
    eventSource.close()
  }
  /**
   * @param {MessageEvent<string>} event
   */
  function handleMessage (event) {
    const data = JSON.parse(event.data)
    onMessage(data)
  }
  /**
   * @param {MessageEvent<string>} event
   */
  function handleNewGame (event) {
    onNewGame(event.data)
  }
  /**
   * @param {Event} event
   */
  function handleError (event) {
    onError(event)
  }
  eventSource.addEventListener('new', handleNewGame)
  eventSource.addEventListener('update', handleMessage)
  eventSource.addEventListener('error', handleError)

  return close
}
