// ======================================================
// GEOBOARD — AUTH CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { config } from '../config/index.js'
import { authService } from './auth.service.js'
import { emailLoginSchema, registerSchema } from '../common/validation.js'
import { ValidationError } from '../common/errors.js'

// ── Passport Google Strategy ──────────────────────────

passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl,
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const user = await authService.handleGoogleLogin({
      id: profile.id,
      email: profile.emails?.[0]?.value || `${profile.id}@google-oauth.com`,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value || '',
    })
    done(null, user)
  } catch (err) {
    done(err as Error)
  }
}))

export class AuthController {
  // ── Google OAuth ─────────────────────────────────────

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, next)
  }

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    passport.authenticate('google', { session: false }, (err: Error | null, authResponse?: { token: string; user: { id: string } }) => {
      if (err || !authResponse) {
        res.redirect(`${config.server.frontendUrl}/login?error=google_auth_failed`)
        return
      }

      // Set httpOnly cookie
      res.cookie('token', authResponse.token, {
        httpOnly: true,
        secure: config.server.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      // Redirect to frontend
      res.redirect(`${config.server.frontendUrl}/auth/callback?token=${authResponse.token}`)
    })(req, res, next)
  }

  // ── Email/Password Auth ──────────────────────────────

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = emailLoginSchema.parse(req.body)
      const result = await authService.loginWithEmail(email, password)

      this.setTokenCookie(res, result.token)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err instanceof ValidationError ? err : undefined)
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = registerSchema.parse(req.body)
      const result = await authService.register(email, password, name)

      this.setTokenCookie(res, result.token)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err instanceof ValidationError ? err : undefined)
    }
  }

  // ── Logout ──────────────────────────────────────────

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.token || req.headers.authorization?.slice(7)
      if (token) {
        await authService.logout(token)
      }

      res.clearCookie('token')
      res.json({ success: true, data: { message: 'Logged out successfully' } })
    } catch (err) {
      next(err)
    }
  }

  // ── Get Current User ────────────────────────────────

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id)
      res.json({ success: true, data: user })
    } catch (err) {
      next(err)
    }
  }

  // ── Token Validation ────────────────────────────────

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.token || req.cookies?.token
      if (!token) {
        res.json({ success: true, data: { valid: false } })
        return
      }

      const result = await authService.validateToken(token)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // ── Helpers ─────────────────────────────────────────

  private setTokenCookie(res: Response, token: string): void {
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }
}

export const authController = new AuthController()