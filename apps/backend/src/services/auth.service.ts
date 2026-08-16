import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { RegisterDTO, LoginDTO } from '@tracker/shared';
import { EmailService } from './email.service.js';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export class AuthService {
  static async register(dto: RegisterDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        role: 'parent',
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static async login(dto: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  static async verifyAndRotateRefreshToken(token: string) {
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!existingToken || existingToken.expiresAt < new Date()) {
      if (existingToken) {
        await prisma.refreshToken.delete({ where: { id: existingToken.id } });
      }
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Delete used refresh token (rotation)
    await prisma.refreshToken.delete({ where: { id: existingToken.id } });

    // Generate new refresh token
    const newRefreshToken = await this.createRefreshToken(existingToken.userId);

    return {
      user: {
        id: existingToken.user.id,
        name: existingToken.user.name,
        email: existingToken.user.email,
        role: existingToken.user.role,
        createdAt: existingToken.user.createdAt,
      },
      newRefreshToken,
    };
  }

  static async revokeRefreshToken(token: string) {
    try {
      await prisma.refreshToken.delete({ where: { token } });
    } catch (_) {
      // Ignore if already deleted
    }
  }

  static async initiatePasswordReset(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return true; // Silent return for security
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  static async resetPassword(resetToken: string, newPassword: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const record = await prisma.passwordReset.findUnique({
      where: { tokenHash },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new Error('INVALID_OR_EXPIRED_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return true;
  }
}
