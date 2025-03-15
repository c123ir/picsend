import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { loggingClient } from '../utils/logging-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

const verificationCodes = new Map<string, VerificationCode>();

export const sendVerificationCode = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { phone } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!phone) {
      loggingClient.warn('درخواست کد تایید بدون شماره تلفن', { 
        ip, 
        userAgent,
        action: 'verification_code_missing_phone'
      });
      return res.status(400).json({ message: 'شماره تلفن الزامی است' });
    }

    // تولید کد تصادفی 4 رقمی
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // ذخیره کد با زمان انقضا (2 دقیقه) و تعداد تلاش‌ها
    verificationCodes.set(phone, {
      code,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      attempts: 0
    });

    loggingClient.info('کد تایید ایجاد شد', { 
      phone, 
      code, 
      ip, 
      userAgent,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      action: 'verification_code_generated'
    });

    // در محیط توسعه، کد را در پاسخ برمی‌گردانیم
    if (process.env.NODE_ENV === 'development') {
      loggingClient.logPerformance('send_verification_code', Date.now() - startTime);
      return res.json({ message: 'کد تایید ارسال شد', code });
    }

    loggingClient.logPerformance('send_verification_code', Date.now() - startTime);
    res.json({ message: 'کد تایید ارسال شد' });
  } catch (error) {
    loggingClient.error('خطا در ارسال کد تایید', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : 'No stack trace',
      phone: req.body.phone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'verification_code_error'
    });
    loggingClient.logPerformance('send_verification_code_error', Date.now() - startTime);
    res.status(500).json({ message: 'خطای سرور' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { phone, code } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    if (!phone || !code) {
      loggingClient.warn('درخواست تایید کد ناقص', { 
        phone, 
        code: code ? 'provided' : 'missing',
        ip,
        userAgent,
        action: 'verify_code_missing_params'
      });
      return res.status(400).json({ message: 'شماره تلفن و کد الزامی هستند' });
    }

    const verification = verificationCodes.get(phone);
    
    if (!verification) {
      loggingClient.warn('کد تایید یافت نشد', { 
        phone, 
        ip,
        userAgent,
        action: 'verify_code_not_found'
      });
      return res.status(400).json({ message: 'کد تایید منقضی شده است' });
    }

    if (verification.expiresAt < new Date()) {
      loggingClient.warn('کد تایید منقضی شده', { 
        phone, 
        ip,
        userAgent,
        expiredAt: verification.expiresAt.toISOString(),
        action: 'verify_code_expired'
      });
      verificationCodes.delete(phone);
      return res.status(400).json({ message: 'کد تایید منقضی شده است' });
    }

    if (verification.attempts >= 3) {
      loggingClient.warn('تعداد تلاش‌های مجاز به پایان رسیده', { 
        phone, 
        attempts: verification.attempts,
        ip,
        userAgent,
        action: 'verify_code_too_many_attempts'
      });
      verificationCodes.delete(phone);
      return res.status(400).json({ message: 'تعداد تلاش‌های مجاز به پایان رسیده است' });
    }

    verification.attempts++;

    if (verification.code !== code) {
      loggingClient.warn('کد تایید نادرست', { 
        phone, 
        attempts: verification.attempts,
        ip,
        userAgent,
        providedCode: code,
        expectedCode: verification.code,
        action: 'verify_code_invalid'
      });
      return res.status(400).json({ message: 'کد تایید نامعتبر است' });
    }

    // حذف کد تایید پس از استفاده موفق
    verificationCodes.delete(phone);

    try {
      // بررسی وجود کاربر یا ایجاد کاربر جدید
      let user = await User.findOne({ where: { phone } });
      
      if (!user) {
        loggingClient.info('ایجاد کاربر جدید', { 
          phone, 
          ip,
          userAgent,
          action: 'user_create_from_verification'
        });
        user = await User.create({
          phone,
          isActive: true,
          lastLoginAt: new Date()
        });
      } else {
        loggingClient.info('بروزرسانی زمان آخرین ورود کاربر', { 
          userId: user.id,
          phone,
          ip,
          userAgent,
          action: 'user_login_update_time'
        });
        await User.update(
          { lastLoginAt: new Date() },
          { where: { id: user.id } }
        );
      }

      // ایجاد توکن JWT
      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      loggingClient.info('ورود موفق با کد تایید', { 
        userId: user.id,
        phone,
        ip,
        userAgent,
        tokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'login_success_verification'
      });

      loggingClient.logPerformance('verify_code', Date.now() - startTime);
      return res.json({
        message: 'ورود موفقیت‌آمیز',
        token,
        user
      });
    } catch (dbError: any) {
      loggingClient.error('خطا در عملیات پایگاه داده', { 
        error: dbError.message,
        stack: dbError.stack,
        phone,
        ip,
        userAgent,
        action: 'database_error_verification'
      });
      loggingClient.logPerformance('verify_code_db_error', Date.now() - startTime);
      return res.status(500).json({ 
        message: 'خطا در ذخیره‌سازی اطلاعات کاربر',
        error: dbError.message 
      });
    }
  } catch (error: any) {
    loggingClient.error('خطا در تایید کد', { 
      error: error.message,
      stack: error.stack,
      phone: req.body.phone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'verify_code_error'
    });
    loggingClient.logPerformance('verify_code_error', Date.now() - startTime);
    return res.status(500).json({ 
      message: 'خطای سرور',
      error: error.message 
    });
  }
};

// لاگین با نام کاربری
export const loginWithUsername = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { username, password } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    if (!username || !password) {
      loggingClient.warn('درخواست لاگین ناقص', { 
        username: username || 'missing',
        passwordProvided: !!password,
        ip,
        userAgent,
        action: 'login_missing_params'
      });
      return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی هستند' });
    }

    // جستجوی کاربر با نام کاربری
    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      loggingClient.warn('کاربر یافت نشد', { 
        username,
        ip,
        userAgent,
        action: 'login_user_not_found'
      });
      loggingClient.logPerformance('login_user_not_found', Date.now() - startTime);
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است' });
    }

    // بررسی رمز عبور
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      loggingClient.warn('رمز عبور نادرست', { 
        userId: user.id,
        username,
        ip,
        userAgent,
        action: 'login_invalid_password'
      });
      loggingClient.logPerformance('login_invalid_password', Date.now() - startTime);
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است' });
    }

    // به‌روزرسانی زمان آخرین ورود
    await User.update(
      { lastLoginAt: new Date() },
      { where: { id: user.id } }
    );

    // ایجاد توکن JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    loggingClient.info('ورود موفق با نام کاربری', { 
      userId: user.id,
      username,
      ip,
      userAgent,
      tokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'login_success_username'
    });

    loggingClient.logPerformance('login_with_username', Date.now() - startTime);
    return res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    loggingClient.error('خطا در لاگین با نام کاربری', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      username: req.body.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'login_error'
    });
    loggingClient.logPerformance('login_with_username_error', Date.now() - startTime);
    return res.status(500).json({ message: 'خطای سرور' });
  }
}; 