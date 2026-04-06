type EnvShape = Record<string, string | undefined>

export function validateEnv(config: EnvShape) {
  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET']
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  return config
}
