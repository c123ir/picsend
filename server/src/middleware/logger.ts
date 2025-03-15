import { Request, Response, NextFunction } from 'express';
import { loggingClient } from '../utils/logging-client';

/**
 * میدل‌ور لاگینگ برای ثبت تمام درخواست‌ها و پاسخ‌ها
 */
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // ثبت زمان شروع درخواست
  const startTime = Date.now();
  
  // لاگ کردن اطلاعات درخواست
  loggingClient.info('درخواست جدید', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });
  
  // ذخیره متد اصلی end برای استفاده بعدی
  const originalEnd = res.end;
  
  // جایگزینی متد end برای ثبت اطلاعات پاسخ
  // @ts-ignore - نادیده گرفتن خطای تایپ
  res.end = function (...args: any[]) {
    // محاسبه زمان پاسخ
    const responseTime = Date.now() - startTime;
    
    // ثبت اطلاعات پاسخ
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    loggingClient[logLevel]('پاسخ به درخواست', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id || 'anonymous'
    });
    
    // فراخوانی متد اصلی end
    return originalEnd.apply(res, args);
  };
  
  next();
};

export default loggerMiddleware; 