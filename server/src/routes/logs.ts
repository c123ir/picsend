import express from 'express';
import { logger, logError, logAudit } from '../config/logger';

const router = express.Router();

interface ClientLogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

router.post('/api/logs', async (req, res) => {
  try {
    const logEntry: ClientLogEntry = req.body;
    
    // اعتبارسنجی داده‌های ورودی
    if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
      return res.status(400).json({ error: 'Invalid log entry format' });
    }

    // لاگ کردن با سطح مناسب
    switch (logEntry.level) {
      case 'error':
        logError(new Error(logEntry.message), { 
          source: 'client',
          ...logEntry.data 
        });
        break;
      case 'warn':
        logger.warn({
          message: logEntry.message,
          source: 'client',
          ...logEntry.data
        });
        break;
      default:
        logger.info({
          message: logEntry.message,
          source: 'client',
          level: logEntry.level,
          ...logEntry.data
        });
    }

    // ثبت در audit log اگر نیاز است
    if (logEntry.data?.userId) {
      logAudit('client_log', logEntry.data.userId as string, {
        level: logEntry.level,
        message: logEntry.message
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logError(error as Error, { source: 'log_api' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 