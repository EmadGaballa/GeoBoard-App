// ======================================================
// GEOBOARD — CURRENCY ROUTES
// ======================================================

import { Router } from 'express'
import { currencyController } from './currency.controller.js'

const router = Router()

router.get('/rates', (req, res, next) => currencyController.getRates(req, res, next))
router.get('/convert', (req, res, next) => currencyController.convert(req, res, next))

export default router