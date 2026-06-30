// ======================================================
// GEOBOARD — AUTH ROUTES (EMAIL/PASSWORD ONLY)
// ======================================================

import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

console.log('[AuthRoutes] Auth routes initialized')

// ─────────────────────────────────────────────
// Email / Password Auth
// ─────────────────────────────────────────────
router.post('/register', authController.register)
router.post('/login', authController.login)

// ─────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)

// ─────────────────────────────────────────────
// PROFILE UPDATE (🔥 ADD THIS HERE)
// ─────────────────────────────────────────────
router.patch('/profile', authenticate, authController.updateProfile)


// ─────────────────────────────────────────────
// Token / Session Validation
// ─────────────────────────────────────────────
router.post('/validate', authController.validate)

// ─────────────────────────────────────────────
// Password Reset (Public routes)
// ─────────────────────────────────────────────
router.post('/forgot-password', authController.forgotPassword)
router.post('/validate-reset-token', authController.validateResetToken)
router.post('/reset-password', authController.resetPassword)

console.log('[AuthRoutes] Password reset routes registered')

export default router
