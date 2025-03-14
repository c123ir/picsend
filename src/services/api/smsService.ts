// src/services/api/smsService.ts
import axios from 'axios';
import { convertPersianToEnglishNumbers } from '../../utils/stringUtils';
import { loggingClient } from '../../utils/loggingClient';
import env from '../../config/env';

interface SendSMSResponse {
  success: boolean;
  message: string;
  code?: string; // تنها در محیط توسعه استفاده می‌شود
}

interface VerifyResponse {
  isValid: boolean;
  token?: string;
  message: string;
}

class SMSService {
  private static readonly STORAGE_PREFIX = 'picsend_verification_';
  private static readonly SMS_CONFIG = {
    username: env.SMS_USERNAME,
    password: env.SMS_PASSWORD,
    from: env.SMS_FROM,
    domain: env.SMS_DOMAIN,
    baseUrl: env.SMS_BASE_URL,
    expireTime: env.SMS_VERIFICATION_EXPIRE_TIME,
    maxAttempts: env.SMS_MAX_VERIFICATION_ATTEMPTS,
    maxDaily: env.SMS_MAX_DAILY_REQUESTS
  };

  // بررسی محدودیت درخواست روزانه
  private static checkDailyLimit(phone: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `${this.STORAGE_PREFIX}daily_${phone}`;
    
    try {
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) {
        localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 1 }));
        return true;
      }
      
      const data = JSON.parse(storedData);
      if (data.date !== today) {
        localStorage.setItem(storageKey, JSON.stringify({ date: today, count: 1 }));
        return true;
      }
      
      if (data.count >= this.SMS_CONFIG.maxDaily) {
        loggingClient.warn('محدودیت درخواست روزانه برای شماره', { phone });
        return false;
      }
      
      data.count += 1;
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      loggingClient.error('خطا در بررسی محدودیت روزانه', { error });
      return true; // در صورت خطا، اجازه ارسال داده شود
    }
  }

  // ذخیره کد تایید در localStorage
  private static storeVerificationCode(phone: string, code: string): void {
    const storageKey = `${this.STORAGE_PREFIX}${phone}`;
    const expiresAt = Date.now() + (this.SMS_CONFIG.expireTime * 1000);
    
    const verificationData = {
      code,
      expiresAt,
      attempts: 0
    };
    
    localStorage.setItem(storageKey, JSON.stringify(verificationData));
    loggingClient.debug('کد تایید ذخیره شد', { phone });
  }

  // دریافت اطلاعات کد تایید از localStorage
  private static getVerificationData(phone: string): { code: string; expiresAt: number; attempts: number } | null {
    const storageKey = `${this.STORAGE_PREFIX}${phone}`;
    
    try {
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return null;
      
      return JSON.parse(storedData);
    } catch (error) {
      loggingClient.error('خطا در خواندن داده کد تایید', { error, phone });
      return null;
    }
  }

  // حذف داده کد تایید
  private static removeVerificationData(phone: string): void {
    const storageKey = `${this.STORAGE_PREFIX}${phone}`;
    localStorage.removeItem(storageKey);
  }

  // تولید کد تصادفی
  private static generateVerificationCode(length = 4): string {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
  }

  // ارسال پیامک از طریق API
  private static async sendSMSViaAPI(phone: string, message: string): Promise<boolean> {
    try {
      // تبدیل شماره به فرمت صحیح
      phone = convertPersianToEnglishNumbers(phone);
      if (!phone.startsWith('0')) phone = '0' + phone;
      
      const params = {
        FROM: this.SMS_CONFIG.from,
        TO: phone,
        TEXT: message,
        USERNAME: this.SMS_CONFIG.username,
        PASSWORD: this.SMS_CONFIG.password,
        DOMAIN: this.SMS_CONFIG.domain
      };
      
      loggingClient.debug('درحال ارسال پیامک', { phone });
      
      const response = await axios.get(this.SMS_CONFIG.baseUrl, { params });
      
      // بررسی پاسخ API
      const result = response.data.toString().trim();
      const responseCode = parseInt(result);
      
      if (responseCode === 0) {
        loggingClient.info('پیامک با موفقیت ارسال شد', { phone });
        return true;
      } else {
        loggingClient.error('خطا در ارسال پیامک', { 
          phone, 
          responseCode, 
          response: response.data 
        });
        return false;
      }
    } catch (error) {
      loggingClient.error('خطا در ارسال پیامک', { phone, error });
      return false;
    }
  }

  // ارسال کد تایید
  public static async sendVerificationCode(phone: string): Promise<SendSMSResponse> {
    try {
      // بررسی فرمت شماره موبایل
      phone = convertPersianToEnglishNumbers(phone);
      if (!phone.match(/^(0|98|\+98)?9\d{9}$/)) {
        return { 
          success: false, 
          message: 'شماره موبایل نامعتبر است' 
        };
      }
      
      // اگر با 98 یا +98 شروع شود، به 0 تبدیل می‌شود
      if (phone.startsWith('98')) phone = '0' + phone.substring(2);
      if (phone.startsWith('+98')) phone = '0' + phone.substring(3);
      
      // بررسی محدودیت روزانه
      if (!this.checkDailyLimit(phone)) {
        return { 
          success: false, 
          message: 'محدودیت درخواست روزانه. لطفاً فردا دوباره تلاش کنید' 
        };
      }
      
      // تولید کد تایید
      const code = this.generateVerificationCode();
      
      // ذخیره در localStorage
      this.storeVerificationCode(phone, code);
      
      // متن پیامک
      const text = `کد تایید شما در سامانه ${env.APP_NAME}: ${code}`;
      
      // در محیط توسعه، پیامک واقعاً ارسال نمی‌شود
      if (env.NODE_ENV === 'development') {
        console.log(`DEV MODE: کد تایید برای ${phone}: ${code}`);
        return { 
          success: true, 
          message: 'کد تایید ارسال شد (حالت توسعه)', 
          code // فقط در محیط توسعه کد برگردانده می‌شود
        };
      }
      
      // ارسال واقعی پیامک در محیط تولید
      const sendResult = await this.sendSMSViaAPI(phone, text);
      
      if (sendResult) {
        return { 
          success: true, 
          message: 'کد تایید ارسال شد' 
        };
      } else {
        this.removeVerificationData(phone);
        return { 
          success: false, 
          message: 'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید' 
        };
      }
    } catch (error) {
      loggingClient.error('خطا در سرویس ارسال کد تایید', { phone, error });
      return { 
        success: false, 
        message: 'خطای سیستمی. لطفاً دوباره تلاش کنید' 
      };
    }
  }

  // تایید کد دریافتی
  public static verifyCode(phone: string, code: string): VerifyResponse {
    try {
      phone = convertPersianToEnglishNumbers(phone);
      code = convertPersianToEnglishNumbers(code);
      
      // یکسان‌سازی فرمت شماره
      if (phone.startsWith('98')) phone = '0' + phone.substring(2);
      if (phone.startsWith('+98')) phone = '0' + phone.substring(3);
      
      const verificationData = this.getVerificationData(phone);
      
      if (!verificationData) {
        loggingClient.warn('تلاش برای تایید کد بدون ارسال قبلی', { phone });
        return { 
          isValid: false, 
          message: 'کد تایید یافت نشد یا منقضی شده است' 
        };
      }
      
      // بررسی منقضی شدن
      if (Date.now() > verificationData.expiresAt) {
        this.removeVerificationData(phone);
        loggingClient.info('کد تایید منقضی شده', { phone });
        return { 
          isValid: false, 
          message: 'کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید' 
        };
      }
      
      // بررسی تعداد تلاش
      if (verificationData.attempts >= this.SMS_CONFIG.maxAttempts) {
        this.removeVerificationData(phone);
        loggingClient.warn('تعداد تلاش بیش از حد مجاز', { phone });
        return { 
          isValid: false, 
          message: 'تعداد تلاش بیش از حد مجاز. لطفاً کد جدید دریافت کنید' 
        };
      }
      
      // افزایش تعداد تلاش
      verificationData.attempts++;
      localStorage.setItem(`${this.STORAGE_PREFIX}${phone}`, JSON.stringify(verificationData));
      
      // بررسی صحت کد
      if (verificationData.code !== code) {
        loggingClient.info('کد تایید نادرست', { 
          phone, attempts: verificationData.attempts 
        });
        return { 
          isValid: false, 
          message: 'کد تایید نادرست است' 
        };
      }
      
      // کد صحیح است
      this.removeVerificationData(phone);
      
      // تولید توکن (در نسخه واقعی باید از سرور دریافت شود)
      const mockToken = btoa(`${phone}-${Date.now()}-${Math.random()}`);
      
      loggingClient.info('کد تایید موفق', { phone });
      
      return { 
        isValid: true, 
        token: mockToken,
        message: 'کد تایید صحیح است' 
      };
    } catch (error) {
      loggingClient.error('خطا در تایید کد', { phone, error });
      return { 
        isValid: false, 
        message: 'خطای سیستمی. لطفاً دوباره تلاش کنید' 
      };
    }
  }
}

export const smsService = SMSService;