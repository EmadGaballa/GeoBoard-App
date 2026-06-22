// ======================================================
// GEOBOARD — AUTHENTICATION MIDDLEWARE
// JWT verification + user lookup
// ======================================================

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { UnauthorizedError } from '../common/errors.js'
import prisma from '../common/prisma.js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string | null
        avatar: string | null
        provider: string
      }
    }
  }
}

export interface JwtPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Extract token from cookie or Authorization header
    let token: string | undefined

    // Check httpOnly cookie first
    if (req.cookies?.token) {
      token = req.cookies.token
    }

    // Fall back to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      throw new UnauthorizedError('No authentication token provided')
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

    // Look up user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatar: true, provider: true },
    })

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    // Attach user to request
    req.user = user

    // Update session lastUsed
    await prisma.session.updateMany({
      where: { token },
      data: { lastUsed: new Date() },
    }).catch(() => {
      // Silently fail if session update fails
    })

    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error)
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'))
    } else {
      next(new UnauthorizedError('Authentication failed'))
    }
  }
}

// Optional auth: attaches user if token present, but doesn't fail if missing
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined

    if (req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      next()
      return
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatar: true, provider: true },
    })

    if (user) {
      req.user = user
    }

    next()
  } catch {
    // Silently continue without user
    next()
  }
}