import React from 'react'

/**
 * @template {function} TFunction
 * @template TContext
 * @param {TFunction} func
 * @param {TContext} [context]
 * @return {[{ loading: boolean, error: unknown, data: Awaited<ReturnType<func>>?}, (...args: Parameters<TFunction>) => Promise<{ status: 'fulfilled', value: Awaited<ReturnType<func>> } | { status: 'rejected', reason: unknown }>]}
 */
export function useLazyPromise(func, context) {
  const [state, setState] = React.useState(
    /**
     * @returns {{ loading: boolean, error: unknown, data: Awaited<ReturnType<func>>?}}
     */
    () => ({ loading: false, error: null, data: null }),
  )
  const lazy = React.useCallback(
    /**
     * @param {Parameters<TFunction>} args
     * @returns {Promise<{ status: 'fulfilled', value: Awaited<ReturnType<func>> } | { status: 'rejected', reason: unknown }>}
     */
    (...args) => {
      setState((state) => ({ ...state, loading: true, error: null }))
      return Promise.resolve()
        .then(() => func.apply(context, args))
        .then(
          /**
           * @returns {{ status: 'fulfilled', value: Awaited<ReturnType<func>> }}
           */
          (data) => {
            setState((state) => ({ ...state, loading: false, data }))
            return { status: 'fulfilled', value: data }
          },
        )
        .catch(
          /**
           * @returns {{ status: 'rejected', reason: unknown }}
           */
          (error) => {
            setState((state) => ({ ...state, loading: false, error }))
            return { status: 'rejected', reason: error }
          },
        )
    },
    [func, context],
  )
  return [state, lazy]
}
