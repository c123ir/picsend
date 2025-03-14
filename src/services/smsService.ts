import axios from 'axios';
import { SMS_CONFIG, SMSResponseCode, SMS_ERROR_MESSAGES } from '../config/sms';

interface SendSMSResponse {
  success: boolean;
  code: SMSResponseCode;
  message: string;
}

interface VerificationAttempt {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface DailyVerificationLimit {
  count: number;
  date: string;
}

export class SMSService {
  private static instance: SMSService;
  private verificationAttempts: Map<string, VerificationAttempt>;
  private dailyVerificationLimits: Map<string, DailyVerificationLimit>;

  private constructor() {
    this.verificationAttempts = new Map();
    this.dailyVerificationLimits = new Map();
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * ارسال پیامک به شماره موبایل
   * @param to شماره موبایل گیرنده
   * @param text متن پیامک
   */
  public async sendSMS(to: string, text: string): Promise<SendSMSResponse> {
    try {
      const params = new URLSearchParams({
        FROM: SMS_CONFIG.from,
        TO: to,
        TEXT: text,
        USERNAME: SMS_CONFIG.username,
        PASSWORD: SMS_CONFIG.password,
        DOMAIN: SMS_CONFIG.domain
      });

      // استفاده از fetch به جای JSONP
      const response = await fetch(`${SMS_CONFIG.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('خطا در ارسال پیامک');
      }

      const data = await response.text();
      const code = parseInt(data);

      if (code === SMSResponseCode.SUCCESS) {
        return {
          success: true,
          code: code as SMSResponseCode,
          message: SMS_ERROR_MESSAGES[code] || 'خطای ناشناخته'
        };
      }

      throw new Error(code.toString());
    } catch (error) {
      console.error('خطا در ارسال پیامک:', error);
      return {
        success: false,
        code: SMSResponseCode.SYSTEM_ERROR,
        message: 'خطا در ارسال پیامک'
      };
    }
  }

  /**
   * بررسی محدودیت تعداد درخواست روزانه
   */
  private checkDailyLimit(phone: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const limit = this.dailyVerificationLimits.get(phone);

    if (!limit || limit.date !== today) {
      this.dailyVerificationLimits.set(phone, { count: 1, date: today });
      return true;
    }

    if (limit.count >= SMS_CONFIG.maxDailyVerificationRequests) {
      return false;
    }

    limit.count += 1;
    this.dailyVerificationLimits.set(phone, limit);
    return true;
  }

  /**
   * ارسال کد تایید به شماره موبایل
   */
  public async sendVerificationCode(phone: string): Promise<SendSMSResponse> {
    // بررسی محدودیت روزانه
    if (!this.checkDailyLimit(phone)) {
      return {
        success: false,
        code: SMSResponseCode.DAILY_LIMIT_EXCEEDED,
        message: 'محدودیت تعداد درخواست روزانه'
      };
    }

    const code = this.generateVerificationCode();
    const expiresAt = Date.now() + (SMS_CONFIG.verificationCodeExpireTime * 1000);
    
    const response = await this.sendSMS(phone, `کد تایید شما: ${code}\nپیکسند`);
    
    if (response.success) {
      this.verificationAttempts.set(phone, {
        code,
        expiresAt,
        attempts: 0
      });
    }

    return response;
  }

  /**
   * تایید کد ارسال شده
   */
  public verifyCode(phone: string, code: string): { isValid: boolean; message: string } {
    const attempt = this.verificationAttempts.get(phone);

    if (!attempt) {
      return {
        isValid: false,
        message: 'کد تایید برای این شماره ارسال نشده است'
      };
    }

    if (Date.now() > attempt.expiresAt) {
      this.verificationAttempts.delete(phone);
      return {
        isValid: false,
        message: 'کد تایید منقضی شده است'
      };
    }

    if (attempt.attempts >= SMS_CONFIG.maxVerificationAttempts) {
      this.verificationAttempts.delete(phone);
      return {
        isValid: false,
        message: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است'
      };
    }

    attempt.attempts += 1;
    this.verificationAttempts.set(phone, attempt);

    const isValid = attempt.code === code;
    if (isValid) {
      this.verificationAttempts.delete(phone);
    }

    return {
      isValid,
      message: isValid ? 'کد تایید صحیح است' : 'کد تایید نادرست است'
    };
  }

  /**
   * تولید کد تایید تصادفی
   */
  private generateVerificationCode(length: number = 6): string {
    return Math.random()
      .toString()
      .slice(2, 2 + length);
  }
} 