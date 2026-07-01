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

// ── Priority Cities ───────────────────────────────────

const PRIORITY_CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
]

// ── SAFE Redis Connection (Railway-ready) ─────────────

function createRedisConnection(): import('bullmq').ConnectionOptions {
  const { host, port, password } = config.redis.parsed
  return {
    host,
    port,
    password: config.redis.password || password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
}

export class JobService {
  private weatherQueue: Queue
  private currencyQueue: Queue
  private newsQueue: Queue
  private initialized = false

  constructor() {
    const connection = createRedisConnection()

    this.weatherQueue = new Queue(QUEUES.WEATHER_REFRESH, { connection })
    this.currencyQueue = new Queue(QUEUES.CURRENCY_REFRESH, { connection })
    this.newsQueue = new Queue(QUEUES.NEWS_PREFETCH, { connection })
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const connection = createRedisConnection()

    // ── Weather Worker ───────────────────────────────
    new Worker(
      QUEUES.WEATHER_REFRESH,
      async (job: Job) => {
        const { lat, lng, city } = job.data

        console.log(`[Job] Refreshing weather for ${city}...`)

        const weather = await weatherService.getCurrentWeather(lat, lng)
        const forecast = await weatherService.get7DayForecast(lat, lng)

        const cache = getCache()
        await cache.set(`weather:${city.toLowerCase()}`, weather, config.cache.ttlWeather)
        await cache.set(
          `weather:${lat.toFixed(2)}:${lng.toFixed(2)}:forecast`,
          forecast,
          config.cache.ttlWeather,
        )
      },
      { connection, concurrency: 2 },
    )

    // ── Currency Worker ─────────────────────────────
    new Worker(
      QUEUES.CURRENCY_REFRESH,
      async (job: Job) => {
        const { base } = job.data

        console.log(`[Job] Refreshing currency rates for ${base}...`)

        const rates = await currencyService.getRates(base)

        const cache = getCache()
        await cache.set(`currency:${base.toLowerCase()}`, rates, config.cache.ttlCurrency)
      },
      { connection, concurrency: 1 },
    )

    // ── News Worker ────────────────────────────────
    new Worker(
      QUEUES.NEWS_PREFETCH,
      async (job: Job) => {
        const { category } = job.data

        console.log(`[Job] Prefetching news for ${category}...`)

        const news = await newsService.getNews(category, 12)

        const cache = getCache()
        await cache.set(`news:global:${category}`, news, config.cache.ttlNews)
      },
      { connection, concurrency: 3 },
    )

    console.log('[Jobs] Background workers initialized')
  }

  async scheduleAll(): Promise<void> {
    await Promise.all([
      this.weatherQueue.obliterate({ force: true }).catch(() => {}),
      this.currencyQueue.obliterate({ force: true }).catch(() => {}),
      this.newsQueue.obliterate({ force: true }).catch(() => {}),
    ])

    for (const city of PRIORITY_CITIES) {
      await this.weatherQueue.add(
        `weather-${city.name}`,
        city,
        {
          repeat: { every: 10 * 60 * 1000 },
        },
      )
    }

    await this.currencyQueue.add(
      'currency-usd',
      { base: 'USD' },
      {
        repeat: { every: 5 * 60 * 1000 },
      },
    )

    const categories = ['technology', 'business', 'world', 'sports', 'health']

    for (const category of categories) {
      await this.newsQueue.add(
        `news-${category}`,
        { category },
        {
          repeat: { every: 15 * 60 * 1000 },
        },
      )
    }

    console.log('[Jobs] All recurring jobs scheduled')
  }

  async health() {
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

  async close(): Promise<void> {
    await Promise.all([
      this.weatherQueue.close(),
      this.currencyQueue.close(),
      this.newsQueue.close(),
    ])
  }
}

export const jobService = new JobService()