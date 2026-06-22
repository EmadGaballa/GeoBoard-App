// ======================================================
// GEOBOARD — PRODUCTION-GRADE BACKEND SERVER
// Enterprise-level architecture with modular services
// ======================================================

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config, validateConfig } from './config/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { getCache } from './cache/index.js'
import { jobService } from './jobs/job.service.js'
import { analyticsService } from './analytics/analytics.service.js'

// ── Route Imports ──────────────────────────────────────
import authRoutes from './auth/auth.routes.js'
import locationRoutes from './locations/location.routes.js'
import weatherRoutes from './weather/weather.routes.js'
import newsRoutes from './news/news.routes.js'
import currencyRoutes from './currency/currency.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import analyticsRoutes from './analytics/analytics.routes.js'

// ── Validate Environment ──────────────────────────────
validateConfig()

// ── Initialize Express ─────────────────────────────────
const app = express()

// ── Security Middleware ────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(cookieParser())
app.use(express.json({ limit: '10kb' })) // Body size limit

// ── Rate Limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
})

app.use('/api', limiter)

// ── Request Timing & Analytics Middleware ──────────────
app.use((req, _res, next) => {
  const start = Date.now()
  const originalEnd = _res.end
  _res.end = function (...args: Parameters<typeof originalEnd>) {
    const duration = Date.now() - start
    // Track API usage for authenticated users
    if (req.user?.id && req.path.startsWith('/api/')) {
      const eventName = req.path.replace('/api/', '').split('/')[0]
      analyticsService.track(req.user.id, `${eventName}_request`, {
        method: req.method,
        path: req.path,
        duration,
        status: _res.statusCode,
      }).catch(() => {})
    }
    return originalEnd.apply(this, args)
  } as typeof originalEnd
  next()
})

// ── Health Check ──────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const cacheHealth = await getCache().health()
  const jobsHealth = await jobService.health().catch(() => null)

  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      cache: cacheHealth,
      jobs: jobsHealth,
    },
  })
})

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/currency', currencyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/analytics', analyticsRoutes)

// ── Error Handling ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Initialize background jobs (non-blocking)
    jobService.initialize().catch((err) => {
      console.warn('[Server] Background jobs initialization failed:', err.message)
    })

    // Schedule recurring jobs
    setTimeout(() => {
      jobService.scheduleAll().catch((err) => {
        console.warn('[Server] Job scheduling failed:', err.message)
      })
    }, 5000)

    // Start Express
    app.listen(config.server.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║                   GEOBOARD SERVER                     ║
║──────────────────────────────────────────────────────║
║  Status:  🟢 Running                                 ║
║  Port:    ${String(config.server.port).padEnd(42)}║
║  Env:     ${config.server.nodeEnv.padEnd(42)}║
║  Frontend: ${config.server.frontendUrl.padEnd(36)}║
║  Cache:   ${config.redis.url.padEnd(39)}║
╚══════════════════════════════════════════════════════╝
      `)
    })
  } catch (err) {
    console.error('[Server] Failed to start:', err)
    process.exit(1)
  }
}

// ── Graceful Shutdown ────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...')
  await jobService.close().catch(() => {})
  await getCache().disconnect().catch(() => {})
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...')
  await jobService.close().catch(() => {})
  await getCache().disconnect().catch(() => {})
  process.exit(0)
})

startServer()

export default app