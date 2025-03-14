// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { loggingClient } from '../../utils/loggingClient';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // وقتی خطایی رخ می‌دهد، وضعیت به‌روزرسانی می‌شود
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // لاگ کردن خطا
    loggingClient.error('خطای رندر در برنامه', {
      error: error.toString(),
      component: errorInfo.componentStack
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // اگر fallback تعریف شده باشد، آن را نمایش می‌دهیم
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI پیش‌فرض برای نمایش خطا
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              متأسفانه خطایی رخ داده است
            </Typography>
            
            <Typography variant="body1" sx={{ my: 2 }}>
              برنامه با مشکلی مواجه شده است. لطفاً صفحه را بارگذاری مجدد کنید یا دوباره تلاش کنید.
            </Typography>
            
            {this.state.error && import.meta.env.DEV && (
              <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={this.handleReset}
              >
                تلاش مجدد
              </Button>
              
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()}
              >
                بارگذاری مجدد صفحه
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;