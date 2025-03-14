import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
  metadata?: any;
}

interface LogOptions {
  timeRange?: string;
  level?: string;
  search?: string;
}

export class LoggingService {
  private loggers: Map<string, winston.Logger>;
  private logDir: string;

  constructor() {
    this.loggers = new Map();
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogger(source: string): winston.Logger {
    if (!this.loggers.has(source)) {
      const logger = winston.createLogger({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [
          new winston.transports.DailyRotateFile({
            dirname: path.join(this.logDir, source),
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '14d'
          })
        ]
      });
      this.loggers.set(source, logger);
    }
    return this.loggers.get(source)!;
  }

  public log(level: string, message: string, metadata: Record<string, unknown> = {}) {
    const source = metadata.source as string || 'default';
    const logger = this.getLogger(source);
    logger.log(level, message, metadata);
  }

  public async getLogs(source?: string, options: LogOptions = {}): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    const sources = source ? [source] : await this.getSources();
    
    for (const src of sources) {
      const dirPath = path.join(this.logDir, src);
      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.log'))
        .sort((a, b) => b.localeCompare(a));

      for (const file of files) {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        const entries = content.trim().split('\n')
          .map(line => JSON.parse(line) as LogEntry)
          .filter(entry => {
            if (options.level && entry.level !== options.level) return false;
            if (options.search && !this.matchSearch(entry, options.search)) return false;
            if (options.timeRange && !this.isWithinTimeRange(entry.timestamp, options.timeRange)) return false;
            return true;
          });
        logs.push(...entries);
      }
    }

    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private matchSearch(entry: LogEntry, search: string): boolean {
    const searchLower = search.toLowerCase();
    return entry.message.toLowerCase().includes(searchLower) ||
           entry.level.toLowerCase().includes(searchLower) ||
           entry.source.toLowerCase().includes(searchLower) ||
           JSON.stringify(entry.metadata).toLowerCase().includes(searchLower);
  }

  private isWithinTimeRange(timestamp: string, timeRange: string): boolean {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = parseInt(timeRange.replace(/[^0-9]/g, ''));
    
    if (timeRange.endsWith('h')) {
      return diff <= hours * 60 * 60 * 1000;
    } else if (timeRange.endsWith('d')) {
      return diff <= hours * 24 * 60 * 60 * 1000;
    }
    return true;
  }

  public async getLogCount(): Promise<number> {
    const logs = await this.getLogs();
    return logs.length;
  }

  public async getLogCountBySource(): Promise<Record<string, number>> {
    const sources = await this.getSources();
    const counts: Record<string, number> = {};
    
    for (const source of sources) {
      const logs = await this.getLogs(source);
      counts[source] = logs.length;
    }
    
    return counts;
  }

  public async getLogCountByLevel(): Promise<Record<string, number>> {
    const logs = await this.getLogs();
    return logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  public async getSources(): Promise<string[]> {
    if (!fs.existsSync(this.logDir)) return [];
    return fs.readdirSync(this.logDir)
      .filter(file => fs.statSync(path.join(this.logDir, file)).isDirectory());
  }
}

export const setupLogging = new LoggingService(); 