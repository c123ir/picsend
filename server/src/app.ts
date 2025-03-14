import express from 'express';
import cors from 'cors';
import { httpLogger } from './config/logger';
import testRoutes from './routes/test';
import logsRoutes from './routes/logs';

const app = express();

// تنظیمات CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3005',
  credentials: true
}));

// میدلور‌ها
app.use(express.json());
app.use(httpLogger);

// مسیرها
app.use(testRoutes);
app.use(logsRoutes);

// مدیریت خطاهای 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// مدیریت خطاهای سرور
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 