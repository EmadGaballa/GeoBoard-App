// ======================================================
// GEOBOARD — CENTRALIZED CONFIGURATION
// All environment variables validated and exported here
// ======================================================

import dotenv from 'dotenv'
dotenv.config()

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/geoboard',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  },

  apis: {
    webzApiKey: process.env.WEBZ_API_KEY || '',
  },

  cache: {
    ttlWeather: parseInt(process.env.CACHE_TTL_WEATHER || '600', 10),
    ttlNews: parseInt(process.env.CACHE_TTL_NEWS || '300', 10),
    ttlCurrency: parseInt(process.env.CACHE_TTL_CURRENCY || '60', 10),
    ttlLocation: parseInt(process.env.CACHE_TTL_LOCATION || '3600', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
  },
} as const

export type Config = typeof config

// Validate required config in production
export function validateConfig(): void {
  const missing: string[] = []

  if (config.server.nodeEnv === 'production') {
    if (!config.jwt.secret || config.jwt.secret === 'dev-secret-change-in-production') {
      missing.push('JWT_SECRET')
    }
    if (!config.google.clientId) missing.push('GOOGLE_CLIENT_ID')
    if (!config.google.clientSecret) missing.push('GOOGLE_CLIENT_SECRET')
    if (!config.apis.webzApiKey) missing.push('WEBZ_API_KEY')
  }

  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`)
  }
}