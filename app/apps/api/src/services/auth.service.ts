import bcrypt from "bcrypt";
import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";
import { unauthorized, notFound, AppError } from "../lib/errors.js";
import { emailService } from "./email.service.js";
import { activityLogService } from "./activity-log.service.js";
import type { AuthUser } from "@stackfix/types";

const BCRYPT_ROUNDS = 12;

export class AuthService {
  constructor(private db: PrismaClient = prisma) {}

  async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }> {
    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw unauthorized("Invalid email or password");
    }
    if (!user.isActive) {
      throw new AppError(
        "ACCESS_REVOKED",
        "Your dashboard access has been revoked. Contact your workshop administrator.",
        403,
      );
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw unauthorized("Invalid email or password");
    }

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken(user.id, user.organisationId, user.role);
    const refreshToken = signRefreshToken(user.id, user.organisationId, user.role);

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.db.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    activityLogService.log(user.organisationId, user.id, "login", {});

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        organisationId: user.organisationId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { verifyRefreshToken } = await import("../lib/jwt.js");
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const stored = await this.db.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.expiresAt < new Date()) {
      throw unauthorized("Refresh token invalid or expired");
    }
    const user = await this.db.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new AppError(
        "ACCESS_REVOKED",
        "Your dashboard access has been revoked. Contact your workshop administrator.",
        403,
      );
    }
    const accessToken = signAccessToken(user.id, user.organisationId, user.role);
    const newRefresh = signRefreshToken(user.id, user.organisationId, user.role);
    const newHash = crypto.createHash("sha256").update(newRefresh).digest("hex");
    await this.db.refreshToken.update({
      where: { id: stored.id },
      data: { tokenHash: newHash, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    return { accessToken, refreshToken: newRefresh };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await this.db.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw notFound("User");
    return {
      id: user.id,
      organisationId: user.organisationId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.isActive) {
      throw new AppError("EMAIL_NOT_FOUND", "Email does not exist", 404);
    }

    await this.db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.db.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`;

    await emailService.sendPasswordResetEmail({
      to: user.email,
      userName: user.fullName,
      resetUrl,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
      throw new AppError("INVALID_TOKEN", "This reset link is invalid or has expired", 400);
    }

    const passwordHash = await AuthService.hashPassword(newPassword);

    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      await tx.refreshToken.deleteMany({ where: { userId: record.userId } });
    });
  }
}

export const authService = new AuthService();
