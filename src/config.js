import { z } from 'zod'

const configSchema = z.object({
  port: z.number(),
  cookieSecrets: z.array(z.string()).min(1)
})

const envSchema = z.object({ PORT: z.string(), COOKIE_SECRETS: z.string() })
  .transform(env =>
    configSchema.parse({
      port: Number.parseInt(env.PORT, 10),
      cookieSecrets: env.COOKIE_SECRETS.trim().split(/\s+/)
    })
  )

/**
 * @param {NodeJS.ProcessEnv} env
 */
export function getConfig (env) {
  return envSchema.parse(env)
}
