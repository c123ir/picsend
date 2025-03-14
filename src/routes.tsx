import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
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
import { useAuth } from './contexts/AuthContext';
import { Button } from '@mui/material';
import { Phone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoggingTest from './components/LoggingTest';

const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <RouterRoutes>
      {/* مسیر تست خارج از چک احراز هویت */}
      <Route path="/test/logging" element={<LoggingTest />} />
      
      {!user ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login/phone" element={<PhoneLoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
          <Route path="/groups" element={<MainLayout><GroupsPage /></MainLayout>} />
          <Route path="/groups/new" element={<MainLayout><NewGroupPage /></MainLayout>} />
          <Route path="/groups/:id" element={<MainLayout><GroupDetailPage /></MainLayout>} />
          <Route path="/requests/new" element={<MainLayout><NewRequestPage /></MainLayout>} />
          <Route path="/requests/:id" element={<MainLayout><RequestDetailPage /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </RouterRoutes>
  );
};

export { AppRouter }; 