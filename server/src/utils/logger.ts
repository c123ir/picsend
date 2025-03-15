import axios from 'axios';

const LOGGER_URL = process.env.LOGGER_URL || 'http://localhost:3015/logs';

interface LogData {
  level: 'info' | 'warn' | 'error';
  message: string;
  service: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private static async sendLog(data: LogData): Promise<void> {
    try {
      await axios.post(LOGGER_URL, data);
    } catch (error) {
      console.error('خطا در ارسال لاگ:', error);
      // لاگ در کنسول در صورت خطا در ارسال به سرور لاگ
      console.log({
        timestamp: new Date().toISOString(),
        ...data
      });
    }
  }

  static info(message: string, metadata?: Record<string, unknown>): void {
    this.sendLog({
      level: 'info',
      message,
      service: 'main-server',
      metadata
    });
  }

  static warn(message: string, metadata?: Record<string, unknown>): void {
    this.sendLog({
      level: 'warn',
      message,
      service: 'main-server',
      metadata
    });
  }

  static error(message: string, metadata?: Record<string, unknown>): void {
    this.sendLog({
      level: 'error',
      message,
      service: 'main-server',
      metadata
    });
  }
}

export default Logger; 