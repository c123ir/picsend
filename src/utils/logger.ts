import debug from 'debug';
import axios from 'axios';

// تنظیم debug برای محیط توسعه
const debugLog = debug('picsend:client');

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class ClientLogger {
  private static instance: ClientLogger;
  private readonly maxStorageSize = 5 * 1024 * 1024; // 5MB
  private readonly storageKey = 'picsend_debug_logs';
  private service: string;
  private loggingServerUrl: string;

  private constructor(service: string) {
    this.service = service;
    this.loggingServerUrl = import.meta.env.VITE_LOGGING_SERVER_URL || 'http://localhost:3015';
  }

  static getInstance(service: string): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger(service);
    }
    return ClientLogger.instance;
  }

  private storeLocally(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs();
      logs.push(entry);
      
      // حذف لاگ‌های قدیمی اگر حجم از حد مجاز بیشتر شد
      while (JSON.stringify(logs).length > this.maxStorageSize) {
        logs.shift();
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Error storing log locally:', error);
    }
  }

  private getStoredLogs(): LogEntry[] {
    try {
      const storedLogs = localStorage.getItem(this.storageKey);
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch {
      return [];
    }
  }

  private async sendLog(level: string, message: string, meta?: any) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        level,
        service: this.service,
        message,
        meta: {
          ...meta,
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      await axios.post(`${this.loggingServerUrl}/logs`, logData);
    } catch (error) {
      console.error('Failed to send log to logging server:', error);
    }
  }

  log(level: LogEntry['level'], message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // لاگ در محیط توسعه
    if (import.meta.env.DEV) {
      debugLog(`[${level.toUpperCase()}] ${message}`, data);
    }

    // ذخیره لوکال برای دیباگ
    this.storeLocally(entry);

    // ارسال خطاها و هشدارها به سرور
    if (level === 'error' || level === 'warn') {
      this.sendLog(level, message, data);
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  logPerformance(metric: string, value: number): void {
    this.log('info', `Performance: ${metric}`, { metric, value });
  }

  clearLocalLogs(): void {
    localStorage.removeItem(this.storageKey);
  }

  getLocalLogs(): LogEntry[] {
    return this.getStoredLogs();
  }
}

export const loggers = {
  app: ClientLogger.getInstance('client-app'),
  auth: ClientLogger.getInstance('client-auth'),
  api: ClientLogger.getInstance('client-api')
}; 