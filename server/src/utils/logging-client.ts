import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

// بارگذاری تنظیمات از فایل .env
dotenv.config();

// تنظیمات لاگینگ
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ENABLE_FILE_LOGGING = process.env.ENABLE_FILE_LOGGING === 'true';
const MAX_LOG_SIZE = parseInt(process.env.MAX_LOG_SIZE || '5242880', 10); // 5MB پیش‌فرض
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
const LOGGING_SERVER_URL = process.env.LOGGING_SERVER_URL || 'http://localhost:3010/api/logs';

// سطوح لاگ
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// تبدیل سطح لاگ از رشته به enum
const getLogLevel = (level: string): LogLevel => {
  switch (level.toLowerCase()) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
};

// سطح لاگ فعلی
const currentLogLevel = getLogLevel(LOG_LEVEL);

// مسیر فایل لاگ
const getLogFilePath = (level: string): string => {
  const logsDir = path.join(__dirname, '../../logs');
  
  // اطمینان از وجود دایرکتوری لاگ‌ها
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const date = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `${level}-${date}.log`);
};

// تابع نوشتن لاگ در فایل
const writeToLogFile = (level: string, message: string, metadata: any): void => {
  if (!ENABLE_FILE_LOGGING) return;
  
  const logFilePath = getLogFilePath(level);
  const timestamp = new Date().toISOString();
  const hostname = os.hostname();
  const logEntry = JSON.stringify({
    timestamp,
    hostname,
    level,
    message,
    ...metadata
  }) + '\n';
  
  try {
    // بررسی سایز فایل
    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= MAX_LOG_SIZE) {
        const backupPath = `${logFilePath}.${Date.now()}.backup`;
        fs.renameSync(logFilePath, backupPath);
      }
    }
    
    // نوشتن لاگ در فایل
    fs.appendFileSync(logFilePath, logEntry);
    
    // پاکسازی لاگ‌های قدیمی
    cleanupOldLogs();
  } catch (error) {
    console.error('خطا در نوشتن لاگ در فایل:', error);
  }
};

// پاکسازی لاگ‌های قدیمی
const cleanupOldLogs = (): void => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) return;
    
    const currentTime = Date.now();
    const maxAgeMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    fs.readdirSync(logsDir).forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (currentTime - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('خطا در پاکسازی لاگ‌های قدیمی:', error);
  }
};

// ارسال لاگ به سرور لاگینگ
const sendToLoggingServer = async (level: string, message: string, metadata: any): Promise<void> => {
  if (!LOGGING_SERVER_URL) return;

  try {
    // ارسال لاگ به سرور
    await axios.post(LOGGING_SERVER_URL, {
      level,
      message,
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      ...metadata
    });
  } catch (error) {
    console.error('خطا در ارسال لاگ به سرور:', error);
    
    // در صورت خطا در ارتباط با سرور، ذخیره لاگ در فایل
    if (!ENABLE_FILE_LOGGING) {
      writeToLogFile(level, `[FAILED_REMOTE_LOG] ${message}`, metadata);
    }
  }
};

// کلاس اصلی کلاینت لاگینگ
class LoggingClient {
  // لاگ در سطح دیباگ
  public debug(message: string, metadata: any = {}): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, metadata);
      writeToLogFile('debug', message, metadata);
      sendToLoggingServer('debug', message, metadata);
    }
  }
  
  // لاگ در سطح اطلاعات
  public info(message: string, metadata: any = {}): void {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, metadata);
      writeToLogFile('info', message, metadata);
      sendToLoggingServer('info', message, metadata);
    }
  }
  
  // لاگ در سطح هشدار
  public warn(message: string, metadata: any = {}): void {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, metadata);
      writeToLogFile('warn', message, metadata);
      sendToLoggingServer('warn', message, metadata);
    }
  }
  
  // لاگ در سطح خطا
  public error(message: string, metadata: any = {}): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, metadata);
      writeToLogFile('error', message, metadata);
      sendToLoggingServer('error', message, metadata);
    }
  }
  
  // لاگ فعالیت کاربر
  public activity(userId: number, action: string, metadata: any = {}): void {
    this.info(`فعالیت کاربر: ${action}`, {
      userId,
      action,
      ...metadata
    });
  }
  
  // لاگ عملکرد
  public performance(operation: string, durationMs: number, metadata: any = {}): void {
    this.info(`عملکرد: ${operation}`, {
      operation,
      durationMs,
      ...metadata
    });
  }
  
  // لاگ تراکنش دیتابیس
  public dbTransaction(operation: string, model: string, metadata: any = {}): void {
    this.debug(`تراکنش دیتابیس: ${operation} در ${model}`, {
      operation,
      model,
      ...metadata
    });
  }
}

// صادر کردن نمونه از کلاینت
export const loggingClient = new LoggingClient(); 