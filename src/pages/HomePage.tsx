import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Security,
  Speed,
  FileCopy,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <CloudUpload />,
    title: 'آپلود سریع و آسان',
    description: 'فایل‌های خود را به راحتی و با سرعت بالا آپلود کنید',
  },
  {
    icon: <Security />,
    title: 'امنیت پیشرفته',
    description: 'از امنیت فایل‌های خود با رمزنگاری پیشرفته مطمئن شوید',
  },
  {
    icon: <Speed />,
    title: 'سرعت دانلود بالا',
    description: 'از سرعت بالای دانلود با سرورهای اختصاصی بهره‌مند شوید',
  },
  {
    icon: <FileCopy />,
    title: 'مدیریت فایل‌ها',
    description: 'فایل‌های خود را به صورت حرفه‌ای مدیریت کنید',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            پیک‌سند
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" color="primary" onClick={() => navigate('/login')}>
              ورود
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
              ثبت‌نام
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            مدیریت درخواست‌های مالی
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
          >
            سیستم جامع مدیریت درخواست‌های مالی با امکان آپلود و مدیریت فایل‌ها
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ minWidth: 200 }}
            >
              شروع رایگان
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/about')}
              sx={{ minWidth: 200 }}
            >
              اطلاعات بیشتر
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4} sx={{ mb: { xs: 6, md: 10 } }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  bgcolor: 'transparent',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: `${theme.palette.primary.main}15`,
                    borderRadius: '50%',
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" sx={{ flexGrow: 1 }}>
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export { HomePage }; 