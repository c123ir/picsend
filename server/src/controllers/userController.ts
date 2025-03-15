import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { loggingClient } from '../utils/logging-client';

export const getUserByPhone = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const phone = req.params.phone;
    const user = await User.findOne({ where: { phone } });
    
    if (!user) {
      loggingClient.warn('کاربر با شماره موبایل مورد نظر یافت نشد', { 
        phone,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'user_get_by_phone_not_found'
      });
      loggingClient.logPerformance('get_user_by_phone_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('دریافت اطلاعات کاربر با شماره موبایل', { 
      userId: user.id,
      phone,
      ip: req.ip,
      action: 'user_get_by_phone_success'
    });
    loggingClient.logPerformance('get_user_by_phone', Date.now() - startTime);
    res.json(user);
  } catch (error) {
    loggingClient.error('خطا در دریافت اطلاعات کاربر با شماره موبایل', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      phone: req.params.phone,
      ip: req.ip,
      action: 'user_get_by_phone_error'
    });
    loggingClient.logPerformance('get_user_by_phone_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const email = req.params.email;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      loggingClient.warn('کاربر با ایمیل مورد نظر یافت نشد', { 
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'user_get_by_email_not_found'
      });
      loggingClient.logPerformance('get_user_by_email_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('دریافت اطلاعات کاربر با ایمیل', { 
      userId: user.id,
      email,
      ip: req.ip,
      action: 'user_get_by_email_success'
    });
    loggingClient.logPerformance('get_user_by_email', Date.now() - startTime);
    res.json(user);
  } catch (error) {
    loggingClient.error('خطا در دریافت اطلاعات کاربر با ایمیل', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      email: req.params.email,
      ip: req.ip,
      action: 'user_get_by_email_error'
    });
    loggingClient.logPerformance('get_user_by_email_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    loggingClient.info('درخواست ایجاد کاربر جدید', {
      userData: {
        email: req.body.email,
        phone: req.body.phone,
        fullName: req.body.fullName,
        role: req.body.role
      },
      ip: req.ip,
      action: 'user_create_request'
    });
    
    const user = await User.create(req.body);
    
    loggingClient.info('کاربر جدید ایجاد شد', { 
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ip: req.ip,
      action: 'user_create_success'
    });
    loggingClient.logPerformance('create_user', Date.now() - startTime);
    res.status(201).json(user);
  } catch (error) {
    loggingClient.error('خطا در ایجاد کاربر', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userData: {
        email: req.body.email,
        phone: req.body.phone
      },
      ip: req.ip,
      action: 'user_create_error'
    });
    loggingClient.logPerformance('create_user_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در ایجاد کاربر', error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    
    loggingClient.info('درخواست به‌روزرسانی کاربر', {
      userId,
      updateData: {
        email: req.body.email,
        phone: req.body.phone,
        fullName: req.body.fullName,
        role: req.body.role,
        isActive: req.body.isActive
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'user_update_request'
    });
    
    const [updated] = await User.update(req.body, {
      where: { id: userId }
    });
    
    if (!updated) {
      loggingClient.warn('کاربر مورد نظر برای به‌روزرسانی یافت نشد', { 
        userId,
        ip: req.ip,
        action: 'user_update_not_found'
      });
      loggingClient.logPerformance('update_user_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    const user = await User.findByPk(userId);
    
    loggingClient.info('اطلاعات کاربر به‌روزرسانی شد', { 
      userId,
      updatedFields: Object.keys(req.body),
      ip: req.ip,
      action: 'user_update_success'
    });
    loggingClient.logPerformance('update_user', Date.now() - startTime);
    res.json(user);
  } catch (error) {
    loggingClient.error('خطا در به‌روزرسانی کاربر', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.params.id,
      ip: req.ip,
      action: 'user_update_error'
    });
    loggingClient.logPerformance('update_user_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در به‌روزرسانی کاربر', error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      loggingClient.warn('کاربر مورد نظر یافت نشد', { 
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'user_get_by_id_not_found'
      });
      loggingClient.logPerformance('get_user_by_id_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('دریافت اطلاعات کاربر', { 
      userId: user.id,
      ip: req.ip,
      action: 'user_get_by_id_success'
    });
    loggingClient.logPerformance('get_user_by_id', Date.now() - startTime);
    res.json(user);
  } catch (error) {
    loggingClient.error('خطا در دریافت اطلاعات کاربر', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.params.id,
      ip: req.ip,
      action: 'user_get_by_id_error'
    });
    loggingClient.logPerformance('get_user_by_id_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const updateLastLogin = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    
    loggingClient.info('درخواست به‌روزرسانی زمان آخرین ورود', { 
      userId,
      ip: req.ip,
      action: 'user_update_last_login_request'
    });
    
    const [updated] = await User.update(
      { lastLoginAt: new Date() },
      { where: { id: userId } }
    );
    
    if (!updated) {
      loggingClient.warn('کاربر مورد نظر برای به‌روزرسانی زمان آخرین ورود یافت نشد', { 
        userId,
        ip: req.ip,
        action: 'user_update_last_login_not_found'
      });
      loggingClient.logPerformance('update_last_login_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('زمان آخرین ورود کاربر به‌روزرسانی شد', { 
      userId,
      lastLoginAt: new Date().toISOString(),
      ip: req.ip,
      action: 'user_update_last_login_success'
    });
    loggingClient.logPerformance('update_last_login', Date.now() - startTime);
    res.json({ message: 'زمان آخرین ورود به‌روزرسانی شد' });
  } catch (error) {
    loggingClient.error('خطا در به‌روزرسانی زمان آخرین ورود', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.params.id,
      ip: req.ip,
      action: 'user_update_last_login_error'
    });
    loggingClient.logPerformance('update_last_login_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در به‌روزرسانی زمان آخرین ورود', error });
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    const requestUser = req.user?.id;
    
    loggingClient.warn('درخواست غیرفعال‌سازی کاربر', { 
      userId,
      requestedBy: requestUser,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'user_deactivate_request'
    });
    
    const [updated] = await User.update(
      { isActive: false },
      { where: { id: userId } }
    );
    
    if (!updated) {
      loggingClient.warn('کاربر مورد نظر برای غیرفعال‌سازی یافت نشد', { 
        userId,
        ip: req.ip,
        action: 'user_deactivate_not_found'
      });
      loggingClient.logPerformance('deactivate_user_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.warn('کاربر غیرفعال شد', { 
      userId,
      requestedBy: requestUser,
      ip: req.ip,
      action: 'user_deactivated'
    });
    loggingClient.logPerformance('deactivate_user', Date.now() - startTime);
    res.json({ message: 'کاربر غیرفعال شد' });
  } catch (error) {
    loggingClient.error('خطا در غیرفعال کردن کاربر', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.params.id,
      ip: req.ip,
      action: 'user_deactivate_error'
    });
    loggingClient.logPerformance('deactivate_user_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در غیرفعال کردن کاربر', error });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = req.params.id;
    const requestUser = req.user?.id;
    
    loggingClient.info('درخواست فعال‌سازی کاربر', { 
      userId,
      requestedBy: requestUser,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'user_activate_request'
    });
    
    const [updated] = await User.update(
      { isActive: true },
      { where: { id: userId } }
    );
    
    if (!updated) {
      loggingClient.warn('کاربر مورد نظر برای فعال‌سازی یافت نشد', { 
        userId,
        ip: req.ip,
        action: 'user_activate_not_found'
      });
      loggingClient.logPerformance('activate_user_not_found', Date.now() - startTime);
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    
    loggingClient.info('کاربر فعال شد', { 
      userId,
      requestedBy: requestUser,
      ip: req.ip,
      action: 'user_activated'
    });
    loggingClient.logPerformance('activate_user', Date.now() - startTime);
    res.json({ message: 'کاربر فعال شد' });
  } catch (error) {
    loggingClient.error('خطا در فعال کردن کاربر', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.params.id,
      ip: req.ip,
      action: 'user_activate_error'
    });
    loggingClient.logPerformance('activate_user_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطا در فعال کردن کاربر', error });
  }
}; 