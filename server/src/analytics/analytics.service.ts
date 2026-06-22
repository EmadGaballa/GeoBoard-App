// ======================================================
// GEOBOARD — ANALYTICS SERVICE
// Track and aggregate user behavior
// ======================================================

import prisma from '../common/prisma.js'
import type { AnalyticsSummary } from '../types/index.js'

export class AnalyticsService {
  // ── Track Event ─────────────────────────────────────

  async track(userId: string, event: string, metadata?: Record<string, unknown>): Promise<void> {
    await prisma.analytics.create({
      data: {
        userId,
        event,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }).catch(() => {
      // Silently fail analytics if DB is unavailable
    })
  }

  // ── Get User Summary ───────────────────────────────

  async getUserSummary(userId: string): Promise<AnalyticsSummary> {
    const [cityData, widgetData, frequencyData] = await Promise.all([
      this.getMostUsedCities(userId),
      this.getMostUsedWidgets(userId),
      this.getApiFrequency(userId),
    ])

    return {
      mostUsedCities: cityData,
      mostUsedWidgets: widgetData,
      apiRequestFrequency: frequencyData,
    }
  }

  // ── Most Used Cities ──────────────────────────────

  private async getMostUsedCities(userId: string): Promise<{ city: string; count: number }[]> {
    const events = await prisma.analytics.findMany({
      where: {
        userId,
        event: 'location_change',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Aggregate by city from metadata
    const cityCounts = new Map<string, number>()
    for (const event of events) {
      if (event.metadata) {
        try {
          const meta = JSON.parse(event.metadata) as { city?: string }
          if (meta.city) {
            cityCounts.set(meta.city, (cityCounts.get(meta.city) || 0) + 1)
          }
        } catch { /* ignore */ }
      }
    }

    return Array.from(cityCounts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  // ── Most Used Widgets ─────────────────────────────

  private async getMostUsedWidgets(userId: string): Promise<{ widget: string; count: number }[]> {
    const events = await prisma.analytics.findMany({
      where: {
        userId,
        event: { in: ['weather_fetch', 'news_fetch', 'currency_fetch'] },
      },
      select: { event: true },
    })

    const widgetCounts = new Map<string, number>()
    for (const event of events) {
      const widgetName = event.event.replace('_fetch', '')
      widgetCounts.set(widgetName, (widgetCounts.get(widgetName) || 0) + 1)
    }

    return Array.from(widgetCounts.entries())
      .map(([widget, count]) => ({ widget, count }))
      .sort((a, b) => b.count - a.count)
  }

  // ── API Request Frequency ─────────────────────────

  private async getApiFrequency(userId: string): Promise<{ date: string; count: number }[]> {
    const events = await prisma.analytics.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const dateCounts = new Map<string, number>()
    for (const event of events) {
      const date = event.createdAt.toISOString().split('T')[0]
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
    }

    return Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days
  }
}

export const analyticsService = new AnalyticsService()