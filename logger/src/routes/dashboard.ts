import express from 'express';
import path from 'path';

const router = express.Router();

// صفحه اصلی داشبورد
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// API برای دریافت آمار لاگ‌ها
router.get('/stats', (req, res) => {
  // TODO: Implement dashboard statistics
  res.json({
    totalLogs: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    sources: []
  });
});

export = router; 