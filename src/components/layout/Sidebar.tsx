import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchValue, setSearchValue] = useState('');

  const mainMenuItems = [
    {
      text: 'داشبورد',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'گروه‌ها',
      icon: <GroupIcon />,
      path: '/groups',
    },
    {
      text: 'طرف‌های حساب',
      icon: <AccountBalanceIcon />,
      path: '/parties',
    },
    {
      text: 'درخواست‌ها',
      icon: <ReceiptIcon />,
      path: '/requests',
    },
  ];

  const mockGroups = [
    { id: '1', name: 'گروه مالی', color: '#1976d2' },
    { id: '2', name: 'حسابداری', color: '#2e7d32' },
    { id: '3', name: 'خزانه‌داری', color: '#ed6c02' },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src="/logo.svg"
            alt="پیک‌سند"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            پیک‌سند
          </Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="جستجو..."
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '& fieldset': {
                border: 'none',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <List sx={{ px: 1 }}>
          {mainMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ px: 2, mb: 1, fontWeight: 500 }}
        >
          گروه‌های من
        </Typography>

        <List sx={{ px: 1 }}>
          {mockGroups.map((group) => (
            <ListItem key={group.id} disablePadding>
              <ListItemButton
                onClick={() => navigate(`/groups/${group.id}`)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: alpha(group.color, 0.08),
                  },
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(group.color, 0.12),
                      color: group.color,
                      fontSize: '0.875rem',
                    }}
                  >
                    {group.name.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={group.name}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <Tooltip title="ایجاد درخواست جدید">
          <ListItemButton
            sx={{
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
            onClick={() => navigate('/requests/new')}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <AddIcon />
            </ListItemIcon>
            <ListItemText
              primary="درخواست جدید"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );
}; 