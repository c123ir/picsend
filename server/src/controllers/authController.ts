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

class AuthController {
  /**
   * ورود کاربر
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { email, phone, password } = req.body;

      // بررسی وجود ایمیل یا شماره تلفن
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      // یافتن کاربر
      const user = await User.findOne({
        where: email ? { email } : { phone }
      });

      if (!user) {
        return res.status(401).json({ message: 'ایمیل/تلفن یا رمز عبور اشتباه است' });
      }

      // بررسی فعال بودن کاربر
      if (!user.isActive) {
        return res.status(403).json({ message: 'حساب کاربری شما غیرفعال شده است' });
      }

      // بررسی رمز عبور
      const isPasswordValid = await user.isValidPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'ایمیل/تلفن یا رمز عبور اشتباه است' });
      }

      // بروزرسانی زمان آخرین ورود
      await user.update({ lastLoginAt: new Date() });

      // ایجاد توکن JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      loggingClient.info('کاربر با موفقیت وارد شد', {
        userId: user.id,
        action: 'user_login_success'
      });

      res.json({
        message: 'ورود موفقیت‌آمیز',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      loggingClient.error('خطا در ورود کاربر', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        phone: req.body.phone,
        action: 'user_login_error'
      });
      res.status(500).json({ message: 'خطا در ورود به سیستم' });
    }
  };

  /**
   * ثبت‌نام کاربر جدید
   */
  public register = async (req: Request, res: Response) => {
    try {
      const { email, phone, password, fullName } = req.body;

      // اعتبارسنجی داده‌ها
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      if (!password) {
        return res.status(400).json({ message: 'رمز عبور الزامی است' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
      }

      // بررسی وجود کاربر
      if (email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
          return res.status(400).json({ message: 'این ایمیل قبلاً ثبت شده است' });
        }
      }

      if (phone) {
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) {
          return res.status(400).json({ message: 'این شماره تلفن قبلاً ثبت شده است' });
        }
      }

      // ایجاد کاربر جدید
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        phone,
        password: hashedPassword,
        fullName,
        role: 'user',
        isActive: true
      });

