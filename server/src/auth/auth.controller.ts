// ======================================================
// GEOBOARD — AUTH CONTROLLER
// ======================================================

import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { authService } from "./auth.service.js";
import { emailLoginSchema, registerSchema, updateProfileSchema, forgotPasswordSchema, validateResetTokenSchema, resetPasswordSchema } from "../common/validation.js";

export class AuthController {
  constructor() {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
    this.me = this.me.bind(this);
    this.validate = this.validate.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.validateResetToken = this.validateResetToken.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  // ────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = emailLoginSchema.parse(req.body);

      const result = await authService.loginWithEmail(email, password);

      this.setTokenCookie(res, result.token);

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  // ────────────────────────────────────────────────────
  // REGISTER
  // ────────────────────────────────────────────────────
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password, username, name, avatarId } = registerSchema.parse(
        req.body,
      );

      const result = await authService.register(
        email,
        password,
        username,
        name,
        avatarId,
      );

      this.setTokenCookie(res, result.token);

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
      return;
    }
  }

  // ────────────────────────────────────────────────────
  // UPDATE PROFILE
  // ────────────────────────────────────────────────────
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, avatar } = updateProfileSchema.parse(req.body);

      const updatedUser = await authService.updateProfile(req.user!.id, {
        name,
        avatar,
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // LOGOUT
  // ────────────────────────────────────────────────────
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.token || req.headers.authorization?.slice(7);

      if (token) {
        await authService.logout(token);
      }

      res.clearCookie("token");

      res.json({
        success: true,
        data: { message: "Logged out successfully" },
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // CURRENT USER
  // ────────────────────────────────────────────────────
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // VALIDATE TOKEN
  // ────────────────────────────────────────────────────
  async validate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = req.body.token || req.cookies?.token;

      if (!token) {
        res.json({
          success: true,
          data: { valid: false },
        });
        return;
      }

      const result = await authService.validateToken(token);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ────────────────────────────────────────────────────
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      await authService.forgotPassword(email);

      res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // VALIDATE RESET TOKEN
  // ────────────────────────────────────────────────────
  async validateResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = validateResetTokenSchema.parse(req.body);

      const isValid = await authService.validateResetToken(token);

      res.json({
        success: true,
        data: { valid: isValid },
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // RESET PASSWORD
  // ────────────────────────────────────────────────────
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(
        req.body,
      );

      await authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  // ────────────────────────────────────────────────────
  // COOKIE HELPER
  // ────────────────────────────────────────────────────
  private setTokenCookie(res: Response, token: string): void {
    res.cookie("token", token, {
      httpOnly: true,
      secure: config.server.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

export const authController = new AuthController();