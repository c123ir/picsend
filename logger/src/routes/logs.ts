import express from 'express';
import { setupLogging } from '../logging';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// دریافت لاگ جدید
router.post('/', (req, res) => {
  const { level, message, source, metadata } = req.body;
  
  try {
    setupLogging.log(level, message, { source, ...metadata });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// دریافت لاگ‌های یک سرویس خاص
router.get('/:source?', async (req, res) => {
  const { source } = req.params;
  const { timeRange = '24h', level } = req.query;
  
  try {
    const logs = await setupLogging.getLogs(source, {
      timeRange: String(timeRange),
      level: level ? String(level) : undefined
    });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// خروجی گرفتن از لاگ‌ها
router.get('/export/:source?', async (req, res) => {
  const { source } = req.params;
  const { timeRange = '24h', level } = req.query;
  
  try {
    const logs = await setupLogging.getLogs(source, {
      timeRange: String(timeRange),
      level: level ? String(level) : undefined
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=logs-${new Date().toISOString()}.json`);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// دریافت لیست سرویس‌ها
router.get('/sources', (req, res) => {
  try {
    const sources = setupLogging.getSources();
    res.status(200).json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export = router; 