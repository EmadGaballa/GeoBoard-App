// ======================================================
// GEOBOARD — USERS SERVICE
// ======================================================

import bcrypt from 'bcryptjs'
import prisma from '../common/prisma.js'
import { NotFoundError, UnauthorizedError, AppError } from '../common/errors.js'
import type { AuthUser } from '../types/index.js'

export class UsersService {
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        provider: true,
      },
    })

    if (!user) throw new NotFoundError('User')
    return user
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }): Promise<AuthUser> {
    // If display name is being changed, check cooldown
    if (data.name !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          lastDisplayNameChange: true,
        },
      })

      if (!currentUser) throw new NotFoundError('User')

      // Check if name is actually changing
      if (currentUser.name !== data.name) {
        // Check cooldown (10 days)
        if (currentUser.lastDisplayNameChange) {
          const lastChange = new Date(currentUser.lastDisplayNameChange)
          const cooldownDays = 10
          const daysSinceChange = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
          
          if (daysSinceChange < cooldownDays) {
            const daysRemaining = Math.ceil(cooldownDays - daysSinceChange)
            throw new AppError(
              400,
              `You can change your display name again in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`
            )
          }
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatar && data.avatar.trim() !== '' ? { avatar: data.avatar } : {}),
        ...(data.name !== undefined ? { lastDisplayNameChange: new Date() } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        provider: true,
      },
    })

    return updated
  }

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD
  // ─────────────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentToken?: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) throw new NotFoundError('User')

    // OAuth-only accounts (no password set) can't use this flow.
    if (!user.password) {
      throw new AppError(
        400,
        'This account does not have a password set and cannot change one this way.',
      )
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect')
    }

    // Check if new password is the same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      throw new AppError(400, 'New password must be different from current password')
    }

    // Check password change cooldown (3 hours)
    if (user.lastPasswordChange) {
      const lastChange = new Date(user.lastPasswordChange)
      const cooldownMs = 3 * 60 * 60 * 1000 // 3 hours in ms
      const timeSinceChange = Date.now() - lastChange.getTime()
      
      if (timeSinceChange < cooldownMs) {
        const minutesRemaining = Math.ceil((cooldownMs - timeSinceChange) / (1000 * 60))
        if (minutesRemaining >= 60) {
          const hoursRemaining = Math.ceil(minutesRemaining / 60)
          throw new AppError(
            400,
            `You can change your password again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`
          )
        }
        throw new AppError(
          400,
          `You can change your password again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`
        )
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and record the change time. Invalidate other sessions
    // (but keep the current one so the user stays logged in).
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        lastPasswordChange: new Date(),
      },
    })

    // Invalidate sessions from other devices so they must re-authenticate
    // with the new password — standard practice after a password change.
    // Keep the current session alive so the user isn't logged out.
    if (currentToken) {
      await prisma.session.deleteMany({
        where: {
          userId,
          NOT: { token: currentToken },
        },
      })
    } else {
      // If no token provided (e.g., called from elsewhere), delete all sessions
      await prisma.session.deleteMany({ where: { userId } })
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    })
  }
}

export const usersService = new UsersService()