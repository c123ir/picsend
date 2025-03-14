// src/utils/loggingClient.ts
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import env from '../config/env';

class LoggingClient {
  private socket: Socket | null = null;
  private readonly apiUrl: string;
  private readonly source: string;
  private isConnected: boolean = false;
  private offlineQueue: any[] = [];
  private static instance: LoggingClient;

  private constructor() {
    this.apiUrl = env.LOGGING_SERVER_URL;
    this.source = `client-${env.CLIENT_PORT}`;
    
    this.initSocket();
    
    // در صورت فعال بودن در محیط توسعه، متغیرهای محیطی لاگ می‌شود
    if (env.NODE_ENV === 'development') {
      console.log(`🔌 اتصال به سرور لاگینگ: ${this.apiUrl}`);
      console.log(`🏷️ منبع لاگینگ: ${this.source}`);
    }
    
    this.syncLocalLogsOnStartup();
    
    // نظارت بر تغییرات آنلاین/آفلاین
    window.addEventListener('online', this.handleConnectionChange.bind(this));
    window.addEventListener('offline', this.handleConnectionChange.bind(this));
  }

  public static getInstance(): LoggingClient {
    if (!LoggingClient.instance) {
      LoggingClient.instance = new LoggingClient();
    }
    return LoggingClient.instance;
  }

