import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import Logger from './utils/logger';

process.on('uncaughtException', (error) => {
  console.error('خطای پیش‌بینی نشده:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('خطای پیش‌بینی نشده در Promise:', error);
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

// مسیرها
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

const execAsync = promisify(exec);

// تابع بررسی و راه‌اندازی MySQL
async function setupMySQL() {
  try {
    await sequelize.authenticate();
    Logger.info('اتصال به MySQL موفقیت‌آمیز بود');
  } catch (error) {
    Logger.warn('خطا در اتصال به MySQL. تلاش برای راه‌اندازی...');
    
    try {
      const setupScript = path.join(__dirname, '../scripts/setup-mysql.sh');
      const { stdout, stderr } = await execAsync(`bash ${setupScript}`);
      
      if (stderr) {
        Logger.error('خطا در راه‌اندازی MySQL:', { error: stderr });
        throw new Error(stderr);
      }
      
      Logger.info('خروجی راه‌اندازی MySQL:', { output: stdout });
      
      // تلاش مجدد برای اتصال
      await sequelize.authenticate();
      Logger.info('MySQL با موفقیت راه‌اندازی و متصل شد');
    } catch (setupError) {
      Logger.error('خطا در راه‌اندازی MySQL:', { error: setupError });
      throw setupError;
    }
  }
}

// راه‌اندازی سرور
async function startServer() {
  try {
    await setupMySQL();
    
    app.listen(port, () => {
      Logger.info(`سرور در پورت ${port} در حال اجراست`);
    });
  } catch (error) {
    Logger.error('خطا در راه‌اندازی سرور:', { error });
    process.exit(1);
  }
}

startServer(); 