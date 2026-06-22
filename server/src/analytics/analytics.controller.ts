// ======================================================
// GEOBOARD — ANALYTICS CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { analyticsService } from './analytics.service.js'

export class AnalyticsController {
  async track(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { event, metadata } = req.body
      await analyticsService.track(userId, event, metadata)
      res.json({ success: true, data: { message: 'Event tracked' }, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const summary = await analyticsService.getUserSummary(userId)
      res.json({ success: true, data: summary, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }
}

export const analyticsController = new AnalyticsController()