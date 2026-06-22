// ======================================================
// GEOBOARD — WEATHER ROUTES
// ======================================================

import { Router } from 'express'
import { weatherController } from './weather.controller.js'

const router = Router()

router.get('/current', (req, res, next) => weatherController.getCurrent(req, res, next))
router.get('/forecast', (req, res, next) => weatherController.getForecast(req, res, next))
router.get('/hourly', (req, res, next) => weatherController.getHourly(req, res, next))

export default router