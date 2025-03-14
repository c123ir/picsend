import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  Avatar,
  IconButton,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Badge,
} from '@mui/material';
import {
  PhotoCamera,
  Edit,
  Notifications,
  Security,
  DarkMode,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertPersianToEnglishNumbers } from '../utils/stringUtils';

// Mock data - replace with actual data from API
const userProfile = {
  id: 1,
  name: 'علی محمدی',
  email: 'ali@example.com',
  avatar: '/avatars/1.jpg',
  role: 'مدیر گروه',
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  joinDate: '۱۴۰۲/۱۰/۰۱',
  groups: ['گروه فنی', 'گروه مالی'],
  recentActivity: [
    {
      id: 1,
      action: 'ایجاد درخواست جدید',
      date: '۱۴۰۲/۱۲/۱۵ - ۱۰:۳۰',
      details: 'درخواست خرید تجهیزات',
    },
    {
      id: 2,
      action: 'تایید درخواست',
      date: '۱۴۰۲/۱۲/۱۴ - ۱۵:۴۵',
      details: 'درخواست پرداخت قبض برق',
    },
    {
      id: 3,
      action: 'عضویت در گروه',
      date: '۱۴۰۲/۱۲/۱۳ - ۰۹:۱۵',
      details: 'عضویت در گروه مالی',
    },
  ],
};

interface Settings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
  twoFactorAuth: boolean;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
  });
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: 'fa',
    twoFactorAuth: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // تبدیل اعداد فارسی به انگلیسی برای فیلد شماره تماس
    if (name === 'phone') {
      const englishNumbers = convertPersianToEnglishNumbers(value);
      setFormData(prev => ({
        ...prev,
        [name]: englishNumbers
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSettingChange = (setting: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSave = () => {
    // TODO: Implement save logic
    setEditMode(false);
    navigate('/profile');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        پروفایل کاربری
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    size="small"
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  sx={{ width: 120, height: 120 }}
                />
              </Badge>
            </Box>

            <Typography variant="h6" gutterBottom>
              {userProfile.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {userProfile.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              عضو از {userProfile.joinDate}
            </Typography>

            <Box sx={{ mt: 2 }}>
              {userProfile.groups.map((group) => (
                <Typography key={group} variant="body2">
                  {group}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="اطلاعات شخصی" />
              <Tab label="تنظیمات" />
              <Tab label="فعالیت‌های اخیر" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {currentTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                    {editMode ? (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => setEditMode(false)}
                        >
                          انصراف
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleSave}
                        >
                          ذخیره
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                      >
                        ویرایش
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="نام و نام خانوادگی"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ایمیل"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="شماره تماس"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {currentTab === 1 && (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="اعلان‌های ایمیلی"
                      secondary="دریافت اعلان‌ها از طریق ایمیل"
                    />
                    <Switch
                      edge="end"
                      checked={settings.emailNotifications}
                      onChange={() => handleSettingChange('emailNotifications')}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="اعلان‌های مرورگر"
                      secondary="دریافت اعلان‌ها در مرورگر"
                    />
                    <Switch
                      edge="end"
                      checked={settings.pushNotifications}
                      onChange={() => handleSettingChange('pushNotifications')}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <DarkMode />
                    </ListItemIcon>
                    <ListItemText
                      primary="حالت تاریک"
                      secondary="تغییر رنگ‌بندی به حالت تاریک"
                    />
                    <Switch
                      edge="end"
                      checked={settings.darkMode}
                      onChange={() => handleSettingChange('darkMode')}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="احراز هویت دو مرحله‌ای"
                      secondary="افزایش امنیت حساب کاربری"
                    />
                    <Switch
                      edge="end"
                      checked={settings.twoFactorAuth}
                      onChange={() => handleSettingChange('twoFactorAuth')}
                    />
                  </ListItem>
                </List>
              )}

              {currentTab === 2 && (
                <List>
                  {userProfile.recentActivity.map((activity, index) => (
                    <Box key={activity.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={activity.action}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {activity.details}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {activity.date}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export { ProfilePage }; 