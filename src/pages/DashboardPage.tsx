import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  AccessTime,
  CheckCircle,
  Error,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

type StatColor = 'primary' | 'warning' | 'success' | 'error';

// Mock data - replace with actual data from API
const stats = [
  {
    title: 'درخواست‌های فعال',
    value: '12',
    icon: <TrendingUp />,
    color: 'primary' as StatColor,
  },
  {
    title: 'در انتظار تایید',
    value: '5',
    icon: <AccessTime />,
    color: 'warning' as StatColor,
  },
  {
    title: 'تکمیل شده',
    value: '28',
    icon: <CheckCircle />,
    color: 'success' as StatColor,
  },
  {
    title: 'رد شده',
    value: '3',
    icon: <Error />,
    color: 'error' as StatColor,
  },
];

const recentRequests = [
  {
    id: 1,
    title: 'درخواست خرید تجهیزات',
    amount: '۱۲,۵۰۰,۰۰۰',
    status: 'در انتظار تایید',
    date: '۱۴۰۲/۱۲/۱۵',
  },
  {
    id: 2,
    title: 'پرداخت قبض برق',
    amount: '۸۵۰,۰۰۰',
    status: 'تایید شده',
    date: '۱۴۰۲/۱۲/۱۴',
  },
  {
    id: 3,
    title: 'هزینه‌های جاری',
    amount: '۲,۳۰۰,۰۰۰',
    status: 'در حال بررسی',
    date: '۱۴۰۲/۱۲/۱۳',
  },
];

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          داشبورد
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/requests/new')}
        >
          درخواست جدید
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '50%',
                    bgcolor: (theme) => alpha(theme.palette[stat.color].main, 0.15),
                    color: (theme) => theme.palette[stat.color].main,
                    mr: 2,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h6">{stat.value}</Typography>
              </Box>
              <Typography color="text.secondary">{stat.title}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              درخواست‌های اخیر
            </Typography>
            <List>
              {recentRequests.map((request, index) => (
                <Box key={request.id}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  <ListItem
                    sx={{ px: 0 }}
                    secondaryAction={
                      <Typography variant="body2" color="text.secondary">
                        {request.date}
                      </Typography>
                    }
                  >
                    <ListItemText
                      primary={request.title}
                      secondary={`مبلغ: ${request.amount} ریال`}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.info.main,
                        bgcolor: `${theme.palette.info.main}15`,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        mx: 2,
                      }}
                    >
                      {request.status}
                    </Typography>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              وضعیت کلی
            </Typography>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  پیشرفت درخواست‌ها
                </Typography>
                <Typography variant="body2" color="text.primary">
                  ۷۵٪
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  تکمیل مدارک
                </Typography>
                <Typography variant="body2" color="text.primary">
                  ۹۰٪
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={90} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export { DashboardPage }; 