import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../common/prisma.js";
import { config } from "../config/index.js";
import { AppError, UnauthorizedError } from "../common/errors.js";
import { emailService } from "../common/email.service.js";
import type { AuthResponse, AuthUser } from "../types/index.js";

// Prisma transaction client type for typed transactions
type TransactionClient = {
  userPreference: { create: (args: { data: { userId: string } }) => Promise<unknown> };
  dashboardConfig: { create: (args: { data: { userId: string } }) => Promise<unknown> };
};

export class AuthService {
  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.createAuthSession(user);
  }

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  async register(
    email: string,
    password: string,
    username: string,
    name?: string,
    avatarId?: string
  ): Promise<AuthResponse> {
    // Email is already lowercased by the validation schema, but normalize
    // again here in case this method is ever called directly.
    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      throw new AppError(409, "Email already registered");
    }

    // Username uniqueness check is case-insensitive: "Emad" and "emad"
    // are treated as the same username so two users can't pick visually
    // identical handles.
    const existingUsername = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (existingUsername) {
      throw new AppError(409, "Username is already taken");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const finalAvatar = avatarId && avatarId.trim() !== "" ? avatarId : "fox";

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          username,
          name: name || normalizedEmail.split("@")[0],
          password: hashedPassword,
          provider: "email",
          avatar: finalAvatar,
        },
      });

      await this.ensureUserSetup(tx, created.id);

      return created;
    });

    return this.createAuthSession(user);
  }

  // ─────────────────────────────────────────────
  // UPDATE PROFILE (delegates to UsersService for cooldown logic)
  // ─────────────────────────────────────────────
  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string }
  ): Promise<AuthUser> {
    // Import lazily to avoid circular dependency
    const { usersService } = await import("../users/users.service.js");
    return usersService.updateProfile(userId, data);
  }

  // ─────────────────────────────────────────────
  // CHANGE PASSWORD (delegates to UsersService)
  // ─────────────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Import lazily to avoid circular dependency
    const { usersService } = await import("../users/users.service.js");
    await usersService.changePassword(userId, currentPassword, newPassword);
  }

  // ─────────────────────────────────────────────
  // USER SETUP
  // ─────────────────────────────────────────────
  private async ensureUserSetup(tx: TransactionClient, userId: string): Promise<void> {
    await tx.userPreference.create({
      data: { userId },
    });

    await tx.dashboardConfig.create({
      data: { userId },
    });
  }

  // ─────────────────────────────────────────────
  // SESSION CREATION
  // ─────────────────────────────────────────────
  private async createAuthSession(user: {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    avatar: string | null;
    provider: string;
  }): Promise<AuthResponse> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: "7d" }
    );

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  // ─────────────────────────────────────────────
  // CURRENT USER
  // ─────────────────────────────────────────────
  async getCurrentUser(userId: string): Promise<AuthUser> {
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
    });

    if (!user) throw new UnauthorizedError("User not found");

    return user;
  }

  // ─────────────────────────────────────────────
  // TOKEN VALIDATION
  // ─────────────────────────────────────────────
  async validateToken(
    token: string
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
      };

      const session = await prisma.session.findUnique({
        where: { token },
      });

      if (!session || session.expiresAt < new Date()) {
        return { valid: false };
      }

      return { valid: true, userId: decoded.userId };
    } catch {
      return { valid: false };
    }
  }

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    console.log('[ForgotPassword] Service: Starting for email:', email)
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('[ForgotPassword] Service: User found:', !!user)

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[ForgotPassword] Service: No user, returning early')
      return;
    }

    // Generate cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    
    console.log('[ForgotPassword] Service: Token generated')

    // Set expiration to 20 minutes from now
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    console.log('[ForgotPassword] Service: Expires at:', expiresAt.toISOString())

    // Save hashed token
    console.log('[ForgotPassword] Service: Saving token to database...')
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
    console.log('[ForgotPassword] Service: Token saved successfully')

    // Build reset URL
    const resetUrl = `${config.server.frontendUrl}/reset-password?token=${rawToken}`;
    console.log('[ForgotPassword] Service: Reset URL built')

    // Send email asynchronously - don't block the response
    console.log('[ForgotPassword] Service: Queuing email send...')
    emailService.sendPasswordResetEmail(user.email, resetUrl, 20).catch((emailError) => {
      console.error('[ForgotPassword] Service: Email failed:', emailError)
      // Email failure doesn't affect the user experience
    })
    
    console.log('[ForgotPassword] Service: Completed successfully')
  }

  // ─────────────────────────────────────────────
  // VALIDATE RESET TOKEN
  // ─────────────────────────────────────────────
  async validateResetToken(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      return false;
    }

    // Check if expired
    if (resetToken.expiresAt < new Date()) {
      return false;
    }

    // Check if already used
    if (resetToken.usedAt) {
      return false;
    }

    return true;
  }

  // ─────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    // Check if expired
    if (resetToken.expiresAt < new Date()) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    // Check if already used
    if (resetToken.usedAt) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and mark token as used
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          lastPasswordChange: new Date(),
        },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all existing sessions
      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      });
    });
  }
}

export const authService = new AuthService();