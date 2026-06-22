// ======================================================
// GEOBOARD — CURRENCY CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { currencyService } from './currency.service.js'

export class CurrencyController {
  async getRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const base = (req.query.base as string) || 'USD'
      const rates = await currencyService.getRates(base)
      res.json({
        success: true,
        data: rates,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }

  async convert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to, amount } = req.query as { from?: string; to?: string; amount?: string }

      if (!from || !to || !amount) {
        res.json({ success: false, error: 'from, to, and amount query parameters are required' })
        return
      }

      const result = await currencyService.convert(
        from.toUpperCase(),
        to.toUpperCase(),
        parseFloat(amount),
      )
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      })
    } catch (err) {
      next(err)
    }
  }
}

export const currencyController = new CurrencyController()