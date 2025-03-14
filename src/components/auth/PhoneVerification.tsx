// src/components/auth/PhoneVerification.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { convertPersianToEnglishNumbers } from '../../utils/stringUtils';
import { smsService } from '../../services/api/smsService';
import { loggingClient } from '../../utils/loggingClient';

interface PhoneVerificationProps {
  onVerified: (phone: string, token: string) => void;
  onCancel?: () => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onVerified, onCancel }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // رفرنس برای فیلد ورود کد
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // اتوماتیک چک کردن کد وقتی 4 رقم وارد شد
  useEffect(() => {
    if (code.length === 4 && isCodeSent) {
      handleVerifyCode();
    }
  }, [code]);

  const formatPhone = (input: string): string => {
    // تبدیل اعداد فارسی به انگلیسی
    const englishNumbers = convertPersianToEnglishNumbers(input);
    // حذف همه کاراکترهای غیر عددی
    const numbers = englishNumbers.replace(/\D/g, '');
    
    // اضافه کردن صفر در ابتدا اگر نباشد
    if (numbers && !numbers.startsWith('0')) {
      return `0${numbers}`;
    }
    
    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    
    // پاک کردن پیام خطا هنگام تایپ
    if (message && message.type === 'error') {
      setMessage(null);
    }
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && phone.length === 11) {
      e.preventDefault();
      handleSendCode();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = convertPersianToEnglishNumbers(e.target.value);
    setCode(value.replace(/\D/g, '').slice(0, 4));
    
    // پاک کردن پیام خطا هنگام تایپ
    if (message && message.type === 'error') {
      setMessage(null);
    }
  };

  const handleSendCode = async () => {
    // بررسی صحت فرمت شماره تلفن
    if (phone.length !== 11 || !phone.startsWith('09')) {
      setMessage({
        type: 'error',
        text: 'لطفاً یک شماره موبایل معتبر وارد کنید'
      });
      return;
    }

    setLoading(true);
    
    try {
      loggingClient.info('درخواست ارسال کد تایید', { phone });
      
      const result = await smsService.sendVerificationCode(phone);

      if (result.success) {
        // نمایش کد در کنسول در محیط توسعه
        if (import.meta.env.DEV && result.code) {
          console.log(`کد تایید: ${result.code}`);
        }
        
        setMessage({
          type: 'success',
          text: 'کد تایید با موفقیت ارسال شد'
        });
        
        setIsPhoneSubmitted(true);
        setIsCodeSent(true);
        setCountdown(120); // زمان انقضای کد
        
        // تمرکز روی فیلد کد
        setTimeout(() => {
          if (codeInputRef.current) {
            codeInputRef.current.focus();
          }
        }, 100);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'خطا در ارسال کد تایید'
        });
      }
    } catch (err) {
      loggingClient.error('خطا در ارسال کد تایید', { error: err });
      
      setMessage({
        type: 'error',
        text: 'خطای سیستمی. لطفاً دوباره تلاش کنید'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 4) {
      setMessage({
        type: 'error',
        text: 'کد تایید باید ۴ رقم باشد'
      });
      return;
    }

    setLoading(true);
    
    try {
      loggingClient.info('تلاش برای تایید کد', { phone });
      
      const result = await smsService.verifyCode(phone, code);

      if (result.isValid && result.token) {
        loggingClient.info('تایید کد موفق', { phone });
        
        setMessage({
          type: 'success',
          text: 'با موفقیت وارد شدید'
        });
        
        // فراخوانی تابع callback
        onVerified(phone, result.token);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'کد وارد شده صحیح نیست'
        });
        
        // پاک کردن فیلد کد
        setCode('');
        
        // تمرکز مجدد روی فیلد کد
        if (codeInputRef.current) {
          codeInputRef.current.focus();
        }
      }
    } catch (err) {
      loggingClient.error('خطا در تایید کد', { error: err });
      
      setMessage({
        type: 'error',
        text: 'خطای سیستمی. لطفاً دوباره تلاش کنید'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhoneInput = () => {
    setIsPhoneSubmitted(false);
    setIsCodeSent(false);
    setCode('');
    setMessage(null);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
        ورود با شماره موبایل
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {!isPhoneSubmitted ? (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSendCode(); }}>
          <TextField
            fullWidth
            label="شماره موبایل"
            value={phone}
            onChange={handlePhoneChange}
            onKeyPress={handlePhoneKeyPress}
            placeholder="09xxxxxxxxx"
            inputProps={{ maxLength: 11, dir: 'ltr' }}
            sx={{ mb: 3 }}
            autoFocus
            disabled={loading}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                disabled={loading}
                onClick={handleCancel}
              >
                بازگشت
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={phone.length !== 11 || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'ارسال کد تایید'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
            کد تایید به شماره {phone} ارسال شد
          </Typography>
          
          <TextField
            fullWidth
            label="کد تایید"
            value={code}
            onChange={handleCodeChange}
            placeholder="کد ۴ رقمی"
            inputProps={{ maxLength: 4, dir: 'ltr' }}
            InputProps={{
              endAdornment: countdown > 0 && (
                <InputAdornment position="end">
                  <Typography variant="caption" color="textSecondary">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </Typography>
                </InputAdornment>
              )
            }}
            sx={{ mb: 3 }}
            autoFocus
            inputRef={codeInputRef}
            disabled={loading}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleBackToPhoneInput}
                disabled={loading}
              >
                تغییر شماره
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleVerifyCode}
                disabled={code.length !== 4 || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'تایید کد'}
              </Button>
            </Grid>
          </Grid>
          
          {countdown <= 0 && (
            <Button
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleSendCode}
              disabled={loading}
            >
              ارسال مجدد کد
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};