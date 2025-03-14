import express from 'express';
import { setupLogging } from './logging';

export function setupRoutes(app: express.Application) {
  // مسیر اصلی داشبورد
  app.get('/', (req, res) => {
    res.sendFile('dashboard.html', { root: './src/public' });
  });

  // API لاگ‌ها
  app.use('/api/logs', require('./routes/logs'));
} 