  private initSocket() {
    try {
      this.socket = io(this.apiUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        if (env.ENABLE_DEBUG_LOGS) {
          console.log('🟢 اتصال به سرور لاگینگ برقرار شد');
        }
        this.isConnected = true;
        this.sendOfflineQueue();
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔴 خطا در اتصال به سرور لاگینگ:', error.message);
        this.isConnected = false;
      });

      this.socket.on('disconnect', () => {
        if (env.ENABLE_DEBUG_LOGS) {
          console.log('🟠 اتصال با سرور لاگینگ قطع شد');
        }
        this.isConnected = false;
      });
    } catch (error) {
      console.error('🔴 خطا در راه‌اندازی اتصال سوکت:', error);
      this.isConnected = false;
    }
  }

  private handleConnectionChange() {
    if (navigator.onLine && !this.isConnected) {
      // اتصال مجدد به سرویس وقتی آنلاین هستیم
      this.initSocket();
      this.sendOfflineQueue();
    }
  }

  private saveToLocalStorage(level: string, message: string, metadata: any = {}) {
    try {
      const storageKey = 'picsend_offline_logs';
      const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
        source: this.source
      });
      
      // محدود کردن تعداد لاگ‌های ذخیره شده
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('خطا در ذخیره لاگ در localStorage:', error);
    }
  }

  private async syncLocalLogsOnStartup() {
    try {
      const storageKey = 'picsend_offline_logs';
      const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (logs.length === 0) return;
      
      if (env.ENABLE_DEBUG_LOGS) {
        console.log(`📤 ${logs.length} لاگ آفلاین یافت شد. در حال همگام‌سازی...`);
      }
      
      // انتقال لاگ‌ها به صف
      this.offlineQueue.push(...logs);
      
      // پاک کردن لاگ‌های ذخیره شده
      localStorage.removeItem(storageKey);
      
      // ارسال لاگ‌ها
      if (this.isConnected) {
        this.sendOfflineQueue();
      }
    } catch (error) {
      console.error('خطا در همگام‌سازی لاگ‌های محلی:', error);
    }
  }

  private async sendOfflineQueue() {
    if (this.offlineQueue.length === 0 || !this.isConnected) return;
    
    if (env.ENABLE_DEBUG_LOGS) {
      console.log(`📤 ارسال ${this.offlineQueue.length} لاگ در صف...`);
    }
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const log of queue) {
      try {
        await axios.post(`${this.apiUrl}/logs`, log);
      } catch (error) {
        // اگر ارسال با خطا مواجه شد، لاگ را به صف برگردانید
        this.offlineQueue.push(log);
        
        if (env.ENABLE_DEBUG_LOGS) {
          console.error('خطا در ارسال لاگ از صف:', error);
        }
        
        break;
      }
    }
  }

  public async sendLog(level: string, message: string, metadata: any = {}) {
    // بررسی سطح لاگ
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = logLevels.indexOf(env.LOG_LEVEL);
    const messageLevelIndex = logLevels.indexOf(level);
    
    // اگر سطح لاگ پایین‌تر از سطح تعیین شده در تنظیمات باشد، آن را نادیده بگیر
    if (messageLevelIndex < currentLevelIndex) {
      return;
    }
    
    const logData = {
      source: this.source,
      level,
      message,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: new Date().toISOString()
    };

    // اگر در حالت توسعه هستیم، لاگ در کنسول نیز نمایش داده شود
    if (env.NODE_ENV === 'development' && env.ENABLE_DEBUG_LOGS) {
      let consoleMethod: 'log' | 'info' | 'warn' | 'error' = 'log';
      
      switch (level) {
        case 'info': consoleMethod = 'info'; break;
        case 'warn': consoleMethod = 'warn'; break;
        case 'error': consoleMethod = 'error'; break;
      }
      
      // تعیین رنگ برای هر سطح لاگ
      let colorCode = '';
      switch (level) {
        case 'debug': colorCode = '#9e9e9e'; break; // خاکستری
        case 'info': colorCode = '#2196f3'; break;  // آبی
        case 'warn': colorCode = '#ff9800'; break;  // نارنجی
        case 'error': colorCode = '#f44336'; break; // قرمز
      }
      
      console[consoleMethod](
        `%c[${level.toUpperCase()}]%c ${message}`,
        `color: ${colorCode}; font-weight: bold`,
        'color: inherit',
        metadata
      );
    }

    try {
      if (!this.isConnected) {
        this.saveToLocalStorage(level, message, metadata);
        this.offlineQueue.push(logData);
        return;
      }

      // ارسال از طریق Socket.IO برای لاگ‌های زنده
      if (this.socket) {
        this.socket.emit('new-log', logData);
      }

      // ارسال از طریق HTTP برای ذخیره دائمی
      await axios.post(`${this.apiUrl}/logs`, logData);
    } catch (error) {
      // در صورت خطا، لاگ را در localStorage ذخیره کنید
      this.saveToLocalStorage(level, message, metadata);
      this.offlineQueue.push(logData);
      
      if (env.ENABLE_DEBUG_LOGS) {
        console.error('خطا در ارسال لاگ:', error);
      }
    }
  }

  public error(message: string, metadata?: any) {
    return this.sendLog('error', message, metadata);
  }

  public warn(message: string, metadata?: any) {
    return this.sendLog('warn', message, metadata);
  }

  public info(message: string, metadata?: any) {
    return this.sendLog('info', message, metadata);
  }

  public debug(message: string, metadata?: any) {
    return this.sendLog('debug', message, metadata);
  }

  public logPerformance(action: string, duration: number) {
    return this.info(`عملکرد: ${action}`, { 
      action, 
      duration: typeof duration === 'number' ? `${duration.toFixed(2)}ms` : duration,
      type: 'performance' 
    });
  }
  
  /**
   * ثبت خطاهای داخلی سیستم
   * این متد برای استفاده دیباگ است و در محیط تولید کاربردی ندارد
   */
  public logSystemInfo(info: string, metadata?: any) {
    if (env.NODE_ENV !== 'production') {
      return this.debug(`سیستم: ${info}`, { ...metadata, type: 'system' });
    }
  }
  
  /**
   * ثبت رویدادهای کاربر
   * برای تحلیل رفتار کاربران و بهبود تجربه کاربری
   */
  public logUserAction(action: string, metadata?: any) {
    return this.info(`کاربر: ${action}`, { ...metadata, type: 'user_action' });
  }
  
  /**
   * ثبت رویدادهای خرید و پرداخت
   * برای تحلیل فرآیندهای مالی
   */
  public logPayment(status: string, metadata?: any) {
    return this.info(`پرداخت: ${status}`, { ...metadata, type: 'payment' });
  }
  
  /**
   * پاک کردن تمام لاگ‌های ذخیره شده
   * برای استفاده در زمان خروج کاربر از سیستم
   */
  public clearLogs() {
    localStorage.removeItem('picsend_offline_logs');
    this.offlineQueue = [];
  }
}

export const loggingClient = LoggingClient.getInstance();