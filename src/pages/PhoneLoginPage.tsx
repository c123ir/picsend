// src/pages/PhoneLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Alert, 
  Link, 
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { PhoneVerification } from '../components/auth/PhoneVerification';
import { useAuth } from '../contexts/AuthContext';
import { loggingClient } from '../utils/loggingClient';

export const PhoneLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, loginWithPhone, error, clearError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // اگر کاربر قبلاً وارد شده است، به داشبورد منتقل شود
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // پاک کردن خطاها هنگام بارگذاری صفحه
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  const handleVerified = async (phone: string, token: string) => {
    setLoading(true);
    setLocalError(null);
    
    try {
      const startTime = performance.now();
      
      const success = await loginWithPhone(phone, token);
      
      loggingClient.logPerformance('phone_login', performance.now() - startTime);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setLocalError('خطا در ورود به سیستم. لطفاً دوباره تلاش کنید.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ورود به سیستم';
      loggingClient.error('خطا در فرآیند ورود با تلفن', { error: err });
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // نمایش اسپینر در حال بارگذاری
  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh' 
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8, 
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          fontWeight="bold"
          color="primary"
          sx={{ mb: 3 }}
        >
          پیک‌سند
        </Typography>
        
        {(localError || error) && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {localError || error}
          </Alert>
        )}
        
        <PhoneVerification 
          onVerified={handleVerified} 
          onCancel={() => navigate('/login')}
        />

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            روش‌های دیگر ورود:
          </Typography>
          <Link
            component={RouterLink}
            to="/login"
            variant="body2"
            sx={{ display: 'inline-block' }}
          >
            ورود با ایمیل و رمز عبور
          </Link>
        </Box>
      </Box>
    </Container>
  );
};