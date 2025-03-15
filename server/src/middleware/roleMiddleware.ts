import { Request, Response, NextFunction } from 'express';
import { loggingClient } from '../utils/logging-client';

/**
 * میدل‌ور بررسی نقش ادمین
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      loggingClient.warn('تلاش برای دسترسی ادمین بدون احراز هویت', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        action: 'role_no_user'
      });
      return res.status(401).json({ message: 'ابتدا باید وارد سیستم شوید' });
    }
    
    if (user.role !== 'admin') {
      loggingClient.warn('تلاش برای دسترسی به بخش ادمین', {
        userId: user.id,
        role: user.role,
        path: req.path,
        method: req.method,
        action: 'role_not_admin'
      });
      return res.status(403).json({ message: 'شما اجازه دسترسی به این بخش را ندارید' });
    }
    
    loggingClient.info('دسترسی ادمین تایید شد', {
      userId: user.id,
      path: req.path,
      method: req.method,
      action: 'role_admin_success'
    });
    
    next();
  } catch (error) {
    loggingClient.error('خطا در بررسی نقش ادمین', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path,
      method: req.method,
      action: 'role_check_error'
    });
    return res.status(500).json({ message: 'خطا در بررسی دسترسی' });
  }
};

/**
 * میدل‌ور بررسی نقش کاربر (مدیر یا کاربر عادی)
 */
export const isUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      loggingClient.warn('تلاش برای دسترسی کاربری بدون احراز هویت', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        action: 'role_no_user'
      });
      return res.status(401).json({ message: 'ابتدا باید وارد سیستم شوید' });
    }
    
    if (user.role !== 'user' && user.role !== 'manager' && user.role !== 'admin') {
      loggingClient.warn('تلاش برای دسترسی با نقش نامعتبر', {
        userId: user.id,
        role: user.role,
        path: req.path,
        method: req.method,
        action: 'role_invalid'
      });
      return res.status(403).json({ message: 'شما اجازه دسترسی به این بخش را ندارید' });
    }
    
    next();
  } catch (error) {
    loggingClient.error('خطا در بررسی نقش کاربر', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path,
      method: req.method,
      action: 'role_check_error'
    });
    return res.status(500).json({ message: 'خطا در بررسی دسترسی' });
  }
};

/**
 * میدل‌ور بررسی نقش مدیر یا ادمین
 */
export const isManagerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      loggingClient.warn('تلاش برای دسترسی مدیریتی بدون احراز هویت', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        action: 'role_no_user'
      });
      return res.status(401).json({ message: 'ابتدا باید وارد سیستم شوید' });
    }
    
    if (user.role !== 'manager' && user.role !== 'admin') {
      loggingClient.warn('تلاش برای دسترسی به بخش مدیریت', {
        userId: user.id,
        role: user.role,
        path: req.path,
        method: req.method,
        action: 'role_not_manager'
      });
      return res.status(403).json({ message: 'شما اجازه دسترسی به این بخش را ندارید' });
    }
    
    next();
  } catch (error) {
    loggingClient.error('خطا در بررسی نقش مدیر', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path,
      method: req.method,
      action: 'role_check_error'
    });
    return res.status(500).json({ message: 'خطا در بررسی دسترسی' });
  }
}; 