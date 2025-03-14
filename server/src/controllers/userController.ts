import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import Logger from '../utils/logger';

export const getUserByPhone = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { phone: req.params.phone } });
    if (!user) {
      Logger.warn('کاربر با شماره موبایل مورد نظر یافت نشد', { phone: req.params.phone });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('دریافت اطلاعات کاربر با شماره موبایل', { userId: user.id });
    res.json(user);
  } catch (error) {
    Logger.error('خطا در دریافت اطلاعات کاربر با شماره موبایل', { error, phone: req.params.phone });
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { email: req.params.email } });
    if (!user) {
      Logger.warn('کاربر با ایمیل مورد نظر یافت نشد', { email: req.params.email });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('دریافت اطلاعات کاربر با ایمیل', { userId: user.id });
    res.json(user);
  } catch (error) {
    Logger.error('خطا در دریافت اطلاعات کاربر با ایمیل', { error, email: req.params.email });
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await User.create(req.body);
    Logger.info('کاربر جدید ایجاد شد', { userId: user.id });
    res.status(201).json(user);
  } catch (error) {
    Logger.error('خطا در ایجاد کاربر', { error, userData: req.body });
    res.status(500).json({ message: 'خطا در ایجاد کاربر', error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const [updated] = await User.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      Logger.warn('کاربر مورد نظر برای به‌روزرسانی یافت نشد', { userId: req.params.id });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    const user = await User.findByPk(req.params.id);
    Logger.info('اطلاعات کاربر به‌روزرسانی شد', { userId: req.params.id });
    res.json(user);
  } catch (error) {
    Logger.error('خطا در به‌روزرسانی کاربر', { error, userId: req.params.id });
    res.status(500).json({ message: 'خطا در به‌روزرسانی کاربر', error });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      Logger.warn('کاربر مورد نظر یافت نشد', { userId: req.params.id });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('دریافت اطلاعات کاربر', { userId: user.id });
    res.json(user);
  } catch (error) {
    Logger.error('خطا در دریافت اطلاعات کاربر', { error, userId: req.params.id });
    res.status(500).json({ message: 'خطا در دریافت اطلاعات کاربر', error });
  }
};

export const updateLastLogin = async (req: Request, res: Response) => {
  try {
    const [updated] = await User.update(
      { lastLoginAt: new Date() },
      { where: { id: req.params.id } }
    );
    if (!updated) {
      Logger.warn('کاربر مورد نظر برای به‌روزرسانی زمان آخرین ورود یافت نشد', { userId: req.params.id });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('زمان آخرین ورود کاربر به‌روزرسانی شد', { userId: req.params.id });
    res.json({ message: 'زمان آخرین ورود به‌روزرسانی شد' });
  } catch (error) {
    Logger.error('خطا در به‌روزرسانی زمان آخرین ورود', { error, userId: req.params.id });
    res.status(500).json({ message: 'خطا در به‌روزرسانی زمان آخرین ورود', error });
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const [updated] = await User.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );
    if (!updated) {
      Logger.warn('کاربر مورد نظر برای غیرفعال‌سازی یافت نشد', { userId: req.params.id });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('کاربر غیرفعال شد', { userId: req.params.id });
    res.json({ message: 'کاربر غیرفعال شد' });
  } catch (error) {
    Logger.error('خطا در غیرفعال کردن کاربر', { error, userId: req.params.id });
    res.status(500).json({ message: 'خطا در غیرفعال کردن کاربر', error });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const [updated] = await User.update(
      { isActive: true },
      { where: { id: req.params.id } }
    );
    if (!updated) {
      Logger.warn('کاربر مورد نظر برای فعال‌سازی یافت نشد', { userId: req.params.id });
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    Logger.info('کاربر فعال شد', { userId: req.params.id });
    res.json({ message: 'کاربر فعال شد' });
  } catch (error) {
    Logger.error('خطا در فعال کردن کاربر', { error, userId: req.params.id });
    res.status(500).json({ message: 'خطا در فعال کردن کاربر', error });
  }
}; 