// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Visibility, VisibilityOff, Phone, Login } from '@mui/icons-material';
import { loggingClient } from '../utils/loggingClient';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // پاک کردن خطا هنگام تایپ
    if (localError) {
      setLocalError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setLocalError('لطفاً ایمیل و رمز عبور را وارد کنید');
      return false;
    }

    // بررسی ساده فرمت ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('لطفاً یک ایمیل معتبر وارد کنید');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const startTime = performance.now();
      
      const success = await login(formData.email, formData.password);
      
      loggingClient.logPerformance('email_login', performance.now() - startTime);
      
      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ورود به سیستم';
      loggingClient.error('خطا در فرآیند ورود با ایمیل', { error: err });
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'demo123'
    });
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
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          align="center"
          fontWeight="bold"
          color="primary"
          sx={{ mb: 4 }}
        >
          پیک‌سند
        </Typography>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            fontWeight="medium"
          >
            ورود به حساب کاربری
          </Typography>

          {(localError || error) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {localError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="آدرس ایمیل"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="رمز عبور"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={<Login />}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'ورود به حساب'}
            </Button>

            <Divider sx={{ my: 3 }}>یا</Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login/phone')}
              startIcon={<Phone />}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              ورود با شماره موبایل
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleDemoLogin}
              sx={{ mb: 2 }}
              disabled={loading}
            >
              ورود با حساب نمایشی
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                sx={{
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                حساب کاربری ندارید؟ ثبت‌نام کنید
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export { LoginPage };