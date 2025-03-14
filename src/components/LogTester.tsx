// src/components/LogTester.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { loggingClient } from '../utils/loggingClient';
import { Info, Warning, Error, BugReport, Schedule, Speed, StackedLineChart } from '@mui/icons-material';

interface LogAction {
  title: string;
  description: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  icon: React.ReactNode;
}

const LogTester: React.FC = () => {
  const [logMessage, setLogMessage] = useState<string>('');
  const [logLevel, setLogLevel] = useState<'info' | 'warn' | 'error' | 'debug'>('info');
  const [metadataStr, setMetadataStr] = useState<string>('{}');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [customSource, setCustomSource] = useState<string>('log-tester');
  const [lastLogs, setLastLogs] = useState<Array<{level: string, message: string, timestamp: string}>>([]);

  // پیش‌تنظیم‌های لاگ برای تست سریع
  const logActions: LogAction[] = [
    {
      title: 'عملکرد برنامه',
      description: 'ثبت زمان اجرای یک عملیات',
      level: 'info',
      message: 'عملکرد: بارگذاری فرم پایان یافت',
      icon: <Speed color="info" />
    },
    {
      title: 'خطای شبکه',
      description: 'شبیه‌سازی خطای شبکه',
      level: 'error',
      message: 'خطای شبکه: عدم اتصال به سرور API',
      icon: <Error color="error" />
    },
    {
      title: 'هشدار امنیتی',
      description: 'یک هشدار امنیتی مرتبط با ورود کاربر',
      level: 'warn',
      message: 'تلاش ناموفق برای ورود از IP متفاوت',
      icon: <Warning color="warning" />
    },
    {
      title: 'عملیات کاربر',
      description: 'ثبت عملیات کاربر در سیستم',
      level: 'info',
      message: 'کاربر فرم را با موفقیت ثبت کرد',
      icon: <Info color="info" />
    },
    {
      title: 'تست عمدی خطا',
      description: 'ایجاد یک خطای عمدی در برنامه',
      level: 'error',
      message: 'خطای عمدی جهت تست سیستم لاگینگ',
      icon: <BugReport color="error" />
    },
    {
      title: 'اطلاعات دیباگ',
      description: 'اطلاعات مفید برای توسعه‌دهندگان',
      level: 'debug',
      message: 'مقادیر متغیرهای داخلی: تنظیمات کاربر بارگذاری شد',
      icon: <BugReport color="secondary" />
    }
  ];

  // نمایش لاگ‌های اخیر (پیاده‌سازی ساده)
  useEffect(() => {
    const updateLastLogs = (level: string, message: string) => {
      setLastLogs(prev => [
        {level, message, timestamp: new Date().toISOString()},
        ...prev.slice(0, 4) // حداکثر 5 لاگ اخیر
      ]);
    };

    // دریافت مقادیر لاگ از localStorage
    const checkLocalLogs = () => {
      try {
        const logs = JSON.parse(localStorage.getItem('picsend_offline_logs') || '[]');
        if (logs.length > 0) {
          const recentLogs = logs.slice(0, 5).map((log: any) => ({
            level: log.level,
            message: log.message,
            timestamp: log.timestamp
          }));
          setLastLogs(recentLogs);
        }
      } catch (error) {
        console.error('Error reading local logs:', error);
      }
    };

    checkLocalLogs();

    // Override loggingClient methods to capture logs
    const originalInfo = loggingClient.info;
    const originalWarn = loggingClient.warn;
    const originalError = loggingClient.error;
    const originalDebug = loggingClient.debug;

    loggingClient.info = (message, metadata) => {
      updateLastLogs('info', message);
      return originalInfo.call(loggingClient, message, metadata);
    };

    loggingClient.warn = (message, metadata) => {
      updateLastLogs('warn', message);
      return originalWarn.call(loggingClient, message, metadata);
    };

    loggingClient.error = (message, metadata) => {
      updateLastLogs('error', message);
      return originalError.call(loggingClient, message, metadata);
    };

    loggingClient.debug = (message, metadata) => {
      updateLastLogs('debug', message);
      return originalDebug.call(loggingClient, message, metadata);
    };

    return () => {
      // Restore original methods
      loggingClient.info = originalInfo;
      loggingClient.warn = originalWarn;
      loggingClient.error = originalError;
      loggingClient.debug = originalDebug;
    };
  }, []);

  const handleLogSubmit = () => {
    if (!logMessage.trim()) {
      setNotification({
        message: 'پیام لاگ نمی‌تواند خالی باشد',
        type: 'error'
      });
      return;
    }

    try {
      // تبدیل متادیتا از رشته JSON به آبجکت
      let metadata = {};
      if (metadataStr.trim()) {
        try {
          metadata = JSON.parse(metadataStr);
        } catch (e) {
          setNotification({
            message: 'خطا در فرمت JSON متادیتا',
            type: 'error'
          });
          return;
        }
      }

      // تنظیم منبع سفارشی
      if (customSource) {
        metadata = { ...metadata, source: customSource };
      }

      // ارسال لاگ
      switch(logLevel) {
        case 'info':
          loggingClient.info(logMessage, metadata);
          break;
        case 'warn':
          loggingClient.warn(logMessage, metadata);
          break;
        case 'error':
          loggingClient.error(logMessage, metadata);
          break;
        case 'debug':
          loggingClient.debug(logMessage, metadata);
          break;
      }

      setNotification({
        message: 'لاگ با موفقیت ارسال شد',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        message: `خطا در ارسال لاگ: ${error instanceof Error ? error.message : 'خطای نامشخص'}`,
        type: 'error'
      });
    }
  };

  const handleActionClick = (action: LogAction) => {
    // تنظیم فیلدها با مقادیر از پیش آماده شده
    setLogLevel(action.level);
    setLogMessage(action.message);
    
    // ایجاد متادیتای مناسب برای هر نوع اکشن
    let metadata = { source: customSource, timestamp: new Date().toISOString() };
    
    switch(action.level) {
      case 'error':
        metadata = { 
          ...metadata, 
          stackTrace: 'Error: Simulated error\n    at LogTester.handleActionClick',
          errorCode: 'ERR_SIMULATED'
        };
        break;
      case 'warn':
        metadata = { ...metadata, warning: true, warnType: 'security' };
        break;
      case 'info':
        metadata = { ...metadata, user: 'test-user', actionType: 'form_submit' };
        break;
      case 'debug':
        metadata = { ...metadata, debug: true, variables: { count: 42, items: ['a', 'b', 'c'] } };
        break;
    }
    
    setMetadataStr(JSON.stringify(metadata, null, 2));
  };

  const handlePerformanceTest = () => {
    const startTime = performance.now();
    
    // شبیه‌سازی یک عملیات زمان‌بر
    setTimeout(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      loggingClient.logPerformance('test_operation', duration);
      
      setNotification({
        message: `تست عملکرد با زمان ${duration.toFixed(2)}ms به پایان رسید`,
        type: 'success'
      });
    }, 1500); // شبیه‌سازی یک عملیات 1.5 ثانیه‌ای
  };

  const handleErrorGeneration = () => {
    try {
      // ایجاد یک خطای عمدی
      throw new Error('خطای عمدی برای تست سیستم لاگینگ');
    } catch (error) {
      if (error instanceof Error) {
        loggingClient.error('خطای برنامه رخ داد', {
          error: error.message,
          stack: error.stack,
          source: customSource
        });
        
        setNotification({
          message: 'خطای عمدی ایجاد و لاگ شد',
          type: 'success'
        });
      }
    }
  };

  const handleLogLevelTestAll = () => {
    // ارسال یک لاگ از هر سطح
    loggingClient.debug('پیام تست سطح دیباگ', { source: customSource });
    loggingClient.info('پیام تست سطح اطلاعات', { source: customSource });
    loggingClient.warn('پیام تست سطح هشدار', { source: customSource });
    loggingClient.error('پیام تست سطح خطا', { source: customSource });
    
    setNotification({
      message: 'لاگ‌های تست در همه سطوح ارسال شدند',
      type: 'success'
    });
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ابزار تست سیستم لاگینگ
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              ارسال لاگ سفارشی
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>سطح لاگ</InputLabel>
                  <Select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value as any)}
                    label="سطح لاگ"
                  >
                    <MenuItem value="info">اطلاعات (info)</MenuItem>
                    <MenuItem value="warn">هشدار (warn)</MenuItem>
                    <MenuItem value="error">خطا (error)</MenuItem>
                    <MenuItem value="debug">دیباگ (debug)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="منبع سفارشی"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="log-tester"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="پیام لاگ"
                  value={logMessage}
                  onChange={(e) => setLogMessage(e.target.value)}
                  margin="normal"
                  placeholder="پیام مورد نظر خود را وارد کنید..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="متادیتا (JSON)"
                  value={metadataStr}
                  onChange={(e) => setMetadataStr(e.target.value)}
                  margin="normal"
                  multiline
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleLogSubmit}
                size="large"
              >
                ارسال لاگ
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              لاگ‌های اخیر
            </Typography>
            
            {lastLogs.length > 0 ? (
              <Stack spacing={1}>
                {lastLogs.map((log, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={log.level} 
                        size="small"
                        color={
                          log.level === 'error' ? 'error' :
                          log.level === 'warn' ? 'warning' :
                          log.level === 'info' ? 'info' : 'default'
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{log.message}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                هنوز هیچ لاگی ثبت نشده است.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              آزمایش‌های سریع
            </Typography>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Speed />}
                onClick={handlePerformanceTest}
              >
                تست عملکرد
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<Error />}
                onClick={handleErrorGeneration}
              >
                ایجاد خطای عمدی
              </Button>
              
              <Button
                variant="outlined"
                color="warning"
                size="large"
                startIcon={<StackedLineChart />}
                onClick={handleLogLevelTestAll}
              >
                تست همه سطوح لاگ
              </Button>
            </Stack>
          </Paper>
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            پیش‌تنظیم‌های لاگ
          </Typography>
          
          <Stack spacing={2}>
            {logActions.map((action, index) => (
              <Card key={index} sx={{ cursor: 'pointer' }} onClick={() => handleActionClick(action)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {action.icon}
                    <Typography variant="subtitle1">{action.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>

      <Snackbar 
        open={notification !== null} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert severity={notification.type} onClose={handleNotificationClose}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default LogTester;