import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Backup as BackupIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Folder as FolderIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loggingClient } from '../../utils/loggingClient';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const adminTools = [
    {
      title: 'مدیریت کاربران',
      description: 'افزودن، ویرایش و مدیریت دسترسی‌های کاربران',
      icon: <PeopleIcon fontSize="large" color="primary" />,
      path: '/admin/users',
      action: 'admin_navigate_users'
    },
    {
      title: 'تنظیمات سیستم',
      description: 'پیکربندی و تنظیمات پیشرفته سیستم',
      icon: <SettingsIcon fontSize="large" color="primary" />,
      path: '/admin/settings',
      action: 'admin_navigate_settings'
    },
    {
      title: 'گزارش‌ها',
      description: 'مشاهده گزارش‌های سیستم و آمار',
      icon: <DashboardIcon fontSize="large" color="primary" />,
      path: '/admin/reports',
      action: 'admin_navigate_reports'
    },
    {
      title: 'پشتیبان‌گیری',
      description: 'مدیریت پشتیبان‌گیری و بازیابی اطلاعات',
      icon: <BackupIcon fontSize="large" color="primary" />,
      path: '/admin/backup',
      action: 'admin_navigate_backup'
    }
  ];

  const handleNavigate = (path: string, action: string) => {
    loggingClient.info('ناوبری به بخش مدیریتی', {
      path,
      userId: user?.id,
      action
    });
    navigate(path);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        داشبورد مدیریت
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          به پنل مدیریت پیک‌سند خوش آمدید. از اینجا می‌توانید تمام جنبه‌های برنامه را مدیریت کنید.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {adminTools.map((tool) => (
          <Grid item xs={12} sm={6} md={3} key={tool.title}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 2 }}>{tool.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {tool.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tool.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth 
                  onClick={() => handleNavigate(tool.path, tool.action)}
                >
                  ورود به بخش
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            راهنمای سریع مدیریتی
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="مدیریت کاربران" 
                    secondary="افزودن کاربر جدید، مدیریت دسترسی‌ها و تغییر نقش‌ها" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="مدیریت گروه‌ها" 
                    secondary="ایجاد و مدیریت گروه‌های کاربری برای اشتراک‌گذاری محتوا" 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon><CloudUploadIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="مدیریت فایل‌ها" 
                    secondary="مشاهده و مدیریت تمام فایل‌های آپلود شده در سیستم" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="گزارش امنیتی" 
                    secondary="مشاهده گزارش‌های امنیتی و رویدادهای مهم سیستم" 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}; 