import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// گسترش تایپ Request برای اضافه کردن user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      Logger.warn('درخواست بدون توکن');
      throw new Error('توکن نامعتبر');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      Logger.warn('کاربر یافت نشد', { userId: decoded.userId });
      throw new Error('کاربر یافت نشد');
    }

    if (!user.isActive) {
      Logger.warn('حساب کاربری غیرفعال', { userId: user.id });
      return res.status(403).json({ message: 'حساب کاربری غیرفعال است' });
    }

    Logger.info('احراز هویت موفق', { userId: user.id });
    req.user = user;
    next();
  } catch (error) {
    Logger.error('خطا در احراز هویت', { error });
    res.status(401).json({ message: 'لطفاً ابتدا وارد شوید' });
  }
}; 