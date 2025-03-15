import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { loggingClient } from '../utils/logging-client';

/**
 * میدل‌ور احراز هویت کاربر
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // دریافت توکن از هدر
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      loggingClient.warn('تلاش برای دسترسی بدون توکن', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        action: 'auth_missing_token'
      });
      return res.status(401).json({ message: 'احراز هویت ناموفق: توکن نامعتبر است' });
    }

    const token = authorization.split(' ')[1];

    // بررسی توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as any;
    
    if (!decoded || !decoded.id) {
      loggingClient.warn('توکن نامعتبر', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        token: token.substring(0, 10) + '...',
        action: 'auth_invalid_token'
      });
      return res.status(401).json({ message: 'احراز هویت ناموفق: توکن نامعتبر است' });
    }

    // بررسی وجود کاربر
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      loggingClient.warn('کاربر توکن یافت نشد', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: decoded.id,
        action: 'auth_user_not_found'
      });
      return res.status(401).json({ message: 'احراز هویت ناموفق: کاربر یافت نشد' });
    }

    // بررسی فعال بودن کاربر
    if (!user.isActive) {
      loggingClient.warn('تلاش برای دسترسی با کاربر غیرفعال', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: user.id,
        action: 'auth_inactive_user'
      });
      return res.status(403).json({ message: 'دسترسی شما به سیستم غیرفعال شده است' });
    }

    // افزودن اطلاعات کاربر به درخواست
    (req as any).user = user;

    // ثبت ورود موفق
    loggingClient.info('احراز هویت موفق', {
      userId: user.id,
      path: req.path,
      method: req.method,
      action: 'auth_success'
    });

    next();
  } catch (error) {
    // خطای رمزگشایی توکن
    loggingClient.error('خطا در احراز هویت', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path,
      method: req.method,
      action: 'auth_error'
    });
    
    // کنترل خطای منقضی شدن توکن
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'احراز هویت ناموفق: توکن منقضی شده است' });
    }
    
    return res.status(401).json({ message: 'احراز هویت ناموفق: توکن نامعتبر است' });
  }
}; 