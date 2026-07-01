// ======================================================
// GEOBOARD — REDIS CACHE SERVICE
// Centralized caching for all external API responses
// ======================================================

import Redis from 'ioredis'
import { config } from '../config/index.js'

class CacheService {
  private client: Redis
  private isConnected = false
  private fallbackMode = false

  constructor() {
    // Use centralized parsed Redis config (single source of truth)
    const { host, port, password } = config.redis.parsed
    this.client = new Redis({
      host,
      port,
      password: config.redis.password || password,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
    })

    this.client.on('connect', () => {
      this.isConnected = true
      this.fallbackMode = false
      console.log('[Cache] Redis connected')
    })

    this.client.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message)
      this.fallbackMode = true
    })

    this.client.on('close', () => {
      this.isConnected = false
      this.fallbackMode = true
    })

    // Attempt initial connection (non-blocking)
    this.client.connect().catch((err) => {
      console.warn('[Cache] Redis connection failed, running in fallback mode:', err.message)
      this.fallbackMode = true
    })
  }

  // ── Core get/set ─────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    if (this.fallbackMode) return null

    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (err) {
      console.warn(`[Cache] Get error for key "${key}":`, err)
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.fallbackMode) return

    try {
      const serialized = JSON.stringify(value)
      await this.client.setex(key, ttlSeconds, serialized)
    } catch (err) {
      console.warn(`[Cache] Set error for key "${key}":`, err)
    }
  }

  async del(key: string): Promise<void> {
    if (this.fallbackMode) return

    try {
      await this.client.del(key)
    } catch (err) {
      console.warn(`[Cache] Delete error for key "${key}":`, err)
    }
  }

  // ── Cache-aside helper ───────────────────────────────

  /**
   * Cache-aside pattern:
   * 1. Check cache → hit? return
   * 2. Fetch from origin
   * 3. Store in cache
   * 4. Return
   */
  async getOrFetch<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>,
  ): Promise<{ data: T; cached: boolean }> {

    const cached = await this.get<T>(key)
    if (cached !== null) {
      return { data: cached, cached: true }
    }

    const data = await fetchFn()

    this.set(key, data, ttlSeconds).catch(() => {})

    return { data, cached: false }
  }

  // ── Cache key builders ───────────────────────────────

  static weatherKey(city: string): string {
    return `weather:${city.toLowerCase()}`
  }

  static weatherCoordKey(lat: number, lng: number): string {
    return `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`
  }

  static newsKey(city: string, category: string): string {
    return `news:${city.toLowerCase()}:${category}`
  }

  static currencyKey(base: string): string {
    return `currency:${base.toLowerCase()}`
  }

  static locationKey(userId: string): string {
    return `location:${userId}`
  }

  static dashboardKey(userId: string): string {
    return `dashboard:${userId}`
  }

  // ── Health check ─────────────────────────────────────

  async health(): Promise<{ connected: boolean; fallbackMode: boolean }> {
    if (this.fallbackMode) {
      return { connected: false, fallbackMode: true }
    }

    try {
      await this.client.ping()
      return { connected: true, fallbackMode: false }
    } catch {
      return { connected: false, fallbackMode: true }
    }
  }

  // ── Cleanup ──────────────────────────────────────────

  async disconnect(): Promise<void> {
    try {
      await this.client.quit()
    } catch {
      // Ignore
    }
  }
}

// Singleton
let cacheInstance: CacheService

export function getCache(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService()
  }
  return cacheInstance
}

export { CacheService }