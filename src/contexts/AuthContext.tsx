// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../models/User';
import { userService } from '../services/api/userService';
import { loggingClient } from '../utils/loggingClient';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  loginWithPhone: (phone: string, token: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          // برای لاگ کردن زمان بارگذاری کاربر
          const startTime = performance.now();
          
          const userData = await userService.findById(userId);
          
          setState(prev => ({
            ...prev,
            user: userData,
            isAuthenticated: true,
            isLoading: false
          }));
          
          const loadTime = performance.now() - startTime;
          loggingClient.info('کاربر با موفقیت بارگذاری شد', { 
            userId, 
            loadTime: `${loadTime.toFixed(2)}ms` 
          });
          
          // به روز رسانی زمان آخرین ورود
          await userService.updateLastLogin(userId);
        } catch (error) {
          loggingClient.error('خطا در بارگذاری اطلاعات کاربر', { 
            userId, 
            error 
          });
          
          // پاک کردن داده‌های ذخیره شده در صورت خطا
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'خطا در بارگیری اطلاعات کاربر. لطفاً دوباره وارد شوید.'
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    initAuth();
  }, []);

  // ورود با نام کاربری و رمز عبور
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      loggingClient.info('تلاش برای ورود با نام کاربری و رمز عبور', { username });
      
      // در حالت واقعی، این باید درخواست به سرور ارسال کند
      // به عنوان یک مثال ساده برای تست:
      const mockUser: User = {
        id: 'user-123',
        phone: '',
        email: username,
        fullName: 'کاربر آزمایشی',
        isActive: true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
      
      const mockToken = btoa(`${username}-${Date.now()}`);
      
      // ذخیره در localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('userId', mockUser.id);
      
      setState(prev => ({
        ...prev,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false
      }));
      
      loggingClient.info('ورود با موفقیت انجام شد', { username });
      return true;
    } catch (error) {
      let errorMessage = 'خطا در ورود به سیستم';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      loggingClient.error('خطا در ورود با نام کاربری و رمز عبور', { 
        username, 
        error 
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return false;
    }
  };

  // ورود با شماره موبایل و کد تایید
  const loginWithPhone = async (phone: string, token: string): Promise<boolean> => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));
      
      loggingClient.info('تلاش برای ورود با شماره موبایل', { phone });
      
      // بررسی وجود کاربر با شماره موبایل
      let userData: User | null = null;
      
      try {
        userData = await userService.findByPhone(phone);
      } catch (error) {
        loggingClient.info('کاربر با شماره موبایل یافت نشد، ایجاد کاربر جدید', { phone });
      }
      
      // اگر کاربر وجود نداشت، ایجاد کاربر جدید
      if (!userData) {
        userData = await userService.create({
          phone,
          role: 'user'
        });
      }
      
      // ذخیره در localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userData.id);
      
      // به روز رسانی زمان آخرین ورود
      await userService.updateLastLogin(userData.id);
      
      setState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false
      }));
      
      loggingClient.info('ورود با شماره موبایل با موفقیت انجام شد', { phone });
      return true;
    } catch (error) {
      let errorMessage = 'خطا در ورود به سیستم';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      loggingClient.error('خطا در ورود با شماره موبایل', { 
        phone, 
        error 
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return false;
    }
  };

  // خروج از سیستم
  const logout = () => {
    loggingClient.info('کاربر از سیستم خارج شد', { 
      userId: state.user?.id 
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  // به روز رسانی اطلاعات کاربر
  const updateUser = async (data: Partial<User>) => {
    if (!state.user) {
      setState(prev => ({
        ...prev,
        error: 'کاربر وارد نشده است'
      }));
      return;
    }

    try {
      const updatedUser = await userService.update(state.user.id, data);
      
      setState(prev => ({
        ...prev,
        user: updatedUser
      }));
      
      loggingClient.info('اطلاعات کاربر با موفقیت به‌روزرسانی شد', { 
        userId: state.user.id 
      });
    } catch (error) {
      loggingClient.error('خطا در به‌روزرسانی اطلاعات کاربر', { 
        userId: state.user.id, 
        error 
      });
      
      setState(prev => ({
        ...prev,
        error: 'خطا در به‌روزرسانی اطلاعات کاربر'
      }));
    }
  };

  // پاک کردن پیام خطا
  const clearError = () => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  };

  const value = {
    ...state,
    login,
    loginWithPhone,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};