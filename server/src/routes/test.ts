import express from 'express';
import { logger, logError, logAudit, logDebug } from '../config/logger';

const router = express.Router();

// تست سطوح مختلف لاگینگ
router.get('/api/test/logs', async (req, res) => {
  try {
    // 1. لاگ اطلاعات عمومی
    logger.info('درخواست تست لاگینگ دریافت شد', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 2. لاگ دیباگ
    logDebug('تست پارامترهای درخواست', {
      query: req.query,
      headers: req.headers
    });

    // 3. لاگ audit
    logAudit('test_logging', 'test-user', {
      action: 'log_test',
      timestamp: new Date()
    });

    // 4. شبیه‌سازی خطا برای تست error logging
    if (req.query.error === 'true') {
      throw new Error('خطای تست برای بررسی سیستم لاگینگ');
    }

    res.json({
      success: true,
      message: 'تست لاگینگ با موفقیت انجام شد'
    });

  } catch (error) {
    // 5. لاگ خطا
    logError(error as Error, {
      source: 'test_endpoint',
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'خطا در تست لاگینگ'
    });
  }
});

// تست عملکرد و کارایی
router.get('/api/test/performance', async (req, res) => {
  const startTime = process.hrtime();

  try {
    // شبیه‌سازی یک عملیات زمان‌بر
    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1e9 + endTime[1]) / 1e6; // تبدیل به میلی‌ثانیه

    logger.info('تست عملکرد انجام شد', {
      duration,
      operation: 'test_performance'
    });

    res.json({
      success: true,
      duration,
      message: 'تست عملکرد با موفقیت انجام شد'
    });

  } catch (error) {
    logError(error as Error, {
      source: 'performance_test',
      duration: process.hrtime(startTime)[0]
    });

    res.status(500).json({
      success: false,
      message: 'خطا در تست عملکرد'
    });
  }
});

export default router; 