// ======================================================
// GEOBOARD — USERS CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import { usersService } from './users.service.js'
import { updateProfileSchema, changePasswordSchema } from '../common/validation.js'
import { ValidationError } from '../common/errors.js'

export class UsersController {
  constructor() {
    this.getProfile = this.getProfile.bind(this)
    this.updateProfile = this.updateProfile.bind(this)
    this.changePassword = this.changePassword.bind(this)
  }

  // ────────────────────────────────────────────────────
  // GET PROFILE
  // ────────────────────────────────────────────────────

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const profile = await usersService.getProfile(userId)

      res.json({
        success: true,
        data: profile,
      })
    } catch (err) {
      next(err)
    }
  }

  // ────────────────────────────────────────────────────
  // UPDATE PROFILE (name, avatar)
  // ────────────────────────────────────────────────────

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const data = updateProfileSchema.parse(req.body)
      const profile = await usersService.updateProfile(userId, data)

      res.json({
        success: true,
        data: profile,
      })
    } catch (err) {
      if (err instanceof ValidationError) return next(err)
      next(err)
    }
  }

  // ────────────────────────────────────────────────────
  // CHANGE PASSWORD
  // ────────────────────────────────────────────────────

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

      // Extract the current session token so we can keep THIS session alive
      const currentToken = req.cookies?.token || req.headers.authorization?.slice(7)

      await usersService.changePassword(userId, currentPassword, newPassword, currentToken)

      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      })
    } catch (err) {
      if (err instanceof ValidationError) return next(err)
      next(err)
    }
  }
}

export const usersController = new UsersController()