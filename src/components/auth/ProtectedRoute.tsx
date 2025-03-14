// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // اگر در حال بارگذاری هستیم، اسپینر نمایش داده شود
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  // اگر کاربر احراز هویت نشده است، به صفحه ورود منتقل می‌شود
  if (!isAuthenticated) {
    // ذخیره مسیر فعلی برای بازگشت پس از ورود
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // اگر کاربر احراز هویت شده باشد، محتوای اصلی نمایش داده می‌شود
  return <>{children}</>;
};