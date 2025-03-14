import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  PersonAdd,
  MoreVert,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Request {
  id: number;
  title: string;
  amount: string;
  status: RequestStatus;
  requester: string;
  date: string;
}

type RequestStatus = 'در انتظار تایید' | 'تایید شده' | 'در حال بررسی' | 'رد شده';

const statusColors: Record<RequestStatus, 'warning' | 'success' | 'info' | 'error'> = {
  'در انتظار تایید': 'warning',
  'تایید شده': 'success',
  'در حال بررسی': 'info',
  'رد شده': 'error',
} as const;

// Mock data - replace with actual data from API
const groupDetail = {
  id: 1,
  name: 'گروه فنی',
  description: 'مدیریت درخواست‌های بخش فنی و تجهیزات',
  createdAt: '۱۴۰۲/۱۰/۰۱',
  members: [
    { id: 1, name: 'علی محمدی', role: 'مدیر گروه', avatar: '/avatars/1.jpg', email: 'ali@example.com' },
    { id: 2, name: 'رضا کریمی', role: 'کارشناس فنی', avatar: '/avatars/2.jpg', email: 'reza@example.com' },
    { id: 3, name: 'محمد احمدی', role: 'کارشناس فنی', avatar: '/avatars/3.jpg', email: 'mohammad@example.com' },
    { id: 4, name: 'سارا حسینی', role: 'کارشناس فنی', avatar: '/avatars/4.jpg', email: 'sara@example.com' },
  ],
  recentRequests: [
    {
      id: 1,
      title: 'درخواست خرید تجهیزات',
      amount: '۱۲,۵۰۰,۰۰۰',
      status: 'در انتظار تایید' as RequestStatus,
      requester: 'علی محمدی',
      date: '۱۴۰۲/۱۲/۱۵',
    },
    {
      id: 2,
      title: 'تعمیر دستگاه تست',
      amount: '۳,۸۰۰,۰۰۰',
      status: 'تایید شده' as RequestStatus,
      requester: 'رضا کریمی',
      date: '۱۴۰۲/۱۲/۱۴',
    },
    {
      id: 3,
      title: 'خرید قطعات یدکی',
      amount: '۵,۲۰۰,۰۰۰',
      status: 'در حال بررسی' as RequestStatus,
      requester: 'محمد احمدی',
      date: '۱۴۰۲/۱۲/۱۳',
    },
  ],
  stats: {
    totalRequests: 45,
    activeRequests: 5,
    completedRequests: 35,
    rejectedRequests: 5,
  },
};

const GroupDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton onClick={() => navigate('/groups')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {groupDetail.name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">اطلاعات گروه</Typography>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                size="small"
                onClick={() => navigate(`/groups/${id}/edit`)}
              >
                ویرایش
              </Button>
            </Box>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {groupDetail.description}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              تاریخ ایجاد: {groupDetail.createdAt}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              آمار درخواست‌ها
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4">{groupDetail.stats.activeRequests}</Typography>
                  <Typography variant="body2">درخواست فعال</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h4">{groupDetail.stats.completedRequests}</Typography>
                  <Typography variant="body2">تکمیل شده</Typography>
                </Paper>
              </Grid>
            </Grid>
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
              <Tab label="اعضا" />
              <Tab label="درخواست‌های اخیر" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {currentTab === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      startIcon={<PersonAdd />}
                      onClick={() => navigate(`/groups/${id}/members/add`)}
                    >
                      افزودن عضو
                    </Button>
                  </Box>
                  <List>
                    {groupDetail.members.map((member, index) => (
                      <Box key={member.id}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={member.avatar} alt={member.name} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {member.email}
                                </Typography>
                                <Chip
                                  label={member.role}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end">
                              <MoreVert />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </>
              )}

              {currentTab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>عنوان</TableCell>
                        <TableCell>مبلغ (ریال)</TableCell>
                        <TableCell>درخواست‌کننده</TableCell>
                        <TableCell>تاریخ</TableCell>
                        <TableCell>وضعیت</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupDetail.recentRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          hover
                          onClick={() => navigate(`/requests/${request.id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{request.title}</TableCell>
                          <TableCell>{request.amount}</TableCell>
                          <TableCell>{request.requester}</TableCell>
                          <TableCell>{request.date}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.status}
                              color={statusColors[request.status]}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export { GroupDetailPage }; 