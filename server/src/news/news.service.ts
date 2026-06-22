// ======================================================
// GEOBOARD — NEWS SERVICE (Backend proxy)
// Webz.io API — API key isolated on server
// ======================================================

import { getCache, CacheService } from '../cache/index.js'
import { config } from '../config/index.js'
import type { NewsArticle } from '../types/index.js'

const WEBZ_BASE = 'https://api.webz.io/newsApiLite'

const CATEGORY_QUERIES: Record<string, string> = {
  business:       'topic:"financial and economic news"',
  technology:     'topic:"science and technology"',
  politics:       'topic:politics',
  health:         'topic:health',
  sports:         'topic:sports',
  entertainment:  'topic:"arts, culture and entertainment"',
  world:          'topic:"world news"',
  science:        'topic:science',
  environment:    'topic:environment',
  education:      'topic:education',
}

export class NewsService {
  // ── Fetch News ───────────────────────────────────────

  async getNews(category = 'technology', pageSize = 12): Promise<NewsArticle[]> {
    const cache = getCache()
    const cacheKey = CacheService.newsKey('global', category)

    const { data } = await cache.getOrFetch(
      cacheKey,
      config.cache.ttlNews,
      async () => this.fetchNews(category, pageSize),
    )

    return data as NewsArticle[]
  }

  private async fetchNews(category: string, pageSize: number): Promise<NewsArticle[]> {
    const topicQuery = CATEGORY_QUERIES[category] ?? `topic:${category}`
    const q = encodeURIComponent(topicQuery)
    const url = `${WEBZ_BASE}?token=${config.apis.webzApiKey}&q=${q}&size=${pageSize}&sort=relevancy&order=desc`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Webz API error: ${response.status}`)
    const data = await response.json() as { posts?: Array<Record<string, unknown>> }

    if (!Array.isArray(data.posts) || data.posts.length === 0) {
      return []
    }

    return data.posts
      .filter((p: any) => p.title && p.url)
      .map((p: any) => this.mapPost(p, category))
  }

  // ── Search news ──────────────────────────────────────

  async searchNews(query: string, pageSize = 12): Promise<NewsArticle[]> {
    if (!query.trim()) return []

    const q = encodeURIComponent(query.trim())
    const url = `${WEBZ_BASE}?token=${config.apis.webzApiKey}&q=${q}&size=${pageSize}&sort=relevancy&order=desc`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Webz search error: ${response.status}`)
      const data = await response.json() as { posts?: Array<Record<string, unknown>> }

      if (Array.isArray(data.posts) && data.posts.length > 0) {
        return data.posts
          .filter((p: any) => p.title && p.url)
          .map((p: any) => this.mapPost(p, 'search'))
      }
      return []
    } catch {
      return []
    }
  }

  // ── Map Webz post to NewsArticle ────────────────────

  private mapPost(post: any, category: string): NewsArticle {
    return {
      id: post.uuid || `${post.url}-${Date.now()}`,
      title: post.title || 'Untitled',
      description: post.text && post.text !== 'Full text is unavailable in the news API lite version'
        ? post.text.slice(0, 220) + (post.text.length > 220 ? '…' : '')
        : post.thread?.title || 'No description available.',
      image: this.resolveImage(post),
      category,
      source: post.thread?.site_full || post.thread?.site || post.author || 'Unknown',
      publishedAt: this.formatDate(post.published),
      url: post.url || post.thread?.url || '#',
      author: post.author,
      sentiment: post.sentiment,
      isBreaking: post.sentiment === 'negative' && Math.random() < 0.15,
    }
  }

  private resolveImage(post: any): string | null {
    if (post.thread?.main_image && post.thread.main_image.startsWith('http')) {
      return post.thread.main_image
    }
    if (Array.isArray(post.external_images) && post.external_images.length > 0) {
      const img = post.external_images[0]
      if (typeof img === 'string' && img.startsWith('http')) return img
      if (img?.url?.startsWith('http')) return img.url
    }
    return null
  }

  private formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    } catch {
      return iso
    }
  }
}

export const newsService = new NewsService()