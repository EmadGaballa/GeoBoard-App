// ======================================================
// GEOBOARD — AUTH ROUTES
// ======================================================

import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Google OAuth
router.get('/google', (req, res, next) => authController.googleAuth(req, res, next))
router.get('/google/callback', (req, res, next) => authController.googleCallback(req, res, next))

// Email/Password
router.post('/login', (req, res, next) => authController.login(req, res, next))
router.post('/register', (req, res, next) => authController.register(req, res, next))

// Logout
router.post('/logout', (req, res, next) => authController.logout(req, res, next))

// Current user (requires auth)
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next))

// Token validation
router.post('/validate', (req, res, next) => authController.validate(req, res, next))

export default router