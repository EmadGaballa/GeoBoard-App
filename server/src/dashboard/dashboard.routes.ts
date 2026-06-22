// ======================================================
// GEOBOARD — DASHBOARD ROUTES
// ======================================================

import { Router } from 'express'
import { dashboardController } from './dashboard.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, (req, res, next) => dashboardController.getDashboard(req, res, next))
router.get('/config', authenticate, (req, res, next) => dashboardController.getConfig(req, res, next))
router.put('/config', authenticate, (req, res, next) => dashboardController.updateConfig(req, res, next))

export default router