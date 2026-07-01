// ======================================================
// GEOBOARD — CENTRALIZED CONFIGURATION
// Single source of truth for all environment variables
// ======================================================

import dotenv from 'dotenv'
dotenv.config()

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

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
// Redis URL Parsing (Railway-safe, no string hacks)
// ──────────────────────────────────────────────────────

interface RedisParsed {
  host: string
  port: number
  password: string | undefined
}

function parseRedisUrl(rawUrl: string): RedisParsed {
  // Railway provides URLs like:
  //   redis://default:password@host:port
  //   redis://:password@host:port
  //   redis://host:port
  // The user "default" is a Redis username, NOT a hostname.

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error(
      `❌ Invalid REDIS_URL: cannot parse "${rawUrl}". Expected format: redis://host:port`,
    )
  }

  // If the hostname itself is "default", "localhost", or empty — it's wrong.
  // Railway uses "default" as username, not host. This catches misparsing.
  const hostname = url.hostname

  if (!hostname || hostname === 'default' || hostname === '') {
    throw new Error(
      `❌ Invalid REDIS_URL: hostname resolved to "${hostname}". ` +
      `Check that "${rawUrl}" contains a valid Redis host after the @ symbol. ` +
      `Example: redis://default:password@actual-host:6379`,
    )
  }

  return {
    host: hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
  }
}

// ──────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────

const rawRedisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
const parsedRedis = parseRedisUrl(rawRedisUrl)

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
    /** Raw REDIS_URL string (for logging / reference) */
    url: rawRedisUrl,
    /** Explicit password override (if set via REDIS_PASSWORD separately) */
    password: process.env.REDIS_PASSWORD || undefined,
    /** ✅ Safe parsed connection — single source of truth for all Redis clients */
    parsed: parsedRedis,
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

// ──────────────────────────────────────────────────────
// Startup health log: print Redis config (safe debug)
// ──────────────────────────────────────────────────────

export function logRedisConfig(): void {
  const p = config.redis.parsed
  console.log(`[Config] Redis → host=${p.host}:${p.port} password=${p.password ? '✓ set' : 'none'}`)
}
