import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Group,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data - replace with actual data from API
const groups = [
  {
    id: 1,
    name: 'گروه فنی',
    description: 'مدیریت درخواست‌های بخش فنی و تجهیزات',
    members: [
      { id: 1, name: 'علی محمدی', avatar: '/avatars/1.jpg' },
      { id: 2, name: 'رضا کریمی', avatar: '/avatars/2.jpg' },
      { id: 3, name: 'محمد احمدی', avatar: '/avatars/3.jpg' },
      { id: 4, name: 'سارا حسینی', avatar: '/avatars/4.jpg' },
    ],
    activeRequests: 5,
  },
  {
    id: 2,
    name: 'گروه اداری',
    description: 'مدیریت درخواست‌های اداری و پشتیبانی',
    members: [
      { id: 5, name: 'مریم رضایی', avatar: '/avatars/5.jpg' },
      { id: 6, name: 'حسین علوی', avatar: '/avatars/6.jpg' },
      { id: 7, name: 'زهرا کمالی', avatar: '/avatars/7.jpg' },
    ],
    activeRequests: 3,
  },
  {
    id: 3,
    name: 'گروه مالی',
    description: 'مدیریت درخواست‌های مالی و حسابداری',
    members: [
      { id: 8, name: 'امیر صادقی', avatar: '/avatars/8.jpg' },
      { id: 9, name: 'فاطمه نوری', avatar: '/avatars/9.jpg' },
      { id: 10, name: 'علی اکبری', avatar: '/avatars/10.jpg' },
      { id: 11, name: 'مینا صالحی', avatar: '/avatars/11.jpg' },
      { id: 12, name: 'رضا محمدی', avatar: '/avatars/12.jpg' },
    ],
    activeRequests: 8,
  },
];

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, groupId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroupId(groupId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGroupId(null);
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          گروه‌ها
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/groups/new')}
        >
          گروه جدید
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="جستجوی گروه..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={3}>
        {filteredGroups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Group />
                    </Avatar>
                    <Typography variant="h6">{group.name}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, group.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {group.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={`${group.activeRequests} درخواست فعال`}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  اعضا
                </Typography>
                <AvatarGroup max={4}>
                  {group.members.map((member) => (
                    <Avatar
                      key={member.id}
                      alt={member.name}
                      src={member.avatar}
                    />
                  ))}
                </AvatarGroup>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  size="small"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  مشاهده جزئیات
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/groups/${selectedGroupId}/edit`);
        }}>
          ویرایش
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          افزودن عضو
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          حذف
        </MenuItem>
      </Menu>
    </Box>
  );
};

export { GroupsPage }; 