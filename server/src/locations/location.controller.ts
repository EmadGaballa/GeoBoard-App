// ======================================================
// GEOBOARD — LOCATION CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { locationService } from './location.service.js'
import { locationSchema, saveLocationSchema } from '../common/validation.js'
import { analyticsService } from '../analytics/analytics.service.js'

export class LocationController {
  // ── Update active location ─────────────────────────

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = locationSchema.parse(req.body)
      const userId = req.user!.id

      // Normalize location (reverse geocode if needed)
      const normalized = await locationService.normalize(data)

      // Save to DB
      const saved = await locationService.updateActiveLocation(userId, normalized)

      // Track analytics
      analyticsService.track(userId, 'location_change', {
        city: normalized.city,
        country: normalized.country,
        source: normalized.source,
      }).catch(() => {})

      res.json({
        success: true,
        data: saved,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }

  // ── Get active location ───────────────────────────

  async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const location = await locationService.getActiveLocation(userId)

      if (!location) {
        // Try IP-based as fallback
        const ipLocation = await locationService.locateByIP(req.ip)
        const saved = await locationService.updateActiveLocation(userId, ipLocation)
        res.json({ success: true, data: saved, meta: { timestamp: new Date().toISOString() } })
        return
      }

      res.json({ success: true, data: location, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Get location history ──────────────────────────

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const history = await locationService.getLocationHistory(userId)
      res.json({ success: true, data: history, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Save location ────────────────────────────────

  async save(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = saveLocationSchema.parse(req.body)
      const userId = req.user!.id
      const saved = await locationService.saveLocation(userId, data)
      res.json({ success: true, data: saved, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Get saved locations ──────────────────────────

  async getSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const locations = await locationService.getSavedLocations(userId)
      res.json({ success: true, data: locations, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Delete saved location ────────────────────────

  async deleteSaved(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { id } = req.params
      await locationService.deleteSavedLocation(userId, id)
      res.json({ success: true, data: { message: 'Location deleted' }, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── IP-based location (no auth required) ─────────

  async locateByIP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const location = await locationService.locateByIP(req.ip)
      res.json({ success: true, data: location, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }

  // ── Geocode (city → lat/lng, no auth) ───────────

  async geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city } = req.query as { city?: string }
      if (!city) {
        res.json({ success: false, error: 'City parameter is required' })
        return
      }
      const location = await locationService.normalize({ city, source: 'manual' })
      res.json({ success: true, data: location, meta: { timestamp: new Date().toISOString() } })
    } catch (err) {
      next(err)
    }
  }
}

export const locationController = new LocationController()