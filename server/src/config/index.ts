// ======================================================
// GEOBOARD — CENTRALIZED CONFIGURATION (FIXED)
// ======================================================

import dotenv from 'dotenv'
dotenv.config()

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback

  if (!value || value.trim() === '') {
    return ''
  }

  return value
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const isInvalid = (value?: string) =>
  !value ||
  value.trim() === '' ||
  value.includes('your-') ||
  value.includes('change-in-production') ||
  value === 'changeme' ||
  value === 'xxx'

// ──────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────

export const config = {
  server: {
    port: toNumber(process.env.PORT, 3001),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },

  database: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/geoboard',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  apis: {
    webzApiKey: process.env.WEBZ_API_KEY ?? '',
  },

  cache: {
    ttlWeather: toNumber(process.env.CACHE_TTL_WEATHER, 600),
    ttlNews: toNumber(process.env.CACHE_TTL_NEWS, 300),
    ttlCurrency: toNumber(process.env.CACHE_TTL_CURRENCY, 60),
    ttlLocation: toNumber(process.env.CACHE_TTL_LOCATION, 3600),
  },

  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  },

  session: {
    secret: process.env.SESSION_SECRET ?? '',
  },
} as const

export type Config = typeof config

// ──────────────────────────────────────────────────────
// VALIDATION
// ──────────────────────────────────────────────────────

export function validateConfig(): void {
  const missing: string[] = []

  const check = (key: string, value: string) => {
    if (isInvalid(value)) missing.push(key)
  }

  // Always required in ALL environments (not just production)
  check('JWT_SECRET', config.jwt.secret)
  check('SESSION_SECRET', config.session.secret)

  // Only warn (not block) for optional services
  if (isInvalid(config.apis.webzApiKey)) {
    console.warn('⚠️ WEBZ_API_KEY is missing (news may not work)')
  }

  if (missing.length > 0) {
    const message =
      `❌ Invalid or missing environment variables:\n` +
      missing.map((m) => `  - ${m}`).join('\n')

    throw new Error(message)
  }
}
