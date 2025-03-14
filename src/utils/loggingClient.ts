import { io, Socket } from 'socket.io-client';
import axios from 'axios';

class LoggingClient {
  private socket: Socket;
  private readonly apiUrl: string;
  private readonly source: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_LOGGING_SERVER_URL || 'http://localhost:3015';
    this.source = `client-${import.meta.env.VITE_PORT || '3005'}`;
    
    // اتصال به سرور لاگینگ با Socket.IO
    this.socket = io(this.apiUrl);
    
    this.socket.on('connect', () => {
      console.log('Connected to logging server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Failed to connect to logging server:', error);
      // ذخیره لاگ در localStorage در صورت عدم اتصال
      this.saveToLocalStorage('error', 'Failed to connect to logging server', { error });
    });
  }

  private saveToLocalStorage(level: string, message: string, metadata: any = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata,
        source: this.source
      });
      localStorage.setItem('logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  private async sendLog(level: string, message: string, metadata: any = {}) {
    try {
      // ارسال از طریق Socket.IO برای لاگ‌های زنده
      this.socket.emit('log', {
        source: this.source,
        level,
        message,
        metadata,
        timestamp: new Date().toISOString()
      });

      // ارسال از طریق HTTP برای ذخیره دائمی
      await axios.post(`${this.apiUrl}/api/logs`, {
        source: this.source,
        level,
        message,
        metadata
      });
    } catch (error) {
      // ذخیره در localStorage در صورت خطا
      this.saveToLocalStorage(level, message, metadata);
      console.error('Failed to send log:', error);
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

  // ارسال لاگ‌های ذخیره شده در localStorage
  public async syncLocalLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem('logs') || '[]');
      if (logs.length === 0) return;

      for (const log of logs) {
        await axios.post(`${this.apiUrl}/api/logs`, log);
      }

      localStorage.removeItem('logs');
    } catch (error) {
      console.error('Failed to sync local logs:', error);
    }
  }
}

export const loggingClient = new LoggingClient(); 