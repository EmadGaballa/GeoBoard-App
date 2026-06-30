// ======================================================
// GEOBOARD — USERS ROUTES
// ======================================================

import { Router } from 'express'
import { usersController } from './users.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/profile', authenticate, usersController.getProfile)
router.patch('/profile', authenticate, usersController.updateProfile)
router.post('/change-password', authenticate, usersController.changePassword)

export default router