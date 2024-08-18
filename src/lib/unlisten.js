import https from 'https'
import util from 'node:util'

/**
 * @param {import('node:https').Server|import('node:http').Server} server
 */
export default function unlisten(server) {
  /** @type {Map<import('node:net').Socket, number>} */
  const reqsPerSocket = new Map()
  let stopped = false
  let gracefully = true

  /**
   * @param {import('node:net').Socket} socket
   */
  function onConnection(socket) {
    reqsPerSocket.set(socket, 0)
    socket.once('close', () => reqsPerSocket.delete(socket))
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  function onRequest(req, res) {
    reqsPerSocket.set(req.socket, (reqsPerSocket.get(req.socket) ?? 0) + 1)
    res.once('finish', () => {
      const pending = (reqsPerSocket.get(req.socket) ?? 0) - 1
      reqsPerSocket.set(req.socket, pending)
      if (stopped && pending === 0) req.socket.end()
    })
  }

  /**
   * @param {number} requests
   * @param {import('node:net').Socket} socket
   */
  function endIfIdle(requests, socket) {
    if (requests === 0) socket.end()
  }

  function destroyAll() {
    gracefully = false
    reqsPerSocket.forEach((reqs, socket) => socket.end())
    setImmediate(() => {
      reqsPerSocket.forEach((reqs, socket) => socket.destroy())
    })
  }

  server.on(
    server instanceof https.Server ? 'secureConnection' : 'connection',
    onConnection,
  )

  server.on('request', onRequest)

  const closeServer = util.promisify(server.close.bind(server))

  /**
   * @param {number} grace
   */
  async function stop(grace = Infinity) {
    await Promise.resolve()
    stopped = true
    if (grace < Infinity) setTimeout(destroyAll, grace)
    const closeServerPromise = closeServer()
    reqsPerSocket.forEach(endIfIdle)
    await closeServerPromise
    return gracefully
  }

  return stop
}
