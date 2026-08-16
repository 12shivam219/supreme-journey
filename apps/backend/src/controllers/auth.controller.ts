import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from '@tracker/shared';

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as RegisterDTO;
      const user = await AuthService.register(body);
      const accessToken = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: '15m' });
      const refreshToken = await AuthService.createRefreshToken(user.id);

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.status(201).send({ accessToken, user });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') {
        return reply.status(409).send({ error: 'Conflict', message: 'Email is already registered' });
      }
      return reply.status(400).send({ error: 'Bad Request', message: err.message });
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as LoginDTO;
      const user = await AuthService.login(body);
      const accessToken = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: '15m' });
      const refreshToken = await AuthService.createRefreshToken(user.id);

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.send({ accessToken, user });
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid email or password' });
      }
      return reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  }

  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing refresh token cookie' });
    }

    try {
      const { user, newRefreshToken } = await AuthService.verifyAndRotateRefreshToken(refreshToken);
      const accessToken = await reply.jwtSign({ id: user.id, role: user.role }, { expiresIn: '15m' });

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({ accessToken, user });
    } catch (err: any) {
      reply.clearCookie('refreshToken', { path: '/api/auth' });
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }
    reply.clearCookie('refreshToken', { path: '/api/auth' });
    return reply.send({ success: true, message: 'Logged out successfully' });
  }

  static async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = (request.body || {}) as ForgotPasswordDTO;
    if (!email) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Email is required' });
    }

    await AuthService.initiatePasswordReset(email);
    return reply.send({ success: true, message: 'If an account exists with that email, a password reset link has been sent.' });
  }

  static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, newPassword } = (request.body || {}) as ResetPasswordDTO;
    if (!token || !newPassword) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Token and new password are required' });
    }

    try {
      await AuthService.resetPassword(token, newPassword);
      return reply.send({ success: true, message: 'Password has been successfully reset' });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Bad Request', message: 'Invalid or expired password reset token' });
    }
  }
}
