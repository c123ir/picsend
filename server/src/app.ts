import express from 'express';
import cors from 'cors';
import { httpLogger } from './config/logger';
import { requestLogger } from './middleware/logger';
import testRoutes from './routes/test';
import logsRoutes from './routes/logs';
import userRoutes from './routes/userRoutes';
import { loggingClient } from './utils/logging-client';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import imageRoutes from './routes/imageRoutes';

const app = express();

// تنظیمات CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3005',
  credentials: true
}));

// میدلور‌ها
app.use(express.json());
app.use(httpLogger);
app.use(requestLogger);

// مسیرها
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/images', imageRoutes);
app.use(testRoutes);
app.use(logsRoutes);

// مدیریت خطاهای 404
app.use((req, res) => {
  loggingClient.warn('درخواست به مسیر ناموجود', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    action: 'not_found'
  });
  res.status(404).json({ error: 'Not Found' });
});

// مدیریت خطاهای سرور
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  loggingClient.error('خطای سرور', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    action: 'server_error'
  });
  
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  loggingClient.info('سرور راه‌اندازی شد', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    action: 'server_start'
  });
  console.log(`Server is running on port ${PORT}`);
});

export default app; 