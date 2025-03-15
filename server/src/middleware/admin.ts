import { Request, Response, NextFunction } from 'express';
import { loggingClient } from '../utils/loggingClient';

/**
 * میان‌افزار بررسی دسترسی مدیر
 * این میان‌افزار بررسی می‌کند که آیا کاربر احراز هویت شده دارای نقش مدیر است یا خیر
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      loggingClient.warn('تلاش برای دسترسی به منابع مدیریتی بدون احراز هویت', {
        ip: req.ip,
        route: req.originalUrl
      });
      return res.status(401).json({ message: 'احراز هویت نشده' });
    }
    
    if (user.role !== 'admin') {
      loggingClient.warn('تلاش برای دسترسی به منابع مدیریتی با نقش غیرمجاز', {
        userId: user.id,
        role: user.role,
        route: req.originalUrl
      });
      return res.status(403).json({ message: 'دسترسی ممنوع: نیاز به دسترسی مدیر' });
    }
    
    loggingClient.info('دسترسی مدیر به منابع', {
      userId: user.id,
      route: req.originalUrl
    });
    
    next();
  } catch (error) {
    loggingClient.error('خطا در میان‌افزار بررسی مدیر', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'خطای سرور در بررسی دسترسی' });
  }
};

export default { isAdmin }; 