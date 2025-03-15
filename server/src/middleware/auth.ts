import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { loggingClient } from '../utils/logging-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// گسترش تایپ Request برای اضافه کردن user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        phone?: string;
        email?: string;
        fullName?: string;
        avatar?: string;
        isActive: boolean;
        role?: string;
        lastLoginAt: Date;
      };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    const requestPath = req.originalUrl;

    if (!token) {
      loggingClient.warn('درخواست بدون توکن', {
        ip,
        userAgent,
        path: requestPath,
        method: req.method,
        action: 'auth_no_token'
      });
      loggingClient.logPerformance('auth_no_token', Date.now() - startTime);
      return res.status(401).json({ message: 'لطفاً ابتدا وارد شوید' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const tokenData = jwt.decode(token);
      
      loggingClient.debug('بررسی توکن JWT', {
        userId: decoded.userId,
        path: requestPath,
        method: req.method,
        tokenExp: typeof tokenData === 'object' && tokenData !== null ? tokenData.exp : 'unknown',
        action: 'auth_token_verified'
      });

      const user = await User.findByPk(decoded.userId);

      if (!user) {
        loggingClient.warn('کاربر یافت نشد', {
          userId: decoded.userId,
          ip,
          userAgent,
          path: requestPath,
          method: req.method,
          action: 'auth_user_not_found'
        });
        loggingClient.logPerformance('auth_user_not_found', Date.now() - startTime);
        return res.status(401).json({ message: 'لطفاً ابتدا وارد شوید' });
      }

      if (!user.isActive) {
        loggingClient.warn('حساب کاربری غیرفعال', {
          userId: user.id,
          ip,
          userAgent,
          path: requestPath,
          method: req.method,
          action: 'auth_inactive_account'
        });
        loggingClient.logPerformance('auth_inactive_account', Date.now() - startTime);
        return res.status(403).json({ message: 'حساب کاربری غیرفعال است' });
      }

      loggingClient.info('احراز هویت موفق', {
        userId: user.id,
        role: user.role,
        ip,
        userAgent,
        path: requestPath,
        method: req.method,
        action: 'auth_success'
      });
      
      req.user = user;
      loggingClient.logPerformance('auth_middleware', Date.now() - startTime);
      next();
    } catch (jwtError) {
      // خطا در بررسی توکن JWT
      loggingClient.warn('توکن JWT نامعتبر', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        ip,
        userAgent,
        path: requestPath,
        method: req.method,
        action: 'auth_invalid_token'
      });
      loggingClient.logPerformance('auth_invalid_token', Date.now() - startTime);
      return res.status(401).json({ message: 'لطفاً مجددا وارد شوید' });
    }
  } catch (error) {
    // خطاهای پیش‌بینی نشده
    loggingClient.error('خطا در احراز هویت', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      action: 'auth_error'
    });
    loggingClient.logPerformance('auth_error', Date.now() - startTime);
    return res.status(500).json({ message: 'خطای سرور در احراز هویت' });
  }
}; 