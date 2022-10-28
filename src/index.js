import cookieParser from 'cookie-parser'
import 'dotenv/config'
import express from 'express'
import events from 'node:events'
import http from 'node:http'
import process from 'node:process'
import { getConfig } from './config.js'
import { configureGameRouter } from './game/express.js'
import { configureGameService } from './game/service.js'
import unlisten from './lib/unlisten.js'

const { port, cookieSecrets } = getConfig(process.env)
const STATIC_DIR = new URL('../public/', import.meta.url)
const INDEX_PATH = new URL('index.html', STATIC_DIR)

const service = configureGameService()
const app = express()
const server = http.createServer(app)

app.disable('x-powered-by')

app.use((req, res, next) => {
  res.once('finish', () => {
    console.log(res.statusCode, req.method, req.originalUrl)
  })
  next()
})
app.use(cookieParser(cookieSecrets))
app.use('/api/games', configureGameRouter(service))
app.use(express.static(STATIC_DIR.pathname))
app.get('/*', (req, res, next) => {
  if (!req.accepts('html')) return next()
  res.sendFile(INDEX_PATH.pathname)
})

await events.once(server.listen(port), 'listening')

const closeServer = unlisten(server)

async function stop () {
  service.stop()
  await closeServer(1000)
}

let called = false
function shutdown () {
  if (called) return
  called = true
  stop().then(() => process.exit()).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
process.once('SIGUSR2', shutdown)
