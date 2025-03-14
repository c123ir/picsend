// src/App.tsx
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './routes';
import { createAppTheme } from './lib/theme/index';
import { cacheRtl } from './lib/theme/rtl';
import './lib/theme/styles.css';
import { useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useEffect } from 'react';
import { loggingClient } from './utils/loggingClient';

const ThemedApp = () => {
  const { isDarkMode } = useTheme();
  const theme = createAppTheme(isDarkMode);

  return (
    <CacheProvider value={cacheRtl}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </MuiThemeProvider>
    </CacheProvider>
  );
};

const App = () => {
  // لاگ کردن زمان بارگذاری اولیه برنامه
  useEffect(() => {
    const loadTime = performance.now();
    loggingClient.info('برنامه بارگذاری شد', { loadTime: `${loadTime.toFixed(2)}ms` });
    
    // افزودن متد برای استفاده از loggingClient در خطاهای عمومی
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      loggingClient.error('خطای عمومی در برنامه', {
        message,
        source,
        lineno,
        colno,
        error: error?.stack || error?.toString()
      });
      
      // فراخوانی handler قبلی در صورت وجود
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    // متد برای خطاهای promise
    window.addEventListener('unhandledrejection', (event) => {
      loggingClient.error('خطای promise مدیریت نشده', {
        reason: event.reason?.stack || event.reason?.toString() || 'خطای ناشناخته'
      });
    });
    
    // پاکسازی
    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;