// ======================================================
// GEOBOARD — ANALYTICS ROUTES
// ======================================================

import { Router } from 'express'
import { analyticsController } from './analytics.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/track', authenticate, (req, res, next) => analyticsController.track(req, res, next))
router.get('/summary', authenticate, (req, res, next) => analyticsController.getSummary(req, res, next))

export default router