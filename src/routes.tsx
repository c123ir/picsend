// src/routes.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { NewGroupPage } from './pages/NewGroupPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PhoneLoginPage } from './pages/PhoneLoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RequestsPage } from './pages/RequestsPage';
import LoggingTest from './components/LoggingTest';
import LogTester from './components/LogTester';
import { useAuth } from './contexts/AuthContext';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const AppRouter: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const { isAuthenticated } = useAuth();

  // مدیریت ریدایرکت پس از ورود موفق
  const redirectAfterLogin = () => {
    // اگر کاربر از صفحه دیگری به صفحه ورود منتقل شده باشد، بعد از ورود به همان صفحه برمی‌گردد
    const destination = state?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  };

  return (
    <Routes>
      {/* صفحات عمومی */}
      <Route path="/" element={<HomePage />} />
      
      {/* صفحات مربوط به ورود و ثبت‌نام */}
      <Route 
        path="/login" 
        element={isAuthenticated ? redirectAfterLogin() : <LoginPage />} 
      />
      <Route 
        path="/login/phone" 
        element={isAuthenticated ? redirectAfterLogin() : <PhoneLoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? redirectAfterLogin() : <RegisterPage />} 
      />

      {/* مسیرهای تست - دسترسی عمومی */}
      <Route path="/test/logging" element={<LoggingTest />} />
      <Route path="/test/log-tester" element={<LogTester />} />
      
      {/* صفحاتی که نیاز به احراز هویت دارند */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/groups" element={
        <ProtectedRoute>
          <MainLayout>
            <GroupsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/groups/new" element={
        <ProtectedRoute>
          <MainLayout>
            <NewGroupPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/groups/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <GroupDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/requests" element={
        <ProtectedRoute>
          <MainLayout>
            <RequestsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/requests/new" element={
        <ProtectedRoute>
          <MainLayout>
            <NewRequestPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/requests/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <RequestDetailPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <ProfilePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* مسیر پیش‌فرض برای آدرس‌های ناشناخته */}
      <Route path="*" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
};