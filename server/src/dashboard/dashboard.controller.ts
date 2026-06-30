// ======================================================
// GEOBOARD — DASHBOARD CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { dashboardService } from './dashboard.service.js'
import { analyticsService } from '../analytics/analytics.service.js'
import { dashboardConfigSchema } from '../common/validation.js'

export class DashboardController {
  // ── Get full dashboard ────────────────────────────

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const dashboard = await dashboardService.getDashboard(userId)

      // Track analytics
      analyticsService.track(userId, 'dashboard_view').catch(() => {})

      res.json({
        success: true,
        data: dashboard,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }

  // ── Get dashboard config ─────────────────────────

  async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const config = await dashboardService.getConfig(userId)
      res.json({ success: true, data: config, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Update dashboard config ──────────────────────

  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      // Validate with Zod before passing to service
      const data = dashboardConfigSchema.parse(req.body)
      const config = await dashboardService.updateConfig(userId, data)
      res.json({ success: true, data: config, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }
}

export const dashboardController = new DashboardController()