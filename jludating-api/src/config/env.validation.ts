type EnvShape = Record<string, string | undefined>

export function validateEnv(config: EnvShape) {
  const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET']
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  // 生产环境强制检查 JWT_SECRET 长度
  if (process.env.NODE_ENV === 'production') {
    const secret = config.JWT_SECRET
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production! Use: openssl rand -base64 32')
    }
    // 禁止使用默认值
    if (secret === 'change-me-in-local-dev' || secret.includes('example') || secret.includes('test')) {
      throw new Error('JWT_SECRET cannot be a placeholder value in production!')
    }
  }

  return config
}
