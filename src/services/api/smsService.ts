import axios from 'axios';

interface SendSMSResponse {
  success: boolean;
  message: string;
}

interface SMSResponse {
  status: 'success' | 'error';
  code?: number;
  message?: string;
}

const SMS_CONFIG = {
  username: 'zsms8829',
  password: 'j494moo*O^HU',
  from: '3000164545',
  domain: '0098'
};

export const smsService = {
  sendVerificationCode: async (phone: string): Promise<SendSMSResponse> => {
    try {
      // تولید کد تصادفی 4 رقمی
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // ذخیره کد در localStorage برای تست
      localStorage.setItem(`sms_code_${phone}`, code);
      
      const text = `نرم افزار سامانت\nکد ورود: ${code}`;
      
      // ارسال درخواست به سرویس پیامک با JSONP
      const script = document.createElement('script');
      const callbackName = `smsCallback_${Date.now()}`;
      
      const promise = new Promise<SendSMSResponse>((resolve) => {
        (window as any)[callbackName] = (response: SMSResponse) => {
          if (response && response.status === 'success') {
            resolve({
              success: true,
              message: 'کد تایید با موفقیت ارسال شد'
            });
          } else {
            resolve({
              success: false,
              message: response.message || 'خطا در ارسال پیامک'
            });
          }
          delete (window as any)[callbackName];
          document.body.removeChild(script);
        };
      });

      script.src = `https://0098sms.com/sendsmslink.aspx?FROM=${SMS_CONFIG.from}&TO=${phone}&TEXT=${encodeURIComponent(text)}&USERNAME=${SMS_CONFIG.username}&PASSWORD=${SMS_CONFIG.password}&DOMAIN=${SMS_CONFIG.domain}&callback=${callbackName}`;
      document.body.appendChild(script);

      return promise;
    } catch {
      return {
        success: false,
        message: 'خطا در ارسال پیامک'
      };
    }
  },

  verifyCode: async (phone: string, code: string): Promise<{ isValid: boolean; message: string }> => {
    try {
      // بررسی کد از localStorage
      const savedCode = localStorage.getItem(`sms_code_${phone}`);
      const isValid = savedCode === code;
      
      if (isValid) {
        localStorage.removeItem(`sms_code_${phone}`);
      }
      
      return {
        isValid,
        message: isValid ? 'کد تایید صحیح است' : 'کد تایید نادرست است'
      };
    } catch {
      return {
        isValid: false,
        message: 'خطا در تایید کد'
      };
    }
  }
}; 