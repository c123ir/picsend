import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Link, Alert } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { PhoneVerification } from '../components/auth/PhoneVerification';
import { useAuth } from '../contexts/AuthContext';

export const PhoneLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleVerified = async (phone: string) => {
    try {
      // در حالت واقعی، اینجا باید با بک‌اند ارتباط برقرار شود
      // و اطلاعات کاربر دریافت شود
      await login('test@example.com', 'password');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ورود به سیستم');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" align="center" gutterBottom>
            ورود به پیکسند
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <PhoneVerification onVerified={handleVerified} />

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              روش‌های دیگر ورود:
            </Typography>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ display: 'inline-block', mt: 1 }}
            >
              ورود با ایمیل و رمز عبور
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 