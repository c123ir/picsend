import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';

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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('در حال اتصال به پایگاه داده...');

// اتصال به پایگاه داده
sequelize.authenticate()
  .then(() => {
    console.log('اتصال به پایگاه داده برقرار شد');

    // مسیرها
    app.use('/api/users', userRoutes);
    app.use('/api/auth', authRoutes);

    // مدیریت خطاها
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('خطای سرور:', err);
      
      // ارسال لاگ به سرور لاگر
      fetch(process.env.LOGGING_SERVER_URL + '/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'error',
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        })
      }).catch(logErr => {
        console.error('خطا در ارسال لاگ:', logErr);
      });

      res.status(500).json({ message: 'خطای سرور', error: err.message });
    });

    // شروع به کار سرور
    app.listen(port, () => {
      console.log(`سرور در پورت ${port} در حال اجراست`);
    }).on('error', (error) => {
      console.error('خطا در راه‌اندازی سرور:', error);
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('خطا در اتصال به پایگاه داده:', err);
    process.exit(1);
  }); 