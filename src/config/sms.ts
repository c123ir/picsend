export const SMS_CONFIG = {
  verificationCodeExpireTime: 120, // زمان انقضا به ثانیه
  maxVerificationAttempts: 3, // حداکثر تعداد تلاش برای تایید کد
  maxDailyVerificationRequests: 5, // حداکثر تعداد درخواست کد در روز
  
  // تنظیمات سرویس پیامک
  username: 'zsms8829',
  password: 'j494moo*O^HU',
  from: '3000164545',
  domain: '0098',
  baseUrl: import.meta.env.VITE_SMS_BASE_URL,
} as const;

// کدهای وضعیت پاسخ سرور پیامک
export enum SMSResponseCode {
  SUCCESS = 0,
  INVALID_RECEIVER = 1,
  UNDEFINED_RECEIVER = 2,
  INSUFFICIENT_CREDIT = 9,
  INVALID_CREDENTIALS = 12,
  DAILY_LIMIT_EXCEEDED = 14,
  NO_LINK_PERMISSION = 16,
  SYSTEM_ERROR = -1
}

// پیام‌های متناظر با کدهای وضعیت
export const SMS_ERROR_MESSAGES: Record<number, string> = {
  [SMSResponseCode.SUCCESS]: 'پیامک با موفقیت ارسال شد',
  [SMSResponseCode.INVALID_RECEIVER]: 'شماره گیرنده نامعتبر است',
  [SMSResponseCode.UNDEFINED_RECEIVER]: 'گیرنده تعریف نشده است',
  [SMSResponseCode.INSUFFICIENT_CREDIT]: 'اعتبار پیامک کافی نیست',
  [SMSResponseCode.INVALID_CREDENTIALS]: 'نام کاربری یا رمز عبور اشتباه است',
  [SMSResponseCode.DAILY_LIMIT_EXCEEDED]: 'سقف ارسال روزانه پر شده است',
  [SMSResponseCode.NO_LINK_PERMISSION]: 'عدم مجوز شماره برای ارسال از لینک'
}; 