import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface VerificationCode {
  code: string;
  expiresAt: Date;
  attempts: number;
}

const verificationCodes = new Map<string, VerificationCode>();

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      Logger.warn('درخواست کد تایید بدون شماره تلفن', { phone });
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

    Logger.info('کد تایید ایجاد شد', { phone, code });

    // در محیط توسعه، کد را در پاسخ برمی‌گردانیم
    if (process.env.NODE_ENV === 'development') {
      return res.json({ message: 'کد تایید ارسال شد', code });
    }

    res.json({ message: 'کد تایید ارسال شد' });
  } catch (error) {
    Logger.error('خطا در ارسال کد تایید', { error, phone: req.body.phone });
    res.status(500).json({ message: 'خطای سرور' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      Logger.warn('درخواست تایید کد ناقص', { phone, code });
      return res.status(400).json({ message: 'شماره تلفن و کد الزامی هستند' });
    }

    const verification = verificationCodes.get(phone);
    
    if (!verification) {
      Logger.warn('کد تایید یافت نشد', { phone });
      return res.status(400).json({ message: 'کد تایید منقضی شده است' });
    }

    if (verification.expiresAt < new Date()) {
      Logger.warn('کد تایید منقضی شده', { phone });
      verificationCodes.delete(phone);
      return res.status(400).json({ message: 'کد تایید منقضی شده است' });
    }

    if (verification.attempts >= 3) {
      Logger.warn('تعداد تلاش‌های مجاز به پایان رسیده', { phone, attempts: verification.attempts });
      verificationCodes.delete(phone);
      return res.status(400).json({ message: 'تعداد تلاش‌های مجاز به پایان رسیده است' });
    }

    verification.attempts++;

    if (verification.code !== code) {
      Logger.warn('کد تایید نادرست', { phone, attempts: verification.attempts });
      return res.status(400).json({ message: 'کد تایید نامعتبر است' });
    }

    // حذف کد تایید پس از استفاده موفق
    verificationCodes.delete(phone);

    try {
      // بررسی وجود کاربر یا ایجاد کاربر جدید
      let user = await User.findOne({ where: { phone } });
      
      if (!user) {
        Logger.info('ایجاد کاربر جدید', { phone });
        user = await User.create({
          phone,
          isActive: true,
          lastLoginAt: new Date()
        });
      } else {
        Logger.info('بروزرسانی زمان آخرین ورود کاربر', { userId: user.id });
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

      Logger.info('ورود موفق با کد تایید', { userId: user.id });

      return res.json({
        message: 'ورود موفقیت‌آمیز',
        token,
        user
      });
    } catch (dbError: any) {
      Logger.error('خطا در عملیات پایگاه داده', { error: dbError, phone });
      return res.status(500).json({ 
        message: 'خطا در ذخیره‌سازی اطلاعات کاربر',
        error: dbError.message 
      });
    }
  } catch (error: any) {
    Logger.error('خطا در تایید کد', { error, phone: req.body.phone });
    return res.status(500).json({ 
      message: 'خطای سرور',
      error: error.message 
    });
  }
};

// لاگین با نام کاربری
export const loginWithUsername = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      Logger.warn('درخواست لاگین ناقص', { username });
      return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی هستند' });
    }

    // جستجوی کاربر با نام کاربری
    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      Logger.warn('کاربر یافت نشد', { username });
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور نادرست است' });
    }

    // بررسی رمز عبور
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      Logger.warn('رمز عبور نادرست', { userId: user.id });
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

    Logger.info('ورود موفق با نام کاربری', { userId: user.id });

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
    Logger.error('خطا در لاگین با نام کاربری', { error, username: req.body.username });
    return res.status(500).json({ message: 'خطای سرور' });
  }
}; 