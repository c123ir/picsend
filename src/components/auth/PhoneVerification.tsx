import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SMS_CONFIG } from '../../config/sms';
import { convertPersianToEnglishNumbers } from '../../utils/stringUtils';
import { smsService } from '../../services/api/smsService';

interface PhoneVerificationProps {
  onVerified: (phone: string) => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onVerified }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

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

  const formatPhone = (input: string) => {
    const englishNumbers = convertPersianToEnglishNumbers(input);
    const numbers = englishNumbers.replace(/\D/g, '');
    
    if (numbers && !numbers.startsWith('0')) {
      return `0${numbers}`;
    }
    
    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
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
  };

  const handleSendCode = async () => {
    if (phone.length !== 11 || !phone.startsWith('09')) {
      setMessage({
        type: 'error',
        text: 'لطفاً یک شماره موبایل معتبر وارد کنید'
      });
      return;
    }

    // ابتدا به صفحه دریافت کد منتقل می‌شویم
    setMessage(null);
    setCode('');
    setIsPhoneSubmitted(true);
    setCountdown(SMS_CONFIG.verificationCodeExpireTime);
    
    // سپس کد را ارسال می‌کنیم
    try {
      const result = await smsService.sendVerificationCode(phone);

      if (result.success) {
        setIsCodeSent(true);
      } else {
        // در صورت خطا، برمی‌گردیم به صفحه قبل
        setIsPhoneSubmitted(false);
        setMessage({
          type: 'error',
          text: result.message || 'خطا در ارسال کد تایید'
        });
      }
    } catch (err) {
      // در صورت خطا، برمی‌گردیم به صفحه قبل
      setIsPhoneSubmitted(false);
      console.error('Error sending code:', err);
      setMessage({
        type: 'error',
        text: 'خطا در ارسال کد تایید'
      });
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

    setMessage(null);

    try {
      const result = await smsService.verifyCode(phone, code);

      if (result.isValid) {
        setMessage({
          type: 'success',
          text: 'با موفقیت وارد شدید'
        });
        
        // لاگین کردن کاربر
        await login({
          phone,
          token: result.token
        });
        
        // انتقال به صفحه داشبورد
        setTimeout(() => {
          onVerified(phone);
          navigate('/dashboard');
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'کد وارد شده صحیح نیست'
        });
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setMessage({
        type: 'error',
        text: 'خطا در تایید کد'
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
      <Typography variant="h6" align="center" gutterBottom>
        تایید شماره موبایل
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
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
            sx={{ mb: 2 }}
            autoFocus
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={phone.length !== 11}
          >
            ارسال کد تایید
          </Button>
        </Box>
      ) : (
        <Box>
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
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              disabled={countdown > 0}
              onClick={() => {
                setCode('');
                handleSendCode();
              }}
            >
              ارسال مجدد
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}; 