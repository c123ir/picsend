import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Notifications,
  Security,
  Language,
  DarkMode,
  Storage,
  CloudUpload,
  Delete,
  Backup,
} from '@mui/icons-material';
import { useState } from 'react';

type SettingKey = 'emailNotifications' | 'pushNotifications' | 'darkMode' | 'language' | 'autoBackup' | 'twoFactorAuth' | 'maxUploadSize' | 'storageLimit';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: 'fa',
    autoBackup: true,
    twoFactorAuth: false,
    maxUploadSize: '50',
    storageLimit: '1000',
  });
  const [openDialog, setOpenDialog] = useState(false);

  const handleSettingChange = (setting: SettingKey) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSelectChange = (setting: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleClearData = () => {
    setOpenDialog(false);
    // TODO: Implement clear data logic
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        تنظیمات
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                تنظیمات عمومی
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Language />
                </ListItemIcon>
                <ListItemText
                  primary="زبان"
                  secondary="انتخاب زبان نمایش برنامه"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSelectChange('language', e.target.value)}
                    >
                      <MenuItem value="fa">فارسی</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
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
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.darkMode}
                    onChange={() => handleSettingChange('darkMode')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Backup />
                </ListItemIcon>
                <ListItemText
                  primary="پشتیبان‌گیری خودکار"
                  secondary="پشتیبان‌گیری خودکار از اطلاعات"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.autoBackup}
                    onChange={() => handleSettingChange('autoBackup')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 3,
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                اعلان‌ها
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="اعلان‌های ایمیلی"
                  secondary="دریافت اعلان‌ها از طریق ایمیل"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.emailNotifications}
                    onChange={() => handleSettingChange('emailNotifications')}
                  />
                </ListItemSecondaryAction>
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
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.pushNotifications}
                    onChange={() => handleSettingChange('pushNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                امنیت و حریم خصوصی
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="احراز هویت دو مرحله‌ای"
                  secondary="افزایش امنیت حساب کاربری"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.twoFactorAuth}
                    onChange={() => handleSettingChange('twoFactorAuth')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 3,
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                فضای ذخیره‌سازی
              </Typography>
            </Box>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CloudUpload />
                </ListItemIcon>
                <ListItemText
                  primary="حداکثر حجم آپلود"
                  secondary="حداکثر حجم مجاز برای هر فایل (مگابایت)"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.maxUploadSize}
                      onChange={(e) => handleSelectChange('maxUploadSize', e.target.value)}
                    >
                      <MenuItem value="10">۱۰ مگابایت</MenuItem>
                      <MenuItem value="50">۵۰ مگابایت</MenuItem>
                      <MenuItem value="100">۱۰۰ مگابایت</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Storage />
                </ListItemIcon>
                <ListItemText
                  primary="محدودیت فضای ذخیره‌سازی"
                  secondary="حداکثر فضای ذخیره‌سازی (مگابایت)"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.storageLimit}
                      onChange={(e) => handleSelectChange('storageLimit', e.target.value)}
                    >
                      <MenuItem value="500">۵۰۰ مگابایت</MenuItem>
                      <MenuItem value="1000">۱ گیگابایت</MenuItem>
                      <MenuItem value="5000">۵ گیگابایت</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mt: 3,
              p: 3,
            }}
          >
            <Typography variant="h6" gutterBottom color="error">
              حذف اطلاعات
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              با این کار تمام اطلاعات شما از سیستم حذف خواهد شد. این عملیات غیرقابل بازگشت است.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setOpenDialog(true)}
            >
              حذف تمام اطلاعات
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          آیا از حذف تمام اطلاعات مطمئن هستید؟
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            این عملیات غیرقابل بازگشت است و تمام اطلاعات شما از سیستم حذف خواهد شد.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            انصراف
          </Button>
          <Button onClick={handleClearData} color="error">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { SettingsPage }; 