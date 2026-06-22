// ======================================================
// GEOBOARD — BACKGROUND JOB SYSTEM (BullMQ)
// Redis-backed queue for cache warming and data refresh
// ======================================================

import { Queue, Worker, Job } from 'bullmq'
import { config } from '../config/index.js'
import { weatherService } from '../weather/weather.service.js'
import { newsService } from '../news/news.service.js'
import { currencyService } from '../currency/currency.service.js'
import { getCache } from '../cache/index.js'

// ── Queue Names ────────────────────────────────────────

const QUEUES = {
  WEATHER_REFRESH: 'weather-refresh',
  CURRENCY_REFRESH: 'currency-refresh',
  NEWS_PREFETCH: 'news-prefetch',
} as const

// ── Priority Cities for Prefetching ───────────────────

const PRIORITY_CITIES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'New York',      lat: 40.7128,  lng: -74.0060 },
  { name: 'London',        lat: 51.5074,  lng: -0.1278 },
  { name: 'Tokyo',         lat: 35.6762,  lng: 139.6503 },
  { name: 'Cairo',         lat: 30.0444,  lng: 31.2357 },
  { name: 'Dubai',         lat: 25.2048,  lng: 55.2708 },
  { name: 'Sydney',        lat: -33.8688, lng: 151.2093 },
  { name: 'Paris',         lat: 48.8566,  lng: 2.3522 },
  { name: 'Singapore',     lat: 1.3521,   lng: 103.8198 },
  { name: 'Mumbai',        lat: 19.0760,  lng: 72.8777 },
  { name: 'São Paulo',     lat: -23.5505, lng: -46.6333 },
]

export class JobService {
  private weatherQueue: Queue
  private currencyQueue: Queue
  private newsQueue: Queue
  private initialized = false

  constructor() {
    const connection = {
      host: config.redis.url.replace('redis://', '').split(':')[0],
      port: parseInt(config.redis.url.split(':').pop() || '6379', 10),
      password: config.redis.password || undefined,
      maxRetriesPerRequest: null,
    }

    this.weatherQueue = new Queue(QUEUES.WEATHER_REFRESH, { connection })
    this.currencyQueue = new Queue(QUEUES.CURRENCY_REFRESH, { connection })
    this.newsQueue = new Queue(QUEUES.NEWS_PREFETCH, { connection })
  }

  // ── Initialize Workers ────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const connection = {
      host: config.redis.url.replace('redis://', '').split(':')[0],
      port: parseInt(config.redis.url.split(':').pop() || '6379', 10),
      password: config.redis.password || undefined,
      maxRetriesPerRequest: null,
    }

    // ── Weather Refresh Worker ─────────────────────────
    new Worker(
      QUEUES.WEATHER_REFRESH,
      async (job: Job) => {
        const { lat, lng, city } = job.data as { lat: number; lng: number; city: string }
        console.log(`[Job] Refreshing weather for ${city}...`)
        try {
          const weather = await weatherService.getCurrentWeather(lat, lng)
          const forecast = await weatherService.get7DayForecast(lat, lng)
          const cache = getCache()
          await cache.set(`weather:${city.toLowerCase()}`, weather, config.cache.ttlWeather)
          await cache.set(`weather:${lat.toFixed(2)}:${lng.toFixed(2)}:forecast`, forecast, config.cache.ttlWeather)
          console.log(`[Job] Weather refreshed for ${city}`)
        } catch (err) {
          console.error(`[Job] Weather refresh failed for ${city}:`, err)
        }
      },
      { connection, concurrency: 2 },
    )

    // ── Currency Refresh Worker ────────────────────────
    new Worker(
      QUEUES.CURRENCY_REFRESH,
      async (job: Job) => {
        const { base } = job.data as { base: string }
        console.log(`[Job] Refreshing currency rates for ${base}...`)
        try {
          const rates = await currencyService.getRates(base)
          const cache = getCache()
          await cache.set(`currency:${base.toLowerCase()}`, rates, config.cache.ttlCurrency)
          console.log(`[Job] Currency rates refreshed for ${base}`)
        } catch (err) {
          console.error(`[Job] Currency refresh failed for ${base}:`, err)
        }
      },
      { connection, concurrency: 1 },
    )

    // ── News Prefetch Worker ───────────────────────────
    new Worker(
      QUEUES.NEWS_PREFETCH,
      async (job: Job) => {
        const { category } = job.data as { category: string }
        console.log(`[Job] Prefetching news for category: ${category}...`)
        try {
          const news = await newsService.getNews(category, 12)
          const cache = getCache()
          await cache.set(`news:global:${category}`, news, config.cache.ttlNews)
          console.log(`[Job] News prefetched for ${category}`)
        } catch (err) {
          console.error(`[Job] News prefetch failed for ${category}:`, err)
        }
      },
      { connection, concurrency: 3 },
    )

    console.log('[Jobs] Background workers initialized')
  }

  // ── Schedule Jobs ─────────────────────────────────

  async scheduleAll(): Promise<void> {
    // Clear existing repeatable jobs
    await Promise.all([
      this.weatherQueue.obliterate({ force: true }).catch(() => {}),
      this.currencyQueue.obliterate({ force: true }).catch(() => {}),
      this.newsQueue.obliterate({ force: true }).catch(() => {}),
    ])

    // Weather refresh for priority cities every 10 minutes
    for (const city of PRIORITY_CITIES) {
      await this.weatherQueue.add(
        `weather-refresh-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        { lat: city.lat, lng: city.lng, city: city.name },
        {
          repeat: { every: 10 * 60 * 1000 }, // 10 min
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      )
    }

    // Currency refresh every 5 minutes
    await this.currencyQueue.add(
      'currency-refresh-usd',
      { base: 'USD' },
      {
        repeat: { every: 5 * 60 * 1000 }, // 5 min
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      },
    )

    // News prefetch for top categories every 15 minutes
    const categories = ['technology', 'business', 'world', 'sports', 'health']
    for (const category of categories) {
      await this.newsQueue.add(
        `news-prefetch-${category}`,
        { category },
        {
          repeat: { every: 15 * 60 * 1000 }, // 15 min
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        },
      )
    }

    console.log('[Jobs] All recurring jobs scheduled')
  }

  // ── Health ─────────────────────────────────────────

  async health(): Promise<{
    weatherQueue: { waiting: number; active: number }
    currencyQueue: { waiting: number; active: number }
    newsQueue: { waiting: number; active: number }
  }> {
    const [wWaiting, wActive] = await Promise.all([
      this.weatherQueue.getWaitingCount(),
      this.weatherQueue.getActiveCount(),
    ])

    const [cWaiting, cActive] = await Promise.all([
      this.currencyQueue.getWaitingCount(),
      this.currencyQueue.getActiveCount(),
    ])

    const [nWaiting, nActive] = await Promise.all([
      this.newsQueue.getWaitingCount(),
      this.newsQueue.getActiveCount(),
    ])

    return {
      weatherQueue: { waiting: wWaiting, active: wActive },
      currencyQueue: { waiting: cWaiting, active: cActive },
      newsQueue: { waiting: nWaiting, active: nActive },
    }
  }

  // ── Cleanup ───────────────────────────────────────

  async close(): Promise<void> {
    await Promise.all([
      this.weatherQueue.close(),
      this.currencyQueue.close(),
      this.newsQueue.close(),
    ])
  }
}

export const jobService = new JobService()