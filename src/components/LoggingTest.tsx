import React, { useEffect } from 'react';
import { loggers } from '../utils/logger';
import { Button, Box, Typography, Paper } from '@mui/material';

const logger = loggers.app;

const LoggingTest: React.FC = () => {
  useEffect(() => {
    // تست لاگ در هنگام mount
    logger.info('کامپوننت LoggingTest بارگذاری شد', {
      timestamp: new Date().toISOString()
    });

    // تست لاگ عملکرد
    const loadTime = performance.now();
    logger.logPerformance('component_load', loadTime);

    return () => {
      logger.debug('کامپوننت LoggingTest از DOM حذف شد');
    };
  }, []);

  const handleTestError = () => {
    try {
      // شبیه‌سازی خطا
      throw new Error('خطای تست از سمت کلاینت');
    } catch (error) {
      logger.error('خطا در تست لاگینگ', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleTestWarning = () => {
    logger.warn('این یک هشدار تست است', {
      source: 'warning_button',
      timestamp: new Date().toISOString()
    });
  };

  const handleTestPerformance = async () => {
    const startTime = performance.now();
    
    // شبیه‌سازی یک عملیات زمان‌بر
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const endTime = performance.now();
    logger.logPerformance('test_operation', endTime - startTime);
  };

  const handleTestServerLogs = async () => {
    try {
      const startTime = performance.now();
      
      // تست endpoint لاگینگ سرور
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test/logs`);
      const data = await response.json();
      
      const endTime = performance.now();
      logger.logPerformance('server_log_test', endTime - startTime);
      
      logger.info('تست لاگینگ سرور انجام شد', {
        success: data.success,
        duration: endTime - startTime
      });
    } catch (error) {
      logger.error('خطا در تست لاگینگ سرور', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testLogging = () => {
    logger.info('این یک پیام تست است');
    logger.warn('این یک هشدار تست است');
    logger.error('این یک خطای تست است');
    logger.debug('این یک پیام دیباگ تست است');
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        تست سیستم لاگینگ
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Button variant="contained" color="error" onClick={handleTestError}>
          تست خطا
        </Button>
        
        <Button variant="contained" color="warning" onClick={handleTestWarning}>
          تست هشدار
        </Button>
        
        <Button variant="contained" color="info" onClick={handleTestPerformance}>
          تست عملکرد
        </Button>
        
        <Button variant="contained" color="success" onClick={handleTestServerLogs}>
          تست لاگینگ سرور
        </Button>
        
        <Button variant="contained" onClick={testLogging}>
          ارسال لاگ‌های تست
        </Button>
      </Box>
    </Paper>
  );
};

export default LoggingTest; 