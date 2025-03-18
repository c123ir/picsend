import { Request, Response, NextFunction } from 'express';
import { loggingClient } from '../utils/logging-client';

/**
 * میدلور لاگینگ برای ثبت تمامی درخواست‌ها و پاسخ‌ها
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // لاگ اطلاعات درخواست
  const requestInfo = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: (req as any).user?.id,
    role: (req as any).user?.role
  };
  
  loggingClient.info('درخواست دریافت شد', {
    ...requestInfo,
    action: 'request_received'
  });
  
  // تغییر متد send برای لاگ کردن پاسخ
  const originalSend = res.send;
  res.send = function(body?: any): Response {
    const duration = Date.now() - startTime;
    
    const responseInfo = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id
    };
    
    // لاگ اطلاعات پاسخ با سطح مناسب بر اساس کد وضعیت
    if (res.statusCode >= 500) {
      loggingClient.error('پاسخ خطای سرور', {
        ...responseInfo,
        action: 'server_error_response'
      });
    } else if (res.statusCode >= 400) {
      loggingClient.warn('پاسخ خطای درخواست', {
        ...responseInfo,
        action: 'client_error_response'
      });
    } else {
      loggingClient.info('پاسخ موفق', {
        ...responseInfo,
        action: 'success_response'
      });
    }
    
    // ثبت زمان اجرا برای بهینه‌سازی
    loggingClient.logPerformance(`${req.method} ${req.path}`, duration);
    
    // بازگرداندن رفتار اصلی متد send
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * حذف اطلاعات حساس از بدنه درخواست برای لاگینگ
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return undefined;
  
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'apiKey', 'credit_card', 'creditCard'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
} 