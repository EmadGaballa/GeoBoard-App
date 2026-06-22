// ======================================================
// GEOBOARD — LOCATION ROUTES
// ======================================================

import { Router } from 'express'
import { locationController } from './location.controller.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Public routes (no auth required)
router.get('/ip', (req, res, next) => locationController.locateByIP(req, res, next))
router.get('/geocode', (req, res, next) => locationController.geocode(req, res, next))

// Authenticated routes
router.get('/active', authenticate, (req, res, next) => locationController.getActive(req, res, next))
router.put('/update', authenticate, (req, res, next) => locationController.update(req, res, next))
router.get('/history', authenticate, (req, res, next) => locationController.getHistory(req, res, next))
router.post('/save', authenticate, (req, res, next) => locationController.save(req, res, next))
router.get('/saved', authenticate, (req, res, next) => locationController.getSaved(req, res, next))
router.delete('/saved/:id', authenticate, (req, res, next) => locationController.deleteSaved(req, res, next))

export default router