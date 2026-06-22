// ======================================================
// GEOBOARD — DASHBOARD PERSONALIZATION ENGINE
// Backend-driven dashboard configuration per user
// ======================================================

import prisma from '../common/prisma.js'
import { getCache, CacheService } from '../cache/index.js'
import { config } from '../config/index.js'
import { weatherService } from '../weather/weather.service.js'
import { newsService } from '../news/news.service.js'
import { currencyService } from '../currency/currency.service.js'
import { locationService } from '../locations/location.service.js'
import type { DashboardConfig, DashboardResponse, NormalizedLocation } from '../types/index.js'

export class DashboardService {
  // ── Get Personalized Dashboard ──────────────────────

  async getDashboard(userId: string, location?: NormalizedLocation): Promise<DashboardResponse> {
    const cache = getCache()

    // Try to get cached dashboard
    const cacheKey = CacheService.dashboardKey(userId)
    const cached = await cache.get<DashboardResponse>(cacheKey)
    if (cached) return cached

    // Fetch config
    const config_ = await this.getConfig(userId)

    // Get location (use provided or fetch from DB)
    const loc = location || await this.getBestLocation(userId)

    // Parallel data fetching based on enabled widgets
    const promises: Promise<void>[] = []
    const result: DashboardResponse = {
      config: config_,
      weather: null,
      news: [],
      currency: [],
      location: loc,
      forecast: [],
    }

    if (config_.widgets.includes('weather') && loc) {
      promises.push(
        weatherService.getCurrentWeather(loc.latitude, loc.longitude)
          .then(w => { result.weather = w })
          .catch(() => {}),
      )
      promises.push(
        weatherService.get7DayForecast(loc.latitude, loc.longitude)
          .then(f => { result.forecast = f })
          .catch(() => {}),
      )
    }

    if (config_.widgets.includes('news')) {
      const categories = config_.preferences.newsCategories
      const primaryCategory = categories[0] || 'technology'
      promises.push(
        newsService.getNews(primaryCategory)
          .then(n => { result.news = n })
          .catch(() => {}),
      )
    }

    if (config_.widgets.includes('currency')) {
      promises.push(
        currencyService.getRates(config_.preferences.currencyBase)
          .then(c => { result.currency = c })
          .catch(() => {}),
      )
    }

    await Promise.allSettled(promises)

    // Cache the full dashboard response
    await cache.set(cacheKey, result, 60) // 1 min TTL for dashboard

    return result
  }

  // ── Get/Update Config ─────────────────────────────

  async getConfig(userId: string): Promise<DashboardConfig> {
    // Get from DB
    const dbConfig = await prisma.dashboardConfig.findUnique({
      where: { userId },
    })

    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    })

    if (!dbConfig || !preferences) {
      // Create defaults
      const newConfig = await prisma.dashboardConfig.create({
        data: { userId },
      })
      const newPrefs = await prisma.userPreference.create({
        data: { userId },
      })

      return this.toDashboardConfig(newConfig, newPrefs)
    }

    return this.toDashboardConfig(dbConfig, preferences)
  }

  async updateConfig(
    userId: string,
    updates: Partial<{
      widgets: string[]
      layout: string
      defaultLocation: string
      preferences: Partial<{
        temperatureUnit: string
        newsCategories: string[]
        currencyBase: string
        timeFormat: string
        theme: string
      }>
    }>,
  ): Promise<DashboardConfig> {
    // Update dashboard config
    if (updates.widgets || updates.layout || updates.defaultLocation) {
      await prisma.dashboardConfig.upsert({
        where: { userId },
        update: {
          ...(updates.widgets ? { widgets: JSON.stringify(updates.widgets) } : {}),
          ...(updates.layout ? { layout: updates.layout } : {}),
          ...(updates.defaultLocation !== undefined ? { defaultLocation: updates.defaultLocation } : {}),
        },
        create: { userId },
      })
    }

    // Update preferences
    if (updates.preferences) {
      const prefs = updates.preferences
      const updateData: Record<string, string> = {}

      if (prefs.temperatureUnit) updateData.temperatureUnit = prefs.temperatureUnit
      if (prefs.newsCategories) updateData.newsCategories = JSON.stringify(prefs.newsCategories)
      if (prefs.currencyBase) updateData.currencyBase = prefs.currencyBase
      if (prefs.timeFormat) updateData.timeFormat = prefs.timeFormat
      if (prefs.theme) updateData.theme = prefs.theme

      if (Object.keys(updateData).length > 0) {
        await prisma.userPreference.upsert({
          where: { userId },
          update: updateData,
          create: { userId, ...updateData },
        })
      }
    }

    // Invalidate dashboard cache
    const cache = getCache()
    await cache.del(CacheService.dashboardKey(userId))

    return this.getConfig(userId)
  }

  // ── Helpers ─────────────────────────────────────────

  private async getBestLocation(userId: string): Promise<NormalizedLocation | null> {
    // Try active location first
    const active = await locationService.getActiveLocation(userId)
    if (active) {
      return {
        city: active.city,
        country: active.country,
        latitude: active.latitude,
        longitude: active.longitude,
        source: active.source as 'gps' | 'ip' | 'manual' | 'map',
      }
    }

    return null
  }

  private toDashboardConfig(
    dbConfig: { widgets: string; layout: string },
    preferences: { temperatureUnit: string; newsCategories: string; currencyBase: string; timeFormat: string; theme: string },
  ): DashboardConfig {
    return {
      widgets: JSON.parse(dbConfig.widgets),
      layout: dbConfig.layout,
      preferences: {
        temperatureUnit: preferences.temperatureUnit,
        newsCategories: JSON.parse(preferences.newsCategories),
        currencyBase: preferences.currencyBase,
        timeFormat: preferences.timeFormat,
        theme: preferences.theme,
      },
    }
  }
}

export const dashboardService = new DashboardService()