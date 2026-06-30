// ======================================================
// GEOBOARD — CURRENCY CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { currencyService } from './currency.service.js'
import { currencyConvertSchema, currencyQuerySchema } from '../common/validation.js'

export class CurrencyController {
  async getRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { base } = currencyQuerySchema.parse(req.query)
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
      const { from, to, amount } = currencyConvertSchema.parse({
        from: req.query.from,
        to: req.query.to,
        amount: req.query.amount ? parseFloat(req.query.amount as string) : undefined,
      })

      const result = await currencyService.convert(from, to, amount)
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