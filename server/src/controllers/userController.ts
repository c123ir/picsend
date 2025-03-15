import { Request, Response } from 'express';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import { loggingClient } from '../utils/logging-client';

class UserController {
  /**
   * دریافت پروفایل عمومی کاربر
   */
  public getUserProfile = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: ['id', 'fullName', 'avatar', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      res.json(user);
    } catch (error) {
      loggingClient.error('خطا در دریافت پروفایل کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'get_user_profile_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
    }
  };

  /**
   * دریافت پروفایل کاربر لاگین شده
   */
  public getMyProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      res.json(user);
    } catch (error) {
      loggingClient.error('خطا در دریافت پروفایل کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'get_my_profile_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
    }
  };

  /**
   * بروزرسانی پروفایل کاربر لاگین شده
   */
  public updateMyProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { fullName, avatar } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      await user.update({ fullName, avatar });

      res.json({
        message: 'پروفایل با موفقیت بروزرسانی شد',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          avatar: user.avatar
        }
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی پروفایل کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'update_my_profile_error'
      });
      res.status(500).json({ message: 'خطا در بروزرسانی اطلاعات کاربر' });
    }
  };

  /**
   * تغییر رمز عبور کاربر لاگین شده
   */
  public changePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      // اعتبارسنجی
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'رمز عبور فعلی و جدید الزامی است' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      // بررسی رمز عبور فعلی
      const isPasswordValid = await user.isValidPassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'رمز عبور فعلی اشتباه است' });
      }

      // بروزرسانی رمز عبور
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      res.json({ message: 'رمز عبور با موفقیت تغییر کرد' });
    } catch (error) {
      loggingClient.error('خطا در تغییر رمز عبور', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'change_password_error'
      });
      res.status(500).json({ message: 'خطا در تغییر رمز عبور' });
    }
  };

  /**
   * حذف حساب کاربری توسط خود کاربر
   */
  public deleteMyAccount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      await user.destroy();

      res.json({ message: 'حساب کاربری با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف حساب کاربری', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'delete_my_account_error'
      });
      res.status(500).json({ message: 'خطا در حذف حساب کاربری' });
    }
  };

  /**
   * دریافت همه کاربران (فقط برای ادمین)
   */
  public getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] }
      });

      res.json(users);
    } catch (error) {
      loggingClient.error('خطا در دریافت لیست کاربران', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'get_all_users_error'
      });
      res.status(500).json({ message: 'خطا در دریافت لیست کاربران' });
    }
  };

  /**
   * ایجاد کاربر جدید (فقط برای ادمین)
   */
  public createUser = async (req: Request, res: Response) => {
    try {
      const { email, phone, password, fullName, role } = req.body;

      // اعتبارسنجی
      if (!email && !phone) {
        return res.status(400).json({ message: 'ایمیل یا شماره تلفن الزامی است' });
      }

      if (!password) {
        return res.status(400).json({ message: 'رمز عبور الزامی است' });
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
        role: role || 'user',
        isActive: true
      });

      res.status(201).json({
        message: 'کاربر با موفقیت ایجاد شد',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      loggingClient.error('خطا در ایجاد کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'create_user_error'
      });
      res.status(500).json({ message: 'خطا در ایجاد کاربر' });
    }
  };

  /**
   * دریافت اطلاعات کاربر با شناسه (فقط برای ادمین)
   */
  public getUserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      res.json(user);
    } catch (error) {
      loggingClient.error('خطا در دریافت اطلاعات کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'get_user_by_id_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر' });
    }
  };

  /**
   * بروزرسانی کاربر (فقط برای ادمین)
   */
  public updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { email, phone, fullName, role, isActive } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      // بروزرسانی کاربر
      await user.update({
        email,
        phone,
        fullName,
        role,
        isActive
      });

      res.json({
        message: 'کاربر با موفقیت بروزرسانی شد',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'update_user_error'
      });
      res.status(500).json({ message: 'خطا در بروزرسانی کاربر' });
    }
  };

  /**
   * حذف کاربر (فقط برای ادمین)
   */
  public deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      // بررسی که کاربر ادمین آخر نباشد
      if (user.role === 'admin') {
        const adminCount = await User.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'نمی‌توان آخرین کاربر ادمین را حذف کرد' });
        }
      }

      await user.destroy();

      res.json({ message: 'کاربر با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'delete_user_error'
      });
      res.status(500).json({ message: 'خطا در حذف کاربر' });
    }
  };

  /**
   * فعال کردن کاربر (فقط برای ادمین)
   */
  public activateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      await user.update({ isActive: true });

      res.json({ message: 'کاربر با موفقیت فعال شد' });
    } catch (error) {
      loggingClient.error('خطا در فعال‌سازی کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'activate_user_error'
      });
      res.status(500).json({ message: 'خطا در فعال‌سازی کاربر' });
    }
  };

  /**
   * غیرفعال کردن کاربر (فقط برای ادمین)
   */
  public deactivateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      // بررسی که کاربر ادمین آخر نباشد
      if (user.role === 'admin') {
        const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'نمی‌توان آخرین کاربر ادمین فعال را غیرفعال کرد' });
        }
      }

      await user.update({ isActive: false });

      res.json({ message: 'کاربر با موفقیت غیرفعال شد' });
    } catch (error) {
      loggingClient.error('خطا در غیرفعال‌سازی کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.params.id,
        action: 'deactivate_user_error'
      });
      res.status(500).json({ message: 'خطا در غیرفعال‌سازی کاربر' });
    }
  };
}

export default UserController; 