import { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Drawer,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Home,
  Group,
  Description,
  Person,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const DRAWER_WIDTH = 280;
const BOTTOM_NAV_HEIGHT = 56;

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const bottomNavItems = [
    { text: 'خانه', icon: <Home />, path: '/' },
    { text: 'گروه‌ها', icon: <Group />, path: '/groups' },
    { text: 'درخواست‌ها', icon: <Description />, path: '/requests' },
    { text: 'پروفایل', icon: <Person />, path: '/profile' },
  ];

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile, location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* سایدبار */}
      <Box
        component="nav"
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
      >
        {/* سایدبار موبایل */}
        {isMobile && (
          <Drawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
              },
            }}
          >
            <Sidebar />
          </Drawer>
        )}
        {/* سایدبار دسکتاپ */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      </Box>

      {/* محتوای اصلی */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${1}px` },
        }}
      >
        {/* هدر */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { md: `${DRAWER_WIDTH}px` },
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Header onMenuClick={handleDrawerToggle} showMenuButton={isMobile} />
        </AppBar>

        {/* محتوا */}
        <Box
          sx={{
            p: 3,
            mt: { xs: 7, sm: 8, md: 9 },
            mb: { xs: `${BOTTOM_NAV_HEIGHT}px`, md: 0 },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* منوی پایین در موبایل */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
          elevation={3}
        >
          <BottomNavigation
            value={location.pathname}
            onChange={(_, newValue) => handleNavigation(newValue)}
            showLabels
            sx={{ height: BOTTOM_NAV_HEIGHT }}
          >
            {bottomNavItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.text}
                icon={item.icon}
                value={item.path}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}; 