import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { setupLogging } from './logging';

interface LogData {
  source: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface NotificationConfig {
  errorThreshold: number;  // تعداد خطاهای متوالی برای اعلان
  warnThreshold: number;   // تعداد هشدارهای متوالی برای اعلان
  timeWindow: number;      // پنجره زمانی برای بررسی (به دقیقه)
}

export function setupSocket(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // تنظیمات اعلان‌ها
  const notificationConfig: NotificationConfig = {
    errorThreshold: 5,    // 5 خطا در پنجره زمانی
    warnThreshold: 10,    // 10 هشدار در پنجره زمانی
    timeWindow: 5         // پنجره زمانی 5 دقیقه
  };

  // نگهداری آمار لاگ‌ها
  const logStats = {
    errors: [] as { timestamp: number }[],
    warnings: [] as { timestamp: number }[],
    lastNotification: 0
  };

  // نگهداری تعداد کاربران آنلاین
  let connectedClients = 0;
  const clientRooms = new Map<string, Set<string>>(); // نگهداری اتاق‌های هر کلاینت

  io.on('connection', (socket: Socket) => {
    connectedClients++;
    console.log(`👤 کاربر جدید متصل شد (مجموع: ${connectedClients})`);

    // ارسال تعداد کاربران آنلاین به همه
    io.emit('online-users', connectedClients);

    // پیوستن به اتاق‌های مختلف برای دریافت لاگ
    socket.on('join-room', (room: string) => {
      socket.join(room);
      if (!clientRooms.has(socket.id)) {
        clientRooms.set(socket.id, new Set());
      }
      clientRooms.get(socket.id)?.add(room);
      console.log(`کاربر به اتاق ${room} پیوست`);
    });

    // خروج از اتاق
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      clientRooms.get(socket.id)?.delete(room);
      console.log(`کاربر از اتاق ${room} خارج شد`);
    });

    // دریافت لاگ جدید از کلاینت‌ها
    socket.on('new-log', (data: LogData) => {
      try {
        // ذخیره لاگ
        setupLogging.log(data.level, data.message, {
          source: data.source,
          ...data.metadata
        });

        // بررسی و به‌روزرسانی آمار
        const now = Date.now();
        if (data.level === 'error') {
          logStats.errors.push({ timestamp: now });
        } else if (data.level === 'warn') {
          logStats.warnings.push({ timestamp: now });
        }

        // پاکسازی لاگ‌های قدیمی
        const timeWindow = notificationConfig.timeWindow * 60 * 1000;
        const cutoff = now - timeWindow;
        logStats.errors = logStats.errors.filter(e => e.timestamp > cutoff);
        logStats.warnings = logStats.warnings.filter(w => w.timestamp > cutoff);

        // بررسی نیاز به اعلان
        if (now - logStats.lastNotification > timeWindow) {
          if (logStats.errors.length >= notificationConfig.errorThreshold) {
            io.emit('alert', {
              type: 'error',
              message: `${logStats.errors.length} خطای متوالی در ${notificationConfig.timeWindow} دقیقه اخیر`
            });
            logStats.lastNotification = now;
          } else if (logStats.warnings.length >= notificationConfig.warnThreshold) {
            io.emit('alert', {
              type: 'warning',
              message: `${logStats.warnings.length} هشدار متوالی در ${notificationConfig.timeWindow} دقیقه اخیر`
            });
            logStats.lastNotification = now;
          }
        }

        // ارسال به همه کلاینت‌های متصل به داشبورد و اتاق مربوطه
        const logData = {
          ...data,
          timestamp: data.timestamp || new Date().toISOString()
        };
        io.emit('log', logData);
        if (data.source) {
          io.to(data.source).emit('source-log', logData);
        }

      } catch (error) {
        console.error('خطا در پردازش لاگ:', error);
        socket.emit('error', {
          message: 'خطا در ثبت لاگ',
          error: error instanceof Error ? error.message : 'خطای ناشناخته'
        });
      }
    });

    // فیلتر کردن لاگ‌ها
    socket.on('filter-logs', async (filters: {
      source?: string;
      level?: string;
      timeRange?: string;
      search?: string;
    }) => {
      try {
        const logs = await setupLogging.getLogs(filters.source, {
          timeRange: filters.timeRange || '24h',
          level: filters.level,
          search: filters.search
        });
        socket.emit('filtered-logs', logs);
      } catch (error) {
        console.error('خطا در فیلتر لاگ‌ها:', error);
        socket.emit('error', {
          message: 'خطا در دریافت لاگ‌ها',
          error: error instanceof Error ? error.message : 'خطای ناشناخته'
        });
      }
    });

    // آمار لاگ‌ها
    socket.on('get-stats', async () => {
      try {
        const stats = {
          errors: logStats.errors.length,
          warnings: logStats.warnings.length,
          total: await setupLogging.getLogCount(),
          bySource: await setupLogging.getLogCountBySource(),
          byLevel: await setupLogging.getLogCountByLevel()
        };
        socket.emit('stats', stats);
      } catch (error) {
        console.error('خطا در دریافت آمار:', error);
        socket.emit('error', {
          message: 'خطا در دریافت آمار',
          error: error instanceof Error ? error.message : 'خطای ناشناخته'
        });
      }
    });

    // قطع اتصال کاربر
    socket.on('disconnect', () => {
      connectedClients--;
      // پاکسازی اتاق‌های کاربر
      clientRooms.delete(socket.id);
      console.log(`👋 کاربر قطع شد (مجموع: ${connectedClients})`);
      io.emit('online-users', connectedClients);
    });
  });

  return io;
} 