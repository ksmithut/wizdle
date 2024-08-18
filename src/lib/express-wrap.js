/**
 * @param  {...import('express').RequestHandler} middlewares
 * @returns {import('express').RequestHandler[]}
 */
export default function wrap(...middlewares) {
  return middlewares.map(
    (middleware) => (req, res, next) =>
      Promise.resolve()
        .then(() => middleware(req, res, next))
        .catch(next),
  )
}
