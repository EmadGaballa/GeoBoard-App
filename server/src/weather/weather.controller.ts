// ======================================================
// GEOBOARD — WEATHER CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { weatherService } from './weather.service.js'

export class WeatherController {
  async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string)
      const lng = parseFloat(req.query.lng as string)

      if (isNaN(lat) || isNaN(lng)) {
        res.json({ success: false, error: 'Valid lat and lng query parameters are required' })
        return
      }

      const weather = await weatherService.getCurrentWeather(lat, lng)
      res.json({
        success: true,
        data: weather,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }

  async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string)
      const lng = parseFloat(req.query.lng as string)

      if (isNaN(lat) || isNaN(lng)) {
        res.json({ success: false, error: 'Valid lat and lng query parameters are required' })
        return
      }

      const forecast = await weatherService.get7DayForecast(lat, lng)
      res.json({
        success: true,
        data: forecast,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }

  async getHourly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string)
      const lng = parseFloat(req.query.lng as string)
      const hours = parseInt(req.query.hours as string) || 24

      if (isNaN(lat) || isNaN(lng)) {
        res.json({ success: false, error: 'Valid lat and lng query parameters are required' })
        return
      }

      const hourly = await weatherService.getHourlyForecast(lat, lng, hours)
      res.json({
        success: true,
        data: hourly,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }
}

export const weatherController = new WeatherController()