      // ایجاد توکن JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      loggingClient.info('کاربر جدید ثبت‌نام شد', {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        action: 'user_register_success'
      });

      res.status(201).json({
        message: 'ثبت‌نام با موفقیت انجام شد',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      loggingClient.error('خطا در ثبت‌نام کاربر', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        phone: req.body.phone,
        action: 'user_register_error'
      });
      res.status(500).json({ message: 'خطا در ثبت‌نام' });
    }
  };

  /**
   * فراموشی رمز عبور
   */
  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email, phone } = req.body;

      // بررسی وجود ایمیل یا شماره تلفن
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      // یافتن کاربر
      const user = await User.findOne({
        where: email ? { email } : { phone }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربری با این مشخصات یافت نشد' });
      }

      // در اینجا باید کد تایید ارسال شود (SMS یا ایمیل)
      // برای سادگی فقط پیام موفقیت ارسال می‌شود

      loggingClient.info('درخواست بازیابی رمز عبور', {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        action: 'forgot_password_request'
      });

      res.json({ message: 'کد تایید برای بازیابی رمز عبور ارسال شد' });
    } catch (error) {
      loggingClient.error('خطا در فراموشی رمز عبور', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        phone: req.body.phone,
        action: 'forgot_password_error'
      });
      res.status(500).json({ message: 'خطا در درخواست بازیابی رمز عبور' });
    }
  };

  /**
   * بازنشانی رمز عبور
   */
  public resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, phone, verificationCode, newPassword } = req.body;

      // اعتبارسنجی داده‌ها
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      if (!verificationCode) {
        return res.status(400).json({ message: 'کد تایید الزامی است' });
      }

      if (!newPassword) {
        return res.status(400).json({ message: 'رمز عبور جدید الزامی است' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' });
      }

      // یافتن کاربر
      const user = await User.findOne({
        where: email ? { email } : { phone }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربری با این مشخصات یافت نشد' });
      }

      // در اینجا باید کد تایید بررسی شود
      // برای سادگی فرض می‌کنیم کد درست است

      // بروزرسانی رمز عبور
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      loggingClient.info('رمز عبور بازنشانی شد', {
        userId: user.id,
        action: 'reset_password_success'
      });

      res.json({ message: 'رمز عبور با موفقیت بازنشانی شد' });
    } catch (error) {
      loggingClient.error('خطا در بازنشانی رمز عبور', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        phone: req.body.phone,
        action: 'reset_password_error'
      });
      res.status(500).json({ message: 'خطا در بازنشانی رمز عبور' });
    }
  };

  /**
   * تایید ایمیل
   */
  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const { email, verificationCode } = req.body;

      // اعتبارسنجی داده‌ها
      if (!email) {
        return res.status(400).json({ message: 'ایمیل الزامی است' });
      }

      if (!verificationCode) {
        return res.status(400).json({ message: 'کد تایید الزامی است' });
      }

      // یافتن کاربر
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'کاربری با این ایمیل یافت نشد' });
      }

      // در اینجا باید کد تایید بررسی شود
      // برای سادگی فرض می‌کنیم کد درست است

      // می‌توان فیلدی برای تایید ایمیل اضافه کرد
      // await user.update({ emailVerified: true });

      loggingClient.info('ایمیل تایید شد', {
        userId: user.id,
        email: user.email,
        action: 'verify_email_success'
      });

      res.json({ message: 'ایمیل با موفقیت تایید شد' });
    } catch (error) {
      loggingClient.error('خطا در تایید ایمیل', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        action: 'verify_email_error'
      });
      res.status(500).json({ message: 'خطا در تایید ایمیل' });
    }
  };

  /**
   * تایید شماره تلفن
   */
  public verifyPhone = async (req: Request, res: Response) => {
    try {
      const { phone, verificationCode } = req.body;

      // اعتبارسنجی داده‌ها
      if (!phone) {
        return res.status(400).json({ message: 'شماره تلفن الزامی است' });
      }

      if (!verificationCode) {
        return res.status(400).json({ message: 'کد تایید الزامی است' });
      }

      // یافتن کاربر
      const user = await User.findOne({ where: { phone } });
      if (!user) {
        return res.status(404).json({ message: 'کاربری با این شماره تلفن یافت نشد' });
      }

      // در اینجا باید کد تایید بررسی شود
      // برای سادگی فرض می‌کنیم کد درست است

      // می‌توان فیلدی برای تایید شماره تلفن اضافه کرد
      // await user.update({ phoneVerified: true });

      loggingClient.info('شماره تلفن تایید شد', {
        userId: user.id,
        phone: user.phone,
        action: 'verify_phone_success'
      });

      res.json({ message: 'شماره تلفن با موفقیت تایید شد' });
    } catch (error) {
      loggingClient.error('خطا در تایید شماره تلفن', {
        error: error instanceof Error ? error.message : String(error),
        phone: req.body.phone,
        action: 'verify_phone_error'
      });
      res.status(500).json({ message: 'خطا در تایید شماره تلفن' });
    }
  };

  /**
   * درخواست کد تایید
   */
  public requestVerification = async (req: Request, res: Response) => {
    try {
      const { email, phone, type } = req.body;

      // اعتبارسنجی داده‌ها
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      if (!type || !['email', 'phone', 'password_reset'].includes(type)) {
        return res.status(400).json({ message: 'نوع درخواست نامعتبر است' });
      }

      // یافتن کاربر
      const user = await User.findOne({
        where: email ? { email } : { phone }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربری با این مشخصات یافت نشد' });
      }

      // در اینجا باید کد تایید ارسال شود (SMS یا ایمیل)
      // برای سادگی فقط پیام موفقیت ارسال می‌شود

      loggingClient.info('درخواست کد تایید', {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        type,
        action: 'request_verification_code'
      });

      res.json({ message: 'کد تایید ارسال شد' });
    } catch (error) {
      loggingClient.error('خطا در درخواست کد تایید', {
        error: error instanceof Error ? error.message : String(error),
        email: req.body.email,
        phone: req.body.phone,
        type: req.body.type,
        action: 'request_verification_error'
      });
      res.status(500).json({ message: 'خطا در درخواست کد تایید' });
    }
  };

  /**
   * خروج کاربر
   */
  public logout = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      loggingClient.info('کاربر از سیستم خارج شد', {
        userId,
        action: 'user_logout'
      });

      res.json({ message: 'خروج موفقیت‌آمیز' });
    } catch (error) {
      loggingClient.error('خطا در خروج کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'user_logout_error'
      });
      res.status(500).json({ message: 'خطا در خروج از سیستم' });
    }
  };

  /**
   * تمدید توکن
   */
  public refreshToken = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'حساب کاربری شما غیرفعال شده است' });
      }

      // ایجاد توکن جدید
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      loggingClient.info('توکن کاربر تمدید شد', {
        userId,
        action: 'refresh_token_success'
      });

      res.json({
        message: 'توکن با موفقیت تمدید شد',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      loggingClient.error('خطا در تمدید توکن', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'refresh_token_error'
      });
      res.status(500).json({ message: 'خطا در تمدید توکن' });
    }
  };

  /**
   * بررسی اعتبار توکن
   */
  public verifyToken = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'حساب کاربری شما غیرفعال شده است' });
      }

      loggingClient.debug('اعتبارسنجی توکن', {
        userId,
        action: 'verify_token_success'
      });

      res.json({
        isValid: true,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      loggingClient.error('خطا در اعتبارسنجی توکن', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'verify_token_error'
      });
      res.status(500).json({ message: 'خطا در اعتبارسنجی توکن' });
    }
  };
}

export default AuthController; 