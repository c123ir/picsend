import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../models/User';
import { userService } from '../services/api/userService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, token: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          const userData = await userService.findById(userId);
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (phone: string, token: string) => {
    try {
      // بررسی وجود کاربر
      let userData = await userService.findByPhone(phone);
      
      // اگر کاربر وجود نداشت، ایجاد کاربر جدید
      if (!userData) {
        userData = await userService.create({
          phone,
          role: 'user'
        });
      }

      // بروزرسانی زمان آخرین ورود
      await userService.updateLastLogin(userData.id);
      
      // ذخیره اطلاعات در localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userData.id);
      
      setUser(userData);
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await userService.update(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 