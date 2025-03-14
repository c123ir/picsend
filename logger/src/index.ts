import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { setupLogging } from './logging';
import { setupSocket } from './socket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// تنظیمات اولیه
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسیر اصلی - نمایش داشبورد
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// مسیرهای API برای لاگینگ
app.use('/api/logs', require('./routes/logs'));

// راه‌اندازی Socket.IO
setupSocket(httpServer);

const PORT = process.env.LOGGING_PORT || 3015;

httpServer.listen(PORT, () => {
  console.log(`Logging server is running on port ${PORT}`);
}); 