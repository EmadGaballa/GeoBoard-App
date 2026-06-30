// ======================================================
// GEOBOARD — WEATHER CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { weatherService } from './weather.service.js'
import { weatherQuerySchema } from '../common/validation.js'

export class WeatherController {
  async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat: latStr, lng: lngStr } = weatherQuerySchema.parse(req.query)
      const lat = parseFloat(latStr!)
      const lng = parseFloat(lngStr!)

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
      const { lat: latStr, lng: lngStr } = weatherQuerySchema.parse(req.query)
      const lat = parseFloat(latStr!)
      const lng = parseFloat(lngStr!)

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
      const { lat: latStr, lng: lngStr } = weatherQuerySchema.parse(req.query)
      const lat = parseFloat(latStr!)
      const lng = parseFloat(lngStr!)
      const hours = parseInt(req.query.hours as string) || 24

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