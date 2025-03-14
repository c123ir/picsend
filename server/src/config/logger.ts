import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../../logs');

// تنظیمات فرمت لاگ‌ها
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// تنظیمات چرخش فایل‌های لاگ
const fileRotateConfig = {
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '30d',
  zippedArchive: true,
};

// ایجاد ترنسپورت‌های مختلف برای سطوح مختلف لاگ
const errorTransport = new winston.transports.DailyRotateFile({
  ...fileRotateConfig,
  level: 'error',
  filename: path.join(LOG_DIR, 'server/error/error-%DATE%.log'),
});

const accessTransport = new winston.transports.DailyRotateFile({
  ...fileRotateConfig,
  level: 'info',
  filename: path.join(LOG_DIR, 'server/access/access-%DATE%.log'),
});

const debugTransport = new winston.transports.DailyRotateFile({
  ...fileRotateConfig,
  level: 'debug',
  filename: path.join(LOG_DIR, 'server/debug/debug-%DATE%.log'),
  maxFiles: '3d',
});

const auditTransport = new winston.transports.DailyRotateFile({
  ...fileRotateConfig,
  level: 'info',
  filename: path.join(LOG_DIR, 'server/audit/audit-%DATE%.log'),
});

// ایجاد لاگر اصلی
export const logger = winston.createLogger({
  format: logFormat,
  transports: [
    errorTransport,
    accessTransport,
    debugTransport,
    auditTransport,
    // لاگ در کنسول در محیط توسعه
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({ format: winston.format.simple() })]
      : [])
  ],
});

// میدلور مورگان برای لاگ کردن درخواست‌های HTTP
import morgan from 'morgan';
import { Request, Response } from 'express';

const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

export const httpLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
});

// توابع کمکی برای لاگ کردن
export const logError = (error: Error, metadata?: any) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...metadata,
  });
};

export const logAudit = (action: string, userId: string, metadata?: any) => {
  logger.info({
    type: 'AUDIT',
    action,
    userId,
    ...metadata,
  });
};

export const logDebug = (message: string, metadata?: any) => {
  logger.debug({
    message,
    ...metadata,
  });
}; 