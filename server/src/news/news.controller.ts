// ======================================================
// GEOBOARD — NEWS CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { newsService } from './news.service.js'

export class NewsController {
  async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = (req.query.category as string) || 'technology'
      const pageSize = parseInt(req.query.pageSize as string) || 12

      const news = await newsService.getNews(category, pageSize)
      res.json({
        success: true,
        data: news,
        meta: { timestamp: new Date().toISOString(), totalResults: news.length },
      })
    } catch (err) {
      next(err)
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || ''
      const pageSize = parseInt(req.query.pageSize as string) || 12

      const news = await newsService.searchNews(query, pageSize)
      res.json({
        success: true,
        data: news,
        meta: { timestamp: new Date().toISOString(), totalResults: news.length },
      })
    } catch (err) {
      next(err)
    }
  }
}

export const newsController = new NewsController()