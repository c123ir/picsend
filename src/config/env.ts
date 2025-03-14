// src/config/env.ts

/**
 * این فایل مدیریت متغیرهای محیطی را متمرکز می‌کند
 * و از وجود مقادیر پیش‌فرض برای تمام متغیرها اطمینان حاصل می‌کند
 */

interface EnvConfig {
  // اطلاعات برنامه
  APP_NAME: string;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // آدرس‌های API
  API_URL: string;
  LOGGING_SERVER_URL: string;
  
  // پورت‌ها
  CLIENT_PORT: number;
  API_PORT: number;
  LOGGING_PORT: number;
  
  // تنظیمات لاگینگ
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_DEBUG_LOGS: boolean;
  
  // تنظیمات سرویس پیامک
  SMS_USERNAME: string;
  SMS_PASSWORD: string;
  SMS_FROM: string;
  SMS_DOMAIN: string;
  SMS_BASE_URL: string;
  SMS_API_URL: string;
  
  // تنظیمات کد تایید
  SMS_VERIFICATION_EXPIRE_TIME: number;
  SMS_MAX_VERIFICATION_ATTEMPTS: number;
  SMS_MAX_DAILY_REQUESTS: number;
  
  // سایر تنظیمات
  SENTRY_DSN: string | null;
}

// دریافت متغیرهای محیطی با مقادیر پیش‌فرض
export const env: EnvConfig = {
  // اطلاعات برنامه
  APP_NAME: import.meta.env.VITE_APP_NAME || 'PicSend',
  NODE_ENV: (import.meta.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  
  // آدرس‌های API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3010',
  LOGGING_SERVER_URL: import.meta.env.VITE_LOGGING_SERVER_URL || 'http://localhost:3015',
  
  // پورت‌ها
  CLIENT_PORT: parseInt(import.meta.env.VITE_CLIENT_PORT || '3005'),
  API_PORT: parseInt(import.meta.env.VITE_PORT || '3010'),
  LOGGING_PORT: parseInt(import.meta.env.VITE_LOGGING_SERVER_PORT || '3015'),
  
  // تنظیمات لاگینگ
  LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error',
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  
  // تنظیمات سرویس پیامک
  SMS_USERNAME: import.meta.env.VITE_SMS_USERNAME || 'zsms8829',
  SMS_PASSWORD: import.meta.env.VITE_SMS_PASSWORD || 'j494moo*O^HU',
  SMS_FROM: import.meta.env.VITE_SMS_FROM || '3000164545',
  SMS_DOMAIN: import.meta.env.VITE_SMS_DOMAIN || '0098',
  SMS_BASE_URL: import.meta.env.VITE_SMS_BASE_URL || 'https://0098sms.com/sendsmslink.aspx',
  SMS_API_URL: import.meta.env.VITE_SMS_API_URL || 'https://0098sms.com/sendsmslink.aspx',
  
  // تنظیمات کد تایید
  SMS_VERIFICATION_EXPIRE_TIME: parseInt(import.meta.env.VITE_SMS_VERIFICATION_EXPIRE_TIME || '120'),
  SMS_MAX_VERIFICATION_ATTEMPTS: parseInt(import.meta.env.VITE_SMS_MAX_VERIFICATION_ATTEMPTS || '3'),
  SMS_MAX_DAILY_REQUESTS: parseInt(import.meta.env.VITE_SMS_MAX_DAILY_REQUESTS || '5'),
  
  // سایر تنظیمات
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || null,
};

/**
 * تابع کمکی برای بررسی مقادیر محیطی در کنسول توسعه‌دهنده
 * تنها در محیط توسعه اجرا می‌شود
 */
export const logEnvVariables = (): void => {
  if (env.NODE_ENV === 'development') {
    console.group('🔧 تنظیمات محیطی:');
    console.log('💻 برنامه:', env.APP_NAME);
    console.log('🌐 آدرس API:', env.API_URL);
    console.log('📝 سرور لاگینگ:', env.LOGGING_SERVER_URL);
    console.log('🔍 سطح لاگ:', env.LOG_LEVEL);
    console.groupEnd();
  }
};

/**
 * بررسی متغیرهای محیطی حساس
 * هشدار در مورد مقادیر پیش‌فرض در محیط تولید
 */
export const validateEnvVariables = (): void => {
  if (env.NODE_ENV === 'production') {
    const warnings: string[] = [];
    
    if (env.SMS_USERNAME === 'zsms8829') {
      warnings.push('نام کاربری پیش‌فرض SMS در محیط تولید استفاده می‌شود');
    }
    
    if (env.SMS_PASSWORD === 'j494moo*O^HU') {
      warnings.push('رمز عبور پیش‌فرض SMS در محیط تولید استفاده می‌شود');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ هشدار تنظیمات محیطی:');
      warnings.forEach(warning => console.warn(`- ${warning}`));
    }
  }
};

export default env;