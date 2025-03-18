import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import { loggingClient } from '../../utils/loggingClient';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // اگر در حال بارگذاری هستیم، هیچ چیزی نمایش ندهید
  if (isLoading) {
    return null;
  }

  // اگر کاربر احراز هویت نشده است، به صفحه ورود منتقل می‌شود
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // بررسی دسترسی مدیر
  if (user?.role !== 'admin') {
    loggingClient.warn('تلاش برای دسترسی به صفحه مدیریتی', {
      userId: user?.id,
      role: user?.role,
      action: 'admin_access_denied'
    });
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" color="error">
          دسترسی ممنوع
        </Typography>
        <Typography variant="body1">
          شما مجوز دسترسی به این صفحه را ندارید. این صفحه فقط برای مدیران سیستم قابل دسترسی است.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '/dashboard'}
        >
          بازگشت به داشبورد
        </Button>
      </Box>
    );
  }

  // اگر کاربر مدیر باشد، محتوای اصلی نمایش داده می‌شود
  loggingClient.info('دسترسی مدیر به صفحه مدیریتی', {
    userId: user.id,
    action: 'admin_access_granted'
  });
  
  return <>{children}</>;
}; 