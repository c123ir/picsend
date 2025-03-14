import axios from 'axios';
import { io, Socket } from 'socket.io-client';

class LoggingClient {
  private socket: Socket;
  private readonly apiUrl: string;
  private readonly source: string;

  constructor() {
    this.apiUrl = process.env.LOGGING_SERVER_URL || 'http://localhost:3015';
    this.source = `server-${process.env.PORT || '3010'}`;
    
    // اتصال به سرور لاگینگ با Socket.IO
    this.socket = io(this.apiUrl);
    
    this.socket.on('connect', () => {
      console.log('Connected to logging server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Failed to connect to logging server:', error);
    });
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
}

export const loggingClient = new LoggingClient(); 