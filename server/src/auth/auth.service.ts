// ======================================================
// GEOBOARD — AUTH SERVICE
// Handles Google OAuth, email/password, JWT, sessions
// ======================================================

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../common/prisma.js'
import { config } from '../config/index.js'
import { AppError, UnauthorizedError } from '../common/errors.js'
import type { AuthResponse, AuthUser } from '../types/index.js'

export class AuthService {
  // ── Google OAuth ─────────────────────────────────────

  async handleGoogleLogin(profile: {
    id: string
    email: string
    name: string
    picture: string
  }): Promise<AuthResponse> {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { providerId: profile.id },
    })

    if (!user) {
      // Check if email already exists (linking accounts)
      user = await prisma.user.findUnique({
        where: { email: profile.email },
      })

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: profile.id,
            avatar: profile.picture || user.avatar,
            name: profile.name || user.name,
          },
        })
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            avatar: profile.picture,
            provider: 'google',
            providerId: profile.id,
          },
        })

        // Create default preferences and dashboard config
        await prisma.userPreference.create({
          data: { userId: user.id },
        })

        await prisma.dashboardConfig.create({
          data: { userId: user.id },
        })
      }
    }

    // Generate JWT and create session
    return this.createAuthSession(user)
  }

  // ── Email/Password Login ─────────────────────────────

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    return this.createAuthSession(user)
  }

  // ── Register ─────────────────────────────────────────

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      throw new AppError(409, 'Email already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        provider: 'email',
      },
    })

    // Create default preferences and dashboard config
    await prisma.userPreference.create({
      data: { userId: user.id },
    })

    await prisma.dashboardConfig.create({
      data: { userId: user.id },
    })

    return this.createAuthSession(user)
  }

  // ── Session Management ──────────────────────────────

  private async createAuthSession(user: {
    id: string
    email: string
    name: string | null
    avatar: string | null
    provider: string
  }): Promise<AuthResponse> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: 7 * 24 * 60 * 60 }, // 7 days in seconds
    )

    // Store session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
      token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  // ── Logout ───────────────────────────────────────────

  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    })
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    })
  }

  // ── Get current user ────────────────────────────────

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    return user
  }

  // ── Token validation ────────────────────────────────

  async validateToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string }
      const session = await prisma.session.findUnique({
        where: { token },
      })

      if (!session || session.expiresAt < new Date()) {
        return { valid: false }
      }

      return { valid: true, userId: decoded.userId }
    } catch {
      return { valid: false }
    }
  }
}

export const authService = new AuthService()