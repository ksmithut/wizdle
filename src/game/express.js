import express from 'express'
import { randomUUID } from 'node:crypto'
import wrap from '../lib/express-wrap.js'
import { renderEvent } from '../lib/sse.js'
import { GameError } from './state.js'

const COOKIE_AGE_MS = 1000 * 60 * 60 * 1 // 2 hours

/**
 * @param {import('./service.js').GameService} service
 */
export function configureGameRouter (service) {
  const router = express.Router()

  /**
   * @param {import('express').Request} req
   */
  function getPlayerId (req) {
    let playerId = req.signedCookies.player_id
    if (!playerId) playerId = randomUUID()
    req.res?.cookie('player_id', playerId, {
      httpOnly: true,
      sameSite: 'lax',
      signed: true,
      maxAge: COOKIE_AGE_MS
    })
    return playerId
  }

  router.post(
    '/',
    wrap(async (req, res) => {
      let word = req.query.word
      if (typeof word !== 'string') {
        return res.sendStatus(400).json({ error: 'Invalid word' })
      }
      const code = service.createGame(word)
      res.cookie(`creator:${code}`, `${code}:${randomUUID()}`, {
        httpOnly: true,
        sameSite: 'lax',
        signed: true,
        maxAge: COOKIE_AGE_MS
      })
      res.status(201).json({ code })
    })
  )

  router.get(
    '/:code',
    wrap(async (req, res, next) => {
      if (service.hasGame(req.params.code)) res.sendStatus(200)
      else res.sendStatus(404)
    })
  )

  router.post(
    '/:code/player/:name',
    wrap(async (req, res, next) => {
      const playerId = getPlayerId(req)
      service.joinGame(req.params.code, playerId, req.params.name)
      res.json({})
    })
  )

  router.post(
    '/:code/start',
    wrap(async (req, res, next) => {
      const ownerCookie = req.signedCookies[`creator:${req.params.code}`]
      if (!ownerCookie || !ownerCookie.startsWith(req.params.code + ':')) {
        res.status(401).json({
          error: 'You are not the creator of this game',
          code: 'UNAUTHORIZED'
        })
        return
      }
      service.startGame(req.params.code)
      res.clearCookie(`creator:${req.params.code}`)
      res.json({})
    })
  )

  router.post(
    '/:code/guess/:guess',
    wrap(async (req, res, next) => {
      const playerId = getPlayerId(req)
      service.guess(req.params.code, playerId, req.params.guess)
      res.json({})
    })
  )

  router.get(
    '/:code/events',
    wrap(async (req, res, next) => {
      const playerId = getPlayerId(req)
      if (!service.hasGame(req.params.code)) {
        return res.sendStatus(404)
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
      })
      res.write('\n')

      const unsubscribe = service.subscribe(req.params.code, (game) => {
        // console.log(cleanState(game, playerId))
        res.write(renderEvent({
          event: 'update',
          data: JSON.stringify(cleanState(game, playerId))
        }))
        if (game.state === 'FINISHED') {
          res.write(renderEvent({ event: 'done', data: JSON.stringify(game) }))
          res.end()
        }
      }, () => {
        res.end()
      })
      const interval = setInterval(() => {
        res.write(renderEvent({ comment: 'keepalive' }))
      }, 15000)
      req.on('close', () => {
        unsubscribe()
        clearInterval(interval)
      })
    })
  )

  router.use(
    /** @type {import('express').ErrorRequestHandler} */
    (error, req, res, next) => {
      if (error instanceof GameError) {
        res.status(400).json({ error: error.message, code: error.code })
        return
      }
      console.error(error)
      res.status(500).json({
        error: 'Unhandled Server Error',
        code: 'UNHANDLED_SERVER_ERROR'
      })
    }
  )

  return router
}

/**
 * @param {import('./state.js').GameState} game
 * @param {string} [playerId]
 */
function cleanState (game, playerId) {
  const players = Array.from(game.players.entries()).reduce(
    /**
     * @param {Record<string, import('./state.js').Player & { me: boolean }>} newMap
     */
    (newMap, [id, player]) => {
      if (id === playerId) newMap[id] = { ...player, me: true }
      else {
        newMap[id] = {
          ...player,
          me: false,
          guesses: player.guesses.map(guess => {
            return guess.map(char => ({ ...char, character: '' }))
          })
        }
      }
      return newMap
    },
    {}
  )
  return { state: game.state, length: game.word.length, players }
}
