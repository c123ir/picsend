import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import imageRoutes from './routes/imageRoutes';
import groupRoutes from './routes/groupRoutes';
import { syncModels } from './models';
import { loggingClient } from './utils/logging-client';
import loggerMiddleware from './middleware/logger';

interface ServerError extends Error {
  status?: number;
}

process.on('uncaughtException', (error) => {
  console.error('خطای پیش‌بینی نشده:', error);
  loggingClient.error('خطای پیش‌بینی نشده در برنامه', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('خطای پیش‌بینی نشده در Promise:', error);
  loggingClient.error('خطای Promise مدیریت نشده', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

// تنظیمات CORS
app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3006'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسیر برای فایل‌های آپلود شده
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// اضافه کردن میدل‌ور لاگینگ قبل از مسیرها
app.use(loggerMiddleware);

// مسیرها
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/groups', groupRoutes);

// میدل‌ور مدیریت خطاها
app.use((err: ServerError, req: Request, res: Response, next: NextFunction) => {
  loggingClient.error('خطای سرور', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id || 'anonymous'
  });
  
  res.status(err.status || 500).json({
    message: 'خطای سرور رخ داده است'
  });
});

const execAsync = promisify(exec);

// تابع بررسی و راه‌اندازی MySQL
async function setupMySQL() {
  try {
    await sequelize.authenticate();
    loggingClient.info('اتصال به MySQL موفقیت‌آمیز بود', {
      action: 'mysql_connection_success',
      database: process.env.DB_NAME
    });
    
    // همگام‌سازی مدل‌ها با دیتابیس
    await syncModels();
    
  } catch (error: any) {
    loggingClient.warn('خطا در اتصال به MySQL. تلاش برای راه‌اندازی...', { 
      error: error.message,
      action: 'mysql_connection_failed'
    });
    
    try {
      const setupScript = path.join(__dirname, '../scripts/setup-mysql.sh');
      const { stdout, stderr } = await execAsync(`bash ${setupScript}`);
      
      if (stderr) {
        loggingClient.error('خطا در راه‌اندازی MySQL:', { 
          error: stderr,
          action: 'mysql_setup_error'
        });
        throw new Error(stderr);
      }
      
      loggingClient.info('خروجی راه‌اندازی MySQL:', { 
        output: stdout,
        action: 'mysql_setup_output'
      });
      
      // تلاش مجدد برای اتصال
      await sequelize.authenticate();
      
      // همگام‌سازی مدل‌ها با دیتابیس
      await syncModels();
      
      loggingClient.info('MySQL با موفقیت راه‌اندازی و متصل شد', {
        action: 'mysql_setup_success'
      });
    } catch (setupError: any) {
      loggingClient.error('خطا در راه‌اندازی MySQL:', { 
        error: setupError instanceof Error ? setupError.message : String(setupError),
        action: 'mysql_setup_failed'
      });
      throw setupError;
    }
  }
}

// تابع ایجاد دایرکتوری آپلود تصاویر
async function createUploadDirs() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
  try {
    await execAsync(`mkdir -p ${uploadDir}`);
    loggingClient.info('دایرکتوری آپلود تصاویر ایجاد شد', {
      dir: uploadDir,
      action: 'create_upload_dir'
    });
  } catch (error: any) {
    loggingClient.error('خطا در ایجاد دایرکتوری آپلود', {
      error: error instanceof Error ? error.message : String(error),
      action: 'create_upload_dir_error'
    });
  }
}

// راه‌اندازی سرور
async function startServer() {
  try {
    // راه‌اندازی MySQL
    await setupMySQL();
    
    // ایجاد دایرکتوری آپلود
    await createUploadDirs();
    
    // راه‌اندازی سرور
    app.listen(port, () => {
      loggingClient.info(`سرور در پورت ${port} در حال اجراست`, {
        serverPort: port,
        nodeEnv: process.env.NODE_ENV,
        startTime: new Date().toISOString(),
        action: 'server_started'
      });
      
      console.log(`✅ سرور در پورت ${port} راه‌اندازی شد`);
      console.log(`📝 محیط: ${process.env.NODE_ENV}`);
      console.log(`🌐 آدرس: http://localhost:${port}`);
    });
  } catch (error: any) {
    loggingClient.error('خطا در راه‌اندازی سرور:', { 
      error: error instanceof Error ? error.message : String(error),
      action: 'server_start_error'
    });
    console.error('❌ خطا در راه‌اندازی سرور:', error);
    process.exit(1);
  }
}

startServer(); 