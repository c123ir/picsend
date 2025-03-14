import {
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export const Header = ({ onMenuClick, showMenuButton }: HeaderProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const { isDarkMode, toggleTheme } = useAppTheme();

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    // TODO: اضافه کردن منطق خروج
    handleClose();
  };

  return (
    <Toolbar
      sx={{
        minHeight: { xs: 56, sm: 64 },
        px: { xs: 2, sm: 3, md: 4 },
        gap: 2,
      }}
    >
      {showMenuButton && (
        <IconButton
          color="inherit"
          aria-label="باز کردن منو"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {!showMenuButton && (
          <DashboardIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        )}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            display: { xs: isMobile ? 'none' : 'block', sm: 'block' },
            fontWeight: 600,
          }}
        >
          پیک‌سند
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="اعلان‌ها">
          <IconButton
            color="inherit"
            onClick={handleNotificationClick}
            sx={{
              bgcolor: notificationAnchor ? 'action.selected' : 'transparent',
            }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="پروفایل">
          <IconButton
            onClick={handleProfileClick}
            sx={{
              bgcolor: anchorEl ? 'action.selected' : 'transparent',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
              }}
            >
              <PersonIcon />
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              width: 200,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <PersonIcon sx={{ ml: 1.5, fontSize: 20 }} />
          پروفایل
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <SettingsIcon sx={{ ml: 1.5, fontSize: 20 }} />
          تنظیمات
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ ml: 1.5, fontSize: 20 }} />
          خروج
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              width: 320,
              maxHeight: 400,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => navigate('/notifications')}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
            مشاهده همه اعلان‌ها
          </Typography>
        </MenuItem>
        <Divider />
        {/* TODO: اضافه کردن لیست اعلان‌ها */}
      </Menu>
    </Toolbar>
  );
}; 